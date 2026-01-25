"use strict";

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      process.env.MAIN_ADMIN_PASSWORD,
      saltRounds
    );

    await queryInterface.bulkInsert("admin", [
      {
        id: uuidv4(),
        name: process.env.MAIN_ADMIN_NAME,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("admin", null, {});
  },
};
