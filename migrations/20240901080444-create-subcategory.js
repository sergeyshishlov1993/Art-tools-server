// "use strict";
//
// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.createTable("sub_category", {
//       sub_category_id: {
//         type: Sequelize.STRING(255),
//         primaryKey: true,
//         allowNull: false,
//       },
//       parent_id: {
//         type: Sequelize.STRING(255),
//         allowNull: true,
//       },
//       sub_category_name: {
//         type: Sequelize.STRING(255),
//         allowNull: false,
//       },
//       pictures: {
//         type: Sequelize.STRING(255),
//         allowNull: true,
//       },
//     });
//   },
//
//   async down(queryInterface, Sequelize) {
//     await queryInterface.dropTable("sub_category");
//   },
// };

"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("sub_category", {
            sub_category_id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            sub_category_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            parent_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            pictures: {
                type: Sequelize.STRING,
                allowNull: true,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("sub_category");
    },
};