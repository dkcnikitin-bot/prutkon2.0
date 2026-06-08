/* engineering_steps/step2_blank.js - Шаг 2: Нарезка заготовок из металла (Рубка) */

window.calcStep2 = function() {
    const metalSelect = document.getElementById('b-metal-select');
    if (!metalSelect) return { totalNoVat: 0, totalVat: 0, vatRate: 1.2 };

    const metalIdx = metalSelect.value;
    const metal = window.db.rods_metal?.[metalIdx];

    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const setC = (id, val) => setT(id, window.formatCurr(val));

    if (!metal) {
        setT('b-f-article', '--'); setT('b-f-supplier', '--'); setT('b-f-steel', '--');
        setT('b-f-length', '--'); setT('b-f-price-vat', '--'); setT('b-f-cuts-count', '--');
        setT('b-f-qty-rod', '--'); setT('b-f-waste-cuts', '--'); setT('b-f-rem-rod', '--');
        setT('b-f-bus-waste', '--'); setT('b-f-norm-waste', '--'); setT('b-f-waste-pct', '--');
        setT('b-f-weight-unit', '--'); setT('b-f-metal-price-m', '--'); setT('b-f-metal-cost-unit', '--');
        setT('b-f-metal-cost-rod', '--'); setT('b-f-cost-unit-novat', '--'); setT('b-f-vat-rate', '--');
        setT('b-f-gap', '--'); setT('b-f-rod-len', '--'); setT('b-f-labor-cut', '--');
        setT('b-f-avg-info', 'Справочное поле, указано среднее количество заготовок в хлысте. Поле используется для дальнейшего расчета.');
        return { totalNoVat: 0, totalVat: 0, vatRate: 1.2 };
    }

    const D = parseFloat(document.getElementById('b-length')?.value) || 820;
    const T = parseFloat(document.getElementById('b-rod-length')?.value) || 6000;
    const S = parseFloat(document.getElementById('b-gap')?.value) || 10;
    const V = parseFloat(document.getElementById('b-labor')?.value) || 3.99;
    const K_norm = parseFloat(document.getElementById('b-norm-waste-inp')?.value) || 5;
    const drawingVal = document.getElementById('b-drawing')?.value.trim() || '';

    // Сохранение сессии для защиты от случайного обновления страницы
    localStorage.setItem('prutkon_step2_state', JSON.stringify({ metalIdx, D, T, S, V, K_norm, drawing: drawingVal }));

    const dia = parseFloat(metal.dia || 0);
    const A = `BL-${dia}MM-L${D}`;
    const B = metal.code || metal.supplier || 'Складские остатки';
    const C = metal.name || 'Металл';

    let G = Math.floor(T / D);
    // Проверка, чтобы остаток при уходе в минус уменьшал G (корректировка раскроя при полном резе)
    if (G > 0 && (T - (G * D) - (G - 1) * S < 0)) {
        G = Math.max(0, G - 1);
    }
    
    const F = G > 0 ? G - 1 : 0;
    const H = F * S;
    const I = T - (G * D) - H;
    const L = T > 0 ? ((H + I) / T) * 100 : 0;

    const J = I >= 1000 ? `Деловой отход (${I.toFixed(0)} мм)` : `Неликвид / В лом (${I.toFixed(0)} мм)`;
    
    // Динамический расчет плотности стали
    const density = window.getSteelDensity ? window.getSteelDensity(C) : 7.85;
    const M = (dia * dia * D * Math.PI * density) / 4000000; // точный вес 1 шт в кг

    const N = parseFloat(metal.pricePerM || 0);
    const R = parseFloat(metal.vatRate || 1.20);

    const O = N * (D / 1000); // Чистый металл на заготовку без угара
    
    // Расчет стоимости металла с учетом делового отхода
    let P = 0;
    if (G > 0) {
        if (I >= 1000) {
            P = (N * ((T - I) / 1000)) / G; // Вычитаем стоимость делового отхода
        } else {
            P = (N * (T / 1000)) / G; // Убыток от отхода делится на все заготовки
        }
    }
    
    // Структурированное ценообразование
    const costPriceNoVat = P + V; // Себестоимость без НДС
    const costPriceVat = costPriceNoVat * R; // Себестоимость с НДС
    const priceNoVat = costPriceNoVat * 2.0; // Цена продажи без НДС (100% наценка)
    const priceVat = priceNoVat * R; // Цена продажи с НДС (Прайс)

    const avgInfo = (T / (D + S)).toFixed(9);

    setT('b-f-article', A);
    setT('b-f-supplier', B);
    setT('b-f-steel', `${C} (Ø${dia} мм)`);
    setT('b-f-length', `${D} мм`);
    setC('b-f-price-vat', priceVat);
    setT('b-f-cuts-count', `${F} рубов`);
    setT('b-f-qty-rod', `${G} шт`);
    setT('b-f-waste-cuts', `${H} мм`);
    setT('b-f-rem-rod', `${I.toFixed(0)} мм`);
    setT('b-f-bus-waste', J);
    setT('b-f-norm-waste', `${K_norm.toFixed(1)} %`);
    setT('b-f-waste-pct', `${L.toFixed(2)} %`);
    setT('b-f-weight-unit', `${M.toFixed(5)} кг`);
    setC('b-f-metal-price-m', N);
    setC('b-f-metal-cost-unit', O);
    setC('b-f-metal-cost-rod', P);
    setC('b-f-cost-unit-novat', costPriceNoVat);
    setT('b-f-vat-rate', R === 1.2 ? '20%' : (R === 1.22 ? '22%' : 'Без НДС'));
    setT('b-f-gap', `${S} мм`);
    setT('b-f-rod-len', `${T} мм`);
    setC('b-f-labor-cut', V);
    setT('b-f-avg-info', `Справочное поле, указано среднее количество заготовок в хлысте (${avgInfo} шт). Поле используется для дальнейшего расчета.`);

    // Обновление UI элементов в rods_production.html
    setT('b-res-qty', `${G} шт`);
    setT('b-res-remainder', `${I.toFixed(0)} мм (${I >= 1000 ? 'Деловой' : 'Лом'})`);
    setT('b-res-waste', `${L.toFixed(2)} %`);
    setC('b-res-metal-cost', P);
    setC('b-res-total', priceVat);

    // Подсветка отхода, если превышает норму
    const wasteEl = document.getElementById('b-f-waste-pct') || document.getElementById('b-res-waste');
    if (wasteEl) {
        if (L > K_norm) {
            wasteEl.style.color = 'var(--brand-red)';
            wasteEl.style.fontWeight = '900';
        } else {
            wasteEl.style.color = '#fff';
            wasteEl.style.fontWeight = '700';
        }
    }

    const bArticleInp = document.getElementById('b-article');
    if (bArticleInp) bArticleInp.value = A;
    return { totalNoVat: costPriceNoVat, totalVat: costPriceVat, vatRate: R, priceVat: priceVat, priceNoVat: priceNoVat, article: A, qtyInRod: G };
};

window.saveStep2 = function() {
    const metalSelect = document.getElementById('b-metal-select');
    const lengthInput = document.getElementById('b-length');

    if (!metalSelect || !lengthInput) return;

    const metalIdx = metalSelect.value;
    const metal = window.db.rods_metal?.[metalIdx];
    const length = parseFloat(lengthInput.value) || 0;
    const res = window.calcStep2();

    if (!metal) return notify('Сначала добавьте и выберите металл (Шаг 1)', 'warning');
    if (length <= 0) return notify('Укажите корректную длину заготовки (мм)', 'warning');
    if (res.totalNoVat <= 0) return notify('Себестоимость заготовки должна быть больше 0', 'warning');

    if (!window.db.rods_blanks) window.db.rods_blanks = [];

    // Запрет создания дубликатов (одинаковый диаметр и длина)
    const existingIdx = window.db.rods_blanks.findIndex(b => parseFloat(b.dia) === parseFloat(metal.dia) && parseFloat(b.length) === length);

    const labor = parseFloat(document.getElementById('b-labor')?.value) || 3.99;
    const drawingVal = document.getElementById('b-drawing')?.value.trim() || '';

    const recordObj = {
        dia: metal.dia,
        length,
        labor,
        costPrice: res.totalNoVat,
        costPriceVat: res.totalVat,
        priceNoVat: res.priceNoVat,
        price: res.priceVat, // Цена продажи с НДС (Прайс)
        priceVat: res.priceVat,
        vatRate: res.vatRate,
        article: res.article,
        metalName: metal.name,
        qtyInRod: res.qtyInRod,
        rodLength: parseFloat(document.getElementById('b-rod-length')?.value) || 6000,
        gap: parseFloat(document.getElementById('b-gap')?.value) || 10,
        drawing: drawingVal,
        photo: drawingVal,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Заготовка с Ø${metal.dia} мм и длиной ${length} мм уже существует ("${res.article}"). Обновить её данные в реестре? (Создание дубликатов запрещено)`)) {
            window.db.rods_blanks[existingIdx] = { ...window.db.rods_blanks[existingIdx], ...recordObj };
            window.persistAndRender('Заготовка успешно обновлена в реестре!');
        }
    } else {
        window.db.rods_blanks.push(recordObj);
        window.persistAndRender('Заготовка успешно добавлена в реестр!');
    }
};

window.restoreLastStep2Session = function() {
    const savedState = localStorage.getItem('prutkon_step2_state');
    if (savedState) {
        try {
            const s = JSON.parse(savedState);
            if (s.metalIdx !== undefined) document.getElementById('b-metal-select').value = s.metalIdx;
            if (s.D !== undefined) document.getElementById('b-length').value = s.D;
            if (s.T !== undefined) document.getElementById('b-rod-length').value = s.T;
            if (s.S !== undefined) document.getElementById('b-gap').value = s.S;
            if (s.V !== undefined) document.getElementById('b-labor').value = s.V;
            if (s.K_norm !== undefined) document.getElementById('b-norm-waste-inp').value = s.K_norm;
            if (s.drawing !== undefined && document.getElementById('b-drawing')) document.getElementById('b-drawing').value = s.drawing;
            window.calcStep2();
            notify('🔄 Данные Шага 2 успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error(e); }
    } else {
        notify('Нет сохраненных данных в сессии', 'warning');
    }
};
