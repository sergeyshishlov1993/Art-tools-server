const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "admin",
    {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "admin",
    }
  );
};
