const express = require('express');
const router = express.Router();
const sequelize = require('../server/db');
const { DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2794840873',
    database: 'blogdb'
});
const SqlUser = sequelize.define('SqlUser', {
    username: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        unique: true, // 确保邮箱地址唯一
        allowNull: false // 不允许为空
    }

});
sequelize.sync();//创建对应的表
// 登录路由，尝试从 SQL 数据库验证
router.post('/sqlLogin', async (req, res) => {
    const { username, password } = req.body;
    try {
        // 从 SQL 数据库中查找用户
        const user = await SqlUser.findOne({ where: { username, password } });
        const [rows] = await pool.execute('SELECT * FROM sqlusers WHERE username = ?', [username]);
        req.session.userId = rows[0].id; // 假设表中有 id 字段;
        req.session.username = rows[0].username;
        req.session.isLoggedIn = true;  // 标记用户已登录
        if (user) {
            // 生成 JWT
            const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });
            req.session.user = { username: req.body.username, loggedIn: true };
            const a = req.session.user;
            const b = req.session.isLoggedIn;
            console.log('b',req.session);
            res.json({ success: true, message: 'SQL 数据库登录成功', token, a,username: req.body.username, id: user.id,b });
        } else {
            res.json({ success: false, message: 'SQL 数据库用户名或密码错误' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'SQL 数据库错误' });
    }
});
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    // 基本验证：检查字段是否为空
    if (!username || !password || !email) {
        return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    // 验证邮箱格式
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }
    try {
        // 检查用户名是否已存在
        const existingUser = await SqlUser.findOne({ where: { username } });
        console.log(existingUser);
        if (existingUser) {
            return res.status(400).json({ success: false, message: '该用户名已被使用，请选择其他用户名' });
        }
        const existingEmailUser = await SqlUser.findOne({ where: { email } });
        console.log(existingEmailUser);
        if (existingEmailUser) {
            return res.status(400).json({ success: false, message: '该邮箱已被注册，请使用其他邮箱' });
        }
        await SqlUser.create({ username, password, email });
        // 将用户信息插入数据库
        res.json({ success: true, message: '注册成功' });
    } catch (error) {
        console.error('注册过程中出现数据库错误:', error);
        res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
    }
});
router.get('/getBlogs', async (req, res) => {
    try {
        const [row1] = await pool.execute('SELECT username, blogs FROM sqlusers;');
        row1.forEach(item => {
            const username = item.username;
            if (item.blogs) { // 检查 blogs 是否为 null 或 undefined
                item.blogs.forEach(blog => {
                    blog.username = username; // 添加属性
                });
            }
            delete item.username; // 删除原对象的 username
        });
        let allBlogs1 = [];
        row1.forEach(row => {
            const blogsArray = row.blogs;
            if (Array.isArray(blogsArray)) {
                allBlogs1 = allBlogs1.concat(blogsArray);
            }
        });
        allBlogs1.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        res.json(allBlogs1);
    } catch (error) {
        console.error('查询数据库出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 处理获取用户博客的接口
router.get('/personBlogs/:username', async (req, res) => {
    const [row1] = await pool.execute('SELECT username, blogs FROM sqlusers WHERE username =?;', [req.params.username]);
    row1.forEach(item => {
        const username = item.username;
        if (Array.isArray(item.blogs)) {
            item.blogs.forEach(blog => {
                blog.username = username;
            });
        }
        delete item.username;
    });
    let allBlogs1 = [];
    row1.forEach(row => {
        const blogsArray = row.blogs;
        if (Array.isArray(blogsArray)) {
            allBlogs1 = allBlogs1.concat(blogsArray);
        }
    })
    let a = [];
    if (!allBlogs1[0]) {
        return res.json({ a });
    }
    a = allBlogs1.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);//.字体是根据对象的字段
    });
    res.json({ a });
});
router.post('/submitBlogs/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const { title, content } = req.body;
        const newArticle = {
            title,
            content,
            date: new Date() // 将日期转换为 ISO 字符串格式
        };
        let a = JSON.stringify(newArticle);
        let b = [JSON.stringify(a)];

        let c = b;

        let d = c.map(item => item.replace(/\\/g, ''));

        const originalArray = d;
        const processedArray = originalArray.map(item => {
            item = item.trim().slice(1, -1);
            // 去掉转义字符
            return item.replace(/\\/g, '');
        });
        const jsonArrayString = `[ ${processedArray.join(', ')} ]`;
        const finalString = `'${jsonArrayString}'`;
        const newString = `${finalString.trim().replace(/\s*(\[|\])\s*/g, '$1')}`;
        const e = newString.slice(1, -1);
        const [rows] = await pool.execute(
            `UPDATE sqlUsers
        SET blogs = IF(
            blogs IS NULL,
            ?,
            JSON_MERGE_PRESERVE(blogs, ?)
        )
        WHERE username = ?`,
            [e, e, username]
        );
        if (rows.affectedRows === 0) {
            throw new Error('未找到对应的用户或更新失败');
        }
        // 返回成功响应
        res.status(200).json({ message: '文章提交成功', article: newArticle });
    } catch (error) {
        console.error('数据库操作出错:', error);
        res.status(500).json({ message: '文章提交失败，请稍后重试' });
    }
}),


    module.exports = router;
