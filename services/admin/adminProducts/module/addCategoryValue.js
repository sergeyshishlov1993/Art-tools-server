const axios = require("axios");
const xml2js = require("xml2js");
const util = require("util");
const parser = new xml2js.Parser({ explicitArray: false });
const parseStringPromise = util.promisify(parser.parseString);

const {
  category: Category,
  subCategory: SubCategory,
} = require("../../../../db");

const addCategoryValue = async () => {
  try {
    const response = await axios.get(
      "https://procraft.ua/ua/index.php?route=extension/feed/unixml/feed_market"
    );
    const result = await parseStringPromise(response.data);

    const { categories } = result.yml_catalog.shop;

    console.log("CATEGORY", categories);

    // Обработка категорий и подкатегорий
    for (const x of categories.category) {
      if (x.$.parentId) {
        // Работа с подкатегориями
        try {
          const [subCategory, created] = await SubCategory.findOrCreate({
            where: { sub_category_id: x.$.id },
            defaults: {
              parent_id: x.$.parentId,
              sub_category_name: x._,
            },
          });

          if (!created) {
            // Если подкатегория существует, обновляем её
            await subCategory.update({
              parent_id: x.$.parentId,
              sub_category_name: x._,
            });
          }
        } catch (error) {
          console.error(
            "Помилка при створенні або оновленні підкатегорії:",
            error
          );
        }
      } else {
        // Работа с категориями
        try {
          const [category, created] = await Category.findOrCreate({
            where: { id: x.$.id },
            defaults: {
              category_name: x._,
            },
          });

          if (!created) {
            // Если категория существует, обновляем её
            await category.update({
              category_name: x._,
            });
          }
        } catch (error) {
          console.error(
            "Помилка при створенні або оновленні категорії:",
            error
          );
        }
      }
    }
  } catch (error) {
    console.error("Error during feed processing: ", error);
  }
};

module.exports = addCategoryValue;
