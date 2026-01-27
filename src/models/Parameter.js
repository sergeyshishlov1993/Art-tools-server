const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
    return sequelize.define("Parameter", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
                model: 'products',
                key: 'product_id'
            }
        },
        parameter_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        slug: {
            type: Sequelize.STRING(255),
            allowNull: true,
        },
        parameter_value: {
            type: Sequelize.STRING(255),
            allowNull: true,
        },
        param_value_slug: {
            type: Sequelize.STRING(255),
            allowNull: true,
        }
    }, {
        tableName: "parameter",
        timestamps: true,
        indexes: [
            { fields: ['product_id'] },
            { fields: ['slug'] },
            { fields: ['param_value_slug'] }
        ]
    });
};
