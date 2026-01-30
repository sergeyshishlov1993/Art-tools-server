// const { Op } = require('sequelize');
//
// const UA_MAP = {
//     'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
//     'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y',
//     'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
//     'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
//     'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh',
//     'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
//     'ю': 'yu', 'я': 'ya', 'ґ': 'g',
//     'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
//     'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y',
//     'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
//     'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
//     'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh',
//     'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '',
//     'Ю': 'Yu', 'Я': 'Ya', 'Ґ': 'G',
//     'Ъ': '', 'ъ': '', 'Ы': 'y', 'ы': 'y', 'Э': 'e', 'э': 'e'
// };
//
// /**
//  * Транслітерація кирилиці в латиницю
//  */
// function transliterate(text) {
//     return text.split('').map(char => UA_MAP[char] || char).join('');
// }
//
// /**
//  * Генерація slug для товару
//  */
// function generateSlug(productName, productId) {
//     if (!productName) return null;
//
//     let slug = transliterate(productName)
//         .replace(/[^a-zA-Z0-9\s-]/g, '')
//         .replace(/\s+/g, '-')
//         .replace(/-+/g, '-')
//         .trim()
//         .replace(/^-+|-+$/g, '')
//         .toLowerCase();
//
//     if (!slug) slug = 'product';
//     if (productId) slug = `${slug}-${productId}`;
//     if (slug.length > 500) slug = slug.substring(0, 500).replace(/-$/, '');
//
//     return slug;
// }
//
// /**
//  * Генерація slug для фільтра
//  */
// function generateFilterSlug(name) {
//     if (!name) return 'attr';
//
//     return transliterate(name)
//         .replace(/[^a-zA-Z0-9\s-]/g, '')
//         .replace(/\s+/g, '-')
//         .replace(/-+/g, '-')
//         .toLowerCase()
//         .trim();
// }
//
// /**
//  * Перевірка унікальності slug
//  */
// async function ensureUniqueSlug(slug, productId, Product) {
//     let uniqueSlug = slug;
//     let counter = 1;
//
//     while (true) {
//         const existing = await Product.findOne({
//             where: {
//                 slug: uniqueSlug,
//                 product_id: { [Op.ne]: productId }
//             }
//         });
//
//         if (!existing) return uniqueSlug;
//
//         uniqueSlug = `${slug}-${counter}`;
//         counter++;
//     }
// }
//
// module.exports = {
//     transliterate,
//     generateSlug,
//     generateFilterSlug,
//     ensureUniqueSlug
// };
//
'use strict';

const { Op } = require('sequelize');

const UA_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y',
    'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh',
    'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'yu', 'я': 'ya', 'ґ': 'g',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y',
    'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
    'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '',
    'Ю': 'Yu', 'Я': 'Ya', 'Ґ': 'G',
    'Ъ': '', 'ъ': '', 'Ы': 'y', 'ы': 'y', 'Э': 'e', 'э': 'e'
};

function transliterate(text) {
    return String(text).split('').map((char) => UA_MAP[char] || char).join('');
}

function normalizeSpaces(text) {
    return String(text)
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeDashes(text) {
    return String(text).replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
}

function sanitizeBase(text) {
    return normalizeSpaces(normalizeDashes(text));
}

function generateSlug(productName, productId) {
    if (!productName) return null;

    let slug = transliterate(sanitizeBase(productName))
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    if (!slug) slug = 'product';
    if (productId) slug = `${slug}-${productId}`;
    if (slug.length > 500) slug = slug.substring(0, 500).replace(/-$/, '');

    return slug;
}

function generateFilterSlug(name) {
    if (!name) return 'attr';

    return transliterate(sanitizeBase(name))
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .trim()
        .replace(/^-+|-+$/g, '');
}

function normalizeNumericFragments(text) {
    const input = String(text);
    const withDecimalPoint = input.replace(/(\d),(\d)/g, '$1.$2');
    const withNormalizedThousands = withDecimalPoint.replace(/(\d)[\u00A0\s](?=\d{3}(\D|$))/g, '$1');
    return withNormalizedThousands;
}

function generateFilterValueSlug(value) {
    if (!value) return 'value';

    const base = sanitizeBase(value);
    const normalizedNumbers = normalizeNumericFragments(base);

    const prepared = normalizedNumbers
        .replace(/[%°]/g, ' ')
        .replace(/\s*-\s*/g, '-')
        .replace(/\s*~\s*/g, ' ')
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s+/g, ' ')
        .trim();

    const slug = transliterate(prepared)
        .replace(/[^a-zA-Z0-9.\s\-\/]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .trim()
        .replace(/^-+|-+$/g, '');

    return slug || 'value';
}

async function ensureUniqueSlug(slug, productId, Product) {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
        const existing = await Product.findOne({
            where: {
                slug: uniqueSlug,
                product_id: { [Op.ne]: productId }
            }
        });

        if (!existing) return uniqueSlug;

        uniqueSlug = `${slug}-${counter}`;
        counter += 1;
    }
}

module.exports = {
    transliterate,
    generateSlug,
    generateFilterSlug,
    generateFilterValueSlug,
    ensureUniqueSlug
};