const { Telegraf } = require('telegraf');

class TelegramService {
    constructor() {
        this.bot = null;
        this.chatIds = [];
        this.baseUrl = process.env.SITE_URL || 'https://your-site.com';
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

    _sendMessage(message) {
        if (!this.bot) {
            console.warn('[Telegram] Bot not initialized');
            return;
        }

        this.chatIds.forEach(chatId => {
            this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch(err => {
                console.error(`[Telegram] Error sending to ${chatId}:`, err.message);
            });
        });
    }

    _sendPhoto(photoUrl, caption) {
        if (!this.bot) {
            console.warn('[Telegram] Bot not initialized');
            return;
        }

        this.chatIds.forEach(chatId => {
            this.bot.telegram.sendPhoto(chatId, photoUrl, {
                caption,
                parse_mode: 'HTML'
            }).catch(err => {
                console.error(`[Telegram] Error sending photo to ${chatId}:`, err.message);
                this.bot.telegram.sendMessage(chatId, caption, { parse_mode: 'HTML' }).catch(() => {});
            });
        });
    }

    _sendMediaGroup(photos, caption) {
        if (!this.bot || !photos.length) {
            return;
        }

        const media = photos.slice(0, 10).map((url, index) => ({
            type: 'photo',
            media: url,
            caption: index === 0 ? caption : undefined,
            parse_mode: index === 0 ? 'HTML' : undefined
        }));

        this.chatIds.forEach(chatId => {
            this.bot.telegram.sendMediaGroup(chatId, media).catch(err => {
                console.error(`[Telegram] Error sending media group to ${chatId}:`, err.message);
                this._sendPhoto(photos[0], caption);
            });
        });
    }

    _getFullImageUrl(imagePath) {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `${this.baseUrl}/uploads/${imagePath}`;
    }

    sendQuickBuyNotification({ orderNumber, productName, productId, productImg, quantity, price, totalPrice, name, phone, source }) {
        const message = `🚀 <b>ШВИДКЕ ЗАМОВЛЕННЯ #${orderNumber}</b>

📦 Товар: ${productName}
🔖 Код: ${productId}
📊 Кількість: ${quantity} шт.
💰 Ціна: ${price.toFixed(2)} грн
💵 Сума: <b>${totalPrice.toFixed(2)} грн</b>

👤 Покупець: ${name}
📱 Телефон: <code>${phone}</code>

📍 Джерело: ${source || 'direct'}
⏰ ${new Date().toLocaleString('uk-UA')}

⚠️ <i>Потрібно зв'язатись для уточнення доставки!</i>`;

        const imageUrl = this._getFullImageUrl(productImg);

        if (imageUrl) {
            this._sendPhoto(imageUrl, message);
        } else {
            this._sendMessage(message);
        }
    }

    sendOrderNotification({ orderNumber, products, productsWithImages, name, secondName, phone, city, payment, warehouses, courierAddress, totalPrice, source }) {
        const message = `🛍️ <b>НОВЕ ЗАМОВЛЕННЯ #${orderNumber}</b>

📦 Товари:
${products}

👤 Покупець: ${name} ${secondName || ''}
📱 Телефон: <code>${phone}</code>

🚚 Доставка:
${city || 'Не вказано'}
${warehouses || ''}
${courierAddress || ''}

💳 Оплата: ${payment || 'Не вказано'}
💵 Сума: <b>${totalPrice} грн</b>

📍 Джерело: ${source || 'direct'}
⏰ ${new Date().toLocaleString('uk-UA')}`;

        const imageUrls = (productsWithImages || [])
            .map(item => this._getFullImageUrl(item.img))
            .filter(Boolean);

        if (imageUrls.length > 1) {
            this._sendMediaGroup(imageUrls, message);
        } else if (imageUrls.length === 1) {
            this._sendPhoto(imageUrls[0], message);
        } else {
            this._sendMessage(message);
        }
    }

    sendFeedbackNotification({ name, phone, message: userMessage }) {
        const message = `📩 <b>НОВЕ ПОВІДОМЛЕННЯ!</b>

👤 Ім'я: ${name}
📱 Телефон: <code>${phone}</code>

💬 Повідомлення:
<i>${userMessage}</i>

⏰ ${new Date().toLocaleString('uk-UA')}`;

        this._sendMessage(message);
    }
}

module.exports = new TelegramService();
