const { Product, SubCategory, CategoryMapping } = require('../db');
const { Op } = require('sequelize');

const MAPPING_RULES = [
    // ============================================
    // === НАБОРИ (НАЙВИЩИЙ ПРІОРИТЕТ) ===
    // ============================================
    { keywords: ['набір', 'акумуляторн'], target: 'ak-nabory', priority: 120 },
    { keywords: ['набор', 'акумуляторн'], target: 'ak-nabory', priority: 120 },
    { keywords: ['набір', 'аккумуляторн'], target: 'ak-nabory', priority: 120 },
    { keywords: ['набор', 'аккумуляторн'], target: 'ak-nabory', priority: 120 },
    { keywords: ['combo', 'kit'], target: 'ak-nabory', priority: 115 },
    { keywords: ['combo', 'set'], target: 'ak-nabory', priority: 115 },
    { keywords: ['powerline', 'набір'], target: 'ak-nabory', priority: 115 },
    { keywords: ['powerline', 'набор'], target: 'ak-nabory', priority: 115 },
    { keywords: ['набір №'], target: 'ak-nabory', priority: 110 },
    { keywords: ['набор №'], target: 'ak-nabory', priority: 110 },

    // ============================================
    // === АКУМУЛЯТОРНИЙ ІНСТРУМЕНТ (UKR + RUS) ===
    // ============================================

    // --- Шуруповерти ---
    { keywords: ['акумуляторн', 'шуруповерт'], target: 'ak-shurupovert', priority: 100 },
    { keywords: ['аккумуляторн', 'шуруповерт'], target: 'ak-shurupovert', priority: 100 },
    { keywords: ['аккумуляторн', 'дрель'], target: 'ak-shurupovert', priority: 100 },
    { keywords: ['ударн', 'шуруповерт', 'акумуляторн'], target: 'ak-shurupovert', priority: 105 },
    { keywords: ['ударн', 'акумуляторн', 'шуруповерт'], target: 'ak-shurupovert', priority: 105 },
    { keywords: ['gcd'], target: 'ak-shurupovert', priority: 95 }, // Grosser код

    // --- Перфоратори ---
    { keywords: ['акумуляторн', 'перфоратор'], target: 'ak-perforator', priority: 100 },
    { keywords: ['аккумуляторн', 'перфоратор'], target: 'ak-perforator', priority: 100 },
    { keywords: ['grh'], target: 'ak-perforator', priority: 95 }, // Grosser код

    // --- Болгарки ---
    { keywords: ['акумуляторн', 'кутошліф'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['акумуляторн', 'болгарк'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['акумуляторн', 'ушм'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['аккумуляторн', 'углов', 'шлифовальн'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['аккумуляторн', 'ушм'], target: 'ak-bolgarka', priority: 100 },
    { keywords: ['pga'], target: 'ak-bolgarka', priority: 95 }, // Profi-Tec код
    { keywords: ['dga'], target: 'ak-bolgarka', priority: 95 }, // Profi-Tec код

    // --- Гайковерти ---
    { keywords: ['акумуляторн', 'гайковерт'], target: 'ak-gaykovert', priority: 100 },
    { keywords: ['аккумуляторн', 'гайковерт'], target: 'ak-gaykovert', priority: 100 },
    { keywords: ['акумуляторн', 'гвинтоверт'], target: 'ak-gaykovert', priority: 100 },
    { keywords: ['gtw'], target: 'ak-gaykovert', priority: 95 }, // Grosser код

    // --- Лобзики ---
    { keywords: ['акумуляторн', 'лобзик'], target: 'ak-lobzyk', priority: 100 },
    { keywords: ['аккумуляторн', 'лобзик'], target: 'ak-lobzyk', priority: 100 },
    { keywords: ['акумуляторн', 'шабельн'], target: 'ak-lobzyk', priority: 100 },
    { keywords: ['аккумуляторн', 'сабельн'], target: 'ak-lobzyk', priority: 100 },

    // --- Пили ---
    { keywords: ['акумуляторн', 'ланцюгов', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['аккумуляторн', 'цепн', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['акумуляторн', 'дисков', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['аккумуляторн', 'дисков', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['аккумуляторн', 'универсальн', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['акумуляторн', 'циркулярн'], target: 'ak-pyla', priority: 100 },
    { keywords: ['акумуляторн', 'торцюв', 'пил'], target: 'ak-pyla', priority: 105 },
    { keywords: ['акумуляторн', 'пил'], target: 'ak-pyla', priority: 95 },
    { keywords: ['gcs'], target: 'ak-pyla', priority: 90 }, // Grosser код
    { keywords: ['pca'], target: 'ak-pyla', priority: 90 }, // Profi-Tec код

    // --- Компресори ---
    { keywords: ['акумуляторн', 'компресор'], target: 'ak-kompresor', priority: 100 },
    { keywords: ['аккумуляторн', 'компрессор'], target: 'ak-kompresor', priority: 100 },

    // --- Реноватори ---
    { keywords: ['акумуляторн', 'реноватор'], target: 'ak-renovator', priority: 100 },
    { keywords: ['акумуляторн', 'багатофункц'], target: 'ak-renovator', priority: 100 },
    { keywords: ['аккумуляторн', 'многофункц'], target: 'ak-renovator', priority: 100 },

    // === АКУМУЛЯТОРНИЙ САДОВИЙ ===
    { keywords: ['акумуляторн', 'ланцюгов', 'пил'], target: 'ak-sad', priority: 105 },
    { keywords: ['акумуляторн', 'секатор'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'кос'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'тример'], target: 'ak-sad', priority: 100 },
    { keywords: ['аккумуляторн', 'триммер'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'кущоріз'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'газонокосарк'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'повітродув'], target: 'ak-sad', priority: 100 },
    { keywords: ['аккумуляторн', 'воздуходув'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'обприскувач'], target: 'ak-sad', priority: 100 },
    { keywords: ['аккумуляторн', 'опрыскиватель'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'снігоприбирач'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'мийк'], target: 'ak-sad', priority: 100 },
    { keywords: ['акумуляторн', 'насос'], target: 'ak-sad', priority: 100 },
    { keywords: ['gbs'], target: 'ak-sad', priority: 90 }, // Grosser обприскувач

    // === АКУМУЛЯТОРИ ТА ЗАРЯДКИ ===
    { keywords: ['акумулятор', 'зарядк'], target: 'ak-batareya', priority: 110 },
    { keywords: ['акумулятор', 'зарядн', 'пристр'], target: 'ak-batareya', priority: 110 },
    { keywords: ['аккумулятор', 'зарядн'], target: 'ak-batareya', priority: 110 },
    { keywords: ['зарядн', 'пристр'], target: 'ak-batareya', priority: 100 },
    { keywords: ['акумуляторн', 'батаре'], target: 'ak-batareya', priority: 100 },
    { keywords: ['акумулятори'], target: 'ak-batareya', priority: 95, exact: true },

    // === ІНШИЙ АКУМУЛЯТОРНИЙ ІНСТРУМЕНТ ===
    { keywords: ['акумуляторн', 'ліхтар'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'пилосос'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'паяльник'], target: 'ak-inshe', priority: 85 },
    { keywords: ['аккумуляторн', 'паяльник'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'фрезер'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'рубанок'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'фарбопульт'], target: 'ak-inshe', priority: 85 },
    { keywords: ['аккумуляторн', 'краскопульт'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'шліфувальн'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'ексцентрик'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'гравер'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'степлер'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'фен'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'полірувальн'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'міксер'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'вібраційн'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'вентилятор'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'ножиц'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'заклепув'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'радіоприймач'], target: 'ak-inshe', priority: 85 },
    { keywords: ['акумуляторн', 'присоск'], target: 'ak-inshe', priority: 85 },

    // --- Детекція по ознаках акумуляторного (каркас, без АКБ, powerline, brushless) ---
    { keywords: ['каркас', 'шуруповерт'], target: 'ak-shurupovert', priority: 95 },
    { keywords: ['каркас', 'перфоратор'], target: 'ak-perforator', priority: 95 },
    { keywords: ['каркас', 'болгарк'], target: 'ak-bolgarka', priority: 95 },
    { keywords: ['каркас', 'гайковерт'], target: 'ak-gaykovert', priority: 95 },
    { keywords: ['каркас', 'пил'], target: 'ak-pyla', priority: 95 },
    { keywords: ['без аккумулятора', 'шуруповерт'], target: 'ak-shurupovert', priority: 95 },
    { keywords: ['без аккумулятора', 'перфоратор'], target: 'ak-perforator', priority: 95 },
    { keywords: ['без аккумулятора', 'углов', 'шлиф'], target: 'ak-bolgarka', priority: 95 },
    { keywords: ['без аккумулятора', 'гайковерт'], target: 'ak-gaykovert', priority: 95 },
    { keywords: ['без аккумулятора', 'пил'], target: 'ak-pyla', priority: 95 },
    { keywords: ['без акумулятора'], target: 'ak-inshe', priority: 80 },
    { keywords: ['powerline', 'шуруповерт'], target: 'ak-shurupovert', priority: 95 },
    { keywords: ['powerline', 'перфоратор'], target: 'ak-perforator', priority: 95 },
    { keywords: ['powerline', 'углов', 'шлиф'], target: 'ak-bolgarka', priority: 95 },
    { keywords: ['powerline', 'гайковерт'], target: 'ak-gaykovert', priority: 95 },
    { keywords: ['powerline', 'пил'], target: 'ak-pyla', priority: 95 },
    { keywords: ['powerline'], target: 'ak-inshe', priority: 80 },
    { keywords: ['brushless'], target: 'ak-inshe', priority: 75 },

    // FALLBACK для акумуляторного
    { keywords: ['акумуляторн'], target: 'ak-inshe', priority: 40 },
    { keywords: ['аккумуляторн'], target: 'ak-inshe', priority: 40 },

    // ============================================
    // === ВИТРАТНИКИ ДЛЯ САДУ (roz-sad) ===
    // ============================================
    { keywords: ['шина', 'пил'], target: 'roz-sad', priority: 90 },
    { keywords: ['ланцюг', 'пильн'], target: 'roz-sad', priority: 90 },
    { keywords: ['ланцюг', 'пил'], target: 'roz-sad', priority: 85 },
    { keywords: ['цепь', 'пил'], target: 'roz-sad', priority: 85 },
    { keywords: ['ліска', 'тример'], target: 'roz-sad', priority: 90 },
    { keywords: ['леска', 'триммер'], target: 'roz-sad', priority: 90 },
    { keywords: ['ліска'], target: 'roz-sad', priority: 75 },
    { keywords: ['волосінь', 'тример'], target: 'roz-sad', priority: 90 },
    { keywords: ['волосінь'], target: 'roz-sad', priority: 75 },
    { keywords: ['котушк', 'тример'], target: 'roz-sad', priority: 90 },
    { keywords: ['шпуля', 'бензокос'], target: 'roz-sad', priority: 90 },
    { keywords: ['шпуля', 'тример'], target: 'roz-sad', priority: 90 },
    { keywords: ['шпуля'], target: 'roz-sad', priority: 75 },
    { keywords: ['ніж', 'тример'], target: 'roz-sad', priority: 90 },
    { keywords: ['ніж', 'пластмасов'], target: 'roz-sad', priority: 85 },
    { keywords: ['нож', 'садов'], target: 'roz-sad', priority: 85 },
    { keywords: ['олив', 'бензо'], target: 'roz-sad', priority: 85 },
    { keywords: ['олив', 'ланцюг'], target: 'roz-sad', priority: 85 },
    { keywords: ['масло', 'цеп'], target: 'roz-sad', priority: 85 },
    { keywords: ['масло', 'пил'], target: 'roz-sad', priority: 85 },
    { keywords: ['олив'], target: 'roz-sad', priority: 70 },
    { keywords: ['аксесуар', 'тример'], target: 'roz-sad', priority: 80 },
    { keywords: ['шланг', 'котушк'], target: 'roz-sad', priority: 75 },
    { keywords: ['диск', 'победіт'], target: 'roz-sad', priority: 85 },

    // ============================================
    // === ЕЛЕКТРОІНСТРУМЕНТ ===
    // ============================================
    { keywords: ['перфоратор'], target: 'el-perforator', priority: 80 },
    { keywords: ['кутошліфувальн'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['болгарк'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['ушм'], target: 'el-bolgarka', priority: 75 },
    { keywords: ['углов', 'шлифмашин'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['металоріз'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['штроборіз'], target: 'el-bolgarka', priority: 80 },
    { keywords: ['дрил'], target: 'el-drel', priority: 80 },
    { keywords: ['дрель'], target: 'el-drel', priority: 80 },
    { keywords: ['шуруповерт'], target: 'el-drel', priority: 75 },
    { keywords: ['міксер', 'будівельн'], target: 'el-drel', priority: 80 },
    { keywords: ['миксер', 'строительн'], target: 'el-drel', priority: 80 },
    { keywords: ['електролобзик'], target: 'el-lobzyk', priority: 80 },
    { keywords: ['лобзик'], target: 'el-lobzyk', priority: 75 },
    { keywords: ['відбійн', 'молоток'], target: 'el-molotok', priority: 80 },
    { keywords: ['відбійн'], target: 'el-molotok', priority: 75 },
    { keywords: ['отбойн'], target: 'el-molotok', priority: 75 },
    { keywords: ['гравер'], target: 'el-graver', priority: 75 },
    { keywords: ['паяльник', 'труб'], target: 'el-payalnik', priority: 80 },
    { keywords: ['будівельн', 'фен'], target: 'el-fen', priority: 80 },
    { keywords: ['технічн', 'фен'], target: 'el-fen', priority: 80 },
    { keywords: ['строительн', 'фен'], target: 'el-fen', priority: 80 },
    { keywords: ['фарбопульт', 'електричн'], target: 'el-fen', priority: 80 },
    { keywords: ['краскопульт', 'электрич'], target: 'el-fen', priority: 80 },
    { keywords: ['фарбопульт'], target: 'el-fen', priority: 70 },
    { keywords: ['степлер'], target: 'el-fen', priority: 70 },
    { keywords: ['гайковерт'], target: 'el-drel', priority: 70 },
    { keywords: ['лазерн', 'рівн'], target: 'el-graver', priority: 75 },
    { keywords: ['ножиц'], target: 'el-shlif', priority: 70 },
    { keywords: ['шабельн', 'пил'], target: 'el-pyla', priority: 85 },
    { keywords: ['сабельн', 'пил'], target: 'el-pyla', priority: 85 },
    { keywords: ['дисков', 'пил'], target: 'el-pyla', priority: 85 },
    { keywords: ['полірувальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['полировальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфувальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['шлифовальн', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфмашин'], target: 'el-shlif', priority: 80 },
    { keywords: ['плоскошліфувальн'], target: 'el-shlif', priority: 80 },
    { keywords: ['ексцентрик'], target: 'el-shlif', priority: 75 },
    { keywords: ['стрічков', 'машин'], target: 'el-shlif', priority: 80 },
    { keywords: ['жираф'], target: 'el-shlif', priority: 80 },
    { keywords: ['прям', 'шліфувальн'], target: 'el-shlif', priority: 80 },
    { keywords: ['шліфувальн', 'інструмент'], target: 'el-shlif', priority: 70 },

    // ============================================
    // === ВЕРСТАТИ ===
    // ============================================
    { keywords: ['стаціонарн', 'циркулярн'], target: 'st-tsyrkulyarka', priority: 90 },
    { keywords: ['стаціонарн', 'пил'], target: 'st-tsyrkulyarka', priority: 90 },
    { keywords: ['торцювальн', 'пил'], target: 'st-tortsovochna', priority: 90 },
    { keywords: ['торцовочн', 'пил'], target: 'st-tortsovochna', priority: 90 },
    { keywords: ['циркулярн', 'пил'], target: 'st-tsyrkulyarka', priority: 85 },
    { keywords: ['циркулярн'], target: 'st-tsyrkulyarka', priority: 75 },
    { keywords: ['фрезер'], target: 'st-frezer', priority: 75 },
    { keywords: ['електрорубанок'], target: 'st-rubanok', priority: 85 },
    { keywords: ['рубанок'], target: 'st-rubanok', priority: 75 },
    { keywords: ['рейсмус'], target: 'st-rubanok', priority: 80 },
    { keywords: ['плиткоріз'], target: 'st-plytkoriz', priority: 80 },
    { keywords: ['плиткорез'], target: 'st-plytkoriz', priority: 80 },
    { keywords: ['свердлильн', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['сверлильн', 'станок'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['токарн', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['токарн', 'станок'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['верстат', 'метал'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['верстат', 'універсальн'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['стрічков', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['лобзиков', 'верстат'], target: 'st-sverdlylny', priority: 85 },
    { keywords: ['стенд'], target: 'st-sverdlylny', priority: 75 },
    { keywords: ['верстак'], target: 'st-sverdlylny', priority: 75 },
    { keywords: ['точильн', 'верстат'], target: 'st-tochylo', priority: 85 },
    { keywords: ['точильн', 'станок'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'ланцюг'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'свердел'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'диск'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточуван', 'нож'], target: 'st-tochylo', priority: 85 },
    { keywords: ['заточк'], target: 'st-tochylo', priority: 75 },
    { keywords: ['гріндер'], target: 'st-tochylo', priority: 80 },

    // ============================================
    // === ЗВАРЮВАННЯ ===
    // ============================================
    { keywords: ['зварювальн', 'апарат'], target: 'zv-invertor', priority: 85 },
    { keywords: ['сварочн', 'аппарат'], target: 'zv-invertor', priority: 85 },
    { keywords: ['зварювальн', 'інвертор'], target: 'zv-invertor', priority: 85 },
    { keywords: ['сварочн', 'инвертор'], target: 'zv-invertor', priority: 85 },
    { keywords: ['інвертор'], target: 'zv-invertor', priority: 75 },
    { keywords: ['инвертор'], target: 'zv-invertor', priority: 75 },
    { keywords: ['mma'], target: 'zv-invertor', priority: 80 },
    { keywords: ['зварювальн', 'напівавтомат'], target: 'zv-napivavtomat', priority: 85 },
    { keywords: ['сварочн', 'полуавтомат'], target: 'zv-napivavtomat', priority: 85 },
    { keywords: ['mig', 'mag'], target: 'zv-napivavtomat', priority: 85 },
    { keywords: ['mig'], target: 'zv-napivavtomat', priority: 80 },
    { keywords: ['плазморіз'], target: 'zv-plazmoriz', priority: 85 },
    { keywords: ['плазморез'], target: 'zv-plazmoriz', priority: 85 },
    { keywords: ['маск', 'зварник'], target: 'zv-maska', priority: 85 },
    { keywords: ['маска', 'сварщик'], target: 'zv-maska', priority: 85 },
    { keywords: ['маска', 'хамелеон'], target: 'zv-maska', priority: 85 },
    { keywords: ['зварювальн', 'магніт'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'дріт'], target: 'zv-material', priority: 85 },
    { keywords: ['сварочн', 'проволок'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'пальник'], target: 'zv-material', priority: 85 },
    { keywords: ['зварювальн', 'електрод'], target: 'zv-material', priority: 85 },
    { keywords: ['электрод'], target: 'zv-material', priority: 80 },

    // ============================================
    // === САДОВА ТЕХНІКА ===
    // ============================================
    { keywords: ['бензопил'], target: 'sad-benzopyla', priority: 90 },
    { keywords: ['ланцюгов', 'пил', 'електр'], target: 'sad-elektropyla', priority: 90 },
    { keywords: ['електропил'], target: 'sad-elektropyla', priority: 85 },
    { keywords: ['цепн', 'пил', 'электр'], target: 'sad-elektropyla', priority: 90 },
    { keywords: ['мотокос'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['бензокос'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['тример', 'бензинов'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['триммер', 'бензинов'], target: 'sad-motokosa', priority: 85 },
    { keywords: ['тример'], target: 'sad-motokosa', priority: 75 },
    { keywords: ['триммер'], target: 'sad-motokosa', priority: 75 },
    { keywords: ['кущоріз'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['кусторез'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['секатор'], target: 'sad-motokosa', priority: 75 },
    { keywords: ['газонокосарк'], target: 'sad-gazonokosarka', priority: 85 },
    { keywords: ['газонокосилк'], target: 'sad-gazonokosarka', priority: 85 },
    { keywords: ['бензогазонокосарк'], target: 'sad-gazonokosarka', priority: 85 },
    { keywords: ['скарифікатор'], target: 'sad-gazonokosarka', priority: 80 },
    { keywords: ['культиватор'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['мотоблок'], target: 'sad-motokosa', priority: 80 },
    { keywords: ['бензобур'], target: 'sad-motobur', priority: 85 },
    { keywords: ['мотобур'], target: 'sad-motobur', priority: 85 },
    { keywords: ['обприскувач'], target: 'sad-opryskuvach', priority: 85 },
    { keywords: ['опрыскиватель'], target: 'sad-opryskuvach', priority: 85 },
    { keywords: ['подрібнювач', 'гілок'], target: 'sad-podribnyuvach', priority: 85 },
    { keywords: ['измельчитель', 'веток'], target: 'sad-podribnyuvach', priority: 85 },
    { keywords: ['кормоподрібнювач'], target: 'sad-podribnyuvach', priority: 85 },
    { keywords: ['дроворіз'], target: 'sad-podribnyuvach', priority: 80 },
    { keywords: ['повітродув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['воздуходув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['пилосос', 'повітродув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['пылесос', 'воздуходув'], target: 'sad-pylosos', priority: 80 },
    { keywords: ['насос', 'дренаж'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'фекальн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'струменев'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'занурювальн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'погружн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['насос', 'вібраційн'], target: 'sad-nasos', priority: 85 },
    { keywords: ['мотопомп'], target: 'sad-nasos', priority: 85 },
    { keywords: ['мийк', 'високого тиску'], target: 'sad-nasos', priority: 80 },
    { keywords: ['мойка', 'высокого давлен'], target: 'sad-nasos', priority: 80 },
    { keywords: ['машинк', 'стрижк', 'овець'], target: 'sad-motokosa', priority: 80 },

    // ============================================
    // === БУДІВЕЛЬНЕ ОБЛАДНАННЯ ===
    // ============================================
    { keywords: ['генератор', 'бензинов'], target: 'bud-generator', priority: 85 },
    { keywords: ['генератор', 'дизельн'], target: 'bud-generator', priority: 85 },
    { keywords: ['генератор'], target: 'bud-generator', priority: 75 },
    { keywords: ['компресор'], target: 'bud-kompresor', priority: 75 },
    { keywords: ['компрессор'], target: 'bud-kompresor', priority: 75 },
    { keywords: ['повітрян', 'компресор'], target: 'bud-kompresor', priority: 80 },
    { keywords: ['пневматичн'], target: 'bud-kompresor', priority: 80 },
    { keywords: ['бетонозмішувач'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['бетономешалк'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['вібратор', 'глибинн'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['вибратор', 'глубинн'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['ущільнювач', 'бетон'], target: 'bud-betonomishalka', priority: 85 },
    { keywords: ['будівельн', 'пилосос'], target: 'bud-pylosos', priority: 85 },
    { keywords: ['строительн', 'пылесос'], target: 'bud-pylosos', priority: 85 },
    { keywords: ['стружковідсмоктувач'], target: 'bud-pylosos', priority: 80 },
    { keywords: ['тепловентилятор'], target: 'bud-teplo', priority: 85 },
    { keywords: ['теплов', 'гармат'], target: 'bud-teplo', priority: 85 },
    { keywords: ['теплов', 'пушк'], target: 'bud-teplo', priority: 85 },
    { keywords: ['обігрівач'], target: 'bud-teplo', priority: 80 },
    { keywords: ['обогреватель'], target: 'bud-teplo', priority: 80 },
    { keywords: ['осушувач'], target: 'bud-teplo', priority: 80 },
    { keywords: ['подовжувач', 'електричн'], target: 'bud-teplo', priority: 70 },
    { keywords: ['драбин'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['лестниц'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['стрем\'янк'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['стремянк'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['підйомник'], target: 'bud-drabyna', priority: 80 },
    { keywords: ['будівельн', 'міксер'], target: 'bud-betonomishalka', priority: 85 },

    // ============================================
    // === АВТОТОВАР ===
    // ============================================
    { keywords: ['домкрат'], target: 'avto-instrument', priority: 80 },
    { keywords: ['лещат'], target: 'avto-instrument', priority: 80 },
    { keywords: ['тиск'], target: 'avto-instrument', priority: 80 },
    { keywords: ['пуско', 'зарядн'], target: 'avto-instrument', priority: 85 },
    { keywords: ['набор', 'інструмент'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набір', 'інструмент'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набор', 'инструмент'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набор', 'головок'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набір', 'головок'], target: 'avto-nabor', priority: 80 },
    { keywords: ['набор', 'біт'], target: 'avto-nabor', priority: 80 },
    { keywords: ['акційн', 'набор'], target: 'avto-nabor', priority: 80 },
    { keywords: ['сумк', 'інструмент'], target: 'avto-nabor', priority: 75 },
    { keywords: ['електросамокат'], target: 'avto-nabor', priority: 70 },

    // ============================================
    // === ДИСКИ ТА РОЗХІДНИКИ ===
    // ============================================
    { keywords: ['абразивн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['алмазн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['пильн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['пильн', 'диск'], target: 'roz-dysk', priority: 85 },
    { keywords: ['заточн', 'кол'], target: 'roz-dysk', priority: 85 },
    { keywords: ['шліфувальн', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['шлифовальн', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['пелюстков', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['лепестков', 'круг'], target: 'roz-dysk', priority: 85 },
    { keywords: ['аксесуар', 'кшм'], target: 'roz-dysk', priority: 80 },
    { keywords: ['аксесуар', 'шліфмашин'], target: 'roz-dysk', priority: 80 },
    { keywords: ['аксесуар', 'пилосос'], target: 'bud-pylosos', priority: 80 },
    { keywords: ['аксесуар'], target: 'roz-dysk', priority: 50 },
    { keywords: ['свердл'], target: 'roz-sverdlo', priority: 75 },
    { keywords: ['сверл'], target: 'roz-sverdlo', priority: 75 },
    { keywords: ['бур'], target: 'roz-sverdlo', priority: 70 },
    { keywords: ['біта'], target: 'roz-sverdlo', priority: 75 },
    { keywords: ['бита'], target: 'roz-sverdlo', priority: 75 },
    { keywords: ['багатофункціональн', 'інструмент'], target: 'ak-renovator', priority: 80 },
    { keywords: ['многофункциональн', 'инструмент'], target: 'ak-renovator', priority: 80 },
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

function decodeHtmlEntities(text) {
    if (!text) return '';
    return String(text)
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function normalizeExternalCategoryId(externalCategoryId) {
    const decoded = decodeHtmlEntities(String(externalCategoryId));
    return decoded
        .split('>')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join(' > ')
        .trim();
}

function matchesAllKeywords(text, keywords) {
    const normalized = normalizeText(text);
    return keywords.every(kw => normalized.includes(kw.toLowerCase()));
}

function findBestMapping(textToMatch, parentCategoryName = null) {
    const normalized = normalizeText(textToMatch);

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

// Нова функція для категоризації по назві товару
function findCategoryByProductName(productName) {
    return findBestMapping(productName, null);
}

async function getOrCreateMapping(supplierPrefix, externalCategoryId, categoryName, parentCategoryName = null) {
    const normalizedExternalCategoryId = normalizeExternalCategoryId(externalCategoryId);

    const existingMapping = await CategoryMapping.findOne({
        where: {
            supplier_prefix: supplierPrefix,
            external_category_id: normalizedExternalCategoryId
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
            external_category_id: normalizedExternalCategoryId,
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

async function getInternalCategoryForProduct(supplierPrefix, externalCategoryId, productName = null) {
    // Спочатку пробуємо по назві товару (більш точно)
    if (productName) {
        const byName = findCategoryByProductName(productName);
        if (byName.target && byName.confidence >= 80) {
            const targetExists = await SubCategory.findByPk(byName.target);
            if (targetExists) {
                return byName.target;
            }
        }
    }

    // Потім по маппінгу категорій
    const normalizedExternalCategoryId = normalizeExternalCategoryId(externalCategoryId);

    const mapping = await CategoryMapping.findOne({
        where: {
            supplier_prefix: supplierPrefix,
            external_category_id: normalizedExternalCategoryId
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
    const normalizedExternalCategoryId = normalizeExternalCategoryId(externalCategoryId);

    const [mapping, created] = await CategoryMapping.upsert({
        supplier_prefix: supplierPrefix,
        external_category_id: normalizedExternalCategoryId,
        internal_sub_category_id: internalCategoryId
    });

    return { mapping, created };
}

module.exports = {
    findBestMapping,
    findCategoryByProductName,
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

