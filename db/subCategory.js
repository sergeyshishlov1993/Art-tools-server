const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "SubCategory",
    {
      sub_category_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
      },

      parent_id: {
        type: Sequelize.STRING(255),
      },

      sub_category_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      pictures: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "sub_category",
    }
  );
};
