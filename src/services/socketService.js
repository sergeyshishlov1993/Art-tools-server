let io = null;

function init(server) {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 Admin connected:', socket.id);

        // Адмін підключається до кімнати
        socket.on('join-admin', () => {
            socket.join('admin-room');
            console.log('👤 Joined admin-room:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected:', socket.id);
        });
    });

    return io;
}

// Відправити подію всім адмінам
function notifyAdmins(event, data) {
    if (io) {
        io.to('admin-room').emit(event, data);
        console.log(`📡 Emitted ${event}:`, data);
    }
}

// Нове замовлення
function notifyNewOrder(order) {
    notifyAdmins('new-order', {
        orderId: order.order_id,
        orderNumber: order.order_number,
        name: order.name,
        phone: order.phone,
        totalPrice: order.total_price,
        type: order.order_type,
        createdAt: new Date().toISOString()
    });
}

// Новий відгук
function notifyNewFeedback(feedback) {
    notifyAdmins('new-feedback', {
        id: feedback.id,
        name: feedback.name,
        createdAt: new Date().toISOString()
    });
}

module.exports = {
    init,
    notifyAdmins,
    notifyNewOrder,
    notifyNewFeedback
};