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
    'expense_type': 'Тип расхода',
    'amount': 'Сумма (₽)',
    'frequency': 'Периодичность',
    'description': 'Описание / Комментарий',
    'date_added': 'Дата добавления',
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
    'area': 'Площадь (м2)',
    'consolidation': 'Консолидация',
    'folder': 'Папка в Битрикс',
    'crops': 'Культуры',
    'note': 'Примечание',
    'note2': 'Примечание 2',
    
    // Новые поля для моделей техники и артикулов
    'brand': 'Бренд / Производитель',
    'model': 'Модель техники',
    'photo': 'Фотография',
    'year': 'Год выпуска',
    'description': 'Описание / Характеристики',
    'part_type': 'Тип запчасти',
    'machinery': 'Применяемость (техника)',
    'sizes': 'Размеры'
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

const DIR_CATEGORY_ORDER = [
    'metal', 'belt', 'belt_blank', 'belt_strip', 'machinery', 'part_skus',
    'brands', 'dealers', 'hardware', 'fasteners',
    'belt_widths', 'belt_pitches', 'belt_hole_distances', 'rod_diameters',
    'belt_strengths', 'belt_thicknesses', 'brackets', 'thread_types',
    'crops', 'vat_rates', 'connection_types', 'machinery_types', 'rod_types'
];

const DIR_CATEGORY_NUMBERING = {
    'metal': '1',
    'belt': '2',
    'belt_blank': '3',
    'belt_strip': '4',
    'machinery': '5',
    'part_skus': '6',
    'brands': '7',
    'dealers': '8',
    'hardware': '9',
    'fasteners': '10',
    'belt_widths': '11',
    'belt_pitches': '12',
    'belt_hole_distances': '13',
    'rod_diameters': '14',
    'belt_strengths': '15',
    'belt_thicknesses': '16',
    'brackets': '17',
    'thread_types': '18',
    'crops': '19',
    'vat_rates': '20',
    'connection_types': '21',
    'machinery_types': '22',
    'rod_types': '23'
};

window.loadDirCategories = () => {
    const tabs = document.getElementById('directory-tabs');
    if (!tabs) return;
    
    // Сортировка категорий согласно DIR_CATEGORY_ORDER
    const sortedCategories = [...window.dbDirectoryCategories].sort((a, b) => {
        const idxA = DIR_CATEGORY_ORDER.indexOf(a.id);
        const idxB = DIR_CATEGORY_ORDER.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    tabs.innerHTML = sortedCategories.map(cat => {
        const num = DIR_CATEGORY_NUMBERING[cat.id] || '';
        const prefix = num ? `${num}. ` : '';
        return `
            <button class="btn btn-secondary btn-sm ${window.activeDirCategory === cat.id ? 'active' : ''}" 
                    style="margin-right:8px; margin-bottom:8px;"
                    onclick="window.switchDirCategory('${cat.id}')">${prefix}${cat.name}</button>
        `;
    }).join('');
    
    const title = document.getElementById('directory-title');
    const activeObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
    if (title && activeObj) {
        const num = DIR_CATEGORY_NUMBERING[activeObj.id] || '';
        const prefix = num ? `${num}. ` : '';
        title.innerText = `${prefix}${activeObj.name}`;
    }
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
                        if (f === 'photo' && val !== '-') {
                            if (val.startsWith('data:image/') || val.startsWith('http') || val.startsWith('assets/') || val.startsWith('/') || val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.webp') || val.endsWith('.jpeg')) {
                                val = `<div style="width: 40px; height: 40px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-glass); background: #000; display: flex; align-items: center; justify-content: center;">
                                    <img src="${val}" style="max-width: 100%; max-height: 100%; object-fit: cover; cursor: zoom-in;" onclick="window.zoomImage('${val}')" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><rect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\' ry=\'2\'/><circle cx=\'8.5\' cy=\'8.5\' r=\'1.5\'/><polyline points=\'21 15 16 10 5 21\'/></svg>'">
                                </div>`;
                            }
                        } else if ((window.activeDirCategory === 'metal' || window.activeDirCategory === 'belt') && val !== '-') {
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
        cont.innerHTML = schema.map(f => {
            let listAttr = '';
            let datalistHtml = '';
            
            if (f === 'photo') {
                const imgVal = data[f] || '';
                return `
                    <div class="form-group col-span-2">
                        <label>${window.dirSchemaLabels[f] || f}</label>
                        <div class="flex gap-4 items-center mt-2 p-3" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 8px;">
                            <div id="dir-photo-preview" style="width: 80px; height: 80px; border-radius: 6px; border: 1px dashed var(--border-glass); display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000;">
                                ${imgVal ? `<img src="${imgVal}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-regular fa-image text-2xl neutral"></i>`}
                            </div>
                            <div class="flex-1 flex flex-col gap-2">
                                <input type="text" name="photo" id="dir-photo-input" class="form-control dir-schema-input" placeholder="Вставьте ссылку на фото или выберите файл..." value="${imgVal.replace(/"/g, '&quot;')}" oninput="window.updatePhotoPreview(this.value)">
                                <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: max-content; margin-bottom: 0;">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> Загрузить файл
                                    <input type="file" accept="image/*" style="display: none;" onchange="window.handlePhotoUpload(event)">
                                </label>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (f === 'crops') {
                const listId = `dl-dir-${f}`;
                const dbCrops = (window.dbDirectories || []).filter(d => d.category === 'crops').map(d => d.name);
                const defaultCrops = dbCrops.length > 0 ? dbCrops : ['свекла', 'картофель', 'лук', 'морковь', 'капуста', 'свекла столовая', 'помидоры', 'специальный', 'тыква', 'огурцы', 'салат'];
                datalistHtml = `<datalist id="${listId}">${defaultCrops.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            } else if (f === 'country') {
                const listId = `dl-dir-${f}`;
                const defaultCountries = ['Италия', 'Беларусь', 'Россия', 'Украина', 'США', 'Австрия', 'Польша', 'Нидерланды', 'Франция', 'Германия', 'Китай', 'Бельгия', 'Великобритания', 'Канада'];
                datalistHtml = `<datalist id="${listId}">${defaultCountries.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            } else if (f === 'consolidation') {
                const listId = `dl-dir-${f}`;
                const defaultConsolidations = ['Grimme', 'Ricon (Grimme)', 'Spudnik (Grimme)', 'Miedema', 'Dewulf', 'PLOEGER-OXBO', 'PMC', 'Hesels', 'Durabelt Inc', 'Noffsinger Manufacturing'];
                datalistHtml = `<datalist id="${listId}">${defaultConsolidations.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            } else if (f === 'brand') {
                const listId = `dl-dir-${f}`;
                const dbBrands = (window.dbDirectories || []).filter(d => d.category === 'brands').map(d => d.name);
                datalistHtml = `<datalist id="${listId}">${dbBrands.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            } else if (f === 'machinery') {
                const listId = `dl-dir-${f}`;
                const dbMach = (window.dbDirectories || []).filter(d => d.category === 'machinery').map(d => d.name);
                datalistHtml = `<datalist id="${listId}">${dbMach.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            } else if (f === 'part_type') {
                const listId = `dl-dir-${f}`;
                const defaultTypes = ['Ролик поддерживающий', 'Замок механический', 'Пруток транспортера', 'Звездочка приводная', 'Кронштейн крепления', 'Лента соединительная'];
                datalistHtml = `<datalist id="${listId}">${defaultTypes.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')}</datalist>`;
                listAttr = `list="${listId}"`;
            }
            
            return `
                <div class="form-group">
                    <label>${window.dirSchemaLabels[f] || f}</label>
                    ${datalistHtml}
                    <input type="text" name="${f}" class="form-control dir-schema-input" value="${String(data[f] || '').replace(/"/g, '&quot;')}" ${listAttr}>
                </div>
            `;
        }).join('');
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

// --- 6. ХЕЛПЕРЫ ФОТО И СПРАВКА ---
window.updatePhotoPreview = (val) => {
    const preview = document.getElementById('dir-photo-preview');
    if (!preview) return;
    if (val) {
        preview.innerHTML = `<img src="${val}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        preview.innerHTML = `<i class="fa-regular fa-image text-2xl neutral"></i>`;
    }
};

window.handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        window.showToast("Файл слишком большой. Лимит 2MB.", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        const input = document.getElementById('dir-photo-input');
        if (input) {
            input.value = base64;
            window.updatePhotoPreview(base64);
            window.showToast("Изображение успешно загружено", "success");
        }
    };
    reader.readAsDataURL(file);
};

window.zoomImage = (src) => {
    let overlay = document.getElementById('image-zoom-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'image-zoom-overlay';
        overlay.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: none; align-items: center; justify-content: center; cursor: zoom-out;';
        overlay.onclick = () => overlay.style.display = 'none';
        
        const img = document.createElement('img');
        img.id = 'image-zoom-img';
        img.style = 'max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px; border: 2px solid var(--border-glass); box-shadow: 0 10px 30px rgba(0,0,0,0.5);';
        overlay.appendChild(img);
        document.body.appendChild(overlay);
    }
    const imgEl = overlay.querySelector('img');
    if (imgEl) imgEl.src = src;
    overlay.style.display = 'flex';
};

const DIRECTORY_HELP_DATA = {
    'metal': `
        <h5>1. Материалы (Металл)</h5>
        <p>Этот справочник содержит перечень закупаемого металлического сырья (прутков и кругов) для производства транспортеров.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li><strong>Название:</strong> Указывайте в формате "[Диаметр]-[Производитель]", например, <code>10-ОМZ</code>.</li>
            <li><strong>Диаметр:</strong> Только цифры (в миллиметрах).</li>
            <li><strong>Длина:</strong> Стандартная длина прутка (обычно 6000 мм).</li>
            <li><strong>Марка стали:</strong> Например, <code>60С2ХА</code> (пружинно-рессорная сталь).</li>
            <li>При заполнении цены за тонну и накладных расходов, стоимость метра погонного рассчитывается автоматически с учетом ставки НДС.</li>
        </ul>
    `,
    'belt': `
        <h5>2. Справочник лент (Рулоны)</h5>
        <p>Справочник рулонов конвейерной ленты, поступающих от поставщиков в цех.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li><strong>Ширина:</strong> В миллиметрах (например, 70).</li>
            <li><strong>Прочность (EP):</strong> Номинал прочности корда (например, EP-800, EP-1000).</li>
            <li><strong>Толщина:</strong> Важнейший параметр для классификации ремней (например, 12, 17, 20 мм).</li>
            <li><strong>Цена за м2/м.п.:</strong> При изменении цены за м2 цена за м.п. пересчитывается автоматически по формуле <code>Цена за м2 * (Ширина / 1000)</code>.</li>
        </ul>
    `,
    'belt_blank': `
        <h5>3. Ленты-заготовки (Обрезанные рулоны)</h5>
        <p>Справочник подготовленных, обрезанных по ширине или длине лент для последующей нарезки на полосы.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li>Заполняется аналогично справочнику лент, но в качестве источника ссылается на исходный рулон.</li>
            <li>Используется для контроля расхода входящего сырья при нарезке.</li>
        </ul>
    `,
    'belt_strip': `
        <h5>4. Ленты-полосы (Полосы для ремней)</h5>
        <p>Нарезанные полосы заданной ширины и толщины, готовые к установке на прутки транспортера.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li>Указывается точная ширина и толщина полосы.</li>
            <li>Связывается с заготовкой-источником для списания остатков.</li>
        </ul>
    `,
    'machinery': `
        <h5>5. Модели техники</h5>
        <p>Каталог сельскохозяйственной техники (комбайны, копатели, сортировки), для которых изготавливаются транспортеры.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li><strong>Бренд:</strong> Выберите из справочника производителей (например, Grimme, ROPA).</li>
            <li><strong>Модель:</strong> Полное наименование модели (например, SE 150-60).</li>
            <li><strong>Фотография:</strong> Загрузите фото техники или вставьте ссылку на изображение.</li>
            <li><strong>Культуры:</strong> Овощные культуры, с которыми работает техника (например, Картофель, Лук).</li>
            <li><strong>Год выпуска:</strong> Год производства машины.</li>
        </ul>
    `,
    'part_skus': `
        <h5>6. Справочник артикулов запчастей</h5>
        <p>Каталог запчастей и комплектующих с привязкой к конкретным моделям техники и брендам.</p>
        <strong>Правила заполнения:</strong>
        <ul>
            <li><strong>Название (Артикул):</strong> Уникальный артикул детали (например, APT-GRI-101).</li>
            <li><strong>Тип запчасти:</strong> Ролик, звездочка, кронштейн, замок и т.д.</li>
            <li><strong>Бренд:</strong> Grimme, Ropa, AVR и др.</li>
            <li><strong>Применяемость:</strong> Модель техники, на которую устанавливается деталь.</li>
            <li><strong>Размеры:</strong> Например, 110x50 мм.</li>
        </ul>
    `,
    'brands': `
        <h5>7. Бренды / Производители</h5>
        <p>Справочник заводов-производителей сельскохозяйственной техники.</p>
    `,
    'dealers': `
        <h5>8. Поставщики / Дилеры</h5>
        <p>Справочник поставщиков сырья, комплектующих и готовой продукции.</p>
    `,
    'hardware': `
        <h5>9. Скобяные изделия</h5>
        <p>Металлические соединительные элементы (кронштейны, соединительные планки, замки).</p>
    `,
    'fasteners': `
        <h5>10. Метизы и крепеж</h5>
        <p>Болты, гайки, заклепки, шайбы, используемые при сборке.</p>
    `
};

window.showDirectoryHelp = () => {
    const modal = document.getElementById('dir-help-modal');
    const titleEl = document.getElementById('dir-help-title');
    const contentEl = document.getElementById('dir-help-content');
    if (!modal || !contentEl) return;
    
    const activeCatObj = window.dbDirectoryCategories.find(c => c.id === window.activeDirCategory);
    if (!activeCatObj) return;
    
    const num = DIR_CATEGORY_NUMBERING[activeCatObj.id] || '';
    const prefix = num ? `${num}. ` : '';
    titleEl.innerText = `Справка: ${prefix}${activeCatObj.name}`;
    
    let helpHtml = DIRECTORY_HELP_DATA[activeCatObj.id];
    if (!helpHtml) {
        helpHtml = `
            <h5>${prefix}${activeCatObj.name}</h5>
            <p>Это вспомогательный технический справочник для системы автоматизации Пруткон.</p>
            <strong>Правила заполнения:</strong>
            <ul>
                <li>Нажмите кнопку "Добавить запись", чтобы внести новое значение.</li>
                <li>Заполненные значения будут доступны для выбора в выпадающих списках калькуляторов и складских документов.</li>
            </ul>
        `;
    }
    contentEl.innerHTML = helpHtml;
    modal.classList.add('active');
};
