/* engineering_steps/step3_standard.js - Шаг 3: Производство базовых (стандартных) прутков */

window.calcStep3 = function() {
    const blankSelect = document.getElementById('r-blank-select');
    if (!blankSelect) return { O: 0, F: 0, J: 0, L: 0 };

    const blankId = blankSelect.value;
    const blank = window.db.rods_blanks?.[blankId];
    
    // Входные параметры
    const I = parseFloat(document.getElementById('r-width')?.value) || 0;
    const P = parseFloat(document.getElementById('r-ext-ends')?.value) || 0;
    const K = parseInt(document.getElementById('r-center-count')?.value) || 0;
    const Q = parseFloat(document.getElementById('r-ext-center')?.value) || 0;
    const R = parseFloat(document.getElementById('r-shrink-center')?.value) || 0;
    const G = parseFloat(document.getElementById('r-dia-select')?.value) || parseFloat(blank?.dia) || 0;

    // 1. Столбец J: Расчетная длина заготовки
    // J = I - P - (K * Q) + (K * R)
    const J = I - P - (K * Q) + (K * R);
    if (document.getElementById('r-calc-blank-len')) {
        document.getElementById('r-calc-blank-len').value = J.toFixed(1);
    }
    if (document.getElementById('r-res-length')) {
        document.getElementById('r-res-length').innerText = J.toFixed(1) + " мм";
    }

    // 2. Столбец L: Вес прутка расчетный
    // =(ПИ() * (G/2)^2 * J * 7,85) / 1 000 000
    const L = (Math.PI * Math.pow(G / 2, 2) * J * 7.85) / 1000000;
    if (document.getElementById('r-calc-weight')) {
        document.getElementById('r-calc-weight').value = L.toFixed(3);
    }
    if (document.getElementById('r-res-weight')) {
        document.getElementById('r-res-weight').innerText = L.toFixed(3) + " кг";
    }

    // 3. Столбец N & O: Цена за шт без НДС
    const N = parseFloat(blank?.price) || 0;
    if (document.getElementById('r-blank-price')) {
        document.getElementById('r-blank-price').value = N.toFixed(2);
    }

    const labor = parseFloat(document.getElementById('r-labor')?.value) || 0;
    const O = N + labor;
    if (document.getElementById('r-res-price-no-vat')) {
        document.getElementById('r-res-price-no-vat').innerText = window.formatCurr(O);
    }

    // 4. Столбец F: Прайс. Цена за шт. с НДС
    const S = parseFloat(document.getElementById('r-vat-rate')?.value) || 1.22;
    const F = O * S;
    if (document.getElementById('r-res-total')) {
        document.getElementById('r-res-total').innerText = window.formatCurr(F);
    }

    const artInput = document.getElementById('r-article');
    if (artInput && (!artInput.value || artInput.value.startsWith('PR-'))) {
        artInput.value = `PR-${G}MM-W${I}-K${K}`;
    }

    // Автосохранение в сессию
    const drawingVal = document.getElementById('r-drawing')?.value.trim() || '';
    const state = {
        art: document.getElementById('r-article')?.value,
        hessels: document.getElementById('r-art-hessels')?.value,
        grimme: document.getElementById('r-art-grimme')?.value,
        broekema: document.getElementById('r-art-broekema')?.value,
        ropa: document.getElementById('r-art-ropa')?.value,
        blankId, dia: G, width: I, centerCount: K, extEnds: P, extCenter: Q, shrinkCenter: R, labor, vatRate: S,
        drawing: drawingVal,
        available: document.getElementById('r-available')?.checked !== false
    };
    localStorage.setItem('prutkon_step3_state', JSON.stringify(state));

    return { O, F, J, L };
};

window.saveStep3 = function() {
    const res = window.calcStep3();
    const blankSelect = document.getElementById('r-blank-select');
    const blankId = blankSelect?.value;
    const blank = window.db.rods_blanks?.[blankId];

    if (!blank) return notify('Выберите или рассчитайте заготовку', 'warning');
    if (res.F <= 0) return notify('Себестоимость прутка должна быть больше 0', 'warning');

    const G = parseFloat(document.getElementById('r-dia-select')?.value) || parseFloat(blank?.dia) || 0;
    const I = parseFloat(document.getElementById('r-width')?.value) || 0;
    const K = parseInt(document.getElementById('r-center-count')?.value) || 0;
    const drawingVal = document.getElementById('r-drawing')?.value.trim() || '';
    
    const article = document.getElementById('r-article')?.value || `PR-${G}MM-W${I}`;
    const name = `Пруток Ø${G} мм Ширина ${I} мм`;

    if (!window.db.rods_standard) window.db.rods_standard = [];
    const existingIdx = window.db.rods_standard.findIndex(r => r.article === article || r.name === name);

    const record = { 
        name, 
        article,
        artHessels: document.getElementById('r-art-hessels')?.value || '',
        artGrimme: document.getElementById('r-art-grimme')?.value || '',
        artBroekema: document.getElementById('r-art-broekema')?.value || '',
        artRopa: document.getElementById('r-art-ropa')?.value || '',
        dia: G, 
        width: I,
        blankLength: res.J,
        centerCount: K,
        weightKg: res.L,
        available: document.getElementById('r-available')?.checked !== false,
        blankPrice: parseFloat(blank?.price || 0),
        labor: parseFloat(document.getElementById('r-labor')?.value) || 0,
        priceNoVat: res.O,
        price: res.F,
        extEnds: parseFloat(document.getElementById('r-ext-ends')?.value) || 0,
        extCenter: parseFloat(document.getElementById('r-ext-center')?.value) || 0,
        shrinkCenter: parseFloat(document.getElementById('r-shrink-center')?.value) || 0,
        vatRate: parseFloat(document.getElementById('r-vat-rate')?.value) || 1.22,
        drawing: drawingVal,
        photo: drawingVal,
        blankId,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Пруток "${name}" (${article}) уже существует в базе. Обновить прайсовую цену до ${window.formatCurr(res.F)}?`)) {
            window.db.rods_standard[existingIdx] = { ...window.db.rods_standard[existingIdx], ...record };
            window.persistAndRender('Прямой пруток успешно обновлен в базе!');
        }
    } else {
        window.db.rods_standard.push(record);
        window.persistAndRender('Прямой пруток успешно сохранен в базу!');
    }
};

window.restoreLastStep3Session = function() {
    const savedState = localStorage.getItem('prutkon_step3_state');
    if (savedState) {
        try {
            const s = JSON.parse(savedState);
            if (s.blankId !== undefined && window.db.rods_blanks?.[s.blankId]) document.getElementById('r-blank-select').value = s.blankId;
            if (s.art !== undefined) document.getElementById('r-article').value = s.art;
            if (s.hessels !== undefined) document.getElementById('r-art-hessels').value = s.hessels;
            if (s.grimme !== undefined) document.getElementById('r-art-grimme').value = s.grimme;
            if (s.broekema !== undefined) document.getElementById('r-art-broekema').value = s.broekema;
            if (s.ropa !== undefined) document.getElementById('r-art-ropa').value = s.ropa;
            if (s.dia !== undefined && document.getElementById('r-dia-select')) document.getElementById('r-dia-select').value = s.dia;
            if (s.width !== undefined) document.getElementById('r-width').value = s.width;
            if (s.centerCount !== undefined) document.getElementById('r-center-count').value = s.centerCount;
            if (s.extEnds !== undefined) document.getElementById('r-ext-ends').value = s.extEnds;
            if (s.extCenter !== undefined) document.getElementById('r-ext-center').value = s.extCenter;
            if (s.shrinkCenter !== undefined) document.getElementById('r-shrink-center').value = s.shrinkCenter;
            if (s.labor !== undefined) document.getElementById('r-labor').value = s.labor;
            if (s.vatRate !== undefined) document.getElementById('r-vat-rate').value = s.vatRate;
            if (s.drawing !== undefined && document.getElementById('r-drawing')) document.getElementById('r-drawing').value = s.drawing;
            if (s.available !== undefined && document.getElementById('r-available')) document.getElementById('r-available').checked = s.available;
            
            window.calcStep3();
            notify('🔄 Данные Шага 3 успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error(e); }
    } else {
        notify('Нет сохраненных данных в сессии', 'warning');
    }
};
