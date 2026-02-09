"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("OrderItems", {
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
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            order_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            count: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            product_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            product_img: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: "Акційна/фінальна ціна",
            },
            old_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: null,
                comment: "Стара ціна до знижки",
            },
            discount: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                defaultValue: 0,
            },
            discounted_product: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("OrderItems");
    },
};
