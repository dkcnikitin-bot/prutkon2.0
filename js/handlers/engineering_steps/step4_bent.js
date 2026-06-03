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
    const baseRod = window.db.rods_standard?.[rodId] || window.db.rods_bent?.[rodId];
    const basePrice = parseFloat(baseRod?.priceNoVat || baseRod?.price || 0);

    const labor = parseFloat(document.getElementById('bent-labor')?.value) || 0;
    
    // Себестоимость K = BasePrice + AA
    const K = basePrice + labor;
    const H = K * 2;
    const I = H / 105;

    if (document.getElementById('bent-res-base')) document.getElementById('bent-res-base').innerText = window.formatCurr(basePrice);
    if (document.getElementById('bent-res-cost')) document.getElementById('bent-res-cost').innerText = window.formatCurr(K);
    if (document.getElementById('bent-res-total')) document.getElementById('bent-res-total').innerText = window.formatCurr(H);

    const procType = document.getElementById('complex-processing-type')?.value || 'стальной гнутый';
    const artInput = document.getElementById('bent-article');
    if (baseRod && artInput && (!artInput.value || artInput.value.startsWith('PR-') || artInput.value.endsWith('-B') || artInput.value.endsWith('-R') || artInput.value.endsWith('-W') || artInput.value.endsWith('-N') || artInput.value.endsWith('-F'))) {
        let sfx = '-B';
        if (procType.includes('обрезиненный')) sfx = '-R';
        else if (procType.includes('сварной')) sfx = '-W';
        else if (procType.includes('игольчатый')) sfx = '-N';
        else if (procType.includes('пальчиковый')) sfx = '-F';
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

    return { K, H, I };
};

window.saveStep4 = function() {
    const rodSelect = document.getElementById('bent-rod-select');
    const rodId = rodSelect?.value;
    const baseRod = window.db.rods_standard?.[rodId] || window.db.rods_bent?.[rodId];

    if (!baseRod) return notify('Сначала выберите базовый пруток из Шага 3', 'warning');

    const res = window.calcStep4();
    if (res.H <= 0) return notify('Прайсовая цена изделия должна быть больше 0', 'warning');

    const procType = document.getElementById('complex-processing-type')?.value || 'стальной гнутый';
    const name = `${baseRod.name} (${procType})`;
    let sfx = '-B';
    if (procType.includes('обрезиненный')) sfx = '-R';
    else if (procType.includes('сварной')) sfx = '-W';
    else if (procType.includes('игольчатый')) sfx = '-N';
    else if (procType.includes('пальчиковый')) sfx = '-F';
    const article = document.getElementById('bent-article')?.value || (baseRod.article + sfx);

    const isRubber = procType.includes('обрезиненный');
    const targetDb = isRubber ? 'rods_rubber' : 'rods_bent';
    if (!window.db[targetDb]) window.db[targetDb] = [];
    const existingIdx = window.db[targetDb].findIndex(r => r.article === article || r.name === name);

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
        priceNoVat: res.K,
        price: res.H,
        priceEuro: res.I,
        baseId: rodId,
        ts: Date.now()
    };

    if (existingIdx !== -1) {
        if (confirm(`Изделие "${name}" (${article}) уже есть в базе. Обновить прайсовую цену до ${window.formatCurr(res.H)}?`)) {
            window.db[targetDb][existingIdx] = { ...window.db[targetDb][existingIdx], ...record };
            window.persistAndRender('Сложный пруток успешно обновлен в базе!');
        }
    } else {
        window.db[targetDb].push(record);
        window.persistAndRender('Сложный пруток успешно сохранен в базу!');
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
            if (s.rodId !== undefined && (window.db.rods_standard?.[s.rodId] || window.db.rods_bent?.[s.rodId])) document.getElementById('bent-rod-select').value = s.rodId;
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

