const fs = require("fs");
const csv = require("csv-parser");
const Sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid"); // Для генерації UUID
const { Op } = Sequelize;
const stringSimilarity = require("string-similarity");
const {
  products: Products,
  pictures: Pictures,
  parameter: Parameter,
  category: Category,
  subCategory: SubCategory,
} = require("../../../../db");

function createImagesArray(imageNames) {
  return imageNames.split(",").map((image) => {
    const imageNameTrimmed = image.trim();
    let extension = "jpg";

    if (imageNameTrimmed.endsWith(".png")) {
      extension = "png";
    }

    const imageNameWithoutExtension = imageNameTrimmed.replace(
      /\.jpg|\.png$/,
      ""
    );

    return `https://profi-tec.com.ua/files/resized/products/${imageNameWithoutExtension}.700x800.${extension}`;
  });
}

async function getCategoriesAndSubcategories() {
  try {
    const categories = await Category.findAll();
    const subCategories = await SubCategory.findAll();

    return { categories, subCategories };
  } catch (error) {
    console.error(
      "Помилка під час отримання категорій та підкатегорій:",
      error
    );
    throw error;
  }
}

// Функція для отримання підкатегорії з рядка категорії (після '/')
function extractSubcategory(category) {
  const parts = category.split("/"); // Розбиваємо рядок по символу "/"
  return parts.length > 1 ? parts[1].trim() : category.trim(); // Повертаємо частину після "/" або цілу категорію
}

// Функція для видалення слова "Акумуляторні" перед порівнянням
function removeSpecificWord(category, word) {
  const regex = new RegExp(`\\b${word}\\b`, "i"); // Регулярний вираз для пошуку слова "Акумуляторні" (без урахування регістру)
  return category.replace(regex, "").trim(); // Видаляємо слово і обрізаємо пробіли
}

// Порівняння за схожістю рядків із бібліотекою string-similarity
function findBestMatch(subcategoryName, subCategories) {
  const categoryNames = subCategories.map(
    (sub) => sub.dataValues.sub_category_name
  );
  const bestMatch = stringSimilarity.findBestMatch(
    subcategoryName,
    categoryNames
  );

  // Повертаємо найкращий збіг, якщо схожість більше ніж 0.5 (можна налаштувати цей поріг)
  return bestMatch.bestMatch.rating > 0.5
    ? subCategories[bestMatch.bestMatchIndex]
    : null;
}

// Функція для порівняння по першому слову
function compareByFirstWord(subcategoryName, subCategories) {
  const firstWord = subcategoryName.split(" ")[0].toLowerCase();

  return subCategories.find((subCategory) => {
    const subCategoryFirstWord = subCategory.dataValues.sub_category_name
      .split(" ")[0]
      .toLowerCase();
    return subCategoryFirstWord === firstWord;
  });
}

// Функція для видалення старих і додавання нових зображень
async function handlePictures(product_id, images) {
  await Pictures.destroy({ where: { product_id } });

  const picturesData = images.map((picture) => ({
    product_id,
    pictures_name: picture,
  }));

  try {
    await Pictures.bulkCreate(picturesData);
  } catch (e) {
    console.log(e.message);
  }
}

// Функція для заповнення параметрів у дочірню таблицю
async function handleParameters(product_id, parameters) {
  await Parameter.destroy({ where: { product_id } });
  const parameterData = parameters.map((param) => ({
    product_id,
    parameter_name: param.name,
    parameter_value: param.value,
  }));
  await Parameter.bulkCreate(parameterData);
}

// Основна функція для обробки CSV і заповнення таблиці продуктів
function parseCsvFile(categoriesData) {
  console.log("Читання CSV файлу...");

  const productsBySubcategory = {};
  const unmatchedCategories = new Set(); // Множина для зберігання категорій, які не знайшли збігу

  fs.createReadStream("./file/PROFI-TEC.csv")
    .pipe(csv({ separator: ";" })) // Вказуємо розділювач крапка з комою
    .on("data", async (row) => {
      const product_id = uuidv4(); // Генеруємо UUID для кожного нового продукту

      // Отримуємо підкатегорію з CSV
      let subcategoryName = extractSubcategory(row.Category);
      subcategoryName = removeSpecificWord(subcategoryName, "Акумуляторні");

      let matchedSubCategory = findBestMatch(
        subcategoryName,
        categoriesData.subCategories
      );

      let subCategoryId;

      if (!matchedSubCategory) {
        matchedSubCategory = compareByFirstWord(
          subcategoryName,
          categoriesData.subCategories
        );
      }

      if (matchedSubCategory) {
        subCategoryId = matchedSubCategory.dataValues.sub_category_id;
      } else if (subcategoryName === "Садові мотокоси") {
        subCategoryId = 72;
      } else {
        unmatchedCategories.add(subcategoryName);
        subCategoryId = null;
      }

      // Масив параметрів
      const parametersArray = getParametersArray(row);

      // Масив зображень
      const imagesArray = createImagesArray(row.Images);

      // Заповнення або оновлення таблиці продуктів
      const [product, created] = await Products.findOrCreate({
        where: { product_name: row.Product },
        defaults: {
          product_id: uuidv4(),
          sub_category_id: subCategoryId,
          product_description: row.Description,
          product_name: row.Product,
          price: row.Price,
          available: "true",
          brand: "Profitec",
        },
      });

      if (!created) {
        await product.update({
          product_description: row.Description,
          product_name: row.Product,
          price: row.Price,
          sale_price: 0,
          sale: "false",
          discount: 0,
          brand: "Profitec",
        });
      }

      // Оновлюємо дочірні таблиці для зображень і параметрів
      await handlePictures(product.product_id, imagesArray);
      await handleParameters(product.product_id, parametersArray);
    })
    .on("end", () => {
      console.log("CSV файл успішно оброблено.");
      console.log("Груповані товари по підкатегоріях:", productsBySubcategory);

      if (unmatchedCategories.size > 0) {
        console.log(
          `Знайдено ${unmatchedCategories.size} категорій без відповідної підкатегорії в базі:`,
          Array.from(unmatchedCategories)
        );
      } else {
        console.log(
          "Усі категорії з файлу мають відповідні підкатегорії в базі."
        );
      }
    })
    .on("error", (err) => {
      console.error("Помилка під час читання файлу:", err);
    });
}

// Функція для отримання масиву параметрів з CSV
function getParametersArray(row) {
  const entries = Object.entries(row);

  const volumeIndex = entries.findIndex(([key]) => key === "volume");

  if (volumeIndex !== -1) {
    return entries
      .slice(volumeIndex)
      .filter(([key, value]) => value !== "" && isRelevantParameter(key))
      .map(([key, value]) => ({ name: key, value }));
  }

  return [];
}

// Функція для фільтрації нерелевантних параметрів
function isRelevantParameter(key) {
  const irrelevantKeys = [
    "volume",
    "to__okaycms__google_merchant 1",
    "to__okaycms__hotline 1",
    "to__okaycms__rozetka 1",
    "Виробник",
  ];
  return !irrelevantKeys.includes(key);
}

// Головна функція для отримання категорій та запуску парсингу
async function main() {
  try {
    const categoriesData = await getCategoriesAndSubcategories();
    parseCsvFile(categoriesData);
  } catch (error) {
    console.error("Помилка при запуску:", error);
  }
}

module.exports = main;
