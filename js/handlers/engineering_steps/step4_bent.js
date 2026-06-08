/* engineering_steps/step4_bent.js - Шаг 4: Модификация и Нанесение покрытий (Сложные и Обрезиненные прутки) */

window.onComplexProcessingChange = function() {
    const procType = document.getElementById('complex-processing-type')?.value || 'стальной гнутый';
    const bSection = document.getElementById('section-bending');
    const rSection = document.getElementById('section-rubber');
    const nSection = document.getElementById('section-needle');
    const wSection = document.getElementById('section-welding');
    const fSection = document.getElementById('section-finger');

    if (bSection) bSection.style.display = 'none';
    if (rSection) rSection.style.display = 'none';
    if (nSection) nSection.style.display = 'none';
    if (wSection) wSection.style.display = 'none';
    if (fSection) fSection.style.display = 'none';

    if (procType.includes('обрезиненный')) {
        if (rSection) rSection.style.display = 'block';
        if (procType.includes('гнутый')) {
            if (bSection) bSection.style.display = 'block';
        }
    } else if (procType.includes('игольчатый')) {
        if (nSection) nSection.style.display = 'block';
    } else if (procType.includes('пальчиковый')) {
        if (fSection) fSection.style.display = 'block';
    } else if (procType.includes('сварной')) {
        if (wSection) wSection.style.display = 'block';
    } else {
        if (bSection) bSection.style.display = 'block';
    }
    window.calcStep4();
};

window.calcStep4 = function() {
    const rodSelect = document.getElementById('bent-rod-select');
    if (!rodSelect) return { K: 0, H: 0, I: 0 };

    const rodId = rodSelect.value;
    const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
    const baseRod = allRods[rodId];
    
    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const setC = (id, val) => setT(id, window.formatCurr(val));

    if (!baseRod) {
        setT('bent-res-base', '--');
        setT('bent-res-cost', '--');
        setT('bent-res-total', '--');
        return { K: 0, H: 0, I: 0 };
    }

    const baseCostNoVat = parseFloat(baseRod.costPrice || baseRod.priceNoVat || baseRod.price || 0);
    const labor = parseFloat(document.getElementById('bent-labor')?.value) || 0;
    
    // Себестоимость без НДС
    const costPriceNoVat = baseCostNoVat + labor;
    const vatRate = parseFloat(baseRod.vatRate || 1.20);
    const costPriceVat = costPriceNoVat * vatRate;

    // Продажные цены с 100% наценкой
    const priceNoVat = costPriceNoVat * 2.0;
    const priceVat = priceNoVat * vatRate;
    const priceEuro = priceVat / 105;

    setC('bent-res-base', baseRod.price || 0);
    setC('bent-res-cost', costPriceNoVat);
    setC('bent-res-total', priceVat);

    const procType = document.getElementById('bent-type')?.value || 'гнутый';
    const artInput = document.getElementById('bent-article');
    if (baseRod && artInput && (!artInput.value || artInput.value.startsWith('PR-') || artInput.value.endsWith('-B') || artInput.value.endsWith('-R') || artInput.value.endsWith('-W') || artInput.value.endsWith('-N') || artInput.value.endsWith('-F'))) {
        let sfx = '-B';
        if (procType.includes('сварной')) sfx = '-W';
        else if (procType.includes('комби')) sfx = '-C';
        artInput.value = baseRod.article + sfx;
    }

    // Автосохранение в сессию
    const state = {
        rodId, labor, procType, article: artInput?.value, photo: document.getElementById('bent-photo')?.value, drawing: document.getElementById('bent-drawing')?.value,
        techType: document.getElementById('bent-tech-type')?.value, hessels: document.getElementById('bent-art-hessels')?.value, ropa: document.getElementById('bent-art-ropa')?.value, broekema: document.getElementById('bent-art-broekema')?.value, grimme: document.getElementById('bent-art-grimme')?.value, extra: document.getElementById('bent-art-extra')?.value,
        beltWidth: document.getElementById('bent-belt-width')?.value, pitchSide: document.getElementById('bent-pitch-side')?.value, pitchCenter: document.getElementById('bent-pitch-center')?.value, centerPart: document.getElementById('bent-center-part')?.value,
        tips: document.getElementById('bent-tips')?.value, spikeH: document.getElementById('bent-spike-h')?.value, widthRubber: document.getElementById('bent-width-rubber')?.value, diaRubber: document.getElementById('bent-dia-rubber')?.value,
        angles: document.getElementById('bent-angles')?.value, offset: document.getElementById('bent-offset')?.value, matrix: document.getElementById('bent-matrix')?.value,
        needleH: document.getElementById('bent-needle-h')?.value, needleStep: document.getElementById('bent-needle-step')?.value, needleAngle: document.getElementById('bent-needle-angle')?.value, needleCount: document.getElementById('bent-needle-count')?.value,
        weldType: document.getElementById('bent-weld-type')?.value, weldPoints: document.getElementById('bent-weld-points')?.value, weldWire: document.getElementById('bent-weld-wire')?.value,
        fingerLen: document.getElementById('bent-finger-len')?.value, fingerDia: document.getElementById('bent-finger-dia')?.value, fingerSide: document.getElementById('bent-finger-side')?.value,
        available: document.getElementById('bent-available')?.checked !== false
    };
    localStorage.setItem('prutkon_step4_state', JSON.stringify(state));

    return { K: costPriceNoVat, H: priceVat, I: priceEuro };
};

window.saveStep4 = function() {
    const rodSelect = document.getElementById('bent-rod-select');
    const rodId = rodSelect?.value;
    const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
    const baseRod = allRods[rodId];

    if (!baseRod) return notify('Сначала выберите базовый пруток из Шага 3', 'warning');

    const res = window.calcStep4();
    if (res.H <= 0) return notify('Прайсовая цена изделия должна быть больше 0', 'warning');

    const procType = document.getElementById('bent-type')?.value || 'гнутый';
    const name = `${baseRod.name} (${procType})`;
    let sfx = '-B';
    if (procType.includes('сварной')) sfx = '-W';
    else if (procType.includes('комби')) sfx = '-C';
    const article = document.getElementById('bent-article')?.value || (baseRod.article + sfx);

    if (!window.db.rods_bent) window.db.rods_bent = [];
    const existingIdx = window.db.rods_bent.findIndex(r => r.article === article || r.name === name);

    const record = {
        ...baseRod,
        name,
        article,
        type: procType,
        processingType: procType,
        photo: document.getElementById('bent-photo')?.value || '',
        drawing: document.getElementById('bent-drawing')?.value || '',
        techType: document.getElementById('bent-tech-type')?.value || baseRod.techType || '',
        artHessels: document.getElementById('bent-art-hessels')?.value || '',
        artRopa: document.getElementById('bent-art-ropa')?.value || '',
        artBroekema: document.getElementById('bent-art-broekema')?.value || '',
        artGrimme: document.getElementById('bent-art-grimme')?.value || '',
        artExtra: document.getElementById('bent-art-extra')?.value || '',
        beltWidth: document.getElementById('bent-belt-width')?.value || baseRod.width || '',
        pitchSide: document.getElementById('bent-pitch-side')?.value || '',
        pitchCenter: document.getElementById('bent-pitch-center')?.value || '',
        centerPart: document.getElementById('bent-center-part')?.value || '',
        tips: document.getElementById('bent-tips')?.value || '',
        spikeH: parseFloat(document.getElementById('bent-spike-h')?.value) || 0,
        widthRubber: parseFloat(document.getElementById('bent-width-rubber')?.value) || 610,
        diaRubber: parseFloat(document.getElementById('bent-dia-rubber')?.value) || 19,
        angles: document.getElementById('bent-angles')?.value || '',
        offset: document.getElementById('bent-offset')?.value || '',
        matrix: document.getElementById('bent-matrix')?.value || '',
        needleH: parseFloat(document.getElementById('bent-needle-h')?.value) || 45,
        needleStep: parseFloat(document.getElementById('bent-needle-step')?.value) || 30,
        needleAngle: document.getElementById('bent-needle-angle')?.value || '15°',
        needleCount: parseFloat(document.getElementById('bent-needle-count')?.value) || 32,
        weldType: document.getElementById('bent-weld-type')?.value || '',
        weldPoints: parseFloat(document.getElementById('bent-weld-points')?.value) || 4,
        weldWire: parseFloat(document.getElementById('bent-weld-wire')?.value) || 15,
        fingerLen: parseFloat(document.getElementById('bent-finger-len')?.value) || 110,
        fingerDia: parseFloat(document.getElementById('bent-finger-dia')?.value) || 10,
        fingerSide: document.getElementById('bent-finger-side')?.value || 'С боковыми ограничителями',
        available: document.getElementById('bent-available')?.checked !== false,
        labor: parseFloat(document.getElementById('bent-labor')?.value) || 0,
        costPrice: res.K,
        costPriceVat: res.K * (baseRod.vatRate || 1.20),
        priceNoVat: res.K * 2.0,
        price: res.H, // Продажная цена с НДС
        priceVat: res.H,
        priceEuro: res.I,
        baseId: rodId,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Изделие "${name}" (${article}) уже есть в базе. Обновить прайсовую цену до ${window.formatCurr(res.H)}?`)) {
            window.db.rods_bent[existingIdx] = { ...window.db.rods_bent[existingIdx], ...record };
            window.persistAndRender('Сложный пруток успешно обновлен в базе!');
        }
    } else {
        window.db.rods_bent.push(record);
        window.persistAndRender('Сложный пруток успешно сохранен в базу!');
    }
};

/* --- ШАГ 5: ОБРЕЗИНЕННЫЙ ПРУТОК --- */
window.calcStep5 = function() {
    const rodSelect = document.getElementById('rub-rod-select');
    if (!rodSelect) return { K: 0, H: 0, I: 0 };

    const rodId = rodSelect.value;
    const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
    const baseRod = allRods[rodId];
    
    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const setC = (id, val) => setT(id, window.formatCurr(val));

    if (!baseRod) {
        setT('rub-res-base', '--');
        setT('rub-res-total', '--');
        return { K: 0, H: 0, I: 0 };
    }

    const baseCostNoVat = parseFloat(baseRod.costPrice || baseRod.priceNoVat || baseRod.price || 0);
    const labor = parseFloat(document.getElementById('rub-labor')?.value) || 0;
    
    // Себестоимость без НДС
    const costPriceNoVat = baseCostNoVat + labor;
    const vatRate = parseFloat(baseRod.vatRate || 1.20);
    const costPriceVat = costPriceNoVat * vatRate;

    // Продажные цены с 100% наценкой
    const priceNoVat = costPriceNoVat * 2.0;
    const priceVat = priceNoVat * vatRate;
    const priceEuro = priceVat / 105;

    setC('rub-res-base', baseRod.price || 0);
    setC('rub-res-total', priceVat);

    const artInput = document.getElementById('rub-article');
    if (baseRod && artInput && (!artInput.value || artInput.value.startsWith('PR-') || !artInput.value.endsWith('-R'))) {
        artInput.value = baseRod.article + '-R';
    }

    // Автосохранение в сессию
    const state = {
        rodId,
        labor,
        article: artInput?.value,
        techType: document.getElementById('rub-tech-type')?.value,
        material: document.getElementById('rub-material')?.value,
        dia: document.getElementById('rub-dia')?.value,
        width: document.getElementById('rub-width')?.value
    };
    localStorage.setItem('prutkon_step5_state_rubber', JSON.stringify(state));

    return { K: costPriceNoVat, H: priceVat, I: priceEuro };
};

window.saveStep5 = function() {
    const rodSelect = document.getElementById('rub-rod-select');
    const rodId = rodSelect?.value;
    const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
    const baseRod = allRods[rodId];

    if (!baseRod) return notify('Сначала выберите базовый пруток (Шаг 3 или 4)', 'warning');

    const res = window.calcStep5();
    if (res.H <= 0) return notify('Прайсовая цена изделия должна быть больше 0', 'warning');

    const article = document.getElementById('rub-article')?.value || (baseRod.article + '-R');
    const name = `${baseRod.name} (Обрезиненный)`;

    if (!window.db.rods_rubber) window.db.rods_rubber = [];
    const existingIdx = window.db.rods_rubber.findIndex(r => r.article === article || r.name === name);

    const record = {
        ...baseRod,
        name,
        article,
        type: 'обрезиненный',
        processingType: 'обрезиненный',
        rubberMaterial: document.getElementById('rub-material')?.value || '',
        rubberDia: parseFloat(document.getElementById('rub-dia')?.value) || 0,
        rubberWidth: parseFloat(document.getElementById('rub-width')?.value) || 0,
        techType: document.getElementById('rub-tech-type')?.value || baseRod.techType || '',
        costPrice: res.K,
        costPriceVat: res.K * (baseRod.vatRate || 1.20),
        priceNoVat: res.K * 2.0,
        price: res.H, // Продажная цена с НДС (Прайс)
        priceVat: res.H,
        priceEuro: res.I,
        baseId: rodId,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Изделие "${name}" (${article}) уже есть в базе. Обновить прайсовую цену до ${window.formatCurr(res.H)}?`)) {
            window.db.rods_rubber[existingIdx] = { ...window.db.rods_rubber[existingIdx], ...record };
            window.persistAndRender('Обрезиненный пруток успешно обновлен в базе!');
        }
    } else {
        window.db.rods_rubber.push(record);
        window.persistAndRender('Обрезиненный пруток успешно сохранен в базу!');
    }
};

window.restoreLastStep5Session = function() {
    const savedState = localStorage.getItem('prutkon_step5_state_rubber');
    if (savedState) {
        try {
            const s = JSON.parse(savedState);
            if (s.rodId !== undefined) document.getElementById('rub-rod-select').value = s.rodId;
            if (s.labor !== undefined) document.getElementById('rub-labor').value = s.labor;
            if (s.article !== undefined) document.getElementById('rub-article').value = s.article;
            if (s.techType !== undefined) document.getElementById('rub-tech-type').value = s.techType;
            if (s.material !== undefined) document.getElementById('rub-material').value = s.material;
            if (s.dia !== undefined) document.getElementById('rub-dia').value = s.dia;
            if (s.width !== undefined) document.getElementById('rub-width').value = s.width;
            
            window.calcStep5();
            notify('🔄 Данные Обрезиненного прутка успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error(e); }
    }
};

window.restoreLastStep4Session = function() {
    const savedState = localStorage.getItem('prutkon_step4_state');
    if (savedState) {
        try {
            const s = JSON.parse(savedState);
            if (s.procType !== undefined) {
                const pSel = document.getElementById('complex-processing-type');
                if (pSel) pSel.value = s.procType;
                window.onComplexProcessingChange();
            }
            const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
            if (s.rodId !== undefined && allRods[s.rodId]) document.getElementById('bent-rod-select').value = s.rodId;
            if (s.article !== undefined) document.getElementById('bent-article').value = s.article;
            if (s.photo !== undefined) document.getElementById('bent-photo').value = s.photo;
            if (s.drawing !== undefined) document.getElementById('bent-drawing').value = s.drawing;
            if (s.techType !== undefined) document.getElementById('bent-tech-type').value = s.techType;
            if (s.hessels !== undefined) document.getElementById('bent-art-hessels').value = s.hessels;
            if (s.ropa !== undefined) document.getElementById('bent-art-ropa').value = s.ropa;
            if (s.broekema !== undefined) document.getElementById('bent-art-broekema').value = s.broekema;
            if (s.grimme !== undefined) document.getElementById('bent-art-grimme').value = s.grimme;
            if (s.extra !== undefined) document.getElementById('bent-art-extra').value = s.extra;
            if (s.beltWidth !== undefined) document.getElementById('bent-belt-width').value = s.beltWidth;
            if (s.pitchSide !== undefined) document.getElementById('bent-pitch-side').value = s.pitchSide;
            if (s.pitchCenter !== undefined) document.getElementById('bent-pitch-center').value = s.pitchCenter;
            if (s.centerPart !== undefined) document.getElementById('bent-center-part').value = s.centerPart;
            if (s.tips !== undefined && document.getElementById('bent-tips')) document.getElementById('bent-tips').value = s.tips;
            if (s.spikeH !== undefined && document.getElementById('bent-spike-h')) document.getElementById('bent-spike-h').value = s.spikeH;
            if (s.widthRubber !== undefined && document.getElementById('bent-width-rubber')) document.getElementById('bent-width-rubber').value = s.widthRubber;
            if (s.diaRubber !== undefined && document.getElementById('bent-dia-rubber')) document.getElementById('bent-dia-rubber').value = s.diaRubber;
            if (s.angles !== undefined && document.getElementById('bent-angles')) document.getElementById('bent-angles').value = s.angles;
            if (s.offset !== undefined && document.getElementById('bent-offset')) document.getElementById('bent-offset').value = s.offset;
            if (s.matrix !== undefined && document.getElementById('bent-matrix')) document.getElementById('bent-matrix').value = s.matrix;
            if (s.needleH !== undefined && document.getElementById('bent-needle-h')) document.getElementById('bent-needle-h').value = s.needleH;
            if (s.needleStep !== undefined && document.getElementById('bent-needle-step')) document.getElementById('bent-needle-step').value = s.needleStep;
            if (s.needleAngle !== undefined && document.getElementById('bent-needle-angle')) document.getElementById('bent-needle-angle').value = s.needleAngle;
            if (s.needleCount !== undefined && document.getElementById('bent-needle-count')) document.getElementById('bent-needle-count').value = s.needleCount;
            if (s.weldType !== undefined && document.getElementById('bent-weld-type')) document.getElementById('bent-weld-type').value = s.weldType;
            if (s.weldPoints !== undefined && document.getElementById('bent-weld-points')) document.getElementById('bent-weld-points').value = s.weldPoints;
            if (s.weldWire !== undefined && document.getElementById('bent-weld-wire')) document.getElementById('bent-weld-wire').value = s.weldWire;
            if (s.fingerLen !== undefined && document.getElementById('bent-finger-len')) document.getElementById('bent-finger-len').value = s.fingerLen;
            if (s.fingerDia !== undefined && document.getElementById('bent-finger-dia')) document.getElementById('bent-finger-dia').value = s.fingerDia;
            if (s.fingerSide !== undefined && document.getElementById('bent-finger-side')) document.getElementById('bent-finger-side').value = s.fingerSide;
            if (s.labor !== undefined && document.getElementById('bent-labor')) document.getElementById('bent-labor').value = s.labor;
            if (s.available !== undefined && document.getElementById('bent-available')) document.getElementById('bent-available').checked = s.available;

            window.calcStep4();
            notify('🔄 Данные Шага 4 успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error(e); }
    } else {
        notify('Нет сохраненных данных в сессии', 'warning');
    }
};

