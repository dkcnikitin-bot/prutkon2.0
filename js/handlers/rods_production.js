/* rods_production.js - ПРУТКОН Engineering Workflow Central Module */

const RODS_STORAGE_KEY = 'prutkon_rods_registry';
const RODS_KEYS = ['rods_metal', 'rods_blanks', 'rods_standard', 'rods_bent', 'rods_rubber', 'rods_double'];

window.formatCurr = (v) => (window.formatRusNumber ? window.formatRusNumber(v, 2) : parseFloat(v || 0).toFixed(2)) + " ₽";
window.formatWhNumber = window.formatWhNumber || ((v, dec = 2) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(v || 0));
window.formatMoney = window.formatMoney || ((v) => parseFloat(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽");

// Временная заглушка во избежание ошибок при мгновенном старте до парсинга всего файла
window.updateDropdowns = window.updateDropdowns || function() {};

const startProductionModule = () => {
    initTabs();
    initData();
    renderRegistry();

    // Обработка возврата в каталог
    const params = new URLSearchParams(window.location.search);
    if (params.get('return') === 'catalog') {
        const returnBtn = document.createElement('button');
        returnBtn.innerText = 'ВЕРНУТЬСЯ В КАТАЛОГ (ПРУТОК СОЗДАН)';
        returnBtn.className = 'btn';
        returnBtn.style.cssText = 'position:fixed; bottom:30px; right:30px; background:var(--brand-gold); color:#000; font-weight:900; padding:15px 30px; border-radius:15px; box-shadow:0 10px 30px rgba(255,180,0,0.4); z-index:999999; font-size:1rem; cursor:pointer; text-transform:uppercase;';
        returnBtn.onclick = () => {
            window.location.href = 'index.html'; // This triggers the catalog master restoration
        };
        document.body.appendChild(returnBtn);
    }

    // Ожидание асинхронной загрузки справочников из core.js
    const checkCoreData = setInterval(() => {
        if (window.dbDirectories && window.dbDirectories.length > 0) {
            clearInterval(checkCoreData);
            window.updateDropdowns();
        }
    }, 150);
    setTimeout(() => clearInterval(checkCoreData), 3000);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startProductionModule);
} else {
    startProductionModule();
}

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
    const tabs = document.querySelectorAll('.tabs-scrollable button');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.tabs-scrollable');
            parent.querySelectorAll('button').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const step = btn.getAttribute('data-step');
            
            // Only hide containers that belong to the current mode
            const mode = step.startsWith('belt') ? 'belts' : 'rods';
            if (mode === 'belts') {
                document.querySelectorAll('#belts-engineering-view .step-container').forEach(c => c.classList.remove('active'));
            } else {
                document.querySelectorAll('#rods-engineering-view .step-container').forEach(c => c.classList.remove('active'));
            }
            
            const container = document.getElementById(`step-${step}`);
            if (container) container.classList.add('active');
            
            window.updateDropdowns();
        });
    });
}

window.switchEngineeringMode = function(mode) {
    const rodsView = document.getElementById('rods-engineering-view');
    const beltsView = document.getElementById('belts-engineering-view');
    const asmView = document.getElementById('assembly-engineering-view');
    const rodsBtn = document.getElementById('mode-rods-btn');
    const beltsBtn = document.getElementById('mode-belts-btn');
    const asmBtn = document.getElementById('mode-assembly-btn');
    const modeVal = document.getElementById('mode-display-val');

    // reset all buttons
    if(rodsBtn) rodsBtn.className = 'btn btn-secondary';
    if(beltsBtn) beltsBtn.className = 'btn btn-secondary';
    if(asmBtn) asmBtn.className = 'btn btn-secondary';

    // hide all views
    if(rodsView) rodsView.style.display = 'none';
    if(beltsView) beltsView.style.display = 'none';
    if(asmView) asmView.style.display = 'none';

    if (mode === 'belts') {
        if(beltsView) beltsView.style.display = 'block';
        if(beltsBtn) beltsBtn.className = 'btn btn-primary';
        if (modeVal) modeVal.innerText = 'Ремни (Belts)';
    } else if (mode === 'assembly') {
        if(asmView) asmView.style.display = 'block';
        if(asmBtn) asmBtn.className = 'btn btn-primary';
        if (modeVal) modeVal.innerText = 'Сборка транспортера (Assembly)';
        
        // initialize dropdowns if not yet
        const asmBeltLabor = document.getElementById('asm-belt-labor');
        const asmAssLabor = document.getElementById('asm-assembly-labor');
        if (asmBeltLabor && asmBeltLabor.options.length <= 1) {
            let laborItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'labor') : [];
            
            // Offline fallback with professional industrial services
            if (laborItems.length === 0) {
                laborItems = [
                    { id: 'labor_belt_1', name: 'Подготовка стандартного ремня (2-3 корда)', price: 3150, category: 'labor', type: 'prep' },
                    { id: 'labor_belt_2', name: 'Подготовка усиленного ремня (4 корда)', price: 4200, category: 'labor', type: 'prep' },
                    { id: 'labor_belt_3', name: 'Специфическая подготовка ремня (обточка)', price: 5500, category: 'labor', type: 'prep' },
                    { id: 'labor_ass_1', name: 'Сборка стандартного 2-рядного транспортера', price: 18500, category: 'labor', type: 'ass' },
                    { id: 'labor_ass_2', name: 'Сборка стандартного 3-рядного транспортера', price: 24500, category: 'labor', type: 'ass' },
                    { id: 'labor_ass_3', name: 'Сборка усиленного 4-рядного транспортера', price: 32000, category: 'labor', type: 'ass' },
                    { id: 'labor_ass_4', name: 'Сложная сборка транспортера (цепи, лопатки)', price: 45000, category: 'labor', type: 'ass' }
                ];
            }

            let prepOpts = '<option value="">-- Выбрать подготовку --</option>';
            let assOpts = '<option value="">-- Выбрать сборку --</option>';

            laborItems.forEach(i => {
                const nameLower = i.name.toLowerCase();
                const isPrep = i.type === 'prep' || nameLower.includes('подготов') || nameLower.includes('ремен');
                const isAss = i.type === 'ass' || nameLower.includes('сборк') || nameLower.includes('транспорт');

                const optionHtml = `<option value="${i.id}" data-price="${i.price || 0}" data-name="${i.name}">${i.name} (${parseFloat(i.price || 0).toLocaleString('ru-RU')} ₽)</option>`;
                
                if (isPrep) prepOpts += optionHtml;
                if (isAss) assOpts += optionHtml;
            });

            if (asmBeltLabor) asmBeltLabor.innerHTML = prepOpts;
            if (asmAssLabor) asmAssLabor.innerHTML = assOpts;
        }
        window.calcAssembly();
    } else {
        if(rodsView) rodsView.style.display = 'block';
        if(rodsBtn) rodsBtn.className = 'btn btn-primary';
        if (modeVal) modeVal.innerText = 'Прутки (Rods)';
    }
};

window.calcAssembly = function() {
    const rodsCount = parseInt(document.getElementById('asm-rods-count')?.value) || 0;
    const beltsCount = parseInt(document.getElementById('asm-belts-count')?.value) || 0;
    const locksCount = parseInt(document.getElementById('asm-locks-count')?.value) || 0;
    const lockRodsCount = parseInt(document.getElementById('asm-lock-rods-count')?.value) || 0;
    
    const connectionType = document.getElementById('asm-connection-type')?.value || 'screws';
    const overlapSteps = parseInt(document.getElementById('asm-overlap-steps')?.value) || 6;
    
    const tbody = document.getElementById('asm-tbody');
    if (!tbody) return;

    const printRods = document.getElementById('print-rods-count');
    if (printRods) printRods.innerText = rodsCount;
    const printBelts = document.getElementById('print-belts-count');
    if (printBelts) printBelts.innerText = beltsCount;
    
    const findProduct = (nameQuery) => {
        if (!window.dbProducts) return null;
        return window.dbProducts.find(p => p && p.name && p.name.toLowerCase().includes(nameQuery.toLowerCase()));
    };

    const stdPlate = findProduct('Пластина соединительная') || { name: 'Пластина соединительная', price: 41.48 };
    const rivet = findProduct('Клепка спец') || { name: 'Клепка спец 6мм', price: 10.35 };
    const lockPlate = findProduct('Пластина соединительная резьбовая') || { name: 'Пластина соединительная резьбовая', price: 150 };
    const lockRod = findProduct('пруток-замок') || { name: 'Пруток замковый', price: 1200 };
    const screwItem = findProduct('Винт') || { name: 'Винты крепежные M6', price: 15.00 };

    const beltLaborEl = document.getElementById('asm-belt-labor');
    const assLaborEl = document.getElementById('asm-assembly-labor');
    
    const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
    const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
    
    const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
    const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

    // Получение данных ремня с Шага 1.3
    const beltName = document.getElementById('belt1-name')?.value || '';
    const beltQty = parseFloat(document.getElementById('belt1-qty')?.value) || 0;
    const beltPrice = parseFloat(document.getElementById('belt1-price')?.value) || 0;

    // Math
    const convType = beltsCount === 2 ? '2x' : (beltsCount === 4 ? '4x' : '3x');
    const locksVal = (connectionType === 'mechanical' || connectionType === 'screws') ? 1 : 0;
    const f = window.calculateConveyorFasteners(rodsCount, convType, connectionType, overlapSteps, locksVal);
    
    const rows = [
        // 0. Ремень тяговый
        ...(beltQty > 0 
            ? [{ name: `Ремень тяговый: ${beltName}`, qty: beltQty, price: beltPrice }] 
            : [{ name: '⚠️ РЕМЕНЬ ТЯГОВЫЙ (НЕ ВЫБРАН СО СКЛАДА!)', qty: beltsCount, price: 0 }]),
        // 1. Пластины боковые стандарт
        ...(f.standardPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стандарт)`, qty: f.standardPlatesSide, price: stdPlate.price }] : []),
        // 2. Пластины цр стандарт
        ...(f.standardPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стандарт)`, qty: f.standardPlatesCentral, price: stdPlate.price }] : []),
        // 3. Пластины боковые стык
        ...(f.overlapPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стык)`, qty: f.overlapPlatesSide, price: stdPlate.price }] : []),
        // 4. Пластины цр стык
        ...(f.overlapPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стык)`, qty: f.overlapPlatesCentral, price: stdPlate.price }] : []),
        // 5. Пластины боковые замок
        ...(f.lockPlatesSide > 0 ? [{ name: `${lockPlate.name} (боковая, замок)`, qty: f.lockPlatesSide, price: lockPlate.price }] : []),
        // 6. Пластины цр замок
        ...(f.lockPlatesCentral > 0 ? [{ name: `${lockPlate.name} цр (замок)`, qty: f.lockPlatesCentral, price: lockPlate.price }] : []),
        // 7. Крепежные винты
        ...(f.screws > 0 ? [{ name: screwItem.name, qty: f.screws, price: screwItem.price }] : []),
        // 8. Заклепки
        ...(f.rivets > 0 ? [{ name: rivet.name, qty: f.rivets, price: rivet.price }] : []),
        // 9. Замковый пруток
        ...(lockRodsCount > 0 ? [{ name: lockRod.name, qty: lockRodsCount, price: lockRod.price }] : []),
        // 10. Услуги
        { name: beltLaborName, qty: beltsCount, price: beltLaborPrice },
        { name: assLaborName, qty: 1, price: assLaborPrice }
    ];

    let totalCost = 0;
    let html = '';
    
    rows.forEach(r => {
        const sum = (r.qty * r.price);
        totalCost += sum;
        html += `
            <tr>
                <td>${r.name}</td>
                <td style="text-align:center;">${r.qty}</td>
                <td style="text-align:right;">${window.formatMoney(r.price)}</td>
                <td style="text-align:right;">${window.formatMoney(sum)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    document.getElementById('asm-total-cost').innerText = window.formatMoney(totalCost);
};

window.switchProductionStep = function(stepNum) {
    const isBelt = String(stepNum).startsWith('belt');
    const tabsSelector = isBelt ? '#belts-tabs button' : '#rods-tabs button';
    const tabs = document.querySelectorAll(tabsSelector);
    tabs.forEach(t => t.classList.remove('active'));
    const targetBtn = document.querySelector(`${tabsSelector}[data-step="${stepNum}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    if (isBelt) {
        document.querySelectorAll('#belts-engineering-view .step-container').forEach(c => c.classList.remove('active'));
    } else {
        document.querySelectorAll('#rods-engineering-view .step-container').forEach(c => c.classList.remove('active'));
    }
    const container = document.getElementById(`step-${stepNum}`);
    if (container) container.classList.add('active');
    window.updateDropdowns();
};

// Диспетчер сохранения текущего активного шага
window.saveCurrentStep = function() {
    // Check if assembly mode is active
    const asmView = document.getElementById('assembly-engineering-view');
    if (asmView && asmView.style.display === 'block') {
        if (window.saveAssemblyCalculation) window.saveAssemblyCalculation();
        return;
    }
    
    // Check if belts mode is active
    const beltsView = document.getElementById('belts-engineering-view');
    if (beltsView && beltsView.style.display === 'block') {
        const activeBeltBtn = document.querySelector('#belts-tabs button.active');
        const bStep = activeBeltBtn ? activeBeltBtn.getAttribute('data-step') : "belt_1";
        
        if (bStep === "belt_1") { if(window.saveStepBelt1) window.saveStepBelt1(); if(window.saveStep1_3) window.saveStep1_3(); }
        else if (bStep === "belt_2" && window.saveStepBelt2) window.saveStepBelt2();
        else if (bStep === "belt_3" && window.saveStepBelt3) window.saveStepBelt3();
        else notify(`Сохранение для шага ремней ${bStep} пока не настроено`, 'warning');
        return;
    }

    // Default: rods mode
    const activeBtn = document.querySelector('#rods-tabs button.active');
    const step = activeBtn ? activeBtn.getAttribute('data-step') : "1";

    if (step == "1" && window.saveStep1) window.saveStep1(); else if (step == "1-3" && window.saveStep1_3) window.saveStep1_3();
    else if (step == "2" && window.saveStep2) window.saveStep2();
    else if (step == "3" && window.saveStep3) window.saveStep3();
    else if (step == "4" && window.saveStep4) window.saveStep4();
    else if (step == "5" && window.saveStep5) window.saveStep5();
    else if (step == "6" && window.saveStep6Double) window.saveStep6Double();
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
            const metalBatches = window.dbWarehouseBatches.filter(b => !b.isBelt).sort((a, b) => {
                const diaA = parseFloat(a.dia || a.diameter || 0);
                const diaB = parseFloat(b.dia || b.diameter || 0);
                if (diaA !== diaB) return diaA - diaB;
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
            metalBatches.forEach(b => {
                const dia = parseFloat(b.dia || b.diameter || 0);
                const qty = parseFloat(b.qty || b.weight || b.available_weight || 0);
                h += `<option value="${b.id}">${b.name || b.steel_type || 'Металл'} Ø${dia} мм (Накладная: ${b.invoice || b.id || 'б/н'}) [Остаток: ${window.formatWhNumber(qty)} кг]</option>`;
            });
        }
        mWhSelect.innerHTML = h;
    }

    const bWhSelect = document.getElementById('belt-warehouse-select');
    if (bWhSelect) {
        let h = '<option value="">-- Выберите ленту из складских остатков --</option>';
        if (window.dbWarehouseBatches && window.dbWarehouseBatches.length) {
            const beltBatches = window.dbWarehouseBatches.filter(b => b.isBelt).sort((a, b) => {
                const diaA = parseFloat(a.dia || a.diameter || 0); // width is stored in diameter
                const diaB = parseFloat(b.dia || b.diameter || 0);
                if (diaA !== diaB) return diaB - diaA; // wider belts first
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
            beltBatches.forEach(b => {
                const qty = parseFloat(b.qty || b.weight || b.available_weight || 0);
                h += `<option value="${b.id}">${b.name || b.steel_type || 'Лента'} (Накладная: ${b.invoice || b.id || 'б/н'}) [Остаток: ${window.formatWhNumber(qty)} м.п.]</option>`;
            });
        }
        bWhSelect.innerHTML = h;
    }

    if (window.dbDirectories) {
        const fill = (id, cat, placeholder) => {
            const el = document.getElementById(id);
            if (!el) return;
            const items = window.dbDirectories.filter(d => d.category === cat);
            el.innerHTML = `<option value="">${placeholder}</option>` + 
                items.map(i => `<option value="${i.price || i.name}" data-name="${i.name}">${i.name} ${i.price ? '('+i.price+' ₽)' : ''}</option>`).join('');
        };

        const fillName = (id, cat, placeholder) => {
            const el = document.getElementById(id);
            if (!el) return;
            const items = window.dbDirectories.filter(d => d.category === cat);
            el.innerHTML = `<option value="">${placeholder}</option>` + 
                items.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        };

        fill('r-holes', 'holes', '-- Выбрать отверстие --');
        fill('r-pitch', 'pitch', '-- Выбрать межосевое --');
        fill('r-labor-dir', 'labor', '-- Из справочника --');
        fill('bent-labor-dir', 'labor', '-- Из справочника --');
        fill('rub-labor-dir', 'labor', '-- Из справочника --');
        fill('d-clamp-select-type', 'clamps', '-- Выбрать хомут --');
        fill('d-center-clamp-select-type', 'clamps', '-- Центр. хомут --');
        fillName('bent-type', 'rod_types', '-- Тип обработки --');
        
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
        const metalOptions = window.db.rods_metal.map((m, i) => `<option value="${i}">${m.name} Ø${m.dia} мм (${window.formatCurr(m.pricePerM)}/м)</option>`).join('');
        metalSel.innerHTML = metalOptions;
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
    } else if (step == 6) {
        targetLength = (parseFloat(document.getElementById('d-length')?.value) || 0) - 5;
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
        } else if ((step == 5 || step == 6) && document.getElementById('d-blank-select')) {
            document.getElementById('d-blank-select').value = existsIdx;
            if (window.calcStep6) window.calcStep6();
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
    } else if ((step == 5 || step == 6) && document.getElementById('d-blank-select')) {
        document.getElementById('d-blank-select').value = newIdx;
        if (window.calcStep6) window.calcStep6();
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


window.handleDrawingUpload = function(input, targetId) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const target = document.getElementById(targetId);
    if (!target) return;
    
    // Check if it's Supabase (for real upload)
    if (window.supabase) {
        target.value = "Загрузка...";
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `drawings/${targetId}_${Date.now()}.${ext}`;
        window.supabase.storage.from('prutkon-files').upload(fileName, file)
            .then(({ data, error }) => {
                if (error) {
                    console.error("Upload error:", error);
                    // Fallback to base64 if bucket fails
                    const reader = new FileReader();
                    reader.onload = (e) => { target.value = e.target.result; };
                    reader.readAsDataURL(file);
                } else {
                    const { data: pubData } = window.supabase.storage.from('prutkon-files').getPublicUrl(fileName);
                    if (pubData) target.value = pubData.publicUrl;
                }
            })
            .catch(() => {
                const reader = new FileReader();
                reader.onload = (e) => { target.value = e.target.result; };
                reader.readAsDataURL(file);
            });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            target.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.saveStep1_3 = function() {
    const name = document.getElementById('belt1-name')?.value;
    const qty = document.getElementById('belt1-qty')?.value;
    const price = document.getElementById('belt1-price')?.value || 0;
    
    if (!name || !qty) return window.notify ? window.notify('Укажите наименование и метраж ремня', 'warning') : alert('Укажите данные');
    
    if (!window.db.rods_rubber) window.db.rods_rubber = [];
    window.db.rods_rubber.push({
        article: `RB-${Date.now()}`,
        name: name,
        length: qty,
        price: price,
        ts: Date.now()
    });
    if (window.persistAndRender) window.persistAndRender(`Ремень "${name}" сохранен на склад`);
};

const initReturnToCatalog = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('return') === 'catalog') {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const returnBtn = document.createElement('button');
            returnBtn.className = 'btn btn-secondary btn-sm';
            returnBtn.style.backgroundColor = 'var(--brand-gold)';
            returnBtn.style.color = '#000';
            returnBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> ВЕРНУТЬСЯ В КАТАЛОГ (ПРУТОК СОЗДАН)';
            returnBtn.onclick = () => window.location.href = 'catalog.html#step4';
            headerActions.prepend(returnBtn);
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReturnToCatalog);
} else {
    initReturnToCatalog();
}

// ==================== ПРОФЕССИОНАЛЬНАЯ ОБРАБОТКА СБОРКИ И КП ====================

/**
 * Профессиональная обработка сметного расчета сборки
 * Выполняет расчет комплектующих, сохраняет смету в корзину калькулятора КП и регистрирует в Центре документов
 */
window.saveAssemblyCalculation = function() {
    const rodsCount = parseInt(document.getElementById('asm-rods-count')?.value) || 0;
    const beltsCount = parseInt(document.getElementById('asm-belts-count')?.value) || 0;
    const locksCount = parseInt(document.getElementById('asm-locks-count')?.value) || 0;
    const lockRodsCount = parseInt(document.getElementById('asm-lock-rods-count')?.value) || 1;

    if (rodsCount === 0 || beltsCount === 0) {
        const msg = 'Для расчета сметы укажите количество прутков и ремней!';
        if (window.notify) window.notify(msg, 'warning');
        else alert(msg);
        return;
    }

    // 1. Поиск цен комплектующих в базе или использование стандартных промышленных цен ПРУТКОН
    const findProduct = (nameQuery) => {
        if (!window.dbProducts) return null;
        return window.dbProducts.find(p => p && p.name && p.name.toLowerCase().includes(nameQuery.toLowerCase()));
    };

    const stdPlate = findProduct('Пластина соединительная') || { name: 'Пластина соединительная', price: 41.48 };
    const rivet = findProduct('Клепка') || { name: 'Клепка спец 6мм', price: 10.35 };
    const lockPlate = findProduct('Пластина соединительная резьбовая') || { name: 'Пластина соединительная резьбовая', price: 150 };
    const lockRod = findProduct('пруток') || { name: 'Пруток замковый', price: 1200 };

    // 2. Получение цен услуг из выпадающих списков
    const beltLaborEl = document.getElementById('asm-belt-labor');
    const assLaborEl = document.getElementById('asm-assembly-labor');
    
    const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
    const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
    
    const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
    const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

    // 3. Математика расчета комплектующих и стоимости
    const stdPlatesQty = Math.max(0, rodsCount - locksCount) * beltsCount;
    const rivetsQty = stdPlatesQty * 2;
    const lockPlatesQty = locksCount * beltsCount;
    
    const calculatedItems = [
        { art: 'PL-STD', name: stdPlate.name, qty: stdPlatesQty, price: stdPlate.price },
        { art: 'RV-SPEC', name: rivet.name, qty: rivetsQty, price: rivet.price },
        { art: 'PL-LOCK', name: lockPlate.name, qty: lockPlatesQty, price: lockPlate.price },
        { art: 'RD-LOCK', name: lockRod.name, qty: lockRodsCount, price: lockRod.price },
        { art: 'SRV-PREP', name: beltLaborName, qty: beltsCount, price: beltLaborPrice },
        { art: 'SRV-ASS', name: assLaborName, qty: 1, price: assLaborPrice }
    ];

    // Исключаем позиции с нулевым количеством
    const activeItems = calculatedItems.filter(it => it.qty > 0);
    const totalSum = activeItems.reduce((sum, it) => sum + (it.qty * it.price), 0);

    // 4. Интеграция с корзиной Калькулятора КП (prutkon_calc_basket)
    try {
        const basket = JSON.parse(localStorage.getItem('prutkon_calc_basket')) || [];
        
        activeItems.forEach(item => {
            basket.push({
                id: Date.now() + Math.random(),
                art: item.art,
                name: item.name,
                specs: `Смета сборки (Прутков: ${rodsCount}, Ремней: ${beltsCount})`,
                qty: item.qty,
                price: item.price,
                total: item.qty * item.price,
                priceFormatted: window.formatCurr ? window.formatCurr(item.qty * item.price) : (item.qty * item.price + " ₽")
            });
        });

        localStorage.setItem('prutkon_calc_basket', JSON.stringify(basket));
        console.log("Assembly items added to CP Basket successfully.");
    } catch (e) {
        console.error("Failed to add assembly items to CP Basket", e);
    }

    // 5. Регистрация Инженерного расчета в реестре документов (prutkon_doc_registry)
    try {
        const registry = JSON.parse(localStorage.getItem('prutkon_doc_registry')) || [];
        const docId = `ИР-${String(Math.floor(Math.random() * 90000 + 10000))}`;
        const docOrderId = `eng_op_${Date.now()}`;
        
        registry.push({
            id: docId,
            type: 'Инженерный расчет',
            date: new Date().toLocaleDateString('ru-RU'),
            client: 'Инженерная сборка транспортера',
            orderId: docOrderId,
            sum: Math.round(totalSum * 100) / 100,
            status: 'Черновик',
            items: activeItems.map(it => ({
                name: it.name,
                art: it.art,
                qty: it.qty,
                price: it.price
            })),
            history: [{ timestamp: new Date().toLocaleString('ru-RU'), user: 'Система', action: 'Создано из Инженерии (Шаг 6)' }]
        });
        
        localStorage.setItem('prutkon_doc_registry', JSON.stringify(registry));
        if (typeof window.saveAllToLocal === 'function') {
            window.saveAllToLocal();
        }
        console.log("Assembly document registered in Registry successfully.");
    } catch (e) {
        console.error("Failed to register assembly document in Registry", e);
    }

    // 6. Уведомление пользователя
    const successMsg = `Смета на сумму ${parseFloat(totalSum.toFixed(2)).toLocaleString('ru-RU')} ₽ успешно рассчитана и добавлена в Калькулятор КП!`;
    if (window.notify) window.notify(successMsg, 'success');
    else alert(successMsg);
};

// Пробрасываем алиас для совместимости
window.sendAssemblyToBasket = window.saveAssemblyCalculation;

// ==================== ФУНКЦИИ ШАГА 1: ПАРТИИ МЕТАЛЛА ====================

/** Добавляет выбранную партию металла со склада в расчёт Шага 1 */
window.addBatchToCalculation = function() {
    const sel = document.getElementById('m-warehouse-select');
    if (!sel || !sel.value) return;

    const batchId = sel.value;
    const batch = (window.dbWarehouseBatches || []).find(b => String(b.id) === String(batchId));
    if (!batch) return;

    // Prevent duplicates
    const list = document.getElementById('m-selected-batches-list');
    if (list && list.querySelector(`[data-batch-id="${batchId}"]`)) {
        if (window.notify) window.notify('Эта партия уже добавлена', 'warning');
        return;
    }

    // Auto-fill metal fields from batch
    const mName = document.getElementById('m-name');
    const mDia = document.getElementById('m-dia');
    const mBatchKg = document.getElementById('m-batch-kg');
    const mPriceTon = document.getElementById('m-price-ton-vat');
    const mWeightM = document.getElementById('m-weight-m');

    if (mName) { mName.innerHTML = `<option value="${batch.name || batch.steel_type}">${batch.name || batch.steel_type}</option>`; mName.value = batch.name || batch.steel_type; mName.dataset.populated = 'true'; }
    const dia = parseFloat(batch.dia || batch.diameter || 0);
    if (mDia) { mDia.innerHTML = `<option value="${dia}">${dia} мм</option>`; mDia.value = dia; mDia.dataset.populated = 'true'; }
    const qty = parseFloat(batch.qty || batch.available_weight || batch.weight || 0);
    if (mBatchKg) mBatchKg.value = qty;
    if (mPriceTon && batch.price) mPriceTon.value = batch.price;
    const wm = dia > 0 ? (Math.PI * Math.pow(dia / 1000 / 2, 2) * 7850).toFixed(3) : 0;
    if (mWeightM && !mWeightM.value) mWeightM.value = wm;

    // Show chip in list
    if (list) {
        const chip = document.createElement('span');
        chip.dataset.batchId = batchId;
        chip.style.cssText = 'background:rgba(255,180,0,0.15); border:1px solid var(--brand-gold); border-radius:4px; padding:3px 8px; font-size:0.7rem; color:var(--brand-gold); display:flex; align-items:center; gap:5px;';
        chip.innerHTML = `${batch.name || batch.steel_type} Ø${dia} мм [${qty} кг] <span style="cursor:pointer; color:#fff;" onclick="this.parentElement.remove()">✕</span>`;
        list.appendChild(chip);
    }

    if (window.calcStep1) window.calcStep1();
};

/** Очищает все выбранные партии металла */
window.clearSelectedBatches = function() {
    const list = document.getElementById('m-selected-batches-list');
    if (list) list.innerHTML = '';
    const sel = document.getElementById('m-warehouse-select');
    if (sel) sel.value = '';
    const mName = document.getElementById('m-name');
    const mDia = document.getElementById('m-dia');
    if (mName) { delete mName.dataset.populated; }
    if (mDia) { delete mDia.dataset.populated; }
    if (window.updateDropdowns) window.updateDropdowns();
};

/** Автоматически подтягивает данные металла из справочника по марке/диаметру */
window.autoPullMetalData = function() {
    const mName = document.getElementById('m-name');
    const mDia = document.getElementById('m-dia');
    if (!mName || !mDia || !mName.value || !mDia.value) return;

    const selectedName = mName.value;
    const selectedDia = parseFloat(mDia.value);

    const metals = (window.dbDirectories || []).filter(d => d.category === 'metal');
    const match = metals.find(m => {
        const n = m.name || m.steel_type || '';
        const d = parseFloat(m.diameter || 0);
        return n === selectedName && d === selectedDia;
    });

    if (match) {
        const mPriceTon = document.getElementById('m-price-ton-vat');
        const mWeightM = document.getElementById('m-weight-m');
        const mHardness = document.getElementById('m-res-hardness');
        const mHardnessInfo = document.getElementById('m-hardness-info');

        if (mPriceTon && match.price) mPriceTon.value = match.price;
        // Auto-calculate theoretical weight per metre
        const wm = selectedDia > 0 ? (Math.PI * Math.pow(selectedDia / 1000 / 2, 2) * 7850).toFixed(3) : 0;
        if (mWeightM && !mWeightM.value) mWeightM.value = wm;
        if (match.hardness && mHardness) {
            mHardness.textContent = match.hardness;
            if (mHardnessInfo) mHardnessInfo.style.display = 'block';
        }
    }

    if (window.calcStep1) window.calcStep1();
};

// ==================== ФУНКЦИИ БЛОКА «ОТ КЛИЕНТА» ====================

/** Переключает видимость блока ввода количества прутков от клиента */
window.toggleProdClientProvided = function(checked) {
    const group = document.getElementById('prod-client-qty-group');
    if (group) group.style.display = checked ? 'block' : 'none';
    if (!checked) {
        const inp = document.getElementById('prod-client-qty');
        if (inp) inp.value = 0;
    }
    window.updateProductionRequirements();
};

/** Пересчитывает, сколько прутков нужно произвести с учётом поставленных клиентом */
window.updateProductionRequirements = function() {
    const totalRods = parseInt(document.getElementById('asm-rods-count')?.value) || 0;
    const clientQty = parseInt(document.getElementById('prod-client-qty')?.value) || 0;
    const makeQty = Math.max(0, totalRods - clientQty);

    const makeDisplay = document.getElementById('prod-make-qty-display');
    if (makeDisplay) makeDisplay.textContent = makeQty;

    const reqBox = document.getElementById('prod-requirements-box');
    if (!reqBox) return;

    if (totalRods === 0) {
        reqBox.innerHTML = '<div style="color:#888; font-size:0.8rem;">Укажите количество прутков в блоке «Сборка»</div>';
        return;
    }

    reqBox.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; font-size:0.8rem;">
            <div class="mini-stat">Всего прутков: <strong style="color:var(--brand-gold)">${totalRods}</strong> шт.</div>
            <div class="mini-stat">От клиента: <strong style="color:#4fc3f7">${clientQty}</strong> шт.</div>
            <div class="mini-stat">Производство: <strong style="color:var(--neon-emerald)">${makeQty}</strong> шт.</div>
        </div>
    `;
};

// ==================== ФУНКЦИИ ВЫБОРА РЕМНЕЙ СО СКЛАДА ====================

/** Заполняет поля при выборе партии ремней со склада на Шаге 1.3 */
window.onBeltWarehouseSelect = function() {
    const sel = document.getElementById('belt-warehouse-select');
    if (!sel || !sel.value) return;

    const batchId = sel.value;
    const batch = (window.dbWarehouseBatches || []).find(b => String(b.id) === String(batchId));
    if (!batch) return;

    const nameInput = document.getElementById('belt1-name');
    const qtyInput = document.getElementById('belt1-qty');
    const priceInput = document.getElementById('belt1-price');

    if (nameInput) nameInput.value = batch.name || batch.steel_type || 'Лента';
    if (qtyInput) {
        const qty = parseFloat(batch.qty || batch.available_weight || batch.weight || 0);
        qtyInput.value = qty;
    }
    if (priceInput) {
        priceInput.value = batch.price || '';
    }
};

/** Очищает выбранную партию ремней и поля ввода */
window.clearSelectedBelts = function() {
    const sel = document.getElementById('belt-warehouse-select');
    if (sel) sel.value = '';
    const nameInput = document.getElementById('belt1-name');
    const qtyInput = document.getElementById('belt1-qty');
    const priceInput = document.getElementById('belt1-price');
    if (nameInput) nameInput.value = '';
    if (qtyInput) qtyInput.value = '';
    if (priceInput) priceInput.value = '';
};

/** Генерирует и печатает премиальную печатную форму инженерного расчета сборки */
window.printEngineeringAssembly = function() {
    const rodsCount = parseInt(document.getElementById('asm-rods-count')?.value) || 0;
    const beltsCount = parseInt(document.getElementById('asm-belts-count')?.value) || 0;
    const locksCount = parseInt(document.getElementById('asm-locks-count')?.value) || 0;
    const lockRodsCount = parseInt(document.getElementById('asm-lock-rods-count')?.value) || 0;

    const connectionType = document.getElementById('asm-connection-type')?.value || 'screws';
    const overlapSteps = parseInt(document.getElementById('asm-overlap-steps')?.value) || 6;

    const findProduct = (nameQuery) => {
        if (!window.dbProducts) return null;
        return window.dbProducts.find(p => p && p.name && p.name.toLowerCase().includes(nameQuery.toLowerCase()));
    };

    const stdPlate = findProduct('Пластина соединительная') || { name: 'Пластина соединительная', price: 41.48 };
    const rivet = findProduct('Клепка спец') || { name: 'Клепка спец 6мм', price: 10.35 };
    const lockPlate = findProduct('Пластина соединительная резьбовая') || { name: 'Пластина соединительная резьбовая', price: 150 };
    const lockRod = findProduct('пруток-замок') || { name: 'Пруток замковый', price: 1200 };
    const screwItem = findProduct('Винт') || { name: 'Винты крепежные M6', price: 15.00 };

    const beltLaborEl = document.getElementById('asm-belt-labor');
    const assLaborEl = document.getElementById('asm-assembly-labor');
    
    const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
    const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
    
    const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
    const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

    // Получение данных ремня с Шага 1.3
    const beltName = document.getElementById('belt1-name')?.value || '';
    const beltQty = parseFloat(document.getElementById('belt1-qty')?.value) || 0;
    const beltPrice = parseFloat(document.getElementById('belt1-price')?.value) || 0;

    const convType = beltsCount === 2 ? '2x' : (beltsCount === 4 ? '4x' : '3x');
    const locksVal = (connectionType === 'mechanical' || connectionType === 'screws') ? 1 : 0;
    const f = window.calculateConveyorFasteners(rodsCount, convType, connectionType, overlapSteps, locksVal);

    const rows = [
        // 0. Ремень тяговый
        ...(beltQty > 0 
            ? [{ name: `Ремень тяговый: ${beltName}`, qty: beltQty, price: beltPrice }] 
            : [{ name: '⚠️ РЕМЕНЬ ТЯГОВЫЙ (НЕ ВЫБРАН СО СКЛАДА!)', qty: beltsCount, price: 0 }]),
        // 1. Пластины боковые стандарт
        ...(f.standardPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стандарт)`, qty: f.standardPlatesSide, price: stdPlate.price }] : []),
        // 2. Пластины цр стандарт
        ...(f.standardPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стандарт)`, qty: f.standardPlatesCentral, price: stdPlate.price }] : []),
        // 3. Пластины боковые стык
        ...(f.overlapPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стык)`, qty: f.overlapPlatesSide, price: stdPlate.price }] : []),
        // 4. Пластины цр стык
        ...(f.overlapPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стык)`, qty: f.overlapPlatesCentral, price: stdPlate.price }] : []),
        // 5. Пластины боковые замок
        ...(f.lockPlatesSide > 0 ? [{ name: `${lockPlate.name} (боковая, замок)`, qty: f.lockPlatesSide, price: lockPlate.price }] : []),
        // 6. Пластины цр замок
        ...(f.lockPlatesCentral > 0 ? [{ name: `${lockPlate.name} цр (замок)`, qty: f.lockPlatesCentral, price: lockPlate.price }] : []),
        // 7. Крепежные винты
        ...(f.screws > 0 ? [{ name: screwItem.name, qty: f.screws, price: screwItem.price }] : []),
        // 8. Заклепки
        ...(f.rivets > 0 ? [{ name: rivet.name, qty: f.rivets, price: rivet.price }] : []),
        // 9. Замковый пруток
        ...(lockRodsCount > 0 ? [{ name: lockRod.name, qty: lockRodsCount, price: lockRod.price }] : []),
        // 10. Услуги
        { name: beltLaborName, qty: beltsCount, price: beltLaborPrice },
        { name: assLaborName, qty: 1, price: assLaborPrice }
    ];

    let totalCost = 0;
    let tbodyRows = '';
    rows.forEach((r, idx) => {
        const sum = r.qty * r.price;
        totalCost += sum;
        tbodyRows += `
            <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
                <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:500;">${idx + 1}</td>
                <td style="font-weight:700; color:#1e293b; font-size:11px;">${r.name}</td>
                <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:900; color:#ff9f0a; font-size:11px;">${r.qty}</td>
                <td style="text-align:right; font-family:'JetBrains Mono'; font-size:11px;">${parseFloat(r.price).toLocaleString('ru-RU')} ₽</td>
                <td style="text-align:right; font-weight:900; font-family:'JetBrains Mono'; font-size:11px;">${sum.toLocaleString('ru-RU')} ₽</td>
            </tr>
        `;
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для печати!');
        return;
    }

    const timestamp = new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const docId = 'ИР-' + Math.floor(Math.random() * 90000 + 10000);

    printWindow.document.write(`
        <html>
            <head>
                <title>Инженерный расчет сборки - ПРУТКОН ОС</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; background: #e5e9f0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; color: #000; }
                    .page { 
                        width: 210mm; height: 297mm; padding: 18mm; margin: 10mm auto; background: #fff; 
                        position: relative; overflow: hidden; box-sizing: border-box;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.1); border-radius: 8px;
                        display: flex; flex-direction: column;
                    }
                    .brand-border { position: absolute; left:0; top:0; bottom:0; width: 4mm; background: #ed1c24; }
                    .watermark {
                        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 80px; font-weight: 900; color: rgba(0,0,0,0.015); z-index:0; pointer-events:none; text-transform:uppercase;
                    }
                    .content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    th { background: #0f172a; color: #fff; text-transform: uppercase; font-size: 9px; font-weight: 900; padding: 10px 8px; text-align: center; border: 1px solid #0f172a; }
                    td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
                    
                    @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; border-radius: 0; } }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="brand-border"></div>
                    <div class="watermark">ENGINEERING</div>
                    <div class="content">
                        
                        <!-- HEADER -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:4px solid #111; padding-bottom:20px;">
                            <div style="font-weight: 900; font-size: 16px; font-family:'Outfit';">ООО "ПРУТКОН"</div>
                            <div style="text-align:right;">
                                <div style="font-size:10px; color:#ed1c24; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">ИНЖЕНЕРНО-ТЕХНИЧЕСКИЙ ОТДЕЛ</div>
                                <h1 style="margin:0; font-size:26px; font-weight:900; color:#111;">СМЕТА И РАСЧЕТ СБОРКИ</h1>
                                <div style="font-size:18px; font-weight:400; font-family:'JetBrains Mono';">РАСЧЕТ <strong>№ ${docId}</strong></div>
                                <div style="font-size:12px; margin-top:5px; opacity:0.6;">ОТ ${timestamp}</div>
                            </div>
                        </div>

                        <!-- META DATA -->
                        <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ТЕХНИЧЕСКИЕ ДАННЫЕ РАСЧЕТА</div>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; color: #000;">
                            <tr>
                                <td style="border: 1px solid #111; padding: 8px; font-weight:bold; background:#f8fafc; width:25%;">Количество прутков:</td>
                                <td style="border: 1px solid #111; padding: 8px; font-family:'JetBrains Mono'; font-weight:bold; width:25%;">${rodsCount} шт</td>
                                <td style="border: 1px solid #111; padding: 8px; font-weight:bold; background:#f8fafc; width:25%;">Количество ремней:</td>
                                <td style="border: 1px solid #111; padding: 8px; font-family:'JetBrains Mono'; font-weight:bold; width:25%;">${beltsCount} шт</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #111; padding: 8px; font-weight:bold; background:#f8fafc;">Количество замков:</td>
                                <td style="border: 1px solid #111; padding: 8px; font-family:'JetBrains Mono';">${locksCount} шт</td>
                                <td style="border: 1px solid #111; padding: 8px; font-weight:bold; background:#f8fafc;">Прутков на замок:</td>
                                <td style="border: 1px solid #111; padding: 8px; font-family:'JetBrains Mono';">${lockRodsCount} шт</td>
                            </tr>
                        </table>

                        <!-- DATA GRID -->
                        <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ДЕТАЛИЗАЦИЯ СМЕТЫ (КОМПЛЕКТУЮЩИЕ И РАБОТЫ)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 30px;">№</th>
                                    <th style="text-align:left;">Наименование элемента / услуги</th>
                                    <th style="width: 60px;">Кол-во</th>
                                    <th style="width: 120px; text-align:right;">Цена</th>
                                    <th style="width: 140px; text-align:right;">Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tbodyRows}
                            </tbody>
                        </table>

                        <!-- TOTALS -->
                        <div style="display:flex; justify-content:flex-end; margin-bottom:30px;">
                            <div style="width:360px; background:#111; color:#fff; padding:20px; border-radius:8px; position:relative; overflow:hidden;">
                                <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:#ed1c24;"></div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:14px; font-weight:900; text-transform:uppercase;">ИТОГО СБОРКА:</span>
                                    <span style="font-size:18px; font-weight:900; color:#ed1c24; font-family:'Outfit';">${totalCost.toLocaleString('ru-RU')} ₽</span>
                                </div>
                            </div>
                        </div>

                        <!-- SIGNATURES AND STAMP -->
                        <div style="margin-top:auto; display:grid; grid-template-columns: 1fr 1fr; gap:60px; padding-bottom:15px; border-top:1px solid #f0f0f0; padding-top:20px;">
                            <div>
                                <div style="font-size:9px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px;">ИСПОЛНИТЕЛЬ</div>
                                <div style="font-size:11px; margin-top:10px;">Инженер-технолог: <div style="border-bottom:1px solid #000; width:150px; display:inline-block; margin-left:10px;"></div></div>
                                <div style="font-size:11px; margin-top:15px;">Подпись: <div style="border-bottom:1px solid #000; width:150px; display:inline-block; margin-left:10px;"></div></div>
                            </div>
                            <div>
                                <div style="font-size:9px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:10px; letter-spacing:1px;">ПРИЕМКА И КОНТРОЛЬ ОТК</div>
                                <div style="border: 2px double #002244; color: #002244; font-family: 'Outfit', sans-serif; width: 90px; height: 90px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; line-height: 1.2; text-align: center; transform: rotate(-8deg); opacity: 0.85; user-select:none; margin:0 auto;">
                                    <div style="font-size: 6px; border-bottom: 1px solid #002244; padding-bottom: 1px; width: 60px; text-transform: uppercase;">ПРУТКОН</div>
                                    <div style="font-size: 10px; font-weight: 900; margin: 1px 0;">ОТК №2</div>
                                    <div style="font-size: 5px; letter-spacing: 0.5px; text-transform: uppercase;">КОНТРОЛЬ ПРОЙДЕН</div>
                                </div>
                            </div>
                        </div>

                        <div style="font-size:9px; color:#94a3b8; line-height:1.4; border-top:1px solid #f1f5f9; padding-top:10px; text-align:center;">
                            Электронный расчет сметы сборки. Сформировано в АСУП ПРУТКОН ОС.
                        </div>

                    </div>
                </div>
                <script>
                    window.print();
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
};
