"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("category_filters", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            sub_category_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            filters_data: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("now"),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("now"),
            },
        });

        await queryInterface.addIndex("category_filters", ["sub_category_id"], {
            unique: true,
            name: "unique_sub_category_id_idx"
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("category_filters");
    },
};