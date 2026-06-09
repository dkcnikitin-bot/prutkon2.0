window.DB_VERSION = "19.0.0";

console.log("Prices OS: Module Loading v19.0.0...");

// ==========================================
// 1. DATA BINDINGS & REGISTRY
// ==========================================
window.activeCategory = 'sec_rods';
window.excelWorkbook = null;
window.excelColumns = [];
window.excelData = [];
window.importMappings = {};
window.artSources = [];
window.editingCatId = null;
window.selectedPriceIds = [];
window.priceSchemaFields = {
    'tech_type': 'Тип техники',
    'available': 'Доступен для заказа',
    'photo': 'Фото-изображение',
    'drawing': 'Чертеж',
    'art_prutkon': 'Артикул Пруткон',
    'blank_ref': 'Ссылка на заготовку',
    'art_all': 'Артикул всех производителей',
    'user_name': 'Кто внес данные',
    'stock': 'Остаток на складе',
    'stats': 'Статистика заказов',
    'global': 'Работа во всех таблицах'
};

// ==========================================
// 2. CORE FUNCTIONS (PRE-DEFINED)
// ==========================================

window.loadCategories = function() {
    const container = document.getElementById('price-tabs');
    if (!container) return;
    
    const activeObj = window.dbCategories.find(c => c.id === window.activeCategory);
    
    // Определяем путь для подсветки
    let pathIds = [];
    let curr = activeObj;
    while (curr) {
        pathIds.push(curr.id);
        curr = window.dbCategories.find(c => c.id === curr.parent);
    }

    // Рендерим 1 УРОВЕНЬ (Всегда видим)
    const level1 = window.dbCategories.filter(c => c.parent === null);
    const htmlL1 = `
        <div class="category-tier tier-1 mb-4">
            <div class="tier-grid">
                ${level1.map(cat => {
                    const isActive = pathIds.includes(cat.id);
                    return `<button class="dir-style-btn ${isActive ? 'active' : ''}" onclick="window.switchCategory('${cat.id}')">${cat.name}</button>`;
                }).join('')}
            </div>
        </div>
    `;

    // Рендерим 2 УРОВЕНЬ (Если у выбранного L1 есть дети)
    let htmlL2 = '';
    const activeL1 = level1.find(c => pathIds.includes(c.id));
    if (activeL1) {
        const level2 = window.dbCategories.filter(c => c.parent === activeL1.id);
        if (level2.length > 0) {
            htmlL2 = `
                <div class="category-tier tier-2 mb-3 animated-fade-in">
                    <div class="tier-grid">
                        ${level2.map(cat => {
                            const isActive = pathIds.includes(cat.id);
                            return `<button class="dir-style-btn btn-sm ${isActive ? 'active' : ''}" onclick="window.switchCategory('${cat.id}')">${cat.name}</button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Рендерим 3 УРОВЕНЬ (Если у выбранного L2 есть дети)
    let htmlL3 = '';
    if (activeL1) {
        const level2 = window.dbCategories.filter(c => c.parent === activeL1.id);
        const activeL2 = level2.find(c => pathIds.includes(c.id));
        if (activeL2) {
            const level3 = window.dbCategories.filter(c => c.parent === activeL2.id);
            if (level3.length > 0) {
                htmlL3 = `
                    <div class="category-tier tier-3 mb-3 animated-fade-in">
                        <div class="tier-grid">
                            ${level3.map(cat => {
                                const isActive = pathIds.includes(cat.id);
                                return `<button class="dir-style-btn btn-xs ${isActive ? 'active' : ''}" onclick="window.switchCategory('${cat.id}')">${cat.name}</button>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }

    container.innerHTML = htmlL1 + htmlL2 + htmlL3;

    if (activeObj) {
        document.getElementById('price-title').innerText = activeObj.name;
        // Если выбрали папку (у которой есть дети) - не сбрасываем, но таблица будет пуста или надо показать первого ребенка?
        // Лучше просто оставить как есть.
    }
};

window.switchCategory = function(catId) {
    if (catId === null) {
        window.activeCategory = null; 
    } else {
        window.activeCategory = catId;
    }
    
    window.selectedPriceIds = [];
    const fBar = document.getElementById('dynamic-filters');
    if (fBar) delete fBar.dataset.initialized;
    
    window.loadCategories();
    window.renderPriceTable();
};

window.refreshPrices = function() {
    window.renderPriceTable();
    if (window.showToast) window.showToast('Прайс обновлен', 'success');
};

window.buildFiltersBar = function() {
    const fBar = document.getElementById('dynamic-filters');
    if (!fBar) return;
    if (fBar.dataset.initialized === 'true' && fBar.dataset.cat === window.activeCategory) return;
    
    const categoryProducts = window.dbProducts.filter(p => p.category === window.activeCategory);
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
    if (typeof window.syncWarehouseToPrices === 'function') window.syncWarehouseToPrices();
    if (!Array.isArray(window.dbProducts)) window.dbProducts = [];
    const tableContainer = document.getElementById('price-table');
    if (!tableContainer) return;

    const activeCategoryObj = window.activeCategory ? window.dbCategories.find(c => c.id === window.activeCategory) : null;
    
    // 🔥 УМНЫЕ ФИЛЬТРЫ
    const filterMinPrice = document.getElementById('filter-price-min')?.value;
    const filterMaxPrice = document.getElementById('filter-price-max')?.value;
    const filterStock = document.getElementById('filter-stock')?.value;
    const filterHasPhoto = document.getElementById('filter-has-photo')?.checked;
    const filterCatField = document.getElementById('filter-category-field')?.value;
    const filterCatValue = document.getElementById('filter-category-value')?.value?.toLowerCase().trim();
    
    // Заполняем выпадашку полей категории
    const fieldSelect = document.getElementById('filter-category-field');
    if (fieldSelect && activeCategoryObj && activeCategoryObj.schema) {
        const bFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
        const displayFields = activeCategoryObj.schema.filter(f => !bFields.includes(f));
        if (displayFields.length > 0 && !fieldSelect.dataset.initialized) {
            fieldSelect.innerHTML = '<option value="">-- Выберите поле --</option>' + 
                displayFields.map(f => `<option value="${f}">${window.priceSchemaFields[f] || f}</option>`).join('');
            fieldSelect.dataset.initialized = 'true';
        }
    }

    // Рекурсивный поиск всех дочерних ID категорий
    const getAllChildren = (id) => {
        let list = [id];
        window.dbCategories.filter(c => c.parent === id).forEach(child => {
            list = list.concat(getAllChildren(child.id));
        });
        return list;
    };
    const activeCategoryTreeIds = window.activeCategory === 'all' ? [] : getAllChildren(window.activeCategory);

    let filtered = window.dbProducts.filter(p => {
        if (!p) return false;
        
        // Фильтр по категории
        if (window.activeCategory !== 'all' && !activeCategoryTreeIds.includes(p.category)) return false;
        
        // Поиск по тексту
        if (window.priceSearchQuery) {
            const match = (p.art && p.art.toLowerCase().includes(window.priceSearchQuery)) || 
                          (p.name && p.name.toLowerCase().includes(window.priceSearchQuery));
            if (!match) return false;
        }
        
        // Фильтр по цене
        if (filterMinPrice && parseFloat(p.price) < parseFloat(filterMinPrice)) return false;
        if (filterMaxPrice && parseFloat(p.price) > parseFloat(filterMaxPrice)) return false;
        
        // Фильтр по остатку
        if (filterStock === 'in_stock' && (p.stock || 0) <= 0) return false;
        if (filterStock === 'low_stock' && (p.stock || 0) > 10) return false;
        if (filterStock === 'low_stock' && (p.stock || 0) <= 0) return false;
        if (filterStock === 'out_of_stock' && (p.stock || 0) > 0) return false;
        
        // Фильтр по фото
        if (filterHasPhoto && !p.photo) return false;
        
        // Фильтр по полю категории
        if (filterCatField && filterCatValue) {
            const val = String(p[filterCatField] || '').toLowerCase().trim();
            if (val !== filterCatValue) return false;
        }
        
        return true;
    });

    const schema = (activeCategoryObj && activeCategoryObj.schema) ? activeCategoryObj.schema : [];
    const required = (activeCategoryObj && activeCategoryObj.requiredFields) ? activeCategoryObj.requiredFields : [];
    
    // Определяем поля для отображения (исключая базовые, которые выводятся отдельно)
    const bFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
    const displayFields = schema.filter(f => !bFields.includes(f));

    // Счетчик фильтров
    const activeFiltersCount = [filterMinPrice, filterMaxPrice, filterStock, filterHasPhoto, filterCatField].filter(Boolean).length;

    let html = `
        <thead>
            <tr>
                <th style="width:30px;"><input type="checkbox" onchange="window.toggleSelectAllPrices(this.checked)"></th>
                <th style="width:50px;">Фото</th>
                <th style="width:140px;">Артикул <i class="fa-solid fa-flag text-xs" style="color:var(--brand-red)" title="Обязательно"></i></th>
                <th>Наименование <i class="fa-solid fa-flag text-xs" style="color:var(--brand-red)" title="Обязательно"></i></th>
                ${displayFields.map(f => {
                    const isReq = required.includes(f);
                    return `<th>${window.priceSchemaFields[f] || f} ${isReq ? '<i class="fa-solid fa-flag text-xs" style="color:var(--brand-red)" title="Обязательно"></i>' : ''}</th>`;
                }).join('')}
                <th style="width:120px;">Цена <i class="fa-solid fa-flag text-xs" style="color:var(--brand-red)" title="Обязательно"></i></th>
                <th style="width:90px;">Склад</th>
                <th style="width:140px; text-align:right;">Действия</th>
            </tr>
        </thead>
        <tbody>`;

    // Grouping & Sorting logic by key parameters
    const isRodCat = ['sec_rods', 'rods_hedgehog', 'rods_finger', 'rods_rti', 'rods_bent_metal', 'rods_bent_rti', 'rods_double', 'blanks'].includes(window.activeCategory) || (activeCategoryObj && activeCategoryObj.parent === 'rods');
    const isBeltCat = window.activeCategory === 'belts';

    if (isRodCat) {
        filtered.sort((a, b) => {
            const diaA = parseFloat(a.dia || a.diameter) || 0;
            const diaB = parseFloat(b.dia || b.diameter) || 0;
            if (diaA !== diaB) return diaA - diaB;
            return String(a.name).localeCompare(String(b.name));
        });
    } else if (isBeltCat) {
        filtered.sort((a, b) => {
            const thickA = parseFloat(a.thickness) || 0;
            const thickB = parseFloat(b.thickness) || 0;
            if (thickA !== thickB) return thickA - thickB;
            const strA = parseFloat(a.strength) || 0;
            const strB = parseFloat(b.strength) || 0;
            if (strA !== strB) return strA - strB;
            return String(a.name).localeCompare(String(b.name));
        });
    }

    if (filtered.length === 0) {
        html += `<tr><td colspan="${8 + displayFields.length}" class="table-empty">
            ${activeFiltersCount > 0 ? 'По выбранным фильтрам записей не найдено. Попробуйте сбросить фильтры.' : 'Записей не найдено'}
        </td></tr>`;
    } else {
        let lastGroup = null;
        filtered.forEach(p => {
            if (isRodCat) {
                const diaVal = parseFloat(p.dia || p.diameter) || 0;
                const groupLabel = diaVal ? `Диаметр: Ø${diaVal} мм` : 'Диаметр: Не указан';
                if (groupLabel !== lastGroup) {
                    lastGroup = groupLabel;
                    html += `
                        <tr style="background: rgba(255,180,0,0.03); font-weight: bold; border-bottom: 1px solid rgba(255,180,0,0.08);">
                            <td colspan="${8 + displayFields.length}" style="padding: 8px 15px; color: var(--brand-gold); font-size: 0.8rem; text-align: left;">
                                <i class="fa-solid fa-circle-dot" style="font-size:0.6rem;"></i> ${groupLabel}
                            </td>
                        </tr>
                    `;
                }
            } else if (isBeltCat) {
                const thickVal = p.thickness || 'Не указана';
                const strengthVal = p.strength || 'Не указана';
                const groupLabel = `Толщина: ${thickVal} мм, Прочность: ${strengthVal}`;
                if (groupLabel !== lastGroup) {
                    lastGroup = groupLabel;
                    html += `
                        <tr style="background: rgba(0,199,190,0.03); font-weight: bold; border-bottom: 1px solid rgba(0,199,190,0.08);">
                            <td colspan="${8 + displayFields.length}" style="padding: 8px 15px; color: #00c7be; font-size: 0.8rem; text-align: left;">
                                <i class="fa-solid fa-tape" style="font-size:0.6rem;"></i> ${groupLabel}
                            </td>
                        </tr>
                    `;
                }
            }

            const isSelected = window.selectedPriceIds.includes(String(p.id));
            const cleanName = window.formatProductNameForList ? window.formatProductNameForList(p) : p.name;

            html += `
                <tr class="${isSelected ? 'row-selected' : ''}" ondblclick="window.editProduct('${p.id}')">
                    <td><input type="checkbox" class="price-checkbox" data-id="${p.id}" ${isSelected ? 'checked' : ''} onchange="window.togglePriceSelection('${p.id}', this.checked)"></td>
                    <td><img src="${p.photo || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iRm9udEF3ZXNvbWUiPvVrjwvdGV4dD48L3N2Zz4='}" class="table-thumb"></td>
                    <td class="table-art" style="color:var(--brand-red);">${p.art || '---'}</td>
                    <td><span>${cleanName || 'Без названия'}</span></td>
                    ${displayFields.map(f => `<td>${p[f] || '-'}</td>`).join('')}
                    <td class="table-price" style="font-family:'JetBrains Mono';">
                        ${window.formatCurrency ? window.formatCurrency(p.price) : p.price.toLocaleString() + ' ₽'}
                    </td>
                    <td><span style="font-weight:700;">${p.stock || 0}</span> <small class="table-muted">шт</small></td>
                    <td style="text-align:right;">
                        <div class="table-actions">
                            <button class="action-btn" onclick="window.showItemHistory('${p.id}')" title="История"><i class="fa-solid fa-clock-rotate-left"></i></button>
                            <button class="action-btn" onclick="window.editProduct('${p.id}')" title="Правка"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="action-btn" style="color:var(--brand-red); opacity:0.6;" onclick="window.deleteProduct('${p.id}')" title="Удалить"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    tableContainer.innerHTML = html + '</tbody>';

    // Показываем/скрываем кнопку массового удаления
    const massBtn = document.getElementById('mass-delete-btn');
    const massCount = document.getElementById('mass-delete-count');
    if (massBtn) {
        massBtn.style.display = window.selectedPriceIds.length > 0 ? 'inline-flex' : 'none';
    }
    if (massCount) {
        massCount.innerText = window.selectedPriceIds.length;
    }
};

window.clearFilters = function() {
    const els = {
        'filter-price-min': '',
        'filter-price-max': '',
        'filter-stock': '',
        'filter-has-photo': false,
        'filter-category-field': '',
        'filter-category-value': ''
    };
    Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') el.checked = val;
            else el.value = val;
        }
    });
    window.renderPriceTable();
    window.showToast('Фильтры сброшены', 'info');
};

window.togglePriceSelection = function(id, checked) {
    const sId = String(id);
    if (checked) { if(!window.selectedPriceIds.includes(sId)) window.selectedPriceIds.push(sId); }
    else { window.selectedPriceIds = window.selectedPriceIds.filter(x => x !== sId); }
    window.renderPriceTable();
};

window.toggleSelectAllPrices = function(checked) {
    if (checked) {
        document.querySelectorAll('.price-checkbox').forEach(cb => {
            const id = String(cb.dataset.id);
            if(!window.selectedPriceIds.includes(id)) window.selectedPriceIds.push(id);
        });
    } else { window.selectedPriceIds = []; }
    window.renderPriceTable();
};

window.deleteProduct = function(id) {
    window.confirmAction("Удаление", "Вы действительно хотите удалить этот товар?", () => {
        window.dbProducts = window.dbProducts.filter(p => p && String(p.id) !== String(id));
        if (window.fbPush) window.fbPush();
        window.renderPriceTable();
        if (window.showToast) window.showToast('Товар удален', 'success');
    });
};

window.massDeleteProducts = function() {
    const count = window.selectedPriceIds.length;
    if (count === 0) return;
    window.confirmAction("Массовое удаление", `Удалить ${count} выбранных позиций? Это действие необратимо.`, async () => {
        const before = window.dbProducts.length;
        window.dbProducts = window.dbProducts.filter(p => p && !window.selectedPriceIds.includes(String(p.id)));
        const deleted = before - window.dbProducts.length;
        window.selectedPriceIds = [];
        window.saveAllToLocal();
        if (window.fbPush) await window.fbPush();
        window.renderPriceTable();
        if (window.showToast) window.showToast(`Удалено ${deleted} позиций`, 'success');
    });
};

window.showItemHistory = function(id) {
    const p = window.dbProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    const modal = document.getElementById('item-history-modal');
    if (!modal) return;
    modal.classList.add('active');
    document.getElementById('item-history-details').innerHTML = `<div style="font-weight:800; font-size:1.1rem; color:#fff;">${p.name}</div><div style="opacity:0.4; font-size:0.7rem;">АРТ: ${p.art} | ID: ${p.id}</div>`;
    const list = document.getElementById('item-history-list');
    list.innerHTML = (p.history || []).slice().reverse().map(h => `
        <div style="padding:15px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:800; color:var(--emerald-neon); font-size:0.75rem;">${h.user}</span>
                <span style="opacity:0.3; font-size:0.6rem;">${h.time}</span>
            </div>
            <div style="font-size:0.8rem; line-height:1.4;">${h.action}</div>
        </div>`).join('') || '<div style="opacity:0.2; text-align:center; padding:40px;">История пуста</div>';
};

window.editProduct = function(id) {
    const p = window.dbProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    const m = document.getElementById('product-card-modal');
    if (!m) return;
    m.classList.add('active');
    document.getElementById('pc-id').value = p.id;
    document.getElementById('pc-art').value = p.art || "";
    document.getElementById('pc-name').value = p.name || "";
    document.getElementById('pc-price').value = p.price || 0;
    document.getElementById('pc-stock').value = p.stock || 0;
    document.getElementById('pc-photo').value = p.photo || "";
    
    const photoImg = document.getElementById('product-card-img');
    photoImg.src = p.photo || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iRm9udEF3ZXNvbWUiPvVrjwvdGV4dD48L3N2Zz4=";
    photoImg.onerror = function() { this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iRm9udEF3ZXNvbWUiPvVrjwvdGV4dD48L3N2Zz4='; };
    
    const catSel = document.getElementById('pc-category');
    if (catSel) {
        const leafCategories = window.dbCategories.filter(c => c.parent !== null);
        catSel.innerHTML = leafCategories.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    // Загружаем динамические поля выбранной категории
    window.loadProductCategoryFields();
};

window.loadProductCategoryFields = function() {
    const catId = document.getElementById('pc-category')?.value;
    const dynCont = document.getElementById('pc-dynamic-fields-container');
    if (!dynCont) return;
    
    const catObj = window.dbCategories.find(c => c.id === catId);
    const schema = catObj ? catObj.schema : [];
    const required = catObj ? (catObj.requiredFields || []) : [];

    // Получаем ID текущего товара
    const productId = document.getElementById('pc-id')?.value;
    const product = window.dbProducts.find(p => p && String(p.id) === String(productId));
    
    if (!schema || schema.length === 0) {
        dynCont.innerHTML = '<div style="opacity:0.4; font-size:0.8rem;"><i class="fa-solid fa-info-circle"></i> В этой категории нет дополнительных полей</div>';
        return;
    }

    const bFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
    const displayFields = schema.filter(f => !bFields.includes(f));
    
    const icons = { 
        tech_type: '⚙️', 
        available: '✅', 
        drawing: '📐', 
        art_prutkon: '🏷️', 
        art_all: '🏷️', 
        stats: '📊', 
        global: '🌐', 
        user_name: '👤', 
        blank_ref: '🔗',
        material: '🧱',
        diameter: '⭕',
        length: '📏',
        width: '📐',
        thickness: '📊',
        color: '🎨',
        weight: '⚖️',
        brand: '🏭️'
    };

    dynCont.innerHTML = displayFields.map(f => {
        const isReq = required.includes(f);
        const icon = icons[f] || '📌';
        const label = window.priceSchemaFields[f] || f;
        const value = product && product[f] ? product[f] : '';
        
        // Собираем уникальные значения для этого поля
        const uniqueValues = [...new Set(window.dbProducts.map(p => p && p[f]).filter(Boolean))];
        let datalistHtml = '';
        let listAttr = '';
        if (uniqueValues.length > 0) {
            const listId = `dl-pc-${f}`;
            datalistHtml = `<datalist id="${listId}">${uniqueValues.map(v => `<option value="${String(v).replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
            listAttr = `list="${listId}"`;
        }
        
        return `
            <div class="form-group">
                <label>${icon} ${label} ${isReq ? '<i class="fa-solid fa-flag text-xs" style="color:var(--brand-red)"></i>' : ''}</label>
                ${datalistHtml}
                <input type="text" class="form-control pc-dyn-input" data-key="${f}" value="${value}" ${listAttr} placeholder="Выберите или введите ${label.toLowerCase()}...">
            </div>
        `;
    }).join('');
    
    // Скроллим к динамическим полям если их много
    setTimeout(() => {
        const modal = document.getElementById('product-card-modal');
        if (modal && displayFields.length > 4) {
            const fieldsSection = document.getElementById('pc-dynamic-fields');
            if (fieldsSection) {
                fieldsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, 100);
};

window.saveProductCard = async function() {
    const id = document.getElementById('pc-id').value;
    const p = window.dbProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    
    // Проверка на дубликаты при изменении
    const newArt = document.getElementById('pc-art').value.trim();
    if (newArt && newArt !== p.art) {
        const exists = window.dbProducts.find(x => x && x.art === newArt && String(x.id) !== String(id));
        if (exists) {
            window.showToast('Ошибка: Артикул ' + newArt + ' уже занят!', 'error');
            return;
        }
    }

    const catId = document.getElementById('pc-category').value;
    const catObj = window.dbCategories.find(c => c.id === catId);
    const required = catObj ? (catObj.requiredFields || []) : [];

    // Валидация обязательных полей
    if (!newArt || !document.getElementById('pc-name').value || !document.getElementById('pc-price').value) {
        window.showToast("Заполните обязательные поля!", "error");
        return;
    }

    // Сбор динамических полей
    const dynValues = {};
    let missingDyn = false;
    document.querySelectorAll('.pc-dyn-input').forEach(inp => {
        const key = inp.dataset.key;
        dynValues[key] = inp.value;
        if (required.includes(key) && !inp.value) missingDyn = true;
    });

    if (missingDyn) {
        window.showToast("Заполните поля, отмеченные флажком!", "error");
        return;
    }

    const oldValues = { art: p.art, name: p.name, price: p.price, stock: p.stock };
    
    // Обновление базовых полей
    p.art = newArt;
    p.name = document.getElementById('pc-name').value;
    p.price = parseFloat(document.getElementById('pc-price').value) || 0;
    p.stock = parseInt(document.getElementById('pc-stock').value) || 0;
    p.photo = document.getElementById('pc-photo').value;
    p.category = catId;

    // Сохранение динамических полей
    Object.assign(p, dynValues);
    
    // История изменений
    if (!p.history) p.history = [];
    
    let changes = [];
    if (oldValues.art !== p.art) changes.push(`Артикул: ${oldValues.art} → ${p.art}`);
    if (oldValues.name !== p.name) changes.push(`Имя: ${oldValues.name} → ${p.name}`);
    if (oldValues.price !== p.price) changes.push(`Цена: ${oldValues.price} ₽ → ${p.price} ₽`);
    if (oldValues.stock !== p.stock) changes.push(`Склад: ${oldValues.stock} → ${p.stock}`);
    
    const userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "Система";
    const actionDesc = changes.length > 0 ? "Изменено: " + changes.join(', ') : "Сохранение";
    
    p.history.push({ time: new Date().toLocaleString(), user: userName, action: actionDesc });
    
    if (window.logAudit) window.logAudit('INFO', `Редактирование товара ${p.art}`, 'Прайс');
    
    window.saveAllToLocal();
    if (window.fbPush) await window.fbPush();
    
    window.renderPriceTable();
    window.closeProductCard();
    window.showToast('Сохранено', 'success');
};

window.deleteProductFromCard = function() {
    const id = document.getElementById('pc-id').value;
    const p = window.dbProducts.find(x => x && String(x.id) === String(id));
    if (!p) return;
    
    window.confirmAction("Удаление товара", `Удалить "${p.name}" (${p.art})?`, async () => {
        const before = window.dbProducts.length;
        window.dbProducts = window.dbProducts.filter(prod => prod && String(prod.id) !== String(id));
        window.saveAllToLocal();
        if (window.fbPush) await window.fbPush();
        window.renderPriceTable();
        window.closeProductCard();
        window.showToast(`Удалено: ${p.art}`, 'success');
    });
};

window.closeProductCard = function() { 
    document.getElementById('product-card-modal')?.classList.remove('active'); 
    // Сброс input file
    const upload = document.getElementById('pc-photo-upload');
    if (upload) upload.value = '';
};

// Обработка загрузки фото с компьютера
window.handlePhotoUpload = function(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const fileName = file.name;
    const targetCategory = document.getElementById('pc-category')?.value;
    
    // Определяем папку для фото
    let folderName = 'General';
    if (targetCategory) {
        const cat = window.dbCategories.find(c => c.id === targetCategory);
        if (cat) {
            folderName = cat.name.toLowerCase().replace(/[^a-z0-9а-яё\s-]/g, '').trim();
            folderName = folderName.replace(/\s+/g, ''); // убираем пробелы
        }
    }
    
    // Формируем путь: extracted_xlsx/{folder}/{filename}
    const relativePath = `extracted_xlsx/${folderName}/${fileName}`;
    
    // Устанавливаем путь в поле
    document.getElementById('pc-photo').value = relativePath;
    
    // Обновляем превью
    const img = document.getElementById('product-card-img');
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Показываем подсказку
    const hint = document.getElementById('pc-photo-path-hint');
    if (hint) {
        hint.innerHTML = `<i class="fa-solid fa-info-circle"></i> Фото будет сохранено в: <b>${relativePath}</b><br><span class="text-xs">Убедитесь что файл физически скопирован в эту папку!</span>`;
    }
    
    window.showToast(`Фото подготовлено: ${fileName}`, 'success');
};

window.openExcelImport = function() {
    window.excelStep = 1;
    const m = document.getElementById('excel-modal');
    if (m) { m.classList.add('active'); window.updateWizardUI(); }
};
window.closeExcelImport = function() { document.getElementById('excel-modal')?.classList.remove('active'); };

window.updateWizardUI = function() {
    // Скрываем все шаги — убираем класс hidden у текущего, добавляем остальным
    document.querySelectorAll('.wiz-content').forEach(c => {
        c.classList.add('hidden');
        c.style.display = '';
    });
    const cur = document.getElementById(`excel-wiz-${window.excelStep}`);
    if (cur) { cur.classList.remove('hidden'); }
    
    document.querySelectorAll('#excel-wizard-steps .wiz-step').forEach(s => {
        const n = parseInt(s.dataset.step);
        s.classList.remove('active', 'complete');
        if (n === window.excelStep) s.classList.add('active');
        if (n < window.excelStep) s.classList.add('complete');
    });
    
    const sub = document.getElementById('excel-wizard-subtitle');
    const bNext = document.getElementById('btn-wiz-next');
    const bBack = document.getElementById('btn-wiz-prev');
    
    if (window.excelStep === 1) { 
        if(sub) sub.innerText = "ШАГ 1: ВЫБОР ИСТОЧНИКА ДАННЫХ (EXCEL)"; 
        if(bBack) bBack.style.visibility = 'hidden'; 
        if(bNext) { bNext.style.display = 'inline-flex'; bNext.disabled = !window.excelWorkbook; }
    }
    else if (window.excelStep === 2) { 
        if(sub) sub.innerText = "ШАГ 2: СОПОСТАВЛЕНИЕ ПОЛЕЙ (MAPPING)"; 
        if(bBack) bBack.style.visibility = 'visible'; 
        if(bNext) { bNext.style.display = 'inline-flex'; bNext.disabled = false; }
        // Если данные уже есть — перерисовываем маппинг
        if (window.excelColumns && window.excelColumns.length > 0) window.prepareMappingUI();
    }
    else if (window.excelStep === 3) { 
        if(sub) sub.innerText = "ШАГ 3: КОНТРОЛЬ И АНАЛИЗ (ANALYSIS)"; 
        if(bBack) bBack.style.visibility = 'visible'; 
        if(bNext) { bNext.style.display = 'inline-flex'; bNext.disabled = false; }
        window.renderExcelPreview(); 
    }
    else if (window.excelStep === 4) { 
        if(sub) sub.innerText = "ШАГ 4: ВЫПОЛНЕНИЕ ПАКЕТНОГО ИМПОРТА"; 
        if(bNext) bNext.style.display = 'none'; 
        if(bBack) bBack.style.display = 'none';
        // Показываем idle-состояние, сбрасываем active/done
        const idle = document.getElementById('wiz-progress-idle');
        const active = document.getElementById('wiz-progress-active');
        const done = document.getElementById('wiz-progress-done');
        if(idle) idle.style.display = 'block';
        if(active) active.style.display = 'none';
        if(done) done.style.display = 'none';
        const bar = document.getElementById('excel-progress-bar');
        if(bar) bar.style.width = '0%';
    }
};

window.excelWizNext = function() { 
    if (window.excelStep < 3) { 
        window.excelStep++; 
        window.updateWizardUI(); 
    } else { 
        window.excelStep++; 
        window.updateWizardUI(); 
        window.processImport(); 
    } 
};

window.excelWizBack = function() { if (window.excelStep > 1) { window.excelStep--; window.updateWizardUI(); } };

window.handleExcelFile = function(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    
    // Сброс кнопки «Назад» на шаге 4 при новом файле
    const bBack = document.getElementById('btn-wiz-prev');
    if(bBack) bBack.style.display = 'inline-flex';
    
    window.showToast('Анализ документа...', 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const d = new Uint8Array(e.target.result);
            window.excelWorkbook = XLSX.read(d, { type: 'array' });
            const sheets = window.excelWorkbook.SheetNames;
            
            const sel = document.getElementById('excel-sheet-select'); 
            if (sel) {
                sel.innerHTML = sheets.map(s => `<option value="${s}">${s}</option>`).join('');
                sel.value = sheets[0];
            }

            // Показываем инфо о загруженном файле
            const infoBox = document.getElementById('excel-file-info');
            const fileName = document.getElementById('excel-file-name');
            const fileInfoText = document.getElementById('excel-file-info-text');
            if (infoBox) infoBox.classList.remove('hidden');
            if (fileName) fileName.innerText = file.name;
            if (fileInfoText) fileInfoText.innerText = `${sheets.length} лист(а/ов) • ${(file.size / 1024).toFixed(1)} КБ`;

            window.selectExcelSheet(sheets[0], true);
            window.showToast(`Файл загружен: ${sheets.length} листов`, 'success');
        } catch (err) {
            console.error("Excel Read Error:", err);
            window.showToast("Ошибка чтения файла: " + err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
};

window.selectExcelSheet = function(name, jump = false) {
    const ws = window.excelWorkbook.Sheets[name]; 
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length > 0) {
        // Умный поиск строки заголовка (ищем строку, где больше всего заполненных ячеек)
        let bestRowIdx = 0;
        let maxFilled = 0;
        for (let i = 0; i < Math.min(15, raw.length); i++) {
            const filled = raw[i].filter(c => c && String(c).trim() !== "").length;
            if (filled > maxFilled) {
                maxFilled = filled;
                bestRowIdx = i;
            }
        }
        
        window.excelColumns = raw[bestRowIdx] || [];
        window.excelData = raw.slice(bestRowIdx + 1);
        
        console.log(`Smart Header: Found at row ${bestRowIdx + 1} with ${maxFilled} cols`);
        
        // 🔥 УМНОЕ ОПРЕДЕЛЕНИЕ КАТЕГОРИИ ПО НАЗВАНИЮ ЛИСТА
        window.autoDetectCategoryFromSheet(name);
        
        window.prepareMappingUI();
        
        if (jump) {
            window.excelStep = 2;
            window.updateWizardUI();
            const nextBtn = document.getElementById('btn-wiz-next');
            if (nextBtn) nextBtn.disabled = false;
        }
    }
};

// 🔥 УМНОЕ ОПРЕДЕЛЕНИЕ КАТЕГОРИИ ПО НАЗВАНИЮ ЛИСТА EXCEL
window.autoDetectCategoryFromSheet = function(sheetName) {
    const cleanName = sheetName.toLowerCase().trim();
    console.log(`🔍 Авто-категория: ищем по названию "${sheetName}"`);
    
    // Словарь синонимов категорий
    const categorySynonyms = {
        'paltsy': ['пальцы', 'paltsy', 'palts', 'палец'],
        'zagotovki': ['заготовки', 'zagotovki', 'заготовка', 'blanks'],
        'transportery': ['транспортеры', 'transportery', 'конвейеры', 'conveyor'],
        'roliki': ['ролики', 'roliki', 'роликовый', 'rollers'],
        'remni': ['ремни', 'remni', 'ремень', 'belts'],
        'metizy': ['метизы', 'metizy', 'крепёж', 'fasteners'],
        'oborudovanie': ['оборудование', 'oborudovanie', 'equipment'],
        'instrumenty': ['инструменты', 'instrumenty', 'tools'],
        'prutki': ['прутки', 'prutki', 'пруток', 'rods'],
        'zamki': ['замки', 'zamki', 'locks'],
        'skoby': ['скобы', 'skoby', 'brackets'],
    };

    // Ищем совпадение в категориях
    let bestMatch = null;
    let bestScore = 0;
    
    window.dbCategories.forEach(cat => {
        const catNameLower = cat.name.toLowerCase();
        let score = 0;
        
        // Прямое совпадение
        if (catNameLower === cleanName) score = 100;
        // Содержит название категории
        else if (catNameLower.includes(cleanName)) score = 80;
        // Название листа содержит синоним категории
        else if (categorySynonyms[catNameLower]) {
            for (let syn of categorySynonyms[catNameLower]) {
                if (cleanName.includes(syn)) {
                    score = 70;
                    break;
                }
            }
        }
        
        // Проверяем синонимы для названия листа
        for (let [catKey, synonyms] of Object.entries(categorySynonyms)) {
            if (synonyms.includes(cleanName) || synonyms.some(s => cleanName.includes(s))) {
                // Нашли категорию по синониму
                const foundCat = window.dbCategories.find(c => c.name.toLowerCase().includes(catKey));
                if (foundCat && score < 75) score = 75;
            }
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = cat.id;
        }
    });
    
    // Устанавливаем категорию если найдено совпадение
    if (bestMatch && bestScore >= 70) {
        const catSel = document.getElementById('excel-target-category');
        if (catSel) {
            catSel.value = bestMatch;
            console.log(`✅ Категория найдена: ${window.dbCategories.find(c => c.id === bestMatch)?.name} (совпадение ${bestScore}%)`);
            window.showToast(`📂 Категория определена: ${window.dbCategories.find(c => c.id === bestMatch)?.name}`, 'success');
        }
    } else {
        console.log(`⚠️ Категория не найдена (лучшее совпадение: ${bestScore}%)`);
    }
};

window.prepareMappingUI = function() {
    console.log("PRUTKON: Preparing Mapping UI for " + (window.excelColumns ? window.excelColumns.length : 0) + " columns.");
    const cont = document.getElementById('mappings-container');
    if (!cont) { console.error("CRITICAL: mappings-container NOT FOUND!"); return; }
    
    if (!window.excelColumns || window.excelColumns.length === 0) {
        cont.innerHTML = '<div class="table-empty">Ошибка: Данные колонок не найдены.</div>';
        return;
    }

    // Словарь автоопределения — более специфичные поля должны стоять раньше!
    // 🔥 БАЗОВЫЕ поля (всегда доступны)
    const baseFields = {
        'photo_filename': ['photo_filename', 'photo filename', 'filename', 'имя файла', 'img_name', 'image name', 'фото файл', 'фото имя'],
        'photo_path':     ['photo_path', 'photo path', 'image path', 'img path', 'путь к фото', 'папка фото', 'фото путь'],
        'art':            ['артикул', 'код товара', 'код-артикул', 'article', 'арт.', 'sku', 'item no', 'код', 'номер'],
        'price':          ['цена с ндс', 'цена без ндс', 'цена', 'стоимость', 'price', 'прайс', 'сумма', 'руб', 'cost'],
        'stock':          ['остаток', 'склад', 'количество', 'кол-во', 'stock', 'qty', 'штук', 'шт'],
        'name':           ['наименование', 'название', 'товар', 'имя товара', 'title', 'description', 'продукт', 'изделие'],
        'available':      ['доступен для заказа', 'доступен', 'available', 'есть в наличии'],
        'drawing':        ['чертеж', 'чертёж', 'drawing', 'схема', 'рисунок'],
        'tech_type':      ['тип техники', 'тип машины', 'tech type', 'тип оборудования'],
        'art_prutkon':    ['арт пруткон', 'код-артикул пруткон', 'prutkon', 'арт пк'],
        'art_all':        ['арт все', 'все артикулы', 'артикулы производителей'],
    };

    // 🔥 ПОЛЯ ИЗ СХЕМЫ КАТЕГОРИИ (динамические)
    const targetCatId = document.getElementById('excel-target-category')?.value;
    const targetCat = window.dbCategories.find(c => c.id === targetCatId);
    const bFields = ['art', 'name', 'price', 'stock', 'photo', 'id', 'category', 'history'];
    if (targetCat && targetCat.schema) {
        targetCat.schema.forEach(key => {
            if (bFields.includes(key)) return; // Пропускаем базовые
            if (baseFields[key]) return; // Уже есть в базовых
            const label = (window.priceSchemaFields[key] || key).toLowerCase();
            baseFields[key] = [label, key];
        });
        console.log('📋 Схема категории добавлена:', targetCat.schema);
    }

    window.importMappings = {};
    window.artSources = [];

    // Получаем превью данных (первые 3 непустые строки)
    const getPreview = (colIdx) => {
        const vals = [];
        for (let i = 0; i < window.excelData.length && vals.length < 3; i++) {
            const v = window.excelData[i] && window.excelData[i][colIdx];
            if (v !== undefined && v !== null && String(v).trim() !== '') vals.push(String(v).trim());
        }
        return vals;
    };

    // Детектор полей: сначала точное совпадение, затем включение, затем анализ данных
    const detectField = (colName, colIdx) => {
        const lower = colName.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();
        
        // Проход 1: точное совпадение или начинается с синонима
        for (let [field, synonyms] of Object.entries(baseFields)) {
            for (let s of synonyms) {
                if (lower === s || lower.startsWith(s + ' ') || lower.startsWith(s + '_')) return field;
            }
        }
        
        // Проход 2: синоним входит в название (только длинные синонимы от 4+ символов)
        for (let [field, synonyms] of Object.entries(baseFields)) {
            for (let s of synonyms) {
                if (s.length >= 4 && lower.includes(s)) return field;
            }
        }
        
        // Проход 3: анализ данных колонки (если есть превью)
        const preview = getPreview(colIdx);
        if (preview.length > 0) {
            // Проверяем первые 3 значения
            for (let val of preview) {
                const v = String(val).toLowerCase();
                // Если содержит 'extracted_xlsx' — это photo_path
                if (v.includes('extracted_xlsx') || v.includes('extracted')) {
                    return 'photo_path';
                }
                // Если заканчивается на .png/.jpg/.jpeg — это photo_filename
                if (/\.(png|jpg|jpeg|gif|webp)$/i.test(val)) {
                    return 'photo_filename';
                }
                // Если похоже на путь Windows (C:\...) — это photo_path
                if (/^[a-z]:\\/i.test(val) || val.includes('\\') && val.includes('extracted')) {
                    return 'photo_path';
                }
            }
        }
        
        return '';
    };

    // Применяем автоопределение
    window.excelColumns.forEach((colName, colIdx) => {
        const cleanIdx = String(colIdx);
        const nameParsed = (colName || 'Колонка ' + (colIdx + 1)).toString().trim();
        const field = detectField(nameParsed, colIdx);
        console.log(`🔍 COL[${colIdx}] "${nameParsed}" → "${field}"`);
        if (field === 'art') {
            window.artSources.push(cleanIdx);
        } else if (field) {
            window.importMappings[field] = cleanIdx;
        }
    });

    // 🔥 Автолог для проверки
    console.log('📊 MAPPING AUTO:', {
        art: window.artSources,
        photo_filename: window.importMappings['photo_filename'],
        photo_path: window.importMappings['photo_path'],
        all: window.importMappings
    });

    // 🔔 Визуальное уведомление если фото найдены
    if (window.importMappings['photo_filename'] || window.importMappings['photo_path']) {
        console.log('✅ ФОТО-ПОЛЯ НАЙДЕНЫ!');
        window.showToast('📸 Фото-поля распознаны автоматически!', 'success');
    }

    // Опции для выпадашки — базовые + из схемы категории
    const fieldOptions = [
        { val: '',               label: '— Пропустить —' },
        { val: 'art',            label: '🔑 АРТИКУЛ (обязательно)' },
        { val: 'name',           label: '📝 НАИМЕНОВАНИЕ' },
        { val: 'price',          label: '💰 ЦЕНА' },
        { val: 'stock',          label: '📦 ОСТАТОК' },
        { val: 'photo_filename', label: '🖼 ФОТО — имя файла' },
        { val: 'photo_path',     label: '📁 ФОТО — папка (путь)' },
    ];
    // 🔥 Добавляем поля из схемы категории
    if (targetCat && targetCat.schema) {
        const icons = { tech_type: '⚙', available: '✅', drawing: '📐', art_prutkon: '🏷', art_all: '🏷', stats: '📊', global: '🌐', user_name: '👤', blank_ref: '🔗' };
        targetCat.schema.forEach(key => {
            if (bFields.includes(key) || ['photo_filename', 'photo_path'].includes(key)) return;
            const icon = icons[key] || '📌';
            const label = window.priceSchemaFields[key] || key;
            fieldOptions.push({ val: key, label: `${icon} ${label}` });
        });
    }
    fieldOptions.push(
        { val: '_CUSTOM_',       label: '✏ Своё поле...' }
    );

    const makeSelect = (cleanIdx, selectedField) => {
        const opts = fieldOptions.map(o => `<option value="${o.val}" ${selectedField === o.val ? 'selected' : ''}>${o.label}</option>`).join('');
        return `<select class="map-select" data-col="${cleanIdx}" style="width:100%; height:30px; font-size:0.72rem; background:#0d0d1a; border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; padding:0 6px;" onchange="window.handleMappingChange('${cleanIdx}', this)">${opts}</select>`;
    };

    // Строим компактную таблицу
    let rows = window.excelColumns.map((colName, colIdx) => {
        const cleanIdx = String(colIdx);
        const nameParsed = (colName || 'Колонка ' + (colIdx + 1)).toString().trim();
        const isArt = window.artSources.includes(cleanIdx);
        const selectedField = isArt ? 'art' : (Object.entries(window.importMappings).find(([k, v]) => v === cleanIdx)?.[0] || '');
        const preview = getPreview(colIdx);
        const isMapped = !!selectedField;
        const rowBg = isMapped ? 'rgba(226,31,38,0.06)' : 'transparent';
        const rowBorder = isMapped ? 'border-left: 3px solid var(--brand-red);' : 'border-left: 3px solid transparent;';

        // Превью — если это фото, показываем иконку или имя файла
        const isPhotoCol = selectedField === 'photo_filename' || selectedField === 'photo_path';
        let previewHtml = '';
        if (isPhotoCol && preview.length > 0) {
            // Пробуем отобразить превью фото
            previewHtml = preview.map(v => {
                const raw = String(v);
                // Нормализуем путь для превью
                const normalized = raw.replace(/\\/g, '/');
                // Извлекаем только имя файла для превью
                const fname = normalized.split('/').pop().trim();
                
                if (selectedField === 'photo_filename') {
                    // Для имени файла — показываем только имя
                    const ext = fname.split('.').pop().toLowerCase();
                    if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
                        // Показываем миниатюру с fallback
                        return `<img src="extracted_xlsx/Paltsyi/${fname}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'" style="width:28px;height:28px;object-fit:cover;border-radius:4px;border:1px solid rgba(255,255,255,0.1);">
                                <span style="display:none; opacity:0.4; font-size:0.65rem; font-family:monospace;">${fname.substring(0,20)}</span>`;
                    }
                    return `<span style="opacity:0.4; font-size:0.65rem; font-family:monospace;">${fname.substring(0,20)}</span>`;
                } else if (selectedField === 'photo_path') {
                    // Для пути — показываем относительный путь от extracted_xlsx
                    const markerIdx = normalized.toLowerCase().indexOf('extracted_xlsx');
                    let relPath = markerIdx >= 0 ? normalized.substring(markerIdx) : fname;
                    return `<span style="opacity:0.5; font-size:0.6rem; font-family:monospace; color:var(--accent-blue);">📁 ${relPath.substring(0,30)}</span>`;
                }
                return `<span style="opacity:0.4; font-size:0.65rem; font-family:monospace;">${fname.substring(0,20)}</span>`;
            }).join('<br>');
        } else {
            previewHtml = preview.map(v => `<span style="opacity:0.5; font-size:0.68rem; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;">${String(v).substring(0,25)}</span>`).join('<br>');
        }

        return `<tr style="background:${rowBg}; ${rowBorder} transition:background 0.15s;">
            <td style="padding:8px 10px; color:var(--text-muted); font-size:0.68rem; font-weight:700; white-space:nowrap; width:60px;">${colIdx + 1}</td>
            <td style="padding:8px 10px; font-weight:700; font-size:0.8rem; max-width:160px;">${nameParsed}</td>
            <td style="padding:8px 10px; min-width:130px;">${previewHtml || '<span style="opacity:0.2;font-size:0.68rem;">нет данных</span>'}</td>
            <td style="padding:8px 10px; width:220px;">${makeSelect(cleanIdx, selectedField)}</td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
        <div style="overflow-x:auto; overflow-y:auto; max-height:calc(60vh - 40px); border-radius:12px; border:1px solid rgba(255,255,255,0.07);">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                    <tr style="position:sticky; top:0; background:#0a0a14; z-index:5;">
                        <th style="padding:10px; text-align:left; font-size:0.65rem; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.08); width:60px;">#</th>
                        <th style="padding:10px; text-align:left; font-size:0.65rem; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.08);">Колонка Excel</th>
                        <th style="padding:10px; text-align:left; font-size:0.65rem; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.08);">Пример данных</th>
                        <th style="padding:10px; text-align:left; font-size:0.65rem; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.08); width:220px;">Назначить поле</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;

    window.updateMappingSummary();
};

// Обработчик изменения маппинга
window.handleMappingChange = function(idx, selectEl) {
    let field = selectEl.value;
    // Если выбрано «Своё поле» — спросить название
    if (field === '_CUSTOM_') {
        const customName = prompt('Название характеристики (например: Диаметр, Длина, Тип):');
        if (customName && customName.trim()) {
            field = 'DYNAMIC_' + customName.trim();
            // Добавляем в select как новую опцию
            const opt = document.createElement('option');
            opt.value = field;
            opt.text = '✏ ' + customName.trim();
            opt.selected = true;
            selectEl.insertBefore(opt, selectEl.lastElementChild);
        } else {
            selectEl.value = '';
            field = '';
        }
    }
    window.updateImportMapping(idx, field);
    // Обновляем стиль строки
    const row = selectEl.closest('tr');
    if (row) {
        row.style.background = field ? 'rgba(226,31,38,0.06)' : 'transparent';
        row.style.borderLeft = field ? '3px solid var(--brand-red)' : '3px solid transparent';
    }
    window.updateMappingSummary();
};

window.updateMappingSummary = () => {
    const sum = document.getElementById('mapping-summary');
    if (!sum) return;
    const artCount = window.artSources.length;
    const mapped = Object.keys(window.importMappings).filter(k => !k.startsWith('_'));
    const hasPhotoFile = window.importMappings['photo_filename'];
    const hasPhotoPath = window.importMappings['photo_path'];
    const total = artCount + mapped.length;
    const artOk = artCount > 0;
    
    let photoStatus = '';
    if (hasPhotoFile && hasPhotoPath) {
        photoStatus = '<div style="font-size:0.7rem; color:var(--emerald-neon); margin-top:6px;">🖼 <b>Фото: ПОЛНАЯ НАСТРОЙКА</b> (папка + имя файла)</div>';
    } else if (hasPhotoFile) {
        photoStatus = '<div style="font-size:0.7rem; color:var(--accent-blue); margin-top:6px;">🖼 Фото: только имя файла (папка по умолчанию)</div>';
    } else if (hasPhotoPath) {
        photoStatus = '<div style="font-size:0.7rem; color:var(--accent-blue); margin-top:6px;">🖼 Фото: только папка</div>';
    } else {
        photoStatus = '<div style="font-size:0.7rem; opacity:0.4; margin-top:6px;">🖼 Фото: не назначено</div>';
    }
    
    sum.innerHTML = `
        <div style="font-size:0.72rem; margin-bottom:8px;">
            <span style="color:${artOk ? 'var(--emerald-neon)' : 'var(--brand-red)'}; font-weight:800;">
                ${artOk ? '✅' : '❌'} АРТИКУЛ: ${artOk ? window.artSources.length + ' кол.' : 'не назначен!'}
            </span>
        </div>
        <div style="font-size:0.72rem; margin-bottom:8px; opacity:0.8;">
            📋 Всего привязано: <b>${total}</b> полей
        </div>
        ${photoStatus}
        <div style="font-size:0.65rem; opacity:0.5; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
            💡 Для загрузки фото назначьте:<br>
            • <b>Photo_Filename</b> — имя файла (например: 12345.jpg)<br>
            • <b>Photo_Path</b> — папка (например: extracted_xlsx/Paltsyi)
        </div>
    `;
};

window.updateImportMapping = function(idx, field) {
    // Очищаем старые привязки для этого индекса
    for (let key in window.importMappings) {
        if (window.importMappings[key] === idx) delete window.importMappings[key];
    }
    window.artSources = window.artSources.filter(i => i !== idx);

    if (field === 'art') {
        window.artSources.push(idx);
    } else if (field && field !== '_CUSTOM_') {
        window.importMappings[field] = idx;
    }
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
    
    if (!target) {
        window.showToast('Выберите целевую категорию!', 'error');
        window.excelStep = 1;
        window.updateWizardUI();
        return;
    }
    if (!window.artSources || window.artSources.length === 0) {
        window.showToast('Не назначена колонка АРТИКУЛ! Вернитесь на шаг 2.', 'error');
        window.excelStep = 2;
        window.updateWizardUI();
        return;
    }
    
    const targetCatObj = window.dbCategories.find(c => c.id === target);
    const catName = targetCatObj ? targetCatObj.name : "Без категории";

    // Переключаем блоки
    const idleBlock = document.getElementById('wiz-progress-idle');
    const activeBlock = document.getElementById('wiz-progress-active');
    const doneBlock = document.getElementById('wiz-progress-done');
    if(idleBlock) idleBlock.style.display = 'none';
    if(activeBlock) activeBlock.style.display = 'block';
    if(doneBlock) doneBlock.style.display = 'none';

    const progBar = document.getElementById('excel-progress-bar');
    const logCont = document.getElementById('excel-log-container');
    const statusText = document.getElementById('wiz-processed-count');
    const progText = document.getElementById('excel-progress-text');

    if (logCont) logCont.innerHTML = '<div>🚀 Запуск универсального импорта...</div>';

    // ВЫЗОВ ЕДИНОГО ДВИЖКА ИЗ CORE.JS
    const imported = await window.runUniversalImport({
        data: window.excelData,
        mappings: window.importMappings,
        artSources: window.artSources,
        targetCategory: target,
        categoryName: catName,
        options: {
            splitActive: splitActive,
            nameFallback: nameFallback,
            idPrefix: 'P-',
            moduleName: "Excel Импорт (Заготовки)"
        },
        onProgress: (i, total, addedCount, msg, type) => {
            const pct = Math.round((i / Math.max(total - 1, 1)) * 100);
            if (progBar) progBar.style.width = pct + '%';
            if (progText) progText.innerText = pct + '%';
            if (statusText) statusText.innerText = `Обработано строк: ${i + 1} из ${total}`;
            
            if (logCont) {
                if (type === 'error') {
                    const div = document.createElement('div');
                    div.style.color = 'var(--brand-red)';
                    div.innerText = `❌ ${msg}`;
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
        for (const item of imported) window.dbProducts.push(item);
        
        window.saveAllToLocal();
        if (window.fbPush) await window.fbPush();
        
        window.renderPriceTable();
        if(activeBlock) activeBlock.style.display = 'none';
        if(doneBlock) doneBlock.style.display = 'block';
        const statsEl = document.getElementById('wiz-final-stats');
        if(statsEl) statsEl.innerText = `Успешно добавлено ${imported.length} новых позиций в раздел "${catName}" (пустые строки пропущены)`;
        
        if (window.showToast) window.showToast(`Импорт завершен: +${imported.length}`, 'success');
    } else {
        if(activeBlock) activeBlock.style.display = 'none';
        if(idleBlock) idleBlock.style.display = 'block';
        window.showToast("Данные не найдены. Проверьте маппинг артикулов.", 'error');
        window.excelStep = 2;
        window.updateWizardUI();
    }
};

window.renderExcelPreview = function() {
    const t = document.getElementById('excel-preview-table');
    if (!t || !window.excelData || !window.excelColumns) return;
    
    const head = window.excelColumns.slice(0,10).map(c => `<th>${c || '---'}</th>`).join('');
    const body = window.excelData.slice(0,10).map(r => {
        if (!r) return '';
        return `<tr>${r.slice(0,10).map(c => `<td>${c || ''}</td>`).join('')}</tr>`;
    }).join('');

    t.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
};

window.startAddWizard = function() {
    window.addStep = 1; 
    const m = document.getElementById('add-master-modal');
    if (m) { 
        const catSelect = document.getElementById('add-category');
        if (catSelect && window.activeCategory && window.activeCategory !== 'all') {
            catSelect.value = window.activeCategory;
        }
        m.classList.add('active'); 
        window.updateAddWizardUI(); 
    }
    const dl = document.getElementById('existing-names');
    if (dl) {
        const names = [...new Set(window.dbProducts.map(p => p && p.name).filter(Boolean))];
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

    const sub = document.getElementById('add-wizard-subtitle');
    if (window.addStep === 1) {
        if(sub) sub.innerText = "ШАГ 1: БАЗОВАЯ ИНФОРМАЦИЯ";
    } else if (window.addStep === 2) {
        if(sub) sub.innerText = "ШАГ 2: КАТЕГОРИЙНЫЕ ПАРАМЕТРЫ";
        const catId = document.getElementById('add-category').value;
        const cat = window.dbCategories.find(c => c.id === catId);
        const cont = document.getElementById('add-dynamic-fields');
        if (cont) {
            if (cat && cat.schema && cat.schema.length > 0) {
                cont.innerHTML = cat.schema.map(key => {
                    if (key === 'stock' || key === 'photo') return ''; // These are handle separately usually, but let's make them part of schema
                    const label = window.priceSchemaFields[key] || key;
                    
                    // Собираем уникальные значения для этого поля
                    const uniqueValues = [...new Set(window.dbProducts.map(p => p && p[key]).filter(Boolean))];
                    let datalistHtml = '';
                    let listAttr = '';
                    if (uniqueValues.length > 0) {
                        const listId = `dl-wiz-${key}`;
                        datalistHtml = `<datalist id="${listId}">${uniqueValues.map(v => `<option value="${String(v).replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                        listAttr = `list="${listId}"`;
                    }
                    
                    return `
                        <div class="form-group">
                            <label>${label}</label>
                            ${datalistHtml}
                            <input type="text" class="form-control add-dynamic-input" data-key="${key}" ${listAttr} placeholder="Выберите или введите ${label.toLowerCase()}...">
                        </div>
                    `;
                }).join('');
            } else {
                cont.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:0.8rem; padding:30px;">В этой категории нет дополнительных параметров</div>';
            }
        }
    } else if (window.addStep === 3) {
        if(sub) sub.innerText = "ШАГ 3: ИТОГОВЫЙ КОНТРОЛЬ";
        window.renderAddSummary();
    }
    
    const bPrev = document.getElementById('btn-add-prev');
    const bNext = document.getElementById('btn-add-next');
    if(bPrev) bPrev.style.visibility = window.addStep === 1 ? 'hidden' : 'visible';
    if(bNext) bNext.innerHTML = window.addStep === 3 ? '<i class="fa-solid fa-check"></i> Сохранить' : 'Далее <i class="fa-solid fa-chevron-right"></i>';
};
window.addWizNext = function() { if (window.addStep < 3) { window.addStep++; window.updateAddWizardUI(); } else window.saveAddMaster(); };
window.addWizBack = function() { if (window.addStep > 1) { window.addStep--; window.updateAddWizardUI(); } };
window.renderAddSummary = function() {
    const name = document.getElementById('add-name')?.value || "...";
    const art = document.getElementById('add-art')?.value || "...";
    const price = document.getElementById('add-price')?.value || "0";
    if(document.getElementById('sum-name')) document.getElementById('sum-name').innerText = name;
    if(document.getElementById('sum-art')) document.getElementById('sum-art').innerText = "АРТ: " + art;
    if(document.getElementById('sum-price')) document.getElementById('sum-price').innerText = price + " ₽";
};
window.saveAddMaster = function() {
    const art = document.getElementById('add-art').value.trim();
    if (!art) {
        alert('Артикул обязателен для заполнения!');
        return;
    }
    const exists = window.dbProducts.find(p => p && p.art === art);
    if (exists) {
        alert('Ошибка: Товар с артикулом ' + art + ' уже существует! Используйте поиск дубликатов.');
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
        history: [{ time: new Date().toLocaleString(), user: userName, action: "Карточка создана вручную" }]
    };

    // Collect dynamic fields
    document.querySelectorAll('.add-dynamic-input').forEach(input => {
        const key = input.dataset.key;
        if (key) p[key] = input.value;
    });
    window.dbProducts.push(p); 
    if (window.logAudit) window.logAudit('INFO', `Добавлен товар ${p.art}`, 'Прайс');
    if (window.fbPush) window.fbPush(); 
    window.renderPriceTable();
    window.closeAddMaster();
};

window.cleanupEmptyRows = function() { document.getElementById('cleanup-modal')?.classList.add('active'); };
window.startFinalCleanup = async function() {
    window.confirmAction("Глобальная очистка", "Удалить все пустые записи и заглушки?", async () => {
        const initial = window.dbProducts.length;
        window.dbProducts = window.dbProducts.filter(p => p && p.art && p.art !== "---" && p.name && p.name !== "Без названия");
        if (window.fbPush) await window.fbPush(); window.renderPriceTable();
        document.getElementById('cleanup-modal').classList.remove('active');
        if (window.showToast) window.showToast(`Удалено ${initial - window.dbProducts.length} записей`, 'success');
    });
};

window.showDuplicateFinder = function() { document.getElementById('duplicate-modal')?.classList.add('active'); };
window.scanForDuplicates = function() {
    const counts = {}; window.dbProducts.forEach(p => { if (p && p.art) counts[p.art] = (counts[p.art] || 0) + 1; });
    const dups = Object.keys(counts).filter(a => counts[a] > 1);
    const cont = document.getElementById('duplicate-content');
    if (!cont) return;
    if (dups.length === 0) cont.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5;">Дубликатов не найдено</div>';
    else cont.innerHTML = dups.map(a => `<div style="padding:10px; background:rgba(255,255,255,0.02); margin-bottom:5px; border-radius:10px;">${a} (${counts[a]} повтора)</div>`).join('');
};

window.manageCategories = function() { 
    document.getElementById('category-modal')?.classList.add('active'); 
    window.resetCategoryForm();
    window.renderCategoriesList(); 
};
window.closeCategoryModal = function() { document.getElementById('category-modal')?.classList.remove('active'); };

window.resetCategoryForm = function() {
    window.editingCatId = null;
    if (document.getElementById('cat-name-input')) document.getElementById('cat-name-input').value = '';
    
    const sel = document.getElementById('cat-parent-select');
    if (sel) {
        sel.innerHTML = '<option value="null">-- Корневой раздел --</option>' + 
            window.dbCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        sel.value = 'null';
    }
};

window.saveCategoryAction = function() {
    const name = document.getElementById('cat-name-input').value.trim();
    let parent = document.getElementById('cat-parent-select').value;
    if (parent === 'null') parent = null;
    
    if (!name) return window.showToast('Введите название!', 'error');

    if (window.editingCatId) {
        const cat = window.dbCategories.find(c => c.id === window.editingCatId);
        if (cat) {
            cat.name = name;
            cat.parent = parent;
        }
    } else {
        const newId = 'cat_' + Date.now().toString(36);
        window.dbCategories.push({ 
            id: newId, 
            name: name, 
            parent: parent, 
            schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'art_all', 'stats', 'stock', 'global'] 
        });
    }
    
    window.saveAllToLocal();
    if (window.fbPush) window.fbPush();
    window.renderCategoriesList();
    window.loadCategories();
    window.updateExcelCatSelect();
    window.resetCategoryForm();
    window.showToast('Категории обновлены', 'success');
};
    
window.editCategory = function(id) {
    const cat = window.dbCategories.find(c => c.id === id);
    if (!cat) return;
    window.editingCatId = id;
    document.getElementById('cat-name-input').value = cat.name;
    document.getElementById('cat-parent-select').value = cat.parent || 'null';
};

window.deleteCategory = function(id) {
    const hasChildren = window.dbCategories.some(c => c.parent === id);
    if (hasChildren) return alert('Сначала удалите или переместите подкатегории!');
    
    const count = window.dbProducts.filter(p => p.category === id).length;
    if (count > 0) return alert(`В этой категории ${count} товаров. Сначала переместите их!`);

    window.confirmAction('Удаление категории', `Вы действительно хотите удалить "${id}"?`, () => {
        window.dbCategories = window.dbCategories.filter(c => c.id !== id);
        window.saveAllToLocal();
        if (window.fbPush) window.fbPush();
        window.renderCategoriesList();
        window.loadCategories();
        window.updateExcelCatSelect();
    });
};

window.renderCategoriesList = function() {
    const list = document.getElementById('categories-list');
    if (!list) return;

    const renderLevel = (parentId, depth = 0) => {
        const children = window.dbCategories.filter(c => c.parent === parentId);
        return children.map(c => `
            <div class="cat-item" style="padding:10px; background:rgba(255,255,255,${0.05 + depth*0.05}); border-radius:8px; margin-left:${depth * 20}px; display:flex; justify-content:space-between; align-items:center;">
                <span class="text-xs">
                    ${depth > 0 ? '<i class="fa-solid fa-turn-up fa-rotate-90 opacity-30 mr-2"></i>' : ''}
                    <b>${c.name}</b> <small class="neutral ml-2">(${c.id})</small>
                </span>
                <div class="flex gap-1">
                    <button class="btn btn-secondary btn-xs" onclick="window.editCategory('${c.id}')"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-secondary btn-xs" onclick="window.deleteCategory('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            ${renderLevel(c.id, depth + 1)}
        `).join('');
    };

    list.innerHTML = renderLevel(null);
};

window.updateExcelCatSelect = function() {
    // Показываем только конечные категории (те, в которые можно класть товары)
    // Либо показываем всё, но папки помечаем disabled
    const getsPath = (catId) => {
        let path = [];
        let curr = window.dbCategories.find(c => c.id === catId);
        while (curr) {
            path.unshift(curr.name);
            curr = window.dbCategories.find(c => c.id === curr.parent);
        }
        return path.join(' > ');
    };

    const options = window.dbCategories.map(c => {
        const hasChildren = window.dbCategories.some(k => k.parent === c.id);
        const fullPath = getsPath(c.id);
        return `<option value="${c.id}" ${hasChildren ? 'disabled style="color:var(--text-muted);"' : ''}>${fullPath}</option>`;
    }).join('');

    ['excel-target-category', 'add-category', 'pc-category'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });
};

// ==========================================
// 3. INITIALIZATION LOOP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Prices OS: DOM Content Ready. Binding UI...");
    console.log("📊 DEBUG: dbCategories =", window.dbCategories?.length, "categories");
    console.log("📦 DEBUG: dbProducts =", window.dbProducts?.length, "products");
    console.log("🔍 DEBUG: activeCategory =", window.activeCategory);
    
    // ГЛОБАЛЬНЫЙ UI (НЕ УДАЛЯТЬ!)
    if (window.renderTopMenu) window.renderTopMenu();
    if (window.renderSidebar) window.renderSidebar();
    if (window.renderSystemFooter) window.renderSystemFooter();
    
    // Explicit sequence
    window.loadCategories();
    window.renderPriceTable();
    window.updateExcelCatSelect();
    
    // Deep URL check
    const p = new URLSearchParams(window.location.search);
    if (p.get('action') === 'add') setTimeout(() => window.startAddWizard(), 500);
    if (p.get('action') === 'import') setTimeout(() => window.openExcelImport(), 500);

    // Search link
    const searchInput = document.getElementById('price-search-input');
    if (searchInput) searchInput.oninput = (e) => { window.priceSearchQuery = e.target.value.toLowerCase().trim(); window.renderPriceTable(); };
    
    console.log("Prices OS v18.25.0 operational.");
});

// Sync handler
window.addEventListener('pricesSynced', () => { window.renderPriceTable(); });
