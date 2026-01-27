const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
    sequelize.define(
        "CategoryMapping",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            supplier_prefix: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            external_category_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            internal_sub_category_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "category_mappings",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["supplier_prefix", "external_category_id"],
                },
            ],
        }
    );