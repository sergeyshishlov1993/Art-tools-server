const jwt = require("jsonwebtoken");
const env = require("dotenv").config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const refreshTokens = [];

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

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshTokens,
};
