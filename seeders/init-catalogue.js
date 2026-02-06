'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert('category', [
            { id: 'accum-tool', category_name: 'Акумуляторний інструмент', icon: 'i-mdi-battery-charging-wireless' },
            { id: 'electro-tool', category_name: 'Електроінструмент', icon: 'i-mdi-power-plug' },
            { id: 'verstaty', category_name: 'Верстати та Обладнання', icon: 'i-mdi-saw-blade' },
            { id: 'zvaryuvannya', category_name: 'Зварювальне обладнання', icon: 'i-mdi-fire' },
            { id: 'sad-gorod', category_name: 'Садова техніка', icon: 'i-mdi-flower' },
            { id: 'budivnytstvo', category_name: 'Будівельне обладнання', icon: 'i-mdi-crane' },
            { id: 'avto-rashodnik', category_name: 'Автотовар та Розхідники', icon: 'i-mdi-car-wrench' }
        ], {});

        await queryInterface.bulkInsert('sub_category', [
            { sub_category_id: 'ak-shurupovert', sub_category_name: 'Акумуляторні шуруповерти', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-perforator', sub_category_name: 'Акумуляторні перфоратори', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-bolgarka', sub_category_name: 'Акумуляторні болгарки (КШМ)', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-pyla', sub_category_name: 'Акумуляторні пили (Дискові та Ланцюгові)', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-lobzyk', sub_category_name: 'Акумуляторні лобзики та шабельні пили', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-gaykovert', sub_category_name: 'Акумуляторні гайковерти', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-renovator', sub_category_name: 'Акумуляторні реноватори', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-sad', sub_category_name: 'Акумуляторна садова техніка', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-kompresor', sub_category_name: 'Акумуляторні компресори', parent_id: 'accum-tool' },
            { sub_category_id: 'ak-batareya', sub_category_name: 'Акумулятори та зарядні пристрої', parent_id: 'accum-tool' },

            { sub_category_id: 'el-drel', sub_category_name: 'Дрилі та Міксери', parent_id: 'electro-tool' },
            { sub_category_id: 'el-bolgarka', sub_category_name: 'Болгарки (Кутошліфувальні машини)', parent_id: 'electro-tool' },
            { sub_category_id: 'el-perforator', sub_category_name: 'Перфоратори', parent_id: 'electro-tool' },
            { sub_category_id: 'el-molotok', sub_category_name: 'Відбійні молотки', parent_id: 'electro-tool' },
            { sub_category_id: 'el-lobzyk', sub_category_name: 'Електролобзики', parent_id: 'electro-tool' },
            { sub_category_id: 'el-pyla', sub_category_name: 'Дискові та Шабельні пили', parent_id: 'electro-tool' },
            { sub_category_id: 'el-shlif', sub_category_name: 'Шліфувальні та Полірувальні машини', parent_id: 'electro-tool' },
            { sub_category_id: 'el-graver', sub_category_name: 'Гравери', parent_id: 'electro-tool' },
            { sub_category_id: 'el-fen', sub_category_name: 'Будівельні фени', parent_id: 'electro-tool' },
            { sub_category_id: 'el-payalnik', sub_category_name: 'Паяльники для труб', parent_id: 'electro-tool' },

            { sub_category_id: 'st-tortsovochna', sub_category_name: 'Торцювальні пили', parent_id: 'verstaty' },
            { sub_category_id: 'st-tsyrkulyarka', sub_category_name: 'Циркулярні станки', parent_id: 'verstaty' },
            { sub_category_id: 'st-frezer', sub_category_name: 'Фрезери', parent_id: 'verstaty' },
            { sub_category_id: 'st-rubanok', sub_category_name: 'Електрорубанки та Рейсмуси', parent_id: 'verstaty' },
            { sub_category_id: 'st-sverdlylny', sub_category_name: 'Свердлильні верстати', parent_id: 'verstaty' },
            { sub_category_id: 'st-tochylo', sub_category_name: 'Точильні верстати', parent_id: 'verstaty' },
            { sub_category_id: 'st-plytkoriz', sub_category_name: 'Плиткорізи', parent_id: 'verstaty' },

            { sub_category_id: 'zv-invertor', sub_category_name: 'Зварювальні інвертори (MMA)', parent_id: 'zvaryuvannya' },
            { sub_category_id: 'zv-napivavtomat', sub_category_name: 'Напівавтомати (MIG/MAG)', parent_id: 'zvaryuvannya' },
            { sub_category_id: 'zv-plazmoriz', sub_category_name: 'Плазморізи', parent_id: 'zvaryuvannya' },
            { sub_category_id: 'zv-maska', sub_category_name: 'Маски зварника', parent_id: 'zvaryuvannya' },
            { sub_category_id: 'zv-material', sub_category_name: 'Електроди, дріт та аксесуари', parent_id: 'zvaryuvannya' },

            { sub_category_id: 'sad-benzopyla', sub_category_name: 'Бензопили', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-elektropyla', sub_category_name: 'Електропили ланцюгові', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-motokosa', sub_category_name: 'Мотокоси та Тримери', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-gazonokosarka', sub_category_name: 'Газонокосарки', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-nasos', sub_category_name: 'Насоси та Мотопомпи', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-opryskuvach', sub_category_name: 'Обприскувачі', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-podribnyuvach', sub_category_name: 'Подрібнювачі гілок', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-pylosos', sub_category_name: 'Садові пилососи та повітродувки', parent_id: 'sad-gorod' },
            { sub_category_id: 'sad-motobur', sub_category_name: 'Мотобури', parent_id: 'sad-gorod' },

            { sub_category_id: 'bud-generator', sub_category_name: 'Генератори', parent_id: 'budivnytstvo' },
            { sub_category_id: 'bud-kompresor', sub_category_name: 'Пневмоінструмент та Компресори', parent_id: 'budivnytstvo' },
            { sub_category_id: 'bud-betonomishalka', sub_category_name: 'Бетонозмішувачі та Міксери', parent_id: 'budivnytstvo' },
            { sub_category_id: 'bud-pylosos', sub_category_name: 'Будівельні пилососи', parent_id: 'budivnytstvo' },
            { sub_category_id: 'bud-teplo', sub_category_name: 'Обігрівачі та Теплові гармати', parent_id: 'budivnytstvo' },
            { sub_category_id: 'bud-drabyna', sub_category_name: "Драбини та Стрем'янки", parent_id: 'budivnytstvo' },

            { sub_category_id: 'avto-instrument', sub_category_name: 'Автоінструмент та Домкрати', parent_id: 'avto-rashodnik' },
            { sub_category_id: 'avto-nabor', sub_category_name: 'Набори інструментів', parent_id: 'avto-rashodnik' },
            { sub_category_id: 'roz-dysk', sub_category_name: 'Диски (Пильні, Алмазні, Абразивні)', parent_id: 'avto-rashodnik' },
            { sub_category_id: 'roz-sverdlo', sub_category_name: 'Свердла, Біти, Бури', parent_id: 'avto-rashodnik' },
            { sub_category_id: 'roz-sad', sub_category_name: 'Витратники для саду (Волосінь, Мастила)', parent_id: 'avto-rashodnik' }
        ], {});
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('sub_category', null, {});
        await queryInterface.bulkDelete('category', null, {});
    }
};
