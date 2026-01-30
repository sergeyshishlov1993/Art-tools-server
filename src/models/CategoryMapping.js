const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('CategoryMapping', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        supplier_prefix: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        external_category_id: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        external_category_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        parent_category_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        internal_sub_category_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'category_mappings',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['supplier_prefix', 'external_category_id']
            }
        ]
    });
};
