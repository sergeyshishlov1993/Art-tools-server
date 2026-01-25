const { Router } = require("express");
const { Sequelize } = require("sequelize");
const router = Router();
const {
  products: Product,
  review: Review,
  pictures: Pictures,
  parameter: Parameter,
  reviewResponses: ReviewResponse,
  category: Category,
  subCategory: SubCategory,
} = require("../../../db");
const updateOrCreateProductsFromFeed = require("./module/updateOrCreateProduct");
const addCategoryValue = require("./module/addCategoryValue");
const writeProductsCSV = require("./module/parsingProfitecCSV");

router.put("/add_category", async (req, res) => {
  try {
    await addCategoryValue();
    res.json({ message: "Data synchronized" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error synchronizing data", error: error.message });
  }
});

//получение всех категорий

router.get("/sub-category", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const category = await Category.findAll();
    const subCategory = await SubCategory.findAndCountAll({
      distinct: true,

      offset: (page - 1) * limit,
      limit: limit,
    });

    res.status(200).json({
      message: "категория",
      category: category,
      subCategory: subCategory.rows,
      totalItems: subCategory.count,
      totalPages: Math.ceil(subCategory.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Ошибка при получение данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//все отзывы
router.get("/all-reviews", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const review = await Review.findAndCountAll({
      distinct: true,

      include: [
        {
          model: ReviewResponse,
          as: "reviewResponses",
        },
      ],
      offset: (page - 1) * limit,
      limit: limit,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "отзывы",
      review: review.rows,
      totalItems: review.count,
      totalPages: Math.ceil(review.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Ошибка при получение:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//все ответы на отзывы
router.get("/all-reviews-response", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const reviewResponse = await ReviewResponse.findAndCountAll({
      distinct: true,

      offset: (page - 1) * limit,
      limit: limit,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "ответы на отзывы",
      reviewResponse: reviewResponse.rows,
      totalItems: reviewResponse.count,
      totalPages: Math.ceil(reviewResponse.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Ошибка при получение:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//получение отзывово по одному товару
router.get("/:id/review", async (req, res) => {
  try {
    const review = await Review.findAll({
      where: { product_id: req.params.id },
    });
    res.status(200).json({
      message: "отзыв по товару",
      review: review,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//один товар
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findAll({
      where: { product_id: req.params.id },
      include: [
        {
          model: Pictures,
          as: "pictures",
        },
        {
          model: Parameter,
          as: "param",
        },
        {
          model: Review,
          as: "review",
          include: [
            {
              model: ReviewResponse,
              as: "reviewResponses",
            },
          ],
        },
      ],
    });
    res.status(200).json({
      message: "продукты",
      product: product,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

//добавление всех товаров с загрузочной ссылки

router.put("/write-profitec", async (req, res) => {
  try {
    await writeProductsCSV();

    res.status(200).json({ message: "Товари Profitec успішно завантажені" });
  } catch (error) {
    res.status(500).json({
      message: "Помилка завантаження товарів Profitec",
      error: error.message,
    });
  }
});

router.put("/update-or-create", async (req, res) => {
  try {
    await updateOrCreateProductsFromFeed();
    res.status(200).json({ message: "Data synchronized" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error synchronizing data", error: error.message });
  }
});

//обновление данных одного товара
router.put("/update/:id", async (req, res) => {
  const {
    sub_category_id,
    product_name,
    product_description,
    price,
    discount,
    sale_price,
    available,
    bestseller,
    sale,
  } = req.body;
  try {
    const [updatedCount] = await Product.update(
      {
        sub_category_id: sub_category_id,
        product_name: product_name,
        product_description: product_description,
        price: price,
        discount: discount,
        sale_price: sale_price,
        available: available,
        bestseller: bestseller,
        sale: sale,
      },

      {
        where: { product_id: req.params.id },
      }
    );

    if (updatedCount > 0) {
      res.status(200).json({
        message: `обновлен товар з ID ${req.params.id}`,
      });
    } else {
      res.status(404).json({ message: "Товар не знайдено" });
    }
  } catch (error) {
    console.error("Ошибка при видаленні товару:", error);
    res.status(500).json({ message: "Ошибка при видаленні товару" });
  }
});

//обновление только по скидке
router.put("/update-discount/:id", async (req, res) => {
  const { discount, sale_price, sale } = req.body;

  try {
    const [updatedCount] = await Product.update(
      {
        discount: discount,
        sale_price: sale_price,
        sale: sale,
      },
      {
        where: { product_id: req.params.id },
      }
    );

    if (updatedCount > 0) {
      res.status(200).json({
        message: `Знижка та акційна ціна оновлені для товару з ID ${req.params.id}`,
      });
    } else {
      res.status(404).json({ message: "Товар не знайдено" });
    }
  } catch (error) {
    console.error("Помилка при оновленні знижки та акційної ціни:", error);
    res
      .status(500)
      .json({ message: "Помилка при оновленні знижки та акційної ціни" });
  }
});

//cоздаем один товар не из загрузочной ссылки
router.post("/add", async (req, res) => {
  try {
    const addProduct = await Product.create({
      product_id: req.body.id,
      sub_category_id: req.body.sub_category_id,
      product_description: req.body.product_description,
      product_name: req.body.product_name,
      price: req.body.price,
      available: req.body.available,
      custom_product: req.body.customProduct,
    });

    //картинки к кастамному товару
    const picturesData = (
      Array.isArray(req.body.pictures) ? req.body.pictures : [req.body.pictures]
    ).map((picture) => ({
      product_id: req.body.id,
      pictures_name: picture,
    }));
    await Pictures.bulkCreate(picturesData);

    //параметры к кастамному товару
    const parameterData = (
      Array.isArray(req.body.parameters)
        ? req.body.parameters
        : [req.body.parameters]
    ).map((param) => ({
      product_id: req.body.id,
      parameter_name: param.name,
      parameter_value: param.value,
    }));
    await Parameter.bulkCreate(parameterData);

    res.status(200).json({
      message: "товар успешно добавлен",
    });
  } catch (error) {
    console.error("Ошибка при добаление товара:", error);
    res.status(500).json({ message: "Ошибка при добаление товара" });
  }
});

router.delete("/destroy-product-by-brand", async (req, res) => {
  try {
    // Перевірка наявності параметру бренду
    const { brand } = req.query;

    if (!brand || brand.trim() === "") {
      return res.status(400).json({ message: "Бренд не вказано або порожній" });
    }

    // Видаляємо товари за брендом
    const product = await Product.destroy({
      where: { brand: brand },
    });

    // Перевірка кількості видалених товарів
    if (product > 0) {
      res.status(200).json({
        message: `Видалено ${product} товарів бренду ${brand}`,
      });
    } else {
      res.status(404).json({ message: `Товари бренду ${brand} не знайдено` });
    }
  } catch (error) {
    console.error("Помилка при видаленні товару:", error);
    res.status(500).json({ message: "Помилка при видаленні товару" });
  }
});
//удаление товара

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.destroy({
      where: { product_id: req.params.id },
    });
    if (product) {
      res.status(200).json({
        message: `Видалений товар з ID ${req.params.id}`,
      });
    } else {
      res.status(404).json({ message: "Товар не знайдено" });
    }
  } catch (error) {
    console.error("Ошибка при видаленні товару:", error);
    res.status(500).json({ message: "Ошибка при видаленні товару" });
  }
});

//удаление картинки
router.delete("/:id/:pictures", async (req, res) => {
  try {
    const pictures = await Pictures.destroy({
      where: { id: req.params.pictures },
    });
    if (pictures) {
      res.status(200).json({
        message: `Видаленно зображення ${req.params.pictures}`,
      });
    } else {
      res.status(404).json({ message: "Товар не знайдено" });
    }
  } catch (error) {
    console.error("Ошибка при видаленні товару:", error);
    res.status(500).json({ message: "Ошибка при видаленні товару" });
  }
});

//удаление отзывов
router.delete("/:id/review/:reviewId", async (req, res) => {
  try {
    const review = await Review.destroy({
      where: { review_id: req.params.reviewId },
    });
    res.status(200).json({
      message: `удалент отзыв ${req.params.reviewId} `,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.delete("/:id/review/:reviewId/:responseId", async (req, res) => {
  try {
    const reviewResponse = await ReviewResponse.destroy({
      where: { response_id: req.params.responseId },
    });
    res.status(200).json({
      message: `удалент ответ с id ${req.params.responseId} `,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

router.delete("/review/:reviewId/:responseId", async (req, res) => {
  try {
    const reviewResponse = await ReviewResponse.destroy({
      where: { response_id: req.params.responseId },
    });
    res.status(200).json({
      message: `удалент ответ с id ${req.params.responseId} `,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

// все товары

router.get("/", async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sub_category,
    sale = "",
    bestseller = "",
    brand = "",
  } = req.query;

  try {
    const whereCondition = { available: "true" };

    if (search.trim()) {
      whereCondition.product_name = {
        [Sequelize.Op.iLike]: `%${search.trim()}%`,
      };
    }

    if (sub_category && sub_category !== "undefined") {
      whereCondition.sub_category_id = sub_category;
    }

    if (sale && sale !== "undefined") {
      whereCondition.sale = sale;
    }

    if (bestseller && bestseller !== "undefined") {
      whereCondition.bestseller = bestseller;
    }

    if (brand && brand !== "undefined" && brand.trim() !== " ") {
      whereCondition.brand = brand;
    }

    const products = await Product.findAndCountAll({
      distinct: true,
      where: whereCondition,
      include: [
        {
          model: Pictures,
          as: "pictures",
        },
        {
          model: Parameter,
          as: "param",
        },
        {
          model: Review,
          as: "review",
          include: [
            {
              model: ReviewResponse,
              as: "reviewResponses",
            },
          ],
        },
      ],
      offset: (page - 1) * limit,
      limit: limit,
      order: [["product_id", "ASC"]],
    });

    res.status(200).json({
      message: "продукты",
      products: products.rows,
      totalItems: products.count,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных:", error);
    res.status(500).json({ message: "Ошибка при обновлении данных" });
  }
});

module.exports = router;
