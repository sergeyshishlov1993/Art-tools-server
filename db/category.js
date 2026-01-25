const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Category",
    {
      id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
      },

      category_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: "category",
    }
  );
};
