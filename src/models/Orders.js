const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Order",
    {
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      name: {
        type: Sequelize.STRING(255),
      },

      second_name: {
        type: Sequelize.STRING(255),
      },

      phone: {
        type: Sequelize.STRING(255),
      },

      payment_method: {
        type: Sequelize.STRING(255),
      },

      city: {
        type: Sequelize.STRING(255),
      },

      postal_office: {
        type: Sequelize.STRING(255),
      },

      courier_delivery_address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      total_price: {
        type: Sequelize.STRING(255),
      },

      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "нове",
      },

      qwery: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    },

    {
      timestamps: true,
      tableName: "Orders",
    }
  );
};
