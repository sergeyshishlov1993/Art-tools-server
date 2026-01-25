const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Products",
    {
      product_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
      },

      sub_category_id: {
        type: Sequelize.STRING(255),
      },

      product_description: {
        type: Sequelize.TEXT,
      },

      product_name: {
        type: Sequelize.STRING(255),
      },

      price: {
        type: Sequelize.DECIMAL(10, 2),
      },

      available: {
        type: Sequelize.STRING(255),
      },

      bestseller: {
        type: Sequelize.STRING(255),
        defaultValue: "false",
      },

      sale: {
        type: Sequelize.STRING(255),
        defaultValue: "false",
      },

      sale_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      discount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      custom_product: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      brand: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "products",
    }
  );
};
