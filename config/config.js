module.exports = {
    development: {
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "Shishlov1993",
        database: process.env.DB_NAME || "test",
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres"
    },
    production: {
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "Shishlov1993",
        database: process.env.DB_NAME || "test",
        host: process.env.DB_HOST || "postgres",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres"
    }
};