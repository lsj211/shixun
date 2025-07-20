const { createHash } = require('crypto'); // 顶部导入
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
    password: '20050721',
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

// app.post('/api/generate-story-ending', async (req, res) => {
//     try {
//         // 提取请求参数（严格校验必填项）
//         const {
//             background,
//             timeline,
//             locations,
//             characters,
//             complexity,
//             chapterCount,
//             scenesPerChapter,
//             outline,
//             pathNodes,
//             currentNode,
//             currentChapter,
//             currentScene,
//             isFinalEnding
//         } = req.body;

//         // 验证核心必填字段（与Python后端约定）
//         if (!background || !timeline || !locations || !characters || !outline) {
//             return res.status(400).json({ error: '缺少背景、时间线、地点、角色或大纲等必填字段' });
//         }

//         // 生成缓存键（参考标题接口的哈希策略，确保唯一性）
//         const cacheKey = `story_ending_${createHash('md5')
//             .update(outline.substring(0, 50)) // 取大纲前50字做哈希
//             .digest('hex')}_${currentChapter}_${currentScene}`;

//         // 优先从缓存读取
//         const cachedEnding = await getFromCache(cacheKey);
//         if (cachedEnding) {
//             console.log('结局缓存命中，直接返回');
//             return res.json(cachedEnding);
//         }

//         try {
//             // 转发请求到Python后端（保持与标题接口一致的URL格式）
//             const pythonResponse = await axios.post(
//                 `${PYTHON_API_URL}/api/generate-story-ending`, 
//                 req.body // 完整转发前端请求体
//             );

//             // 严格校验Python返回格式（必须包含title和content）
//             if (!pythonResponse.data || !pythonResponse.data.title || !pythonResponse.data.content) {
//                 console.error('Python后端返回格式异常:', pythonResponse.data);
//                 return res.status(500).json({ error: 'Python后端返回数据异常，缺少标题或内容' });
//             }

//             // 构造标准结局结构（确保无选择项）
//             const storyEnding = {
//                 title: pythonResponse.data.title,
//                 content: pythonResponse.data.content,
//                 choices: [], // 结局固定无后续选择
//                 parentId: currentNode?.id || '', // 兼容currentNode.id可能不存在的情况
//                 chapter: currentChapter,
//                 scene: scenesPerChapter, // 结局作为章节最后场景
//                 isEnding: true
//             };

//             // 缓存结果（后续相同请求可直接复用）
//             await saveToCache(cacheKey, storyEnding);

//             // 返回最终响应
//             return res.json(storyEnding);

//         } catch (apiError) {
//             // 精细化处理Python后端的错误（区分网络/状态码/业务错误）
//             console.error('Python后端请求失败:', apiError.message);
//             const statusCode = apiError.response?.status || 500;
//             const errorMessage = apiError.response?.data?.error || 'Python后端处理失败';
//             return res.status(statusCode).json({ error: errorMessage });
//         }

//     } catch (error) {
//         // 捕获Node.js层异常（如缓存操作失败）
//         console.error('生成故事结局失败（Node层）:', error);
//         res.status(500).json({ error: error.message || '服务器内部错误' });
//     }
// });

// const axios = require('axios');
// const { createHash } = require('crypto');

// app.post('/api/generate-story-ending', async (req, res) => {
//     try {
//         // 提取请求参数（严格校验必填项）
//         const {
//             background,
//             timeline,
//             locations,
//             characters,
//             complexity,
//             chapterCount,
//             scenesPerChapter,
//             outline,
//             pathNodes,
//             currentNode,
//             currentChapter,
//             currentScene,
//             isFinalEnding
//         } = req.body;

//         // 验证核心必填字段（与Python后端约定）
//         if (!background || !timeline || !locations || !characters || !outline) {
//             return res.status(400).json({ error: '缺少背景、时间线、地点、角色或大纲等必填字段' });
//         }

//         // 生成缓存键（参考标题接口的哈希策略，确保唯一性）
//         const cacheKey = `story_ending_${createHash('md5')
//             .update(outline.substring(0, 50)) // 取大纲前50字做哈希
//             .digest('hex')}_${currentChapter}_${currentScene}`;

//         // 优先从缓存读取
//         const cachedEnding = await getFromCache(cacheKey);
//         if (cachedEnding) {
//             console.log('结局缓存命中，直接返回');
//             return res.json(cachedEnding);
//         }

//         // 设置流式响应头
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');
        
//         // 响应的初始数据
//         res.write('data: {"text": "生成结局中...", "done": false}\n\n');

//         try {
//             // 转发请求到Python后端（保持与标题接口一致的URL格式）
//             const pythonResponse = await axios.post(
//                 `${PYTHON_API_URL}/api/generate-story-ending`, 
//                 req.body // 完整转发前端请求体
//             );

//             // 严格校验Python返回格式（必须包含title和content）
//             if (!pythonResponse.data || !pythonResponse.data.title || !pythonResponse.data.content) {
//                 console.error('Python后端返回格式异常:', pythonResponse.data);
//                 return res.status(500).json({ error: 'Python后端返回数据异常，缺少标题或内容' });
//             }

//             // 构造标准结局结构（确保无选择项）
//             const storyEnding = {
//                 title: pythonResponse.data.title,
//                 content: pythonResponse.data.content,
//                 choices: [], // 结局固定无后续选择
//                 parentId: currentNode?.id || '', // 兼容currentNode.id可能不存在的情况
//                 chapter: currentChapter,
//                 scene: scenesPerChapter, // 结局作为章节最后场景
//                 isEnding: true
//             };

//             // 缓存结果（后续相同请求可直接复用）
//             await saveToCache(cacheKey, storyEnding);

//             // 流式输出完整内容
//             res.write(`data: ${JSON.stringify({ text: storyEnding.content, done: true })}\n\n`);
            
//             // 结束流式响应
//             res.end();

//         } catch (apiError) {
//             // 精细化处理Python后端的错误（区分网络/状态码/业务错误）
//             console.error('Python后端请求失败:', apiError.message);
//             const statusCode = apiError.response?.status || 500;
//             const errorMessage = apiError.response?.data?.error || 'Python后端处理失败';
//             return res.status(statusCode).json({ error: errorMessage });
//         }

//     } catch (error) {
//         // 捕获Node.js层异常（如缓存操作失败）
//         console.error('生成故事结局失败（Node层）:', error);
//         res.status(500).json({ error: error.message || '服务器内部错误' });
//     }
// });

// app.post('/api/generate-story-ending', async (req, res) => {
//     try {
//         // 提取请求参数
//         const {
//             background,
//             timeline,
//             locations,
//             characters,
//             complexity,
//             chapterCount,
//             scenesPerChapter,
//             outline,
//             pathNodes,
//             currentNode,
//             currentChapter,
//             currentScene,
//             isFinalEnding
//         } = req.body;

//         // 校验必填项
//         if (!background || !timeline || !locations || !characters || !outline) {
//             return res.status(400).json({ error: '缺少背景、时间线、地点、角色或大纲等必填字段' });
//         }

//         // 生成缓存键
//         const cacheKey = `story_ending_${createHash('md5')
//             .update(outline.substring(0, 50)) // 取大纲前50字做哈希
//             .digest('hex')}_${currentChapter}_${currentScene}`;

//         // 优先从缓存读取
//         const cachedEnding = await getFromCache(cacheKey);
//         if (cachedEnding) {
//             console.log('结局缓存命中，直接返回');
//             return res.json(cachedEnding);
//         }

//         // 设置流式响应头
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');
        
//         // 响应初始数据
//         res.write('data: {"text": "生成结局中...", "done": false}\n\n');

//         try {
//             // 转发请求到Python后端
//             const pythonResponse = await axios.post(
//                 `${PYTHON_API_URL}/api/generate-story-ending`, 
//                 req.body
//             );

//             const storyEnding = {
//                 title: pythonResponse.data.title,
//                 content: pythonResponse.data.content,
//                 choices: [], // 结局固定无后续选择
//                 parentId: currentNode?.id || '',
//                 chapter: currentChapter,
//                 scene: scenesPerChapter,
//                 isEnding: true
//             };

//             // 缓存结果
//             await saveToCache(cacheKey, storyEnding);

//             // 流式输出完整内容
//             res.write(`data: ${JSON.stringify({ text: storyEnding.content, done: true })}\n\n`);

//             // 结束流式响应
//             res.end();

//         } catch (apiError) {
//             console.error('Python后端请求失败:', apiError.message);
//             res.write('data: {"text": "Python后端请求失败", "done": true}\n\n');
//             res.end();
//         }

//     } catch (error) {
//         console.error('生成故事结局失败（Node层）:', error);
//         res.status(500).json({ error: error.message || '服务器内部错误' });
//     }
// });



app.post('/api/generate-story-ending', async (req, res) => {
    try {
        // 提取请求参数
        const {
            background,
            timeline,
            locations,
            characters,
            complexity,
            chapterCount,
            scenesPerChapter,
            outline,
            pathNodes,
            currentNode,
            currentChapter,
            currentScene,
            isFinalEnding
        } = req.body;

        // 校验必填项
        if (!background || !timeline || !locations || !characters || !outline || !currentNode || !currentNode.choice) {
            return res.status(400).json({ error: '缺少背景、时间线、地点、角色、大纲、当前节点或选择等必填字段' });
        }

        // 生成缓存键
        const cacheKey = `story_ending_${createHash('md5')
            .update(outline.substring(0, 50)) // 取大纲前50字做哈希
            .digest('hex')}_${currentChapter}_${currentScene}_${currentNode.choice.text || 'no-choice'}`;

        // 优先从缓存读取
        const cachedEnding = await getFromCache(cacheKey);
        if (cachedEnding) {
            console.log('结局缓存命中，直接返回');
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ text: cachedEnding.content, done: true })}\n\n`);
            res.end();
            return;
        }

        // 设置流式响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 响应初始数据
        res.write('data: {"text": "生成结局中...", "done": false}\n\n');

        try {
            // 转发请求到Python后端（假设后端支持流式响应）
            const pythonResponse = await axios.post(
                `${PYTHON_API_URL}/api/generate-story-ending`,
                req.body,
                { responseType: 'stream' } // 配置axios以处理流式响应
            );

            let fullContent = '';
            const storyEnding = {
                title: `第${currentChapter}章 结局`,
                content: '',
                choices: [], // 结局固定无后续选择
                parentId: currentNode.id || '',
                chapter: currentChapter,
                scene: scenesPerChapter,
                isEnding: true
            };

            // 处理Python后端的流式响应
            pythonResponse.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                const lines = chunkStr.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (!dataStr) continue;
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.done) {
                                storyEnding.content = fullContent;
                                storyEnding.title = data.title || storyEnding.title;
                                // 缓存结果
                                saveToCache(cacheKey, storyEnding).catch((err) =>
                                    console.error('缓存保存失败:', err)
                                );
                                // 发送最终数据
                                res.write(`data: ${JSON.stringify({ text: fullContent, done: true })}\n\n`);
                                res.end();
                            } else {
                                fullContent += data.text;
                                // 转发流式数据到客户端
                                res.write(`data: ${JSON.stringify({ text: data.text, done: false })}\n\n`);
                            }
                        } catch (e) {
                            console.warn('无法解析Python后端SSE数据:', dataStr, e);
                            fullContent += dataStr;
                            res.write(`data: ${JSON.stringify({ text: dataStr, done: false })}\n\n`);
                        }
                    }
                }
            });

            pythonResponse.data.on('error', (err) => {
                console.error('Python后端流式响应错误:', err);
                res.write('data: {"text": "Python后端流式响应错误", "done": true}\n\n');
                res.end();
            });

            pythonResponse.data.on('end', () => {
                if (!res.writableEnded) {
                    storyEnding.content = fullContent;
                    // 缓存结果
                    saveToCache(cacheKey, storyEnding).catch((err) =>
                        console.error('缓存保存失败:', err)
                    );
                    res.write(`data: ${JSON.stringify({ text: fullContent, done: true })}\n\n`);
                    res.end();
                }
            });

        } catch (apiError) {
            console.error('Python后端请求失败:', apiError.message);
            res.write('data: {"text": "Python后端请求失败", "done": true}\n\n');
            res.end();
        }

    } catch (error) {
        console.error('生成故事结局失败（Node层）:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || '服务器内部错误' });
        } else {
            res.write('data: {"text": "服务器内部错误", "done": true}\n\n');
            res.end();
        }
    }
});


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

//生成标题
app.post('/api/generate-story-title', async (req, res) => {
    try {
        // 从请求体中获取参数
        const { outline } = req.body;
        
        // 创建缓存键（使用大纲的前50个字符的哈希值）
        // const cacheKey = `title_${hashlib.md5(outline.substring(0, 50).encode()).hexdigest()}`;
        const cacheKey = `title_${createHash('md5').update(outline.substring(0, 50)).digest('hex')}`;
        
        // 检查缓存
        const cachedTitle = await getFromCache(cacheKey);
        if (cachedTitle) {
            return res.json({ title: cachedTitle });
        }
        
        // 转发请求到Python后端
        try {
            const pythonResponse = await axios.post(`${PYTHON_API_URL}/api/generate-story-title`, req.body);
            
            // 检查响应格式是否正确
            if (pythonResponse.data && pythonResponse.data.title) {
                // 保存到缓存
                await saveToCache(cacheKey, pythonResponse.data.title);
                
                // 返回成功响应
                return res.json({ title: pythonResponse.data.title });
            } else {
                console.error('Python后端返回格式异常:', pythonResponse.data);
                return res.status(500).json({ error: 'Python后端返回数据异常' });
            }
        } catch (apiError) {
            console.error('Python后端请求失败:', apiError.message);
            
            // 区分不同类型的错误
            const statusCode = apiError.response?.status || 500;
            const errorMessage = apiError.response?.data?.error || 'Python后端请求失败';
            
            return res.status(statusCode).json({ error: errorMessage });
        }
    } catch (error) {
        console.error('生成标题失败:', error);
        res.status(500).json({ error: error.message || '生成标题失败' });
    }
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

// 添加生成下一场景API代理
app.post('/api/generate-next-scene', (req, res) => {
    const { background, currentContent, selectedChoice } = req.body;
    const choiceText = selectedChoice && selectedChoice.text ? selectedChoice.text.substring(0, 20) : '';
    const cacheKey = `next_scene_${currentContent.substring(0, 30)}_${choiceText}`;
    
    // 检查缓存
    getFromCache(cacheKey).then(cachedContent => {
        if (cachedContent) {
            // 设置 SSE 头信息
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            // 发送缓存数据，模拟流式输出
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(cachedContent), done: true })}\n\n`);
            res.end();
        } else {
            // 代理到 Python 后端
            streamProxyToPython(req, res, '/api/generate-next-scene');
        }
    }).catch(err => {
        console.error('读取缓存失败:', err);
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write(`data: ${JSON.stringify({ error: '缓存读取失败', details: err.message, done: true })}\n\n`);
        res.end();
    });
});



// 新增图像生成API代理
app.post('/api/generate-image', async (req, res) => {
    try {
        const { description, style, colorTone } = req.body;

        // 验证必填字段
        if (!description) {
            return res.status(400).json({ error: '缺少场景描述字段' });
        }

        // 创建缓存键
        const cacheKey = `image_${createHash('md5')
            .update(description.substring(0, 50))
            .digest('hex')}_${style || 'realistic'}_${colorTone || 'warm'}`;

        // 检查缓存
        const cachedImage = await getFromCache(cacheKey);
        if (cachedImage) {
            console.log('图像缓存命中，直接返回');
            return res.json({ imageUrl: cachedImage });
        }

        try {
            // 转发请求到Python后端
            const pythonResponse = await axios.post(`${PYTHON_API_URL}/api/generate-image`, req.body);

            // 验证响应格式
            if (!pythonResponse.data || !pythonResponse.data.imageUrl) {
                console.error('Python后端返回格式异常:', pythonResponse.data);
                return res.status(500).json({ error: 'Python后端返回数据异常，缺少图像URL' });
            }

            // 缓存图像URL
            await saveToCache(cacheKey, pythonResponse.data.imageUrl);

            // 返回响应
            return res.json({ imageUrl: pythonResponse.data.imageUrl });

        } catch (apiError) {
            console.error('Python后端图像生成请求失败:', apiError.message);
            const statusCode = apiError.response?.status || 500;
            const errorMessage = apiError.response?.data?.error || 'Python后端图像生成失败';
            return res.status(statusCode).json({ error: errorMessage });
        }

    } catch (error) {
        console.error('生成图像失败（Node层）:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 新增角色立绘生成代理
app.post('/api/generate-character-image', async (req, res) => {
    try {
        const { name, description, style = 'realistic', colorTone = 'warm' } = req.body;
        if (!name || !description) {
            console.error('请求缺少 name 或 description 字段:', req.body);
            return res.status(400).json({ error: '缺少角色名称或描述字段' });
        }

        const cacheKey = `character_image_${createHash('md5').update(name + description.substring(0, 50)).digest('hex')}_${style}_${colorTone}`;
        const cachedImage = await getFromCache(cacheKey);
        if (cachedImage) {
            console.log('角色立绘缓存命中:', cacheKey);
            return res.json({ imageUrl: cachedImage });
        }

        const pythonResponse = await axios.post(`${PYTHON_API_URL}/api/generate-character-image`, {
            name,
            description,
            style,
            colorTone
        }, { timeout: 60000 });

        if (!pythonResponse.data || !pythonResponse.data.imageUrl) {
            console.error('Python后端返回格式异常:', pythonResponse.data);
            return res.status(500).json({ error: 'Python后端返回数据异常，缺少图像URL' });
        }

        await saveToCache(cacheKey, pythonResponse.data.imageUrl);
        console.log('角色立绘生成成功，缓存已保存:', cacheKey);
        return res.json({ imageUrl: pythonResponse.data.imageUrl });
    } catch (error) {
        console.error('生成角色立绘失败（Node层）:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: '服务器内部错误，请检查日志' });
    }
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