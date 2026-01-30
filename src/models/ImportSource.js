const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ImportSource = sequelize.define('ImportSource', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        supplier_prefix: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        supplier_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        source_type: {
            type: DataTypes.ENUM('url', 'file'),
            allowNull: false
        },
        source_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        source_filename: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        last_import_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        last_import_stats: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'import_sources',
        timestamps: true,
        underscored: true
    });

    return ImportSource;
};
