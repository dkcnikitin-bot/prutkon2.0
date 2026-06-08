/**
 * directories.js - ПРУТКОН ОС: Системные справочники
 * Модуль для управления вспомогательными данными по схеме, аналогично прайс-листам.
 */

window.activeDirCategory = 'metal';
window.dirSearchQuery = "";
window.selectedDirIds = [];

// Хелперы для работы с числами (русский формат) - ВОЗВРАЩЕНО
window.parseRusFloat = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const s = String(str).replace(/\s/g, '').replace(/[₽%]/g, '').replace(',', '.');
    return parseFloat(s) || 0;
};

window.formatRusNumber = (v, decimals = 2) => {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v || 0);
};

window.formatRusCurrency = (v) => {
    return window.formatRusNumber(v, 2) + " ₽";
};

window.formatWhNumber = (v, decimals = 2) => {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(v || 0);
};

// Поля схемы для справочников (русские названия для шапок)
window.dirSchemaLabels = {
    'country': 'Страна',
    'website': 'Веб-сайт',
    'priority': 'Приоритет',
    'address': 'Адрес',
    'manager': 'Ответственный',
    'contact': 'Контактные данные',
    'status': 'Статус',
    'type': 'Тип',
    'diameter': 'Диаметр (мм)',
    'weight_per_m': 'Вес 1 м.п. (кг)',
    'length': 'Длина прутка (мм)',
    'bars_count': 'Кол-во прутков (шт)',
    'total_len': 'Общий метраж (м)',
    'steel_type': 'Марка стали',
    'available': 'В наличии',
    'weight': 'Общий вес (т)',
    'price': 'Цена за тонну (без НДС)',
    'sum_no_vat': 'Сумма без НДС',
    'sum_vat': 'Сумма с НДС',
    'price_m_no_vat': 'Цена м.п. без НДС',
    'price_m_vat': 'Цена м.п. с НДС',
    'delivery_m_no_vat': 'Доставка м.п. без НДС',
    'delivery_m_vat': 'Доставка м.п. с НДС',
    'total_price_m_no_vat': 'Итого м.п. без НДС',
    'total_price_m_vat': 'Итого м.п. с НДС',
    'vat_rate': 'Коэф. НДС (напр. 1.2)',
    'invoice_num': '№ Накладной',
    'delivery_date': 'Дата поставки',
    'supplier': 'Поставщик',
    'delivery_total': 'Доставка общая (руб)',
    'width': 'Ширина (мм)',
    'strength': 'Прочность (EP)',
    'cords': 'Кол-во кордов',
    'cover_top': 'Обкладка верх (мм)',
    'cover_bottom': 'Обкладка низ (мм)',
    'rubber_class': 'Класс резины',
    'tu': 'ГОСТ / ТУ',
    'thickness': 'Толщина (мм)',
    'weight_per_m2': 'Вес 1 м2 (кг)',
    'price_m2': 'Цена за 1 м2 (без НДС)',
    'price_mp': 'Цена за 1 м.п. (без НДС)',
    'area': 'Площадь (м2)'
};

// --- 1. ИНИЦИАЛИЗАЦИЯ И ТАБЫ ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('directories.html')) {
        window.loadDirCategories();
        window.renderDirectoryTable();
        
        // Обработка формы
        const form = document.getElementById('directory-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                window.saveDirectoryRecord();
            };
        }
    }
});

window.loadDirCategories = () => {
    const tabs = document.getElementById('directory-tabs');
    if (!tabs) return;
    
    tabs.innerHTML = window.dbDirectoryCategories.map(cat => `
        <button class="btn btn-secondary btn-sm ${window.activeDirCategory === cat.id ? 'active' : ''}" 
                style="margin-right:8px; margin-bottom:8px;"
                onclick="window.switchDirCategory('${cat.id}')">${cat.name}</button>
    `).join('');
    
    const title = document.getElementById('directory-title');
    const activeObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
    if (title && activeObj) title.innerText = activeObj.name;
};

window.switchDirCategory = (id) => {
    window.activeDirCategory = id;
    window.selectedDirIds = [];
    const fBar = document.getElementById('dir-dynamic-filters');
    if (fBar) delete fBar.dataset.initialized;
    window.loadDirCategories();
    window.renderDirectoryTable();
};

window.refreshDirectories = () => {
    window.renderDirectoryTable();
    window.showToast("Справочник обновлен", "success");
};

// --- 2. РЕНДЕРИНГ ТАБЛИЦЫ ---
window.renderDirectoryTable = () => {
    const container = document.getElementById('directory-table');
    if (!container) return;

    // Сбор фильтров
    const categoryRecords = (window.dbDirectories || []).filter(r => r.category === window.activeDirCategory);
    window.buildDirFilters(categoryRecords);

    const activeFilters = {};
    document.querySelectorAll('.dir-filter-select').forEach(sel => {
        if (sel.value) activeFilters[sel.dataset.key] = sel.value;
    });

    let filtered = categoryRecords.filter(r => {
        if (window.dirSearchQuery) {
            if (!r.name.toLowerCase().includes(window.dirSearchQuery.toLowerCase())) return false;
        }
        for (let key in activeFilters) {
            if (String(r[key]) !== String(activeFilters[key])) return false;
        }
        return true;
    });

    const activeCatObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
    const schema = activeCatObj ? activeCatObj.schema : [];

    let html = `
        <thead>
            <tr>
                <th style="width:30px;"><input type="checkbox" onchange="window.toggleAllDirItems(this.checked)"></th>
                <th>Название</th>
                ${schema.map(f => `<th>${window.dirSchemaLabels[f] || f}</th>`).join('')}
                <th style="width:120px; text-align:right;">Действия</th>
            </tr>
        </thead>
        <tbody>`;
    
    if (filtered.length === 0) {
        html += `<tr><td colspan="${schema.length + 3}" class="table-empty">Нет записей в этом разделе</td></tr>`;
    } else {
        filtered.forEach(r => {
            const isSelected = window.selectedDirIds.includes(String(r.id));
            html += `
                <tr class="${isSelected ? 'row-selected' : ''}" ondblclick="window.editDirectoryRecord('${r.id}')">
                    <td><input type="checkbox" class="dir-checkbox" data-id="${r.id}" ${isSelected ? 'checked' : ''} onchange="window.toggleDirSelection('${r.id}', this.checked)"></td>
                    <td class="text-bold text-white">${r.name}</td>
                    ${schema.map(f => {
                        let val = r[f] || '-';
                        if ((window.activeDirCategory === 'metal' || window.activeDirCategory === 'belt') && val !== '-') {
                            const isCurrency = ['price', 'sum_no_vat', 'sum_vat', 'price_m_no_vat', 'price_m_vat', 'delivery_m_no_vat', 'delivery_m_vat', 'total_price_m_no_vat', 'total_price_m_vat', 'price_m2', 'price_mp'].includes(f);
                            const num = window.parseRusFloat(val);
                            if (!isNaN(num)) {
                                val = isCurrency ? window.formatRusCurrency(num) : window.formatRusNumber(num, num % 1 === 0 ? 0 : 2);
                            }
                        }
                        return `<td>${val}</td>`;
                    }).join('')}
                    <td style="text-align:right;">
                        <div class="table-actions">
                            <button class="action-btn" onclick="window.editDirectoryRecord('${r.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="action-btn action-btn-danger" onclick="window.deleteDirectoryRecord('${r.id}')"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    container.innerHTML = html + "</tbody>";
    
    const massBtn = document.getElementById('dir-mass-delete-btn');
    if (massBtn) massBtn.classList.toggle('hidden', window.selectedDirIds.length === 0);
};

window.buildDirFilters = (records) => {
    const fBar = document.getElementById('dir-dynamic-filters');
    if (!fBar) return;
    if (fBar.dataset.initialized === 'true' && fBar.dataset.cat === window.activeDirCategory) return;

    const baseFields = ['id', 'name', 'category', 'history'];
    const keys = new Set();
    records.forEach(r => {
        Object.keys(r).forEach(k => { if (!baseFields.includes(k)) keys.add(k); });
    });

    if (keys.size === 0) { fBar.style.display = 'none'; return; }
    fBar.style.display = 'flex'; fBar.innerHTML = '';
    
    keys.forEach(key => {
        const values = new Set();
        records.forEach(r => { if (r[key]) values.add(r[key]); });
        const sel = document.createElement('select');
        sel.className = 'form-control dir-filter-select';
        sel.style.width = 'auto'; sel.style.fontSize = '0.7rem';
        sel.dataset.key = key;
        sel.onchange = () => window.renderDirectoryTable();
        let ops = `<option value="">Все: ${window.dirSchemaLabels[key] || key}</option>`;
        Array.from(values).sort().forEach(v => ops += `<option value="${v}">${v}</option>`);
        sel.innerHTML = ops;
        fBar.appendChild(sel);
    });
    fBar.dataset.initialized = 'true';
    fBar.dataset.cat = window.activeDirCategory;
};

// --- 3. МАНИПУЛЯЦИИ С ЗАПИСЯМИ ---
window.updateDirSearch = (q) => {
    window.dirSearchQuery = q;
    window.renderDirectoryTable();
};

window.startDirectoryAddWizard = () => {
    document.getElementById('dir-modal-title').innerText = "Новая запись";
    document.getElementById('dir-id').value = "";
    document.getElementById('dir-name').value = "";
    window.renderDirSchemaFields({});
    document.getElementById('directory-modal').classList.add('active');
};

window.renderDirSchemaFields = (data) => {
    const cont = document.getElementById('dir-schema-fields');
    if (!cont) return;
    
    const activeCatObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
    const schema = activeCatObj ? activeCatObj.schema : [];

    // Подготовка списков для выпадающих подсказок
    const suppliers = window.dbDirectories.filter(d => d.category === 'dealers').map(d => d.name);
    const steelTypesHtml = (window.steelTypes || []).map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');
    const suppliersHtml = suppliers.map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');

    if (window.activeDirCategory === 'metal') {
        const groups = [
            { title: 'Физические параметры', icon: 'fa-ruler-combined', fields: ['diameter', 'weight_per_m', 'length', 'bars_count', 'total_len', 'weight', 'steel_type', 'available'] },
            { title: 'Стоимость (общая)', icon: 'fa-money-bill-wave', fields: ['price', 'sum_no_vat', 'sum_vat', 'vat_rate'] },
            { title: 'Расчет за 1 метр', icon: 'fa-calculator', fields: ['price_m_no_vat', 'price_m_vat', 'delivery_m_no_vat', 'delivery_m_vat', 'total_price_m_no_vat', 'total_price_m_vat'] },
            { title: 'Логистика и приход', icon: 'fa-truck-ramp-box', fields: ['supplier', 'invoice_num', 'delivery_date'] }
        ];

        let html = `
            <datalist id="steel-types-list">${steelTypesHtml}</datalist>
            <datalist id="suppliers-list">${suppliersHtml}</datalist>
        `;

        groups.forEach(g => {
            html += `<div class="col-span-2 mt-4 mb-2" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; color: var(--brand-red); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="fa-solid ${g.icon}"></i> ${g.title}
                     </div>`;
            g.fields.forEach(f => {
                if (schema.includes(f)) {
                    const isAuto = ['sum_no_vat', 'sum_vat', 'price_m_no_vat', 'price_m_vat', 'delivery_m_vat', 'total_price_m_no_vat', 'total_price_m_vat', 'total_len', 'weight'].includes(f);
                    let listAttr = '';
                    if (f === 'steel_type') listAttr = 'list="steel-types-list"';
                    if (f === 'supplier') listAttr = 'list="suppliers-list"';

                    html += `
                        <div class="form-group">
                            <label>${window.dirSchemaLabels[f] || f}${isAuto ? ' <i class="fa-solid fa-calculator neutral" title="Авторасчет (можно изменить)"></i>' : ''}</label>
                            <input type="text" name="${f}" class="form-control dir-schema-input" 
                                   value="${String(data[f] || '').replace(/"/g, '&quot;')}" 
                                   ${listAttr}
                                   oninput="window.autoCalculateMetal(event)">
                        </div>
                    `;
                }
            });
        });
        cont.innerHTML = html;
        window.autoCalculateMetal();
    } else if (window.activeDirCategory === 'belt') {
        const groups = [
            { title: 'Технические характеристики', icon: 'fa-tape', fields: ['width', 'strength', 'cords', 'cover_top', 'cover_bottom', 'rubber_class', 'tu', 'thickness'] },
            { title: 'Размеры и вес рулона', icon: 'fa-ruler-combined', fields: ['length', 'area', 'weight', 'weight_per_m2'] },
            { title: 'Стоимость (без НДС)', icon: 'fa-money-bill-wave', fields: ['price_m2', 'price_mp', 'vat_rate'] },
            { title: 'Поставка и логистика', icon: 'fa-truck-ramp-box', fields: ['supplier', 'invoice_num', 'delivery_date'] }
        ];

        let html = `
            <datalist id="suppliers-list">${suppliersHtml}</datalist>
        `;

        groups.forEach(g => {
            html += `<div class="col-span-2 mt-4 mb-2" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; color: var(--brand-red); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="fa-solid ${g.icon}"></i> ${g.title}
                     </div>`;
            g.fields.forEach(f => {
                if (schema.includes(f)) {
                    const isAuto = ['price_mp', 'area', 'weight_per_m2'].includes(f);
                    let listAttr = '';
                    if (f === 'supplier') listAttr = 'list="suppliers-list"';

                    html += `
                        <div class="form-group">
                            <label>${window.dirSchemaLabels[f] || f}${isAuto ? ' <i class="fa-solid fa-calculator neutral" title="Авторасчет (можно изменить)"></i>' : ''}</label>
                            <input type="text" name="${f}" class="form-control dir-schema-input" 
                                   value="${String(data[f] || '').replace(/"/g, '&quot;')}" 
                                   ${listAttr}
                                   oninput="window.autoCalculateBelt(event)">
                        </div>
                    `;
                }
            });
        });
        cont.innerHTML = html;
        window.autoCalculateBelt();
    } else {
        cont.innerHTML = schema.map(f => `
            <div class="form-group">
                <label>${window.dirSchemaLabels[f] || f}</label>
                <input type="text" name="${f}" class="form-control dir-schema-input" value="${String(data[f] || '').replace(/"/g, '&quot;')}">
            </div>
        `).join('');
    }
};

window.autoCalculateMetal = (event) => {
    const form = document.getElementById('directory-form');
    if (!form) return;

    const getVal = (name) => window.parseRusFloat(form.querySelector(`[name="${name}"]`)?.value || '0');
    const setVal = (name, val, type = 'currency') => {
        // Не перезаписываем поле, которое сейчас редактирует пользователь
        if (event && event.target.name === name) return;
        
        const inp = form.querySelector(`[name="${name}"]`);
        if (inp) {
            if (type === 'currency') inp.value = window.formatRusCurrency(val);
            else if (type === 'weight') inp.value = window.formatRusNumber(val, 3);
            else if (type === 'qty') inp.value = window.formatRusNumber(val, 0);
            else inp.value = window.formatRusNumber(val, 2);
        }
    };

    const trigger = event ? event.target.name : null;

    // Входные данные
    const B = getVal('diameter');
    let C = getVal('weight_per_m');
    const L = getVal('length');
    const N = getVal('bars_count');
    let G = getVal('weight');
    let H = getVal('price');
    let M = getVal('delivery_m_no_vat');
    const Q = getVal('vat_rate');

    // 1. Авто-расчет веса 1 м.п. с использованием точной плотности стали
    if (trigger === 'diameter' || trigger === 'steel_type' || (trigger !== 'weight_per_m' && !C)) {
        if (B > 0) {
            const steelName = form.querySelector('[name="steel_type"]')?.value || '';
            const density = window.getSteelDensity ? window.getSteelDensity(steelName) : 7.85;
            C = (Math.PI * B * B * density) / 4000;
            setVal('weight_per_m', C, 'weight');
        }
    }

    // 2. Авто-расчет метража
    const totalMeters = (L * N) / 1000;
    if (trigger !== 'total_len') {
        setVal('total_len', totalMeters, 'meters');
    }

    // 3. Расчет веса
    if (trigger === 'total_len' || trigger === 'bars_count' || trigger === 'length' || trigger === 'weight_per_m') {
        G = (totalMeters * C) / 1000;
        setVal('weight', G, 'weight');
    }

    const deliveryTotal = getVal('delivery_total');
    if (G > 0) {
        M = (deliveryTotal / (G * 1000)) * C;
        setVal('delivery_m_no_vat', M);
    }

    if (Q === 0) return; 

    const sumNoVat = G * H;
    setVal('sum_no_vat', sumNoVat);
    setVal('sum_vat', sumNoVat * Q);

    const priceMetersNoVat = (H / 1000) * C;
    setVal('price_m_no_vat', priceMetersNoVat);
    setVal('price_m_vat', priceMetersNoVat * Q);

    setVal('delivery_m_vat', M * Q);

    const totalUnitPriceNoVat = priceMetersNoVat + M;
    setVal('total_price_m_no_vat', totalUnitPriceNoVat);
    setVal('total_price_m_vat', totalUnitPriceNoVat * Q);
};


window.autoCalculateBelt = (event) => {
    const form = document.getElementById('directory-form');
    if (!form) return;

    const getVal = (name) => window.parseRusFloat(form.querySelector(`[name="${name}"]`)?.value || '0');
    const setVal = (name, val, decimals = 2) => {
        if (event && event.target.name === name) return;
        const inp = form.querySelector(`[name="${name}"]`);
        if (inp) inp.value = window.formatRusNumber(val, decimals);
    };

    const trigger = event ? event.target.name : null;

    const width = getVal('width');
    let len = getVal('length');
    let area = getVal('area');
    let weight = getVal('weight');
    let wpm2 = getVal('weight_per_m2');
    let priceM2 = getVal('price_m2');
    let priceMp = getVal('price_mp');

    const widthFactor = width > 0 ? width / 1000 : 1.0;

    // 1. Bidirectional Quantity & Area Conversion
    if (trigger === 'area') {
        if (widthFactor > 0) {
            len = area / widthFactor;
            setVal('length', len);
        }
    } else if (trigger === 'length' || trigger === 'width') {
        area = len * widthFactor;
        setVal('area', area);
    }

    // 2. Bidirectional Pricing Conversion
    if (trigger === 'price_m2' || trigger === 'width') {
        priceMp = priceM2 * widthFactor;
        setVal('price_mp', priceMp);
    } else if (trigger === 'price_mp') {
        priceM2 = widthFactor > 0 ? priceMp / widthFactor : 0;
        setVal('price_m2', priceM2);
    }

    // 3. Weight per m2 calculation (справочно)
    if (trigger === 'weight' || trigger === 'area' || trigger === 'length' || trigger === 'width') {
        const totalArea = area > 0 ? area : len * widthFactor;
        if (totalArea > 0 && weight > 0) {
            wpm2 = weight / totalArea;
            setVal('weight_per_m2', wpm2, 2);
        }
    }
};


window.editDirectoryRecord = (id) => {
    const record = window.dbDirectories.find(r => String(r.id) === String(id));
    if (!record) return;
    
    document.getElementById('dir-modal-title').innerText = "Редактирование";
    document.getElementById('dir-id').value = record.id;
    document.getElementById('dir-name').value = record.name;
    window.renderDirSchemaFields(record);
    document.getElementById('directory-modal').classList.add('active');
};

window.saveDirectoryRecord = () => {
    const id = document.getElementById('dir-id').value;
    const name = document.getElementById('dir-name').value;
    
    const recordData = {
        name: name,
        category: window.activeDirCategory
    };
    
    document.querySelectorAll('.dir-schema-input').forEach(inp => {
        recordData[inp.name] = inp.value;
    });

    if (id) {
        const idx = window.dbDirectories.findIndex(r => String(r.id) === String(id));
        if (idx !== -1) {
            window.dbDirectories[idx] = { ...window.dbDirectories[idx], ...recordData };
            window.logAudit("DIR", `Обновлена запись: ${name}`);
        }
    } else {
        recordData.id = Date.now();
        window.dbDirectories.push(recordData);
        window.logAudit("DIR", `Создана запись: ${name}`);
    }

    document.getElementById('directory-modal').classList.remove('active');
    window.saveAllToLocal();
    window.renderDirectoryTable();
    window.showToast("Запись сохранена", "success");
};

window.deleteDirectoryRecord = (id) => {
    window.confirmAction("Удаление", "Вы уверены? Это действие нельзя отменить.", () => {
        window.dbDirectories = window.dbDirectories.filter(r => String(r.id) !== String(id));
        window.saveAllToLocal();
        window.renderDirectoryTable();
        window.showToast("Запись удалена", "error");
    });
};

// --- 4. КАТЕГОРИИ И МАССОВЫЕ ДЕЙСТВИЯ ---
window.manageDirCategories = () => {
    const list = document.getElementById('dir-cat-list');
    if (!list) return;
    
    list.innerHTML = window.dbDirectoryCategories.map(cat => `
        <div class="flex justify-between items-center padding-10 glass-panel mb-1">
            <span>${cat.name} <small class="neutral">(${cat.id})</small></span>
            <button class="action-btn action-btn-danger" onclick="window.delDirCategory('${cat.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join('');
    document.getElementById('dir-cat-modal').classList.add('active');
};

window.addNewDirCategory = () => {
    const name = prompt("Введите название нового справочника:");
    if (!name) return;
    const id = prompt("Введите технический ID (латиницей, например 'materials'):");
    if (!id) return;
    const schemaStr = prompt("Введите поля через запятую (например 'type,density'):", "type,status");
    const schema = schemaStr.split(',').map(s => s.trim());

    window.dbDirectoryCategories.push({ id, name, schema });
    window.saveAllToLocal();
    window.loadDirCategories();
    document.getElementById('dir-cat-modal').classList.remove('active');
    window.showToast("Раздел создан", "success");
};

window.manageDirCategories = () => {
    const list = document.getElementById('dir-cat-list');
    if (!list) return;
    
    list.innerHTML = window.dbDirectoryCategories.map(cat => `
        <div class="flex justify-between items-center padding-10 glass-panel mb-1">
            <span>${cat.name} <small class="neutral">(${cat.id})</small></span>
            <button class="action-btn action-btn-danger" onclick="window.delDirCategory('${cat.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join('');
    document.getElementById('dir-cat-modal').classList.add('active');
};

window.delDirCategory = (id) => {
    if (confirm("Удалить этот раздел и все его записи?")) {
        window.dbDirectoryCategories = window.dbDirectoryCategories.filter(c => c.id !== id);
        window.dbDirectories = window.dbDirectories.filter(r => r.category !== id);
        window.saveAllToLocal();
        window.loadDirCategories();
        window.switchDirCategory(window.dbDirectoryCategories[0]?.id || '');
        window.manageDirCategories();
    }
};

window.toggleDirSelection = (id, checked) => {
    const sId = String(id);
    if (checked) { if(!window.selectedDirIds.includes(sId)) window.selectedDirIds.push(sId); }
    else window.selectedDirIds = window.selectedDirIds.filter(x => x !== sId);
    window.renderDirectoryTable();
};

window.toggleAllDirItems = (checked) => {
    if (checked) {
        document.querySelectorAll('.dir-checkbox').forEach(cb => {
            const id = String(cb.dataset.id);
            if(!window.selectedDirIds.includes(id)) window.selectedDirIds.push(id);
        });
    } else window.selectedDirIds = [];
    window.renderDirectoryTable();
};

window.massDeleteDirectories = () => {
    window.confirmAction("Массовое удаление", `Удалить ${window.selectedDirIds.length} записей?`, () => {
        window.dbDirectories = window.dbDirectories.filter(r => !window.selectedDirIds.includes(String(r.id)));
        window.selectedDirIds = [];
        window.saveAllToLocal();
        window.renderDirectoryTable();
        window.showToast("Выбранные записи удалены", "success");
    });
};

// --- 5. ИМПОРТ EXCEL (МАСТЕР) ---
window.openDirectoryExcelImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => window.handleDirExcel(e.target.files[0]);
    input.click();
};

window.handleDirExcel = async (file) => {
    if (!file) return;
    window.showToast("Анализ файла...", "info");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (raw.length < 2) return window.showToast("Файл пуст", "error");
        
        const cols = raw[0];
        const rows = raw.slice(1);
        
        const mappings = {};
        const artSources = [];
        const activeCatObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
        const schema = activeCatObj ? activeCatObj.schema : [];

        cols.forEach((col, idx) => {
            const low = col.toString().toLowerCase();
            if (low.includes('название') || low.includes('имя')) artSources.push(idx); 
            schema.forEach(f => {
                if (low.includes(f) || low.includes(window.dirSchemaLabels[f]?.toLowerCase())) {
                    mappings[f] = idx;
                }
            });
        });

        if (artSources.length === 0) artSources.push(0); 

        const imported = await window.runUniversalImport({
            data: rows,
            mappings: mappings,
            artSources: artSources,
            targetCategory: window.activeDirCategory,
            options: { moduleName: 'Справочники' },
            onProgress: (cur, tot) => console.log(`Import: ${cur}/${tot}`)
        });

        imported.forEach(newItem => {
            newItem.name = newItem.art; 
            
            // Если это металл, прогоняем через расчеты (если есть базовые поля)
            if (newItem.category === 'metal') {
                const B = window.parseRusFloat(newItem.diameter);
                let C = window.parseRusFloat(newItem.weight_per_m);
                if (B > 0 && C === 0) C = B * B * 0.00616;
                newItem.weight_per_m = C;

                const G = window.parseRusFloat(newItem.weight);
                const H = window.parseRusFloat(newItem.price);
                const M = window.parseRusFloat(newItem.delivery_m_no_vat);
                const Q = window.parseRusFloat(newItem.vat_rate);

                if (Q > 0) {
                    newItem.sum_no_vat = G * H;
                    newItem.sum_vat = newItem.sum_no_vat * Q;
                    newItem.price_m_no_vat = (H / 1000) * C;
                    newItem.price_m_vat = newItem.price_m_no_vat * Q;
                    newItem.delivery_m_vat = M * Q;
                    newItem.total_price_m_no_vat = newItem.price_m_no_vat + M;
                    newItem.total_price_m_vat = newItem.total_price_m_no_vat * Q;
                }
            } else if (newItem.category === 'belt') {
                const width = window.parseRusFloat(newItem.width);
                const len = window.parseRusFloat(newItem.length);
                const priceM2 = window.parseRusFloat(newItem.price_m2);
                const widthFactor = width > 0 ? width / 1000 : 1.0;

                if (newItem.area === undefined || newItem.area === '') {
                    newItem.area = len * widthFactor;
                }
                if (newItem.price_mp === undefined || newItem.price_mp === '') {
                    newItem.price_mp = priceM2 * widthFactor;
                }
                const weight = window.parseRusFloat(newItem.weight);
                if (weight > 0 && newItem.area > 0) {
                    newItem.weight_per_m2 = weight / newItem.area;
                }
            }

            const existingIdx = window.dbDirectories.findIndex(r => r.name === newItem.name && r.category === newItem.category);
            if (existingIdx !== -1) window.dbDirectories[existingIdx] = { ...window.dbDirectories[existingIdx], ...newItem };
            else window.dbDirectories.push(newItem);
        });

        window.saveAllToLocal();
        window.renderDirectoryTable();
        window.showToast(`Импортировано ${imported.length} записей`, "success");
    };
    reader.readAsArrayBuffer(file);
};
