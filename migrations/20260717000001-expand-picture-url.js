"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn("pictures", "pictures_name", {
            type: Sequelize.TEXT,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn("pictures", "pictures_name", {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    }
};
