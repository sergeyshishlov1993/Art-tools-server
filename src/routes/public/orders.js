const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem, Product, Picture } = require('../../db');
const telegramService = require('../../services/telegramService');
const socketService = require('../../services/socketService');

function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${day}-${random}`;
}

function detectSource(utmSource, utmMedium) {
    const src = String(utmSource || '').toLowerCase();
    const med = String(utmMedium || '').toLowerCase();

    if (src.includes('google') || src.includes('gclid')) return 'google';
    if (src.includes('facebook') || src.includes('fb') || src.includes('meta')) return 'facebook';
    if (src.includes('tiktok') || src.includes('tt')) return 'tiktok';
    if (src.includes('instagram') || src.includes('ig')) return 'instagram';
    if (src.includes('youtube') || src.includes('yt')) return 'youtube';
    if (med.includes('cpc') || med.includes('ppc')) return 'paid';
    if (med.includes('organic')) return 'organic';
    if (med.includes('referral')) return 'referral';

    return 'direct';
}

// POST /api/orders/quick-buy
router.post('/quick-buy', async (req, res) => {
    const {
        name, phone, slug, quantity = 1,
        utm_source, utm_medium, utm_campaign
    } = req.body;

    const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');

    if (!name || !cleanPhone || !slug) {
        return res.status(400).json({ message: 'Вкажіть ім\'я, телефон та товар' });
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
        return res.status(400).json({ message: 'Телефон повинен містити мінімум 10 цифр' });
    }

    try {
        const product = await Product.findOne({
            where: {
                [Op.or]: [
                    { slug: slug },
                    { product_id: slug }
                ]
            },
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }]
        });

        if (!product) {
            return res.status(404).json({ message: 'Товар не знайдено' });
        }

        if (product.available !== 'true') {
            return res.status(400).json({ message: 'Товар недоступний для замовлення' });
        }

        const finalPrice = product.getFinalPrice();
        const oldPrice = product.getOldPrice();
        const discount = product.discount || 0;
        const hasDiscount = product.isOnSale() && oldPrice && oldPrice > finalPrice;

        const qty = Number(quantity || 1);
        const totalPrice = finalPrice * qty;
        const productImg = product.pictures?.[0]?.pictures_name || null;

        const source = detectSource(utm_source, utm_medium);

        const order = await Order.create({
            order_number: generateOrderNumber(),
            name,
            second_name: '',
            phone: cleanPhone,
            payment_method: 'Не вказано',
            city: 'Не вказано',
            postal_office: 'Не вказано',
            total_price: totalPrice,
            courier_delivery_address: '',
            order_type: 'quick-buy',
            source: source,
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            status: 'new'
        });

        await OrderItem.create({
            order_id: order.order_id,
            order_name: product.product_name,
            count: qty,
            product_id: product.product_id,
            product_img: productImg,
            price: finalPrice,
            old_price: hasDiscount ? oldPrice : null,
            discount: hasDiscount ? discount : 0,
            discounted_product: hasDiscount
        });

        telegramService.sendQuickBuyNotification({
            orderNumber: order.order_number,
            productName: product.product_name,
            productId: product.product_id,
            productImg: productImg,
            quantity: qty,
            price: finalPrice,
            totalPrice,
            name,
            phone: cleanPhone,
            source: source
        });

        socketService.notifyNewOrder(order);

        res.json({
            success: true,
            message: 'Замовлення створено!',
            order_id: order.order_id,
            order_number: order.order_number,
            product: {
                name: product.product_name,
                price: finalPrice,
                quantity: qty,
                total: totalPrice
            }
        });
    } catch (error) {
        console.error('Quick buy error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /api/orders/add-order
router.post('/add-order', async (req, res) => {
    const {
        name, secondName, phone, payment,
        city, warehouses, totalPrice, orders,
        courierDeliveryAddress, comment,
        utm_source, utm_medium, utm_campaign
    } = req.body;

    try {
        const source = detectSource(utm_source, utm_medium);

        const order = await Order.create({
            order_number: generateOrderNumber(),
            name,
            second_name: secondName,
            phone,
            payment_method: payment,
            city,
            postal_office: warehouses,
            total_price: parseFloat(totalPrice) || 0,
            courier_delivery_address: courierDeliveryAddress,
            comment: comment || null,
            order_type: 'cart',
            source: source,
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            status: 'new'
        });

        for (const item of orders || []) {
            await OrderItem.create({
                order_id: order.order_id,
                order_name: item.orderName,
                count: item.count,
                product_id: item.product_id,
                product_img: item.img,
                price: item.price,
                old_price: item.oldPrice || null,
                discount: item.discount || 0,
                discounted_product: item.discountProduct || false
            });
        }

        telegramService.sendOrderNotification({
            orderNumber: order.order_number,
            products: (orders || []).map((item, i) => `${i + 1}. ${item.orderName} (${item.count} шт.)`).join('\n'),
            productsWithImages: orders,
            name,
            secondName,
            phone,
            city,
            payment,
            warehouses,
            courierAddress: courierDeliveryAddress,
            totalPrice,
            source: source
        });

        socketService.notifyNewOrder(order);

        res.json({
            message: 'Замовлення успішно додано',
            order_id: order.order_id,
            order_number: order.order_number
        });
    } catch (error) {
        console.error('Add order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
