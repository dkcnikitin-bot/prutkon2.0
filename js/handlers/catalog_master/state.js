/* catalog_master/state.js - ПРУТКОН ERP Central State */

window.CatalogState = {
    step: 1,
    brand: '', model: '', year: '', art: '', name: '', crops: [],
    convType: '3x',
    centralBeltsLayout: 'symmetric', 
    centralBeltMount: 'flattened',
    dist12: '', dist23: '', dist34: '',
    length: '', width: '', pitch: '20', rodsCount: '',
    // Belts
    sideBeltType: 'DNG_PLUS', sideBeltWidth: '60', sideBeltThickness: '17', sideHoleDist: '28', sideHoleDiam: '6',
    centralBeltType: '', centralBeltWidth: '', centralBeltThickness: '', centralHoleDist: '', centralHoleDiam: '',
    // Addons
    additionalItems: [],
    calcBaseRods: '500',
    calcCycleSum: '0',
    // Step 5: Connection
    connectionType: 'open',
    lockId: ''
};

window.CatalogDicts = {
    get crops() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'crops') : [];
        if (dbItems.length > 0) return dbItems.map(d => d.name);
        return [
            'Транспортер основного просеивания (шаг 30)',
            'Транспортер ботвы',
            'Выгрузной транспортер',
            'Транспортер №30',
            'Транспортер №40',
            'Боковой элеватор',
            'Приемный транспортер',
            'Сортировочный транспортер'
        ];
    },
    convTypes: [{ id: '2x', name: '2-х рядный', img: '2.png' }, { id: '3x', name: '3-х рядный', img: '3.png' }, { id: '4x', name: '4-х рядный', img: '4.png' }],
    centralBeltMounts: [
        { id: 'flattened', name: 'Штамп (плоский)', img: '5.jpg' }, { id: 'cast_bracket', name: 'Литая скоба', img: '6.jpg' },
        { id: 'stamped_bracket', name: 'Штамп. скоба', img: '7.jpg' }, { id: 'stamped_loop', name: 'Штамп. петля', img: '8.jpg' }
    ],
    get pitches() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_pitches') : [];
        if (dbItems.length > 0) return dbItems.map(d => parseFloat(d.name) || d.name);
        return [20, 23, 28, 30, 32, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44, 45, 48, 50, 55, 56, 60, 64, 65, 70, 75, 80, 175, 185];
    },
    beltTypes: [
        { id: 'R', name: 'R', img: '9.png' }, { id: 'S', name: 'S', img: '10.png' }, { id: 'DS', name: 'DS', img: '11.png' }, 
        { id: 'DS+', name: 'DS+', img: '12.png' }, { id: 'N_HN', name: 'N/HN', img: '13.png' }, { id: 'DN_DHN', name: 'DN/DHN', img: '14.png' }, 
        { id: 'DNG', name: 'DNG', img: '15.png' }, { id: 'G0505', name: 'G0505', img: '16.png' }, { id: 'DNG_PLUS', name: 'DNG+', img: '17.png' }, 
        { id: 'EN1200P', name: 'EN1200P', img: '18.png' }, { id: 'DN1209P', name: 'DN1209P', img: '19.png' }
    ],
    get beltWidths() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_widths') : [];
        if (dbItems.length > 0) return dbItems.map(d => d.name);
        return ['20', '30', '40', '45', '50', '55', '60', '65', '70', '75', '60-75'];
    },
    get beltThicknesses() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_thicknesses') : [];
        if (dbItems.length > 0) return dbItems.map(d => d.name);
        return ['12', '17', '20', '25', '28-30'];
    },
    get beltHoleDistances() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_hole_distances') : [];
        if (dbItems.length > 0) return dbItems.map(d => d.name);
        return ['20', '23', '28', '30', '32'];
    },
    beltHoleDiameters: ['5', '6', '8', 'м5', 'м6', 'м8'],
    additionalComponentsDef: [
        { id: 'rod_straight', name: 'Обычный прямой пруток', img: '20.jpg' }, { id: 'rod_bent', name: 'Стальной изогнутый', img: '21.png' }, 
        { id: 'rod_rubber', name: 'Обрезиненные прутки', img: '22.png' }, { id: 'rod_plate', name: 'Специальный пруток-пластина', img: '23.jpg' }, 
        { id: 'flappers', name: 'Хлопушки', img: '24.jpg' }, { id: 'pushers_pu', name: 'Толкатели ПУ', img: '25.jpg' }, 
        { id: 'paddles_steel', name: 'Лопатки стальные', img: '26.png' }, { id: 'rod_twisted', name: 'Витые прутки', img: '27.png' }, 
        { id: 'rod_fingers', name: 'Прутки с пальцами', img: '28.jpg' }, { id: 'rod_bent_rubber', name: 'Изогнутый обрез.', img: '29.png' }, 
        { id: 'rod_grate', name: 'Решетчатый пруток', img: '30.png' }, { id: 'rod_double_clamp', name: 'Сдвоенный хомут', img: '31.jpg' }, 
        { id: 'rod_double_welded', name: 'Сдвоенный сварной', img: '32.png' }, { id: 'belt_conveyor', name: 'Конвейерная лента', img: '33.jpg' }, 
        { id: 'fingers', name: 'Пальцы', img: '34.jpg' }
    ],
    get connectionTypes() {
        const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'connection_types') : [];
        if (dbItems.length > 0) {
            return dbItems.map(d => {
                const name = d.name;
                let id = name;
                if (name === 'Механический замок') id = 'mechanical';
                else if (name === 'Подготовлен к вулканизации') id = 'vulcanization';
                else if (name === 'Вулканизация холодная') id = 'vulcanization_cold';
                else if (name === 'Вулканизация горячая') id = 'vulcanization_hot';
                else if (name === 'Открытый') id = 'open';
                else if (name === 'Винтовая скрутка') id = 'screws';
                return { id: id, name: name, img: '36.jpg' };
            });
        }
        return [
            { id: 'mechanical', name: 'Мех. замок', img: '35.jpg' },
            { id: 'vulcanization', name: 'Подготовлен к вулканизации', img: '36.jpg' },
            { id: 'vulcanization_cold', name: 'Вулканизация холодная', img: '36.jpg' },
            { id: 'vulcanization_hot', name: 'Вулканизация горячая', img: '36.jpg' },
            { id: 'open', name: 'Открытый', img: '37.jpg' },
            { id: 'screws', name: 'Винтовая скрутка', img: '38.jpg' }
        ];
    }
};
