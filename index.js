const express = require("express");
const app = express();
const cors = require("cors");

const home = require("./router/home");
const adminPage = require("./router/admin");
const productsPage = require("./router/products");
const sale = require("./router/sale");
const bestseller = require("./router/bestseller");
const feedback = require("./router/feedback");
const newPost = require("./router/novaPoshta");
const order = require("./router/orders");
const sliderRouter = require("./router/slider");

require("dotenv").config();

app.use(cors());
app.use(express.json());

app.use("/admin", adminPage);
app.use("/home", home);
app.use("/slider", sliderRouter);
app.use("/products", productsPage);
app.use("/sale", sale);
app.use("/feedback", feedback);
app.use("/bestseller", bestseller);
app.use("/nova-poshta", newPost);
app.use("/order", order);

app.get("/", (req, res) => {
  res.send("Привет, мир!");
});

const appPort = process.env.APP_PORT || 8000;
app.listen(appPort, () => {
  console.log(`Приложение запущено на http://localhost:${appPort}`);
});
