const { Product, SubCategory, CategoryMapping } = require('../db');
const { Op } = require('sequelize');

// ТОЧНИЙ маппінг: XML назва -> твоя підкатегорія
// Ключові слова мають ПОВНІСТЮ співпадати
const EXACT_MAPPING = {
    // ========== АКУМУЛЯТОРНИЙ ІНСТРУМЕНТ ==========
    'акумуляторні шуруповерти': 'ak-shurupovert',
    'акумуляторні кутошліфувальні машини': 'ak-bolgarka',
    'акумуляторні перфоратори': 'ak-perforator',
    'акумуляторні гайковерти': 'ak-gaykovert',
    'акумуляторні гайковерти та гвинтоверти': 'ak-gaykovert',
    'акумуляторні дискові пилки': 'ak-pyla',
    'акумуляторні пилки': 'ak-pyla',
    'акумуляторні ланцюгові пилки': 'ak-pyla',
    'акумуляторні торцювальні пили': 'ak-pyla',
    'акумуляторні лобзики': 'ak-lobzyk',
    'акумуляторні шабельні пили': 'ak-lobzyk',
    'акумуляторні компресори': 'ak-kompresor',
    'акумулятори і зарядки': 'ak-batareya',
    'акумуляторні реноватори': 'ak-renovator',

    // Акумуляторна садова техніка
    'акумуляторні секатори': 'ak-sad',
    'акумуляторні коси': 'ak-sad',
    'акумуляторні кущорізи': 'ak-sad',
    'акумуляторні газонокосарки': 'ak-sad',
    'акумуляторні пилососи-повітродувки': 'ak-sad',
    'акумуляторні обприскувачі': 'ak-sad',
    'акумуляторні снігоприбирачі': 'ak-sad',
    'акумуляторні мийки': 'ak-sad',
    'акумуляторні машинки для стрижки овець': 'ak-sad',

    // Акумуляторне інше -> batareya (як "різне")
    'акумуляторні ліхтарі': 'ak-batareya',
    'акумуляторні будівельні пилососи': 'ak-batareya',
    'акумуляторні паяльники': 'ak-batareya',
    'акумуляторні фрезери': 'ak-batareya',
    'акумуляторні рубанки': 'ak-batareya',
    'акумуляторні фарбопульти': 'ak-batareya',
    'акумуляторні ексцентрики': 'ak-batareya',
    'акумуляторні гравірувальні машини': 'ak-batareya',
    'акумуляторні степлери': 'ak-batareya',
    'акумуляторні фени': 'ak-batareya',
    'акумуляторні пістолети для герметика': 'ak-batareya',
    'акумуляторні полірувальні машини': 'ak-batareya',
    'акумуляторні вібраційні присоски': 'ak-batareya',
    'акумуляторні будівельні міксери': 'ak-batareya',
    'акумуляторні вентилятори': 'ak-batareya',
    'акумуляторні ножиці по металу': 'ak-batareya',
    'акумуляторні заклепувальні пістолети': 'ak-batareya',
    'акумуляторні будівельні радіоприймачі': 'ak-batareya',

    // ========== ЕЛЕКТРОІНСТРУМЕНТ ==========
    'перфоратори': 'el-perforator',
    'кутошліфувальні машини': 'el-bolgarka',
    'дрилі': 'el-drel',
    'електролобзики': 'el-lobzyk',
    'відбійні молотки': 'el-molotok',
    'гравери': 'el-graver',
    'шабельні пили': 'el-pyla',
    'дискові пили': 'el-pyla',
    'ланцюгові пили': 'el-pyla',
    'паяльники для труб': 'el-payalnik',
    'будівельні фени': 'el-fen',
    'фарбопульти електричні': 'el-fen',

    // Шліфувальні
    'полірувальні машини': 'el-shlif',
    'прямі шліфувальні машини': 'el-shlif',
    'плоскошліфувальні машини': 'el-shlif',
    'ексцентрики': 'el-shlif',
    'стрічкові машини': 'el-shlif',
    'машини шліфувальні (жирафи)': 'el-shlif',

    // Інше електро
    'шуруповерти': 'el-drel',
    'гайковерти': 'el-drel',
    'лазерні рівні': 'el-drel',
    'металорізи': 'el-bolgarka',
    'штроборізи': 'el-bolgarka',
    'ножиці': 'el-shlif',
    'будівельні міксери': 'el-drel',

    // ========== ВЕРСТАТИ ==========
    'торцювальні пили': 'st-tortsovochna',
    'стаціонарні циркулярні пили': 'st-tsyrkulyarka',
    'фрезери': 'st-frezer',
    'електрорубанки': 'st-rubanok',
    'рейсмуси': 'st-rubanok',
    'плиткорізи': 'st-plytkoriz',
    'свердлильні верстати': 'st-sverdlylny',
    'токарні верстати': 'st-sverdlylny',
    'верстати по металу': 'st-sverdlylny',
    'верстати універсальні': 'st-sverdlylny',
    'стрічкові та лобзикові верстати': 'st-sverdlylny',
    'стенди та верстаки': 'st-sverdlylny',
    'точильні верстати': 'st-tochylo',
    'верстати для заточування ланцюгів': 'st-tochylo',
    'верстати для заточування свердел': 'st-tochylo',
    'верстати для заточування пильних дисків': 'st-tochylo',
    'гріндери': 'st-tochylo',

    // ========== ЗВАРЮВАННЯ ==========
    'зварювальні апарати': 'zv-invertor',
    'зварювальні напівавтомати': 'zv-napivavtomat',
    'плазморізи': 'zv-plazmoriz',
    'маски зварника': 'zv-maska',
    'зварювальні магніти': 'zv-material',
    'зварювальні дроти': 'zv-material',
    'зварювальні пальники': 'zv-material',
    'зварювальні електроди': 'zv-material',

    // ========== САДОВА ТЕХНІКА ==========
    'бензопили': 'sad-benzopyla',
    'мотокоси і тримери': 'sad-motokosa',
    'коси бензинові': 'sad-motokosa',
    'газонокосарки': 'sad-gazonokosarka',
    'бензогазонокосарки': 'sad-gazonokosarka',
    'скарифікатори для газону': 'sad-gazonokosarka',
    'бензобури': 'sad-motobur',
    'обприскувачі': 'sad-opryskuvach',
    'подрібнювачі гілок': 'sad-podribnyuvach',
    'кормоподрібнювачі': 'sad-podribnyuvach',
    'дроворізи': 'sad-podribnyuvach',
    'пилососи-повітродувки': 'sad-pylosos',
    'дренажно-фекальні насоси': 'sad-nasos',
    'струменеві насоси': 'sad-nasos',
    'занурювальні вібраційні насоси': 'sad-nasos',
    'занурювальні насоси': 'sad-nasos',
    'мотопомпи бензинові': 'sad-nasos',
    'мийки високого тиску': 'sad-nasos',
    'кущорізи': 'sad-motokosa',
    'культиватори та мотоблоки бензинові': 'sad-motokosa',
    'машинки для стрижки овець': 'sad-motokosa',

    // ========== БУДІВНИЦТВО ==========
    'генератори бензинові': 'bud-generator',
    'генератори дизельні': 'bud-generator',
    'компресори': 'bud-kompresor',
    'повітряні компресори': 'bud-kompresor',
    'бетонозмішувачі': 'bud-betonomishalka',
    'вібратори глибинні': 'bud-betonomishalka',
    'будівельні пилососи': 'bud-pylosos',
    'аксесуари до будівельного пилососу': 'bud-pylosos',
    'тепловентилятори': 'bud-teplo',
    'газові теплові гармати': 'bud-teplo',
    'осушувачі повітря промислові': 'bud-teplo',
    'подовжувачі електричні': 'bud-teplo',
    'драбини-стрем\'янки': 'bud-drabyna',
    'універсальні драбини': 'bud-drabyna',
    'драбини приставні': 'bud-drabyna',
    'підйомники': 'bud-drabyna',

    // ========== ПНЕВМО -> bud-kompresor ==========
    'гайковерти пневматичні': 'bud-kompresor',
    'гравери пневматичні': 'bud-kompresor',
    'маслянки пневматичні': 'bud-kompresor',
    'набори пневматичного інструменту': 'bud-kompresor',
    'фарбопульти пневматичні': 'bud-kompresor',
    'піскоструминні розпилювачі пневматичні': 'bud-kompresor',
    'пістолети для монтажної піни пневматичні': 'bud-kompresor',
    'пістолети для накачування шин пневматичні': 'bud-kompresor',
    'пістолети продувальні пневматичні': 'bud-kompresor',
    'пристрої підготовки та очищення повітря': 'bud-kompresor',
    'тріскачки пневматичні': 'bud-kompresor',
    'шланги високого тиску': 'bud-kompresor',

    // ========== АВТО ==========
    'домкрати гідравлічні': 'avto-instrument',
    'лещата': 'avto-instrument',
    'пуско-зарядні пристрої': 'avto-instrument',
    'акційні набори': 'avto-nabor',
    'набори головок торцевих': 'avto-nabor',
    'набори біт': 'avto-nabor',
    'сумки для інструментів': 'avto-nabor',

    // ========== ВИТРАТНИКИ ==========
    'абразивні диски по металу': 'roz-dysk',
    'алмазні диски': 'roz-dysk',
    'пильні диски': 'roz-dysk',
    'заточні кола': 'roz-dysk',
    'круги шліфувальні самозачепні': 'roz-dysk',
    'пелюсткові шліфувальні круги': 'roz-dysk',
    'волосінь для тримерів': 'roz-sad',
    'котушки для садових тримерів': 'roz-sad',
    'ножі для садової техніки': 'roz-sad',
    'ланцюги для ланцюгових пил': 'roz-sad',
    'шини для пил': 'roz-sad',
    'оливи для бензоінструменту': 'roz-sad',
    'аксесуари для тримерів': 'roz-sad',
    'шланги і котушки': 'roz-sad',
    'аксесуари до кшм': 'roz-dysk',
    'аксесуари для шліфмашини': 'roz-dysk',
    'стружковідсмоктувачі': 'bud-pylosos',

    // ========== ТРАНСПОРТ ==========
    'електросамокати': 'avto-nabor'
};

// Нормалізація назви (lowercase, прибрати зайве)
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// Знайти маппінг
function findMapping(categoryName) {
    const normalized = normalizeName(categoryName);

    // 1. Точне співпадіння
    if (EXACT_MAPPING[normalized]) {
        return { myCatId: EXACT_MAPPING[normalized], confidence: 100 };
    }

    // 2. Часткове співпадіння (якщо назва містить ключ)
    for (const [key, value] of Object.entries(EXACT_MAPPING)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return { myCatId: value, confidence: 80 };
        }
    }

    // 3. Не знайдено
    return null;
}

async function mapProductsAfterImport(supplierPrefix = 'DEFAULT') {
    const stats = {
        mapped: 0,
        skipped: 0,
        details: [],
        unmapped: []
    };

    try {
        const subCategories = await SubCategory.findAll({
            where: {
                sub_category_id: { [Op.like]: `${supplierPrefix}_SUBCAT_%` }
            },
            raw: true
        });

        console.log(`[AutoMap] Знайдено ${subCategories.length} підкатегорій`);

        for (const subCat of subCategories) {
            if (subCat.sub_category_id.includes('ROOT')) continue;

            const productCount = await Product.count({
                where: { sub_category_id: subCat.sub_category_id }
            });

            if (productCount === 0) continue;

            const match = findMapping(subCat.sub_category_name);

            if (match) {
                // Перевіряємо чи існує цільова категорія
                const targetCat = await SubCategory.findByPk(match.myCatId);

                if (targetCat) {
                    const [updatedCount] = await Product.update(
                        { sub_category_id: match.myCatId },
                        {
                            where: {
                                sub_category_id: subCat.sub_category_id,
                                [Op.or]: [
                                    { is_manual_category: false },
                                    { is_manual_category: null }
                                ]
                            }
                        }
                    );

                    if (updatedCount > 0) {
                        stats.mapped += updatedCount;
                        stats.details.push({
                            from: subCat.sub_category_name,
                            to: match.myCatId,
                            confidence: match.confidence,
                            count: updatedCount
                        });
                        console.log(`  ✅ ${subCat.sub_category_name} → ${match.myCatId} (${updatedCount})`);
                    }
                } else {
                    stats.skipped += productCount;
                    stats.unmapped.push({
                        name: subCat.sub_category_name,
                        productCount,
                        suggestedMapping: match.myCatId,
                        reason: 'target_not_exists'
                    });
                }
            } else {
                stats.skipped += productCount;
                stats.unmapped.push({
                    name: subCat.sub_category_name,
                    productCount,
                    reason: 'no_mapping'
                });
                console.log(`  ❌ ${subCat.sub_category_name} - немає маппінгу (${productCount})`);
            }
        }

        return stats;
    } catch (error) {
        console.error('[AutoMap] Помилка:', error);
        throw error;
    }
}

module.exports = {
    findMapping,
    mapProductsAfterImport,
    EXACT_MAPPING
};
