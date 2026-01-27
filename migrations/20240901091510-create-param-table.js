'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('parameter', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            product_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'product_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            parameter_name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            slug: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            parameter_value: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            param_value_slug: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('parameter', ['product_id']);
        await queryInterface.addIndex('parameter', ['slug']);
        await queryInterface.addIndex('parameter', ['param_value_slug']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('parameter');
    }
};
