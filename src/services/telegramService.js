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

    sendOrderNotification(order) {
        const message = `🛍️ Нове замовлення!

Товар:
${order.products}

Покупець:
${order.name} ${order.secondName}
${order.phone}

Доставка:
${order.city}
${order.warehouses}
${order.courierAddress}
${order.payment}

Сума: ${order.totalPrice} ₴`;

        this.chatIds.forEach(chatId => {
            this.bot?.telegram.sendMessage(chatId, message).catch(err => {
                console.error(`[Telegram] Error sending to ${chatId}:`, err);
            });
        });
    }
}

module.exports = new TelegramService();
