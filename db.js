const { Sequelize } = require('sequelize');

// 创建 Sequelize 实例，配置数据库连接池
const sequelize = new Sequelize('blogdb', 'root', '2794840873', {
    host: 'localhost',//mysql所在电脑的地址
    dialect: 'mysql',
    pool: {
        max: 5, // 连接池最大连接数
        min: 0, // 连接池最小连接数
        acquire: 30000, // 获取连接的最大等待时间（毫秒）
        idle: 10000 // 空闲连接的最大空闲时间（毫秒）
    }
});

module.exports = sequelize;