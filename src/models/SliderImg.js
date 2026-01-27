const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "SliderImg",
    {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
      },

      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "Slider_img",
    }
  );
};
