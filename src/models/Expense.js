const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
    return sequelize.define(
        "Expense",
        {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                validate: {
                    isIn: [['delivery', 'advertising', 'other']]
                }
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
        },
        {
            timestamps: true,
            tableName: "Expenses",
            indexes: [
                { fields: ['date'] },
                { fields: ['type'] },
            ]
        }
    );
};