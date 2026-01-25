// routes.js
const express = require("express");
const router = express.Router();
const novaPoshta = require("../module/nova-poshta");

router.get("/cities", async (req, res) => {
  try {
    const data = await novaPoshta.getCities();

    res.status(200).json({
      message: "Успешно",
      data,
    });
  } catch (error) {
    console.error("Ошибка :", error);
    res.status(500).json({ message: "Ошибка " });
  }
});

router.post("/citi", async (req, res) => {
  try {
    const city = await novaPoshta.searchCities(req.body.city);

    const warehouses = await novaPoshta.getWarehouses(req.body.cityRef);

    res.status(200).json({
      message: "Успешно",
      city,
      warehouses,
    });
  } catch (error) {
    console.error("Ошибка :", error);
    res.status(500).json({ message: "Ошибка " });
  }
});

router.post("/citi/warehouses", async (req, res) => {
  try {
    const warehouses = await novaPoshta.getWarehouses(
      req.body.city,
      req.body.numberWarehouses,
      req.body.type
    );

    res.status(200).json({
      message: "Успешно",
      warehouses,
    });
  } catch (error) {
    console.error("Ошибка :", error);
    res.status(500).json({ message: "Ошибка " });
  }
});

router.post("/citi/warehouses/test", async (req, res) => {
  try {
    const warehouses = await novaPoshta.getWarehousesType(
      req.body.city,
      req.body.numberWarehouses,
      req.body.type
    );

    res.status(200).json({
      message: "Успешно",
      warehouses,
    });
  } catch (error) {
    console.error("Ошибка :", error);
    res.status(500).json({ message: "Ошибка " });
  }
});

module.exports = router;
