const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "OrderItems",
    {
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Orders",
          key: "order_id",
        },
      },
      order_name: { type: Sequelize.STRING },
      count: { type: Sequelize.INTEGER },
      product_id: { type: Sequelize.STRING },
      product_img: { type: Sequelize.STRING },
      price: { type: Sequelize.DECIMAL },
      discount: { type: Sequelize.DECIMAL },
      discounted_product: { type: Sequelize.BOOLEAN },
    },
    {
      timestamps: true,
      tableName: "OrderItems",
    }
  );
};
