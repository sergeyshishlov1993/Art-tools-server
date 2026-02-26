'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Expenses', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false,
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
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW'),
            },
        });

        await queryInterface.addIndex('Expenses', ['date']);
        await queryInterface.addIndex('Expenses', ['type']);
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('Expenses');
    },
};