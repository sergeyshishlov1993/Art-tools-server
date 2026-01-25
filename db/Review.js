const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Review",
    {
      review_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4, // Автоматична генерація UUID версії 4
      },

      product_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },

      user_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      comment: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      rating: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
    },
    {
      timestamps: true,
      tableName: "Reviews",
    }
  );
};
