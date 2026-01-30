// "use strict";
//
// module.exports = {
//     up: async (queryInterface, Sequelize) => {
//
//         await queryInterface.createTable("products", {
//             product_id: {
//                 type: Sequelize.STRING(255),
//                 primaryKey: true,
//                 allowNull: false,
//             },
//
//             xml_id: {
//                 type: Sequelize.STRING(255),
//                 allowNull: true,
//             },
//             supplier_prefix: {
//                 type: Sequelize.STRING(50),
//                 allowNull: true,
//             },
//             sub_category_id: {
//                 type: Sequelize.STRING(255),
//                 allowNull: true,
//             },
//             is_manual_category: {
//                 type: Sequelize.BOOLEAN,
//                 defaultValue: false,
//                 allowNull: false,
//             },
//             // Остальные стандартные поля:
//             slug: {
//                 type: Sequelize.STRING(255),
//                 allowNull: true,
//                 unique: true,
//             },
//             product_name: {
//                 type: Sequelize.STRING(500),
//                 allowNull: false,
//             },
//             product_description: {
//                 type: Sequelize.TEXT,
//                 allowNull: true,
//             },
//             price: {
//                 type: Sequelize.DECIMAL(10, 2),
//                 defaultValue: 0,
//             },
//             sale_price: {
//                 type: Sequelize.DECIMAL(10, 2),
//                 defaultValue: 0,
//             },
//             available: {
//                 type: Sequelize.STRING(50),
//                 defaultValue: "true",
//             },
//             bestseller: {
//                 type: Sequelize.STRING(50),
//                 defaultValue: "false",
//             },
//             sale: {
//                 type: Sequelize.STRING(50),
//                 defaultValue: "false",
//             },
//             discount: {
//                 type: Sequelize.INTEGER,
//                 defaultValue: 0,
//             },
//             custom_product: {
//                 type: Sequelize.BOOLEAN,
//                 defaultValue: false,
//             },
//             brand: {
//                 type: Sequelize.STRING(255),
//                 allowNull: true,
//             },
//             createdAt: {
//                 allowNull: false,
//                 type: Sequelize.DATE,
//                 defaultValue: Sequelize.fn("now"),
//             },
//             updatedAt: {
//                 allowNull: false,
//                 type: Sequelize.DATE,
//                 defaultValue: Sequelize.fn("now"),
//             },
//         });
//
//
//         await queryInterface.addIndex("products", ["sub_category_id"]);
//         await queryInterface.addIndex("products", ["slug"]);
//
//
//         await queryInterface.addIndex('products', ['xml_id', 'supplier_prefix'], {
//             unique: true,
//             name: 'products_xml_supplier_unique',
//             where: {
//                 xml_id: { [Sequelize.Op.ne]: null },
//                 supplier_prefix: { [Sequelize.Op.ne]: null }
//             }
//         });
//     },
//
//     down: async (queryInterface, Sequelize) => {
//         await queryInterface.dropTable("products");
//     },
// };

// migrations/20240101000001-create-products.js
"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // ============================================
        // СТВОРЕННЯ ТАБЛИЦІ
        // ============================================
        await queryInterface.createTable("products", {
            // --- Ідентифікація ---
            product_id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
                comment: "Унікальний ID товару"
            },

            xml_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: "Оригінальний ID з XML"
            },

            supplier_prefix: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: "Префікс постачальника"
            },

            slug: {
                type: Sequelize.STRING(500),
                allowNull: true,
                unique: true,
                comment: "URL slug"
            },

            // --- Категоризація ---
            sub_category_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: "ID підкатегорії"
            },

            is_manual_category: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: "Захист від перезапису категорії"
            },

            // --- Основна інформація ---
            product_name: {
                type: Sequelize.STRING(500),
                allowNull: false,
                comment: "Назва товару"
            },

            product_description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Опис товару"
            },

            brand: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: "Бренд"
            },

            // --- Ціни ---
            price: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
                comment: "Поточна ціна"
            },

            sale_price: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: true,
                comment: "Стара ціна"
            },

            discount: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: "Знижка %"
            },

            // --- Статуси ---
            available: {
                type: Sequelize.STRING(50),
                defaultValue: "true",
                allowNull: false,
                comment: "Наявність"
            },

            bestseller: {
                type: Sequelize.STRING(50),
                defaultValue: "false",
                allowNull: false,
                comment: "Хіт продажів"
            },

            sale: {
                type: Sequelize.STRING(50),
                defaultValue: "false",
                allowNull: false,
                comment: "Акція"
            },

            custom_product: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: "Створено вручну"
            },

            // --- Timestamps ---
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            }
        });

        // ============================================
        // ІНДЕКСИ
        // ============================================

        // Індекс по категорії (для фільтрації)
        await queryInterface.addIndex("products", ["sub_category_id"], {
            name: "idx_products_sub_category"
        });

        // Індекс по slug (для пошуку по URL)
        await queryInterface.addIndex("products", ["slug"], {
            name: "idx_products_slug"
        });

        // Індекс по постачальнику
        await queryInterface.addIndex("products", ["supplier_prefix"], {
            name: "idx_products_supplier"
        });

        // Індекс по бренду
        await queryInterface.addIndex("products", ["brand"], {
            name: "idx_products_brand"
        });

        // Індекс по наявності
        await queryInterface.addIndex("products", ["available"], {
            name: "idx_products_available"
        });

        // Складений індекс для фільтрації
        await queryInterface.addIndex("products", ["sub_category_id", "available", "brand"], {
            name: "idx_products_filter"
        });

        // Унікальний індекс xml_id + supplier (для upsert при імпорті)
        // Тільки якщо обидва поля NOT NULL
        await queryInterface.addIndex("products", ["xml_id", "supplier_prefix"], {
            unique: true,
            name: "products_xml_supplier_unique",
            where: {
                xml_id: { [Sequelize.Op.ne]: null },
                supplier_prefix: { [Sequelize.Op.ne]: null }
            }
        });

        console.log("✅ Таблиця products створена з індексами");
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("products");
        console.log("✅ Таблиця products видалена");
    }
};
