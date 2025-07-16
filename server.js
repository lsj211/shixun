require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// 缓存机制：保存和获取已生成的内容
const CACHE_FILE = path.join(__dirname, 'content_cache.json');

async function saveToCache(key, data) {
    try {
        let cache = {};
        try {
            const fileContent = await fs.readFile(CACHE_FILE, 'utf8');
            cache = JSON.parse(fileContent);
        } catch (err) {
            // 文件可能不存在，使用空对象
        }
        
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
        
        // 检查缓存是否存在且未过期（24小时）
        if (cache[key] && (Date.now() - cache[key].timestamp < 24 * 60 * 60 * 1000)) {
            return cache[key].data;
        }
        return null;
    } catch (err) {
        return null;
    }
}

// 流式代理API到Python后端
function streamProxyToPython(req, res, endpoint) {
    const pythonUrl = `${PYTHON_API_URL}${endpoint}`;
    
    // 设置响应头以支持流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 创建请求到Python后端
    axios({
        method: 'post',
        url: pythonUrl,
        data: req.body,
        responseType: 'stream'
    })
    .then(response => {
        // 直接转发流
        response.data.pipe(res);
        
        // 处理错误
        response.data.on('error', error => {
            console.error(`流处理错误 (${endpoint}):`, error);
            if (!res.headersSent) {
                res.status(500).json({ error: '流处理错误' });
            }
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

// 为故事背景生成内容的端点
app.post('/api/generate-background', (req, res) => {
    streamProxyToPython(req, res, '/api/generate-background');
});

// 为角色生成内容的端点
app.post('/api/generate-characters', async (req, res) => {
    try {
        const { background, complexity, characterCount } = req.body;
        
        // 创建缓存键
        const cacheKey = `characters_${background.substring(0, 50)}_${complexity}_${characterCount}`;
        
        // 检查缓存
        const cachedContent = await getFromCache(cacheKey);
        if (cachedContent) {
            return res.json({ characters: cachedContent });
        }
        
        // 如果没有缓存，尝试调用Python API
        try {
            // 请求Python后端
            const pythonResponse = await axios.post(`${PYTHON_API_URL}/api/generate-characters`, req.body);
            
            // 检查响应
            if (pythonResponse.data && pythonResponse.data.characters) {
                // 缓存响应
                await saveToCache(cacheKey, pythonResponse.data.characters);
                // 返回数据
                return res.json({ characters: pythonResponse.data.characters });
            } else {
                throw new Error("Python API返回了无效的角色数据");
            }
        } catch (apiError) {
            console.error("调用Python API失败:", apiError.message);
            
            // 创建默认角色作为备用方案
            const defaultCharacters = [
                {
                    name: "主角",
                    description: "这是故事的主角。你可以在这里添加更多关于这个角色的描述，如性格特点、背景故事等。"
                },
                {
                    name: "配角",
                    description: "这是故事的配角。这个角色将与主角互动，并在故事中发挥重要作用。"
                },
                {
                    name: "反派",
                    description: "这是故事的反派角色。一个好的反派能够为故事增添张力和冲突。"
                }
            ];
            
            // 缓存默认角色
            await saveToCache(cacheKey, defaultCharacters);
            
            // 返回默认角色
            return res.json({ characters: defaultCharacters });
        }
    } catch (error) {
        console.error('角色生成失败:', error);
        res.status(500).json({ error: error.message || '角色生成失败' });
    }
});

// 为故事节点生成内容的端点
app.post('/api/generate-story-node', (req, res) => {
    streamProxyToPython(req, res, '/api/generate-story-node');
});

// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        // 检查Python后端是否在线
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

// 启动服务器
app.listen(PORT, () => {
    console.log(`Node.js 中间层服务器运行在 http://localhost:${PORT}`);
    console.log(`将请求代理到 Python 后端: ${PYTHON_API_URL}`);
    console.log(`确保你已经在.env文件中配置了PYTHON_API_URL环境变量`);
});