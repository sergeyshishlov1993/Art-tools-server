"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("category", {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            category_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            icon: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("category");
    },
};
