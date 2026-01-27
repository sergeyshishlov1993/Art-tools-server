const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Feedback",
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      phone: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Нове",
      },
    },
    {
      timestamps: true,
      tableName: "Feedback",
    }
  );
};
