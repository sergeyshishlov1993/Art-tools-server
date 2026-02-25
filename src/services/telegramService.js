const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const CHAT_IDS_FILE = path.join(__dirname, '../data/telegram-chats.json');

class TelegramService {
    constructor() {
        this.bot = null;
        this.chatIds = [];
        this.baseUrl = process.env.SITE_URL || 'https://your-site.com';
    }

    _loadChatIds() {
        const envIds = (process.env.TELEGRAM_CHAT_ID || '')
            .split(',')
            .map(id => Number(id.trim()))
            .filter(id => !isNaN(id) && id !== 0);

        let fileIds = [];
        try {
            if (fs.existsSync(CHAT_IDS_FILE)) {
                fileIds = JSON.parse(fs.readFileSync(CHAT_IDS_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('[Telegram] Error loading chat IDs file:', e.message);
        }

        this.chatIds = [...new Set([...envIds, ...fileIds])];
    }

    _saveChatIds() {
        try {
            const dir = path.dirname(CHAT_IDS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CHAT_IDS_FILE, JSON.stringify(this.chatIds));
        } catch (e) {
            console.error('[Telegram] Error saving chat IDs:', e.message);
        }
    }

    _mainKeyboard() {
        return Markup.keyboard([
            ['✅ Підписатись', '❌ Відписатись'],
            ['📊 Статус']
        ]).resize();
    }

    init() {
        const token = process.env.TELEGRAM_TOKKEN;
        if (!token) {
            console.warn('[Telegram] Token not found');
            return;
        }

        this._loadChatIds();
        this.bot = new Telegraf(token);

        this.bot.command('start', (ctx) => {
            ctx.reply(
                '👋 Бот сповіщень про замовлення\n\nОберіть дію:',
                this._mainKeyboard()
            );
        });

        this.bot.hears('✅ Підписатись', (ctx) => {
            const chatId = ctx.chat.id;
            if (!this.chatIds.includes(chatId)) {
                this.chatIds.push(chatId);
                this._saveChatIds();
                ctx.reply('✅ Ви підписані на сповіщення про замовлення!');
                console.log(`[Telegram] New subscriber: ${chatId}`);
            } else {
                ctx.reply('Ви вже підписані.');
            }
        });

        this.bot.hears('❌ Відписатись', (ctx) => {
            const chatId = ctx.chat.id;
            if (this.chatIds.includes(chatId)) {
                this.chatIds = this.chatIds.filter(id => id !== chatId);
                this._saveChatIds();
                ctx.reply('❌ Ви відписані від сповіщень.', this._mainKeyboard());
            } else {
                ctx.reply('Ви не були підписані.');
            }
        });

        this.bot.hears('📊 Статус', (ctx) => {
            const chatId = ctx.chat.id;
            const subscribed = this.chatIds.includes(chatId);
            ctx.reply(
                subscribed
                    ? `📊 Ви підписані ✅\n👥 Всього підписників: ${this.chatIds.length}`
                    : '📊 Ви не підписані ❌'
            );
        });

        this.bot.launch()
            .then(() => console.log(`[Telegram] Bot started, subscribers: ${this.chatIds.length}`))
            .catch(err => console.error('[Telegram] Error:', err));

        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    _sendMessage(message) {
        if (!this.bot || !this.chatIds.length) return;

        this.chatIds.forEach(chatId => {
            this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch(err => {
                console.error(`[Telegram] Error sending to ${chatId}:`, err.message);
            });
        });
    }

    _sendPhoto(photoUrl, caption) {
        if (!this.bot || !this.chatIds.length) return;

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
        if (!this.bot || !photos.length || !this.chatIds.length) return;

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