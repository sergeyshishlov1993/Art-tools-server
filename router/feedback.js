const { Router } = require("express");
const router = Router();

const { feedback: Feedback } = require("../db");

router.get("/all", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const feedback = await Feedback.findAndCountAll({
      distinct: true,
      offset: (page - 1) * limit,
      limit: limit,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Обратная связь",
      feedback: feedback.rows,
      totalItems: feedback.count,
      totalPages: Math.ceil(feedback.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Ошибка при получение:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.put("/change-status/:id", async (req, res) => {
  try {
    const feedback = Feedback.update(
      {
        status: "Виконано",
      },
      {
        where: { id: req.params.id },
      }
    );
    res.status(200).json({
      message: "статус змінено",
    });
  } catch (error) {
    console.error("сталась помилка", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const feedback = Feedback.destroy({
      where: { id: req.params.id },
    });
    res.status(200).json({
      message: "успішно видалено",
    });
  } catch (error) {
    console.error("сталась помилка", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newFeedback = await Feedback.create({
      name: req.body.name,
      phone: req.body.phone,
    });
    console.log("Потрібна консультація:", newFeedback);
    res.status(200).json({
      message: "Потрібна консультація успешно добавлен",
    });
  } catch (error) {
    console.log(Feedback);
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
