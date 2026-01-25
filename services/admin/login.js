const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const env = require("dotenv").config();
const { Router } = require("express");
const { admin: Admin } = require("../../db");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

let refreshTokens = [];

const generateAccessToken = (user) => {
  return jwt.sign({ username: user.name, role: user.role }, accessTokenSecret, {
    expiresIn: "7d",
  });
};

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    { username: user.name, role: user.role },
    refreshTokenSecret
  );
  refreshTokens.push(refreshToken);
  return refreshToken;
};

const addAdmin = async (username, password) => {
  try {
    const existingAdmin = await Admin.findOne({ where: { name: username } });
    if (existingAdmin) {
      throw new Error("Адміністратор з таким іменем вже існує");
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name: username,
      password: hash,
    });
    console.log("Admin added", admin.id);
  } catch (err) {
    console.error("Error adding admin:", err);
    throw err;
  }
};

const router = Router();

router.post("/add-admin", async (req, res) => {
  const { username, password } = req.body;

  try {
    await addAdmin(username, password);
    res.status(200).json({ message: "Адміністратор доданий успішно." });
  } catch (error) {
    console.error("Ошибка при додаванні адміністратора:", error);
    res.status(500).json({
      message: "Ошибка при додаванні адміністратора",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admins = await Admin.findAll();
    const user = admins.find((u) => u.name === username);

    if (!user) {
      return res.status(401).json({ message: "Користувача не знайдено" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Пароль невірний" });
    }

    // Генерація токенів
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      message: "Успішна авторизація адміністратора",
      accessToken,
      refreshToken,
      admin: user,
    });
  } catch (error) {
    console.error("Ошибка при отриманні даних адміністратора:", error);
    res.status(500).json({
      message: "Ошибка при отриманні даних адміністратора",
      error: error.message,
    });
  }
});

// Роут для оновлення токена
router.post("/token", (req, res) => {
  const { token } = req.body;

  console.log("token", token);
  if (!refreshTokens.includes(token)) {
    return res.sendStatus(403);
  }
  jwt.verify(token, refreshTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403);

    const newAccessToken = generateAccessToken({
      name: user.username,
      role: user.role,
    });

    res.json({ accessToken: newAccessToken });
  });
});

module.exports = router;
