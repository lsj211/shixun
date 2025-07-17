require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'shixun',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 缓存机制
const CACHE_FILE = path.join(__dirname, 'content_cache.json');
async function saveToCache(key, data) {
    try {
        let cache = {};
        try {
            const fileContent = await fs.readFile(CACHE_FILE, 'utf8');
            cache = JSON.parse(fileContent);
        } catch (err) {}
        cache[key] = {
            data,
            timestamp: Date.now()
        };
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (err) {
        console.error('缓存写入失败:', err);
    }
}
async function getFromCache(key) {
    try {
        const fileContent = await fs.readFile(CACHE_FILE, 'utf8');
        const cache = JSON.parse(fileContent);
        if (cache[key] && (Date.now() - cache[key].timestamp < 24 * 60 * 60 * 1000)) {
            return cache[key].data;
        }
        return null;
    } catch (err) {
        return null;
    }
}

// 代理到Python后端（流式）
function streamProxyToPython(req, res, endpoint) {
    const pythonUrl = `${PYTHON_API_URL}${endpoint}`;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    axios({
        method: 'post',
        url: pythonUrl,
        data: req.body,
        responseType: 'stream'
    })
    .then(response => {
        response.data.pipe(res);
        response.data.on('error', error => {
            console.error(`流处理错误 (${endpoint}):`, error);
            if (!res.headersSent) res.status(500).end();
            res.end();
        });
    })
    .catch(error => {
        console.error(`请求Python后端失败 (${endpoint}):`, error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: `服务器错误: ${error.message}` });
        }
        res.end();
    });
}

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            return res.status(400).json({ message: '用户名已存在' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ message: '认证失败' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: '认证失败' });
        }
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            '123', // 生产环境请用更安全的密钥
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// JWT鉴权中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: '未提供令牌' });
    }
    jwt.verify(token, '123', (err, user) => {
        if (err) {
            return res.status(403).json({ message: '无效令牌' });
        }
        req.user = user;
        next();
    });
}

// 受保护接口示例
app.get('/api/protected', authenticateToken, async (req, res) => {
    res.json({ message: '受保护的资源', user: req.user });
});

// 内容生成相关接口
app.post('/api/generate-background', (req, res) => {
    const { background, complexity, chapterCount, generateComplete } = req.body;
    const cacheKey = `background_${background.substring(0, 50)}_${complexity}_${chapterCount}_${generateComplete ? 'complete' : 'simple'}`;
    getFromCache(cacheKey).then(cachedContent => {
        if (cachedContent) {
            if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.write(`data: ${JSON.stringify({ text: cachedContent, done: true })}\n\n`);
                res.end();
            } else {
                res.json({ background: cachedContent });
            }
        } else {
            streamProxyToPython(req, res, '/api/generate-background');
        }
    }).catch(err => {
        console.error('读取缓存失败:', err);
        streamProxyToPython(req, res, '/api/generate-background');
    });
});

app.post('/api/generate-characters', async (req, res) => {
    try {
        const { background, complexity, characterCount } = req.body;
        const cacheKey = `characters_${background.substring(0, 50)}_${complexity}_${characterCount}`;
        const cachedContent = await getFromCache(cacheKey);
        if (cachedContent) {
            return res.json({ characters: cachedContent });
        }
        try {
            const pythonResponse = await axios.post(`${PYTHON_API_URL}/api/generate-characters`, req.body);
            if (pythonResponse.data && pythonResponse.data.characters) {
                await saveToCache(cacheKey, pythonResponse.data.characters);
                return res.json({ characters: pythonResponse.data.characters });
            } else {
                return res.status(500).json({ error: 'Python后端返回数据异常' });
            }
        } catch (apiError) {
            console.error('Python后端请求失败:', apiError);
            return res.status(500).json({ error: 'Python后端请求失败' });
        }
    } catch (error) {
        console.error('角色生成失败:', error);
        res.status(500).json({ error: error.message || '角色生成失败' });
    }
});

app.post('/api/generate-story-node', (req, res) => {
    streamProxyToPython(req, res, '/api/generate-story-node');
});

// 健康检查
app.get('/health', async (req, res) => {
    try {
        const pythonHealth = await axios.get(`${PYTHON_API_URL}/`);
        res.json({
            status: 'healthy',
            node: 'online',
            python: pythonHealth.data.status === 'online' ? 'online' : 'issues',
            time: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            node: 'online',
            python: 'offline',
            error: error.message,
            time: new Date().toISOString()
        });
    }
});

// 添加故事大纲生成API代理
app.post('/api/generate-story-outline', (req, res) => {
    const { background, timeline, locations, characters, chapterCount, complexity } = req.body;
    const cacheKey = `outline_${background.substring(0, 50)}_${complexity}_${chapterCount}`;
    getFromCache(cacheKey).then(cachedContent => {
        if (cachedContent) {
            return res.json({ outline: cachedContent });
        } else {
            streamProxyToPython(req, res, '/api/generate-story-outline');
        }
    }).catch(err => {
        console.error('读取缓存失败:', err);
        streamProxyToPython(req, res, '/api/generate-story-outline');
    });
});

// 添加章节内容生成API代理
app.post('/api/generate-chapter', (req, res) => {
    const { background, timeline, locations, characters, complexity, chapterNumber, sceneNumber, outline } = req.body;
    const cacheKey = `chapter_${chapterNumber}_${sceneNumber}_${background.substring(0, 30)}_${complexity}`;
    getFromCache(cacheKey).then(cachedContent => {
        if (cachedContent) {
            return res.json(cachedContent);
        } else {
            streamProxyToPython(req, res, '/api/generate-chapter');
        }
    }).catch(err => {
        console.error('读取缓存失败:', err);
        streamProxyToPython(req, res, '/api/generate-chapter');
    });
});

// 添加增强背景生成API代理 - 在其他API代理之后添加
app.post('/api/enhance-background', (req, res) => {
    const { background, complexity, chapterCount, enhance_only } = req.body;
    const cacheKey = `enhance_${background.substring(0, 50)}_${complexity}_${chapterCount}`;
    
    getFromCache(cacheKey).then(cachedContent => {
        if (cachedContent) {
            if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
                // 流式响应
                res.setHeader('Content-Type', 'text/event-stream');
                res.write(`data: ${JSON.stringify({ text: cachedContent, done: true })}\n\n`);
                res.end();
            } else {
                // 普通响应
                res.json({ background: cachedContent });
            }
        } else {
            // 代理到Python后端
            streamProxyToPython(req, res, '/api/enhance-background');
        }
    }).catch(err => {
        console.error('读取缓存失败:', err);
        streamProxyToPython(req, res, '/api/enhance-background');
    });
});

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`将请求代理到 Python 后端: ${PYTHON_API_URL}`);
});