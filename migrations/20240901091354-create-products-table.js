"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable("products", {
            product_id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },

            xml_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            supplier_prefix: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            sub_category_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            is_manual_category: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            // Остальные стандартные поля:
            slug: {
                type: Sequelize.STRING(255),
                allowNull: true,
                unique: true,
            },
            product_name: {
                type: Sequelize.STRING(500),
                allowNull: false,
            },
            product_description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            sale_price: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            available: {
                type: Sequelize.STRING(50),
                defaultValue: "true",
            },
            bestseller: {
                type: Sequelize.STRING(50),
                defaultValue: "false",
            },
            sale: {
                type: Sequelize.STRING(50),
                defaultValue: "false",
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


        await queryInterface.addIndex("products", ["sub_category_id"]);
        await queryInterface.addIndex("products", ["slug"]);


        await queryInterface.addIndex('products', ['xml_id', 'supplier_prefix'], {
            unique: true,
            name: 'products_xml_supplier_unique',
            where: {
                xml_id: { [Sequelize.Op.ne]: null },
                supplier_prefix: { [Sequelize.Op.ne]: null }
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("products");
    },
};