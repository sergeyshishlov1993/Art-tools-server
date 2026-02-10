const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3,
    lazyConnect: true
});

redis.on('error', (err) => console.error('Redis error:', err.message));
redis.on('connect', () => console.log('✅ Redis connected'));

const cache = {
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    async set(key, data, ttl = 300) {
        try {
            await redis.setex(key, ttl, JSON.stringify(data));
        } catch (e) {}
    },

    async del(key) {
        try { await redis.del(key); } catch (e) {}
    },

    async delPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length) await redis.del(...keys);
        } catch (e) {}
    },

    async invalidateProducts() {
        await this.delPattern('products:*');
        await this.delPattern('filters:*');
    }
};

module.exports = cache;
