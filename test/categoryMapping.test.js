const test = require('node:test');
const assert = require('node:assert/strict');

const { SubCategory } = require('../src/db');
const {
    findCategoryByProductName,
    findBestMapping,
    ensureSuggestedCategories
} = require('../src/services/autoMappingService');

const productCases = [
    ['Акумуляторна ланцюгова пила Grosser GCS 120', 'akumulyatorni-pylky'],
    ['Акумуляторна міні пила Procraft PKA44 (2 акб) Кейс', 'akumulyatorni-pylky'],
    ['Акумуляторна дискова пила Procraft PCA24 (Без акб та зп)', 'ak-pyla-dyskova'],
    ['Циркулярна пила акумуляторна Grosser GFS 180', 'ak-pyla-dyskova'],
    ['Акумуляторна шабельна пила Procraft PSS35 (Без акб та зп)', 'ak-pyla-shabelna'],
    ['Акумуляторна вібраційна присоска Grosser GTM 130', 'ak-prysoska'],
    ['Акумуляторний вібратор для бетону PROFI-TEC DVR1500BL POWERLine', 'ak-prysoska'],
    ['Акумуляторний світлодіодний ліхтар Grosser GED 20', 'akumulyatorni-likhtari'],
    ['Акумуляторна ексцентрикова шліфмашина Procraft PX20BL', 'ak-poliruvalna'],
    ['Фарбопульт Procraft PSE550', 'ak-farbopult'],
    ['Акумуляторний будівельний міксер Procraft PMM20', 'bud-betonomishalka'],
    ['Акумуляторний фрезер Grosser GCR 680', 'st-frezer'],
    ['Акумуляторний паяльник Procraft PL20', 'el-payalnik'],
    ['Драбина-стрем\'янка алюмінієва Procraft PLA2.128', 'bud-drabyna'],
    ['Алмазний диск Procraft DC125 125мм', 'roz-dysk'],
    ['Подовжувач телескопічний Procraft EP2.0R', 'ak-inshe']
];

test('maps products according to the manually verified catalogue', () => {
    for (const [name, expected] of productCases) {
        assert.equal(findCategoryByProductName(name).target, expected, name);
    }
});

test('distinguishes chain saws from their consumables', () => {
    assert.equal(
        findCategoryByProductName('Ланцюг для акумуляторної ланцюгової пилки Procraft PKA30').target,
        'roz-sad'
    );
    assert.equal(
        findCategoryByProductName('Бензопила ланцюгова PROFI-TEC PT-2500').target,
        null
    );
});

test('does not classify a pneumatic paint sprayer as a battery tool', () => {
    assert.equal(findCategoryByProductName('Фарбопульт пневматичний Procraft SG16').target, null);
});

test('maps supplier category names to split saw categories', () => {
    assert.equal(findBestMapping('Акумуляторні пилки').target, 'akumulyatorni-pylky');
    assert.equal(findBestMapping('Акумуляторні дискові пили').target, 'ak-pyla-dyskova');
    assert.equal(findBestMapping('Акумуляторні шабельні пили').target, 'ak-pyla-shabelna');
    assert.equal(findBestMapping('Акумуляторні ланцюгові пили').target, 'akumulyatorni-pylky');
    assert.equal(findBestMapping('Акумуляторні лобзики').target, 'ak-lobzyk');
});

test('normalizes common supplier spelling mistakes in battery categories', () => {
    assert.equal(findBestMapping('Акуммулятори').target, 'ak-batareya');
    assert.equal(findBestMapping('Акуммцулятори і зарядні пристроі').target, 'ak-batareya');
    assert.equal(findBestMapping('Акуммуляторні батареі та зарядні пристроі').target, 'ak-batareya');
});

test('creates a missing recognized category only when the group has more than five products', async () => {
    const originalFindOrCreate = SubCategory.findOrCreate;
    const calls = [];
    SubCategory.findOrCreate = async (options) => {
        calls.push(options);
        return [{}, true];
    };

    try {
        const product = { name: 'Акумуляторний вентилятор Test CF20' };
        assert.deepEqual(await ensureSuggestedCategories(Array(5).fill(product), 6), []);
        assert.equal(calls.length, 0);

        const created = await ensureSuggestedCategories(Array(6).fill(product), 6);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].where.sub_category_id, 'ak-ventyliator');
        assert.deepEqual(created, [{
            categoryId: 'ak-ventyliator',
            count: 6,
            name: 'Акумуляторні вентилятори'
        }]);
    } finally {
        SubCategory.findOrCreate = originalFindOrCreate;
    }
});
