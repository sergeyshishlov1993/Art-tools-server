const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
    return sequelize.define(
        "Order",
        {
            order_id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },

            order_number: {
                type: Sequelize.STRING(20),
                unique: true,
                allowNull: true,
            },

            name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            second_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            phone: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            // Доставка
            payment_method: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            city: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            postal_office: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            courier_delivery_address: {
                type: Sequelize.STRING(500),
                allowNull: true,
            },

            // Сума
            total_price: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },

            // Статус замовлення
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'new',
                validate: {
                    isIn: [[
                        'new',
                        'processing',
                        'shipped',
                        'delivered',
                        'completed',
                        'cancelled',
                        'refund',
                        'returned'
                    ]]
                }
            },

            ttn: {
                type: Sequelize.STRING(20),
                allowNull: true,
                comment: 'Номер ТТН Нової Пошти'
            },

            np_status: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Текстовий статус від Нової Пошти'
            },

            np_status_code: {
                type: Sequelize.STRING(10),
                allowNull: true,
                comment: 'Код статусу від Нової Пошти'
            },

            np_last_sync: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Час останньої синхронізації з НП'
            },


            source: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: 'direct',
            },

            utm_source: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            utm_medium: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            utm_campaign: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            order_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: 'cart',
            },

            comment: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            qwery: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
        },
        {
            timestamps: true,
            tableName: "Orders",
            hooks: {
                beforeCreate: async (order, options) => {
                    if (!order.order_number) {
                        order.order_number = generateOrderNumber();
                    }
                }
            },
            indexes: [
                { fields: ['order_number'] },
                { fields: ['status'] },
                { fields: ['source'] },
                { fields: ['ttn'] },
                { fields: ['status', 'ttn'] },
                { fields: ['createdAt'] }
            ]
        }
    );
};

function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${day}-${random}`;
}
