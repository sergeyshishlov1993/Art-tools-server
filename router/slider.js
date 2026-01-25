const { Router } = require("express");
const router = Router();
const Sequelize = require("sequelize");

const { slider: sliderImg } = require("../db");

router.post("/add", async (req, res) => {
  const { id, linkImg } = req.body;
  try {
    const slider = await sliderImg.create({
      id: id,
      name: linkImg,
    });

    res.status(200).json({
      message: "добавленны картинки на основной слайдер",
      slider,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const slider = await sliderImg.destroy({
      where: { id: req.params.id },
    });

    res.status(200).json({
      message: `удален слайд с id ${req.params.id}`,
      slider,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.get("/", async (req, res) => {
  try {
    const slider = await sliderImg.findAll();

    res.status(200).json({
      message: "это слайдер",
      slider,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});
module.exports = router;
