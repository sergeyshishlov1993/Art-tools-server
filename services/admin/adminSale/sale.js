const { Router } = require("express");
const router = Router();

const getProductByStatus = require("../../../module/getProductByStatus");
const updateSaleProduct = require("./module/adminUpdatePrise");
const removeProductStatus = require("../../../module/removeProductStatus");

// все акционые позиции
router.get("/", async (req, res) => {
  try {
    const sale = await getProductByStatus("sale");

    res.status(200).json({
      message: "Акционый товар",
      sale,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//установить новую цену и сделать акционым
router.post("/:id/add", async (req, res) => {
  try {
    await updateSaleProduct(req.params.id, req.body.newPrice);

    res.status(200).json({
      message: "акционый товар создан",
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//удалить товар из акции
router.put("/:id/remove", async (req, res) => {
  try {
    await removeProductStatus("sale", req.params.id, 0);

    res.status(200).json({
      message: "уже не в акции...",
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
