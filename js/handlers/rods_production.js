/* rods_production.js - ПРУТКОН Engineering Workflow Central Module */

const RODS_STORAGE_KEY = 'prutkon_rods_registry';
const RODS_KEYS = ['rods_metal', 'rods_blanks', 'rods_standard', 'rods_bent', 'rods_rubber', 'rods_double'];

window.formatCurr = (v) => (window.formatRusNumber ? window.formatRusNumber(v, 2) : parseFloat(v || 0).toFixed(2)) + " ₽";
window.formatWhNumber = window.formatWhNumber || ((v, dec = 2) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(v || 0));

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initData();
    renderRegistry();

    // Ожидание асинхронной загрузки справочников из core.js
    const checkCoreData = setInterval(() => {
        if (window.dbDirectories && window.dbDirectories.length > 0) {
            clearInterval(checkCoreData);
            window.updateDropdowns();
        }
    }, 150);
    setTimeout(() => clearInterval(checkCoreData), 3000);
});

function getEmptyRodsStore() {
    return {
        rods_metal: [],
        rods_blanks: [],
        rods_standard: [],
        rods_bent: [],
        rods_rubber: [],
        rods_double: []
    };
}

function persistRodsStore() {
    const payload = {};
    RODS_KEYS.forEach(key => {
        payload[key] = Array.isArray(window.db[key]) ? window.db[key] : [];
    });
    localStorage.setItem(RODS_STORAGE_KEY, JSON.stringify(payload));
    if (window.saveAllToLocal) window.saveAllToLocal();
}

function notify(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    alert(message);
}

window.persistAndRender = function(msg) {
    persistRodsStore();
    window.updateDropdowns();
    renderRegistry();
    if (msg) notify(msg, 'success');
};

function initData() {
    if (!window.db) window.db = {};

    let stored = getEmptyRodsStore();
    try {
        const raw = localStorage.getItem(RODS_STORAGE_KEY);
        if (raw) stored = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse rods storage', e);
    }
    
    RODS_KEYS.forEach(key => {
        const existing = window.db[key];
        if (Array.isArray(existing) && existing.length) return;
        window.db[key] = Array.isArray(stored[key]) ? stored[key] : [];
    });

    try {
        const whRaw = localStorage.getItem('prutkon_warehouse_inv');
        window.dbWarehouseInv = whRaw ? JSON.parse(whRaw) : {};
        const whBatches = localStorage.getItem('prutkon_warehouse_batches');
        window.dbWarehouseBatches = whBatches ? JSON.parse(whBatches) : [];
    } catch(e) {
        window.dbWarehouseInv = {};
        window.dbWarehouseBatches = [];
    }

    if (window.supabase) {
        window.supabase.from('warehouse_inventory').select('*').then(({ data }) => {
            if (data && data.length) {
                data.forEach(row => {
                    const d = row.data || row;
                    if (d.item_key) window.dbWarehouseInv[d.item_key] = parseFloat(d.quantity || 0);
                });
                localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
                window.updateDropdowns();
            }
        }).catch(err => console.error('Ошибка загрузки warehouse_inventory из Supabase:', err));

        window.supabase.from('metal_batches').select('*').then(({ data }) => {
            if (data && data.length) {
                window.dbWarehouseBatches = data.map(b => b.data || b);
                localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbWarehouseBatches));
                window.updateDropdowns();
            }
        }).catch(err => console.error('Ошибка загрузки партий из Supabase:', err));

        window.supabase.from('system_settings').select('*').eq('key', 'rods_registry').maybeSingle().then(({ data }) => {
            if (data && (data.value || data.data)) {
                const cloudRods = data.value || data.data;
                RODS_KEYS.forEach(k => {
                    if (cloudRods[k] && Array.isArray(cloudRods[k])) {
                        window.db[k] = cloudRods[k];
                    }
                });
                localStorage.setItem(RODS_STORAGE_KEY, JSON.stringify(window.db));
                renderRegistry();
                window.updateDropdowns();
                console.log('✅ Реестр прутков успешно синхронизирован из Supabase Cloud');
            }
        }).catch(err => console.error('Ошибка загрузки rods_registry из Supabase:', err));
    }

    window.updateDropdowns();
}

function initTabs() {
    const tabs = document.querySelectorAll('#rods-tabs button');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const step = btn.getAttribute('data-step');
            document.querySelectorAll('.step-container').forEach(c => c.classList.remove('active'));
            const container = document.getElementById(`step-${step}`);
            if (container) container.classList.add('active');
            
            window.updateDropdowns();
        });
    });
}

window.switchProductionStep = function(stepNum) {
    const tabs = document.querySelectorAll('#rods-tabs button');
    tabs.forEach(t => t.classList.remove('active'));
    const targetBtn = document.querySelector(`#rods-tabs button[data-step="${stepNum}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    document.querySelectorAll('.step-container').forEach(c => c.classList.remove('active'));
    const container = document.getElementById(`step-${stepNum}`);
    if (container) container.classList.add('active');
    window.updateDropdowns();
};

// Диспетчер сохранения текущего активного шага
window.saveCurrentStep = function() {
    const activeBtn = document.querySelector('#rods-tabs button.active');
    const step = activeBtn ? activeBtn.getAttribute('data-step') : "1";

    if (step == "1" && window.saveStep1) window.saveStep1();
    else if (step == "2" && window.saveStep2) window.saveStep2();
    else if (step == "3" && window.saveStep3) window.saveStep3();
    else if (step == "4" && window.saveStep4) window.saveStep4();
    else if (step == "5" && window.saveStep5) window.saveStep5();
    else if (step == "6" && window.saveStep6) window.saveStep6();
    else notify(`Сохранение для шага ${step} не настроено`, 'warning');
};

window.onLaborDirChange = function(prefix) {
    const dirSel = document.getElementById(`${prefix}-labor-dir`);
    const input = document.getElementById(`${prefix}-labor`);
    if (dirSel && input && dirSel.value) {
        input.value = dirSel.value;
        if (prefix === 'r' && window.calcStep3) window.calcStep3();
        if (prefix === 'bent' && window.calcStep4) window.calcStep4();
        if (prefix === 'rub' && window.calcStep5) window.calcStep5();
    }
};

window.onClampSelect = function() {
    const c1 = document.getElementById('d-clamp-select-type');
    const c2 = document.getElementById('d-center-clamp-select-type');
    if (c1 && c1.value) document.getElementById('d-clamp-price').value = parseFloat(c1.value) * 2;
    if (c2 && c2.value) document.getElementById('d-center-clamp-price').value = parseFloat(c2.value) || 0;
    if (window.calcStep6) window.calcStep6();
};

window.populateDirectoryEnums = function() {
    const metals = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'metal') : [];
    
    const dias = [...new Set(metals.map(m => window.parseRusFloat(m.diameter)).filter(v => v > 0))].sort((a,b) => a - b);
    const mDia = document.getElementById('m-dia');
    if (mDia && !mDia.dataset.populated) {
        mDia.innerHTML = '<option value="">-- Выберите --</option>' + dias.map(d => `<option value="${d}">${d} мм</option>`).join('');
        mDia.dataset.populated = 'true';
    }

    const steels = [...new Set(metals.map(m => m.name).filter(Boolean))].sort();
    const mName = document.getElementById('m-name');
    if (mName && !mName.dataset.populated) {
        mName.innerHTML = '<option value="">-- Выберите --</option>' + steels.map(s => `<option value="${s}">${s}</option>`).join('');
        mName.dataset.populated = 'true';
    }

    const mWhSelect = document.getElementById('m-warehouse-select');
    if (mWhSelect) {
        let h = '<option value="">-- Выберите партию металла из складских остатков --</option>';
        if (window.dbWarehouseBatches && window.dbWarehouseBatches.length) {
            window.dbWarehouseBatches.forEach(b => {
                const dia = parseFloat(b.dia || b.diameter || 0);
                const qty = parseFloat(b.qty || b.weight || b.available_weight || 0);
                h += `<option value="${b.id}">${b.name || b.steel_type || 'Металл'} Ø${dia} мм (Накладная: ${b.invoice || b.id || 'б/н'}) [Остаток: ${window.formatWhNumber(qty)} кг]</option>`;
            });
        }
        mWhSelect.innerHTML = h;
    }

    if (window.dbDirectories) {
        const fill = (id, cat, placeholder) => {
            const el = document.getElementById(id);
            if (!el) return;
            const items = window.dbDirectories.filter(d => d.category === cat);
            el.innerHTML = `<option value="">${placeholder}</option>` + 
                items.map(i => `<option value="${i.price || i.name}" data-name="${i.name}">${i.name} ${i.price ? '('+i.price+' ₽)' : ''}</option>`).join('');
        };

        fill('r-holes', 'holes', '-- Выбрать отверстие --');
        fill('r-pitch', 'pitch', '-- Выбрать межосевое --');
        fill('r-labor-dir', 'labor', '-- Из справочника --');
        fill('bent-labor-dir', 'labor', '-- Из справочника --');
        fill('rub-labor-dir', 'labor', '-- Из справочника --');
        fill('d-clamp-select-type', 'clamps', '-- Выбрать хомут --');
        fill('d-center-clamp-select-type', 'clamps', '-- Центр. хомут --');
        
        const techTypes = [...new Set(window.dbDirectories.filter(d => d.category === 'equipment').map(d => d.name))];
        const ttList = document.getElementById('tech-types-list');
        if (ttList) ttList.innerHTML = techTypes.map(t => `<option value="${t}">`).join('');
    }
};

window.autoRestoreBatchesForEngineering = function() {
    if (window.dbWarehouseInv && window.dbDirectories) {
        if (!window.dbWarehouseBatches) window.dbWarehouseBatches = [];
        let modified = false;
        window.dbDirectories.forEach(d => {
            const dataObj = d.data || d;
            if (dataObj.category === 'metal') {
                const k1 = String(d.id).startsWith('metal_') ? d.id : `metal_${d.id}`;
                const k2 = d.id;
                const qtyInv = parseFloat(window.dbWarehouseInv[k1] || window.dbWarehouseInv[k2] || dataObj.qty_kg || dataObj.quantity || dataObj.qty || 0);
                
                if (qtyInv > 0) {
                    const st = dataObj.steel_type || dataObj.name || 'Металл';
                    const diam = parseFloat(dataObj.diameter || 0);
                    const exists = window.dbWarehouseBatches.find(b => (b.name === st || b.steel_type === st) && parseFloat(b.dia || b.diameter || 0) === diam);
                    if (!exists) {
                        const invNum = dataObj.invoice_num || dataObj.invoice || 'Складской остаток';
                        const pr = parseFloat(dataObj.price_tonne || dataObj.price || 0);
                        window.dbWarehouseBatches.push({
                            id: 'batch_eng_' + d.id + '_' + Date.now(),
                            invoice: invNum,
                            name: st,
                            steel_type: st,
                            dia: diam,
                            diameter: diam,
                            qty: qtyInv,
                            weight: qtyInv,
                            available_weight: qtyInv,
                            total_weight: qtyInv,
                            price_ton: pr,
                            price: pr,
                            deliveryCost: 0,
                            vat_rate: 1.2,
                            supplier: dataObj.supplier || 'Складские остатки',
                            date: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        });
                        modified = true;
                    } else {
                        exists.qty = qtyInv;
                        exists.available_weight = qtyInv;
                    }
                }
            }
        });
        if (modified) {
            localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbWarehouseBatches));
        }
    }
};

window.updateDropdowns = function() {
    if (window.autoRestoreBatchesForEngineering) window.autoRestoreBatchesForEngineering();
    if (window.populateDirectoryEnums) window.populateDirectoryEnums();
    
    const metalSel = document.getElementById('b-metal-select');
    if (metalSel && window.db.rods_metal) {
        const prevVal = metalSel.value;
        metalIdx = window.db.rods_metal.map((m, i) => `<option value="${i}">${m.name} Ø${m.dia} мм (${window.formatCurr(m.pricePerM)}/м)</option>`).join('');
        metalSel.innerHTML = metalIdx;
        if (window.db.rods_metal[prevVal]) metalSel.value = prevVal;
        if (window.calcStep2) window.calcStep2();
    }

    window.updateBlanksForStep3();
    
    const allStandard = window.db.rods_standard || [];
    const allBent = window.db.rods_bent || [];

    const rod4Sel = document.getElementById('bent-rod-select');
    if (rod4Sel) {
        const prevVal = rod4Sel.value;
        let html = '<optgroup label="Прямые прутки (Шаг 3)">';
        allStandard.forEach((r, idx) => { html += `<option value="${idx}">${r.name || r.article} (${window.formatCurr(r.priceNoVat || r.price)})</option>`; });
        html += '</optgroup><optgroup label="Гнутые прутки">';
        allBent.forEach((r, idx) => {
            const combinedIdx = allStandard.length + idx;
            html += `<option value="${combinedIdx}">${r.name || r.article} (${window.formatCurr(r.priceNoVat || r.price)})</option>`;
        });
        html += '</optgroup>';
        rod4Sel.innerHTML = html;
        if (prevVal !== "" && prevVal !== null) rod4Sel.value = prevVal;
    }

    const rubSel = document.getElementById('rub-rod-select');
    if (rubSel) {
        const prevVal = rubSel.value;
        let html = '<optgroup label="Прямые прутки (Шаг 3)">';
        allStandard.forEach((r, idx) => { html += `<option value="${idx}">${r.name || r.article} (${window.formatCurr(r.priceNoVat || r.price)})</option>`; });
        html += '</optgroup><optgroup label="Гнутые прутки">';
        allBent.forEach((r, idx) => {
            const combinedIdx = allStandard.length + idx;
            html += `<option value="${combinedIdx}">${r.name || r.article} (${window.formatCurr(r.priceNoVat || r.price)})</option>`;
        });
        html += '</optgroup>';
        rubSel.innerHTML = html;
        if (prevVal !== "" && prevVal !== null) rubSel.value = prevVal;
    }

    const dia5Sel = document.getElementById('d-dia-select');
    if (dia5Sel && window.db.rods_metal) {
        const previousValue = dia5Sel.value;
        const dias = [...new Set(window.db.rods_metal.map(m => m.dia))];
        dia5Sel.innerHTML = dias.map(d => `<option value="${d}">${d} мм</option>`).join('');
        if (dias.map(String).includes(String(previousValue))) {
            dia5Sel.value = previousValue;
        }
        if (window.updateBlanksForStep6) window.updateBlanksForStep6();
    }
};

window.updateBlanksForStep3 = function() {
    const diaSel = document.getElementById('r-dia-select');
    const dias = [...new Set((window.db.rods_metal || []).map(m => m.dia))];
    if (diaSel) {
        const previousValue = diaSel.value;
        diaSel.innerHTML = dias.map(d => `<option value="${d}">${d} мм</option>`).join('');
        if (dias.map(String).includes(String(previousValue))) {
            diaSel.value = previousValue;
        }
    }

    const currentDia = diaSel ? diaSel.value : null;
    const blankSel = document.getElementById('r-blank-select');
    if (blankSel) {
        const prevBlank = blankSel.value;
        const filtered = (window.db.rods_blanks || [])
            .map((b, i) => ({ ...b, originalIdx: i }))
            .filter(b => String(b.dia) === String(currentDia));
        blankSel.innerHTML = filtered.map(b => `<option value="${b.originalIdx}">Заготовка L=${b.length} мм (${window.formatCurr(b.price)})</option>`).join('');
        if (prevBlank && (window.db.rods_blanks || [])[prevBlank] && String((window.db.rods_blanks || [])[prevBlank].dia) === String(currentDia)) {
            blankSel.value = prevBlank;
        }
    }
    if (window.calcStep3) window.calcStep3();
};

window.suggestBlank = function(step) {
    let targetLength, targetDia;
    if (step == 3) {
        targetLength = parseFloat(document.getElementById('r-calc-blank-len')?.value) || 0;
        targetDia = document.getElementById('r-dia-select')?.value;
    } else if (step == 5 || step == 6) {
        targetLength = (parseFloat(document.getElementById('d-length')?.value) || 0) + 10;
        targetDia = document.getElementById('d-dia-select')?.value;
    }

    if (!targetLength || !targetDia) return notify('Введите размеры и выберите диаметр изделия', 'warning');

    const metalIdx = (window.db.rods_metal || []).findIndex(m => String(m.dia) === String(targetDia));
    if (metalIdx === -1) return notify(`В Шаге 1 не найден металл диаметром ${targetDia} мм. Добавьте его сначала!`, 'warning');

    const existsIdx = (window.db.rods_blanks || []).findIndex(b => String(b.dia) === String(targetDia) && parseFloat(b.length) === targetLength);
    if (existsIdx !== -1) {
        notify('Заготовка нужного размера уже существует в базе', 'info');
        if (step == 3 && document.getElementById('r-blank-select')) {
            document.getElementById('r-blank-select').value = existsIdx;
            if (window.calcStep3) window.calcStep3();
        }
        window.updateDropdowns();
        return;
    }

    const metal = window.db.rods_metal[metalIdx];
    const rodLength = 6000; 
    const gap = 10;
    const qtyInRod = Math.floor((rodLength + gap) / (targetLength + gap));
    let metalCost = 0;
    if (qtyInRod > 0) {
        const rodCost = (parseFloat(metal.pricePerM) * rodLength) / 1000;
        metalCost = rodCost / qtyInRod;
    }
    const labor = 50; 
    const price = metalCost + labor;

    if (!window.db.rods_blanks) window.db.rods_blanks = [];
    const newIdx = window.db.rods_blanks.length;
    window.db.rods_blanks.push({
        dia: targetDia,
        length: targetLength,
        labor,
        price,
        article: `BL-${targetDia}-${targetLength}`,
        metalName: metal.name,
        ts: Date.now()
    });
    window.persistAndRender(`Создана заготовка L=${targetLength} мм, Ø${targetDia} мм`);
    if (step == 3 && document.getElementById('r-blank-select')) {
        document.getElementById('r-blank-select').value = newIdx;
        if (window.calcStep3) window.calcStep3();
    }
};

window.updatePricesFromDirectory = function() {
    const metals = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'metal') : [];
    if (metals.length === 0) return notify('Справочник металлов пуст', 'warning');
    
    let updated = 0;
    
    (window.db.rods_metal || []).forEach(rm => {
        let found = metals.find(m => String(window.parseRusFloat(m.diameter)) === String(rm.dia));
        if (found) {
            if (found.total_price_m_no_vat) {
                rm.pricePerM = window.parseRusFloat(found.total_price_m_no_vat);
            } else {
                const priceKg = window.parseRusFloat(found.price) / 1000;
                const weightM = window.parseRusFloat(found.weight_per_m) || (rm.dia * rm.dia * 0.006165);
                const delM = window.parseRusFloat(found.delivery_m_no_vat) || 0;
                rm.pricePerM = (priceKg * weightM) + delM;
            }
            updated++;
        }
    });

    (window.db.rods_blanks || []).forEach(b => {
        const rm = window.db.rods_metal.find(m => String(m.dia) === String(b.dia));
        if (rm) {
            const rodLength = 6000; 
            const gap = 10;
            const qtyInRod = Math.floor((rodLength + gap) / (b.length + gap));
            let metalCost = 0;
            if (qtyInRod > 0) {
                const rodCost = (rm.pricePerM * rodLength) / 1000;
                metalCost = rodCost / qtyInRod;
            }
            b.price = metalCost + parseFloat(b.labor || 0);
        }
    });

    (window.db.rods_standard || []).forEach(r => {
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(r.dia) && parseFloat(b.length) === parseFloat(r.length));
        if (!blank && r.blankId !== undefined) blank = window.db.rods_blanks[r.blankId];
        
        if (blank) {
            let labor = r.labor !== undefined ? r.labor : (r.price - blank.price);
            r.price = blank.price + labor;
        }
    });

    (window.db.rods_bent || []).forEach(rb => {
        let base = (window.db.rods_standard || []).find(rs => rs.name === rb.name.replace(' (Гнутый)', '').replace(' (Сварной)', ''));
        if (!base && rb.baseId !== undefined) base = window.db.rods_standard[rb.baseId];

        if (base) {
            let labor = rb.labor !== undefined ? rb.labor : (rb.price - base.price);
            rb.price = base.price + labor;
        }
    });

    (window.db.rods_rubber || []).forEach(rr => {
        let base;
        const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
        if (rr.baseId !== undefined) base = allRods[rr.baseId];
        else base = allRods.find(rs => rr.name.includes(rs.name));

        if (base) {
            let labor = rr.labor !== undefined ? rr.labor : (rr.price - base.price);
            rr.price = base.price + labor;
        }
    });

    (window.db.rods_double || []).forEach(rd => {
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(rd.dia) && parseFloat(b.length) === parseFloat(rd.length));
        if (!blank && rd.blankId !== undefined) blank = window.db.rods_blanks[rd.blankId];

        if (blank) {
            let labor = rd.labor !== undefined ? rd.labor : 0;
            let clamps = (rd.clampPrice || 0) + (rd.centerClampPrice || 0);
            if (rd.labor === undefined && rd.clampPrice === undefined) {
                labor = rd.price - (blank.price * 2);
                clamps = 0;
            }
            rd.price = (blank.price * 2) + clamps + labor;
        }
    });

    window.persistAndRender(`Цены успешно обновлены по ${updated} позициям из Справочника`);
};

function renderRegistry() {
    const tbody = document.getElementById('rods-registry-tbody');
    if (!tbody) return;

    let h = '';
    h += addRows(window.db.rods_metal, 'Сырье');
    h += addRows(window.db.rods_blanks, 'Заготовка');
    h += addRows(window.db.rods_standard, 'Стандарт');
    h += addRows(window.db.rods_bent, 'Гнутый');
    h += addRows(window.db.rods_rubber, 'Резина');
    h += addRows(window.db.rods_double, 'Сдвоенный');

    tbody.innerHTML = h || '<tr><td colspan="5" class="text-center neutral" style="padding: 25px 0; color: var(--text-muted);">База изделий пуста</td></tr>';
}

function addRows(list, type) {
    if (!list || !Array.isArray(list) || list.length === 0) return '';
    let html = '';
    list.forEach(item => {
        const price = item.price !== undefined ? item.price : (item.pricePerM || 0);
        const name = item.name || (type === 'Заготовка' ? `${item.metalName || 'Заготовка'} Ø${item.dia} мм` : 'Без названия');
        const art = item.article ? `<div class="text-xs opacity-50" style="color: #aaa; font-family: monospace;">${item.article}</div>` : '';
        const tech = item.techType ? `<span class="badge-tech">${item.techType}</span>` : '';
        const hard = item.hardness ? `<div class="text-xs" style="color:var(--brand-gold)"><i class="fa-solid fa-gauge-high"></i> H: ${item.hardness}</div>` : '';
        
        let clickHandler = '';
        if (type === 'Сырье') {
            clickHandler = `onclick="if(window.PrutkonFeatures) window.PrutkonFeatures.openMetalCard('${name}')" style="cursor:pointer;"`;
        } else if (type !== 'Заготовка') {
            clickHandler = `onclick="if(window.PrutkonFeatures) window.PrutkonFeatures.openRodCard('${item.article || name}')" style="cursor:pointer;"`;
        }

        const badgeBg = type === 'Сырье' ? '#e21f26' : (type === 'Заготовка' ? '#ffb400' : (type === 'Стандарт' ? '#007aff' : (type === 'Гнутый' ? '#af52de' : (type === 'Резина' ? '#00c7be' : '#ff2d55'))));

        html += `<tr ${clickHandler} class="registry-row-hover">
            <td><span class="badge" style="background:${badgeBg}; color:#fff; font-weight:700; font-size:0.7rem; padding:4px 8px; border-radius:6px;">${type}</span></td>
            <td><div><strong style="color:#fff; font-size:0.95rem;">${name}</strong>${art}${hard}</div></td>
            <td class="neutral text-sm">
                <div style="color:var(--text-muted);">${item.dia ? 'Ø'+item.dia+' мм' : ''} ${item.length ? 'L='+item.length+' мм' : ''}</div>
                ${tech}
            </td>
            <td class="emerald" style="font-weight:700; font-size:1rem; color:var(--neon-emerald);">${window.formatCurr(price)}</td>
            <td><button class="btn btn-sm btn-logout" style="background:rgba(255,0,0,0.15); color:var(--brand-red); border:1px solid rgba(255,0,0,0.3); padding:4px 8px; border-radius:6px;" onclick="event.stopPropagation(); deleteRodItem('${type}', '${item.name || name}')" title="Удалить"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
    return html;
}

window.deleteRodItem = function(type, name) {
    const removeItem = () => {
        let list;
        if (type === 'Сырье') list = window.db.rods_metal;
        if (type === 'Заготовка') list = window.db.rods_blanks;
        if (type === 'Стандарт') list = window.db.rods_standard;
        if (type === 'Гнутый') list = window.db.rods_bent;
        if (type === 'Резина') list = window.db.rods_rubber;
        if (type === 'Сдвоенный') list = window.db.rods_double;
        if (!list) return;
        
        const idx = list.findIndex(i => {
            const itemName = i.name || (type === 'Заготовка' ? `${i.metalName || 'Заготовка'} Ø${i.dia} мм` : 'Без названия');
            return itemName === name || i.name === name;
        });
        if (idx > -1) list.splice(idx, 1);
        
        window.persistAndRender('Позиция успешно удалена из базы');
    };

    if (window.confirmAction) {
        window.confirmAction('Удаление детали', `Удалить "${name}" из базы модуля?`, removeItem);
        return;
    }

    if (confirm(`Удалить "${name}" из базы модуля?`)) removeItem();
};

window.resetRodsWorkflow = function() {
    const reset = () => {
        document.querySelectorAll('.step-container input').forEach(input => {
            if (input.type === 'number') input.value = input.defaultValue || '';
            else input.value = '';
        });
        document.querySelectorAll('.step-container select').forEach(select => {
            select.selectedIndex = 0;
        });
        window.updateDropdowns();
        if (window.calcStep1) window.calcStep1();
        if (window.calcStep2) window.calcStep2();
        if (window.calcStep3) window.calcStep3();
        if (window.calcStep4) window.calcStep4();
        if (window.calcStep5) window.calcStep5();
        if (window.calcStep6) window.calcStep6();
        notify('Форма конструктора успешно сброшена', 'success');
    };

    if (window.confirmAction) {
        window.confirmAction('Сброс формы', 'Очистить текущие поля конструктора без удаления сохраненной базы?', reset);
        return;
    }

    reset();
};

/* --- PRODUCTION & WAREHOUSE INTEGRATION MODULE --- */
window.updateProductionItemDropdown = () => {
    const type = document.getElementById('prod-type').value;
    const batchGroup = document.getElementById('prod-batch-group');
    const itemGroup = document.getElementById('prod-item-group');
    const itemLabel = document.getElementById('prod-item-label');
    const itemSel = document.getElementById('prod-item-select');
    const rubberGroup = document.getElementById('prod-rubber-base-group');
    
    if (type === 'blank') {
        batchGroup.style.display = 'block';
        rubberGroup.style.display = 'none';
        itemLabel.innerText = "Выберите чертеж заготовки к выпуску";
        
        const batchSel = document.getElementById('prod-metal-batch');
        let h = '';
        if (window.dbWarehouseBatches && window.dbWarehouseBatches.length) {
            window.dbWarehouseBatches.forEach((b, i) => {
                const dia = parseFloat(b.dia || b.diameter || 0);
                const qty = parseFloat(b.qty || b.weight || b.available_weight || 0);
                h += `<option value="${i}">${b.name || b.steel_type || 'Металл'} Ø${dia} мм [Склад: ${window.formatWhNumber(qty)} кг] (Накладная: ${b.invoice || 'б/н'})</option>`;
            });
        } else {
            h = '<option value="">-- Нет партий металла на складе --</option>';
        }
        batchSel.innerHTML = h;
        
        const blanks = window.db.rods_blanks || [];
        itemSel.innerHTML = blanks.map((b, i) => 
            `<option value="${i}">Заготовка Ø${b.dia} мм L=${b.length} мм [${b.article || ''}]</option>`
        ).join('');
        if (!blanks.length) itemSel.innerHTML = '<option value="">-- В базе нет заготовок, добавьте сначала в Шаге 2 --</option>';
        
    } else if (type === 'straight') {
        batchGroup.style.display = 'none';
        rubberGroup.style.display = 'none';
        itemLabel.innerText = "Выберите исполнение прямого прутка";
        
        const rods = window.db.rods_standard || [];
        itemSel.innerHTML = rods.map((r, i) => 
            `<option value="${i}">${r.name} Ø${r.dia} мм L=${r.length} мм [${r.article || ''}]</option>`
        ).join('');
        if (!rods.length) itemSel.innerHTML = '<option value="">-- Нет прямых прутков в Шаге 3 --</option>';
        
    } else if (type === 'double') {
        batchGroup.style.display = 'none';
        rubberGroup.style.display = 'none';
        itemLabel.innerText = "Выберите исполнение сдвоенного прутка";
        
        const rods = window.db.rods_double || [];
        itemSel.innerHTML = rods.map((r, i) => 
            `<option value="${i}">${r.name} Ø${r.dia} мм L=${r.length} мм [${r.article || ''}]</option>`
        ).join('');
        if (!rods.length) itemSel.innerHTML = '<option value="">-- Нет сдвоенных прутков в Шаге 6 --</option>';
        
    } else if (type === 'bent') {
        batchGroup.style.display = 'none';
        rubberGroup.style.display = 'none';
        itemLabel.innerText = "Выберите исполнение гнутого прутка";
        
        const rods = window.db.rods_bent || [];
        itemSel.innerHTML = rods.map((r, i) => 
            `<option value="${i}">${r.name} Ø${r.dia} мм L=${r.length} мм [${r.article || ''}]</option>`
        ).join('');
        if (!rods.length) itemSel.innerHTML = '<option value="">-- Нет гнутых прутков в Шаге 4 --</option>';
        
    } else if (type === 'rubberized') {
        batchGroup.style.display = 'none';
        rubberGroup.style.display = 'block';
        itemLabel.innerText = "Выберите исполнение обрезиненного прутка";
        
        const rods = window.db.rods_rubber || [];
        itemSel.innerHTML = rods.map((r, i) => 
            `<option value="${i}">${r.name} [${r.article || ''}]</option>`
        ).join('');
        if (!rods.length) itemSel.innerHTML = '<option value="">-- Нет обрезиненных прутков в Шаге 5 --</option>';
    }
    
    window.updateProductionRequirements();
};

window.calcRequiredMetalWeight = function(blank, qty, batch) {
    const D = parseFloat(blank.length) || 0;
    const T = parseFloat(blank.rodLength || 6000);
    const S = parseFloat(blank.gap || 10);
    
    let G = parseInt(blank.qtyInRod);
    if (!G || isNaN(G) || G <= 0) {
        G = Math.floor(T / D);
        if (G > 0 && (T - (G * D) - (G - 1) * S < 0)) {
            G = Math.max(0, G - 1);
        }
    }
    if (G <= 0) G = 1;

    const I = T - (G * D) - (G - 1) * S;
    const F = Math.floor(qty / G);
    const rem = qty % G;

    let totalLen = 0;
    if (F > 0) {
        const fullRodLen = I >= 1000 ? (T - I) : T;
        totalLen += F * fullRodLen;
    }
    if (rem > 0) {
        const usedPart = rem * D + (rem - 1) * S;
        const partRemainder = T - usedPart;
        const partRodLen = partRemainder >= 1000 ? usedPart : T;
        totalLen += partRodLen;
    }

    const density = window.getSteelDensity ? window.getSteelDensity(batch.steel_type || batch.name) : 7.85;
    const weightPerM = (Math.PI * Math.pow(parseFloat(batch.dia || batch.diameter || 0), 2) * density) / 4000;

    return parseFloat(((totalLen / 1000) * weightPerM).toFixed(2));
};

window.updateProductionRequirements = () => {
    const type = document.getElementById('prod-type').value;
    const qty = parseInt(document.getElementById('prod-qty').value) || 0;
    const itemSel = document.getElementById('prod-item-select');
    const reqBox = document.getElementById('prod-requirements-box');
    const submitBtn = document.getElementById('btn-submit-production');
    
    if (qty <= 0) {
        reqBox.innerHTML = '<div style="color:var(--brand-red);">Укажите положительное количество к выпуску.</div>';
        submitBtn.disabled = true;
        return;
    }
    
    if (!itemSel.value || itemSel.value === "") {
        reqBox.innerHTML = '<div style="color:var(--brand-red);">Выберите целевое изделие из списка.</div>';
        submitBtn.disabled = true;
        return;
    }
    
    const idx = parseInt(itemSel.value);
    let enough = true;
    let html = '';
    
    if (type === 'blank') {
        const batchSel = document.getElementById('prod-metal-batch');
        if (!batchSel.value || batchSel.value === "") {
            reqBox.innerHTML = '<div style="color:var(--brand-red);">Выберите партию сырья со склада.</div>';
            submitBtn.disabled = true;
            return;
        }
        
        const bIdx = parseInt(batchSel.value);
        const batch = window.dbWarehouseBatches[bIdx];
        const blank = window.db.rods_blanks[idx];
        
        if (!batch || !blank) {
            reqBox.innerHTML = '<div style="color:var(--brand-red);">Ошибка выбора партии или заготовки.</div>';
            submitBtn.disabled = true;
            return;
        }
        
        const reqWeight = window.calcRequiredMetalWeight(blank, qty, batch);
        const avWeight = parseFloat((batch.qty || batch.available_weight || 0).toFixed(2));
        
        if (avWeight < reqWeight) enough = false;
        
        html = `
            <div style="font-weight:600; color:#fff; margin-bottom:8px;"><i class="fa-solid fa-list"></i> Расчет материального баланса:</div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Потребность металла (${batch.name || 'Сырье'} Ø${batch.dia} мм):</span>
                <span class="text-bold" style="color:${enough ? 'var(--neon-emerald)' : 'var(--brand-red)'}; font-weight:700;">${reqWeight} кг</span>
            </div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Доступно в партии (Накл: ${batch.invoice}):</span>
                <strong style="color:#fff;">${avWeight} кг</strong>
            </div>
            <div class="flex justify-between text-sm mt-2 border-top" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px;">
                <span>Выход готовой продукции:</span>
                <strong style="color:var(--neon-emerald);">+${qty} шт заготовок [${blank.article || 'Заготовка'}]</strong>
            </div>
        `;
        
    } else if (type === 'straight') {
        const rod = window.db.rods_standard[idx];
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(rod.dia) && parseFloat(b.length) === parseFloat(rod.length));
        if (!blank && rod.blankId !== undefined) blank = window.db.rods_blanks[rod.blankId];
        const blankKey = blank ? 'blank_' + blank.article : 'blank';
        const avBlanks = parseInt(window.dbWarehouseInv[blankKey] || 0);
        const reqBlanks = qty;
        
        if (avBlanks < reqBlanks) enough = false;
        
        html = `
            <div style="font-weight:600; color:#fff; margin-bottom:8px;"><i class="fa-solid fa-list"></i> Расчет материального баланса:</div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Требуется заготовок [${blank ? blank.article : 'Заготовка'}]:</span>
                <span class="text-bold" style="color:${enough ? 'var(--neon-emerald)' : 'var(--brand-red)'}; font-weight:700;">${reqBlanks} шт</span>
            </div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Доступно заготовок на складе:</span>
                <strong style="color:#fff;">${avBlanks} шт</strong>
            </div>
            <div class="flex justify-between text-sm mt-2 border-top" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px;">
                <span>Выход готовой продукции:</span>
                <strong style="color:var(--neon-emerald);">+${qty} шт базовых прутков [${rod.article || rod.name}]</strong>
            </div>
        `;
        
    } else if (type === 'double') {
        const rod = window.db.rods_double[idx];
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(rod.dia) && parseFloat(b.length) === parseFloat(rod.length));
        if (!blank && rod.blankId !== undefined) blank = window.db.rods_blanks[rod.blankId];
        const blankKey = blank ? 'blank_' + blank.article : 'blank';
        const avBlanks = parseInt(window.dbWarehouseInv[blankKey] || 0);
        const reqBlanks = qty * 2;
        
        if (avBlanks < reqBlanks) enough = false;
        
        html = `
            <div style="font-weight:600; color:#fff; margin-bottom:8px;"><i class="fa-solid fa-list"></i> Расчет материального баланса:</div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Требуется заготовок [${blank ? blank.article : 'Заготовка'}] (2 шт на изделие):</span>
                <span class="text-bold" style="color:${enough ? 'var(--neon-emerald)' : 'var(--brand-red)'}; font-weight:700;">${reqBlanks} шт</span>
            </div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Доступно заготовок на складе:</span>
                <strong style="color:#fff;">${avBlanks} шт</strong>
            </div>
            <div class="flex justify-between text-sm mt-2 border-top" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px;">
                <span>Выход готовой продукции:</span>
                <strong style="color:var(--neon-emerald);">+${qty} шт сдвоенных прутков [${rod.article || rod.name}]</strong>
            </div>
        `;
        
    } else if (type === 'bent') {
        const rod = window.db.rods_bent[idx];
        let base = (window.db.rods_standard || []).find(rs => rs.name === rod.name.replace(' (Гнутый)', '').replace(' (Сварной)', ''));
        if (!base && rod.baseId !== undefined) base = window.db.rods_standard[rod.baseId];
        const baseKey = base ? getRodWarehouseKey(base, 'straight') : 'straight';
        const avStandard = parseInt(window.dbWarehouseInv[baseKey] || 0);
        const reqStandard = qty;
        
        if (avStandard < reqStandard) enough = false;
        
        html = `
            <div style="font-weight:600; color:#fff; margin-bottom:8px;"><i class="fa-solid fa-list"></i> Расчет материального баланса:</div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Требуется прямых прутков [${base ? base.article : 'Прямой'}]:</span>
                <span class="text-bold" style="color:${enough ? 'var(--neon-emerald)' : 'var(--brand-red)'}; font-weight:700;">${reqStandard} шт</span>
            </div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Доступно прямых прутков на складе:</span>
                <strong style="color:#fff;">${avStandard} шт</strong>
            </div>
            <div class="flex justify-between text-sm mt-2 border-top" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px;">
                <span>Выход готовой продукции:</span>
                <strong style="color:var(--neon-emerald);">+${qty} шт гнутых прутков [${rod.article || rod.name}]</strong>
            </div>
        `;
        
    } else if (type === 'rubberized') {
        const rod = window.db.rods_rubber[idx];
        const baseType = document.getElementById('prod-rubber-base-type').value;
        const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
        let base = rod.baseId !== undefined ? allRods[rod.baseId] : allRods.find(rs => rod.name.includes(rs.name));
        const baseKey = base ? getRodWarehouseKey(base, baseType === 'straight' ? 'straight' : 'bent') : (baseType === 'straight' ? 'straight' : 'bent');
        const avBase = parseInt(window.dbWarehouseInv[baseKey] || 0);
        const reqBase = qty;
        
        if (avBase < reqBase) enough = false;
        
        html = `
            <div style="font-weight:600; color:#fff; margin-bottom:8px;"><i class="fa-solid fa-list"></i> Расчет материального баланса:</div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Требуется базовых прутков [${base ? base.article : 'Базовый'}]:</span>
                <span class="text-bold" style="color:${enough ? 'var(--neon-emerald)' : 'var(--brand-red)'}; font-weight:700;">${reqBase} шт</span>
            </div>
            <div class="flex justify-between text-sm mb-1" style="display:flex; justify-content:space-between;">
                <span>Доступно на складе:</span>
                <strong style="color:#fff;">${avBase} шт</strong>
            </div>
            <div class="flex justify-between text-sm mt-2 border-top" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px;">
                <span>Выход готовой продукции:</span>
                <strong style="color:var(--neon-emerald);">+${qty} шт обрезиненных прутков (${baseType === 'straight' ? 'прямой' : 'гнутый'}) [${rod.article || rod.name}]</strong>
            </div>
        `;
    }
    
    if (!enough) {
        html += `<div style="background:rgba(226,31,38,0.15); border:1px solid var(--brand-red); color:var(--brand-red); font-size:0.75rem; font-weight:700; padding:8px; border-radius:6px; margin-top:10px; text-align:center;"><i class="fa-solid fa-triangle-exclamation"></i> НЕХВАТКА СЫРЬЯ / МАТЕРИАЛОВ НА СКЛАДЕ!</div>`;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    } else {
        html += `<div style="background:rgba(0,255,157,0.07); border:1px solid var(--neon-emerald); color:var(--neon-emerald); font-size:0.75rem; font-weight:700; padding:8px; border-radius:6px; margin-top:10px; text-align:center;"><i class="fa-solid fa-circle-check"></i> ВСЕГО ДОСТАТОЧНО. ГОТОВО К ЗАПУСКУ!</div>`;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
    
    reqBox.innerHTML = html;
};

function getRodWarehouseKey(rod, defaultPrefix) {
    if (!rod) return defaultPrefix;
    const nameLower = (rod.name || '').toLowerCase();
    const isHedge = nameLower.includes('еж') || nameLower.includes('ёж') || nameLower.includes('палец');
    if (isHedge) return 'hedge_' + rod.article;
    const isBent = nameLower.includes('гнут') || nameLower.includes('сварн') || nameLower.includes('комби') || nameLower.includes('bent');
    if (defaultPrefix === 'rubberized' && isBent) return 'bent_rubberized_' + rod.article;
    return defaultPrefix + '_' + rod.article;
}

window.saveWarehouseStateFromProduction = async (lastLogOp) => {
    localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
    localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbWarehouseBatches));
    
    if (lastLogOp) {
        if (!window.dbWarehouseLog) window.dbWarehouseLog = [];
        window.dbWarehouseLog.push(lastLogOp);
        localStorage.setItem('prutkon_warehouse_log', JSON.stringify(window.dbWarehouseLog));
    }
    
    if (window.supabase) {
        try {
            const invToSave = Object.keys(window.dbWarehouseInv).map(key => {
                const rawVal = window.dbWarehouseInv[key];
                let qtyNum = 0;
                if (typeof rawVal === 'number') {
                    qtyNum = rawVal;
                } else if (typeof rawVal === 'string') {
                    qtyNum = parseFloat(rawVal.replace(/\s/g, '').replace(',', '.')) || 0;
                }
                return {
                    id: key,
                    data: { item_key: key, quantity: qtyNum, updated_at: new Date().toISOString() }
                };
            });
            const { error: invErr } = await window.supabase.from('warehouse_inventory').upsert(invToSave);
            if (invErr) console.error('Supabase error warehouse_inventory:', invErr.message);
            
            const { error: batchErr } = await window.supabase.from('metal_batches').upsert(
                window.dbWarehouseBatches.map(b => ({
                    id: b.id,
                    data: b
                }))
            );
            if (batchErr) console.error('Supabase error metal_batches:', batchErr.message);

            if (lastLogOp) {
                const { error: logErr } = await window.supabase.from('warehouse_log').upsert({
                    id: String(lastLogOp.id),
                    data: lastLogOp
                });
                if (logErr) console.error('Supabase error warehouse_log:', logErr.message);
            }
            console.log('☁️ Производственное состояние успешно синхронизировано с Supabase Cloud!');
        } catch(err) {
            console.error('Ошибка синхронизации производства с облаком:', err);
        }
    }
};

window.submitProductionRun = async () => {
    const type = document.getElementById('prod-type').value;
    const qty = parseInt(document.getElementById('prod-qty').value) || 0;
    const itemSel = document.getElementById('prod-item-select');
    
    if (qty <= 0 || !itemSel.value || itemSel.value === "") {
        notify('Заполните все поля формы корректно', 'warning');
        return;
    }
    
    const idx = parseInt(itemSel.value);
    const emp = (typeof window.getCurrentEmployee === 'function' ? window.getCurrentEmployee() : null) || window.currentUser;
    const responsible = emp ? emp.name : 'Система';
    
    let logEntry = null;
    let detailsText = '';
    let changesPayload = {};
    
    if (type === 'blank') {
        const batchSel = document.getElementById('prod-metal-batch');
        const bIdx = parseInt(batchSel.value);
        const batch = window.dbWarehouseBatches[bIdx];
        const blank = window.db.rods_blanks[idx];
        
        const reqWeight = window.calcRequiredMetalWeight(blank, qty, batch);
        
        batch.qty = parseFloat((parseFloat(batch.qty || 0) - reqWeight).toFixed(2));
        batch.available_weight = batch.qty;
        if (batch.weight !== undefined) batch.weight = batch.qty;
        
        let metalKey = null;
        if (window.dbDirectories) {
            const found = window.dbDirectories.find(d => 
                (d.category === 'metal' || d.category === 'Сырье') &&
                (d.name === batch.steel_type || d.name === batch.name) &&
                parseFloat(d.diameter || d.dia || 0) === parseFloat(batch.dia || batch.diameter || 0)
            );
            if (found) metalKey = 'metal_' + found.id;
        }
        if (!metalKey) {
            for (let key in window.dbWarehouseInv) {
                if (key.startsWith('metal_')) {
                    const id = key.replace('metal_', '');
                    const d = window.dbDirectories?.find(x => String(x.id) === id);
                    if (d && (d.name === batch.steel_type || d.name === batch.name) && parseFloat(d.diameter || d.dia || 0) === parseFloat(batch.dia || batch.diameter || 0)) {
                        metalKey = key;
                        break;
                    }
                }
            }
        }
        
        if (metalKey) {
            window.dbWarehouseInv[metalKey] = parseFloat((parseFloat(window.dbWarehouseInv[metalKey] || 0) - reqWeight).toFixed(2));
        }
        
        const blankKey = 'blank_' + blank.article;
        window.dbWarehouseInv[blankKey] = parseInt(window.dbWarehouseInv[blankKey] || 0) + qty;
        
        detailsText = `Нарезка заготовок L=${blank.length} мм: +${qty} шт [${blank.article}]. Списано сырья (${batch.name} Ø${batch.dia} мм): -${reqWeight} кг`;
        changesPayload = {
            source: { item: metalKey || 'metal_raw', qty: -reqWeight },
            target: { item: blankKey, qty: qty }
        };
        
    } else if (type === 'straight') {
        const rod = window.db.rods_standard[idx];
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(rod.dia) && parseFloat(b.length) === parseFloat(rod.length));
        if (!blank && rod.blankId !== undefined) blank = window.db.rods_blanks[rod.blankId];
        const blankKey = blank ? 'blank_' + blank.article : 'blank';
        const rodKey = getRodWarehouseKey(rod, 'straight');
        
        window.dbWarehouseInv[blankKey] = parseInt(window.dbWarehouseInv[blankKey] || 0) - qty;
        window.dbWarehouseInv[rodKey] = parseInt(window.dbWarehouseInv[rodKey] || 0) + qty;
        
        detailsText = `Сборка прямого прутка [${rod.article || rod.name}]: +${qty} шт. Списано заготовок [${blank ? blank.article : 'blank'}]: -${qty} шт.`;
        changesPayload = {
            source: { item: blankKey, qty: -qty },
            target: { item: rodKey, qty: qty }
        };
        
    } else if (type === 'double') {
        const rod = window.db.rods_double[idx];
        let blank = (window.db.rods_blanks || []).find(b => String(b.dia) === String(rod.dia) && parseFloat(b.length) === parseFloat(rod.length));
        if (!blank && rod.blankId !== undefined) blank = window.db.rods_blanks[rod.blankId];
        const blankKey = blank ? 'blank_' + blank.article : 'blank';
        const rodKey = getRodWarehouseKey(rod, 'double');
        const reqBlanks = qty * 2;
        
        window.dbWarehouseInv[blankKey] = parseInt(window.dbWarehouseInv[blankKey] || 0) - reqBlanks;
        window.dbWarehouseInv[rodKey] = parseInt(window.dbWarehouseInv[rodKey] || 0) + qty;
        
        detailsText = `Сборка сдвоенного прутка [${rod.article || rod.name}]: +${qty} шт. Списано заготовок (x2) [${blank ? blank.article : 'blank'}]: -${reqBlanks} шт.`;
        changesPayload = {
            source: { item: blankKey, qty: -reqBlanks },
            target: { item: rodKey, qty: qty }
        };
        
    } else if (type === 'bent') {
        const rod = window.db.rods_bent[idx];
        let base = (window.db.rods_standard || []).find(rs => rs.name === rod.name.replace(' (Гнутый)', '').replace(' (Сварной)', ''));
        if (!base && rod.baseId !== undefined) base = window.db.rods_standard[rod.baseId];
        const baseKey = base ? getRodWarehouseKey(base, 'straight') : 'straight';
        const rodKey = getRodWarehouseKey(rod, 'bent');
        
        window.dbWarehouseInv[baseKey] = parseInt(window.dbWarehouseInv[baseKey] || 0) - qty;
        window.dbWarehouseInv[rodKey] = parseInt(window.dbWarehouseInv[rodKey] || 0) + qty;
        
        detailsText = `Гнутье прутка [${rod.article || rod.name}]: +${qty} шт. Списано прямых прутков [${base ? base.article : 'straight'}]: -${qty} шт.`;
        changesPayload = {
            source: { item: baseKey, qty: -qty },
            target: { item: rodKey, qty: qty }
        };
        
    } else if (type === 'rubberized') {
        const rod = window.db.rods_rubber[idx];
        const baseType = document.getElementById('prod-rubber-base-type').value;
        const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
        let base = rod.baseId !== undefined ? allRods[rod.baseId] : allRods.find(rs => rod.name.includes(rs.name));
        const baseKey = base ? getRodWarehouseKey(base, baseType === 'straight' ? 'straight' : 'bent') : (baseType === 'straight' ? 'straight' : 'bent');
        const rodKey = getRodWarehouseKey(rod, 'rubberized');
        
        window.dbWarehouseInv[baseKey] = parseInt(window.dbWarehouseInv[baseKey] || 0) - qty;
        window.dbWarehouseInv[rodKey] = parseInt(window.dbWarehouseInv[rodKey] || 0) + qty;
        
        detailsText = `Обрезинивание прутка [${rod.article || rod.name}]: +${qty} шт. Списано базовых прутков [${base ? base.article : 'base'}]: -${qty} шт.`;
        changesPayload = {
            source: { item: baseKey, qty: -qty },
            target: { item: rodKey, qty: qty }
        };
    }
    
    logEntry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: new Date().toLocaleString('ru-RU'),
        type: 'Производство деталей',
        details: detailsText,
        comment: `Запущено из Конструктора производства | Отв: ${responsible}`,
        changes: changesPayload,
        user: responsible
    };
    
    await window.saveWarehouseStateFromProduction(logEntry);
    notify(`Производство успешно проведено! ${detailsText}`, 'success');
    window.closeProductionModal();
    window.updateDropdowns();
    
    window.dispatchEvent(new Event('db_updated'));
};

window.openProductionModal = () => {
    const modal = document.getElementById('modal-production-run');
    if (modal) {
        modal.style.display = 'flex';
        window.updateProductionItemDropdown();
    }
};

window.closeProductionModal = () => {
    const modal = document.getElementById('modal-production-run');
    if (modal) modal.style.display = 'none';
};
