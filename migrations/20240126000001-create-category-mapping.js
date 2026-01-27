
"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("category_mappings", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            supplier_prefix: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            external_category_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            internal_sub_category_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addConstraint("category_mappings", {
            fields: ["supplier_prefix", "external_category_id"],
            type: "unique",
            name: "category_mappings_unique_supplier_external",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("category_mappings");
    },
};