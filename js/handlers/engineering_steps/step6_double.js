/* engineering_steps/step6_double.js - Шаг 5 (бывший 6): Производство сдвоенных прутков */

window.calcStep5 = function() {
    const blankSelect = document.getElementById('d-blank-select');
    if (!blankSelect) return { K: 0, H: 0, I: 0 };

    const blankId = blankSelect.value;
    const blank = window.db.rods_blanks?.[blankId];
    
    const clampPrice = parseFloat(document.getElementById('d-clamp-price')?.value) || 0;
    const centerPrice = parseFloat(document.getElementById('d-center-clamp-price')?.value) || 0;
    const labor = parseFloat(document.getElementById('d-labor')?.value) || 0;

    const blankCost = blank ? (parseFloat(blank.priceNoVat || blank.price) || 0) * 2 : 0;
    const K = blankCost + clampPrice + centerPrice + labor;
    const H = K * 2;
    const I = H / 105;

    const diaSelect = document.getElementById('d-dia-select');
    const lengthInput = document.getElementById('d-length');
    const dia = diaSelect?.value || blank?.dia || '';
    const len = lengthInput?.value || '';

    const articleInput = document.getElementById('d-article');
    if (dia && len && articleInput && (!articleInput.value || articleInput.value.startsWith('DBL-'))) {
        articleInput.value = `DBL-${dia}-${len}`;
    }

    const drawingVal = document.getElementById('d-drawing')?.value.trim() || '';

    // Автосохранение сессии
    localStorage.setItem('prutkon_step5_state', JSON.stringify({ blankId, clampPrice, centerPrice, labor, dia, len, drawing: drawingVal, article: articleInput?.value }));

    if (document.getElementById('d-res-blanks')) document.getElementById('d-res-blanks').innerText = window.formatCurr(blankCost);
    if (document.getElementById('d-res-clamps')) document.getElementById('d-res-clamps').innerText = window.formatCurr(clampPrice + centerPrice);
    if (document.getElementById('d-res-cost')) document.getElementById('d-res-cost').innerText = window.formatCurr(K);
    if (document.getElementById('d-res-total')) document.getElementById('d-res-total').innerText = window.formatCurr(H);

    return { K, H, I };
};

window.saveStep5 = function() {
    const blankSelect = document.getElementById('d-blank-select');
    const lengthInput = document.getElementById('d-length');

    if (!blankSelect || !lengthInput) return;

    const blankId = blankSelect?.value;
    const blank = window.db.rods_blanks?.[blankId];
    const length = parseFloat(lengthInput.value) || 0;

    if (!blank) return notify('Сначала подготовьте и выберите заготовку (Шаг 2)', 'warning');
    if (length <= 0) return notify('Укажите корректную длину сдвоенного прутка (мм)', 'warning');

    const res = window.calcStep5();
    if (res.H <= 0) return notify('Прайсовая цена сдвоенного прутка должна быть больше 0', 'warning');

    const dia = blank.dia;
    const article = document.getElementById('d-article')?.value || `DBL-${dia}-${length}`;
    const name = `Сдвоенный пруток Ø${dia} мм L=${length} мм`;
    const drawingVal = document.getElementById('d-drawing')?.value.trim() || '';

    if (!window.db.rods_double) window.db.rods_double = [];
    const existingIdx = window.db.rods_double.findIndex(r => r.article === article || r.name === name);

    const record = {
        name,
        article,
        type: 'сдвоенный',
        processingType: 'сдвоенный',
        dia,
        length,
        clampPrice: parseFloat(document.getElementById('d-clamp-price')?.value) || 0,
        centerClampPrice: parseFloat(document.getElementById('d-center-clamp-price')?.value) || 0,
        labor: parseFloat(document.getElementById('d-labor')?.value) || 0,
        drawing: drawingVal,
        photo: drawingVal,
        blankId,
        costPrice: res.K,
        priceNoVat: res.K,
        price: res.H,
        priceEuro: res.I,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Сдвоенный пруток "${name}" (${article}) уже есть в базе. Обновить прайсовую цену до ${window.formatCurr(res.H)}?`)) {
            window.db.rods_double[existingIdx] = { ...window.db.rods_double[existingIdx], ...record };
            window.persistAndRender('Сдвоенный пруток успешно обновлен в базе!');
        }
    } else {
        window.db.rods_double.push(record);
        window.persistAndRender('Сдвоенный пруток успешно сохранен в базу!');
    }
};

window.updateBlanksForStep5 = function() {
    const diaSelect = document.getElementById('d-dia-select');
    const blankSel = document.getElementById('d-blank-select');
    if (!diaSelect || !blankSel) return;

    const dia = diaSelect.value;
    const filtered = (window.db.rods_blanks || [])
        .map((b, i) => ({ ...b, originalIdx: i }))
        .filter(b => String(b.dia) === String(dia));

    const prevVal = blankSel.value;
    blankSel.innerHTML = filtered.map(b => `<option value="${b.originalIdx}">Заготовка L=${b.length} мм (${window.formatCurr(b.price || b.priceNoVat)})</option>`).join('');
    
    if (filtered.some(b => String(b.originalIdx) === String(prevVal))) {
        blankSel.value = prevVal;
    }
    window.calcStep5();
};

window.restoreLastStep5Session = function() {
    const savedState = localStorage.getItem('prutkon_step5_state');
    if (savedState) {
        try {
            const s = JSON.parse(savedState);
            if (s.dia !== undefined) document.getElementById('d-dia-select').value = s.dia;
            window.updateBlanksForStep5();
            if (s.blankId !== undefined && window.db.rods_blanks?.[s.blankId]) document.getElementById('d-blank-select').value = s.blankId;
            if (s.clampPrice !== undefined) document.getElementById('d-clamp-price').value = s.clampPrice;
            if (s.centerPrice !== undefined) document.getElementById('d-center-clamp-price').value = s.centerPrice;
            if (s.labor !== undefined) document.getElementById('d-labor').value = s.labor;
            if (s.len !== undefined) document.getElementById('d-length').value = s.len;
            if (s.drawing !== undefined && document.getElementById('d-drawing')) document.getElementById('d-drawing').value = s.drawing;
            window.calcStep5();
            notify('🔄 Данные Сдвоенного прутка успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error(e); }
    } else {
        notify('Нет сохраненных данных в сессии', 'warning');
    }
};
