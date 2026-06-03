/* catalog.js - ПРУТКОН ERP Catalog / Engineering Registry (v28 - ULTIMATE STABILITY) */

console.log("Catalog module loading...");

if (!window.catalogCategories || !Array.isArray(window.catalogCategories) || window.catalogCategories.length === 0) {
    window.catalogCategories = [{id:'models', name:'Каталог моделей техники'}];
}
if (!window.catalogData || !Array.isArray(window.catalogData)) window.catalogData = [];

window.activeCat = 'models';
window.catExcelWorkbook = null;
window.catExcelCols = [];
window.catExcelData = [];
window.catMappings = {};
window.catSearchQuery = "";
window.selectedCatIds = [];

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("Catalog DOM Content Loaded");
    window.renderCatalogTabs();
    window.renderCatalogTable();
    window.updateCatExcelCatSelect();
    
    // Перехват параметров из системного верхнего меню
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add') setTimeout(() => window.startCatalogAddWizard(), 300);
    if (params.get('action') === 'import') setTimeout(() => window.openCatalogExcelImport(), 300);

    // Подключаем поиск по ID элемента
    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            window.catSearchQuery = e.target.value.toLowerCase().trim();
            window.renderCatalogTable();
        };
    }
});

window.addEventListener('catalogSynced', () => {
    console.log("Catalog sync event received");
    window.renderCatalogTabs();
    window.renderCatalogTable();
});

// === ТАБЫ И РАЗДЕЛЫ ===
window.renderCatalogTabs = function() {
    const tabsCont = document.getElementById('catalog-tabs');
    if (!tabsCont) return;
    tabsCont.innerHTML = window.catalogCategories.map(cat => `
        <button class="btn btn-secondary btn-sm ${window.activeCat === cat.id ? 'active' : ''}" 
                style="margin-right:8px; margin-bottom:8px;"
                onclick="window.switchCat('${cat.id}')">${cat.name}</button>`).join('');

    const title = document.getElementById('catalog-title');
    const activeObj = window.catalogCategories.find(c => c.id === window.activeCat);
    if (title && activeObj) title.innerText = activeObj.name;
};

window.switchCat = function(id) {
    window.activeCat = id;
    const fBar = document.getElementById('dynamic-cat-filters');
    if (fBar) delete fBar.dataset.init;

    window.selectedCatIds = [];
    window.renderCatalogTabs();
    window.renderCatalogTable();
};

window.refreshCatalog = function() {
    window.renderCatalogTable();
    if (window.showToast) window.showToast('Реестр обновлен', 'info');
};

// === ТАБЛИЦА РЕЕСТРА ===
// === ТАБЛИЦА РЕЕСТРА С УНИВЕРСАЛЬНЫМИ ФИЛЬТРАМИ ===
window.renderCatalogTable = function() {
    // Гарантия массива
    if (!Array.isArray(window.catalogData)) {
        window.catalogData = Object.values(window.catalogData || {});
    }

    const tableCont = document.getElementById('catalog-table');
    if (!tableCont) return;
    
    // 1. Панель фильтров
    window.buildFiltersBarCat();

    // 2. Сбор активных фильтров
    // Синхронизация поискового запроса из поля (oninput в HTML не обновляет catSearchQuery)
    const si = document.getElementById('catalog-search-input');
    if (si) window.catSearchQuery = si.value.toLowerCase().trim();
    const activeFilters = {};
    document.querySelectorAll('.dynamic-filter-select-cat').forEach(sel => {
        if (sel.value) activeFilters[sel.dataset.key] = sel.value;
    });
    
    // 3. Фильтрация
    let filtered = window.catalogData.filter(item => {
        // Категория
        if (window.activeCat !== 'all' && item.category !== window.activeCat) return false;
        
        // Поиск
        if (window.catSearchQuery) {
            const match = (item.name && item.name.toLowerCase().includes(window.catSearchQuery)) || 
                          (item.art && item.art.toLowerCase().includes(window.catSearchQuery)) ||
                          (item.brand && item.brand.toLowerCase().includes(window.catSearchQuery));
            if (!match) return false;
        }

        // Динамические фильтры
        for (let key in activeFilters) {
            if (String(item[key]) !== String(activeFilters[key])) return false;
        }

        return true;
    });
    
    const baseFields = ['name', 'brand', 'type', 'art', 'photo', 'id', 'category', 'history', 'selected'];
    const extraFields = [...new Set(filtered.flatMap(item => Object.keys(item).filter(k => !baseFields.includes(k))))];
    
    let html = `<thead><tr>
        <th style="width:40px;"><input type="checkbox" id="selectAllCat" onchange="window.toggleSelectAllCatItems(this.checked)"></th>
        <th style="width:60px">Фото</th>
        <th style="width:140px">Артикул</th>
        <th>Наименование / Тэг</th>
        <th>Бренд / Раздел</th>`;
    extraFields.forEach(f => { html += `<th>${f}</th>`; });
    html += `<th style="width:120px">Действия</th></tr></thead><tbody>`;
    
    const svgPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iRm9udEF3ZXNvbWUiPvVrjwvdGV4dD48L3N2Zz4=';

    if (filtered.length === 0) {
        html += `<tr><td colspan="${extraFields.length + 6}" style="text-align:center; padding:80px; color:#555; font-style:italic;">Ничего не найдено</td></tr>`;
    } else {
        filtered.forEach(item => {
            const isSelected = window.selectedCatIds.includes(item.id.toString());
            const photoUrl = (item.photo && item.photo.trim().length > 5) ? item.photo : svgPlaceholder;
            
            html += `<tr class="${isSelected ? 'selected-row' : ''}">
                <td><input type="checkbox" class="cat-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''} onchange="window.toggleCatItemSelection('${item.id}', this.checked)"></td>
                <td><div style="width:40px; height:40px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.05); background:#000;">
                    <img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='${svgPlaceholder}'">
                </div></td>
                <td style="font-weight:700; color:#888;">${item.art || '---'}</td>
                <td style="font-weight:600; font-size:0.9rem;">${item.name || 'Не указано'}</td>
                <td>
                    <span style="opacity:0.6">${item.brand || '-'}</span> 
                    <span class="badge" style="margin-left:8px; opacity:0.8">${item.type || '-'}</span>
                </td>
                ${extraFields.map(f => `<td>${item[f] || '-'}</td>`).join('')}
                <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:5px;">
                        <button class="action-btn" onclick="window.showCatItemHistory('${item.id}')" title="Журнал" style="width:32px; height:32px;"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        <button class="action-btn" onclick="window.editCatalogItem('${item.id}')" title="Правка" style="width:32px; height:32px;"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn action-btn-danger" onclick="window.deleteCatalogItem('${item.id}')" title="Удалить" style="width:32px; height:32px;"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>`;
        });
    }
    tableCont.innerHTML = html + '</tbody>';

    // Массовая кнопка
    const massBtn = document.getElementById('cat-mass-delete-btn');
    if (massBtn) {
        massBtn.style.display = window.selectedCatIds.length > 0 ? 'inline-flex' : 'none';
        massBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Удалить выбранные (${window.selectedCatIds.length})`;
    }
};

window.toggleCatItemSelection = function(id, checked) {
    const sId = id.toString();
    if (checked) {
        if (!window.selectedCatIds.includes(sId)) window.selectedCatIds.push(sId);
    } else {
        window.selectedCatIds = window.selectedCatIds.filter(x => x !== sId);
    }
    window.renderCatalogTable();
};

window.toggleSelectAllCatItems = function(checked) {
    if (checked) {
        const visibleIds = document.querySelectorAll('.cat-checkbox');
        visibleIds.forEach(cb => {
            const id = cb.dataset.id.toString();
            if (!window.selectedCatIds.includes(id)) window.selectedCatIds.push(id);
        });
    } else {
        window.selectedCatIds = [];
    }
    window.renderCatalogTable();
};

window.deleteCatalogItem = function(id) {
    if (confirm('Удалить эту модель из справочника?')) {
        window.catalogData = window.catalogData.filter(item => item.id.toString() !== id.toString());
        if (window.showToast) window.showToast('Запись удалена', 'success');
        if (window.fbPush) window.fbPush();
        window.renderCatalogTable();
    }
};

window.massDeleteCatalogItems = function() {
    if (confirm(`Удалить выбранные записи (${window.selectedCatIds.length}шт)?`)) {
        window.catalogData = window.catalogData.filter(item => !window.selectedCatIds.includes(item.id.toString()));
        window.selectedCatIds = [];
        if (window.showToast) window.showToast('Записи удалены', 'success');
        if (window.fbPush) window.fbPush();
        window.renderCatalogTable();
    }
};

window.showCatItemHistory = function(id) {
    const item = window.catalogData.find(x => x.id == id || x.id.toString() === id.toString());
    if (!item) return;

    const modal = document.getElementById('cat-history-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('cat-history-details').innerHTML = `
            <div style="font-weight:700; color:#fff; font-size:1rem;">${item.name || '---'}</div>
            <div style="font-size:0.75rem; opacity:0.5; margin-top:5px;">Арт: ${item.art || '---'} | Бренд: ${item.brand || '---'}</div>
        `;

        const list = document.getElementById('cat-history-list');
        if (item.history && item.history.length > 0) {
            list.innerHTML = item.history.slice().reverse().map(h => {
                const userName = (h.user && typeof h.user === 'object') ? (h.user.name || 'N/A') : (h.user || 'Пользователь');
                return `
                <div style="padding:15px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                        <span style="font-weight:700; color:var(--neon-emerald); font-size:0.8rem;"><i class="fa-solid fa-user-gear"></i> ${userName}</span>
                        <span style="opacity:0.4; font-size:0.65rem;">${h.time}</span>
                    </div>
                    <div style="color:#eee; font-size:0.75rem; line-height:1.4;">${h.action}</div>
                </div>`;
            }).join('');
        } else {
            list.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.2;">Журнал пуст</div>';
        }
    }
};

window.buildFiltersBarCat = function() {
    const fBar = document.getElementById('dynamic-cat-filters');
    if (!fBar || fBar.dataset.init === 'true') return;

    // Собираем ключи конкретно из текущего раздела
    const currentItems = window.catalogData.filter(item => item.category === window.activeCat);
    if (currentItems.length === 0) { fBar.style.display = 'none'; return; }

    const baseFields = ['name', 'brand', 'type', 'art', 'photo', 'id', 'category', 'history'];
    const keys = new Set();
    currentItems.forEach(p => {
        Object.keys(p).forEach(k => { if (!baseFields.includes(k)) keys.add(k); });
    });

    if (keys.size === 0) { fBar.style.display = 'none'; return; }
    fBar.style.display = 'flex';
    fBar.innerHTML = '';

    keys.forEach(key => {
        const values = new Set();
        currentItems.forEach(p => { if (p[key]) values.add(p[key]); });
        
        const sel = document.createElement('select');
        sel.className = 'form-control dynamic-filter-select-cat';
        sel.style.width = 'auto'; sel.style.fontSize = '0.7rem'; sel.style.minWidth = '130px'; sel.style.height = '32px';
        sel.dataset.key = key;
        sel.onchange = () => window.renderCatalogTable();

        let options = `<option value="">Все: ${key}</option>`;
        Array.from(values).sort().forEach(v => { options += `<option value="${v}">${v}</option>`; });
        sel.innerHTML = options;
        fBar.appendChild(sel);
    });
    fBar.dataset.init = 'true';
};

// === ОЧИСТКА ВЕНИКОМ (FIXED) ===
window.cleanupEmptyCatalogRows = function() {
    console.log("Cleanup modal requested for Catalog...");
    const initial = window.catalogData.length;
    if (initial === 0) return window.showToast ? window.showToast('Справочник пуст', 'info') : alert('Пусто');
    
    const m = document.getElementById('cleanup-modal');
    if (!m) return alert("Broom modal mismatch in HTML");
    m.classList.add('active');
    
    document.getElementById('cleanup-step-1').style.display = 'block';
    document.getElementById('cleanup-step-2').style.display = 'none';
    document.getElementById('cleanup-step-3').style.display = 'none';
    
    document.getElementById('cleanup-desc').innerText = `В справочнике ${initial} записей. Веник удалит весь "мусор" и заглушки в названиях.`;
};

window.startFinalCatalogCleanup = async function() {
    console.log("Starting optimized registry cleanup with DUPLICATE MERGE...");
    
    const s1 = document.getElementById('cleanup-step-1');
    const s2 = document.getElementById('cleanup-step-2');
    const s3 = document.getElementById('cleanup-step-3');
    if (!s1 || !s2 || !s3) return alert("UI Mismatch");

    s1.style.display = 'none';
    s2.style.display = 'block';
    
    const status = document.getElementById('cleanup-status-text');
    const pBar = document.getElementById('cleanup-progress-bar');
    const log = document.getElementById('cleanup-log');
    
    if (!Array.isArray(window.catalogData)) {
        window.catalogData = Object.values(window.catalogData || {});
    }

    let scanned = 0;
    let trashed = 0;
    let merged = 0;
    const initialCount = window.catalogData.length;
    
    const uniqueMap = new Map();

    log.innerHTML = "<div>💾 Склейка данных и анализ...</div>";
    
    try {
        for (let i = 0; i < initialCount; i++) {
            const item = window.catalogData[i];
            if (!item) continue;
            scanned++;
            
            const name = (item.name || "").toString().trim();
            const art = (item.art || "").toString().trim();
            const brand = (item.brand || "").toString().trim();

            const nameKey = name.toLowerCase();
            const artKey = art.toLowerCase();

            // 1. УДАЛЕНИЕ МУСОРА
            const isBadName = !name || nameKey==="" || nameKey==="не указано" || nameKey==="не заполнено" || nameKey==="безымянный" || nameKey==="безымянный элемент" || nameKey==="---";
            const isBadArt = !art || artKey==="" || artKey==="---" || artKey==="код";
            const isBadBrand = !brand || brand.toLowerCase()==="" || brand.toLowerCase()==="---" || brand.toLowerCase()==="бренд";

            if (isBadName && isBadArt && isBadBrand) {
                trashed++;
                if (trashed % 20 === 0 || trashed < 5) {
                    const d = document.createElement('div');
                    d.innerText = `[🗑️] Мусорная запись #${i+1}`;
                    log.appendChild(d); log.scrollTop = log.scrollHeight;
                }
                continue;
            }

            // 2. СЛИЯНИЕ ДУБЛЕЙ
            const masterKey = (artKey && artKey !== "---" && artKey !== "не указано") ? artKey : `CATNAME_${nameKey}`;

            if (uniqueMap.has(masterKey)) {
                merged++;
                const existing = uniqueMap.get(masterKey);
                
                // МЕРДЖ: Объединение характеристик и истории
                if (!Array.isArray(existing.history)) existing.history = [];
                const user = window.currentUser || "Система";
                const now = new Date().toLocaleString('ru-RU');
                existing.history.push({ 
                    time: now, 
                    user: user, 
                    action: `Слияние с дубликатом [${art || name}] при генеральной очистке справочника` 
                });
                
                Object.keys(item).forEach(key => {
                    if (!['id', 'category', 'history'].includes(key)) {
                        if (!existing[key] && item[key]) existing[key] = item[key];
                    }
                });

                if (merged % 30 === 0) {
                    const md = document.createElement('div');
                    md.innerText = `[🔗] Найдена копия: ${art || name}`; md.style.color = "var(--neon-emerald)";
                    log.appendChild(md);
                }
            } else {
                uniqueMap.set(masterKey, item);
            }

            // UI
            if (i % 120 === 0 || i === initialCount - 1) {
                const pct = initialCount > 0 ? Math.round((i / (initialCount - 1)) * 100) : 100;
                pBar.style.width = pct + "%";
                status.innerText = `Проверка записей: ${i + 1} / ${initialCount}`;
                await new Promise(r => requestAnimationFrame(r));
            }
        }

        // ПРИМЕНЕНИЕ
        window.catalogData = Array.from(uniqueMap.values());
        window.renderCatalogTable();
        if (window.fbPush) window.fbPush();

        // ФИНАЛ
        s2.style.display = 'none';
        s3.style.display = 'block';
        document.getElementById('cleanup-final-report').innerHTML = `
            <div style="color:var(--neon-emerald); font-weight:700;">Реестр успешно оптимизирован!</div>
            <div style="font-size:0.8rem; margin-top:10px; opacity:0.8; line-height:1.6;">
                Всего просмотрено: ${scanned}<br>
                Удалено пустот: ${trashed}<br>
                Объединено дублей: ${merged}<br>
                <strong>Осталось в реестре: ${window.catalogData.length}</strong>
            </div>`;
    } catch (e) {
        console.error(e);
        alert("Ошибка слияния справочника");
        document.getElementById('cleanup-modal').classList.remove('active');
    }
};

// === КАРТОЧКА ЗАПИСИ ===
window.editCatalogItem = function(id) {
    const item = window.catalogData.find(x => x.id == id || x.id.toString() === id.toString());
    if (!item) return;
    
    const modal = document.getElementById('catalog-card-modal');
    if (!modal) return alert("Ошибка: Модальное окно не найдено");
    modal.classList.add('active');
    
    document.getElementById('cc-id').value = item.id;
    document.getElementById('cc-art').value = item.art || "";
    document.getElementById('cc-name').value = item.name || "";
    document.getElementById('cc-brand').value = item.brand || "";
    document.getElementById('cc-type').value = item.type || "";
    document.getElementById('cc-photo').value = item.photo || "";
    const imgEl = document.getElementById('catalog-card-img');
    const svgPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjUyIiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iRm9udEF3ZXNvbWUgNiBGcmVlLCAiRm9udCBBd2Vzb21lIDYgU29saWQiLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIj7VrjwvdGV4dD48L3N2Zz4='; // image icon placeholder using fa-image unicode
    if (item.photo && item.photo.trim() !== '') {
        imgEl.src = item.photo;
        imgEl.onerror = () => { imgEl.src = svgPlaceholder; };
    } else {
        imgEl.src = svgPlaceholder;
    }

    const catSel = document.getElementById('cc-category');
    if (catSel) {
        catSel.innerHTML = window.catalogCategories.map(c => `
            <option value="${c.id}" ${c.id === item.category ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    // ИСТОРИЯ
    const hLog = document.getElementById('cat-history-log');
    if (hLog) {
        if (!item.history || item.history.length === 0) {
            hLog.innerHTML = '<div style="opacity:0.4; text-align:center; padding:10px;">История пуста</div>';
        } else {
            hLog.innerHTML = item.history.slice().reverse().map(h => {
                const userName = (h.user && typeof h.user === 'object') ? (h.user.name || 'N/A') : (h.user || 'Пользователь');
                return `
                <div style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                        <span style="color:var(--neon-emerald); font-weight:700; font-size:0.75rem;">${userName}</span>
                        <span style="opacity:0.5; font-size:0.6rem;">${h.time}</span>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.7rem;">${h.action}</div>
                </div>`;
            }).join('');
        }
    }

    const extraCont = document.getElementById('catalog-card-extra');
    if (extraCont) {
        const base = ['id', 'art', 'name', 'brand', 'type', 'photo', 'category', 'history', 'selected'];
        const keys = new Set();
        if (window.catalogData) {
            window.catalogData.forEach(row => {
                if (row && row.category === item.category) {
                    Object.keys(row).forEach(k => { if (!base.includes(k)) keys.add(k); });
                }
            });
        }
        Object.keys(item).forEach(k => { if (!base.includes(k)) keys.add(k); }); // ensure item's own unique keys are included
        const extras = Array.from(keys);
        extraCont.innerHTML = extras.map(k => `
            <div class="form-group">
                <label style="font-size:0.65rem; color:#888;">${k}</label>
                <input type="text" value="${item[k]}" class="form-control cc-dynamic-field" data-key="${k}" style="font-size:0.8rem;">
            </div>`).join('') || '<div style="grid-column: span 2; opacity:0.3; font-size:0.7rem; text-align:center; padding:15px;">Доп. характеристик нет</div>';
    }
};

window.saveCatalogCard = function() {
    // Гарантия массива
    if (!Array.isArray(window.catalogData)) {
        window.catalogData = Object.values(window.catalogData || {});
    }

    const id = document.getElementById('cc-id').value;
    const item = window.catalogData.find(x => String(x.id) === String(id));
    if (!item) return;

    // ЗАПИСЬ В ИСТОРИЮ (С ПОДРОБНОСТЯМИ)
    if (!Array.isArray(item.history)) item.history = [];
    const userObj = window.currentUser || { name: "Пользователь" };
    const userName = (typeof userObj === 'object') ? userObj.name : userObj;
    const now = new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    
    const changes = [];
    const checkChange = (field, label, newVal) => {
        const oldVal = item[field] || "";
        if (String(oldVal) !== String(newVal)) {
            changes.push(`${label}: ${oldVal || 'пусто'} ➝ ${newVal || 'пусто'}`);
        }
    };

    checkChange('art', 'Артикул', document.getElementById('cc-art').value);
    checkChange('name', 'Наименование', document.getElementById('cc-name').value);
    checkChange('brand', 'Бренд', document.getElementById('cc-brand').value);
    checkChange('type', 'Тип', document.getElementById('cc-type').value);
    checkChange('photo', 'Фото', document.getElementById('cc-photo').value);
    checkChange('category', 'Раздел', document.getElementById('cc-category').value);

    document.querySelectorAll('.cc-dynamic-field').forEach(inp => {
        const key = inp.dataset.key;
        checkChange(key, key, inp.value);
    });

    if (changes.length > 0) {
        item.history.push({ 
            time: now, 
            user: userName, 
            action: `Изменены поля: ${changes.join('; ')}` 
        });
        if (item.history.length > 50) item.history.shift();
    }

    // Сохранение новых значений
    item.art = document.getElementById('cc-art').value;
    item.name = document.getElementById('cc-name').value;
    item.brand = document.getElementById('cc-brand').value;
    item.type = document.getElementById('cc-type').value;
    item.photo = document.getElementById('cc-photo').value;
    item.category = document.getElementById('cc-category').value;
    document.querySelectorAll('.cc-dynamic-field').forEach(inp => {
        item[inp.getAttribute('data-key')] = inp.value;
    });

    window.closeCatalogCard();
    window.renderCatalogTable();
    if (window.fbPush) window.fbPush();
    if (window.showToast) window.showToast('Изменения внесены в справочник', 'success');
};

window.closeCatalogCard = function() {
    document.getElementById('catalog-card-modal').classList.remove('active');
};

// === ИМПОРТ EXCEL ===
window.openCatalogExcelImport = function() {
    window.catExcelStep = 1;
    const m = document.getElementById('catalog-excel-modal');
    if (m) m.classList.add('active');
    window.updateCatWizardUI();
    window.updateCatExcelCatSelect();
};

window.updateCatWizardUI = function() {
    document.querySelectorAll('.wiz-content-cat').forEach(c => c.style.display = 'none');
    document.querySelectorAll('#cat-excel-wizard-steps .wiz-step').forEach(s => s.classList.remove('active', 'complete'));
    
    const current = document.getElementById(`cat-excel-wiz-${window.catExcelStep}`);
    if (current) current.style.display = 'block';
    
    document.querySelectorAll('#cat-excel-wizard-steps .wiz-step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        if (sNum === window.catExcelStep) s.classList.add('active');
        if (sNum < window.catExcelStep) s.classList.add('complete');
    });

    const sub = document.getElementById('cat-excel-wizard-subtitle');
    const btnNext = document.getElementById('btn-cat-wiz-next');
    const btnPrev = document.getElementById('btn-cat-wiz-prev');

    if (window.catExcelStep === 1) {
        sub.innerText = "Шаг 1: Выбор источника данных";
        btnPrev.style.visibility = 'hidden';
        btnNext.disabled = !window.catExcelData || window.catExcelData.length === 0;
    } else if (window.catExcelStep === 2) {
        sub.innerText = "Шаг 2: Умный маппинг полей";
        btnPrev.style.visibility = 'visible';
        btnNext.disabled = false;
        btnNext.innerHTML = 'Далее <i class="fa-solid fa-chevron-right"></i>';
    } else if (window.catExcelStep === 3) {
        sub.innerText = "Шаг 3: Технический анализ";
        btnPrev.style.visibility = 'visible';
        btnNext.disabled = false;
        btnNext.innerHTML = 'Начать импорт <i class="fa-solid fa-play"></i>';
        window.renderCatExcelPreview();
    } else if (window.catExcelStep === 4) {
        sub.innerText = "Шаг 4: Пакетная запись";
        btnPrev.style.visibility = 'hidden';
        btnNext.style.display = 'none';
        btnPrev.style.display = 'none';
    }
};

window.catExcelWizNext = function() {
    if (window.catExcelStep < 3) {
        window.catExcelStep++;
        window.updateCatWizardUI();
    } else if (window.catExcelStep === 3) {
        window.catExcelStep++;
        window.updateCatWizardUI();
        window.processCatalogImport();
    }
};

window.catExcelWizBack = function() {
    if (window.catExcelStep > 1) {
        window.catExcelStep--;
        window.updateCatWizardUI();
    }
};

window.handleCatalogExcelFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    window.showToast('Чтение структуры...', 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            window.catExcelWorkbook = XLSX.read(data, { type: 'array' });
            const sheets = window.catExcelWorkbook.SheetNames;
            
            const sel = document.getElementById('cat-excel-sheet-select');
            if (sel) {
                sel.innerHTML = sheets.map(s => `<option value="${s}">${s}</option>`).join('');
                sel.value = sheets[0];
            }
            window.selectCatalogExcelSheet(sheets[0], true);
        } catch (err) { alert("Ошибка парсинга: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
};

window.selectCatalogExcelSheet = function(name, autoJump = false) {
    // СБРАСЫВАЕМ МАППИНГ ПРИ КОРЕННОЙ СМЕНЕ ЛИСТА / ФАЙЛА
    window.catMappings = {};
    window.catArtSources = [];

    const ws = window.catExcelWorkbook.Sheets[name];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length > 0) {
        let hr = 0;
        for (let i = 0; i < Math.min(10, raw.length); i++) {
            if (raw[i].filter(c => c && c.toString().trim() !== "").length >= 2) { hr = i; break; }
        }
        window.catExcelCols = raw[hr] || [];
        window.catExcelData = raw.slice(hr + 1);
        window.prepareCatMappingUI();
        if (autoJump) {
            window.catExcelStep = 2;
            window.updateCatWizardUI();
            const btnNext = document.getElementById('btn-cat-wiz-next');
            if (btnNext) btnNext.disabled = false;
        }
    }
};

window.prepareCatMappingUI = function() {
    const cont = document.getElementById('catalog-mappings-container');
    if (!cont) return;

    const baseFields = {
        'art': ['артикул', 'код', 'sku', 'art', 'article', 'арт', 'hessels', 'grimme', 'broekema', 'ropa'],
        'name': ['наименование', 'название', 'товар', 'имя', 'name', 'title'],
        'brand': ['бренд', 'марка', 'brand', 'производитель'],
        'photo': ['фото', 'изображение', 'photo', 'image', 'ссылка'],
        'photo_path': ['photo_path', 'путь к фото', 'path'],
        'photo_filename': ['photo_filename', 'имя файла фото', 'filename']
    };

    if (!window.catMappings) window.catMappings = {};
    if (!window.catArtSources) window.catArtSources = [];
    
    let html = '';

    window.catExcelCols.forEach((colName, colIdx) => {
        const cleanIdx = String(colIdx);
        const lowerCol = (colName || "").toString().toLowerCase().trim();
        let selectedField = "";

        if (baseFields.art.some(s => lowerCol.includes(s))) {
            selectedField = "art";
            window.catArtSources.push(cleanIdx);
        } else {
            for (let [f, synonyms] of Object.entries(baseFields)) {
                if (f === 'art') continue;
                if (synonyms.some(s => lowerCol === s || lowerCol.includes(s))) {
                    selectedField = f;
                    window.catMappings[f] = cleanIdx;
                    break;
                }
            }
        }

        if (!selectedField && lowerCol && lowerCol !== "---") {
            selectedField = `DYNAMIC_${colName}`;
            window.catMappings[selectedField] = cleanIdx;
        }

        html += `
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; border:1px solid ${selectedField ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'};">
                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:5px; text-transform:uppercase;">[КОЛОНКА ${parseInt(colIdx)+1}] ${colName || '---'}</div>
                <select class="form-control" style="height:32px; font-size:0.75rem;" onchange="window.updateCatMapping('${cleanIdx}', this.value)">
                    <option value="">-- Пропустить --</option>
                    <option value="art" ${selectedField === 'art' ? 'selected' : ''}>АРТИКУЛ (ID)</option>
                    <option value="name" ${selectedField === 'name' ? 'selected' : ''}>НАИМЕНОВАНИЕ</option>
                    <option value="brand" ${selectedField === 'brand' ? 'selected' : ''}>БРЕНД</option>
                    <option value="photo" ${selectedField === 'photo' ? 'selected' : ''}>ФОТОГРАФИЯ (URL)</option>
                    <option value="photo_path" ${selectedField === 'photo_path' ? 'selected' : ''}>ФОТО: ПУТЬ</option>
                    <option value="photo_filename" ${selectedField === 'photo_filename' ? 'selected' : ''}>ФОТО: ИМЯ ФАЙЛА</option>
                    ${lowerCol && lowerCol !== '---' ? `<option value="DYNAMIC_${colName}" ${selectedField.startsWith('DYNAMIC_') ? 'selected' : ''}>[+] ${colName}</option>` : ''}
                    <option value="NEW_FIELD">[+] Новое поле...</option>
                </select>
            </div>`;
    });
    cont.innerHTML = html;
    window.renderCatMappingSummary();
};

window.updateCatMapping = function(colIdx, field) {
    if (field === 'NEW_FIELD') {
        const customName = prompt("Введите название новой технической характеристики:");
        if (customName) {
            const fieldKey = `DYNAMIC_${customName}`;
            window.catMappings[fieldKey] = colIdx;
            // Обновляем UI самого селекта чтобы там появилось новое поле
            window.prepareCatMappingUI(); 
            return;
        } else {
            // Если отменили - сбрасываем селект
            window.prepareCatMappingUI();
            return;
        }
    }

    if (!field) {
        window.catArtSources = window.catArtSources.filter(x => x !== colIdx);
        for (let key in window.catMappings) if (window.catMappings[key] === colIdx) delete window.catMappings[key];
    } else if (field === 'art') {
        window.catArtSources = window.catArtSources.filter(x => x !== colIdx);
        for (let key in window.catMappings) if (window.catMappings[key] === colIdx) delete window.catMappings[key];
        if (!window.catArtSources.includes(colIdx)) window.catArtSources.push(colIdx);
    } else {
        window.catArtSources = window.catArtSources.filter(x => x !== colIdx);
        window.catMappings[field] = colIdx;
    }
    window.renderCatMappingSummary();
};

window.renderCatMappingSummary = function() {
    const cont = document.getElementById('cat-mapping-summary');
    if (!cont) return;
    
    let html = '';
    const addS = (label, value) => `<div style="font-size:0.7rem; padding:8px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.05); margin-bottom:5px;">
        <span style="opacity:0.4; text-transform:uppercase; font-size:0.55rem;">${label}:</span><br>
        <strong style="color:var(--brand-red);">${value || '---'}</strong>
    </div>`;

    if (window.catArtSources.length > 0) html += addS("АРТИКУЛЫ (КОЛОНКИ)", window.catArtSources.join(', '));
    if (window.catMappings.name) html += addS("НАИМЕНОВАНИЕ", `Колонка ${window.catMappings.name}`);
    if (window.catMappings.brand) html += addS("БРЕНД", `Колонка ${window.catMappings.brand}`);
    
    const dyn = Object.keys(window.catMappings).filter(k => k.startsWith('DYNAMIC_'));
    if (dyn.length > 0) {
        html += `<div style="margin:10px 0 5px; font-size:0.6rem; color:var(--brand-red); font-weight:900;">ХАРАКТЕРИСТИКИ:</div>`;
        dyn.forEach(k => {
            html += addS(k.replace('DYNAMIC_', ''), `Колонка ${window.catMappings[k]}`);
        });
    }

    cont.innerHTML = html || '<div style="text-align:center; padding:20px; opacity:0.2; font-size:0.7rem;">Нет назначенных полей</div>';
};

window.updateCatImportMapping = function(fieldKey, colIdx) {
    if (colIdx === '') return;
    window.updateCatMapping(String(colIdx), fieldKey);
};

window.renderCatExcelPreview = function() {
    const tableCont = document.getElementById('catalog-excel-preview-table');
    if (!tableCont) return;

    let html = '<thead><tr>';
    window.catExcelCols.slice(0, 10).forEach(c => { html += `<th>${c || '---'}</th>`; });
    html += '</tr></thead><tbody>';

    window.catExcelData.slice(0, 5).forEach(row => {
        html += '<tr>';
        window.catExcelCols.slice(0, 10).forEach((_, idx) => {
            html += `<td style="font-size:0.65rem; opacity:0.6;">${row[idx] || '-'}</td>`;
        });
        html += '</tr>';
    });
    tableCont.innerHTML = html + '</tbody>';
    const statsEl = document.getElementById('cat-excel-analysis-stats');
    if (statsEl) statsEl.innerText = `${window.catExcelData.length} строк`;
};

window.processCatalogImport = async function() {
    const targetId = document.getElementById('cat-excel-target-category').value;
    const catObj = window.catalogCategories.find(c => c.id === targetId);
    const catName = catObj ? catObj.name : "Без раздела";
    const nameFallback = document.getElementById('cat-excel-name-fallback')?.checked;

    document.getElementById('cat-wiz-progress-active').style.display = 'block';

    const progBar = document.getElementById('cat-excel-progress-bar');
    const progText = document.getElementById('cat-excel-progress-text');
    const logCont = document.getElementById('cat-excel-log-container');
    const statusText = document.getElementById('cat-wiz-processed-count');

    if (logCont) logCont.innerHTML = '<div>🚀 Запуск универсального импорта реестра...</div>';

    // ПЕРЕХОД НА ЕДИНЫЙ ДВИЖОК CORE.JS
    const imported = await window.runUniversalImport({
        data: window.catExcelData,
        mappings: window.catMappings,
        artSources: window.catArtSources,
        targetCategory: targetId,
        categoryName: catName,
        options: {
            splitActive: true,
            nameFallback: nameFallback,
            idPrefix: 'C-',
            moduleName: "Импорт в реестр"
        },
        onProgress: (i, total, addedCount, msg, type) => {
            const pct = Math.round((i / (total - 1)) * 100);
            if (progBar) progBar.style.width = pct + '%';
            if (progText) progText.innerText = pct + '%';
            if (statusText) statusText.innerText = `Строка: ${i + 1} из ${total}`;
            
            if (logCont) {
                if (type === 'error') {
                    const div = document.createElement('div');
                    div.style.color = 'var(--brand-red)';
                    div.style.fontWeight = '700';
                    div.innerText = `❗ ${msg}`;
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
        for (const item of imported) window.catalogData.push(item);
        
        window.saveAllToLocal();
        if (window.fbPush) await window.fbPush();
        
        window.renderCatalogTable();
        document.getElementById('cat-wiz-progress-active').style.display = 'none';
        document.getElementById('cat-wiz-progress-done').style.display = 'block';
        const finalStats = document.getElementById('cat-wiz-final-stats');
        if (finalStats) finalStats.innerText = `Успешно добавлено ${imported.length} позиций в реестр (пустые строки пропущены)`;
        
        if (window.showToast) window.showToast(`Реестр обновлен: +${imported.length}`, 'success');
    } else {
        alert("Данные для импорта не найдены. Проверьте маппинг артикулов или содержимое файла.");
        window.catExcelStep = 2;
        window.updateCatWizardUI();
    }
};

window.closeCatalogExcelImport = function() {
    const modal = document.getElementById('catalog-excel-modal');
    if (modal) modal.classList.remove('active');
    window.resetCatExcelImport();
};

window.resetCatExcelImport = function() {
    const input = document.getElementById('cat-excel-input');
    if (input) input.value = "";
    
    const s1 = document.getElementById('catalog-excel-step-1');
    const s2 = document.getElementById('catalog-excel-step-2');
    const progress = document.getElementById('catalog-excel-import-progress');
    const log = document.getElementById('catalog-excel-log-container');
    const btn = document.getElementById('catalog-excel-import-btn');

    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (btn) btn.disabled = false;
    if (progress) progress.style.display = 'none';
    if (log) log.style.display = 'none';
    
    // Сброс шагов прогресс-бара
    window.catExcelStep = 1;
    window.updateCatWizardUI();
};

window.addCatImportField = function() {
    const val = prompt("Название нового параметра справочника:");
    if (val) {
        const cont = document.getElementById('catalog-mappings-container');
        const html = `
            <div style="background:rgba(0,180,255,0.05); padding:10px; border-radius:8px; border:1px solid rgba(0,180,255,0.1);">
                <div style="font-size:0.65rem; color:#00b4ff; margin-bottom:5px;">
                    Новый параметр: <strong>${val}</strong>
                </div>
                <select class="form-control" style="height:32px; font-size:0.7rem; padding:0 10px;" onchange="window.updateCatImportMapping('DYNAMIC_${val}', this.value)">
                    <option value="">-- Колонка Excel --</option>
                    ${window.catExcelCols.map((c, i) => `<option value="${i}">${c || `Колонка ${i+1}`}</option>`).join('')}
                </select>
            </div>`;
        const div = document.createElement('div');
        div.innerHTML = html;
        cont.appendChild(div.firstElementChild);
    }
};
window.addCatalogImportField = window.addCatImportField;

window.updateCatExcelCatSelect = function() {
    const html = window.catalogCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const s1 = document.getElementById('catalog-excel-target-cat');
    const s2 = document.getElementById('cat-add-category');
    const s3 = document.getElementById('cc-category');
    if (s1) s1.innerHTML = html;
    if (s2) s2.innerHTML = html;
    if (s3) s3.innerHTML = html;
};

window.manageCatalogCategories = function() {
    document.getElementById('catalog-category-modal')?.classList.add('active');
    window.renderCatalogCategoriesList();
};

window.closeCatalogCategoryModal = function() {
    document.getElementById('catalog-category-modal')?.classList.remove('active');
};

// === CATALOG ADD MASTER v1.0 ===
window.startCatalogAddWizard = function() {
    window.catAddStep = 1;
    const modal = document.getElementById('catalog-add-master-modal');
    if (modal) {
        const catSelect = document.getElementById('cat-add-category');
        if (catSelect && window.activeCat && window.activeCat !== 'all') {
            catSelect.value = window.activeCat;
        }
        modal.classList.add('active');
        window.updateCatAddWizardUI();
    } else {
        if(window.showToast) window.showToast('Ошибка: Модальное окно мастера не найдено!', 'error');
    }
};

window.closeCatalogAddMaster = function() {
    document.getElementById('catalog-add-master-modal')?.classList.remove('active');
};

window.updateCatAddWizardUI = function() {
    document.querySelectorAll('.wiz-content-add-cat').forEach(c => c.style.display = 'none');
    const current = document.getElementById(`cat-add-wiz-${window.catAddStep}`);
    if (current) current.style.display = 'block';

    const steps = document.querySelectorAll('#cat-add-wizard-steps .wiz-step');
    steps.forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.toggle('active', sNum === window.catAddStep);
        s.classList.toggle('complete', sNum < window.catAddStep);
    });

    const btnNext = document.getElementById('btn-cat-add-next');
    const btnPrev = document.getElementById('btn-cat-add-prev');
    const sub = document.getElementById('cat-add-wizard-subtitle');

    if (btnPrev) btnPrev.style.visibility = window.catAddStep > 1 ? 'visible' : 'hidden';
    if (btnNext) btnNext.innerHTML = window.catAddStep === 3 ? 'Создать <i class="fa-solid fa-check"></i>' : 'Далее <i class="fa-solid fa-chevron-right"></i>';

    if (sub) {
        if (window.catAddStep === 1) sub.innerText = "Шаг 1: Базовая информация";
        else if (window.catAddStep === 2) sub.innerText = "Шаг 2: Технические данные";
        else if (window.catAddStep === 3) {
            sub.innerText = "Шаг 3: Проверка записи";
            window.renderCatAddSummary();
        }
    }
};

window.catAddWizNext = function() {
    if (window.catAddStep === 1) {
        const art = document.getElementById('cat-add-art').value.trim();
        const name = document.getElementById('cat-add-name').value.trim();
        if (!art || !name) {
            if (window.showToast) window.showToast('Заполните Артикул и Наименование перед переходом к параметрам', 'warning');
            return;
        }
        window.renderCatAddDynamicFields();
    }

    if (window.catAddStep < 3) {
        window.catAddStep++;
        window.updateCatAddWizardUI();
    } else {
        window.saveCatAddMaster();
    }
};

window.catAddWizBack = function() {
    if (window.catAddStep > 1) {
        window.catAddStep--;
        window.updateCatAddWizardUI();
    }
};

window.renderCatAddDynamicFields = function() {
    const cont = document.getElementById('cat-add-dynamic-fields');
    if (!cont) return;
    
    const catId = document.getElementById('cat-add-category').value;
    const currentItems = window.catalogData.filter(item => item.category === catId);
    
    const baseFields = ['name', 'brand', 'type', 'art', 'photo', 'id', 'category', 'history', 'selected'];
    const keys = new Set();
    currentItems.forEach(p => {
        Object.keys(p).forEach(k => { 
            if (!baseFields.includes(k) && !k.startsWith('_')) {
                keys.add(k); 
            }
        });
    });
    
    if (keys.size === 0) {
        cont.innerHTML = '<div style="grid-column: span 2; text-align:center; opacity:0.3; font-size:0.8rem; padding:15px;">В этом разделе нет дополнительных характеристик</div>';
        return;
    }
    
    let html = '<h5 style="grid-column: span 2; margin:0 0 5px 0; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px; font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-microchip"></i> Технические параметры раздела</h5>';
    keys.forEach(key => {
        html += `
            <div class="form-group">
                <label style="font-size:0.75rem; color:var(--brand-red); opacity:0.8;">${key}</label>
                <input type="text" class="form-control cat-add-dynamic-input" data-key="${key}" placeholder="Значение...">
            </div>`;
    });
    cont.innerHTML = html;
};

window.renderCatAddSummary = function() {
    const sumName = document.getElementById('cat-sum-name');
    const sumArt = document.getElementById('cat-sum-art');
    const sumCat = document.getElementById('cat-sum-cat');

    if (sumName) sumName.innerText = document.getElementById('cat-add-name').value || "Без названия";
    if (sumArt) sumArt.innerText = "АРТ: " + (document.getElementById('cat-add-art').value || "---");
    
    const catId = document.getElementById('cat-add-category').value;
    const catObj = window.catalogCategories.find(c => c.id === catId);
    if (sumCat) sumCat.innerText = catObj ? catObj.name : "---";
};

window.saveCatAddMaster = function() {
    const art = document.getElementById('cat-add-art').value.trim();
    if (!art) {
        if(window.showToast) window.showToast('Артикул обязателен!', 'warning');
        return;
    }
    
    // Duplicate check
    const exists = window.catalogData.find(x => x && x.art === art);
    if (exists) {
        alert('Ошибка: Товар с артикулом ' + art + ' уже существует в реестре!');
        return;
    }

    const newItem = {
        id: Date.now(),
        art: art,
        name: document.getElementById('cat-add-name').value || "Без названия",
        brand: document.getElementById('cat-add-brand').value || "",
        photo: document.getElementById('cat-add-photo').value || "",
        category: document.getElementById('cat-add-category').value,
        history: [{
            time: new Date().toLocaleString('ru-RU'),
            user: (window.currentUser && window.currentUser.name) ? window.currentUser.name : "Пользователь",
            action: `Создано вручную: Артикул ${art}`
        }]
    };

    document.querySelectorAll('.cat-add-dynamic-input').forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            newItem[inp.getAttribute('data-key')] = val;
        }
    });

    window.catalogData.push(newItem);
    if (window.logAudit) window.logAudit('INFO', `Добавлена позиция справочника ${newItem.art}`, 'Справочник');
    
    if (window.fbPush) window.fbPush();
    window.renderCatalogTable();
    window.closeCatalogAddMaster();
    if (window.showToast) window.showToast("Позиция добавлена в реестр", 'success');
};


// Unified CatSelect population already defined at line 816
window.updateCatExcelCatSelect();

// manageCatalogCategories is defined at line 937 (single canonical version)
// The duplicate below is removed to prevent override.

window.renderCatalogCategoriesList = function() {
    const l = document.getElementById('catalog-categories-list');
    if (l) l.innerHTML = window.catalogCategories.map(c => `<div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.02); border-radius:10px; margin-bottom:5px;">${c.name} <button class="btn btn-sm" onclick="window.deleteCatalogCategory('${c.id}')"><i class="fa-solid fa-trash"></i></button></div>`).join('');
};

window.addCatalogCategory = function() {
    const v = document.getElementById('new-cat-category-name').value.trim();
    if (v) {
        window.catalogCategories.push({id: 'cat_' + Date.now(), name: v});
        document.getElementById('new-cat-category-name').value = "";
        window.renderCatalogCategoriesList();
        window.updateCatExcelCatSelect();
        window.renderCatalogTabs();
        localStorage.setItem('prutkon_catalog_cats', JSON.stringify(window.catalogCategories));
        if (window.fbPush) window.fbPush();
        if (window.showToast) window.showToast("Раздел создан", 'success');
    }
};

window.deleteCatalogCategory = function(id) {
    if (confirm('Удалить раздел и все вложенности?')) {
        window.catalogCategories = window.catalogCategories.filter(c => c.id !== id);
        window.renderCatalogCategoriesList();
        window.renderCatalogTabs();
        if (window.fbPush) window.fbPush();
    }
};

// (cleanupEmptyCatalogRows is already defined at line 277 with the modal dialog UI)
// The version below is removed to avoid function override conflicts.

window.showDuplicateFinder = function() {
    const modal = document.getElementById('duplicate-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('duplicate-content').innerHTML = `
            <div style="text-align:center; padding:40px; opacity:0.5;">
                <i class="fa-solid fa-layer-group" style="font-size:3rem; margin-bottom:15px;"></i>
                <p>Сканирование реестра на наличие повторов артикулов...</p>
            </div>`;
        setTimeout(() => window.scanForDuplicates(), 500);
    }
};

window.scanForDuplicates = function() {
    const content = document.getElementById('duplicate-content');
    const data = window.catalogData;
    const counts = {};
    
    data.forEach(p => {
        const art = (p.art || "").toString().trim().toLowerCase();
        if (art && art !== "---") counts[art] = (counts[art] || 0) + 1;
    });

    const dups = Object.keys(counts).filter(a => counts[a] > 1);
    
    if (dups.length === 0) {
        content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--neon-emerald);">Дубликатов не обнаружено.</div>';
    } else {
        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        dups.forEach(art => {
            const items = data.filter(p => p.art && p.art.toLowerCase() === art);
            html += `
                <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,30,39,0.1);">
                    <div>
                        <div style="font-weight:700; color:var(--brand-red);">${art.toUpperCase()}</div>
                        <div style="font-size:0.75rem; opacity:0.6;">Коль-во повторов: ${items.length}</div>
                    </div>
                </div>`;
        });
        content.innerHTML = html + '</div>';
    }
};
