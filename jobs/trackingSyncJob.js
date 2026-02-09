const cron = require('node-cron');
const { Op } = require('sequelize');
const { Order } = require('../src/db');
const NovaPoshtaService = require('../src/services/novaPoshtaService');

function startTrackingSyncJob() {
    cron.schedule('0 */3 * * *', async () => {

        try {
            const orders = await Order.findAll({
                where: {
                    status: { [Op.in]: ['processing', 'shipped'] },
                    ttn: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.ne]: '' }
                        ]
                    }
                }
            });

            if (orders.length === 0) {
                return;
            }


            const ttnList = [...new Set(orders.map(o => o.ttn).filter(Boolean))];
            const trackingResults = await NovaPoshtaService.getMultipleTrackingInfo(ttnList);

            const trackingMap = new Map();
            trackingResults.forEach(t => trackingMap.set(t.Number, t));

            let updated = 0;

            for (const order of orders) {
                const tracking = trackingMap.get(order.ttn);
                if (!tracking) continue;

                const newStatus = NovaPoshtaService.mapNovaPoshtaStatus(tracking.StatusCode);

                if (newStatus && newStatus !== order.status) {
                    await order.update({
                        status: newStatus,
                        np_status: tracking.Status,
                        np_status_code: tracking.StatusCode,
                        np_last_sync: new Date()
                    });
                    updated++;
                    console.log(`  📦 ${order.order_number}: ${order.status} → ${newStatus}`);
                } else {
                    await order.update({
                        np_status: tracking.Status,
                        np_status_code: tracking.StatusCode,
                        np_last_sync: new Date()
                    });
                }
            }

        } catch (error) {
            console.error('❌ [Cron] Sync error:', error.message);
        }
    });

}

module.exports = { startTrackingSyncJob };
