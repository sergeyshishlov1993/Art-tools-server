const { Router } = require("express");
const { Sequelize } = require("sequelize");
const TelegramBot = require("node-telegram-bot-api");
const { order: Order, orderItem: OrderItems, order } = require("../db");
const env = require("dotenv").config();
const router = Router();

const botToken = process.env.TELEGRAM_TOKKEN;
const bot = new TelegramBot(botToken, { polling: true });
let chatId = [];

bot.on("message", (msg) => {
  if (!chatId.includes(msg.chat.id)) {
    chatId.push(msg.chat.id);
    console.log(`Chat ID отримано: ${chatId}`);

    bot.sendMessage(msg.chat.id, "Дякуємо за ініціалізацію бота!");
  }
});

function sendPurchaseNotification(
  productName,
  customerName,
  secondName,
  phone,
  city,
  payment,
  warehouses,
  courierDeliveryAddress,
  totalPrice
) {
  const message = `🛍️ Нове замовлення!\n\nТовар: \n ${productName} \n\nПокупець:\n ${customerName}  ${secondName} \n ${phone}  \n\n Доставка: \n ${city} \n ${warehouses} \n ${courierDeliveryAddress} ${payment} \n \n Сумма: \n ${totalPrice} ₴`;

  chatId.forEach((el) => {
    bot.sendMessage(el, message);
  });
}

router.post("/add-order", async (req, res) => {
  const {
    order_id,
    name,
    secondName,
    phone,
    payment,
    city,
    warehouses,
    totalPrice,
    orders,
    courierDeliveryAddress,
    qwery,
  } = req.body;

  try {
    const order = await Order.create({
      order_id: order_id,
      name: name,
      second_name: secondName,
      phone: phone,
      payment_method: payment,
      city: city,
      postal_office: warehouses,
      total_price: totalPrice,
      courier_delivery_address: courierDeliveryAddress,
      qwery: qwery,
    });

    for (const item of orders) {
      await OrderItems.create({
        order_id: order_id,
        order_name: item.orderName,
        count: item.count,
        product_id: item.product_id,
        product_img: item.img,
        price: item.price,
        discount: item.discount,
        discounted_product: item.discountProduct,
      });
    }

    const productNames = orders
      .map((item, index) => `${index + 1}. ${item.orderName}`)
      .join("\n");

    sendPurchaseNotification(
      productNames,
      name,
      secondName,
      phone,
      city,
      payment,
      warehouses,
      courierDeliveryAddress,
      totalPrice
    );

    res.status(200).json({ message: "Замовлення успішно додано." });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.put("/change-status/:id", async (req, res) => {
  const { status } = req.query;
  try {
    const order = await Order.update(
      {
        status: status,
      },
      {
        where: {
          order_id: req.params.id,
        },
      }
    );

    res.status(200).json({ message: "Статус зміненно" });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.put("/delete/:parentId/:itemId", async (req, res) => {
  const { totalPrice } = req.query;
  try {
    const orderItem = await OrderItems.destroy({
      where: { item_id: req.params.itemId },
    });

    const order = await Order.update(
      {
        total_price: totalPrice,
      },

      {
        where: {
          order_id: req.params.parentId,
        },
      }
    );

    res.status(200).json({ message: "товар видаленно" });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const order = await Order.destroy({
      where: { order_id: req.params.id },
    });

    res.status(200).json({ message: "замовлення видаленно" });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.get("/all-orders", async (req, res) => {
  const { page = 1, limit = 10, search = "", status = "" } = req.query;
  const year = req.query.year || null;
  const month = req.query.month || null;

  try {
    const whereCondition = {};

    if (search.trim()) {
      whereCondition.phone = {
        [Sequelize.Op.iLike]: `%${search.trim()}%`,
      };
    }

    if (year !== null && month !== null && year !== "" && month !== "") {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      whereCondition.createdAt = {
        [Sequelize.Op.gte]: startDate,
        [Sequelize.Op.lt]: endDate,
      };
    }

    if (status.trim()) {
      whereCondition.status = status.trim();
    }

    const orders = await Order.findAndCountAll({
      distinct: true,
      where: whereCondition,
      include: [
        {
          model: OrderItems,
          as: "orderItem",
        },
      ],
      offset: (page - 1) * limit,
      limit: limit,
      order: [["createdAt", "DESC"]],
    });

    if (orders.count === 0) {
      return res.status(200).json({
        message: "Нічого не знайдено в базі",
        notFound: true,
        orders: orders.rows,
        totalItems: orders.count,
        totalPages: Math.ceil(orders.count / limit),
        currentPage: parseInt(page),
      });
    }

    return res.status(200).json({
      message: "Замовлення знайдено",
      orders: orders.rows,
      totalItems: orders.count,
      totalPages: Math.ceil(orders.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Помилка при отриманні замовлень:", error);
    return res.status(500).json({ message: "Помилка сервера" });
  }
});

module.exports = router;
