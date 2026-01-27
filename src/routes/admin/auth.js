const { Router } = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = Router();
const { Admin } = require('../../db');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

let refreshTokens = [];

const generateAccessToken = (user) => {
    return jwt.sign(
        { username: user.name, role: user.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(
        { username: user.name, role: user.role },
        REFRESH_TOKEN_SECRET
    );
    refreshTokens.push(refreshToken);
    return refreshToken;
};

// POST /admin/login
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Admin.findOne({ where: { name: username } });

        if (!user) {
            return res.status(401).json({ message: 'Користувача не знайдено' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Пароль невірний' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            message: 'Успішна авторизація',
            accessToken,
            refreshToken,
            admin: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ message: 'Помилка авторизації' });
    }
});

// POST /admin/login/add-admin
router.post('/add-admin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existing = await Admin.findOne({ where: { name: username } });
        if (existing) {
            return res.status(400).json({ message: 'Адміністратор вже існує' });
        }

        const hash = await bcrypt.hash(password, 10);
        await Admin.create({ name: username, password: hash });

        res.json({ message: 'Адміністратор доданий' });
    } catch (error) {
        console.error('[Auth] Add admin error:', error);
        res.status(500).json({ message: 'Помилка додавання' });
    }
});

// POST /admin/login/token
router.post('/token', (req, res) => {
    const { token } = req.body;

    if (!token || !refreshTokens.includes(token)) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token expired' });

        const newAccessToken = generateAccessToken({
            name: user.username,
            role: user.role
        });

        res.json({ accessToken: newAccessToken });
    });
});

// POST /admin/login/logout
router.post('/logout', (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.json({ message: 'Logged out' });
});

module.exports = router;
