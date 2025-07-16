const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

// 中间件
app.use(bodyParser.json());
app.use(cors());

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

app.use(express.static('public')); 
app.get('/', (req, res) => {       
    res.sendFile(__dirname + '/public/index.html');
});

// 注册接口
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 检查用户名是否存在
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 插入新用户
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

// 登录接口
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 获取用户信息
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: '认证失败' });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: '认证失败' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            '123', // 生产环境应使用更安全的密钥
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 受保护的路由
app.get('/api/protected', authenticateToken, async (req, res) => {
    res.json({ message: '受保护的资源', user: req.user });
});

// 验证令牌中间件
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







// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});   