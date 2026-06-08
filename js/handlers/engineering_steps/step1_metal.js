/* engineering_steps/step1_metal.js - Шаг 1: Закупка и приемка сырья (Металл) с подгрузкой 19 полей и нарезкой */

window.currentStep1Metal = null;

window.onSelectWarehouseBatch = function() {
    const select = document.getElementById('m-warehouse-select');
    if (!select || !select.value) return;

    const batchId = select.value;
    const batch = (window.dbWarehouseBatches || []).find(b => String(b.id) === String(batchId));

    if (!batch) {
        notify('Партия не найдена в складских остатках', 'warning');
        return;
    }

    // Извлечение параметров партии
    const code = batch.invoice || batch.id || 'б/н';
    const dia = parseFloat(batch.dia || batch.diameter || 0);
    const steel = batch.name || batch.steel || batch.steel_type || 'Ст45';
    const availWeightKg = parseFloat(batch.qty || batch.weight || batch.available_weight || 0);
    const totalWeightKg = parseFloat(batch.total_weight || availWeightKg);
    const priceTonNoVat = parseFloat(batch.price_ton || batch.price || 0) * (batch.price < 1000 ? 1000 : 1);
    const deliveryCost = parseFloat(batch.deliveryCost || batch.delivery_total || 0);
    const vatRate = parseFloat(batch.vat_rate || document.getElementById('m-vat-rate')?.value || 1.2);
    
    // Расчет 19 финансовых показателей
    const density = window.getSteelDensity ? window.getSteelDensity(steel) : 7.85;
    const wpm = (Math.PI * dia * dia * density) / 4000; // вес 1 м.п. в кг
    const rodLenM = 6; // стандартный хлыст 6 м
    const weightTonne = totalWeightKg / 1000;
    const priceTonVat = priceTonNoVat * vatRate;

    const sumNoVat = weightTonne * priceTonNoVat;
    const sumVat = sumNoVat * vatRate;

    const priceKgNoVat = priceTonNoVat / 1000;
    const priceMNoVat = priceKgNoVat * wpm;
    const priceMVat = priceMNoVat * vatRate;

    const delKgNoVat = totalWeightKg > 0 ? (deliveryCost / totalWeightKg) : 0;
    const delMNoVat = delKgNoVat * wpm;
    const delMVat = delMNoVat * vatRate;

    const totMNoVat = priceMNoVat + delMNoVat;
    const totMVat = totMNoVat * vatRate;

    const dateStr = batch.date || batch.created_at ? new Date(batch.date || batch.created_at).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
    const vendorStr = batch.vendor || batch.supplier || batch.counterparty || 'ООО МеталлСнаб (Прямая поставка)';

    // Сохраняем в текущий объект для передачи в Шаг 2 и базу
    window.currentStep1Metal = {
        code, dia, wpm, rodLenM, steel, availWeightKg, totalWeightKg,
        priceTonNoVat, priceTonVat, sumNoVat, sumVat,
        priceMNoVat, priceMVat, delMNoVat, delMVat,
        totMNoVat, totMVat, vatRate, dateStr, vendorStr
    };
    
    // Автосохранение сессии для защиты от сбоев/обновления страницы
    localStorage.setItem('prutkon_current_step1_metal', JSON.stringify(window.currentStep1Metal));
    localStorage.setItem('prutkon_last_selected_batch_id', batchId);

    // Заполнение UI (19 полей)
    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const setC = (id, val) => setT(id, window.formatCurr(val));

    setT('m-f-code', code);
    setT('m-f-dia', dia ? `${dia} мм` : '--');
    setT('m-f-wpm', wpm ? `${wpm.toFixed(3)} кг` : '--');
    setT('m-f-rodlen', `${rodLenM} п.м. (Хлыст)`);
    setT('m-f-steel', steel);
    setT('m-f-avail', `${window.formatWhNumber(availWeightKg)} кг`);
    setT('m-f-weight', `${window.formatWhNumber(totalWeightKg)} кг (${weightTonne.toFixed(3)} т)`);

    setC('m-f-ton-novat', priceTonNoVat);
    setC('m-f-ton-vat', priceTonVat);
    setC('m-f-sum-novat', sumNoVat);
    setC('m-f-sum-vat', sumVat);

    setC('m-f-m-novat', priceMNoVat);
    setC('m-f-m-vat', priceMVat);
    setC('m-f-del-novat', delMNoVat);
    setC('m-f-del-vat', delMVat);

    setC('m-f-tot-novat', totMNoVat);
    setC('m-f-tot-vat', totMVat);

    setT('m-f-vatrate', vatRate === 1.2 ? '20%' : (vatRate === 1.22 ? '22%' : 'Без НДС'));
    setT('m-f-date', dateStr);
    setT('m-f-vendor', vendorStr);

    // Синхронизация с ручными инпутами для совместимости
    if (document.getElementById('m-name')) document.getElementById('m-name').value = steel;
    if (document.getElementById('m-dia')) document.getElementById('m-dia').value = dia;
    if (document.getElementById('m-batch-kg')) document.getElementById('m-batch-kg').value = totalWeightKg.toFixed(0);
    if (document.getElementById('m-delivery-cost')) document.getElementById('m-delivery-cost').value = deliveryCost.toFixed(0);
    if (document.getElementById('m-price-ton-no-vat')) document.getElementById('m-price-ton-no-vat').value = priceTonNoVat.toFixed(2);
    if (document.getElementById('m-price-ton-vat')) document.getElementById('m-price-ton-vat').value = priceTonVat.toFixed(2);
    if (document.getElementById('m-weight-m')) document.getElementById('m-weight-m').value = wpm.toFixed(3);

    // Открытие карточки деталей и панели отреза
    const detailsCard = document.getElementById('m-batch-details-card');
    const cutPanel = document.getElementById('m-cut-panel');
    if (detailsCard) detailsCard.style.display = 'block';
    if (cutPanel) cutPanel.style.display = 'block';

    window.calcStep1Cut();
    notify('Данные партии успешно загружены и рассчитаны!', 'success');
};

window.calcStep1Cut = function() {
    if (!window.currentStep1Metal) return { priceNoVat: 0, priceVat: 0, vatRate: 1.2 };

    const cutLen = parseFloat(document.getElementById('m-cut-len')?.value) || 0;
    const gap = parseFloat(document.getElementById('m-cut-gap')?.value) || 10;
    const labor = parseFloat(document.getElementById('m-cut-labor')?.value) || 50;

    const resQty = document.getElementById('m-res-cut-qty');
    const resRem = document.getElementById('m-res-cut-rem');
    const resWaste = document.getElementById('m-res-cut-waste');
    const resPriceNoVat = document.getElementById('m-res-cut-price-novat');
    const resVatRate = document.getElementById('m-res-cut-vatrate');
    const resPriceVat = document.getElementById('m-res-cut-price-vat');

    const rodLen = 6000; // 6 метров
    let qty = 0, rem = 0, waste = 0, unitPriceNoVat = 0, unitPriceVat = 0;
    const vatRate = window.currentStep1Metal.vatRate || 1.2;

    if (cutLen > 0 && (cutLen + gap) > 0) {
        qty = Math.floor((rodLen + gap) / (cutLen + gap));
        if (qty > 0) {
            rem = rodLen - (qty * cutLen + Math.max(0, qty - 1) * gap);
            waste = (rem / rodLen) * 100;

            const rodCostNoVat = window.currentStep1Metal.totMNoVat * (rodLen / 1000);
            const rodCostVat = window.currentStep1Metal.totMVat * (rodLen / 1000);
            
            const metalInBlankNoVat = rodCostNoVat / qty;
            const metalInBlankVat = rodCostVat / qty;

            unitPriceNoVat = metalInBlankNoVat + labor;
            unitPriceVat = metalInBlankVat + (labor * vatRate);
        }
    }

    if (resQty) resQty.innerText = `${qty} шт`;
    if (resRem) resRem.innerText = `${rem.toFixed(0)} мм`;
    if (resWaste) resWaste.innerText = `${waste.toFixed(1)} %`;
    if (resPriceNoVat) resPriceNoVat.innerText = window.formatCurr(unitPriceNoVat);
    if (resVatRate) resVatRate.innerText = vatRate === 1.2 ? '20%' : (vatRate === 1.22 ? '22%' : 'Без НДС');
    if (resPriceVat) resPriceVat.innerText = window.formatCurr(unitPriceVat);

    return { priceNoVat: unitPriceNoVat, priceVat: unitPriceVat, vatRate };
};

window.createBlankFromStep1 = function() {
    if (!window.currentStep1Metal) {
        notify('Сначала выберите партию со склада', 'warning');
        return;
    }

    const cutLen = parseFloat(document.getElementById('m-cut-len')?.value) || 0;
    const labor = parseFloat(document.getElementById('m-cut-labor')?.value) || 50;
    const res = window.calcStep1Cut();

    if (cutLen <= 0) return notify('Укажите корректную длину заготовки', 'warning');
    if (res.priceNoVat <= 0) return notify('Себестоимость заготовки должна быть больше 0', 'warning');

    const dia = window.currentStep1Metal.dia;
    const steel = window.currentStep1Metal.steel;
    const article = `BL-${dia}MM-L${cutLen}`;

    if (!window.db.rods_metal) window.db.rods_metal = [];
    let metalIdx = window.db.rods_metal.findIndex(m => m.name === steel && parseFloat(m.dia) === dia);
    if (metalIdx === -1) {
        window.db.rods_metal.push({
            name: steel,
            dia,
            pricePerM: window.currentStep1Metal.totMNoVat,
            pricePerMVat: window.currentStep1Metal.totMVat,
            vatRate: window.currentStep1Metal.vatRate,
            ts: Date.now(),
            code: window.currentStep1Metal.code
        });
        metalIdx = window.db.rods_metal.length - 1;
    } else {
        window.db.rods_metal[metalIdx].pricePerM = window.currentStep1Metal.totMNoVat;
        window.db.rods_metal[metalIdx].pricePerMVat = window.currentStep1Metal.totMVat;
        window.db.rods_metal[metalIdx].vatRate = window.currentStep1Metal.vatRate;
    }

    if (!window.db.rods_blanks) window.db.rods_blanks = [];
    const blankIdx = window.db.rods_blanks.findIndex(b => parseFloat(b.dia) === dia && parseFloat(b.length) === cutLen);
    
    const drawing = document.getElementById('m-drawing')?.value.trim() || '';

    const record = {
        dia,
        length: cutLen,
        labor,
        price: res.priceNoVat,
        priceVat: res.priceVat,
        vatRate: res.vatRate,
        article,
        metalName: steel,
        drawing,
        photo: drawing,
        ts: Date.now()
    };

    if (blankIdx !== -1) {
        window.db.rods_blanks[blankIdx] = { ...window.db.rods_blanks[blankIdx], ...record };
    } else {
        window.db.rods_blanks.push(record);
    }

    window.persistAndRender(`Заготовка "L=${cutLen} мм Ø${dia} мм" успешно создана и сохранена!`);

    // Переключение на Шаг 2 (Рубка) и автозаполнение полей
    setTimeout(() => {
        const step2Btn = document.querySelector('#rods-tabs button[data-step="2"]');
        if (step2Btn) step2Btn.click();

        const bMetalSelect = document.getElementById('b-metal-select');
        if (bMetalSelect && metalIdx !== -1) bMetalSelect.value = metalIdx;

        const bLen = document.getElementById('b-length');
        if (bLen) bLen.value = cutLen;

        const bLabor = document.getElementById('b-labor');
        if (bLabor) bLabor.value = labor;

        const bDrawing = document.getElementById('b-drawing');
        if (bDrawing && drawing) bDrawing.value = drawing;

        if (window.calcStep2) window.calcStep2();
    }, 150);
};

window.saveStep1 = function() {
    const drawingVal = document.getElementById('m-drawing')?.value.trim() || '';

    if (!window.currentStep1Metal) {
        // Если данные вводили вручную
        const nameInput = document.getElementById('m-name')?.value.trim();
        const diaInput = parseFloat(document.getElementById('m-dia')?.value) || 0;
        const priceNoVat = parseFloat(document.getElementById('m-price-ton-no-vat')?.value) || 0;
        const wpmInput = parseFloat(document.getElementById('m-weight-m')?.value) || (diaInput * diaInput * 0.006165);

        if (!nameInput || diaInput <= 0 || priceNoVat <= 0) {
            return notify('Заполните параметры металла или выберите партию со склада', 'warning');
        }

        const priceM = (priceNoVat / 1000) * wpmInput;
        if (!window.db.rods_metal) window.db.rods_metal = [];
        window.db.rods_metal.push({ name: nameInput, dia: diaInput, pricePerM: priceM, drawing: drawingVal, photo: drawingVal, ts: Date.now() });
        window.persistAndRender('Металл успешно сохранен в базу!');
        return;
    }

    if (!window.db.rods_metal) window.db.rods_metal = [];
    const existingIdx = window.db.rods_metal.findIndex(m => m.name === window.currentStep1Metal.steel && parseFloat(m.dia) === window.currentStep1Metal.dia);

    const record = {
        name: window.currentStep1Metal.steel,
        dia: window.currentStep1Metal.dia,
        pricePerM: window.currentStep1Metal.totMNoVat,
        drawing: drawingVal,
        photo: drawingVal,
        ts: Date.now(),
        code: window.currentStep1Metal.code
    };

    if (existingIdx !== -1) {
        window.db.rods_metal[existingIdx] = record;
        window.persistAndRender('Данные сырья успешно обновлены в базе!');
    } else {
        window.db.rods_metal.push(record);
        window.persistAndRender('Сырье успешно сохранено в базу!');
    }
};

window.clearStep1Data = function() {
    window.currentStep1Metal = null;
    const select = document.getElementById('m-warehouse-select');
    if (select) select.selectedIndex = 0;

    const detailsCard = document.getElementById('m-batch-details-card');
    const cutPanel = document.getElementById('m-cut-panel');
    if (detailsCard) detailsCard.style.display = 'none';
    if (cutPanel) cutPanel.style.display = 'none';

    document.querySelectorAll('#m-manual-grid input').forEach(inp => inp.value = '');
    notify('Форма расчета сырья очищена', 'info');
};

window.calcStep1Price = function(mode) {
    const vatRate = parseFloat(document.getElementById('m-vat-rate')?.value) || 1.2;
    const priceVatEl = document.getElementById('m-price-ton-vat');
    const priceNoVatEl = document.getElementById('m-price-ton-no-vat');
    if (!priceVatEl || !priceNoVatEl) return;
    
    if (mode === 'vat') {
        const val = parseFloat(priceVatEl.value) || 0;
        priceNoVatEl.value = (val / vatRate).toFixed(2);
    } else {
        const val = parseFloat(priceNoVatEl.value) || 0;
        priceVatEl.value = (val * vatRate).toFixed(2);
    }
    window.calcStep1();
};

window.calcStep1 = function() {
    const dia = parseFloat(document.getElementById('m-dia')?.value) || 0;
    const name = document.getElementById('m-name')?.value || 'Металл';
    const batchKg = parseFloat(document.getElementById('m-batch-kg')?.value) || 0;
    const delCost = parseFloat(document.getElementById('m-delivery-cost')?.value) || 0;
    const priceTonNoVat = parseFloat(document.getElementById('m-price-ton-no-vat')?.value) || 0;
    const vatRate = parseFloat(document.getElementById('m-vat-rate')?.value) || 1.2;

    let wpmInput = document.getElementById('m-weight-m');
    let wpm = parseFloat(wpmInput?.value) || 0;
    if (dia > 0 && (wpm === 0 || document.activeElement !== wpmInput)) {
        const density = window.getSteelDensity ? window.getSteelDensity(name) : 7.85;
        wpm = (Math.PI * dia * dia * density) / 4000;
        if (wpmInput) wpmInput.value = wpm.toFixed(4);
    }

    const priceKg = priceTonNoVat / 1000;
    const delKg = batchKg > 0 ? delCost / batchKg : 0;
    
    const priceMNoVat = priceKg * wpm;
    const delMNoVat = delKg * wpm;
    const totMNoVat = priceMNoVat + delMNoVat;
    const totMVat = totMNoVat * vatRate;

    window.currentStep1Metal = {
        code: 'Ручной ввод', dia, wpm, rodLenM: 6, steel: name, availWeightKg: batchKg, totalWeightKg: batchKg,
        priceTonNoVat, priceTonVat: priceTonNoVat * vatRate, sumNoVat: (batchKg/1000)*priceTonNoVat, sumVat: (batchKg/1000)*priceTonNoVat*vatRate,
        priceMNoVat, priceMVat: priceMNoVat * vatRate, delMNoVat, delMVat: delMNoVat * vatRate,
        totMNoVat, totMVat, vatRate, dateStr: new Date().toLocaleDateString('ru-RU'), vendorStr: 'Ручной ввод'
    };

    const detailsCard = document.getElementById('m-batch-details-card');
    const cutPanel = document.getElementById('m-cut-panel');
    if (detailsCard) detailsCard.style.display = 'block';
    if (cutPanel) cutPanel.style.display = 'block';

    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    setT('m-res-del-kg', window.formatCurr(delKg));
    setT('m-res-del-m', window.formatCurr(delMNoVat));
    setT('m-res-total-m', window.formatCurr(totMNoVat));

    window.onSelectWarehouseBatch_UpdateFromManual();
};

window.calcStep1Manual = window.calcStep1;

window.onSelectWarehouseBatch_UpdateFromManual = function() {
    if (!window.currentStep1Metal) return;
    const m = window.currentStep1Metal;
    const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const setC = (id, val) => setT(id, window.formatCurr(val));

    setT('m-f-code', m.code); setT('m-f-dia', `${m.dia} мм`); setT('m-f-wpm', `${m.wpm.toFixed(3)} кг`);
    setT('m-f-rodlen', '6 п.м.'); setT('m-f-steel', m.steel); setT('m-f-avail', `${m.availWeightKg} кг`);
    setT('m-f-weight', `${m.totalWeightKg} кг`); setC('m-f-ton-novat', m.priceTonNoVat); setC('m-f-ton-vat', m.priceTonVat);
    setC('m-f-sum-novat', m.sumNoVat); setC('m-f-sum-vat', m.sumVat); setC('m-f-m-novat', m.priceMNoVat);
    setC('m-f-m-vat', m.priceMVat); setC('m-f-del-novat', m.delMNoVat); setC('m-f-del-vat', m.delMVat);
    setC('m-f-tot-novat', m.totMNoVat); setC('m-f-tot-vat', m.totMVat); setT('m-f-vatrate', m.vatRate === 1.2 ? '20%' : (m.vatRate === 1.22 ? '22%' : 'Без НДС'));
    setT('m-f-date', m.dateStr); setT('m-f-vendor', m.vendorStr);
    window.calcStep1Cut();
};

window.restoreLastStep1Session = function() {
    const savedMetal = localStorage.getItem('prutkon_current_step1_metal');
    const savedBatchId = localStorage.getItem('prutkon_last_selected_batch_id');
    if (savedMetal) {
        try {
            window.currentStep1Metal = JSON.parse(savedMetal);
            const batchSel = document.getElementById('m-warehouse-batch');
            if (batchSel && savedBatchId) {
                batchSel.value = savedBatchId;
            }
            window.onSelectWarehouseBatch_UpdateFromManual();
            notify('🔄 Данные выбранной партии сырья успешно восстановлены из сессии!', 'info');
        } catch(e) { console.error('Ошибка восстановления Шага 1:', e); }
    } else {
        notify('Нет сохраненных данных в сессии', 'warning');
    }
};
