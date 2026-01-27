const { Product, CategoryFilter } = require('../db');
const { generateFilterSlug } = require('../utils/slugify');

const KEY_MAP = {
    "Двигун": "Тип двигуна",
    "Ємність батареї": "Ємність акумулятора",
    "Номінальна напруга": "Напруга акумулятора",
    "Число оборотів холостого ходу": "Оберти"
};

const BLACKLIST = [
    "Інструкція", "Рівень звукового", "Рівень вібрації", "Клас безпеки",
    "Клас захисту", "Рівень захисту", "Вага", "Біта", "Додаткова рукоять",
    "Зарядний пристрій", "Кейс", "Гарантія", "Діаметр свердління", "Розміри"
];

class FilterService {
    /**
     * Перерахувати фільтри для підкатегорії
     */
    static async recalcForCategory(subCategoryId) {
        try {
            const [brands] = await Product.sequelize.query(
                `SELECT brand, COUNT(DISTINCT product_id) as c 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId AND brand > '' 
                 GROUP BY brand ORDER BY brand`,
                { replacements: { subCategoryId } }
            );

            const [prices] = await Product.sequelize.query(
                `SELECT MIN(CAST(price AS DECIMAL)) as min, MAX(CAST(price AS DECIMAL)) as max 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId`,
                { replacements: { subCategoryId } }
            );

            const [special] = await Product.sequelize.query(
                `SELECT 
                    COUNT(CASE WHEN sale='true' THEN 1 END) as sale, 
                    COUNT(CASE WHEN bestseller='true' THEN 1 END) as best, 
                    COUNT(CASE WHEN discount > 0 THEN 1 END) as disc 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId`,
                { replacements: { subCategoryId } }
            );

            const [params] = await Product.sequelize.query(
                `SELECT p.parameter_name, p.slug, p.parameter_value, p.param_value_slug, COUNT(DISTINCT p.product_id) as count
                 FROM parameter p
                 INNER JOIN products prod ON prod.product_id = p.product_id
                 WHERE prod.available = 'true' AND prod.sub_category_id = :subCategoryId
                 GROUP BY p.parameter_name, p.slug, p.parameter_value, p.param_value_slug
                 ORDER BY count DESC`,
                { replacements: { subCategoryId } }
            );

            const groupedParams = this._groupParams(params);

            await CategoryFilter.upsert({
                sub_category_id: subCategoryId,
                filters_data: {
                    brands: brands.map(b => ({ name: b.brand, count: +b.c })),
                    price: { min: +prices[0]?.min || 0, max: +prices[0]?.max || 0 },
                    special: {
                        sale: +special[0]?.sale,
                        bestseller: +special[0]?.best,
                        with_discount: +special[0]?.disc
                    },
                    attributes: groupedParams
                }
            });

            console.log(`[FilterService] Saved for ${subCategoryId}`);
        } catch (error) {
            console.error(`[FilterService] Error:`, error.message);
            throw error;
        }
    }

    /**
     * Групувати параметри
     */
    static _groupParams(params) {
        const groupedParams = {};

        params.forEach(row => {
            let name = row.parameter_name.trim();

            if (BLACKLIST.some(bad => name.includes(bad))) return;
            if (KEY_MAP[name]) name = KEY_MAP[name];

            const slug = row.slug || generateFilterSlug(name);
            let value = row.parameter_value
                .replace(/\s+/g, ' ')
                .replace(/\s*[-–—]\s*/g, ' - ')
                .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
                .replace(/(\d),(\d)/g, '$1.$2')
                .trim();

            if (value.endsWith('.')) value = value.slice(0, -1);
            if (!slug || !value) return;

            // Генеруємо value_slug
            const valueSlug = row.param_value_slug || generateFilterSlug(value);

            if (!groupedParams[slug]) {
                groupedParams[slug] = {
                    title: name,
                    slug: slug,
                    options: []
                };
            }

            const existingOpt = groupedParams[slug].options.find(
                o => o.value.toLowerCase() === value.toLowerCase()
            );

            if (existingOpt) {
                existingOpt.count += parseInt(row.count);
            } else if (groupedParams[slug].options.length < 15) {
                groupedParams[slug].options.push({
                    value: value,
                    value_slug: valueSlug,  // <-- ДОДАНО!
                    count: parseInt(row.count)
                });
            }
        });

        return groupedParams;
    }
}

module.exports = FilterService;
