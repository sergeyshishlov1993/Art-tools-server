// const { Product, CategoryFilter } = require('../db');
// const { generateFilterSlug } = require('../utils/slugify');
//
// const KEY_MAP = {
//     "Двигун": "Тип двигуна",
//     "Ємність батареї": "Ємність акумулятора",
//     "Номінальна напруга": "Напруга акумулятора",
//     "Число оборотів холостого ходу": "Оберти"
// };
//
// const BLACKLIST = [
//     "Інструкція", "Инструкция",
//     "Рівень звукового", "Уровень звукового",
//     "Рівень вібрації", "Уровень вибрации",
//     "Клас безпеки", "Класс безопасности",
//     "Клас захисту", "Класс защиты",
//     "Рівень захисту", "Уровень защиты",
//     "Вага", "Вес",
//     "Біта", "Бита",
//     "Додаткова рукоять", "Дополнительная рукоятка",
//     "Зарядний пристрій", "Зарядное устройство",
//     "Кейс",
//     "Гарантія", "Гарантия", "Гарантия",
//     "Діаметр свердління", "Диаметр сверления",
//     "Розміри", "Размеры"
// ];
//
// function normalizeParameterName(parameterName) {
//     const trimmedName = String(parameterName || '').trim();
//     if (!trimmedName) return '';
//     return KEY_MAP[trimmedName] || trimmedName;
// }
//
// function isBlacklistedParameterName(parameterName) {
//     const name = String(parameterName || '');
//     return BLACKLIST.some(bad => name.includes(bad));
// }
//
// function normalizeParameterValue(parameterValue) {
//     let value = String(parameterValue || '')
//         .replace(/\u00A0/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim();
//
//     if (/^вся комплектація\s*[-–—]/i.test(value)) {
//         value = value.replace(/^вся комплектація\s*[-–—]\s*/i, '');
//     }
//
//     if (value.includes(' - ')) {
//         value = value.split(' - ')[0].trim();
//     }
//
//     value = value
//         .replace(/(\d)\s+(Аг|В|Вт|Нм|мм|кг|г)/gi, '$1$2')
//         .replace(/(\d),(\d)/g, '$1.$2');
//
//     if (value.endsWith('.')) value = value.slice(0, -1).trim();
//
//     return value;
// }
//
//
// function pickBetterDisplayValue(currentValue, nextValue) {
//     const current = String(currentValue || '').trim();
//     const next = String(nextValue || '').trim();
//     if (!current) return next;
//     if (!next) return current;
//     if (next.length < current.length) return next;
//     return current;
// }
//
// class FilterService {
//     static async recalcForCategory(subCategoryId) {
//         try {
//             const [brands] = await Product.sequelize.query(
//                 `SELECT brand, COUNT(DISTINCT product_id) as c
//                  FROM products
//                  WHERE available='true' AND sub_category_id=:subCategoryId AND brand > ''
//                  GROUP BY brand ORDER BY brand`,
//                 { replacements: { subCategoryId } }
//             );
//
//             const [prices] = await Product.sequelize.query(
//                 `SELECT MIN(CAST(price AS DECIMAL)) as min, MAX(CAST(price AS DECIMAL)) as max
//                  FROM products
//                  WHERE available='true' AND sub_category_id=:subCategoryId`,
//                 { replacements: { subCategoryId } }
//             );
//
//             const [special] = await Product.sequelize.query(
//                 `SELECT
//                     COUNT(CASE WHEN sale='true' THEN 1 END) as sale,
//                     COUNT(CASE WHEN bestseller='true' THEN 1 END) as best,
//                     COUNT(CASE WHEN discount > 0 THEN 1 END) as disc
//                  FROM products
//                  WHERE available='true' AND sub_category_id=:subCategoryId`,
//                 { replacements: { subCategoryId } }
//             );
//
//             const [params] = await Product.sequelize.query(
//                 `SELECT p.parameter_name, p.slug, p.parameter_value, p.param_value_slug, COUNT(DISTINCT p.product_id) as count
//                  FROM parameter p
//                  INNER JOIN products prod ON prod.product_id = p.product_id
//                  WHERE prod.available = 'true' AND prod.sub_category_id = :subCategoryId
//                  GROUP BY p.parameter_name, p.slug, p.parameter_value, p.param_value_slug
//                  ORDER BY count DESC`,
//                 { replacements: { subCategoryId } }
//             );
//
//             const groupedParams = this._groupParams(params);
//
//             await CategoryFilter.upsert({
//                 sub_category_id: subCategoryId,
//                 filters_data: {
//                     brands: brands.map(b => ({ name: b.brand, count: +b.c })),
//                     price: { min: +prices[0]?.min || 0, max: +prices[0]?.max || 0 },
//                     special: {
//                         sale: +special[0]?.sale,
//                         bestseller: +special[0]?.best,
//                     },
//                     attributes: groupedParams
//                 }
//             });
//
//             console.log(`[FilterService] Saved for ${subCategoryId}`);
//         } catch (error) {
//             console.error(`[FilterService] Error:`, error.message);
//             throw error;
//         }
//     }
//
//     static _groupParams(params) {
//         const groupedParams = {};
//
//         for (const row of params) {
//             const rawName = row.parameter_name;
//             if (isBlacklistedParameterName(rawName)) continue;
//
//             const name = normalizeParameterName(rawName);
//             const slug = generateFilterSlug(name);
//             if (!slug) continue;
//
//             const value = normalizeParameterValue(row.parameter_value);
//             if (!value) continue;
//
//             const valueSlug = row.param_value_slug || generateFilterSlug(value);
//             if (!valueSlug) continue;
//
//             if (!groupedParams[slug]) {
//                 groupedParams[slug] = {
//                     title: name,
//                     slug: slug,
//                     options: [],
//                     _optionsBySlug: new Map()
//                 };
//             }
//
//             const group = groupedParams[slug];
//             const existing = group._optionsBySlug.get(valueSlug);
//
//             if (existing) {
//                 existing.count += parseInt(row.count, 10);
//                 existing.value = pickBetterDisplayValue(existing.value, value);
//                 continue;
//             }
//
//             if (group.options.length >= 15) continue;
//
//             const option = {
//                 value: value,
//                 value_slug: valueSlug,
//                 count: parseInt(row.count, 10)
//             };
//
//             group.options.push(option);
//             group._optionsBySlug.set(valueSlug, option);
//         }
//
//         for (const key of Object.keys(groupedParams)) {
//             delete groupedParams[key]._optionsBySlug;
//         }
//
//         return groupedParams;
//     }
// }
//
// module.exports = FilterService;

// src/services/filterService.js

const { Product, CategoryFilter } = require('../db');
const { generateFilterSlug } = require('../utils/slugify');

const KEY_MAP = {
    "Двигун": "Тип двигуна",
    "Ємність батареї": "Ємність акумулятора",
    "Номінальна напруга": "Напруга акумулятора",
    "Число оборотів холостого ходу": "Оберти",
    "Напруга живлення": "Напруга",
    "Вихідна напруга": "Напруга",
    "Выходное напряжение": "Напряжение",
    "Напряжение питания": "Напряжение"
};

const BLACKLIST = [
    "Інструкція", "Инструкция",
    "Рівень звукового", "Уровень звукового",
    "Рівень вібрації", "Уровень вибрации",
    "Клас безпеки", "Класс безопасности",
    "Клас захисту", "Класс защиты",
    "Рівень захисту", "Уровень защиты",
    "Вага", "Вес",
    "Біта", "Бита",
    "Додаткова рукоять", "Дополнительная рукоятка",
    "Зарядний пристрій", "Зарядное устройство",
    "Кейс",
    "Гарантія", "Гарантия",
    "Діаметр свердління", "Диаметр сверления",
    "Розміри", "Размеры",
    "Рівень звукового тиску", "Уровень звукового давления",
    "Рівень звукової потужності", "Уровень звуковой мощности",
    "Робоча температура", "Рабочая температура",
    "Швидкість обертання", "Скорость вращения"
];

const VALUE_GARBAGE_SUBSTRINGS = [
    "Код:", "Код :",
    "грн", "₴",
    "Додати в кошик", "Купити в 1 клік",
    "Сторінка", "Страница",
    "0 800",
    "Art Tools"
];

function decodeHtmlEntitiesBasic(value) {
    const raw = String(value ?? '');
    return raw
        .replace(/&nbsp;/gi, ' ')
        .replace(/&times;/gi, '×')
        .replace(/&deg;/gi, '°')
        .replace(/&rdquo;/gi, '"')
        .replace(/&ldquo;/gi, '"')
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&apos;/gi, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&#(\d+);/g, (m, n) => {
            const codePoint = Number(n);
            if (!Number.isFinite(codePoint)) return m;
            if (codePoint < 0 || codePoint > 0x10ffff) return m;
            try {
                return String.fromCodePoint(codePoint);
            } catch {
                return m;
            }
        });
}

function normalizeParameterName(parameterName) {
    const trimmedName = String(parameterName || '').trim();
    if (!trimmedName) return '';
    return KEY_MAP[trimmedName] || trimmedName;
}

function isBlacklistedParameterName(parameterName) {
    const name = String(parameterName || '');
    return BLACKLIST.some((bad) => name.includes(bad));
}

function isGarbageValueText(value) {
    const text = String(value || '');
    return VALUE_GARBAGE_SUBSTRINGS.some((bad) => text.includes(bad));
}

function normalizeParameterValue(parameterValue) {
    let value = decodeHtmlEntitiesBasic(String(parameterValue || ''))
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!value) return '';
    if (isGarbageValueText(value)) return '';

    value = value.replace(/\s*[-–—]\s*/g, ' - ');

    value = value.replace(/^вся комплектація\s*-\s*/i, '');
    value = value.replace(/^нагрівача\s*-\s*/i, '');

    if (value.includes(' - ')) {
        value = value.split(' - ')[0].trim();
    }

    value = value.replace(/(\d),(\d)/g, '$1.$2').trim();
    if (!value) return '';

    const voltageMatch = value.match(/^(\d+(?:\.\d+)?)\s*(в|v)\b/i);
    if (voltageMatch) {
        return `${voltageMatch[1]}В`;
    }

    const weightMatch = value.match(/^(\d+(?:\.\d+)?)\s*(кг|kg|г|g)\b/i);
    if (weightMatch) {
        const numberText = weightMatch[1];
        const unitRaw = weightMatch[2].toLowerCase();
        const unitText = unitRaw === 'kg' ? 'кг' : unitRaw === 'g' ? 'г' : unitRaw;
        return `${numberText} ${unitText}`;
    }

    value = value
        .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
        .trim();

    if (value.endsWith('.')) value = value.slice(0, -1).trim();

    return value;
}

function pickBetterDisplayValue(currentValue, nextValue) {
    const current = String(currentValue || '').trim();
    const next = String(nextValue || '').trim();
    if (!current) return next;
    if (!next) return current;
    if (next.length < current.length) return next;
    return current;
}

class FilterService {
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
                    COUNT(CASE WHEN bestseller='true' THEN 1 END) as best
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
                    brands: brands.map((b) => ({ name: b.brand, count: +b.c })),
                    price: { min: +prices[0]?.min || 0, max: +prices[0]?.max || 0 },
                    special: {
                        sale: +special[0]?.sale,
                        bestseller: +special[0]?.best
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

    static _groupParams(params) {
        const groupedParams = {};

        for (const row of params) {
            const rawName = row.parameter_name;
            if (isBlacklistedParameterName(rawName)) continue;

            const name = normalizeParameterName(rawName);
            const slug = generateFilterSlug(name);
            if (!slug) continue;

            const value = normalizeParameterValue(row.parameter_value);
            if (!value) continue;

            const valueSlug = generateFilterSlug(value);
            if (!valueSlug) continue;

            if (!groupedParams[slug]) {
                groupedParams[slug] = {
                    title: name,
                    slug: slug,
                    options: [],
                    _optionsBySlug: new Map()
                };
            }

            const group = groupedParams[slug];
            const existing = group._optionsBySlug.get(valueSlug);

            if (existing) {
                existing.count += parseInt(row.count, 10);
                existing.value = pickBetterDisplayValue(existing.value, value);
                continue;
            }

            if (group.options.length >= 15) continue;

            const option = {
                value: value,
                value_slug: valueSlug,
                count: parseInt(row.count, 10)
            };

            group.options.push(option);
            group._optionsBySlug.set(valueSlug, option);
        }

        for (const key of Object.keys(groupedParams)) {
            delete groupedParams[key]._optionsBySlug;
        }

        return groupedParams;
    }
}

module.exports = FilterService;
