"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sub_category", {
      sub_category_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sub_category_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      pictures: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sub_category");
  },
};
