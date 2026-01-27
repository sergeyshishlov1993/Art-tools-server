const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
    sequelize.define(
        "Category",
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            category_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "category",
            timestamps: false,
        }
    );