const { Router } = require("express");
const router = Router();

const login = require("../services/admin/login");
const sale = require("../services/admin/adminSale/sale");
const bestseller = require("../services/admin/adminBestseller/bestseller");
const products = require("../services/admin/adminProducts/products");

router.use("/login", login);
router.use("/sale", sale);
router.use("/bestseller", bestseller);
router.use("/products", products);

router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      message: "привет админ",
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
