const { Router } = require("express");
const router = Router();

const getProductByStatus = require("../module/getProductByStatus");

// все акционые позиции
router.get("/", async (req, res) => {
  try {
    const bestseller = await getProductByStatus("bestseller");

    res.status(200).json({
      message: "хит продаж",
      bestseller,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
