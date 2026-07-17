const { Product, SubCategory, CategoryMapping } = require('../db');
const { Op } = require('sequelize');

const AUTO_CATEGORY_DEFINITIONS = {
    'akumulyatorni-pylky': { name: 'Акумуляторні пилки', parentId: 'accum-tool' },
    'ak-pyla-dyskova': { name: 'Акумуляторні дискові пили', parentId: 'accum-tool' },
    'ak-pyla-shabelna': { name: 'Акумуляторні шабельні пили', parentId: 'accum-tool' },
    'ak-fen': { name: 'Акумуляторні будівельні фени', parentId: 'accum-tool' },
    'ak-prysoska': { name: 'Акумуляторні вакуумні та вібраційні присоски', parentId: 'accum-tool' },
    'ak-poliruvalna': { name: 'Акумуляторні полірувальні машини', parentId: 'accum-tool' },
    'akumulyatorni-likhtari': { name: 'Акумуляторні ліхтарі', parentId: 'accum-tool' },
    'ak-adapter': { name: 'Адаптери для акумуляторів', parentId: 'accum-tool' },
    'ak-zaklepuvach': { name: 'Акумуляторні заклепувальні пістолети', parentId: 'accum-tool' },
    'ak-stepler': { name: 'Акумуляторні степлери та цвяхозабивачі', parentId: 'accum-tool' },
    'ak-pistolet-hermetyk': { name: 'Акумуляторні пістолети для герметика', parentId: 'accum-tool' },
    'ak-ventyliator': { name: 'Акумуляторні вентилятори', parentId: 'accum-tool' },
    'ak-radio': { name: 'Акумуляторні радіоприймачі та колонки', parentId: 'accum-tool' },
    'ak-zshyvach-mishkiv': { name: 'Акумуляторні машини для зшивання мішків', parentId: 'accum-tool' }
};

// Правила, вивчені з ручної розкладки каталогу. Вони мають вищий
// пріоритет за загальні правила нижче.
const LEARNED_MAPPING_RULES = [
    // Витратні матеріали перевіряємо раніше за інструмент.
    { keywords: ['алмазн', 'диск'], target: 'roz-dysk', priority: 205 },
    { keywords: ['диск', 'відрізн'], target: 'roz-dysk', priority: 205 },
    { keywords: ['диск', 'зачисн'], target: 'roz-dysk', priority: 205 },
    { keywords: ['диск', 'пелюстков'], target: 'roz-dysk', priority: 205 },
    { keywords: ['пиляльн', 'диск'], target: 'roz-dysk', priority: 205 },
    { keywords: ['пильн', 'диск'], target: 'roz-dysk', priority: 205 },
    { keywords: ['алмазн', 'чашк'], target: 'roz-dysk', priority: 205 },

    // Набори повинні залишатися наборами, навіть якщо у дужках перелічені АКБ/ЗП.
    { keywords: ['набір', 'акумуляторн'], target: 'ak-nabory', priority: 225 },
    { keywords: ['набір', 'садов', 'акумуляторн'], target: 'ak-nabory', priority: 226 },

    // Окремі типи акумуляторних пил.
    { keywords: ['акумуляторн', 'ланцюгов', 'пил'], target: 'akumulyatorni-pylky', priority: 220 },
    { keywords: ['акумуляторн', 'міні', 'пил'], target: 'akumulyatorni-pylky', priority: 220 },
    { keywords: ['акумуляторн', 'пил', 'pka'], target: 'akumulyatorni-pylky', priority: 219 },
    { keywords: ['акумуляторн', 'пил', 'pca40/2'], target: 'akumulyatorni-pylky', priority: 219 },
    { keywords: ['акумуляторн', 'дисков', 'пил'], target: 'ak-pyla-dyskova', priority: 196 },
    { keywords: ['циркулярн', 'пил', 'акумуляторн'], target: 'ak-pyla-dyskova', priority: 196 },
    { keywords: ['акумуляторн', 'шабельн', 'пил'], target: 'ak-pyla-shabelna', priority: 197 },
    { keywords: ['шабельн', 'пил', 'grs'], target: 'ak-pyla-shabelna', priority: 197 },
    { keywords: ['акумуляторн', 'лобзик'], target: 'ak-lobzyk', priority: 196 },
    { keywords: ['лобзик', 'акумуляторн'], target: 'ak-lobzyk', priority: 196 },

    // Категорії, підтверджені ручною розкладкою.
    { keywords: ['акумуляторн', 'фарбопульт'], target: 'ak-farbopult', priority: 190 },
    { keywords: ['аккумуляторн', 'краскопульт'], target: 'ak-farbopult', priority: 190 },
    { keywords: ['фарбопульт', 'pse'], target: 'ak-farbopult', priority: 190 },
    { keywords: ['акумуляторн', 'фен'], target: 'ak-fen', priority: 190 },
    { keywords: ['акумуляторн', 'полірувальн'], target: 'ak-poliruvalna', priority: 190 },
    { keywords: ['акумуляторн', 'ексцентрик', 'шліф'], target: 'ak-poliruvalna', priority: 190 },
    { keywords: ['акумуляторн', 'ліхтар'], target: 'akumulyatorni-likhtari', priority: 190 },
    { keywords: ['акумуляторн', 'прожектор'], target: 'akumulyatorni-likhtari', priority: 190 },
    { keywords: ['світлодіодн', 'прожектор', 'акумулятор'], target: 'akumulyatorni-likhtari', priority: 190 },
    { keywords: ['акумуляторн', 'віброприсоск'], target: 'ak-prysoska', priority: 190 },
    { keywords: ['акумуляторн', 'вібраційн', 'присоск'], target: 'ak-prysoska', priority: 190 },
    { keywords: ['акумуляторн', 'вібратор', 'бетон'], target: 'ak-prysoska', priority: 190 },
    { keywords: ['акумуляторн', 'мультитул'], target: 'ak-renovator', priority: 190 },
    { keywords: ['акумуляторн', 'реноватор'], target: 'ak-renovator', priority: 190 },
    { keywords: ['акумуляторн', 'будівельн', 'міксер'], target: 'bud-betonomishalka', priority: 190 },
    { keywords: ['міксер', 'будівельн', 'акумуляторн'], target: 'bud-betonomishalka', priority: 190 },
    { keywords: ['акумуляторн', 'фрезер'], target: 'st-frezer', priority: 190 },
    { keywords: ['акумуляторн', 'рубанок'], target: 'st-rubanok', priority: 190 },
    { keywords: ['акумуляторн', 'вирубн', 'ножиц'], target: 'st-rubanok', priority: 190 },
    { keywords: ['акумуляторн', 'висічн', 'ножиц'], target: 'st-rubanok', priority: 190 },
    { keywords: ['акумуляторн', 'паяльник'], target: 'el-payalnik', priority: 190 },
    { keywords: ['акумуляторн', 'гравіювальн'], target: 'el-graver', priority: 190 },
    { keywords: ['акумуляторн', 'міні-інструмент', '3 в 1'], target: 'el-graver', priority: 190 },
    { keywords: ['акумуляторн', 'прям', 'шліфувальн'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 190 },
    { keywords: ['акумуляторн', 'різак', 'арматур'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 190 },
    { keywords: ['металоріз'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 190 },
    { keywords: ['штроборіз'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 190 },
    { keywords: ['драбина'], target: 'bud-drabyna', priority: 190 },
    { keywords: ['стрем\'янк'], target: 'bud-drabyna', priority: 190 },
    { keywords: ['обприскувач'], target: 'ak-opryskuvach', priority: 185 },
    { keywords: ['шуруповерт', 'pa12'], target: 'ak-shurupovert', priority: 190 },
    { keywords: ['телескопічн', 'подовжувач', 'gsp'], target: 'ak-sekator', priority: 190 },
    { keywords: ['кущоріз', 'ght 1700'], target: 'ak-kushchoriz', priority: 190 },
    { keywords: ['верстат', 'заточування', 'ланцюг'], target: 'st-tochylo', priority: 190 },
    { keywords: ['подовжувач', 'ep2.0r'], target: 'ak-inshe', priority: 190 },
    { keywords: ['бензин', 'кос'], target: 'sad-motokosa', priority: 190 },
    { keywords: ['зварювальн', 'др'], target: 'zv-material', priority: 190 },
    { keywords: ['флюсов', 'зварювальн', 'др'], target: 'zv-material', priority: 195 },
    { keywords: ['пильн', 'шин'], target: 'roz-sad', priority: 190 },
    { keywords: ['кільцев', 'пил'], target: 'st-tortsovochna', priority: 190 },
    { keywords: ['рубанок'], target: 'st-rubanok', priority: 180 },
    { keywords: ['монтажн', 'пил'], target: 'st-tortsovochna', priority: 190 },
    { keywords: ['відрізн', 'пил', 'метал'], target: 'st-tortsovochna', priority: 190 },
    { keywords: ['полірувальн', 'губк'], target: 'roz-dysk', priority: 190 },
    { keywords: ['адаптер', 'батаре'], target: 'ak-adapter', priority: 195 },
    { keywords: ['портативн', 'зарядн', 'станц'], target: 'ak-batareya', priority: 190 },
    { keywords: ['лазерн', 'нівелір'], target: 'bud-inshe', priority: 180 },
    { keywords: ['адаптер', 'hex'], target: 'avto-instrument', priority: 180 },

    // Потенційні нові групи. Категорія створюється лише коли товарів > 5.
    { keywords: ['акумуляторн', 'заклепувальн'], target: 'ak-zaklepuvach', priority: 180 },
    { keywords: ['акумуляторн', 'цвяхозабивач'], target: 'ak-stepler', priority: 180 },
    { keywords: ['акумуляторн', 'степлер'], target: 'ak-stepler', priority: 180 },
    { keywords: ['акумуляторн', 'герметик'], target: 'ak-pistolet-hermetyk', priority: 180 },
    { keywords: ['акумуляторн', 'вентилятор'], target: 'ak-ventyliator', priority: 180 },
    { keywords: ['акумуляторн', 'радіоприймач'], target: 'ak-radio', priority: 180 },
    { keywords: ['акумуляторн', 'bluetooth', 'колонк'], target: 'ak-radio', priority: 180 },
    { keywords: ['акумуляторн', 'зшивання', 'мішк'], target: 'ak-zshyvach-mishkiv', priority: 180 }
];

// Окремий набір для назв категорій постачальника. Тут немає правил на кшталт
// «будь-який фарбопульт», які без контексту могли б зачепити пневмоінструмент.
const LEARNED_CATEGORY_RULES = [
    { keywords: ['акумуляторні пилки'], target: 'akumulyatorni-pylky', priority: 210, exact: true },
    { keywords: ['акумуляторн', 'ланцюгов', 'пил'], target: 'akumulyatorni-pylky', priority: 200 },
    { keywords: ['акумуляторн', 'міні', 'пил'], target: 'akumulyatorni-pylky', priority: 200 },
    { keywords: ['акумуляторн', 'дисков', 'пил'], target: 'ak-pyla-dyskova', priority: 200 },
    { keywords: ['акумуляторн', 'шабельн', 'пил'], target: 'ak-pyla-shabelna', priority: 200 },
    { keywords: ['акумуляторн', 'лобзик'], target: 'ak-lobzyk', priority: 200 },
    { keywords: ['акумуляторн', 'секатор'], target: 'ak-sekator', priority: 190 },
    { keywords: ['акумуляторн', 'тример'], target: 'ak-trymer', priority: 190 },
    { keywords: ['акумуляторн', 'кос'], target: 'ak-trymer', priority: 190 },
    { keywords: ['акумуляторн', 'кущоріз'], target: 'ak-kushchoriz', priority: 190 },
    { keywords: ['акумуляторн', 'газонокосарк'], target: 'ak-gazonokosarka', priority: 190 },
    { keywords: ['акумуляторн', 'обприскувач'], target: 'ak-opryskuvach', priority: 190 },
    { keywords: ['акумуляторн', 'повітродув'], target: 'ak-povitroduvka', priority: 190 },
    { keywords: ['акумуляторн', 'пилосос'], target: 'ak-pylosos', priority: 190 },
    { keywords: ['акумуляторн', 'фарбопульт'], target: 'ak-farbopult', priority: 190 },
    { keywords: ['акумуляторн', 'фен'], target: 'ak-fen', priority: 190 },
    { keywords: ['акумуляторн', 'присоск'], target: 'ak-prysoska', priority: 190 },
    { keywords: ['акумуляторн', 'полірувальн'], target: 'ak-poliruvalna', priority: 190 },
    { keywords: ['акумуляторн', 'ліхтар'], target: 'akumulyatorni-likhtari', priority: 190 },
    { keywords: ['адаптер', 'акумулятор'], target: 'ak-adapter', priority: 195 },
    { keywords: ['акумуляторн', 'пил'], target: 'akumulyatorni-pylky', priority: 180 },
    { keywords: ['зварювальн', 'др'], target: 'zv-material', priority: 180 },
    { keywords: ['шин', 'пил'], target: 'roz-sad', priority: 180 },
    { keywords: ['бензин', 'кос'], target: 'sad-motokosa', priority: 180 },
    { keywords: ['диск'], target: 'roz-dysk', priority: 170, exact: true },
    { keywords: ['кільцеріз'], target: 'st-tortsovochna', priority: 180 },
    { keywords: ['рубанк'], target: 'st-rubanok', priority: 180 },
    { keywords: ['монтажн', 'пил'], target: 'st-tortsovochna', priority: 180 },
    { keywords: ['полірувальн', 'круг'], target: 'roz-dysk', priority: 180 },
    { keywords: ['портативн', 'зарядн', 'станц'], target: 'ak-batareya', priority: 180 },
    { keywords: ['вимірювальн', 'інструмент'], target: 'bud-inshe', priority: 170 }
];

const MAPPING_RULES = [
    ...LEARNED_CATEGORY_RULES,
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
    { keywords: ['кутошліфувальн'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 80 },
    { keywords: ['болгарк'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 80 },
    { keywords: ['ушм'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 75 },
    { keywords: ['углов', 'шлифмашин'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 80 },
    { keywords: ['металоріз'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 80 },
    { keywords: ['штроборіз'], target: 'electro-tool-kutoshlifuvalni-mashyny', priority: 80 },
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
        .replace(/ак+у?м+ц?у?лятор/g, 'акумулятор')
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

function findBestMappingUsingRules(textToMatch, parentCategoryName, rules) {
    const normalized = normalizeText(textToMatch);

    const fullContext = parentCategoryName
        ? `${normalizeText(parentCategoryName)} ${normalized}`
        : normalized;

    let bestMatch = null;
    let bestPriority = 0;

    for (const rule of rules) {
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

function findBestMapping(textToMatch, parentCategoryName = null) {
    return findBestMappingUsingRules(textToMatch, parentCategoryName, MAPPING_RULES);
}

// Нова функція для категоризації по назві товару
function findCategoryByProductName(productName) {
    // Комплектація в дужках часто містить слова «акумулятор» і «зарядний
    // пристрій», які не описують тип самого товару.
    const title = String(productName || '').split(/[([]/, 1)[0].trim();
    const normalizedTitle = normalizeText(title || productName);

    // Назва витратника може містити повну назву сумісного інструмента.
    if (['ланцюг ', 'цепь ', 'шина '].some(prefix => normalizedTitle.startsWith(prefix))) {
        return { target: 'roz-sad', confidence: 230, keywords: ['тип товару: витратник'] };
    }

    // Для назви товару використовуємо лише перевірені правила. Загальні
    // правила призначені для назв категорій постачальника і занадто широкі
    // для окремих товарів (наприклад, «пилосос» містить «пил»).
    return findBestMappingUsingRules(title || productName, null, LEARNED_MAPPING_RULES);
}

async function ensureSuggestedCategories(products, minimumProducts = 6) {
    const counts = new Map();

    for (const product of products || []) {
        const productName = product?.name || product?.model || product?.title || '';
        const mapping = findCategoryByProductName(productName);
        if (!mapping.target || !AUTO_CATEGORY_DEFINITIONS[mapping.target]) continue;
        counts.set(mapping.target, (counts.get(mapping.target) || 0) + 1);
    }

    const created = [];
    for (const [categoryId, count] of counts.entries()) {
        if (count < minimumProducts) continue;
        const definition = AUTO_CATEGORY_DEFINITIONS[categoryId];
        const [, wasCreated] = await SubCategory.findOrCreate({
            where: { sub_category_id: categoryId },
            defaults: {
                sub_category_id: categoryId,
                sub_category_name: definition.name,
                parent_id: definition.parentId,
                pictures: null
            }
        });

        if (wasCreated) created.push({ categoryId, count, name: definition.name });
    }

    return created;
}

async function reconcileFallbackProducts(supplierPrefix, fallbackCategoryId = 'ak-inshe') {
    const where = {
        sub_category_id: fallbackCategoryId,
        is_manual_category: false
    };
    if (supplierPrefix) where.supplier_prefix = supplierPrefix;

    const products = await Product.findAll({
        attributes: ['product_id', 'product_name', 'sub_category_id'],
        where
    });

    const candidates = [];
    for (const product of products) {
        const mapping = findCategoryByProductName(product.product_name);
        if (!mapping.target || mapping.target === fallbackCategoryId || mapping.confidence < 80) continue;
        candidates.push({ product, mapping });
    }

    const createdCategories = await ensureSuggestedCategories(
        candidates.map(({ product }) => ({ name: product.product_name })),
        6
    );
    const existingTargets = new Map();
    const movedByCategory = {};

    for (const { product, mapping } of candidates) {
        if (!existingTargets.has(mapping.target)) {
            existingTargets.set(mapping.target, Boolean(await SubCategory.findByPk(mapping.target)));
        }
        if (!existingTargets.get(mapping.target)) continue;

        await product.update({ sub_category_id: mapping.target });
        movedByCategory[mapping.target] = (movedByCategory[mapping.target] || 0) + 1;
    }

    return {
        checked: products.length,
        moved: Object.values(movedByCategory).reduce((sum, count) => sum + count, 0),
        movedByCategory,
        createdCategories
    };
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
    ensureSuggestedCategories,
    reconcileFallbackProducts,
    getMappingsForSupplier,
    clearMappingsForSupplier,
    updateMapping,
    MAPPING_RULES,
    AUTO_CATEGORY_DEFINITIONS,
    IGNORE_CATEGORIES,
    normalizeText
};
