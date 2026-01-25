const { Router } = require("express");
const router = Router();

const getProductByStatus = require("../../../module/getProductByStatus");
const addBestseller = require("./module/adminAddBestseller");
const removeProductStatus = require("../../../module/removeProductStatus");

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

//установить новую цену и сделать акционым
router.put("/:id/add", async (req, res) => {
  try {
    await addBestseller(req.params.id, req.body.newPrice);

    res.status(200).json({
      message: "добавлен в хит продаж",
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//удалить товар из акции
router.put("/:id/remove", async (req, res) => {
  try {
    await removeProductStatus("bestseller", req.params.id, 0);

    res.status(200).json({
      message: "уже не хит продаж...",
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
