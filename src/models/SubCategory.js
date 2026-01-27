const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
    sequelize.define(
        "SubCategory",
        {
            sub_category_id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            sub_category_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            parent_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            pictures: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "sub_category",
            timestamps: false,
        }
    );