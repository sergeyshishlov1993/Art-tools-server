'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('import_sources', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            supplier_prefix: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            supplier_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            source_type: {
                type: Sequelize.ENUM('url', 'file'),
                allowNull: false
            },
            source_url: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            source_filename: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            last_import_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            last_import_stats: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        console.log('✅ Таблиця import_sources створена');
    },

    async down(queryInterface) {
        await queryInterface.dropTable('import_sources');
    }
};
