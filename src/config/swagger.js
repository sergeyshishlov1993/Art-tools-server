const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ART-TOOLS API',
            version: '2.0.0',
            description: 'API документація для інтернет-магазину ART-TOOLS',
            contact: { name: 'API Support' }
        },
        servers: [
            { url: 'http://localhost:8000', description: 'Development server' }
        ],
        tags: [
            { name: 'Health', description: 'Стан сервера' },
            { name: 'Home', description: 'Головна сторінка' },
            { name: 'Products', description: 'Товари (публічні)' },
            { name: 'Filters', description: 'Фільтри (публічні)' },
            { name: 'Orders', description: 'Замовлення' },
            { name: 'Feedback', description: "Зворотній зв'язок" },
            { name: 'Slider', description: 'Слайдер' },
            { name: 'Nova Poshta', description: 'Нова Пошта' },
            { name: 'Admin Auth', description: 'Авторизація адміна' },
            { name: 'Admin Products', description: 'Управління товарами' },
            { name: 'Admin Categories', description: 'Управління категоріями' },
            { name: 'Admin Import', description: 'Імпорт та мапінги' },
            { name: 'Admin Filters', description: 'Фільтри (адмін)' },
            { name: 'Admin Reviews', description: 'Відгуки (адмін)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        }
    },
    apis: ['./src/docs/*.js']
};

module.exports = swaggerJsdoc(options);