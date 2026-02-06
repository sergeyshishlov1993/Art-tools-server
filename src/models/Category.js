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
            icon: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
        },
        {
            tableName: "category",
            timestamps: false,
        }
    );
