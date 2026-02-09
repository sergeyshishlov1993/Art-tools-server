const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order } = require('../../db');
const NovaPoshtaService = require('../../services/novaPoshtaService');

// Статуси що потребують синхронізації
const TRACKING_STATUSES = ['processing', 'shipped'];

// ================== HELPERS ==================

/**
 * Форматувати дату НП
 */
function formatNpDate(dateStr) {
    if (!dateStr) return '';
    try {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month] = datePart.split('.');
        return `${day}.${month} о ${timePart?.slice(0, 5) || ''}`;
    } catch {
        return dateStr;
    }
}

/**
 * Побудувати етапи доставки
 */
/**
 * Побудувати етапи доставки
 */
function buildTrackingStages(tracking) {
    const statusCode = String(tracking.StatusCode);

    const allStages = [
        {
            id: 'created',
            title: 'Створено',
            description: tracking.DateCreated
                ? `ТТН створено ${formatNpDate(tracking.DateCreated)}`
                : 'ТТН створено',
            icon: '📝',
            codes: ['1']
        },
        {
            id: 'sender_warehouse',
            title: 'На складі відправника',
            description: tracking.WarehouseSender || tracking.CitySender || '',
            icon: '📦',
            codes: ['5', '6']
        },
        {
            id: 'in_transit',
            title: 'В дорозі',
            description: `${tracking.CitySender || ''} → ${tracking.CityRecipient || ''}`,
            icon: '🚚',
            // 4, 41 - в дорозі
            // 12 - комплектується (теж в дорозі!)
            // 14 - передано підрядчику
            codes: ['4', '41', '12', '14']
        },
        {
            id: 'recipient_warehouse',
            title: 'На складі отримувача',
            description: tracking.WarehouseRecipient || tracking.CityRecipient || '',
            icon: '🏪',
            codes: ['7', '8']
        },
        {
            id: 'delivered',
            title: 'Отримано',
            description: tracking.RecipientDateTime
                ? `Отримано ${formatNpDate(tracking.RecipientDateTime)}`
                : 'Посилку отримано',
            icon: '✅',
            // Тільки реально отримані клієнтом
            codes: ['9', '10', '11']
        }
    ];

    // Спеціальні випадки
    const returnCodes = ['102', '103', '104', '105', '108', '109', '110'];
    const cancelledCodes = ['2'];
    const completedCodes = ['101', '106']; // Гроші переведені

    if (returnCodes.includes(statusCode)) {
        return [{
            id: 'returned',
            title: 'Повернення',
            description: tracking.Status,
            icon: '↩️',
            status: 'error',
            isActive: true
        }];
    }

    if (cancelledCodes.includes(statusCode)) {
        return [{
            id: 'cancelled',
            title: 'Скасовано',
            description: 'ТТН видалено або скасовано',
            icon: '❌',
            status: 'error',
            isActive: true
        }];
    }

    // Визначаємо поточний етап
    let currentStageIndex = -1;

    for (let i = 0; i < allStages.length; i++) {
        if (allStages[i].codes.includes(statusCode)) {
            currentStageIndex = i;
            break;
        }
    }

    // Гроші переведені = повністю завершено
    if (completedCodes.includes(statusCode)) {
        currentStageIndex = 4; // delivered
    }

    // Статус 3 - не знайдено, показуємо як щойно створено
    if (statusCode === '3') {
        currentStageIndex = 0;
    }

    // Якщо не знайшли - пробуємо визначити по тексту
    if (currentStageIndex === -1) {
        const statusLower = (tracking.Status || '').toLowerCase();

        if (statusLower.includes('отримано') || statusLower.includes('виданий') || statusLower.includes('вручен')) {
            currentStageIndex = 4;
        } else if (statusLower.includes('на складі') && (statusLower.includes('отримувач') || statusLower.includes('одержувач'))) {
            currentStageIndex = 3;
        } else if (statusLower.includes('прямує') || statusLower.includes('дорозі') || statusLower.includes('комплекту') || statusLower.includes('відправлен')) {
            currentStageIndex = 2;
        } else if (statusLower.includes('відправник') || statusLower.includes('sender')) {
            currentStageIndex = 1;
        } else {
            currentStageIndex = 0;
        }
    }

    // Встановлюємо статуси
    return allStages.map((stage, index) => ({
        ...stage,
        status: index < currentStageIndex ? 'completed'
            : index === currentStageIndex ? 'active'
                : 'pending',
        isActive: index === currentStageIndex
    }));
}


// ================== ROUTES ==================

/**
 * GET /api/admin/tracking/details/:ttn
 * Отримати детальну інформацію по ТТН з етапами
 */
router.get('/details/:ttn', async (req, res) => {
    try {
        const { ttn } = req.params;

        if (!ttn || ttn.length < 10) {
            return res.status(400).json({ message: 'Невірний формат ТТН' });
        }

        const trackingInfo = await NovaPoshtaService.getTrackingInfo(ttn);

        if (!trackingInfo) {
            return res.status(404).json({
                message: 'ТТН не знайдено',
                ttn
            });
        }

        // Формуємо етапи доставки
        const stages = buildTrackingStages(trackingInfo);

        res.json({
            message: 'Успішно',
            tracking: {
                ttn: trackingInfo.Number,
                status: trackingInfo.Status,
                statusCode: trackingInfo.StatusCode,

                // Дати
                dateCreated: trackingInfo.DateCreated,
                dateScan: trackingInfo.DateScan,
                actualDeliveryDate: trackingInfo.ActualDeliveryDate,
                scheduledDeliveryDate: trackingInfo.ScheduledDeliveryDate,

                // Відправник
                citySender: trackingInfo.CitySender,
                warehouseSender: trackingInfo.WarehouseSender,
                senderAddress: trackingInfo.SenderAddress,

                // Отримувач
                cityRecipient: trackingInfo.CityRecipient,
                warehouseRecipient: trackingInfo.WarehouseRecipient,
                recipientAddress: trackingInfo.RecipientAddress,
                recipientDateTime: trackingInfo.RecipientDateTime,

                // Інше
                documentWeight: trackingInfo.DocumentWeight,
                documentCost: trackingInfo.DocumentCost,
                announcedPrice: trackingInfo.AnnouncedPrice,
                paymentMethod: trackingInfo.PaymentMethod,
                cargoType: trackingInfo.CargoType,
                seatsAmount: trackingInfo.SeatsAmount,

                // Етапи
                stages,

                // Маппінг
                mappedStatus: NovaPoshtaService.mapNovaPoshtaStatus(trackingInfo.StatusCode),
                statusDescription: NovaPoshtaService.getStatusDescription(trackingInfo.StatusCode)
            }
        });
    } catch (error) {
        console.error('Tracking details error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * GET /api/admin/tracking/pending/list
 * Список замовлень що очікують доставку
 */
router.get('/pending/list', async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: { [Op.in]: TRACKING_STATUSES },
                ttn: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.ne]: '' }
                    ]
                }
            },
            attributes: [
                'order_id',
                'order_number',
                'ttn',
                'status',
                'np_status',
                'np_status_code',
                'np_last_sync',
                'name',
                'phone',
                'total_price',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: 'Успішно',
            count: orders.length,
            orders: orders.map(o => ({
                ...o.toJSON(),
                npStatusDescription: o.np_status_code
                    ? NovaPoshtaService.getStatusDescription(o.np_status_code)
                    : null
            }))
        });
    } catch (error) {
        console.error('Pending orders error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * GET /api/admin/tracking/:ttn
 * Отримати статус посилки по ТТН (простий)
 */
router.get('/:ttn', async (req, res) => {
    try {
        const { ttn } = req.params;

        if (!ttn || ttn.length < 10) {
            return res.status(400).json({ message: 'Невірний формат ТТН' });
        }

        const trackingInfo = await NovaPoshtaService.getTrackingInfo(ttn);

        if (!trackingInfo) {
            return res.status(404).json({
                message: 'ТТН не знайдено',
                ttn
            });
        }

        res.json({
            message: 'Успішно',
            tracking: {
                ttn: trackingInfo.Number,
                status: trackingInfo.Status,
                statusCode: trackingInfo.StatusCode,
                statusDescription: NovaPoshtaService.getStatusDescription(trackingInfo.StatusCode),
                mappedStatus: NovaPoshtaService.mapNovaPoshtaStatus(trackingInfo.StatusCode),
                actualDeliveryDate: trackingInfo.ActualDeliveryDate,
                scheduledDeliveryDate: trackingInfo.ScheduledDeliveryDate,
                recipientDateTime: trackingInfo.RecipientDateTime,
                warehouseRecipient: trackingInfo.WarehouseRecipient,
                cityRecipient: trackingInfo.CityRecipient,
                documentWeight: trackingInfo.DocumentWeight,
                documentCost: trackingInfo.DocumentCost,
                announcedPrice: trackingInfo.AnnouncedPrice
            }
        });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * POST /api/admin/tracking/sync-order/:orderId
 * Синхронізувати статус конкретного замовлення
 */
router.post('/sync-order/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                [Op.or]: [
                    { order_id: req.params.orderId },
                    { order_number: req.params.orderId }
                ]
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        if (!order.ttn) {
            return res.status(400).json({
                message: 'ТТН не вказано для цього замовлення',
                order_id: order.order_id,
                order_number: order.order_number
            });
        }

        const trackingInfo = await NovaPoshtaService.getTrackingInfo(order.ttn);

        if (!trackingInfo) {
            return res.status(404).json({
                message: 'ТТН не знайдено в системі Нової Пошти',
                ttn: order.ttn
            });
        }

        const newStatus = NovaPoshtaService.mapNovaPoshtaStatus(trackingInfo.StatusCode);
        const oldStatus = order.status;

        // Оновлюємо якщо статус змінився
        if (newStatus && newStatus !== oldStatus) {
            await order.update({
                status: newStatus,
                np_status: trackingInfo.Status,
                np_status_code: trackingInfo.StatusCode,
                np_last_sync: new Date()
            });

            return res.json({
                message: 'Статус оновлено',
                order_id: order.order_id,
                order_number: order.order_number,
                ttn: order.ttn,
                oldStatus,
                newStatus,
                npStatus: trackingInfo.Status,
                npStatusCode: trackingInfo.StatusCode,
                npStatusDescription: NovaPoshtaService.getStatusDescription(trackingInfo.StatusCode)
            });
        }

        // Оновлюємо тільки дані НП
        await order.update({
            np_status: trackingInfo.Status,
            np_status_code: trackingInfo.StatusCode,
            np_last_sync: new Date()
        });

        res.json({
            message: 'Статус не змінився',
            order_id: order.order_id,
            order_number: order.order_number,
            ttn: order.ttn,
            currentStatus: oldStatus,
            npStatus: trackingInfo.Status,
            npStatusCode: trackingInfo.StatusCode,
            npStatusDescription: NovaPoshtaService.getStatusDescription(trackingInfo.StatusCode)
        });

    } catch (error) {
        console.error('Sync order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * POST /api/admin/tracking/sync-all
 * Синхронізувати всі активні замовлення
 */
router.post('/sync-all', async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: { [Op.in]: TRACKING_STATUSES },
                ttn: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.ne]: '' }
                    ]
                }
            },
            order: [['createdAt', 'DESC']]
        });

        if (orders.length === 0) {
            return res.json({
                message: 'Немає замовлень для синхронізації',
                total: 0,
                updated: 0,
                unchanged: 0
            });
        }

        const ttnList = [...new Set(orders.map(o => o.ttn).filter(Boolean))];
        const trackingResults = await NovaPoshtaService.getMultipleTrackingInfo(ttnList);

        const trackingMap = new Map();
        trackingResults.forEach(t => {
            trackingMap.set(t.Number, t);
        });

        const results = {
            total: orders.length,
            updated: 0,
            unchanged: 0,
            notFound: 0,
            errors: 0,
            details: []
        };

        for (const order of orders) {
            try {
                const tracking = trackingMap.get(order.ttn);

                if (!tracking) {
                    results.notFound++;
                    results.details.push({
                        order_id: order.order_id,
                        order_number: order.order_number,
                        ttn: order.ttn,
                        status: 'not_found',
                        message: 'ТТН не знайдено'
                    });
                    continue;
                }

                const newStatus = NovaPoshtaService.mapNovaPoshtaStatus(tracking.StatusCode);

                if (newStatus && newStatus !== order.status) {
                    const oldStatus = order.status;

                    await order.update({
                        status: newStatus,
                        np_status: tracking.Status,
                        np_status_code: tracking.StatusCode,
                        np_last_sync: new Date()
                    });

                    results.updated++;
                    results.details.push({
                        order_id: order.order_id,
                        order_number: order.order_number,
                        ttn: order.ttn,
                        status: 'updated',
                        oldStatus,
                        newStatus,
                        npStatus: tracking.Status
                    });
                } else {
                    await order.update({
                        np_status: tracking.Status,
                        np_status_code: tracking.StatusCode,
                        np_last_sync: new Date()
                    });

                    results.unchanged++;
                }

            } catch (err) {
                results.errors++;
                results.details.push({
                    order_id: order.order_id,
                    order_number: order.order_number,
                    ttn: order.ttn,
                    status: 'error',
                    message: err.message
                });
            }
        }

        res.json({
            message: `Синхронізовано: ${results.updated} оновлено, ${results.unchanged} без змін`,
            ...results
        });

    } catch (error) {
        console.error('Sync all error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * PUT /api/admin/tracking/set-ttn/:orderId
 * Встановити ТТН для замовлення
 */
router.put('/set-ttn/:orderId', async (req, res) => {
    try {
        const { ttn } = req.body;

        if (!ttn) {
            return res.status(400).json({ message: 'Вкажіть ТТН' });
        }

        const cleanTtn = String(ttn).trim().replace(/\s/g, '');

        if (cleanTtn.length < 10 || cleanTtn.length > 20) {
            return res.status(400).json({ message: 'Невірний формат ТТН' });
        }

        const order = await Order.findOne({
            where: {
                [Op.or]: [
                    { order_id: req.params.orderId },
                    { order_number: req.params.orderId }
                ]
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        await order.update({
            ttn: cleanTtn,
            status: 'shipped'
        });

        // Спробуємо одразу отримати статус
        let npStatus = null;
        let npStatusCode = null;

        try {
            const trackingInfo = await NovaPoshtaService.getTrackingInfo(cleanTtn);

            if (trackingInfo) {
                npStatus = trackingInfo.Status;
                npStatusCode = trackingInfo.StatusCode;

                await order.update({
                    np_status: npStatus,
                    np_status_code: npStatusCode,
                    np_last_sync: new Date()
                });
            }
        } catch (e) {
            console.log('Could not fetch initial tracking:', e.message);
        }

        res.json({
            message: 'ТТН встановлено',
            order_id: order.order_id,
            order_number: order.order_number,
            ttn: cleanTtn,
            status: 'shipped',
            npStatus,
            npStatusCode
        });

    } catch (error) {
        console.error('Set TTN error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
