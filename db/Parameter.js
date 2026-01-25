const { Sequelize, DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "Parameter",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      product_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },

      parameter_name: {
        type: DataTypes.STRING(255),
      },

      parameter_value: {
        type: DataTypes.STRING(255),
      },
    },
    {
      timestamps: true,
      tableName: "param",
    }
  );
};
