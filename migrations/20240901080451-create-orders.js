'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Orders'
            );
        `).then(([results]) => results[0].exists);

        if (!tableExists) {
            await queryInterface.createTable('Orders', {
                order_id: {
                    type: Sequelize.UUID,
                    primaryKey: true,
                    defaultValue: Sequelize.UUIDV4,
                    allowNull: false
                },
                order_number: {
                    type: Sequelize.STRING(20),
                    unique: true,
                    allowNull: true
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                second_name: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                phone: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                payment_method: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                city: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                postal_office: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                courier_delivery_address: {
                    type: Sequelize.STRING(500),
                    allowNull: true
                },
                total_price: {
                    type: Sequelize.DECIMAL(10, 2),
                    defaultValue: 0
                },
                status: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    defaultValue: 'new'
                },

                ttn: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    comment: 'Номер ТТН Нової Пошти'
                },
                np_status: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: 'Текстовий статус від Нової Пошти'
                },
                np_status_code: {
                    type: Sequelize.STRING(10),
                    allowNull: true,
                    comment: 'Код статусу від Нової Пошти'
                },
                np_last_sync: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: 'Час останньої синхронізації з НП'
                },

                source: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    defaultValue: 'direct'
                },
                utm_source: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                utm_medium: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                utm_campaign: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                order_type: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    defaultValue: 'cart'
                },
                comment: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                qwery: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            });

            await queryInterface.addIndex('Orders', ['order_number']);
            await queryInterface.addIndex('Orders', ['status']);
            await queryInterface.addIndex('Orders', ['source']);
            await queryInterface.addIndex('Orders', ['ttn']);
            await queryInterface.addIndex('Orders', ['status', 'ttn']);
            await queryInterface.addIndex('Orders', ['createdAt']);

            console.log('✅ Table Orders created with all fields');
        } else {
            console.log('📝 Table Orders exists, checking columns...');

            const columns = await queryInterface.describeTable('Orders');

            const columnsToAdd = {
                order_number: { type: Sequelize.STRING(20), unique: true, allowNull: true },
                source: { type: Sequelize.STRING(50), allowNull: true, defaultValue: 'direct' },
                utm_source: { type: Sequelize.STRING(100), allowNull: true },
                utm_medium: { type: Sequelize.STRING(100), allowNull: true },
                utm_campaign: { type: Sequelize.STRING(255), allowNull: true },
                order_type: { type: Sequelize.STRING(50), allowNull: true, defaultValue: 'cart' },
                comment: { type: Sequelize.TEXT, allowNull: true },
                ttn: { type: Sequelize.STRING(20), allowNull: true },
                np_status: { type: Sequelize.STRING(255), allowNull: true },
                np_status_code: { type: Sequelize.STRING(10), allowNull: true },
                np_last_sync: { type: Sequelize.DATE, allowNull: true }
            };

            for (const [columnName, columnDef] of Object.entries(columnsToAdd)) {
                if (!columns[columnName]) {
                    try {
                        await queryInterface.addColumn('Orders', columnName, columnDef);
                        console.log(`  ✅ Added column: ${columnName}`);
                    } catch (err) {
                        console.log(`  ⚠️ Column ${columnName} might already exist:`, err.message);
                    }
                }
            }

            const indexesToAdd = [
                { fields: ['ttn'], name: 'orders_ttn' },
                { fields: ['status', 'ttn'], name: 'orders_status_ttn' }
            ];

            for (const idx of indexesToAdd) {
                try {
                    await queryInterface.addIndex('Orders', idx.fields, { name: idx.name });
                    console.log(`  ✅ Added index: ${idx.name}`);
                } catch (err) {
                }
            }

            console.log('✅ Columns check complete');
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Orders');
    }
};
