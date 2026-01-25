const { Router } = require("express");
const router = Router();

const getProductByStatus = require("../module/getProductByStatus");
console.log("working..");

//дописать логику получение данных для слайдера на основной странице

router.get("/", async (req, res) => {
  try {
    const bestsellers = await getProductByStatus("bestseller");
    const sale = await getProductByStatus("sale", 8);

    res.status(200).json({
      message: "Успешно загруженно",
      bestsellers,
      sale,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
