const { Sequelize } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define(
    "ReviewResponse",
    {
      response_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      review_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Reviews",
          key: "review_id",
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

      admin_response: {
        type: Sequelize.SMALLINT(1),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      tableName: "ReviewResponses",
    }
  );
};
