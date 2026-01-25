const { Router } = require("express");
const router = Router();

const getProductByStatus = require("../module/getProductByStatus");

router.get("/", async (req, res) => {
  try {
    const sale = await getProductByStatus("sale");

    res.status(200).json({
      message: "Успешно загруженно",
      sale,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
