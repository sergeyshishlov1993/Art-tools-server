const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
    return sequelize.define("CategoryFilter", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sub_category_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        filters_data: {
            type: Sequelize.JSONB,
            allowNull: false
        }
    }, {
        tableName: "category_filters",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['sub_category_id']
            }
        ]
    });
};