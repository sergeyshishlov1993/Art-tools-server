// const { Telegraf } = require('telegraf');
//
// class TelegramService {
//     constructor() {
//         this.bot = null;
//         this.chatIds = [];
//     }
//
//     init() {
//         const token = process.env.TELEGRAM_TOKKEN;
//         if (!token) {
//             console.warn('[Telegram] Token not found');
//             return;
//         }
//
//         this.bot = new Telegraf(token);
//
//         this.bot.on('message', (ctx) => {
//             if (!this.chatIds.includes(ctx.chat.id)) {
//                 this.chatIds.push(ctx.chat.id);
//                 console.log(`[Telegram] Chat ID: ${ctx.chat.id}`);
//                 ctx.reply('Дякуємо за ініціалізацію бота!');
//             }
//         });
//
//         this.bot.launch()
//             .then(() => console.log('[Telegram] Bot started'))
//             .catch(err => console.error('[Telegram] Error:', err));
//
//         process.once('SIGINT', () => this.bot.stop('SIGINT'));
//         process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
//     }
//
//     sendOrderNotification(order) {
//         const message = `🛍️ Нове замовлення!
//
// Товар:
// ${order.products}
//
// Покупець:
// ${order.name} ${order.secondName}
// ${order.phone}
//
// Доставка:
// ${order.city}
// ${order.warehouses}
// ${order.courierAddress}
// ${order.payment}
//
// Сума: ${order.totalPrice} ₴`;
//
//         this.chatIds.forEach(chatId => {
//             this.bot?.telegram.sendMessage(chatId, message).catch(err => {
//                 console.error(`[Telegram] Error sending to ${chatId}:`, err);
//             });
//         });
//     }
// }
//
// module.exports = new TelegramService();
const { Telegraf } = require('telegraf');

class TelegramService {
    constructor() {
        this.bot = null;
        this.chatIds = [];
    }

    init() {
        const token = process.env.TELEGRAM_TOKKEN;
        if (!token) {
            console.warn('[Telegram] Token not found');
            return;
        }

        this.bot = new Telegraf(token);

        this.bot.on('message', (ctx) => {
            if (!this.chatIds.includes(ctx.chat.id)) {
                this.chatIds.push(ctx.chat.id);
                console.log(`[Telegram] Chat ID: ${ctx.chat.id}`);
                ctx.reply('Дякуємо за ініціалізацію бота!');
            }
        });

        this.bot.launch()
            .then(() => console.log('[Telegram] Bot started'))
            .catch(err => console.error('[Telegram] Error:', err));

        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    // Приватний метод для відправки повідомлень
    _sendMessage(message) {
        if (!this.bot) {
            console.warn('[Telegram] Bot not initialized');
            return;
        }

        this.chatIds.forEach(chatId => {
            this.bot.telegram.sendMessage(chatId, message).catch(err => {
                console.error(`[Telegram] Error sending to ${chatId}:`, err.message);
            });
        });
    }

    // Швидка покупка
    sendQuickBuyNotification({ orderId, productName, productId, quantity, price, totalPrice, name, phone }) {
        const message = `🚀 ШВИДКЕ ЗАМОВЛЕННЯ!

📦 Товар: ${productName}
🔖 ID: ${productId}
📊 Кількість: ${quantity} шт.
💰 Ціна: ${price.toFixed(2)} грн
💵 Сума: ${totalPrice.toFixed(2)} грн

👤 Покупець: ${name}
📱 Телефон: ${phone}

🆔 Замовлення: ${orderId}
⏰ Час: ${new Date().toLocaleString('uk-UA')}

⚠️ Потрібно зв'язатись для уточнення доставки!`;

        this._sendMessage(message);
    }

    // Звичайне замовлення
    sendOrderNotification(order) {
        const message = `🛍️ Нове замовлення!

📦 Товари:
${order.products}

👤 Покупець:
${order.name} ${order.secondName || ''}
📱 ${order.phone}

🚚 Доставка:
${order.city || 'Не вказано'}
${order.warehouses || ''}
${order.courierAddress || ''}

💳 Оплата: ${order.payment || 'Не вказано'}

💵 Сума: ${order.totalPrice} грн

🆔 Замовлення: ${order.orderId || 'N/A'}
⏰ Час: ${new Date().toLocaleString('uk-UA')}`;

        this._sendMessage(message);
    }

    // Зворотній зв'язок
    sendFeedbackNotification({ name, phone, message: userMessage }) {
        const message = `📩 НОВЕ ПОВІДОМЛЕННЯ!

👤 Ім'я: ${name}
📱 Телефон: ${phone}

💬 Повідомлення:
${userMessage}

⏰ Час: ${new Date().toLocaleString('uk-UA')}`;

        this._sendMessage(message);
    }
}

module.exports = new TelegramService();
