const { Product, SubCategory, CategoryMapping } = require('../db');
const { Op } = require('sequelize');

const MAPPING_RULES = [
    { keywords: ['акумуляторн', 'шуруповерт'], target: 'ak-shurupovert', priority: 100 },
    { keywords: ['акумуляторн', 'перфоратор'], target: 'ak-perforator', priority: 100 },
    { keywords: ['акумуляторн', 'кутошліф'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['акумуляторн', 'болгарк'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['акумуляторн', 'гайковерт'], target: 'ak-gaykovert', priority: 100 },
    { keywords: ['акумуляторн', 'гвинтоверт'], target: 'ak-gaykovert', priority: 100 },
    { keywords: ['акумуляторн', 'лобзик'], target: 'ak-lobzyk', priority: 100 },
    { keywords: ['акумуляторн', 'шабельн'], target: 'ak-lobzyk', priority: 100 },
    { keywords: ['акумуляторн', 'компресор'], target: 'ak-kompresor', priority: 100 },
    { keywords: ['акумуляторн', 'реноватор'], target: 'ak-renovator', priority: 100 },
    { keywords: ['акумуляторн', 'багатофункц'], target: 'ak-renovator', priority: 100 },
    { keywords: ['акумуляторн', 'торцюв', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['акумуляторн', 'шабельн', 'пил'], target: 'ak-lobzyk', priority: 105 },
    { keywords: ['акумуляторн', 'дисков', 'пил'], target: 'ak-pyla', priority: 100 },
    { keywords: ['акумуляторн', 'ланцюгов'], target: 'ak-pyla', priority: 100 },
    { keywords: ['акумуляторн', 'пил'], target: 'ak-pyla', priority: 95 },
    { keywords: ['акумуляторн', 'секатор'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'кос'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'тример'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'кущоріз'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'газонокосарк'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'повітродув'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'пилосос', 'повітродув'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'обприскувач'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'снігоприбирач'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'мийк'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'насос'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумулятор', 'зарядк'], target: 'ak-batareya', priority: 100 },
    { keywords: ['акумулятори'], target: 'ak-batareya', priority: 90, exact: true },
    { keywords: ['акумуляторн', 'ліхтар'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'пилосос'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'паяльник'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'фрезер'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'рубанок'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'фарбопульт'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'шліфувальн'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'ексцентрик'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'гравер'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'степлер'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'фен'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'полірувальн'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'міксер'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'вібрацій'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'вентилятор'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'ножиц'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'заклепув'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'радіоприймач'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн', 'присоск'], target: 'ak-batareya', priority: 85 },
    { keywords: ['акумуляторн'], target: 'ak-batareya', priority: 50 },
    { keywords: ['перфоратор'], target: 'el-perforator', priority: 80 },
    { keywords: ['кутошліфувальн'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['болгарк'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['металоріз'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['штроборіз'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['дрил'], target: 'el-drel', priority: 80 },
    { keywords: ['шуруповерт'], target: 'el-drel', priority: 75 },
    { keywords: ['міксер', 'будівельн'], target: 'el-drel', priority: 80 },
    { keywords: ['електролобзик'], target: 'el-lobzyk', priority: 80 },
    { keywords: ['лобзик'], target: 'el-lobzyk', priority: 75 },
    { keywords: ['відбійн', 'молоток'], target: 'el-molotok', priority: 80 },
    { keywords: ['відбійн'], target: 'el-molotok', priority: 75 },
    { keywords: ['гравер'], target: 'el-graver', priority: 75 },
    { keywords: ['паяльник', 'труб'], target: 'el-payalnik', priority: 80 },
    { keywords: ['будівельн', 'фен'], target: 'el-fen', priority: 80 },
    { keywords: ['технічн', 'фен'], target: 'el-fen', priority: 80 },
    { keywords: ['фарбопульт', 'електричн'], target: 'el-fen', priority: 80 },
    { keywords: ['фарбопульт'], target: 'el-fen', priority: 70 },
    { keywords: ['степлер'], target: 'el-fen', priority: 70 },
    { keywords: ['гайковерт'], target: 'el-drel', priority: 70 },
    { keywords: ['лазерн', 'рівн'], target: 'el-graver', priority: 75 },
    { keywords: ['ножиц'], target: 'el-shlif', priority: 70 },
    { keywords: ['шабельн', 'пил'], target: 'el-pyla', priority: 85 },
    { keywords: ['дисков', 'пил'], target: 'el-pyla', priority: 85 },
    { keywords: ['полірувальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфувальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфмашин'], target: 'el-shlif', priority: 80 },
    { keywords: ['плоскошліфувальн'], target: 'el-shlif', priority: 80 },
    { keywords: ['ексцентрик'], target: 'el-shlif', priority: 75 },
    { keywords: ['стрічков', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['жираф'], target: 'el-shlif', priority: 80 },
    { keywords: ['прям', 'шліфувальн'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфувальн', 'інструмент'], target: 'el-shlif', priority: 70 },
    { keywords: ['стаціонарн', 'циркулярн'], target: 'st-tsyrkulyarka', priority: 90 },
    { keywords: ['стаціонарн', 'пил'], target: 'st-tsyrkulyarka', priority: 90 },
    { keywords: ['торцювальн', 'пил'], target: 'st-tortsovochna', priority: 90 },
    { keywords: ['циркулярн', 'пил'], target: 'st-tsyrkulyarka', priority: 85 },
    { keywords: ['циркулярн'], target: 'st-tsyrkulyarka', priority: 75 },
    { keywords: ['фрезер'], target: 'st-frezer', priority: 75 },
    { keywords: ['електрорубанок'], target: 'st-rubanok', priority: 85 },
    { keywords: ['рубанок'], target: 'st-rubanok', priority: 75 },
    { keywords: ['рейсмус'], target: 'st-rubanok', priority: 80 },
    { keywords: ['плиткоріз'], target: 'st-plytkoriz', priority: 80 },
    { keywords: ['свердлильн', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['токарн', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['верстат', 'метал'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['верстат', 'універсальн'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['стрічков', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['лобзиков', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['стенд'], target: 'st-sverdlylny', priority: 75 },
    { keywords: ['верстак'], target: 'st-sverdlylny', priority: 75 },
    { keywords: ['точильн', 'верстат'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'ланцюг'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'свердел'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'диск'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'нож'], target: 'st-tochylo', priority: 85 },
    { keywords: ['гріндер'], target: 'st-tochylo', priority: 80 },
    { keywords: ['заточк'], target: 'st-tochylo', priority: 75 },
    { keywords: ['зварювальн', 'апарат'], target: 'zv-invertor', priority: 85 },
    { keywords: ['зварювальн', 'інвертор'], target: 'zv-invertor', priority: 85 },
    { keywords: ['зварювальн', 'напівавтомат'], target: 'zv-napivavtomat', priority: 85 },
    { keywords: ['плазморіз'], target: 'zv-plazmoriz', priority: 85 },
    { keywords: ['маск', 'зварник'], target: 'zv-maska', priority: 85 },
    { keywords: ['зварювальн', 'магніт'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'дріт'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'дрот'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'пальник'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'електрод'], target: 'zv-material', priority: 85 },
    { keywords: ['бензопил'], target: 'sad-benzopyla', priority: 90 },
    { keywords: ['ланцюгов', 'пил'], target: 'sad-elektropyla', priority: 85 },
    { keywords: ['електропил'], target: 'sad-elektropyla', priority: 85 },
    { keywords: ['мотокос'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['тример'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['кос', 'бензинов'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['кущоріз'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['секатор'], target: 'sad-motokosa', priority: 75 },
    { keywords: ['газонокосарк'], target: 'sad-gazonokosarka', priority: 85 },
    { keywords: ['бензогазонокосарк'], target: 'sad-gazonokosarka', priority: 85 },
    { keywords: ['скарифікатор'], target: 'sad-gazonokosarka', priority: 80 },
    { keywords: ['культиватор'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['мотоблок'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['бензобур'], target: 'sad-motobur', priority: 85 },
    { keywords: ['мотобур'], target: 'sad-motobur', priority: 85 },
    { keywords: ['обприскувач'], target: 'sad-opryskuvach', priority: 85 },
    { keywords: ['подрібнювач', 'гілок'], target: 'sad-podribnyuvach', priority: 85 },
    { keywords: ['кормоподрібнювач'], target: 'sad-podribnyuvach', priority: 85 },
    { keywords: ['дроворіз'], target: 'sad-podribnyuvach', priority: 80 },
    { keywords: ['повітродув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['пилосос', 'повітродув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['насос', 'дренаж'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'фекальн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'струменев'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'занурювальн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'вібраційн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['мотопомп'], target: 'sad-nasos', priority: 85 },
    { keywords: ['мийк', 'високого тиску'], target: 'sad-nasos', priority: 80 },
    { keywords: ['машинк', 'стрижк', 'овець'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['генератор', 'бензинов'], target: 'bud-generator', priority: 85 },
    { keywords: ['генератор', 'дизельн'], target: 'bud-generator', priority: 85 },
    { keywords: ['генератор'], target: 'bud-generator', priority: 75 },
    { keywords: ['компресор'], target: 'bud-kompresor', priority: 75 },
    { keywords: ['повітрян', 'компресор'], target: 'bud-kompresor', priority: 80 },
    { keywords: ['пневматичн'], target: 'bud-kompresor', priority: 80 },
    { keywords: ['бетонозмішувач'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['вібратор', 'глибинн'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['ущільнювач', 'бетон'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['будівельн', 'пилосос'], target: 'bud-pylosos', priority: 85 },
    { keywords: ['стружковідсмоктувач'], target: 'bud-pylosos', priority: 80 },
    { keywords: ['тепловентилятор'], target: 'bud-teplo', priority: 85 },
    { keywords: ['теплов', 'гармат'], target: 'bud-teplo', priority: 85 },
    { keywords: ['обігрівач'], target: 'bud-teplo', priority: 80 },
    { keywords: ['осушувач'], target: 'bud-teplo', priority: 80 },
    { keywords: ['подовжувач', 'електричн'], target: 'bud-teplo', priority: 70 },
    { keywords: ['драбин'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['стрем\'янк'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['підйомник'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['будівельн', 'міксер'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['домкрат'], target: 'avto-instrument', priority: 80 },
    { keywords: ['лещат'], target: 'avto-instrument', priority: 80 },
    { keywords: ['пуско', 'зарядн'], target: 'avto-instrument', priority: 85 },
    { keywords: ['набор', 'інструмент'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набір', 'інструмент'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набор', 'головок'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набір', 'головок'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набор', 'біт'], target: 'avto-nabor', priority: 80 },
    { keywords: ['акційн', 'набор'], target: 'avto-nabor', priority: 80 },
    { keywords: ['сумк', 'інструмент'], target: 'avto-nabor', priority: 75 },
    { keywords: ['електросамокат'], target: 'avto-nabor', priority: 70 },
    { keywords: ['абразивн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['алмазн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['пильн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['заточн', 'кол'], target: 'roz-dysk', priority: 85 },
    { keywords: ['шліфувальн', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['пелюстков', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['аксесуар', 'кшм'], target: 'roz-dysk', priority: 80 },
    { keywords: ['аксесуар', 'шліфмашин'], target: 'roz-dysk', priority: 80 },
    { keywords: ['волосінь', 'тример'], target: 'roz-sad', priority: 85 },
    { keywords: ['волосінь'], target: 'roz-sad', priority: 75 },
    { keywords: ['котушк', 'тример'], target: 'roz-sad', priority: 85 },
    { keywords: ['нож', 'садов'], target: 'roz-sad', priority: 85 },
    { keywords: ['ланцюг', 'пил'], target: 'roz-sad', priority: 85 },
    { keywords: ['шин', 'пил'], target: 'roz-sad', priority: 85 },
    { keywords: ['олив', 'бензо'], target: 'roz-sad', priority: 85 },
    { keywords: ['олив'], target: 'roz-sad', priority: 70 },
    { keywords: ['аксесуар', 'тример'], target: 'roz-sad', priority: 80 },
    { keywords: ['шланг', 'котушк'], target: 'roz-sad', priority: 75 },
    { keywords: ['аксесуар', 'пилосос'], target: 'bud-pylosos', priority: 80 },
    { keywords: ['аксесуар'], target: 'roz-dysk', priority: 50 },
    { keywords: ['багатофункціональн', 'інструмент'], target: 'ak-renovator', priority: 80 },
    { keywords: ['електрорубанк'], target: 'st-rubanok', priority: 85 },
    { keywords: ['вібраційн', 'присоск'], target: 'bud-betonomishalka', priority: 80 },
];

const IGNORE_CATEGORIES = [
    'новинки', 'хіти продажів', 'акції', 'розпродаж',
    'другое оборудование', 'інше', 'електроінструмент',
    'деревообробний інструмент',
    'зварювальне обладнання',
    'садово парковий інструмент',
    'бензоінструменти',
    'будівельна техніка та обладнання',
    'верстати',
    'автоінструмент',
    'електротранспорт',
];

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[''`ʼ]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function matchesAllKeywords(text, keywords) {
    const normalized = normalizeText(text);
    return keywords.every(kw => normalized.includes(kw.toLowerCase()));
}

function findBestMapping(categoryName, parentCategoryName = null) {
    const normalized = normalizeText(categoryName);

    const fullContext = parentCategoryName
        ? `${normalizeText(parentCategoryName)} ${normalized}`
        : normalized;

    let bestMatch = null;
    let bestPriority = 0;

    for (const rule of MAPPING_RULES) {
        if (rule.exact && normalized === rule.keywords[0].toLowerCase()) {
            if (rule.priority > bestPriority) {
                bestMatch = rule;
                bestPriority = rule.priority;
            }
            continue;
        }

        for (const text of [fullContext, normalized]) {
            if (matchesAllKeywords(text, rule.keywords)) {
                if (rule.priority > bestPriority) {
                    bestMatch = rule;
                    bestPriority = rule.priority;
                }
                break;
            }
        }
    }

    if (bestMatch) {
        return {
            target: bestMatch.target,
            confidence: bestPriority,
            keywords: bestMatch.keywords
        };
    }

    const isIgnored = IGNORE_CATEGORIES.some(ignore =>
        normalized === ignore || normalized.includes(ignore)
    );

    if (isIgnored) {
        return { target: null, confidence: 0, reason: 'ignored' };
    }

    return { target: null, confidence: 0, reason: 'no_match' };
}


async function getOrCreateMapping(supplierPrefix, externalCategoryId, categoryName, parentCategoryName = null) {
    const existingMapping = await CategoryMapping.findOne({
        where: {
            supplier_prefix: supplierPrefix,
            external_category_id: String(externalCategoryId)
        }
    });

    if (existingMapping) {
        if (!existingMapping.external_category_name) {
            await existingMapping.update({
                external_category_name: categoryName,
                parent_category_name: parentCategoryName
            });
        }

        return {
            internalCategoryId: existingMapping.internal_sub_category_id,
            source: 'database',
            isNew: false
        };
    }

    const autoMapping = findBestMapping(categoryName, parentCategoryName);
    let internalCategoryId = null;

    if (autoMapping.target) {
        const targetExists = await SubCategory.findByPk(autoMapping.target);
        if (targetExists) {
            internalCategoryId = autoMapping.target;
        }
    }

    try {
        await CategoryMapping.create({
            supplier_prefix: supplierPrefix,
            external_category_id: String(externalCategoryId),
            external_category_name: categoryName,
            parent_category_name: parentCategoryName,
            internal_sub_category_id: internalCategoryId
        });
    } catch (e) {
        if (!e.message.includes('unique')) {
            console.error('Error creating mapping:', e.message);
        }
    }

    if (internalCategoryId) {
        return {
            internalCategoryId: internalCategoryId,
            source: 'auto',
            confidence: autoMapping.confidence,
            keywords: autoMapping.keywords,
            isNew: true
        };
    }

    return {
        internalCategoryId: null,
        source: 'none',
        reason: autoMapping.reason || 'no_match',
        originalName: categoryName
    };
}

async function mapCategoriesFromXML(supplierPrefix, categories) {
    const results = {
        mapped: [],
        unmapped: [],
        existing: []
    };

    const categoryMap = new Map();
    categories.forEach(cat => {
        categoryMap.set(String(cat.id), cat);
    });

    for (const cat of categories) {
        let parentName = null;
        if (cat.parentId) {
            const parent = categoryMap.get(String(cat.parentId));
            parentName = parent?.name || null;
        }

        const mapping = await getOrCreateMapping(
            supplierPrefix,
            cat.id,
            cat.name,
            parentName
        );

        if (mapping.internalCategoryId) {
            if (mapping.isNew) {
                results.mapped.push({
                    externalId: cat.id,
                    externalName: cat.name,
                    internalId: mapping.internalCategoryId,
                    confidence: mapping.confidence,
                    source: mapping.source
                });
            } else {
                results.existing.push({
                    externalId: cat.id,
                    externalName: cat.name,
                    internalId: mapping.internalCategoryId
                });
            }
        } else {
            results.unmapped.push({
                externalId: cat.id,
                externalName: cat.name,
                parentName: parentName,
                reason: mapping.reason
            });
        }
    }

    return results;
}
async function getInternalCategoryForProduct(supplierPrefix, externalCategoryId) {
    const mapping = await CategoryMapping.findOne({
        where: {
            supplier_prefix: supplierPrefix,
            external_category_id: String(externalCategoryId)
        }
    });

    return mapping?.internal_sub_category_id || null;
}

async function getMappingsForSupplier(supplierPrefix) {
    const mappings = await CategoryMapping.findAll({
        where: { supplier_prefix: supplierPrefix },
        raw: true
    });

    const result = [];
    for (const m of mappings) {
        let internalCategoryName = null;
        if (m.internal_sub_category_id) {
            const internalCat = await SubCategory.findByPk(m.internal_sub_category_id);
            internalCategoryName = internalCat?.sub_category_name || 'Невідомо';
        }
        result.push({
            ...m,
            internalCategoryName
        });
    }

    return result;
}

async function clearMappingsForSupplier(supplierPrefix) {
    const deleted = await CategoryMapping.destroy({
        where: { supplier_prefix: supplierPrefix }
    });
    return deleted;
}
async function updateMapping(supplierPrefix, externalCategoryId, internalCategoryId) {
    const [mapping, created] = await CategoryMapping.upsert({
        supplier_prefix: supplierPrefix,
        external_category_id: String(externalCategoryId),
        internal_sub_category_id: internalCategoryId
    });

    return { mapping, created };
}

module.exports = {
    findBestMapping,
    getOrCreateMapping,
    mapCategoriesFromXML,
    getInternalCategoryForProduct,
    getMappingsForSupplier,
    clearMappingsForSupplier,
    updateMapping,
    MAPPING_RULES,
    IGNORE_CATEGORIES,
    normalizeText
};
