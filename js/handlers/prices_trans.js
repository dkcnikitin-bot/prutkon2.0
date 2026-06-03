/* prices_trans.js - ПРУТКОН ERP Price Management: Transporters */
window.DB_VERSION = window.DB_VERSION || "10.3.0";

console.log("Prices Trans module loading v9.6.2...");

// ==========================================
// 1. DATA BINDINGS & REGISTRY
// ==========================================
window.activeCategory = 'transporters';
window.excelWorkbook = null;
window.excelColumns = [];
window.excelData = [];
window.importMappings = {};
window.priceSearchQuery = "";
window.selectedPriceIds = [];

// ==========================================
// 2. CORE FUNCTIONS (PRE-DEFINED)
// ==========================================

window.loadCategories = function() {
    const tabs = document.getElementById('price-tabs');
    if (!tabs) return;
    tabs.innerHTML = window.dbTransCategories.map(cat => `
        <button class="btn btn-secondary btn-sm ${window.activeCategory === cat.id ? 'active' : ''}" 
                style="margin-right:8px; margin-bottom:8px;"
                onclick="window.switchCategory('${cat.id}')">${cat.name}</button>
    `).join('');
    
    const title = document.getElementById('price-title');
    const activeObj = window.dbTransCategories.find(c => c.id === window.activeCategory);
    if (title && activeObj) title.innerText = activeObj.name;
};

window.switchCategory = function(catId) {
    window.activeCategory = catId;
    const fBar = document.getElementById('dynamic-filters');
    if (fBar) delete fBar.dataset.initialized;
    window.loadCategories();
    window.selectedPriceIds = [];
    window.renderPriceTable();
};

window.refreshPrices = function() {
    window.renderPriceTable();
    if (window.showToast) window.showToast('Данные обновлены', 'success');
};

window.buildFiltersBar = function() {
    const fBar = document.getElementById('dynamic-filters');
    if (!fBar) return;
    if (fBar.dataset.initialized === 'true' && fBar.dataset.cat === window.activeCategory) return;

    const categoryProducts = window.dbTransProducts.filter(p => p && p.category === window.activeCategory);
    if (categoryProducts.length === 0) { fBar.style.display = 'none'; return; }

    const baseFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
    const keys = new Set();
    categoryProducts.forEach(p => {
        if (p) Object.keys(p).forEach(k => { if (!baseFields.includes(k)) keys.add(k); });
    });

    if (keys.size === 0) { fBar.style.display = 'none'; return; }
    fBar.style.display = 'flex'; fBar.innerHTML = '';
    keys.forEach(key => {
        const values = new Set();
        categoryProducts.forEach(p => { if (p && p[key]) values.add(p[key]); });
        const sel = document.createElement('select'); sel.className = 'form-control dynamic-filter-select';
        sel.style.width = 'auto'; sel.style.fontSize = '0.7rem'; sel.dataset.key = key;
        sel.onchange = () => window.renderPriceTable();
        let options = `<option value="">Все: ${key}</option>`;
        Array.from(values).sort().forEach(v => { options += `<option value="${v}">${v}</option>`; });
        sel.innerHTML = options; fBar.appendChild(sel);
    });
    fBar.dataset.initialized = 'true';
    fBar.dataset.cat = window.activeCategory;
};

window.renderPriceTable = function() {
    if (!Array.isArray(window.dbTransProducts)) window.dbTransProducts = [];
    const tableContainer = document.getElementById('price-table');
    if (!tableContainer) return;

    window.buildFiltersBar();

    const activeFilters = {};
    document.querySelectorAll('.dynamic-filter-select').forEach(sel => {
        if (sel.value) activeFilters[sel.dataset.key] = sel.value;
    });

    let filtered = window.dbTransProducts.filter(p => {
        if (!p) return false;
        if (window.activeCategory !== 'all' && p.category !== window.activeCategory) return false;
        if (window.priceSearchQuery) {
            const match = (p.art && p.art.toLowerCase().includes(window.priceSearchQuery)) || 
                          (p.name && p.name.toLowerCase().includes(window.priceSearchQuery));
            if (!match) return false;
        }
        for (let key in activeFilters) {
            if (String(p[key]) !== String(activeFilters[key])) return false;
        }
        return true;
    });

    const baseFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
    const extraFields = [...new Set(filtered.flatMap(p => p ? Object.keys(p).filter(k => !baseFields.includes(k)) : []))];

    let html = `<thead><tr>
        <th style="width:40px;"><input type="checkbox" onchange="window.toggleSelectAllPrices(this.checked)"></th>
        <th style="width:140px">Артикул</th>
        <th>Наименование</th>`;
    extraFields.forEach(f => { html += `<th>${f}</th>`; });
    html += `<th style="width:110px">Цена</th><th style="width:90px">Склад</th><th style="width:110px">Действия</th></tr></thead><tbody>`;

    if (filtered.length === 0) {
        html += `<tr><td colspan="${extraFields.length + 6}" class="table-empty">Ничего не найдено</td></tr>`;
    } else {
        filtered.forEach(p => {
            const isSelected = window.selectedPriceIds.includes(String(p.id));
            html += `<tr class="${isSelected ? 'selected-row' : ''}" ondblclick="window.editProduct('${p.id}')">
                <td><input type="checkbox" class="price-checkbox" data-id="${p.id}" ${isSelected ? 'checked' : ''} onchange="window.togglePriceSelection('${p.id}', this.checked)"></td>
                <td class="table-art" style="color:var(--brand-red);">${p.art || '---'}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${p.photo ? `<img src="${p.photo}" class="table-thumb">` : ''}
                        <span>${p.name || 'Без названия'}</span>
                    </div>
                </td>
                ${extraFields.map(f => `<td>${p[f] || '-'}</td>`).join('')}
                <td class="table-price" style="font-family:'JetBrains Mono';">
                    ${window.formatCurrency ? window.formatCurrency(p.price) : p.price.toLocaleString() + ' ₽'}
                </td>
                <td class="neutral">${p.stock || 0} шт</td>
                <td style="text-align:right;">
                    <div class="table-actions">
                        <button class="action-btn" onclick="window.showItemHistory('${p.id}')" title="История"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        <button class="action-btn" onclick="window.editProduct('${p.id}')" title="Редактировать"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn" style="color:var(--brand-red);" onclick="window.deleteProduct('${p.id}')" title="Удалить"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>`;
        });
    }
    tableContainer.innerHTML = html + '</tbody>';

    const massBtn = document.getElementById('mass-delete-btn');
    if (massBtn) {
        massBtn.style.display = window.selectedPriceIds.length > 0 ? 'inline-flex' : 'none';
        massBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Удалить выбранные (${window.selectedPriceIds.length})`;
    }
};

window.togglePriceSelection = function(id, checked) {
    const sId = String(id);
    if (checked) { if (!window.selectedPriceIds.includes(sId)) window.selectedPriceIds.push(sId); }
    else { window.selectedPriceIds = window.selectedPriceIds.filter(x => x !== sId); }
    window.renderPriceTable();
};

window.toggleSelectAllPrices = function(checked) {
    if (checked) {
        document.querySelectorAll('.price-checkbox').forEach(cb => {
            const id = String(cb.dataset.id);
            if (!window.selectedPriceIds.includes(id)) window.selectedPriceIds.push(id);
        });
    } else { window.selectedPriceIds = []; }
    window.renderPriceTable();
};

window.deleteProduct = function(id) {
    window.confirmAction("Удаление", "Удалить этот товар из справочника?", () => {
        window.dbTransProducts = window.dbTransProducts.filter(p => p && String(p.id) !== String(id));
        if (window.showToast) window.showToast('Товар удален', 'success');
        if (window.fbPush) window.fbPush();
        window.renderPriceTable();
    });
};

window.massDeleteProducts = function() {
    window.confirmAction("Массовое удаление", `Удалить ${window.selectedPriceIds.length} товаров?`, () => {
        window.dbTransProducts = window.dbTransProducts.filter(p => p && !window.selectedPriceIds.includes(String(p.id)));
        window.selectedPriceIds = [];
        if (window.showToast) window.showToast('Удалено', 'success');
        if (window.fbPush) window.fbPush();
        window.renderPriceTable();
    });
};

window.showItemHistory = function(id) {
    const p = window.dbTransProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    const modal = document.getElementById('item-history-modal');
    if (!modal) return;
    modal.classList.add('active');
    document.getElementById('item-history-details').innerHTML = `<div style="font-weight:700; color:#fff; font-size:1rem;">${p.name || 'Без имени'}</div><div style="font-size:0.75rem; opacity:0.6; margin-top:5px;">Артикул: ${p.art || '---'} | ID: ${p.id}</div>`;
    const list = document.getElementById('item-history-list');
    list.innerHTML = (p.history || []).slice().reverse().map(h => `
        <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                <span style="font-weight:700; color:var(--neon-emerald); font-size:0.8rem;"><i class="fa-solid fa-user"></i> ${h.user}</span>
                <span style="opacity:0.4; font-size:0.65rem;">${h.time}</span>
            </div>
            <div style="color:#fff; font-size:0.75rem; line-height:1.4;">${h.action}</div>
        </div>`).join('') || '<div style="text-align:center; padding:40px; opacity:0.3;">История пуста</div>';
};

window.editProduct = function(id) {
    const p = window.dbTransProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    const modal = document.getElementById('product-card-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('pc-id').value = p.id;
        document.getElementById('pc-art').value = p.art || "";
        document.getElementById('pc-name').value = p.name || "";
        document.getElementById('pc-price').value = p.price || 0;
        document.getElementById('pc-stock').value = p.stock || 0;
        document.getElementById('pc-photo').value = p.photo || "";
        document.getElementById('product-card-img').src = p.photo || "placeholder.jpg";
        const catSel = document.getElementById('pc-category');
        if (catSel) catSel.innerHTML = window.dbTransCategories.map(c => `<option value="${c.id}" ${c.id === p.category ? 'selected' : ''}>${c.name}</option>`).join('');
    }
};

window.saveProductCard = function() {
    const id = document.getElementById('pc-id').value;
    const p = window.dbTransProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    
    // Check for duplicates on edit
    const newArt = document.getElementById('pc-art').value.trim();
    if (newArt && newArt !== p.art) {
        const exists = window.dbTransProducts.find(x => x && x.art === newArt && String(x.id) !== String(id));
        if (exists) {
            alert('Ошибка: Артикул ' + newArt + ' уже занят!');
            return;
        }
    }

    const oldValues = { art: p.art, name: p.name, price: p.price, stock: p.stock };
    
    p.art = newArt;
    p.name = document.getElementById('pc-name').value;
    p.price = parseFloat(document.getElementById('pc-price').value) || 0;
    p.stock = parseInt(document.getElementById('pc-stock').value) || 0;
    p.photo = document.getElementById('pc-photo').value;
    p.category = document.getElementById('pc-category').value;
    
    if (!Array.isArray(p.history)) p.history = [];
    
    let changes = [];
    if (oldValues.art !== p.art) changes.push(`Артикул: ${oldValues.art} -> ${p.art}`);
    if (oldValues.name !== p.name) changes.push(`Имя: ${oldValues.name} -> ${p.name}`);
    if (oldValues.price !== p.price) changes.push(`Цена: ${oldValues.price} -> ${p.price}`);
    if (oldValues.stock !== p.stock) changes.push(`Склад: ${oldValues.stock} -> ${p.stock}`);
    
    const userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "Система";
    const actionDesc = changes.length > 0 ? "Изменено: " + changes.join(', ') : "Сохранение без изменений (Транспорт)";
    
    p.history.push({ time: new Date().toLocaleString(), user: userName, action: actionDesc });
    if (window.logAudit) window.logAudit('INFO', `Редактирование транспорта ${p.art}`, 'Справочники');
    
    window.renderPriceTable(); window.closeProductCard();
    if (window.fbPush) window.fbPush();
    if (window.showToast) window.showToast('Сохранено', 'success');
};

window.closeProductCard = function() { document.getElementById('product-card-modal').classList.remove('active'); };

window.openExcelImport = function() {
    window.excelStep = 1;
    const m = document.getElementById('excel-modal');
    if (m) m.classList.add('active');
    window.updateWizardUI();
    window.updateExcelCatSelect();
};

window.closeExcelImport = function() { document.getElementById('excel-modal')?.classList.remove('active'); };

window.updateWizardUI = function() {
    document.querySelectorAll('.wiz-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('#excel-wizard-steps .wiz-step').forEach(s => s.classList.remove('active', 'complete'));
    const cur = document.getElementById(`excel-wiz-${window.excelStep}`);
    if (cur) cur.style.display = 'block';
    document.querySelectorAll('#excel-wizard-steps .wiz-step').forEach(s => {
        const n = parseInt(s.dataset.step);
        if (n === window.excelStep) s.classList.add('active');
        if (n < window.excelStep) s.classList.add('complete');
    });
    const sub = document.getElementById('excel-wizard-subtitle');
    const bNext = document.getElementById('btn-wiz-next');
    const bBack = document.getElementById('btn-wiz-prev');
    if (window.excelStep === 1) { if(sub) sub.innerText = "Шаг 1: Файл"; if(bBack) bBack.style.visibility = 'hidden'; }
    else if (window.excelStep === 2) { if(sub) sub.innerText = "Шаг 2: Маппинг"; if(bBack) bBack.style.visibility = 'visible'; }
    else if (window.excelStep === 3) { if(sub) sub.innerText = "Шаг 3: Предпросмотр"; window.renderExcelPreview(); }
};

window.excelWizNext = function() { if (window.excelStep < 3) { window.excelStep++; window.updateWizardUI(); } else { window.excelStep++; window.updateWizardUI(); window.processImport(); } };
window.excelWizBack = function() { if (window.excelStep > 1) { window.excelStep--; window.updateWizardUI(); } };

window.handleExcelFile = function(e) {
    const f = e.target.files[0];
    if (!f) return;
    
    window.showToast('Анализ документа...', 'info');
    const r = new FileReader();
    r.onload = (ev) => {
        try {
            const d = new Uint8Array(ev.target.result);
            window.excelWorkbook = XLSX.read(d, { type: 'array' });
            const sheets = window.excelWorkbook.SheetNames;
            
            const sel = document.getElementById('excel-sheet-select'); 
            if (sel) {
                sel.innerHTML = sheets.map(s => `<option value="${s}">${s}</option>`).join('');
                sel.value = sheets[0];
            }
            window.selectExcelSheet(sheets[0], true);
        } catch (err) {
            console.error("Excel Read Error (Trans):", err);
            alert("Ошибка чтения файла: " + err.message);
        }
    };
    r.readAsArrayBuffer(f);
};

window.selectExcelSheet = function(n, j = false) {
    const ws = window.excelWorkbook.Sheets[n]; 
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length > 0) {
        // Умный поиск строки заголовка
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(20, raw.length); i++) {
            const nonEmpties = raw[i].filter(c => c && c.toString().trim() !== "");
            if (nonEmpties.length >= 2) {
                headerRowIdx = i;
                break;
            }
        }
        
        window.excelColumns = raw[headerRowIdx] || [];
        window.excelData = raw.slice(headerRowIdx + 1);
        
        window.prepareMappingUI();
        
        if (j) {
            window.excelStep = 2;
            window.updateWizardUI();
            const nextBtn = document.getElementById('btn-wiz-next');
            if (nextBtn) nextBtn.disabled = false;
        }
    }
};

window.prepareMappingUI = function() {
    const cont = document.getElementById('field-mappings-container');
    if (!cont) return;

    const baseFields = {
        'art': ['артикул', 'код', 'sku', 'art', 'article', 'арт', 'код товара'],
        'name': ['наименование', 'название', 'товар', 'имя', 'name', 'title'],
        'price': ['цена', 'стоимость', 'price', 'прайс', 'сумма'],
        'stock': ['остаток', 'склад', 'количество', 'stock', 'кол-во', 'наличие']
    };

    window.importMappings = {};
    window.artSources = [];
    let html = '';

    window.excelColumns.forEach((colName, colIdx) => {
        const cleanIdx = String(colIdx);
        const lowerCol = (colName || "").toString().toLowerCase().trim();
        let selectedField = "";

        if (baseFields.art.some(s => lowerCol === s || lowerCol.includes(s))) {
            selectedField = "art";
            window.artSources.push(cleanIdx);
        } else {
            for (let [f, synonyms] of Object.entries(baseFields)) {
                if (f === 'art') continue;
                if (synonyms.some(s => lowerCol === s || lowerCol.includes(s))) {
                    selectedField = f;
                    window.importMappings[f] = cleanIdx;
                    break;
                }
            }
        }

        if (!selectedField && lowerCol && lowerCol !== "---") {
            selectedField = `DYNAMIC_${colName}`;
            window.importMappings[selectedField] = cleanIdx;
        }

        html += `
            <div class="panel" style="padding:15px; margin-bottom:10px; border:1px solid ${selectedField === 'art' ? 'var(--brand-red)' : (selectedField ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)')};">
                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:5px; text-transform:uppercase;">[Колонка ${colIdx + 1}] ${colName || '---'}</div>
                <select class="form-control" style="height:32px; font-size:0.7rem;" onchange="window.updateImportMapping('${cleanIdx}', this.value)">
                    <option value="">-- Пропустить --</option>
                    <option value="art" ${selectedField === 'art' ? 'selected' : ''}>АРТИКУЛ (ID)</option>
                    <option value="name" ${selectedField === 'name' ? 'selected' : ''}>НАИМЕНОВАНИЕ</option>
                    <option value="price" ${selectedField === 'price' ? 'selected' : ''}>ЦЕНА</option>
                    <option value="stock" ${selectedField === 'stock' ? 'selected' : ''}>ОСТАТОК</option>
                    <option value="DYNAMIC_${colName}" ${selectedField.startsWith('DYNAMIC_') ? 'selected' : ''}>[+] Характеристика</option>
                </select>
            </div>`;
    });
    cont.innerHTML = html;
};

window.updateImportMapping = function(idx, field) {
    // Очищаем старые привязки для этого индекса
    for (let key in window.importMappings) {
        if (window.importMappings[key] === idx) delete window.importMappings[key];
    }
    window.artSources = window.artSources.filter(i => i !== idx);

    if (field === 'art') {
        window.artSources.push(idx);
    } else if (field) {
        window.importMappings[field] = idx;
    }
    
    // Подсветка заполненности полей для визуального контроля
    const row = document.querySelector(`select[onchange*="'${idx}'"]`)?.closest('.panel');
    if (row) row.style.borderColor = field ? 'var(--brand-red)' : 'rgba(255,255,255,0.05)';
};

window.bindCustomImportField = function(fieldKey, idx) {
    delete window.importMappings[fieldKey];
    if (idx === '') return;
    window.updateImportMapping(String(idx), fieldKey);
};

window.addImportField = function() {
    const fieldName = prompt("Название новой характеристики:");
    const normalizedFieldName = (fieldName || '').trim();
    const cont = document.getElementById('field-mappings-container');
    if (!normalizedFieldName || !cont) return;

    const fieldKey = `DYNAMIC_${normalizedFieldName}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'panel';
    wrapper.style.padding = '15px';
    wrapper.style.marginBottom = '10px';
    wrapper.style.border = '1px solid rgba(0,147,255,0.35)';
    wrapper.innerHTML = `
        <div style="font-size:0.65rem; color:var(--accent-blue); margin-bottom:8px; text-transform:uppercase;">Новая характеристика</div>
        <div style="font-weight:700; color:#fff; margin-bottom:10px;">${normalizedFieldName}</div>
        <select class="form-control" style="height:32px; font-size:0.7rem;" onchange="window.bindCustomImportField('${fieldKey}', this.value)">
            <option value="">-- Выбрать колонку Excel --</option>
            ${window.excelColumns.map((column, index) => `<option value="${index}">${column || `Колонка ${index + 1}`}</option>`).join('')}
        </select>
    `;
    cont.appendChild(wrapper);
};

window.processImport = async function() {
    const target = document.getElementById('excel-target-category').value;
    const splitActive = document.getElementById('excel-split-active')?.checked;
    const nameFallback = document.getElementById('excel-name-fallback')?.checked;
    
    const targetCatObj = window.dbTransCategories.find(c => c.id === target);
    const catName = targetCatObj ? targetCatObj.name : "Без категории";

    document.getElementById('wiz-progress-idle').style.display = 'none';
    document.getElementById('wiz-progress-active').style.display = 'block';

    const progBar = document.getElementById('excel-progress-bar');
    const logCont = document.getElementById('excel-log-container');
    const statusText = document.getElementById('wiz-processed-count');
    const progText = document.getElementById('excel-progress-text');

    if (logCont) logCont.innerHTML = '<div>🚀 Запуск универсального импорта (Справочники)...</div>';

    // ВЫЗОВ ЕДИНОГО ДВИЖКА (CORE OS ENGINE)
    const imported = await window.runUniversalImport({
        data: window.excelData,
        mappings: window.importMappings,
        artSources: window.artSources,
        targetCategory: target,
        categoryName: catName,
        options: {
            splitActive: splitActive,
            nameFallback: nameFallback,
            idPrefix: 'PT-',
            moduleName: "Excel Импорт (Справочники)"
        },
        onProgress: (i, total, addedCount, msg, type) => {
            const pct = Math.round((i / (total - 1)) * 100);
            if (progBar) progBar.style.width = pct + '%';
            if (progText) progText.innerText = pct + '%';
            if (statusText) statusText.innerText = `Обработано строк: ${i + 1} из ${total}`;
            
            if (logCont) {
                if (type === 'error') {
                    const div = document.createElement('div');
                    div.style.color = 'var(--brand-red)';
                    div.innerText = `⚠️ ${msg}`;
                    logCont.appendChild(div);
                } else if (i % 100 === 0) {
                    const div = document.createElement('div');
                    div.innerText = `📦 Строка ${i+1}: развернуто в ${addedCount} поз.`;
                    logCont.appendChild(div);
                }
                logCont.scrollTop = logCont.scrollHeight;
            }
        }
    });

    if (imported && imported.length > 0) {
        for (const item of imported) window.dbTransProducts.push(item);
        
        window.saveAllToLocal();
        if (window.fbPush) await window.fbPush();
        
        window.renderPriceTable();
        document.getElementById('wiz-progress-active').style.display = 'none';
        document.getElementById('wiz-progress-done').style.display = 'block';
        document.getElementById('wiz-final-stats').innerText = `Добавлено ${imported.length} новых моделей в раздел "${catName}" (пустые строки пропущены)`;
        
        if (window.showToast) window.showToast(`Транспорт импортирован: +${imported.length}`, 'success');
    } else {
        alert("Данные для импорта не найдены. Проверьте маппинг колонок или содержимое файла.");
        window.excelStep = 2;
        window.updateWizardUI();
    }
};

window.renderExcelPreview = function() {
    const t = document.getElementById('excel-preview-table');
    if (t) t.innerHTML = window.excelData.slice(0,5).map(r => `<tr>${r.slice(0,10).map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
};

window.openAddMaster = function() { 
    window.addStep = 1; 
    const m = document.getElementById('add-master-modal'); 
    if (m) { 
        m.classList.add('active'); 
        window.updateAddWizardUI(); 
    }
    const dl = document.getElementById('existing-names');
    if (dl) {
        const names = [...new Set(window.dbTransProducts.map(p => p && p.name).filter(Boolean))];
        dl.innerHTML = names.map(n => `<option value="${n}">`).join('');
    }
};
window.closeAddMaster = function() { document.getElementById('add-master-modal')?.classList.remove('active'); };
window.updateAddWizardUI = function() {
    document.querySelectorAll('.wiz-content-add').forEach(c => c.style.display = 'none');
    const cur = document.getElementById(`add-wiz-${window.addStep}`);
    if (cur) cur.style.display = 'block';
    document.querySelectorAll('#add-wizard-steps .wiz-step').forEach(s => {
        const n = parseInt(s.dataset.step);
        s.classList.remove('active', 'complete');
        if (n === window.addStep) s.classList.add('active');
        if (n < window.addStep) s.classList.add('complete');
    });
    if (window.addStep === 3) window.renderAddSummary();
};
window.addWizNext = function() { if (window.addStep < 3) { window.addStep++; window.updateAddWizardUI(); } else window.saveAddMaster(); };
window.addWizBack = function() { if (window.addStep > 1) { window.addStep--; window.updateAddWizardUI(); } };
window.renderAddSummary = function() {
    if(document.getElementById('sum-name')) document.getElementById('sum-name').innerText = document.getElementById('add-name')?.value;
    if(document.getElementById('sum-art')) document.getElementById('sum-art').innerText = "АРТ: " + document.getElementById('add-art')?.value;
};
window.saveAddMaster = function() {
    const art = document.getElementById('add-art').value.trim();
    if (!art) {
        alert('Артикул обязателен для заполнения!');
        return;
    }
    const exists = window.dbTransProducts.find(p => p && p.art === art);
    if (exists) {
        alert('Ошибка: Транспортер с артикулом ' + art + ' уже существует!');
        return;
    }
    
    const userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "Система";

    const p = {
        id: Date.now(), 
        art: art, 
        name: document.getElementById('add-name').value,
        price: parseFloat(document.getElementById('add-price').value) || 0, 
        stock: parseInt(document.getElementById('add-stock').value) || 0,
        category: document.getElementById('add-category').value, 
        history: [{ time: new Date().toLocaleString(), user: userName, action: "Карточка создана вручную (Транспорт)" }]
    };
    window.dbTransProducts.push(p); 
    if (window.logAudit) window.logAudit('INFO', `Добавлен транспорт ${p.art}`, 'Справочники');
    if (window.fbPush) window.fbPush(); 
    window.renderPriceTable(); 
    window.closeAddMaster();
};

window.cleanupEmptyRows = function() { document.getElementById('cleanup-modal')?.classList.add('active'); };
window.startFinalCleanup = async function() {
    window.confirmAction("Очистка", "Удалить мусор из справочников?", async () => {
        const initial = window.dbTransProducts.length;
        window.dbTransProducts = window.dbTransProducts.filter(p => p && p.art && p.art !== "---");
        if (window.fbPush) await window.fbPush(); window.renderPriceTable();
        document.getElementById('cleanup-modal').classList.remove('active');
        if (window.showToast) window.showToast('Очищено', 'success');
    });
};

window.showDuplicateFinder = function() { document.getElementById('duplicate-modal')?.classList.add('active'); };
window.scanForDuplicates = function() {
    const counts = {}; window.dbTransProducts.forEach(p => { if (p && p.art) counts[p.art] = (counts[p.art] || 0) + 1; });
    const dups = Object.keys(counts).filter(a => counts[a] > 1);
    const cont = document.getElementById('duplicate-content');
    if (cont) cont.innerHTML = dups.length === 0 ? '<div style="padding:40px; opacity:0.5;">Дублей нет</div>' : dups.map(a => `<div style="padding:10px;">${a} (${counts[a]})</div>`).join('');
};

window.manageCategories = function() { document.getElementById('category-modal')?.classList.add('active'); window.renderCategoriesList(); };
window.closeCategoryModal = function() { document.getElementById('category-modal')?.classList.remove('active'); };
window.addNewCategory = function() {
    const el = document.getElementById('new-cat-name');
    const name = el ? el.value.trim() : '';
    if (!name) return;
    const newId = 'cat-' + Date.now().toString(36);
    window.dbTransCategories.push({ id: newId, name: name });
    if (el) el.value = '';
    window.renderCategoriesList();
    window.loadCategories();
    window.updateExcelCatSelect();
    if (window.fbPush) window.fbPush();
    if (window.showToast) window.showToast('Категория добавлена', 'success');
};
window.deleteCategory = function(id) {
    if (id === 'transporters') return alert('Нельзя удалить базовую категорию!');
    window.confirmAction('Удаление', 'Удалить категорию?', () => {
        window.dbTransCategories = window.dbTransCategories.filter(c => c.id !== id);
        window.renderCategoriesList();
        window.loadCategories();
        window.updateExcelCatSelect();
        if (window.fbPush) window.fbPush();
    });
};
window.renderCategoriesList = function() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    list.innerHTML = window.dbTransCategories.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
            <span>${c.name} <small class="neutral">(${c.id})</small></span>
            <button class="action-btn" onclick="window.deleteCategory('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
};

window.updateExcelCatSelect = function() {
    const h = window.dbTransCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    ['excel-target-category', 'add-category', 'pc-category'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = h; });
};

// ==========================================
// 3. INITIALIZATION LOOP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Prices Trans v9.6.2 operational.");
    window.loadCategories();
    window.renderPriceTable();
    window.updateExcelCatSelect();
    
    const p = new URLSearchParams(window.location.search);
    if (p.get('action') === 'add') setTimeout(() => window.openAddMaster(), 500);
    if (p.get('action') === 'import') setTimeout(() => window.openExcelImport(), 500);

    const s = document.querySelector('input[placeholder*="Поиск"]');
    if (s) s.oninput = (e) => { window.priceSearchQuery = e.target.value.toLowerCase().trim(); window.renderPriceTable(); };
});

window.addEventListener('pricesTransSynced', () => { window.renderPriceTable(); });
