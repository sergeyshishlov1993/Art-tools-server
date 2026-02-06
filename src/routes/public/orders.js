const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem, Product, Picture } = require('../../db');
const telegramService = require('../../services/telegramService');

router.post('/quick-buy', async (req, res) => {
    const { name, phone, slug, quantity = 1 } = req.body;

    if (!name || !phone || !slug) {
        return res.status(400).json({ message: 'Вкажіть ім\'я, телефон та товар' });
    }

    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(String(phone).replace(/\s/g, ''))) {
        return res.status(400).json({ message: 'Невірний формат телефону' });
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

        const price = parseFloat(product.price);
        const discount = product.discount || 0;
        const finalPrice = discount > 0 ? price - (price * discount / 100) : price;
        const totalPrice = finalPrice * Number(quantity || 1);

        const productImg = product.pictures?.[0]?.pictures_name || null;

        const order = await Order.create({
            name,
            second_name: '',
            phone,
            payment_method: 'Не вказано',
            city: 'Не вказано',
            postal_office: 'Не вказано',
            total_price: String(totalPrice),
            courier_delivery_address: '',
            qwery: 'quick-buy',
            status: 'new'
        });

        await OrderItem.create({
            order_id: order.order_id,
            order_name: product.product_name,
            count: Number(quantity || 1),
            product_id: product.product_id,
            product_img: productImg,
            price: price,
            discount: discount,
            discounted_product: discount > 0 ? finalPrice : null
        });

        telegramService.sendQuickBuyNotification({
            orderId: order.order_id,
            productName: product.product_name,
            productId: product.product_id,
            quantity: Number(quantity || 1),
            price: finalPrice,
            totalPrice,
            name,
            phone
        });

        res.json({
            message: 'Замовлення створено! Ми зв\'яжемось з вами найближчим часом.',
            order_id: order.order_id,
            product: {
                name: product.product_name,
                price: finalPrice,
                quantity: Number(quantity || 1),
                total: totalPrice
            }
        });
    } catch (error) {
        console.error('Quick buy error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.post('/add-order', async (req, res) => {
    const {
        order_id, name, secondName, phone, payment,
        city, warehouses, totalPrice, orders,
        courierDeliveryAddress, qwery
    } = req.body;

    try {
        await Order.create({
            order_id,
            name,
            second_name: secondName,
            phone,
            payment_method: payment,
            city,
            postal_office: warehouses,
            total_price: totalPrice,
            courier_delivery_address: courierDeliveryAddress,
            qwery,
            status: 'new'
        });

        for (const item of orders || []) {
            await OrderItem.create({
                order_id,
                order_name: item.orderName,
                count: item.count,
                product_id: item.product_id,
                product_img: item.img,
                price: item.price,
                discount: item.discount,
                discounted_product: item.discountProduct
            });
        }

        telegramService.sendOrderNotification({
            orderId: order_id,
            products: (orders || []).map((item, i) => `${i + 1}. ${item.orderName} (${item.count} шт.)`).join('\n'),
            name,
            secondName,
            phone,
            city,
            payment,
            warehouses,
            courierAddress: courierDeliveryAddress,
            totalPrice
        });

        res.json({ message: 'Замовлення успішно додано', order_id });
    } catch (error) {
        console.error('Add order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;