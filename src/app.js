const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const userRoutes = require('./userRoutes');
const path = require('path');
const { sequelize } = require('./server/db.js');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const OAuth = require('oauth');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // 新增密码哈希库
require('dotenv').config({ path: './server/.env' });

// 数据库连接池（使用环境变量）
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Session 配置（安全增强）
app.use(
    session({
        secret: process.env.SESSION_SECRET, // 必须从环境变量获取
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // 生产环境强制HTTPS
            sameSite: 'lax',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24小时有效期
        }
    })
);

// CORS 配置（添加生产环境域名）
const allowedOrigins = [
    'https://fengguoheng.github.io', // GitHub Pages
    'http://localhost:8080', // 本地开发
    'https://your-render-app-name.onrender.com' // 请替换为你的Render域名
];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 数据库初始化
(async () => {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        await sequelize.sync(); // 开发环境自动同步表结构（生产环境建议使用迁移工具）
        console.log('数据库同步完成');
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
})();

// 安全中间件
app.use(morgan('combined')); // 生产环境建议使用combined日志格式
app.use(helmet({
    contentSecurityPolicy: false, // 禁用默认CSP策略，如需自定义请配置
    hsts: { maxAge: 31536000 } // 1年HSTS策略
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Passport 初始化
app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth 配置（使用环境变量）
const kkgithubOAuth2 = new OAuth.OAuth2(
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_CLIENT_SECRET,
    'https://github.com',
    '/login/oauth/authorize',
    '/login/oauth/access_token',
    { requestOptions: { timeout: 10000 } }
);

// GitHub Strategy
passport.use(new GitHubStrategy({
    oauth2: kkgithubOAuth2,
    callbackURL: 'https://your-render-app-name.onrender.com/auth/github/callback', // 必须与GitHub应用配置一致
    scope: ['user:email'] // 请求用户邮箱权限
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 处理用户登录逻辑（示例：保存用户到数据库）
        const [existingUser] = await pool.execute(
            'SELECT * FROM sqlusers WHERE github_id = ?',
            [profile.id]
        );

        if (existingUser.length > 0) {
            return done(null, existingUser[0]);
        }

        // 生成随机密码并哈希
        const password = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO sqlusers (github_id, username, password, email) VALUES (?, ?, ?, ?)',
            [profile.id, profile.username, hashedPassword, profile.emails[0].value]
        );

        done(null, {
            id: result.insertId,
            username: profile.username,
            email: profile.emails[0].value
        });
    } catch (error) {
        done(error, null);
    }
}));

// 用户序列化与反序列化
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await pool.execute('SELECT * FROM sqlusers WHERE id = ?', [id]);
        done(null, users[0]);
    } catch (error) {
        done(error, null);
    }
});

// 路由处理
app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback',
    passport.authenticate('github', { 
        failureRedirect: 'https://fengguoheng.github.io/shop/#/login',
        session: true
    }),
    (req, res) => {
        // 通过HttpOnly Cookie传递用户信息
        res.cookie('userId', req.user.id, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 
        });
        res.redirect('https://fengguoheng.github.io/shop/#/third');
    }
);

app.get('/check', (req, res) => {
    res.json({
        isLoggedIn: !!req.user,
        user: req.user ? { id: req.user.id, username: req.user.username } : null
    });
});

app.use('/api', userRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('全局错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 静态文件服务（生产环境建议使用CDN）
app.use(express.static(path.join(__dirname, 'public')));

// 服务器启动（动态端口）
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});