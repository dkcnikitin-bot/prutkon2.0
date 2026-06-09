/**
 * ПРУТКОН ОС: Модуль "Склад и Производство" (Логика)
 */

window.formatWhNumber = window.formatWhNumber || ((v, decimals = 2) => {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(v || 0);
});

let WAREHOUSE_CATALOG = {
    'metal': { name: 'Материал (Прочее)', unit: 'кг', icon: 'fa-cubes' },
    'belt': { name: 'Лента', unit: 'м', icon: 'fa-tape' },
    'belt_blank': { name: 'Лента-Заготовка (обрезная)', unit: 'м.п.', icon: 'fa-box-tissue' },
    'belt_strip': { name: 'Лента-Полоса (нарезная)', unit: 'м.п.', icon: 'fa-grip-lines-vertical' },
    'blank': { name: 'Заготовка', unit: 'шт', icon: 'fa-cube' },
    'straight': { name: 'Пруток (прямой)', unit: 'шт', icon: 'fa-ruler-horizontal' },
    'double': { name: 'Сдвоенный пруток', unit: 'шт', icon: 'fa-grip-lines' },
    'bent': { name: 'Гнутый пруток', unit: 'шт', icon: 'fa-wave-square' },
    'rubberized': { name: 'Обрезиненный пруток', unit: 'шт', icon: 'fa-ring' },
    'hedge': { name: 'Ёжные и пальцевые прутки', unit: 'шт', icon: 'fa-star-of-life' },
    'bent_rubberized': { name: 'Гнутый пруток обрезиненный', unit: 'шт', icon: 'fa-bacon' }
};

window.initWarehouseCatalog = () => {
    // Очищаем старые динамические ключи прутков, чтобы не дублировать
    for (let key in WAREHOUSE_CATALOG) {
        if (key.includes('_') && key !== 'belt_blank' && key !== 'belt_strip' && key !== 'bent_rubberized') {
            delete WAREHOUSE_CATALOG[key];
        }
    }

    if (window.dbDirectories) {
        const metals = window.dbDirectories.filter(d => d.category === 'metal' || (d.data && d.data.category === 'metal'));
        metals.forEach(m => {
            const d = m.data || m;
            let nameVal = d.name;
            if (!nameVal && d.steel_type && d.diameter) {
                const formattedLen = new Intl.NumberFormat('ru-RU').format(d.length || d.bar_len || 6000).replace(/\u00A0/g, ' ');
                nameVal = `Круг Х/Т ${d.diameter}; ${d.steel_type} (МД ${formattedLen})`;
            }
            if (!nameVal) {
                nameVal = `Круг Х/Т ${d.diameter || 0}; ${d.steel_type || 'Металл'}`;
            }
            const key = String(m.id).startsWith('metal_') ? m.id : `metal_${m.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: nameVal,
                unit: 'кг',
                icon: 'fa-cube'
            };
        });

        const belts = window.dbDirectories.filter(d => d.category === 'belt' || (d.data && d.data.category === 'belt'));
        belts.forEach(b => {
            const d = b.data || b;
            let nameVal = d.name;
            if (!nameVal && d.strength && d.width) {
                nameVal = `Лента ${d.width}-EP-${d.strength}/${d.cords || '3'} ${d.cover_top || '6'}/${d.cover_bottom || '2'} ${d.rubber_class || 'W'} ${d.tu || ''}`;
            }
            if (!nameVal) {
                nameVal = `Лента ${d.width || 940}-EP-${d.strength || 1200}/${d.cords || 3}`;
            }
            const key = String(b.id).startsWith('belt_') ? b.id : `belt_${b.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: nameVal,
                unit: 'м.п.',
                icon: 'fa-tape'
            };
        });

        const beltBlanks = window.dbDirectories.filter(d => d.category === 'belt_blank' || (d.data && d.data.category === 'belt_blank'));
        beltBlanks.forEach(b => {
            const d = b.data || b;
            let nameVal = d.name;
            if (!nameVal) {
                nameVal = `Лента-Заготовка ${d.width || 890}-EP-${d.strength || d.steel_type || '1200'}/${d.cords || 3}`;
            }
            const key = String(b.id).startsWith('belt_blank_') ? b.id : `belt_blank_${b.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: nameVal,
                unit: 'м.п.',
                icon: 'fa-box-tissue'
            };
        });

        const beltStrips = window.dbDirectories.filter(d => d.category === 'belt_strip' || (d.data && d.data.category === 'belt_strip'));
        beltStrips.forEach(b => {
            const d = b.data || b;
            let nameVal = d.name;
            if (!nameVal) {
                nameVal = `Лента-Полоса ${d.width || 22} мм (Дл ${d.length || 0} м)`;
            }
            const key = String(b.id).startsWith('belt_strip_') ? b.id : `belt_strip_${b.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: nameVal,
                unit: 'м.п.',
                icon: 'fa-grip-lines-vertical'
            };
        });

        const hardwares = window.dbDirectories.filter(d => d.category === 'hardware' || (d.data && d.data.category === 'hardware'));
        hardwares.forEach(h => {
            const d = h.data || h;
            const key = String(h.id).startsWith('hardware_') ? h.id : `hardware_${h.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: d.name || 'Скобяное изделие',
                unit: d.unit || 'шт',
                icon: 'fa-toolbox',
                parentGroup: 'hardware'
            };
        });

        const fasteners = window.dbDirectories.filter(d => d.category === 'fasteners' || (d.data && d.data.category === 'fasteners'));
        fasteners.forEach(f => {
            const d = f.data || f;
            const key = String(f.id).startsWith('fasteners_') ? f.id : `fasteners_${f.id}`;
            WAREHOUSE_CATALOG[key] = {
                name: d.name || 'Крепеж',
                unit: d.unit || 'шт',
                icon: 'fa-screwdriver-wrench',
                parentGroup: 'fasteners'
            };
        });
    }

    // Загружаем реестр прутков из localStorage / window.db
    let rodsObj = {};
    try {
        const raw = localStorage.getItem('prutkon_rods_registry');
        if (raw) rodsObj = JSON.parse(raw);
    } catch(e) {
        console.error('Failed to parse rods registry in warehouse', e);
    }
    
    if (window.db) {
        const RODS_KEYS = ['rods_metal', 'rods_blanks', 'rods_standard', 'rods_bent', 'rods_rubber', 'rods_double'];
        RODS_KEYS.forEach(k => {
            if (window.db[k] && Array.isArray(window.db[k])) {
                rodsObj[k] = window.db[k];
            }
        });
    }

    // Заготовки
    if (rodsObj.rods_blanks) {
        rodsObj.rods_blanks.forEach(b => {
            const key = b.article ? `blank_${b.article}` : `blank_${b.dia}_${b.length}`;
            WAREHOUSE_CATALOG[key] = {
                name: `Заготовка L=${b.length} мм, Ø${b.dia} мм`,
                unit: 'шт',
                icon: 'fa-cube',
                parentGroup: 'blank'
            };
        });
    }

    // Прямые / Стандартные прутки
    if (rodsObj.rods_standard) {
        rodsObj.rods_standard.forEach(r => {
            const key = r.article ? `straight_${r.article}` : `straight_${r.name}`;
            const nameLower = (r.name || '').toLowerCase();
            const isHedge = nameLower.includes('еж') || nameLower.includes('ёж') || nameLower.includes('палец');
            WAREHOUSE_CATALOG[key] = {
                name: r.name,
                unit: 'шт',
                icon: isHedge ? 'fa-star-of-life' : 'fa-ruler-horizontal',
                parentGroup: isHedge ? 'hedge' : 'straight'
            };
        });
    }

    // Сдвоенные прутки
    if (rodsObj.rods_double) {
        rodsObj.rods_double.forEach(r => {
            const key = r.article ? `double_${r.article}` : `double_${r.name}`;
            WAREHOUSE_CATALOG[key] = {
                name: r.name,
                unit: 'шт',
                icon: 'fa-grip-lines',
                parentGroup: 'double'
            };
        });
    }

    // Гнутые прутки
    if (rodsObj.rods_bent) {
        rodsObj.rods_bent.forEach(r => {
            const key = r.article ? `bent_${r.article}` : `bent_${r.name}`;
            const nameLower = (r.name || '').toLowerCase();
            const isHedge = nameLower.includes('еж') || nameLower.includes('ёж') || nameLower.includes('палец');
            WAREHOUSE_CATALOG[key] = {
                name: r.name,
                unit: 'шт',
                icon: isHedge ? 'fa-star-of-life' : 'fa-wave-square',
                parentGroup: isHedge ? 'hedge' : 'bent'
            };
        });
    }

    // Обрезиненные прутки
    if (rodsObj.rods_rubber) {
        rodsObj.rods_rubber.forEach(r => {
            const key = r.article ? `rubberized_${r.article}` : `rubberized_${r.name}`;
            const nameLower = (r.name || '').toLowerCase();
            const isBent = nameLower.includes('гнут') || nameLower.includes('сварн') || nameLower.includes('комби') || nameLower.includes('bent');
            WAREHOUSE_CATALOG[key] = {
                name: r.name,
                unit: 'шт',
                icon: isBent ? 'fa-bacon' : 'fa-ring',
                parentGroup: isBent ? 'bent_rubberized' : 'rubberized'
            };
        });
    }
};

const OPERATIONS_CONFIG = {
    'in_metal': { type: 'Приход: Металл', target: 'metal', source: null, isIncoming: true },
    'in_belt': { type: 'Приход: Лента', target: 'belt', source: null, isIncoming: true },
    'prod_belt_blank': { type: 'Обрезка бортов (Лента -> Лента-Заготовка)', target: 'belt_blank', source: 'belt' },
    'prod_belt_strip': { type: 'Нарезка полос (Лента-Заготовка -> Лента-Полоса)', target: 'belt_strip', source: 'belt_blank' },
    'prod_blank': { type: 'Изготовление: Заготовка', target: 'blank', source: 'metal' },
    'prod_straight': { type: 'Изготовление: Пруток (прямой)', target: 'straight', source: 'blank' },
    'prod_double': { type: 'Изготовление: Сдвоенный пруток', target: 'double', source: 'blank' },
    'prod_bent': { type: 'Изготовление: Гнутый пруток', target: 'bent', source: 'straight' },
    'prod_rubber': { type: 'Изготовление: Обрезиненный пруток', target: 'rubberized', source: 'straight' },
    'prod_hedge': { type: 'Изготовление: Ёжные/пальцевые прутки', target: 'hedge', source: 'straight' },
    'prod_bent_rubber': { type: 'Изготовление: Гнутый обрезиненный пруток', target: 'bent_rubberized', source: 'bent' },
    'write_off': { type: 'Списание / Брак', isWriteoff: true }
};

window.initWarehouse = async () => {
    // Сначала грузим из локалки для быстрого старта UI
    window.dbWarehouseInv = JSON.parse(localStorage.getItem('prutkon_warehouse_inv')) || {
        metal: 0, belt: 0, blank: 0, straight: 0, double: 0,
        bent: 0, rubberized: 0, hedge: 0, bent_rubberized: 0
    };
    window.dbWarehouseLog = JSON.parse(localStorage.getItem('prutkon_warehouse_log')) || [];
    window.dbMetalBatches = JSON.parse(localStorage.getItem('prutkon_warehouse_batches')) || [];

    // ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ (Прямое управление)
    if (window.supabase) {
        console.log('🔄 Синхронизация склада с облаком...');
        try {
            // 1. Грузим остатки
            const { data: invData } = await window.supabase.from('warehouse_inventory').select('*');
            if (invData && invData.length > 0) {
                invData.forEach(row => {
                    const d = row.data || row;
                    if (d.item_key) window.dbWarehouseInv[d.item_key] = d.quantity;
                });
            }

            // 2. Грузим лог (последние 100 записей)
            const { data: logData } = await window.supabase.from('warehouse_log').select('*').order('id', { ascending: false }).limit(100);
            if (logData) window.dbWarehouseLog = logData.map(l => l.data || l).reverse();

            // 3. Грузим партии
            const { data: batchData } = await window.supabase.from('metal_batches').select('*');
            if (batchData) window.dbMetalBatches = batchData.map(b => b.data || b);

            console.log('✅ Склад синхронизирован с облаком');
        } catch (e) {
            console.error('❌ Ошибка облачной синхронизации:', e.message);
        }
    }

    window.initWarehouseCatalog();
    window.refreshWarehouseData();
    if (typeof window.populateBeltSelect === 'function') window.populateBeltSelect();
};

document.addEventListener('DOMContentLoaded', () => {
    const checkData = setInterval(() => {
        if (window.dbDirectories && window.dbDirectories.length > 0) {
            clearInterval(checkData);
            window.initWarehouse();
        }
    }, 100);

    setTimeout(() => {
        clearInterval(checkData);
        if (!window.dbWarehouseInv) window.initWarehouse();
    }, 2000);
});

window.saveWarehouseData = async () => {
    // Локальное сохранение (бэкап)
    localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
    localStorage.setItem('prutkon_warehouse_log', JSON.stringify(window.dbWarehouseLog));
    localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbMetalBatches || []));

    // ОБЛАЧНОЕ СОХРАНЕНИЕ
    if (window.supabase) {
        try {
            // Сохраняем остатки с принудительным приведением количества к числу (защита от строк с пробелами/запятыми)
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
            if (invErr) {
                console.error('❌ Ошибка Supabase при сохранении остатков (warehouse_inventory):', invErr.message, '| Детали:', invErr.details, '| Подсказка:', invErr.hint);
            } else {
                console.log('☁️ Остатки склада успешно отправлены в Supabase');
            }

            // Сохраняем лог
            if (window.dbWarehouseLog.length > 0) {
                const lastOp = window.dbWarehouseLog[window.dbWarehouseLog.length - 1];
                const { error: logErr } = await window.supabase.from('warehouse_log').upsert({
                    id: String(lastOp.id),
                    data: lastOp
                });
                if (logErr) {
                    console.error('❌ Ошибка Supabase при сохранении лога (warehouse_log):', logErr.message, '| Детали:', logErr.details, '| Подсказка:', logErr.hint);
                } else {
                    console.log('☁️ Лог склада успешно отправлен в Supabase');
                }
            }
        } catch (e) {
            console.error('❌ Ошибка отправки в облако:', e.message);
        }
    }

    window.saveAllToLocal();
};

window.refreshWarehouseData = () => {
    renderInventory();
    renderMetrics();
    renderLog();

    // Авто-восстановление партий из справочников и инвентаря для отображения в Шаге 1
    if (window.dbWarehouseInv && window.dbDirectories) {
        if (!window.dbMetalBatches) window.dbMetalBatches = [];
        window.dbDirectories.forEach(d => {
            const dataObj = d.data || d;
            if (dataObj.category === 'metal') {
                const k1 = String(d.id).startsWith('metal_') ? d.id : `metal_${d.id}`;
                const k2 = d.id;
                const qtyInv = parseFloat(window.dbWarehouseInv[k1] || window.dbWarehouseInv[k2] || dataObj.qty_kg || dataObj.quantity || dataObj.qty || 0);

                if (qtyInv > 0) {
                    const st = dataObj.steel_type || dataObj.name || 'Металл';
                    const diam = parseFloat(dataObj.diameter || 0);
                    const exists = window.dbMetalBatches.find(b => (b.name === st || b.steel_type === st) && parseFloat(b.dia || b.diameter || 0) === diam);
                    if (!exists) {
                        const invNum = dataObj.invoice_num || dataObj.invoice || 'Остаток';
                        const pr = parseFloat(dataObj.price_tonne || dataObj.price || 0);
                        window.dbMetalBatches.push({
                            id: 'batch_auto_' + d.id + '_' + Date.now(),
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
                    } else {
                        exists.qty = qtyInv;
                        exists.available_weight = qtyInv;
                    }
                }
            }
        });
        localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbMetalBatches));
    }
};

function renderInventory() {
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) return;

    window.expandedGroups = window.expandedGroups || {
        metal: false,
        belt: false,
        hardware: false,
        fasteners: false,
        blank: false,
        straight: false,
        double: false,
        bent: false,
        rubberized: false,
        hedge: false,
        bent_rubberized: false
    };

    let html = '';

    const groupsConfig = {
        metal: { name: 'Материалы (в ассортименте)', unit: 'кг', icon: 'fa-cubes', color: 'var(--brand-gold)', bg: 'rgba(255,180,0,0.05)', border: 'rgba(255,180,0,0.15)' },
        belt: { name: 'Ленты (рулоны, заготовки, полосы)', unit: 'м.п.', icon: 'fa-tape', color: 'var(--accent-blue)', bg: 'rgba(0,147,255,0.05)', border: 'rgba(0,147,255,0.15)' },
        hardware: { name: 'Скобяные изделия', unit: 'шт', icon: 'fa-toolbox', color: 'var(--brand-gold)', bg: 'rgba(255,180,0,0.03)', border: 'rgba(255,180,0,0.1)' },
        fasteners: { name: 'Метизы и крепеж', unit: 'шт', icon: 'fa-screwdriver-wrench', color: '#af52de', bg: 'rgba(175,82,222,0.03)', border: 'rgba(175,82,222,0.1)' },
        blank: { name: 'Заготовки прутков', unit: 'шт', icon: 'fa-cube', color: 'var(--brand-gold)', bg: 'rgba(255,180,0,0.03)', border: 'rgba(255,180,0,0.1)' },
        straight: { name: 'Прутки прямые (стандартные)', unit: 'шт', icon: 'fa-ruler-horizontal', color: 'var(--neon-emerald)', bg: 'rgba(0,255,157,0.03)', border: 'rgba(0,255,157,0.1)' },
        double: { name: 'Сдвоенные прутки', unit: 'шт', icon: 'fa-grip-lines', color: '#af52de', bg: 'rgba(175,82,222,0.03)', border: 'rgba(175,82,222,0.1)' },
        bent: { name: 'Гнутые / Сварные прутки', unit: 'шт', icon: 'fa-wave-square', color: '#af52de', bg: 'rgba(175,82,222,0.03)', border: 'rgba(175,82,222,0.1)' },
        rubberized: { name: 'Обрезиненные прутки', unit: 'шт', icon: 'fa-ring', color: '#00c7be', bg: 'rgba(0,199,190,0.03)', border: 'rgba(0,199,190,0.1)' },
        hedge: { name: 'Ёжные и пальцевые прутки', unit: 'шт', icon: 'fa-star-of-life', color: '#ff2d55', bg: 'rgba(255,45,85,0.03)', border: 'rgba(255,45,85,0.1)' },
        bent_rubberized: { name: 'Гнутые обрезиненные прутки', unit: 'шт', icon: 'fa-bacon', color: '#00c7be', bg: 'rgba(0,199,190,0.03)', border: 'rgba(0,199,190,0.1)' }
    };

    const stripTU = (name) => {
        if (!name) return '';
        return name.replace(/\s*(?:ТУ|ГОСТ)\s*\S+/g, '').replace(/\s*(?:ТУ|ГОСТ)-\S+/g, '').trim();
    };

    const getCatalogItemDia = (k) => {
        const item = WAREHOUSE_CATALOG[k];
        if (!item) return 0;
        if (item.dia) return parseFloat(item.dia);
        const match = String(item.name || '').match(/Ø\s*(\d+(\.\d+)?)/i) || String(k).match(/(?:BL|DBL|PR)-(\d+(\.\d+)?)/i);
        return match ? parseFloat(match[1]) : 0;
    };

    for (let groupKey in groupsConfig) {
        const conf = groupsConfig[groupKey];
        
        let childKeys = [];
        for (let key in WAREHOUSE_CATALOG) {
            const item = WAREHOUSE_CATALOG[key];
            let belongs = false;
            
            if (groupKey === 'metal') {
                belongs = (key === 'metal' || key.startsWith('metal_'));
            } else if (groupKey === 'belt') {
                belongs = (key === 'belt' || key.startsWith('belt_') || key.startsWith('belt_blank') || key.startsWith('belt_strip'));
            } else {
                belongs = (item.parentGroup === groupKey || (key === groupKey && !item.parentGroup));
            }
            
            if (belongs && key !== groupKey) {
                childKeys.push(key);
            }
        }
        
        // Суммируем остатки
        let totalQty = 0;
        childKeys.forEach(k => {
            totalQty += (window.dbWarehouseInv[k] || 0);
        });
        
        const genericQty = window.dbWarehouseInv[groupKey] || 0;
        totalQty += genericQty;
        
        const isExpanded = window.expandedGroups[groupKey];
        const expandIcon = isExpanded ? 'fa-square-minus' : 'fa-square-plus';
        
        html += `
            <tr class="group-header-row" onclick="window.toggleGroup('${groupKey}')" style="cursor:pointer; background:${conf.bg}; font-weight:bold; border-bottom:1px solid ${conf.border}; border-top: 1px solid rgba(255,255,255,0.02);">
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid ${expandIcon}" style="font-size:1.1rem; color: ${conf.color};"></i>
                        <strong style="color:#fff; font-size:0.85rem;">${conf.name}</strong>
                    </div>
                </td>
                <td style="color:var(--text-muted); font-size:0.8rem;">${conf.unit}</td>
                <td style="text-align: right; padding-right:15px;">
                    <span style="font-family:'JetBrains Mono', monospace; font-size:1rem; color:${conf.color}; font-weight:800;">
                        ${window.formatWhNumber(totalQty, conf.unit === 'шт' ? 0 : 2)}
                    </span>
                </td>
            </tr>
        `;
        
        if (isExpanded) {
            let hasChildren = false;
            
            if (genericQty > 0) {
                const genericItem = WAREHOUSE_CATALOG[groupKey] || { name: 'Нераспределенный остаток', unit: conf.unit, icon: conf.icon };
                const nameDisplay = 'Общий нераспределенный остаток';
                html += renderInventoryChildRow(groupKey, { ...genericItem, name: nameDisplay }, genericQty, groupKey);
                hasChildren = true;
            }
            
            // Фильтруем childKeys по количеству > 0
            const activeChildKeys = childKeys.filter(key => (window.dbWarehouseInv[key] || 0) > 0);

            // Группируем по диаметрам если прутки/заготовки
            const isRodGroup = ['blank', 'straight', 'double', 'bent', 'rubberized', 'hedge', 'bent_rubberized'].includes(groupKey);
            if (isRodGroup) {
                activeChildKeys.sort((a, b) => {
                    const diaA = getCatalogItemDia(a);
                    const diaB = getCatalogItemDia(b);
                    if (diaA !== diaB) return diaA - diaB;
                    return String(WAREHOUSE_CATALOG[a].name).localeCompare(String(WAREHOUSE_CATALOG[b].name));
                });

                let lastDia = null;
                activeChildKeys.forEach(key => {
                    const item = WAREHOUSE_CATALOG[key];
                    const qty = window.dbWarehouseInv[key] || 0;
                    
                    const dia = getCatalogItemDia(key);
                    if (dia !== lastDia) {
                        lastDia = dia;
                        html += `
                            <tr style="background: rgba(255,255,255,0.02); font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                <td colspan="3" style="padding: 6px 15px; padding-left: 35px; color: var(--brand-gold); font-size: 0.75rem;">
                                    <i class="fa-solid fa-circle-dot" style="font-size:0.6rem;"></i> Диаметр: Ø${dia ? dia + ' мм' : 'Не указан'}
                                </td>
                            </tr>
                        `;
                    }
                    
                    // Strip TU from displayed name
                    const cleanItem = { ...item, name: stripTU(item.name) };
                    html += renderInventoryChildRow(key, cleanItem, qty, groupKey);
                    hasChildren = true;
                });
            } else {
                activeChildKeys.forEach(key => {
                    const item = WAREHOUSE_CATALOG[key];
                    const qty = window.dbWarehouseInv[key] || 0;
                    
                    // Strip TU from displayed name
                    const cleanItem = { ...item, name: stripTU(item.name) };
                    html += renderInventoryChildRow(key, cleanItem, qty, groupKey);
                    hasChildren = true;
                });
            }
            
            if (!hasChildren) {
                html += `<tr><td colspan="3" style="text-align:center; opacity:0.5; font-size:0.8rem; padding:15px; padding-left:45px;">Нет остатков в этой группе</td></tr>`;
            }
        }
    }
    tbody.innerHTML = html;
}

window.toggleGroup = (groupName) => {
    window.expandedGroups = window.expandedGroups || {};
    window.expandedGroups[groupName] = !window.expandedGroups[groupName];
    renderInventory();
};

function renderInventoryChildRow(key, item, qty, type) {
    if (!item) return '';
    let qtyStr = window.formatWhNumber(qty, item.unit === 'шт' ? 0 : 2);
    let clickHandler = (key.startsWith('metal_') || key === 'metal') ? `onclick="if(window.PrutkonFeatures) window.PrutkonFeatures.openMetalCard('${key}')" style="cursor:pointer;"` : '';
    let indentStyle = 'padding-left: 35px;';
    return `
        <tr ${clickHandler} style="background: rgba(255,255,255,0.015);">
            <td style="${indentStyle}">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid ${item.icon} text-muted" style="width:20px; text-align:center; font-size: 0.8rem; opacity: 0.6;"></i>
                    <span style="color:var(--text-secondary); font-size:0.8rem;">${item.name}</span>
                </div>
            </td>
            <td style="color:var(--text-muted); font-size:0.75rem;">${item.unit}</td>
            <td style="text-align: right; display:flex; justify-content:flex-end; align-items:center; gap:10px;">
                <span style="font-family:'JetBrains Mono', monospace; font-size:0.85rem; color:${qty > 0 ? 'var(--text-primary)' : 'var(--text-muted)'}; font-weight:600;">
                    ${qtyStr}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.manualEditStock('${key}')" style="padding: 1px 5px; font-size:0.65rem;" title="Изменить остаток">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

function renderInventoryRow(key, item, qty) {
    let qtyStr = window.formatWhNumber(qty, item.unit === 'шт' ? 0 : 2);
    let clickHandler = (key.startsWith('metal_') || key === 'metal') ? `onclick="if(window.PrutkonFeatures) window.PrutkonFeatures.openMetalCard('${key}')" style="cursor:pointer;"` : '';
    return `
        <tr ${clickHandler}>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid ${item.icon} text-muted" style="width:20px; text-align:center;"></i>
                    <strong style="color:var(--text-primary); font-size:0.85rem;">${item.name}</strong>
                </div>
            </td>
            <td style="color:var(--text-muted); font-size:0.8rem;">${item.unit}</td>
            <td style="text-align: right; display:flex; justify-content:flex-end; align-items:center; gap:10px;">
                <span style="font-family:'JetBrains Mono', monospace; font-size:1rem; color:${qty > 0 ? 'var(--emerald-neon)' : 'var(--text-muted)'}; font-weight:800;">
                    ${qtyStr}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="window.manualEditStock('${key}')" style="padding: 2px 6px; font-size:0.7rem;" title="Изменить остаток">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

function renderMetrics() {
    const container = document.getElementById('warehouse-metrics');
    if (!container) return;

    let totalMetalWeight = 0;
    let totalValue = 0;

    for (let key in window.dbWarehouseInv) {
        if (key === 'metal' || key.startsWith('metal_')) {
            const qty = window.parseRusFloat(window.dbWarehouseInv[key]);
            totalMetalWeight += qty;

            if (key.startsWith('metal_')) {
                const id = key.replace('metal_', '');
                const metal = window.dbDirectories.find(d => String(d.id) === id);
                if (metal && metal.price) {
                    const pricePerTon = parseFloat(metal.price.replace(/[^\d,]/g, '').replace(',', '.'));
                    if (!isNaN(pricePerTon)) {
                        totalValue += (qty * (pricePerTon / 1000));
                    }
                }
            }
        }
    }

    const blanks = parseInt(window.dbWarehouseInv.blank || 0);
    const basicRods = parseInt(window.dbWarehouseInv.straight || 0) + parseInt(window.dbWarehouseInv.double || 0);
    const specRods = parseInt(window.dbWarehouseInv.bent || 0) + parseInt(window.dbWarehouseInv.rubberized || 0) + parseInt(window.dbWarehouseInv.hedge || 0) + parseInt(window.dbWarehouseInv.bent_rubberized || 0);

    container.innerHTML = `
        <div class="metric-tile">
            <div class="metric-tile-label"><i class="fa-solid fa-weight-hanging"></i> Вес металла (всего)</div>
            <div class="metric-tile-value" style="color:var(--brand-gold);">${window.formatWhNumber(totalMetalWeight, 1)} кг</div>
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:5px;">Оценка: ${window.formatWhNumber(totalValue, 0)} руб.</div>
        </div>
        <div class="metric-tile">
            <div class="metric-tile-label"><i class="fa-solid fa-microchip"></i> Заготовки</div>
            <div class="metric-tile-value">${window.formatWhNumber(blanks, 0)} шт</div>
        </div>
        <div class="metric-tile">
            <div class="metric-tile-label"><i class="fa-solid fa-layer-group"></i> Базовые прутки</div>
            <div class="metric-tile-value">${window.formatWhNumber(basicRods, 0)} шт</div>
        </div>
        <div class="metric-tile">
            <div class="metric-tile-label"><i class="fa-solid fa-vial-circle-check"></i> Спец-изделия</div>
            <div class="metric-tile-value">${window.formatWhNumber(specRods, 0)} шт</div>
        </div>
    `;
}

function renderLog() {
    const container = document.getElementById('warehouse-log');
    if (!container) return;

    if (window.dbWarehouseLog.length === 0) {
        container.innerHTML = '<div style="opacity:0.5; padding:20px; text-align:center;">Нет записей операций</div>';
        return;
    }

    let html = '';
    const logs = window.dbWarehouseLog.slice().reverse().slice(0, 50);

    logs.forEach(log => {
        html += `
            <div class="activity-item" style="display:flex; gap:15px; align-items:flex-start;">
                <div style="background:rgba(255,255,255,0.05); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--brand-red);">
                    <i class="fa-solid fa-exchange-alt"></i>
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:#fff;">${log.type}</strong>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${log.date}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:5px;">
                        ${log.details}
                    </div>
                    ${log.attachments && log.attachments.length > 0 ? `
                        <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
                            ${log.attachments.map(att => `
                                <a href="${att.data}" download="${att.name}" class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:5px; color:#fff; font-size:0.7rem; cursor:pointer;" onclick="event.stopPropagation();">
                                    <i class="fa-solid fa-file"></i> ${att.name.substring(0,15)}${att.name.length > 15 ? '...' : ''}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                        ${log.comment ? `<div style="font-size:0.75rem; color:var(--emerald-neon); background:rgba(0,255,157,0.05); padding:4px 8px; border-radius:4px;">${log.comment}</div>` : '<div></div>'}
                        ${log.changes ? `<button class="btn btn-danger btn-sm" style="padding:2px 8px; font-size:0.7rem;" onclick="window.deleteOperation(${log.id})" title="Отменить операцию"><i class="fa-solid fa-undo"></i> Отменить</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.manualEditStock = (key) => {
    const item = WAREHOUSE_CATALOG[key];
    const current = window.dbWarehouseInv[key] || 0;
    const newVal = prompt(`Изменение остатка: ${item.name} (${item.unit})\nТекущий остаток: ${current}\nВведите новый остаток:`, current);
    if (newVal !== null) {
        const val = window.parseRusFloat(newVal);
        if (!isNaN(val) && val >= 0) {
            window.dbWarehouseInv[key] = val;
            window.dbWarehouseLog.push({
                id: Date.now(),
                date: new Date().toLocaleString(),
                type: 'Ручная корректировка',
                details: `Изменен остаток: ${item.name}. Было: ${current}, Стало: ${val} ${item.unit}`,
                comment: 'Корректировка администратора',
                user: (window.currentUser && window.currentUser.name) ? window.currentUser.name : 'Система'
            });
            window.saveWarehouseData();
            window.refreshWarehouseData();
            if (window.showToast) window.showToast('Остаток обновлен', 'success');
        }
    }
};

window.deleteOperation = async (id) => {
    if (!confirm('Вы уверены, что хотите отменить эту операцию? Это вернет остатки на складе к состоянию до этой операции.')) return;

    const opIndex = window.dbWarehouseLog.findIndex(o => o.id === id);
    if (opIndex === -1) return;

    const op = window.dbWarehouseLog[opIndex];

    // 1. Возвращаем остатки (инвертируем операцию)
    if (op.changes) {
        if (op.changes.source) {
            const sItem = op.changes.source.item;
            window.dbWarehouseInv[sItem] = (window.dbWarehouseInv[sItem] || 0) + Math.abs(op.changes.source.qty);
        }
        if (op.changes.target) {
            const tItem = op.changes.target.item;
            if (op.changes.target.qty < 0) {
                window.dbWarehouseInv[tItem] = (window.dbWarehouseInv[tItem] || 0) + Math.abs(op.changes.target.qty);
            } else {
                window.dbWarehouseInv[tItem] = (window.dbWarehouseInv[tItem] || 0) - Math.abs(op.changes.target.qty);
            }
        }
    }

    // 2. Удаляем из локального массива
    window.dbWarehouseLog.splice(opIndex, 1);

    // 3. Удаляем из Supabase
    if (window.supabase) {
        try {
            await window.supabase.from('warehouse_log').delete().eq('id', String(id));
            console.log('🗑️ Операция удалена из облака');
        } catch (e) {
            console.error('Ошибка удаления из облака:', e);
        }
    }

    // 4. Сохраняем обновленные остатки
    window.saveWarehouseData();
    window.refreshWarehouseData();
    if (window.showToast) window.showToast('Операция отменена и удалена из облака', 'info');
};

window.showNewOperationModal = (prefillType) => {
    const clearInp = (id, defaultVal = '') => {
        const el = document.getElementById(id);
        if (el) el.value = defaultVal;
    };

    clearInp('op-qty');
    clearInp('op-qty-tonne');
    clearInp('op-spec-unit-price');
    clearInp('op-spec-price-tonne');
    clearInp('op-spec-sum-no-vat');
    clearInp('op-spec-unit-price-vat');
    clearInp('op-spec-price-tonne-vat');
    clearInp('op-spec-sum-vat');
    clearInp('op-source-qty');
    clearInp('op-comment');
    clearInp('op-supplier');
    clearInp('op-contract');
    clearInp('op-invoice-num');
    clearInp('op-invoice-date');
    clearInp('op-cert-num');
    clearInp('op-unit-price');
    clearInp('op-price-tonne');
    clearInp('op-sum-no-vat');
    clearInp('op-sum-vat-only');
    clearInp('op-sum-vat');
    clearInp('op-delivery-cost', '0');
    clearInp('op-delivery-carrier');
    clearInp('op-overall-costs');
    clearInp('op-total-cost', '0.00 руб');
    clearInp('op-bars-count');
    clearInp('op-bar-len', '6000');
    clearInp('op-diameter');
    clearInp('op-steel-type');
    clearInp('op-weight-per-m');
    clearInp('op-belt-rolls');
    clearInp('op-belt-weight');
    clearInp('op-belt-diameter');
    clearInp('op-belt-width');
    clearInp('op-belt-length');

    // Default to in_metal if not specified
    const typeSelect = document.getElementById('op-type');
    if (typeSelect) typeSelect.value = prefillType || 'in_metal';

    // Populate Datalists
    const suppliers = window.dbDirectories.filter(d => d.category === 'dealers').map(d => d.name);
    const suppliersList = document.getElementById('op-suppliers-list');
    if (suppliersList) suppliersList.innerHTML = suppliers.map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');

    const steelTypesList = document.getElementById('op-steel-types-list');
    if (steelTypesList) steelTypesList.innerHTML = (window.steelTypes || []).map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');

    window.populateMetalSelect();
    if (typeof window.populateBeltSelect === 'function') window.populateBeltSelect();

    // Default dates and autogenerate 1C doc number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const docDateEl = document.getElementById('op-doc-date');
    if (docDateEl) docDateEl.value = `${year}-${month}-${day}T${hours}:${minutes}`;

    const invoiceDateEl = document.getElementById('op-invoice-date');
    if (invoiceDateEl) invoiceDateEl.value = `${year}-${month}-${day}`;

    // Populate employees dropdown
    if (!window.dbEmployees) {
        window.dbEmployees = JSON.parse(localStorage.getItem('prutkon_employees')) || [];
    }
    const employees = (Array.isArray(window.dbEmployees) && window.dbEmployees.length) 
        ? window.dbEmployees 
        : [
            { id: 1, name: "Никитин Иван Андреевич", role: "Администратор" },
            { id: 2, name: "Петров Александр", role: "Оператор" },
            { id: 3, name: "Сидоров Дмитрий", role: "Мастер цеха" }
          ];
    const respSelect = document.getElementById('op-responsible');
    if (respSelect) {
        respSelect.innerHTML = employees.map(emp => `<option value="${emp.name}">${emp.name} (${emp.role})</option>`).join('');
        if (window.currentUser) {
            respSelect.value = window.currentUser.name;
        }
    }

    // Generate Doc Number (1C Style)
    const inMetalBatches = (window.dbMetalBatches || []).filter(b => b.invoice && b.invoice.startsWith('ПМ-'));
    let maxNum = 0;
    inMetalBatches.forEach(b => {
        const num = parseInt(b.invoice.replace('ПМ-', ''));
        if (num && num > maxNum) maxNum = num;
    });
    const docNum = 'ПМ-' + String(maxNum + 1).padStart(5, '0');
    const docNumEl = document.getElementById('op-doc-num');
    if (docNumEl) docNumEl.value = docNum;

    // Reset items batch
    window.currentBatch = [];
    window.renderBatchTable();

    // Default tab
    window.switchWhTab('main');

    // Reset attachments
    window.opUploadedAttachments = [];
    const attInput = document.getElementById('op-attachments');
    if (attInput) attInput.value = '';
    const attPrev = document.getElementById('op-attachments-preview');
    if (attPrev) attPrev.innerHTML = '';

    document.getElementById('modal-new-operation').classList.add('active');
    window.updateOperationForm();
};

window.populateMetalSelect = () => {
    const sel = document.getElementById('op-metal-select');
    const calcSel = document.getElementById('calc-metal-select');
    if (!window.dbDirectories) return;

    // Фильтруем только металлы
    const metals = window.dbDirectories.filter(d => d.category === 'metal' || (d.data && d.data.category === 'metal'));

    const opts = '<option value="">-- Выберите металл из справочника --</option>' +
        metals.map(m => {
            const d = m.data || m;
            let label = d.name;
            if (!label && d.steel_type && d.diameter) {
                const formattedLen = new Intl.NumberFormat('ru-RU').format(d.length || d.bar_len || 6000).replace(/\u00A0/g, ' ');
                label = `Круг Х/Т ${d.diameter}; ${d.steel_type} (МД ${formattedLen})`;
            }
            if (!label) label = m.id;
            if (d.supplier) label += ` — ${d.supplier}`;
            return `<option value="${m.id}">${label}</option>`;
        }).join('');

    if (sel) { sel.innerHTML = opts; }
    if (calcSel) { calcSel.innerHTML = opts; }
};

window.toggleBlankCalc = () => {
    const isChecked = document.getElementById('blank-calc-toggle').checked;
    const fields = document.getElementById('blank-calc-fields');
    if (fields) fields.style.display = isChecked ? 'block' : 'none';

    const qtyInput = document.getElementById('op-qty');
    const sourceQtyInput = document.getElementById('op-source-qty');
    if (isChecked) {
        if (qtyInput) { qtyInput.readOnly = true; qtyInput.placeholder = "Авторасчет..."; }
        window.doBlankCalc();
    } else {
        if (qtyInput) { qtyInput.readOnly = false; qtyInput.placeholder = "Например: 3135..."; }
        if (sourceQtyInput) sourceQtyInput.readOnly = false;
        document.getElementById('calc-blank-result').innerHTML = 'Авторасчет выключен.';
    }
};

window.doBlankCalc = () => {
    const isChecked = document.getElementById('blank-calc-toggle').checked;
    if (!isChecked) return;

    const sourceItem = document.getElementById('op-source-item-select').value;
    const lenStr = document.getElementById('calc-blank-len').value;
    const sourceQtyStr = document.getElementById('op-source-qty').value;
    const resultDiv = document.getElementById('calc-blank-result');
    const qtyInput = document.getElementById('op-qty');

    const len = window.parseRusFloat(lenStr);
    const consumedQty = window.parseRusFloat(sourceQtyStr);

    if (!sourceItem || sourceItem === 'metal') {
        resultDiv.innerHTML = 'Выберите исходный материал в поле списания.';
        if (qtyInput) qtyInput.value = '';
        return;
    }
    if (len <= 0) {
        resultDiv.innerHTML = 'Укажите длину заготовки (> 0 мм).';
        if (qtyInput) qtyInput.value = '';
        return;
    }
    if (consumedQty <= 0) {
        resultDiv.innerHTML = 'Укажите расход сырья в поле списания.';
        if (qtyInput) qtyInput.value = '';
        return;
    }

    const dirId = sourceItem.replace('belt_strip_', '').replace('metal_', '');
    const dirEntry = window.dbDirectories.find(d => String(d.id) === String(dirId));

    if (sourceItem.startsWith('belt_strip_')) {
        // Belt strip cutting: unit is meters. Each rod needs (len / 1000) meters.
        const stripNeededPerBlank = len / 1000;
        const blanksCount = Math.floor(consumedQty / stripNeededPerBlank);

        resultDiv.innerHTML = `Расход на 1 заготовку: <strong>${stripNeededPerBlank.toFixed(3)} м.п.</strong>. Расчетный выход: <strong>${blanksCount} шт</strong>`;
        if (qtyInput) qtyInput.value = blanksCount;
    } else {
        // Metal circle cutting: unit is kg.
        if (!dirEntry) {
            resultDiv.innerHTML = 'Выберите металл для получения веса погонного метра.';
            if (qtyInput) qtyInput.value = '';
            return;
        }
        const weightPerM = window.parseRusFloat(dirEntry.weight_per_m);
        if (weightPerM <= 0) {
            resultDiv.innerHTML = 'В справочнике для данного металла не указан вес 1 м.п.';
            return;
        }
        const blankWeight = weightPerM * (len / 1000);
        const blanksCount = Math.floor(consumedQty / blankWeight);

        resultDiv.innerHTML = `Вес 1 заготовки: <strong>${blankWeight.toFixed(3)} кг</strong>. Расчетный выход: <strong>${blanksCount} шт</strong>`;
        if (qtyInput) qtyInput.value = blanksCount;
    }
    window.updateLiveSummary();
};

window.onMetalSelectChange = () => {
    const sel = document.getElementById('op-metal-select');
    const hasValue = sel && sel.value !== "";
    const btnEdit = document.getElementById('btn-edit-metal');
    const btnDelete = document.getElementById('btn-delete-metal');
    if (btnEdit) btnEdit.disabled = !hasValue;
    if (btnDelete) btnDelete.disabled = !hasValue;

    if (!sel || !sel.value) {
        if (document.getElementById('op-diameter')) document.getElementById('op-diameter').value = '';
        if (document.getElementById('op-steel-type')) document.getElementById('op-steel-type').value = '';
        if (document.getElementById('op-weight-per-m')) document.getElementById('op-weight-per-m').value = '';
        if (document.getElementById('op-hardness-spec')) document.getElementById('op-hardness-spec').value = '';
        return;
    }
    const metal = (window.dbDirectories || []).find(d => String(d.id) === sel.value);
    if (metal) {
        const d = metal.data || metal;

        // Заполняем поля данными из справочника (приоритет справочнику)
        if (document.getElementById('op-supplier')) document.getElementById('op-supplier').value = d.supplier || '';
        if (document.getElementById('op-steel-type')) document.getElementById('op-steel-type').value = d.steel_type || '';
        if (document.getElementById('op-diameter')) document.getElementById('op-diameter').value = d.diameter || '';
        if (document.getElementById('op-weight-per-m')) document.getElementById('op-weight-per-m').value = d.weight_per_m || '';
        if (document.getElementById('op-hardness-spec')) document.getElementById('op-hardness-spec').value = d.hardness_spec || '';

        const inv = document.getElementById('op-invoice-num');
        if (inv && !inv.value) inv.value = d.invoice_num || '';

        const vat = document.getElementById('op-vat-rate');
        if (vat) vat.value = d.vat_rate || d.use_vat ? '1.22' : '1';

        // Автоматика для прутков
        if (document.getElementById('op-bar-len')) document.getElementById('op-bar-len').value = d.length || 6000;

        let numTonne = window.parseRusFloat(d.price || '0');
        if (numTonne > 0) {
            const Q = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');
            if (document.getElementById('op-spec-price-tonne')) document.getElementById('op-spec-price-tonne').value = numTonne.toFixed(2);
            if (document.getElementById('op-spec-unit-price')) document.getElementById('op-spec-unit-price').value = (numTonne / 1000).toFixed(2);
            if (document.getElementById('op-spec-price-tonne-vat')) document.getElementById('op-spec-price-tonne-vat').value = (numTonne * Q).toFixed(2);
            if (document.getElementById('op-spec-unit-price-vat')) document.getElementById('op-spec-unit-price-vat').value = ((numTonne * Q) / 1000).toFixed(2);
            
            if (document.getElementById('op-price-tonne')) document.getElementById('op-price-tonne').value = numTonne.toFixed(2);
            if (document.getElementById('op-unit-price')) document.getElementById('op-unit-price').value = (numTonne / 1000).toFixed(2);
        }
        window.onMetalManualCalc();
    }
};

window.onMetalManualCalc = () => {
    const barsCount = window.parseRusFloat(document.getElementById('op-bars-count')?.value || '0');
    const barLen = window.parseRusFloat(document.getElementById('op-bar-len')?.value || '0');
    const weightPerM = window.parseRusFloat(document.getElementById('op-weight-per-m')?.value || '0');
    const diam = window.parseRusFloat(document.getElementById('op-diameter')?.value || '0');

    let wpm = weightPerM;
    if (diam > 0 && wpm === 0) {
        wpm = diam * diam * 0.00616;
        if (document.getElementById('op-weight-per-m')) document.getElementById('op-weight-per-m').value = window.formatWhNumber(wpm, 3);
    }

    if (barsCount > 0 && barLen > 0 && wpm > 0) {
        const totalWeightKg = (barsCount * (barLen / 1000) * wpm);
        const qtyInput = document.getElementById('op-qty');
        if (qtyInput) {
            qtyInput.value = window.formatWhNumber(totalWeightKg, 2);
            window.onSpecFinancialCalc('qty');
        }
    }
};

window.onSpecDiameterInput = () => {
    const dia = window.parseRusFloat(document.getElementById('op-diameter').value);
    const steelType = document.getElementById('op-steel-type').value.toLowerCase();
    
    if (dia > 0) {
        let wpm = 0;
        // Если марка содержит слово "лист", считаем по листовой формуле, иначе по круглой
        if (steelType.includes('лист')) {
            wpm = parseFloat((dia * 7.85).toFixed(3));
        } else {
            wpm = parseFloat((dia * dia * 0.006165).toFixed(3));
        }
        document.getElementById('op-weight-per-m').value = wpm;
    } else {
        document.getElementById('op-weight-per-m').value = '';
    }
    
    // Сразу пересчитываем общую массу партии
    window.onMetalManualCalc();
};

window.onSpecFinancialCalc = (trigger) => {
    const Q = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');
    let G = window.parseRusFloat(document.getElementById('op-qty')?.value || '0');

    // Синхронизация Вес КГ <-> Вес Тонны
    if (trigger === 'qty_tonne') {
        const GT = window.parseRusFloat(document.getElementById('op-qty-tonne')?.value || '0');
        G = GT * 1000;
        const qtyEl = document.getElementById('op-qty');
        if (qtyEl) qtyEl.value = window.formatWhNumber(G, 2);
    } else if (trigger === 'qty') {
        const tonneEl = document.getElementById('op-qty-tonne');
        if (tonneEl) tonneEl.value = (G / 1000).toFixed(3);
    } else {
        const tonneEl = document.getElementById('op-qty-tonne');
        if (tonneEl) tonneEl.value = (G / 1000).toFixed(3);
    }

    let priceKg = window.parseRusFloat(document.getElementById('op-spec-unit-price')?.value || '0');
    let priceTonne = window.parseRusFloat(document.getElementById('op-spec-price-tonne')?.value || '0');

    if (priceTonne > 0 && trigger !== 'price' && trigger !== 'price_vat' && trigger !== 'sum_no_vat' && trigger !== 'sum_vat') {
        priceKg = priceTonne / 1000;
    }

    let sumNoVat = window.parseRusFloat(document.getElementById('op-spec-sum-no-vat')?.value || '0');
    let priceKgVat = window.parseRusFloat(document.getElementById('op-spec-unit-price-vat')?.value || '0');
    let priceTonneVat = window.parseRusFloat(document.getElementById('op-spec-price-tonne-vat')?.value || '0');
    let sumVat = window.parseRusFloat(document.getElementById('op-spec-sum-vat')?.value || '0');

    if (trigger === 'price_tonne') {
        priceKg = priceTonne / 1000;
        sumNoVat = Math.round(G * priceKg * 100) / 100;
        priceKgVat = priceKg * Q;
        priceTonneVat = priceTonne * Q;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price') {
        priceTonne = priceKg * 1000;
        sumNoVat = Math.round(G * priceKg * 100) / 100;
        priceKgVat = priceKg * Q;
        priceTonneVat = priceTonne * Q;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'sum_no_vat') {
        if (G > 0) {
            priceKg = sumNoVat / G;
            priceTonne = priceKg * 1000;
            priceKgVat = priceKg * Q;
            priceTonneVat = priceTonne * Q;
            sumVat = Math.round(sumNoVat * Q * 100) / 100;
        } else {
            sumVat = Math.round(sumNoVat * Q * 100) / 100;
        }
    } else if (trigger === 'price_tonne_vat') {
        priceTonne = priceTonneVat / Q;
        priceKg = priceTonne / 1000;
        sumNoVat = Math.round(G * priceKg * 100) / 100;
        priceKgVat = priceKg * Q;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price_vat') {
        priceKg = priceKgVat / Q;
        priceTonne = priceKg * 1000;
        sumNoVat = Math.round(G * priceKg * 100) / 100;
        priceTonneVat = priceTonne * Q;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'sum_vat') {
        sumNoVat = Math.round((sumVat / Q) * 100) / 100;
        if (G > 0) {
            priceKg = sumNoVat / G;
            priceTonne = priceKg * 1000;
            priceKgVat = priceKg * Q;
            priceTonneVat = priceTonne * Q;
        }
    } else {
        // e.g. qty/qty_tonne/vat_rate trigger
        sumNoVat = Math.round(G * priceKg * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
        priceKgVat = priceKg * Q;
        priceTonneVat = priceTonne * Q;
    }

    // Синхронизация полей ввода
    const setFmt = (id, val, dec = 2) => {
        const el = document.getElementById(id);
        if (el && el !== document.activeElement) {
            el.value = window.formatWhNumber(val, dec);
        }
    };

    setFmt('op-spec-sum-no-vat', sumNoVat);
    setFmt('op-spec-sum-vat', sumVat);
    setFmt('op-spec-unit-price', priceKg);
    setFmt('op-spec-price-tonne', priceTonne);
    setFmt('op-spec-unit-price-vat', priceKgVat);
    setFmt('op-spec-price-tonne-vat', priceTonneVat);
    setFmt('op-qty', G);
    setFmt('op-qty-tonne', G / 1000, 3);

    // Считаем прутки от веса
    const barsInput = document.getElementById('op-bars-count');
    const barLen = window.parseRusFloat(document.getElementById('op-bar-len')?.value || '6000');
    const wpm = window.parseRusFloat(document.getElementById('op-weight-per-m')?.value || '0');
    if (trigger === 'qty' && barsInput && barLen > 0 && wpm > 0) {
        barsInput.value = Math.round(G / ((barLen / 1000) * wpm));
    }

    window.updateLiveSummary();
};

window.onOperationFinancialCalc = (trigger) => {
    const type = document.getElementById('op-type').value;
    const Q = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');

    if (type === 'in_metal' || type === 'in_belt') {
        if (trigger === 'vat_rate') {
            if (document.getElementById('op-spec-unit-price')) {
                window.onSpecFinancialCalc('vat_rate');
            }
            if (document.getElementById('op-belt-spec-price-m2')) {
                window.onBeltSpecCalc('vat_rate');
            }
            if (window.currentBatch && window.currentBatch.length > 0) {
                window.currentBatch.forEach(item => {
                    item.vatRate = Q;
                    item.sumWithVat = Math.round(item.sumNoVat * Q * 100) / 100;
                    item.vatSumOnly = Math.round((item.sumWithVat - item.sumNoVat) * 100) / 100;
                });
            }
        }
        window.renderBatchTable();
        window.updateLiveSummary();
        return;
    }

    // Если поменялась ставка НДС, запускаем перерасчет в спецификации и в уже добавленной таблице
    if (trigger === 'vat_rate') {
        if (document.getElementById('op-spec-unit-price')) {
            window.onSpecFinancialCalc('vat_rate');
        }
        if (document.getElementById('op-belt-spec-price-m2')) {
            window.onBeltSpecCalc('vat_rate');
        }
        if (window.currentBatch && window.currentBatch.length > 0) {
            window.currentBatch.forEach(item => {
                item.vatRate = Q;
                item.sumWithVat = Math.round(item.sumNoVat * Q * 100) / 100;
                item.vatSumOnly = Math.round((item.sumWithVat - item.sumNoVat) * 100) / 100;
            });
            window.renderBatchTable();
        }
    }
    let delTotal = window.parseRusFloat(document.getElementById('op-delivery-cost').value);
    const delVatType = document.getElementById('op-delivery-vat-type')?.value || 'no-vat';

    // Если доставка указана с НДС, пересчитываем её в базу без НДС для расчетов
    if (delVatType === 'with-vat') {
        delTotal = delTotal / Q;
    }

    let G = window.parseRusFloat(type === 'in_belt' ? document.getElementById('op-belt-weight').value : (document.getElementById('op-qty') ? document.getElementById('op-qty').value : '0'));

    // Синхронизация Вес КГ <-> Вес Тонны
    if (trigger === 'qty_tonne') {
        const GT = window.parseRusFloat(document.getElementById('op-qty-tonne').value);
        G = GT * 1000;
        document.getElementById('op-qty').value = G.toFixed(2);
    } else if (trigger === 'qty') {
        if (document.getElementById('op-qty-tonne')) document.getElementById('op-qty-tonne').value = (G / 1000).toFixed(3);
    } else {
        // При других триггерах просто убеждаемся что тонны актуальны
        if (document.getElementById('op-qty-tonne')) document.getElementById('op-qty-tonne').value = (G / 1000).toFixed(3);
    }

    let priceKg = window.parseRusFloat(document.getElementById('op-unit-price').value);
    let priceTonne = window.parseRusFloat(document.getElementById('op-price-tonne')?.value || '0');

    if (priceTonne > 0 && trigger !== 'price' && trigger !== 'sum_no_vat' && trigger !== 'sum_vat') {
        priceKg = priceTonne / 1000;
    }

    let sumNoVat = window.parseRusFloat(document.getElementById('op-sum-no-vat').value);

    if (trigger === 'price_tonne') {
        priceKg = priceTonne / 1000;
        document.getElementById('op-unit-price').value = priceKg.toFixed(2);
        sumNoVat = G * priceKg;
    } else if (trigger === 'price') {
        priceTonne = priceKg * 1000;
        if (document.getElementById('op-price-tonne')) document.getElementById('op-price-tonne').value = priceTonne.toFixed(2);
        sumNoVat = G * priceKg;
    } else if (trigger === 'sum_no_vat') {
        if (G > 0) {
            priceKg = sumNoVat / G;
            priceTonne = priceKg * 1000;
            document.getElementById('op-unit-price').value = priceKg.toFixed(2);
            if (document.getElementById('op-price-tonne')) document.getElementById('op-price-tonne').value = priceTonne.toFixed(2);
        }
    } else if (trigger === 'sum_vat') {
        const sumVat = window.parseRusFloat(document.getElementById('op-sum-vat').value);
        if (Q > 0) {
            sumNoVat = sumVat / Q;
            document.getElementById('op-sum-no-vat').value = sumNoVat.toFixed(2);
            if (G > 0) {
                priceKg = sumNoVat / G;
                priceTonne = priceKg * 1000;
                document.getElementById('op-unit-price').value = priceKg.toFixed(2);
                if (document.getElementById('op-price-tonne')) document.getElementById('op-price-tonne').value = priceTonne.toFixed(2);
            }
        }
    } else {
        sumNoVat = G * priceKg;
    }

    // Синхронизация полей (с использованием запятых для красоты, но parseRusFloat их поймет)
    const setFmt = (id, val, dec = 2) => {
        const el = document.getElementById(id);
        if (el && el !== document.activeElement) {
            el.value = window.formatWhNumber(val, dec);
        }
    };

    const finalSumVat = Math.round(sumNoVat * Q * 100) / 100;
    const finalVatSumOnly = Math.round((finalSumVat - sumNoVat) * 100) / 100;

    setFmt('op-sum-no-vat', sumNoVat);
    setFmt('op-sum-vat', finalSumVat);
    setFmt('op-sum-vat-only', finalVatSumOnly);
    setFmt('op-unit-price', priceKg);
    setFmt('op-price-tonne', priceKg * 1000);
    setFmt('op-qty', G);
    setFmt('op-qty-tonne', G / 1000, 3);

    // ЛОГИКА: Считаем прутки от веса (Автоматизация)
    const barsInput = document.getElementById('op-bars-count');
    const barLen = window.parseRusFloat(document.getElementById('op-bar-len')?.value || '6000');
    const wpm = window.parseRusFloat(document.getElementById('op-weight-per-m')?.value || '0');
    if (trigger === 'qty' && barsInput && barLen > 0 && wpm > 0) {
        barsInput.value = Math.round(G / ((barLen / 1000) * wpm));
    }
    const summaryDetailed = document.getElementById('financial-summary-detailed');
    if (type === 'in_metal' && G > 0) {
        if (summaryDetailed) summaryDetailed.style.display = 'block';
        const weightPerM = window.parseRusFloat(document.getElementById('op-weight-per-m').value);

        const priceMNoVat = priceKg * weightPerM;
        const priceMVat = priceMNoVat * Q;
        const delMNoVat = (delTotal / G) * weightPerM;
        const delMVat = delMNoVat * Q;
        const totalMNoVat = priceMNoVat + delMNoVat;
        const totalMVat = totalMNoVat * Q;

        if (document.getElementById('res-m-price-no-vat')) document.getElementById('res-m-price-no-vat').innerText = window.formatRusCurrency(priceMNoVat);
        if (document.getElementById('res-m-price-vat')) document.getElementById('res-m-price-vat').innerText = window.formatRusCurrency(priceMVat);
        if (document.getElementById('res-m-del-no-vat')) document.getElementById('res-m-del-no-vat').innerText = window.formatRusCurrency(delMNoVat);
        if (document.getElementById('res-m-del-vat')) document.getElementById('res-m-del-vat').innerText = window.formatRusCurrency(delMVat);
        if (document.getElementById('res-m-total-no-vat')) document.getElementById('res-m-total-no-vat').innerText = window.formatRusCurrency(totalMNoVat);
        if (document.getElementById('res-m-total-vat')) document.getElementById('res-m-total-vat').innerText = window.formatRusCurrency(totalMVat);

        document.getElementById('op-total-cost').value = `${window.formatWhNumber(totalMVat)} руб/м.п (Себест. с НДС)`;
    } else {
        if (summaryDetailed) summaryDetailed.style.display = 'none';
        if (type === 'in_metal' && window.currentBatch.length > 0) {
            window.renderBatchTable();
        } else if (G > 0) {
            const perUnitCost = (sumNoVat + delTotal) * Q / G;
            const unit = OPERATIONS_CONFIG[type].target ? WAREHOUSE_CATALOG[OPERATIONS_CONFIG[type].target].unit : 'ед';
            document.getElementById('op-total-cost').value = `${window.formatWhNumber(perUnitCost)} руб/${unit}`;
        } else {
            document.getElementById('op-total-cost').value = '0.00 руб';
        }
    }

    window.updateLiveSummary();
};

window.closeOperationModal = () => {
    document.getElementById('modal-new-operation').classList.remove('active');
};

window.switchWhTab = (tabName) => {
    // Hide all tab content
    document.querySelectorAll('.wh-tab-content').forEach(el => el.classList.remove('active'));
    // Show selected tab content
    const activeTab = document.getElementById(`wh-tab-${tabName}`);
    if (activeTab) activeTab.classList.add('active');

    // Remove active class from all buttons
    document.querySelectorAll('.wh-tab-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
};

window.quickAddSupplier = async () => {
    const name = prompt("Введите имя нового контрагента / поставщика:");
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    // Check if supplier already exists in directories
    const exists = window.dbDirectories.some(d => d.name === cleanName && d.category === 'dealers');
    if (exists) {
        window.showToast("Такой контрагент уже существует!", "warning");
        document.getElementById('op-supplier').value = cleanName;
        return;
    }

    const newDealer = {
        id: 'dealer_' + Date.now(),
        name: cleanName,
        category: 'dealers',
        data: {
            id: 'dealer_' + Date.now(),
            name: cleanName,
            category: 'dealers',
            created_at: new Date().toISOString()
        }
    };

    window.dbDirectories.push(newDealer);
    if (window.supabase) {
        try {
            const { error: dirErr } = await window.supabase.from('directories').insert([{
                id: newDealer.id,
                data: newDealer.data
            }]);
            if (dirErr) {
                console.error('❌ Ошибка Supabase при добавлении контрагента (directories):', dirErr.message, '| Детали:', dirErr.details, '| Подсказка:', dirErr.hint);
            } else {
                console.log('☁️ Контрагент успешно синхронизирован с Supabase');
            }
        } catch (e) {
            console.error('Ошибка добавления поставщика в Supabase:', e);
        }
    }
    localStorage.setItem('prutkon_directories', JSON.stringify(window.dbDirectories));
    
    // Refresh suppliers lists
    const suppliers = window.dbDirectories.filter(d => d.category === 'dealers').map(d => d.name);
    const suppliersList = document.getElementById('op-suppliers-list');
    if (suppliersList) suppliersList.innerHTML = suppliers.map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');
    
    document.getElementById('op-supplier').value = cleanName;
    window.showToast("Контрагент успешно добавлен!", "success");
};

window.quickAddMetal = () => {
    // Сброс значений в полях модального окна добавления металла
    document.getElementById('qam-metal-id').value = '';
    document.getElementById('qam-title').innerHTML = `<i class="fa-solid fa-folder-plus text-brand-gold"></i> Добавление металла в справочник`;
    document.getElementById('qam-submit-btn').innerText = 'Создать и выбрать';

    document.getElementById('qam-item-type').value = 'круг';
    document.getElementById('qam-steel-type').value = '';
    document.getElementById('qam-diameter').value = '';
    document.getElementById('qam-length').value = '6000';
    document.getElementById('qam-weight-per-m').value = '';
    document.getElementById('qam-supplier').value = '';
    document.getElementById('qam-price').value = '';

    document.getElementById('modal-quick-add-metal').classList.add('active');
};

window.closeQuickAddMetalModal = () => {
    document.getElementById('modal-quick-add-metal').classList.remove('active');
};

window.onQuickAddMetalCalc = () => {
    const itemType = document.getElementById('qam-item-type').value;
    const dia = window.parseRusFloat(document.getElementById('qam-diameter').value);
    
    if (dia > 0) {
        let wpm = 0;
        if (itemType === 'круг') {
            // Формула для круглого прутка: диаметр * диаметр * 0.006165
            wpm = parseFloat((dia * dia * 0.006165).toFixed(3));
        } else if (itemType === 'лист') {
            // Формула для листа Г/К: толщина * 7.85
            wpm = parseFloat((dia * 7.85).toFixed(3));
        }
        
        if (wpm > 0) {
            document.getElementById('qam-weight-per-m').value = wpm;
        } else {
            document.getElementById('qam-weight-per-m').placeholder = "Введите вручную...";
        }
    } else {
        document.getElementById('qam-weight-per-m').value = '';
    }
};

window.editSelectedMetal = () => {
    const sel = document.getElementById('op-metal-select');
    if (!sel || !sel.value) return;
    
    const metal = (window.dbDirectories || []).find(d => String(d.id) === String(sel.value));
    if (!metal) return;
    
    const d = metal.data || metal;
    
    // Устанавливаем ID редактируемой записи
    document.getElementById('qam-metal-id').value = metal.id;
    
    // Меняем заголовок и надпись на кнопке
    document.getElementById('qam-title').innerHTML = `<i class="fa-solid fa-pen-to-square text-brand-gold"></i> Редактирование металла в справочнике`;
    document.getElementById('qam-submit-btn').innerText = 'Сохранить изменения';
    
    // Определяем вид номенклатуры
    let itemType = 'прочее';
    const lowerName = String(d.name || '').toLowerCase();
    if (lowerName.includes('круг')) {
        itemType = 'круг';
    } else if (lowerName.includes('лист')) {
        itemType = 'лист';
    }
    document.getElementById('qam-item-type').value = itemType;
    
    // Заполняем поля
    document.getElementById('qam-steel-type').value = d.steel_type || '';
    document.getElementById('qam-diameter').value = d.diameter || '';
    document.getElementById('qam-length').value = d.length || d.bar_len || 6000;
    document.getElementById('qam-weight-per-m').value = d.weight_per_m || '';
    document.getElementById('qam-supplier').value = d.supplier || '';
    document.getElementById('qam-price').value = d.price || '';
    
    document.getElementById('modal-quick-add-metal').classList.add('active');
};

window.deleteSelectedMetal = async () => {
    const sel = document.getElementById('op-metal-select');
    if (!sel || !sel.value) return;
    
    const metal = (window.dbDirectories || []).find(d => String(d.id) === String(sel.value));
    if (!metal) return;
    
    const name = metal.name || metal.id;
    if (!confirm(`Вы уверены, что хотите НАВСЕГДА удалить металл "${name}" из справочника?`)) return;
    
    // 1. Удаляем локально
    window.dbDirectories = window.dbDirectories.filter(d => String(d.id) !== String(metal.id));
    
    // 2. Удаляем из Supabase
    if (window.supabase) {
        try {
            const { error: delErr } = await window.supabase.from('directories').delete().eq('id', String(metal.id));
            if (delErr) {
                console.error("Ошибка Supabase при удалении металла:", delErr.message);
            } else {
                console.log("☁️ Запись удалена из Supabase");
            }
        } catch (err) {
            console.error("Исключение при удалении металла из Supabase:", err);
        }
    }
    
    // 3. Сохраняем в LocalStorage
    localStorage.setItem('prutkon_directories', JSON.stringify(window.dbDirectories));
    
    // 4. Обновляем селект
    window.populateMetalSelect();
    sel.value = '';
    window.onMetalSelectChange();
    
    window.showToast("Запись успешно удалена из справочника!", "success");
};


window.populateBeltSelect = () => {
    const sel = document.getElementById('op-belt-select');
    if (!sel || !window.dbDirectories) return;

    // Filter only belts
    const belts = window.dbDirectories.filter(d => d.category === 'belt' || (d.data && d.data.category === 'belt'));

    const opts = '<option value="">-- Выберите ленту из справочника --</option>' +
        belts.map(b => {
            const d = b.data || b;
            let label = d.name;
            if (!label && d.strength && d.width) {
                label = `Лента ${d.width}-EP-${d.strength}/${d.cords || '3'} ${d.cover_top || '6'}/${d.cover_bottom || '2'} ${d.rubber_class || 'W'} ${d.tu || ''}`;
            }
            if (!label) label = b.id;
            if (d.supplier) label += ` — ${d.supplier}`;
            return `<option value="${b.id}">${label}</option>`;
        }).join('');

    sel.innerHTML = opts;
};

window.onBeltSelectChange = () => {
    const sel = document.getElementById('op-belt-select');
    const hasValue = sel && sel.value !== "";
    const btnEdit = document.getElementById('btn-edit-belt');
    const btnDelete = document.getElementById('btn-delete-belt');
    if (btnEdit) btnEdit.disabled = !hasValue;
    if (btnDelete) btnDelete.disabled = !hasValue;

    if (!sel || !sel.value) {
        document.getElementById('op-belt-spec-width').value = '';
        document.getElementById('op-belt-spec-strength').value = '';
        document.getElementById('op-belt-spec-cords').value = '';
        document.getElementById('op-belt-spec-cover-top').value = '';
        document.getElementById('op-belt-spec-cover-bottom').value = '';
        document.getElementById('op-belt-spec-class').value = '';
        document.getElementById('op-belt-spec-tu').value = '';
        if (document.getElementById('op-belt-spec-thickness-plan')) document.getElementById('op-belt-spec-thickness-plan').value = '';
        if (document.getElementById('op-belt-spec-thickness-fact')) document.getElementById('op-belt-spec-thickness-fact').value = '';
        document.getElementById('op-belt-spec-price-m2').value = '';
        return;
    }

    const belt = (window.dbDirectories || []).find(d => String(d.id) === sel.value);
    if (belt) {
        const d = belt.data || belt;

        if (document.getElementById('op-belt-spec-width')) document.getElementById('op-belt-spec-width').value = d.width || '';
        if (document.getElementById('op-belt-spec-strength')) document.getElementById('op-belt-spec-strength').value = d.strength || '';
        if (document.getElementById('op-belt-spec-cords')) document.getElementById('op-belt-spec-cords').value = d.cords || '';
        if (document.getElementById('op-belt-spec-cover-top')) document.getElementById('op-belt-spec-cover-top').value = d.cover_top || '';
        if (document.getElementById('op-belt-spec-cover-bottom')) document.getElementById('op-belt-spec-cover-bottom').value = d.cover_bottom || '';
        if (document.getElementById('op-belt-spec-class')) document.getElementById('op-belt-spec-class').value = d.rubber_class || d.class || '';
        if (document.getElementById('op-belt-spec-tu')) document.getElementById('op-belt-spec-tu').value = d.tu || '';
        if (document.getElementById('op-belt-spec-thickness-plan')) document.getElementById('op-belt-spec-thickness-plan').value = d.thickness || '';
        if (document.getElementById('op-belt-spec-thickness-fact')) document.getElementById('op-belt-spec-thickness-fact').value = d.thickness || '';
        
        if (document.getElementById('op-supplier') && d.supplier) document.getElementById('op-supplier').value = d.supplier;

        let priceVal = window.parseRusFloat(d.price_m2 || d.price || '0');
        if (priceVal > 0) {
            if (document.getElementById('op-belt-spec-price-m2')) {
                document.getElementById('op-belt-spec-price-m2').value = priceVal.toFixed(2);
                window.onBeltSpecCalc('price_m2');
            }
        }
    }
};

window.quickAddBelt = () => {
    document.getElementById('qab-belt-id').value = '';
    document.getElementById('qab-title').innerHTML = `<i class="fa-solid fa-folder-plus text-brand-gold"></i> Добавление ленты в справочник`;
    document.getElementById('qab-submit-btn').innerText = 'Создать и выбрать';

    document.getElementById('qab-width').value = '';
    document.getElementById('qab-strength').value = '';
    document.getElementById('qab-cords').value = '';
    document.getElementById('qab-cover-top').value = '';
    document.getElementById('qab-cover-bottom').value = '';
    document.getElementById('qab-class').value = '';
    document.getElementById('qab-tu').value = 'ТУ 22.19.40.110-012-48991997-2019';
    document.getElementById('qab-thickness').value = '';
    document.getElementById('qab-supplier').value = '';
    document.getElementById('qab-price-m2').value = '';

    document.getElementById('modal-quick-add-belt').classList.add('active');
};

window.closeQuickAddBeltModal = () => {
    document.getElementById('modal-quick-add-belt').classList.remove('active');
};

window.editSelectedBelt = () => {
    const sel = document.getElementById('op-belt-select');
    if (!sel || !sel.value) return;

    const belt = (window.dbDirectories || []).find(d => String(d.id) === String(sel.value));
    if (!belt) return;

    const d = belt.data || belt;

    document.getElementById('qab-belt-id').value = belt.id;
    document.getElementById('qab-title').innerHTML = `<i class="fa-solid fa-pen-to-square text-brand-gold"></i> Редактирование ленты в справочнике`;
    document.getElementById('qab-submit-btn').innerText = 'Сохранить изменения';

    document.getElementById('qab-width').value = d.width || '';
    document.getElementById('qab-strength').value = d.strength || '';
    document.getElementById('qab-cords').value = d.cords || '';
    document.getElementById('qab-cover-top').value = d.cover_top || '';
    document.getElementById('qab-cover-bottom').value = d.cover_bottom || '';
    document.getElementById('qab-class').value = d.rubber_class || d.class || '';
    document.getElementById('qab-tu').value = d.tu || '';
    document.getElementById('qab-thickness').value = d.thickness || '';
    document.getElementById('qab-supplier').value = d.supplier || '';
    document.getElementById('qab-price-m2').value = d.price_m2 || d.price || '';

    document.getElementById('modal-quick-add-belt').classList.add('active');
};

window.deleteSelectedBelt = async () => {
    const sel = document.getElementById('op-belt-select');
    if (!sel || !sel.value) return;

    const belt = (window.dbDirectories || []).find(d => String(d.id) === String(sel.value));
    if (!belt) return;

    const name = belt.name || belt.id;
    if (!confirm(`Вы уверены, что хотите НАВСЕГДА удалить ленту "${name}" из справочника?`)) return;

    window.dbDirectories = window.dbDirectories.filter(d => String(d.id) !== String(belt.id));

    if (window.supabase) {
        try {
            await window.supabase.from('directories').delete().eq('id', String(belt.id));
        } catch (err) {
            console.error(err);
        }
    }

    localStorage.setItem('prutkon_directories', JSON.stringify(window.dbDirectories));
    window.populateBeltSelect();
    sel.value = '';
    window.onBeltSelectChange();
    window.showToast("Запись успешно удалена из справочника!", "success");
};

window.submitQuickAddBelt = async (e) => {
    e.preventDefault();

    const beltId = document.getElementById('qab-belt-id').value;
    const width = window.parseRusFloat(document.getElementById('qab-width').value);
    const strength = document.getElementById('qab-strength').value.trim();
    const cords = document.getElementById('qab-cords').value.trim();
    const coverTop = document.getElementById('qab-cover-top').value.trim();
    const coverBottom = document.getElementById('qab-cover-bottom').value.trim();
    const classVal = document.getElementById('qab-class').value.trim();
    const tuVal = document.getElementById('qab-tu').value.trim();
    const thickness = document.getElementById('qab-thickness').value.trim();
    const supplier = document.getElementById('qab-supplier').value.trim();
    const priceM2 = window.parseRusFloat(document.getElementById('qab-price-m2').value);

    if (!width) { window.showToast("Укажите ширину ленты!", "error"); return; }
    if (!strength) { window.showToast("Укажите прочность ленты!", "error"); return; }

    const formattedName = `Лента ${width}-EP-${strength}/${cords} ${coverTop}/${coverBottom} ${classVal} ${tuVal}`;

    const isEdit = beltId !== "";
    const activeId = isEdit ? beltId : 'belt_' + Date.now();

    const beltRecord = {
        id: activeId,
        name: formattedName,
        category: 'belt',
        width: width,
        strength: strength,
        cords: cords,
        cover_top: coverTop,
        cover_bottom: coverBottom,
        rubber_class: classVal,
        tu: tuVal,
        thickness: thickness,
        supplier: supplier,
        price_m2: priceM2,
        price: priceM2,
        data: {
            id: activeId,
            category: 'belt',
            name: formattedName,
            width: width,
            strength: strength,
            cords: cords,
            cover_top: coverTop,
            cover_bottom: coverBottom,
            rubber_class: classVal,
            tu: tuVal,
            thickness: thickness,
            supplier: supplier,
            price_m2: priceM2,
            price: priceM2,
            created_at: new Date().toISOString()
        }
    };

    if (isEdit) {
        const idx = window.dbDirectories.findIndex(d => String(d.id) === String(activeId));
        if (idx !== -1) window.dbDirectories[idx] = beltRecord;
    } else {
        window.dbDirectories.push(beltRecord);
    }

    if (window.supabase) {
        try {
            await window.supabase.from('directories').upsert([{ id: activeId, data: beltRecord.data }]);
        } catch (err) {
            console.error(err);
        }
    }

    localStorage.setItem('prutkon_directories', JSON.stringify(window.dbDirectories));
    window.populateBeltSelect();
    const selBox = document.getElementById('op-belt-select');
    if (selBox) selBox.value = activeId;
    window.onBeltSelectChange();
    window.closeQuickAddBeltModal();
    window.showToast("Запись успешно сохранена в справочнике!", "success");
};

window.submitQuickAddMetal = async (e) => {
    e.preventDefault();

    const metalId = document.getElementById('qam-metal-id').value;
    const itemType = document.getElementById('qam-item-type').value;
    const steelType = document.getElementById('qam-steel-type').value.trim();
    const diameterVal = window.parseRusFloat(document.getElementById('qam-diameter').value);
    const barLen = window.parseRusFloat(document.getElementById('qam-length').value) || 6000;
    const wpm = window.parseRusFloat(document.getElementById('qam-weight-per-m').value);
    const supplier = document.getElementById('qam-supplier').value.trim();
    const price = window.parseRusFloat(document.getElementById('qam-price').value);

    if (!steelType) { window.showToast("Укажите марку стали!", "error"); return; }
    if (diameterVal <= 0) { window.showToast("Укажите диаметр!", "error"); return; }
    if (wpm <= 0) { window.showToast("Укажите вес погонного метра!", "error"); return; }

    const formattedLen = new Intl.NumberFormat('ru-RU').format(barLen).replace(/\u00A0/g, ' ');
    
    // Формируем наименование на основе вида номенклатуры
    let name = '';
    if (itemType === 'круг') {
        name = `Круг Х/Т ${diameterVal}; ${steelType} (МД ${formattedLen})`;
    } else if (itemType === 'лист') {
        name = `Лист Г/К ${diameterVal}; ${steelType} (МД ${formattedLen})`;
    } else {
        name = `${steelType} ${diameterVal} (МД ${formattedLen})`;
    }

    const isEdit = metalId !== "";
    const activeId = isEdit ? metalId : 'metal_' + Date.now();

    // Проверяем на дубли только при добавлении
    if (!isEdit) {
        const exists = window.dbDirectories.some(d => {
            const item = d.data || d;
            return (d.category === 'metal' || item.category === 'metal') && 
                   String(item.steel_type).toLowerCase() === steelType.toLowerCase() && 
                   parseFloat(item.diameter) === diameterVal &&
                   String(item.name || '').toLowerCase().includes(itemType);
        });

        if (exists) {
            window.showToast("Такой металл уже существует в справочнике!", "warning");
            return;
        }
    }

    const metalRecord = {
        id: activeId,
        name: name,
        category: 'metal',
        steel_type: steelType,
        diameter: diameterVal,
        weight_per_m: wpm,
        length: barLen,
        supplier: supplier,
        price: price,
        data: {
            id: activeId,
            category: 'metal',
            steel_type: steelType,
            diameter: diameterVal,
            weight_per_m: wpm,
            length: barLen,
            name: name,
            supplier: supplier,
            price: price,
            created_at: new Date().toISOString()
        }
    };

    if (isEdit) {
        const idx = window.dbDirectories.findIndex(d => String(d.id) === String(activeId));
        if (idx !== -1) {
            window.dbDirectories[idx] = metalRecord;
        }
    } else {
        window.dbDirectories.push(metalRecord);
    }

    // Синхронизация с Supabase
    if (window.supabase) {
        try {
            const { error: dirErr } = await window.supabase.from('directories').upsert([{
                id: activeId,
                data: metalRecord.data
            }]);
            if (dirErr) {
                console.error('❌ Ошибка Supabase при сохранении металла (directories):', dirErr.message);
            } else {
                console.log('☁️ Металл успешно синхронизирован с Supabase');
            }
        } catch (err) {
            console.error('Ошибка добавления металла в Supabase:', err);
        }
    }

    localStorage.setItem('prutkon_directories', JSON.stringify(window.dbDirectories));
    
    // Перезаполняем селекты металлов
    window.populateMetalSelect();
    
    // Выбираем добавленный/отредактированный металл
    const sel = document.getElementById('op-metal-select');
    if (sel) {
        sel.value = activeId;
        window.onMetalSelectChange();
    }
    
    window.closeQuickAddMetalModal();
    window.showToast(isEdit ? "Запись в справочнике успешно обновлена!" : "Новый металл успешно добавлен в справочник!", "success");
};

window.resetWarehouseInventoryToZero = async () => {
    if (!confirm("Вы уверены, что хотите ОБНУЛИТЬ все остатки на складе (установить в 0) и очистить все партии металла? Это действие необратимо!")) return;
    
    // 1. Reset all keys in dbWarehouseInv to 0
    for (let key in window.dbWarehouseInv) {
        window.dbWarehouseInv[key] = 0;
    }
    
    // 2. Clear Supabase metal_batches if cloud is active
    if (window.supabase) {
        try {
            console.log("☁️ Удаление партий металла из Supabase...");
            const { error: delErr } = await window.supabase.from('metal_batches').delete().neq('id', 'null');
            if (delErr) {
                console.error("Ошибка при очистке metal_batches в Supabase:", delErr.message);
            } else {
                console.log("☁️ Партии металла успешно удалены из Supabase");
            }
        } catch (e) {
            console.error("Исключение при очистке партий в Supabase:", e);
        }
    }

    // 3. Clear metal batches locally
    window.dbMetalBatches = [];
    
    // 4. Save and sync
    await window.saveWarehouseData();
    
    // 5. Refresh UI
    window.refreshWarehouseData();
    
    window.showToast("Все остатки на складе успешно сброшены в 0!", "success");
};

window.updateOperationForm = () => {
    const type = document.getElementById('op-type').value;
    const config = OPERATIONS_CONFIG[type];

    const sourceGroup = document.getElementById('op-source-group');
    const sourceLabel = document.getElementById('op-source-label');
    const targetLabel = document.getElementById('op-target-label');

    const targetItem = config.isWriteoff ? document.getElementById('op-writeoff-item').value : config.target;
    if (targetItem && targetItem !== 'metal') {
        let currentAv = window.parseRusFloat(window.dbWarehouseInv[targetItem] || 0);
        if (WAREHOUSE_CATALOG[targetItem].unit === 'шт') currentAv = parseInt(currentAv);
        if (targetLabel) targetLabel.innerHTML = `${WAREHOUSE_CATALOG[targetItem].name} <span style="font-size:0.75rem; color:var(--brand-gold);">[Остаток: ${currentAv} ${WAREHOUSE_CATALOG[targetItem].unit}]</span>`;
    } else {
        if (targetLabel) targetLabel.innerHTML = `Металл`;
    }

    const sourceSelectWrapper = document.getElementById('op-source-select-wrapper');
    const sourceItemSelect = document.getElementById('op-source-item-select');

    if (config.source) {
        sourceGroup.style.display = 'block';
        if (type === 'prod_blank') {
            document.getElementById('op-blank-source-type-wrapper').style.display = 'block';
            window.onBlankSourceTypeChange();
        } else {
            document.getElementById('op-blank-source-type-wrapper').style.display = 'none';
            if (config.source === 'metal') {
                sourceSelectWrapper.style.display = 'block';
                const groups = {};
                for (let key in WAREHOUSE_CATALOG) {
                    if (key.startsWith('metal_')) {
                        const av = window.parseRusFloat(window.dbWarehouseInv[key] || 0);
                        const dia = getCatalogItemDia(key);
                        const label = dia ? `Диаметр: Ø${dia} мм` : 'Без диаметра';
                        if (!groups[label]) groups[label] = [];
                        groups[label].push({ key, name: WAREHOUSE_CATALOG[key].name, av });
                    }
                }
                let metalOpts = '<option value="">-- Выберите металл --</option>';
                for (let label in groups) {
                    metalOpts += `<optgroup label="${label}">`;
                    metalOpts += groups[label].map(m => `<option value="${m.key}">${window.stripTU(m.name)} (Остаток: ${m.av} кг)</option>`).join('');
                    metalOpts += `</optgroup>`;
                }
                const oldAv = window.parseRusFloat(window.dbWarehouseInv['metal'] || 0);
                if (oldAv > 0) metalOpts += `<option value="metal">Металл (Прочее) (Остаток: ${oldAv} кг)</option>`;
                sourceItemSelect.innerHTML = metalOpts;
                sourceLabel.innerText = 'Металл (кг)';
            } else if (config.source === 'belt') {
                sourceSelectWrapper.style.display = 'block';
                const groups = {};
                for (let key in WAREHOUSE_CATALOG) {
                    if (key.startsWith('belt_') && !key.startsWith('belt_blank') && !key.startsWith('belt_strip')) {
                        const av = window.parseRusFloat(window.dbWarehouseInv[key] || 0);
                        const width = getCatalogItemWidth(key);
                        const label = width ? `Ширина: ${width} мм` : 'Ленты';
                        if (!groups[label]) groups[label] = [];
                        groups[label].push({ key, name: WAREHOUSE_CATALOG[key].name, av });
                    }
                }
                let beltOpts = '<option value="">-- Выберите ленту --</option>';
                for (let label in groups) {
                    beltOpts += `<optgroup label="${label}">`;
                    beltOpts += groups[label].map(b => `<option value="${b.key}">${window.stripTU(b.name)} (Остаток: ${b.av} м.п.)</option>`).join('');
                    beltOpts += `</optgroup>`;
                }
                sourceItemSelect.innerHTML = beltOpts;
                sourceLabel.innerText = 'Лента (м.п.)';
            } else if (config.source === 'belt_blank') {
                sourceSelectWrapper.style.display = 'block';
                const groups = {};
                for (let key in WAREHOUSE_CATALOG) {
                    if (key.startsWith('belt_blank_')) {
                        const av = window.parseRusFloat(window.dbWarehouseInv[key] || 0);
                        const width = getCatalogItemWidth(key);
                        const label = width ? `Ширина: ${width} мм` : 'Заготовки';
                        if (!groups[label]) groups[label] = [];
                        groups[label].push({ key, name: WAREHOUSE_CATALOG[key].name, av });
                    }
                }
                let blankOpts = '<option value="">-- Выберите ленту-заготовку --</option>';
                for (let label in groups) {
                    blankOpts += `<optgroup label="${label}">`;
                    blankOpts += groups[label].map(b => `<option value="${b.key}">${window.stripTU(b.name)} (Остаток: ${b.av} м.п.)</option>`).join('');
                    blankOpts += `</optgroup>`;
                }
                sourceItemSelect.innerHTML = blankOpts;
                sourceLabel.innerText = 'Лента-Заготовка (м.п.)';
            } else {
                sourceSelectWrapper.style.display = 'none';
                sourceLabel.innerText = WAREHOUSE_CATALOG[config.source].name + ' (' + WAREHOUSE_CATALOG[config.source].unit + ')';
            }
        }
        window.updateSourceHint();
    } else {
        sourceGroup.style.display = 'none';
        document.getElementById('op-blank-source-type-wrapper').style.display = 'none';
    }

    // Dynamic tabs setup (1C vs standard)
    const isMetalOrBelt = (type === 'in_metal' || type === 'in_belt');
    const tabsHeader = document.getElementById('wh-tabs-header');
    const standardWrapper = document.getElementById('wh-standard-fields-wrapper');
    const incomingFields = document.getElementById('incoming-fields');
    
    if (tabsHeader) tabsHeader.style.display = isMetalOrBelt ? 'flex' : 'none';
    if (standardWrapper) standardWrapper.style.display = isMetalOrBelt ? 'none' : 'block';
    
    // Resolve duplicate ID conflicts between flat inputs and tabbed inputs
    const flatQty = document.querySelector('.wh-flat-qty');
    const flatPrice = document.querySelector('.wh-flat-price');
    const flatSum = document.querySelector('.wh-flat-sum');
    if (flatQty && flatPrice && flatSum) {
        if (isMetalOrBelt) {
            flatQty.id = 'op-flat-qty';
            flatPrice.id = 'op-flat-unit-price';
            flatSum.id = 'op-flat-sum-no-vat';
        } else {
            flatQty.id = 'op-qty';
            flatPrice.id = 'op-unit-price';
            flatSum.id = 'op-sum-no-vat';
        }
    }
    
    if (incomingFields) incomingFields.style.display = config.isIncoming ? 'flex' : 'none';
    if (document.getElementById('op-supplier-group')) document.getElementById('op-supplier-group').style.display = config.isIncoming ? 'block' : 'none';
    if (document.getElementById('op-production-group')) {
        document.getElementById('op-production-group').style.display = (config.source || config.isWriteoff) ? 'block' : 'none';
    }
    if (document.getElementById('incoming-metal-fields')) {
        document.getElementById('incoming-metal-fields').style.display = (type === 'in_metal') ? 'block' : 'none';
    }
    if (document.getElementById('incoming-belt-fields')) {
        document.getElementById('incoming-belt-fields').style.display = (type === 'in_belt') ? 'block' : 'none';
    }
    if (document.getElementById('writeoff-fields')) document.getElementById('writeoff-fields').style.display = config.isWriteoff ? 'block' : 'none';

    if (document.getElementById('belt-specs-group')) document.getElementById('belt-specs-group').style.display = 'none'; // Belts now use Tab 2!
    if (document.getElementById('blank-calc-group')) document.getElementById('blank-calc-group').style.display = (type === 'prod_blank') ? 'block' : 'none';
    if (document.getElementById('prod-belt-blank-fields')) document.getElementById('prod-belt-blank-fields').style.display = (type === 'prod_belt_blank') ? 'block' : 'none';
    if (document.getElementById('prod-belt-strip-fields')) document.getElementById('prod-belt-strip-fields').style.display = (type === 'prod_belt_strip') ? 'block' : 'none';

    const qtyGroup = document.getElementById('op-qty-group');
    if (qtyGroup) qtyGroup.style.display = (type === 'in_belt' || config.isWriteoff) ? 'none' : 'block';

    const qtyInput = document.getElementById('op-qty');
    if (qtyInput) {
        if (type === 'prod_belt_blank' || type === 'prod_belt_strip') {
            qtyInput.readOnly = true;
            qtyInput.placeholder = "Авторасчет...";
        } else if (type === 'prod_blank' && document.getElementById('blank-calc-toggle')?.checked) {
            qtyInput.readOnly = true;
            qtyInput.placeholder = "Авторасчет...";
        } else {
            qtyInput.readOnly = false;
            qtyInput.placeholder = "Количество...";
        }
    }

    const sourceQtyInput = document.getElementById('op-source-qty');
    if (sourceQtyInput) {
        if (type === 'prod_belt_blank') {
            sourceQtyInput.readOnly = true;
            sourceQtyInput.placeholder = "Весь рулон...";
        } else {
            sourceQtyInput.readOnly = false;
            sourceQtyInput.placeholder = "Расход сырья...";
        }
    }

    if (document.getElementById('op-comment-label')) {
        document.getElementById('op-comment-label').innerText = config.isWriteoff ? "Причина списания / Кто списал" : "Комментарий / Исполнитель";
    }

    if (isMetalOrBelt) {
        // Force rendering batch table and layout switch to the active tab
        window.renderBatchTable();
        const activeTabBtn = document.querySelector('.wh-tab-btn.active');
        const activeTabName = activeTabBtn ? activeTabBtn.id.replace('tab-btn-', '') : 'main';
        window.switchWhTab(activeTabName);
        
        // Show/hide doc badge
        const badge = document.getElementById('op-header-badge');
        if (badge) {
            badge.className = "badge badge-success";
            badge.innerText = "ПОСТУПЛЕНИЕ";
        }
    } else {
        // Flat layout: make Tab 1 content active and hide other tabs
        const mainTab = document.getElementById('wh-tab-main');
        if (mainTab) mainTab.classList.add('active');
        
        const itemsTab = document.getElementById('wh-tab-items');
        if (itemsTab) itemsTab.classList.remove('active');
        
        const delTab = document.getElementById('wh-tab-delivery');
        if (delTab) delTab.classList.remove('active');
        
        const badge = document.getElementById('op-header-badge');
        if (badge) {
            badge.className = config.isIncoming ? "badge status-info" : (config.isWriteoff ? "badge btn-danger" : "badge badge-warning");
            badge.innerText = config.type;
        }
    }

    if (config.isWriteoff) window.updateWriteoffHint();
    window.updateLiveSummary();
};

window.updateLiveSummary = () => {
    const type = document.getElementById('op-type').value;
    const config = OPERATIONS_CONFIG[type];
    if (!config) return;

    const qty = window.parseRusFloat(document.getElementById('op-qty')?.value || '0');
    const summaryDiv = document.getElementById('op-live-summary-footer');
    if (!summaryDiv) return;

    if (qty <= 0) { summaryDiv.innerHTML = ''; return; }

    const targetItem = config.isWriteoff ? document.getElementById('op-writeoff-item').value : config.target;
    const currentAv = window.parseRusFloat(window.dbWarehouseInv[targetItem] || 0);
    const unit = WAREHOUSE_CATALOG[targetItem]?.unit || 'кг';
    const newAv = config.isWriteoff ? currentAv - qty : currentAv + qty;

    summaryDiv.innerHTML = `
        <span style="opacity:0.7">Остаток:</span> 
        <span style="color:#fff">${window.formatWhNumber(currentAv)}</span> 
        <i class="fa-solid fa-arrow-right" style="font-size:0.7rem; margin:0 5px; opacity:0.5"></i>
        <span style="font-weight:900">${window.formatWhNumber(newAv)} ${unit}</span>
    `;
};

window.updateSourceHint = () => {
    const type = document.getElementById('op-type').value;
    const config = OPERATIONS_CONFIG[type];
    if (!config || !config.source) return;
    let sourceItem = (config.source === 'metal' && document.getElementById('op-source-item-select').value) ? document.getElementById('op-source-item-select').value : config.source;
    if (document.getElementById('op-source-hint') && WAREHOUSE_CATALOG[sourceItem]) {
        let av = window.dbWarehouseInv[sourceItem] || 0;
        document.getElementById('op-source-hint').innerText = 'На складе: ' + (WAREHOUSE_CATALOG[sourceItem].unit === 'шт' ? parseInt(av) : parseFloat(av).toFixed(2)) + ' ' + WAREHOUSE_CATALOG[sourceItem].unit;
    }
};

window.updateWriteoffHint = () => {
    const wItem = document.getElementById('op-writeoff-item').value;
    const wHint = document.getElementById('op-writeoff-hint');
    if (!wHint || !wItem) return;
    let av = window.dbWarehouseInv[wItem] || 0;
    wHint.innerText = `Доступно для списания: ${WAREHOUSE_CATALOG[wItem].unit === 'шт' ? parseInt(av) : parseFloat(av).toFixed(2)} ${WAREHOUSE_CATALOG[wItem].unit}`;
    if (document.getElementById('op-target-label')) document.getElementById('op-target-label').innerText = WAREHOUSE_CATALOG[wItem].name;
};

window.currentBatch = [];

window.addToBatch = () => {
    const metalSel = document.getElementById('op-metal-select');
    const metalId = metalSel?.value;
    const qty = window.parseRusFloat(document.getElementById('op-qty')?.value);
    const priceTonne = window.parseRusFloat(document.getElementById('op-spec-price-tonne')?.value);
    let priceKg = window.parseRusFloat(document.getElementById('op-spec-unit-price')?.value);
    if (priceTonne > 0) {
        priceKg = priceTonne / 1000;
    }
    const vatRate = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');
    const cert = document.getElementById('op-cert-num')?.value || '';
    const barsCount = parseInt(document.getElementById('op-bars-count')?.value || '0');
    const barLen = window.parseRusFloat(document.getElementById('op-bar-len')?.value || '6000');
    const hSpec = document.getElementById('op-hardness-spec')?.value || '';
    const hFact = document.getElementById('op-hardness-fact')?.value || '';

    if (!metalId) { window.showToast('Выберите металл из справочника!', 'error'); return; }
    if (qty <= 0) { window.showToast('Укажите вес (кг) в спецификации!', 'error'); return; }
    if (priceKg <= 0) { window.showToast('Укажите цену закупки!', 'error'); return; }

    const metalObj = (window.dbDirectories || []).find(d => String(d.id) === String(metalId));
    const d = metalObj?.data || metalObj || {};
    const selText = metalSel && metalSel.selectedIndex >= 0 ? metalSel.options[metalSel.selectedIndex].text : '';

    let wpm = window.parseRusFloat(document.getElementById('op-weight-per-m')?.value);
    if (wpm <= 0) wpm = parseFloat(d.weight_per_m) || (parseFloat(d.diameter || 0) * parseFloat(d.diameter || 0) * 0.006165) || 1.5;

    const steelType = document.getElementById('op-steel-type')?.value || d.steel_type || selText || 'Металл';
    const diameterVal = window.parseRusFloat(document.getElementById('op-diameter')?.value || d.diameter || 0);

    // Уважаем точные копейки, которые вычислены в полях ввода, либо вычисляем с округлением
    const inputSumNoVat = window.parseRusFloat(document.getElementById('op-spec-sum-no-vat')?.value);
    const inputSumWithVat = window.parseRusFloat(document.getElementById('op-spec-sum-vat')?.value);

    const sumNoVat = !isNaN(inputSumNoVat) && inputSumNoVat > 0 ? inputSumNoVat : Math.round(qty * priceKg * 100) / 100;
    const sumWithVat = !isNaN(inputSumWithVat) && inputSumWithVat > 0 ? inputSumWithVat : Math.round(sumNoVat * vatRate * 100) / 100;
    const vatSumOnly = Math.round((sumWithVat - sumNoVat) * 100) / 100;

    const formattedLen = new Intl.NumberFormat('ru-RU').format(barLen || 6000).replace(/\u00A0/g, ' ');
    const calculatedName = (steelType && diameterVal) ? `Круг Х/Т ${diameterVal}; ${steelType} (МД ${formattedLen})` : (d.name || selText || metalId);

    window.currentBatch.push({
        id: metalId,
        name: calculatedName,
        steel_type: steelType,
        diameter: diameterVal,
        bar_len: barLen,
        weight_per_m: wpm,
        qty: qty,
        bars_count: barsCount,
        priceKg: priceKg,
        priceTonne: priceTonne || (priceKg * 1000),
        sumNoVat: sumNoVat,
        sumWithVat: sumWithVat,
        vatSumOnly: vatSumOnly,
        vatRate: vatRate,
        cert: cert,
        hardness_spec: hSpec,
        hardness_fact: hFact,
        isBelt: false
    });

    // Clear spec form fields
    if (document.getElementById('op-cert-num')) document.getElementById('op-cert-num').value = '';
    if (document.getElementById('op-qty')) document.getElementById('op-qty').value = '';
    if (document.getElementById('op-qty-tonne')) document.getElementById('op-qty-tonne').value = '';
    if (document.getElementById('op-spec-unit-price')) document.getElementById('op-spec-unit-price').value = '';
    if (document.getElementById('op-spec-price-tonne')) document.getElementById('op-spec-price-tonne').value = '';
    if (document.getElementById('op-spec-sum-no-vat')) document.getElementById('op-spec-sum-no-vat').value = '';
    if (document.getElementById('op-spec-sum-vat')) document.getElementById('op-spec-sum-vat').value = '';
    if (document.getElementById('op-bars-count')) document.getElementById('op-bars-count').value = '';
    if (document.getElementById('op-hardness-spec')) document.getElementById('op-hardness-spec').value = '';
    if (document.getElementById('op-hardness-fact')) document.getElementById('op-hardness-fact').value = '';

    window.renderBatchTable();
};

window.renderBatchTable = () => {
    const container = document.getElementById('op-batch-container');
    const costingContainer = document.getElementById('op-costing-breakdown-container');
    const totalsStrip = document.getElementById('wh-doc-totals-strip');
    const badgeCount = document.getElementById('op-tab-items-count');

    // Update items count badge
    if (badgeCount) badgeCount.innerText = window.currentBatch.length;

    if (!container) return;

    if (window.currentBatch.length === 0) {
        container.innerHTML = `<div style="opacity:0.5; padding: 25px; text-align:center; border: 1px dashed rgba(255,255,255,0.1); border-radius:12px;">Спецификация пуста. Выберите номенклатуру, заполните параметры и нажмите кнопку "Добавить позицию".</div>`;
        if (costingContainer) costingContainer.innerHTML = `<div style="opacity:0.5; padding: 25px; text-align:center; border: 1px dashed rgba(255,255,255,0.1); border-radius:12px;">Нет данных для анализа. Добавьте хотя бы один металл в спецификацию.</div>`;
        if (totalsStrip) totalsStrip.style.display = 'none';
        
        // Clear Tab 3 inputs
        const sumNoVatEl = document.getElementById('op-sum-no-vat');
        const sumVatOnlyEl = document.getElementById('op-sum-vat-only');
        const sumVatEl = document.getElementById('op-sum-vat');
        const unitPriceEl = document.getElementById('op-unit-price');
        const priceTonneEl = document.getElementById('op-price-tonne');
        const overallCostsEl = document.getElementById('op-overall-costs');
        const totalCostEl = document.getElementById('op-total-cost');
        
        if (sumNoVatEl) sumNoVatEl.value = '0.00';
        if (sumVatOnlyEl) sumVatOnlyEl.value = '0.00';
        if (sumVatEl) sumVatEl.value = '0.00';
        if (unitPriceEl) unitPriceEl.value = '0.00';
        if (priceTonneEl) priceTonneEl.value = '0.00';
        if (overallCostsEl) overallCostsEl.value = '0.00 руб';
        if (totalCostEl) totalCostEl.value = '0.00 руб';

        const summaryDetailed = document.getElementById('financial-summary-detailed');
        if (summaryDetailed) summaryDetailed.style.display = 'none';
        return;
    }

    if (totalsStrip) totalsStrip.style.display = 'block';

    let deliveryCostTotalInput = window.parseRusFloat(document.getElementById('op-delivery-cost')?.value || '0');
    const delVatType = document.getElementById('op-delivery-vat-type')?.value || 'no-vat';
    const distMethod = document.getElementById('op-delivery-dist-method')?.value || 'weight';
    const vatRate = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');

    // Calculate advanced multi-weight totals
    let totalMetalsWeightKg = 0;
    let totalBeltsWeightKg = 0;
    let totalBeltsMeters = 0;
    let totalMetalBars = 0;
    let totalBeltRolls = 0;

    window.currentBatch.forEach(item => {
        if (item.isBelt) {
            totalBeltsMeters += item.qty;
            totalBeltsWeightKg += (item.qty * (item.weight_per_m || 0));
            totalBeltRolls += (item.bars_count || 1);
        } else {
            totalMetalsWeightKg += item.qty;
            totalMetalBars += (item.bars_count || 0);
        }
    });

    const totalWeightKg = totalMetalsWeightKg + totalBeltsWeightKg;
    const totalWeightTons = totalWeightKg / 1000;
    const totalWeight = Math.round(window.currentBatch.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;

    const totalSumNoVat = Math.round(window.currentBatch.reduce((sum, item) => sum + item.sumNoVat, 0) * 100) / 100;
    const totalSumVat = Math.round(window.currentBatch.reduce((sum, item) => sum + item.sumWithVat, 0) * 100) / 100;
    const totalSumVatOnly = Math.round((totalSumVat - totalSumNoVat) * 100) / 100;

    // Set totals strip values
    if (document.getElementById('doc-total-weight')) {
        let weightStr = `${window.formatWhNumber(totalWeightKg, 1)} кг (${totalWeightTons.toFixed(3)} т)`;
        if (totalBeltsMeters > 0) {
            weightStr += ` | ${window.formatWhNumber(totalBeltsMeters, 1)} м.п.`;
        }
        document.getElementById('doc-total-weight').innerText = weightStr;
    }
    
    if (document.getElementById('doc-total-bars')) {
        let barsStr = '';
        if (totalMetalBars > 0 && totalBeltRolls > 0) {
            barsStr = `${totalMetalBars} шт / ${totalBeltRolls} рул`;
        } else if (totalMetalBars > 0) {
            barsStr = `${totalMetalBars} шт`;
        } else if (totalBeltRolls > 0) {
            barsStr = `${totalBeltRolls} рул`;
        } else {
            barsStr = '0 шт';
        }
        document.getElementById('doc-total-bars').innerText = barsStr;
    }

    const labelEl = document.getElementById('doc-total-bars-label');
    if (labelEl) {
        if (totalMetalBars > 0 && totalBeltRolls > 0) {
            labelEl.innerText = "Всего изделий / рулонов";
        } else if (totalBeltRolls > 0) {
            labelEl.innerText = "Всего рулонов";
        } else {
            labelEl.innerText = "Всего прутков";
        }
    }

    if (document.getElementById('doc-total-sum-no-vat')) document.getElementById('doc-total-sum-no-vat').innerText = `${window.formatWhNumber(totalSumNoVat, 2)} руб`;
    if (document.getElementById('doc-total-sum-vat-only')) document.getElementById('doc-total-sum-vat-only').innerText = `${window.formatWhNumber(totalSumVatOnly, 2)} руб`;
    if (document.getElementById('doc-total-sum-vat')) document.getElementById('doc-total-sum-vat').innerText = `${window.formatWhNumber(totalSumVat, 2)} руб`;

    const type = document.getElementById('op-type').value;

    // Overall cost with delivery
    const finalDeliveryCost = (delVatType === 'with-vat') ? deliveryCostTotalInput : (deliveryCostTotalInput * vatRate);
    const overall = totalSumVat + finalDeliveryCost;

    if (document.getElementById('op-overall-costs')) {
        document.getElementById('op-overall-costs').value = `${window.formatWhNumber(overall, 2)} руб`;
    }

    if (document.getElementById('op-total-cost') && (type === 'in_metal' || type === 'in_belt') && totalWeight > 0) {
        const avgPriceWithVat = overall / totalWeight;
        const unit = type === 'in_belt' ? 'м.п.' : 'кг';
        document.getElementById('op-total-cost').value = `${window.formatWhNumber(avgPriceWithVat, 2)} руб/${unit} (Средняя с НДС)`;
    }

    // Dynamic update of Tab 3 inputs and detailed summary box
    const sumNoVatEl = document.getElementById('op-sum-no-vat');
    const sumVatOnlyEl = document.getElementById('op-sum-vat-only');
    const sumVatEl = document.getElementById('op-sum-vat');
    const unitPriceEl = document.getElementById('op-unit-price');
    const priceTonneEl = document.getElementById('op-price-tonne');

    if (sumNoVatEl) sumNoVatEl.value = window.formatWhNumber(totalSumNoVat, 2);
    if (sumVatOnlyEl) sumVatOnlyEl.value = window.formatWhNumber(totalSumVatOnly, 2);
    if (sumVatEl) sumVatEl.value = window.formatWhNumber(totalSumVat, 2);

    // Switch labels & fill prices
    const labelPriceTonne = document.querySelector('label[for="op-price-tonne"]') || document.getElementById('op-price-tonne')?.previousElementSibling;
    const labelUnitPrice = document.querySelector('label[for="op-unit-price"]') || document.getElementById('op-unit-price')?.previousElementSibling;

    if (type === 'in_belt') {
        if (labelPriceTonne) labelPriceTonne.innerText = "Средняя за 1 м2 (БЕЗ НДС)";
        if (labelUnitPrice) labelUnitPrice.innerText = "Средняя за 1 м.п. (БЕЗ НДС)";

        // Average price per meter
        const avgPriceMpNoVat = totalWeight > 0 ? totalSumNoVat / totalWeight : 0;
        if (unitPriceEl) unitPriceEl.value = window.formatWhNumber(avgPriceMpNoVat, 2);

        // Average price per m2
        let totalAreaM2 = 0;
        window.currentBatch.forEach(item => {
            if (item.isBelt) {
                const widthFactor = item.diameter > 0 ? item.diameter / 1000 : 1.0;
                totalAreaM2 += item.qty * widthFactor;
            }
        });
        const avgPriceM2NoVat = totalAreaM2 > 0 ? totalSumNoVat / totalAreaM2 : 0;
        if (priceTonneEl) priceTonneEl.value = window.formatWhNumber(avgPriceM2NoVat, 2);

    } else if (type === 'in_metal') {
        if (labelPriceTonne) labelPriceTonne.innerText = "Цена за Тонну (БЕЗ НДС)";
        if (labelUnitPrice) labelUnitPrice.innerText = "Цена за 1 кг (БЕЗ НДС)";

        // Average price per kg
        const avgPriceKgNoVat = totalWeight > 0 ? totalSumNoVat / totalWeight : 0;
        if (unitPriceEl) unitPriceEl.value = window.formatWhNumber(avgPriceKgNoVat, 2);
        if (priceTonneEl) priceTonneEl.value = window.formatWhNumber(avgPriceKgNoVat * 1000, 2);
    }

    // Recalculate #financial-summary-detailed detailed bottom panel
    const summaryDetailed = document.getElementById('financial-summary-detailed');
    if (summaryDetailed) {
        if ((type === 'in_metal' || type === 'in_belt') && totalWeight > 0) {
            summaryDetailed.style.display = 'block';

            // Calculate total base delivery cost allocated
            const deliveryBaseTotal = (delVatType === 'with-vat') ? (deliveryCostTotalInput / vatRate) : deliveryCostTotalInput;

            let totalLengthM = 0;
            if (type === 'in_belt') {
                totalLengthM = totalWeight; // totalBeltsMeters
            } else {
                // metals
                window.currentBatch.forEach(item => {
                    const wpm = window.parseRusFloat(item.weight_per_m) || 1.5;
                    totalLengthM += item.qty / wpm;
                });
            }

            if (totalLengthM > 0) {
                const avgPriceMNoVat = totalSumNoVat / totalLengthM;
                const avgPriceMVat = avgPriceMNoVat * vatRate;
                
                const avgDelMNoVat = deliveryBaseTotal / totalLengthM;
                const avgDelMVat = avgDelMNoVat * vatRate;
                
                const avgTotalMNoVat = avgPriceMNoVat + avgDelMNoVat;
                const avgTotalMVat = avgTotalMNoVat * vatRate;

                if (document.getElementById('res-m-price-no-vat')) document.getElementById('res-m-price-no-vat').innerText = window.formatRusCurrency(avgPriceMNoVat);
                if (document.getElementById('res-m-price-vat')) document.getElementById('res-m-price-vat').innerText = window.formatRusCurrency(avgPriceMVat);
                if (document.getElementById('res-m-del-no-vat')) document.getElementById('res-m-del-no-vat').innerText = window.formatRusCurrency(avgDelMNoVat);
                if (document.getElementById('res-m-del-vat')) document.getElementById('res-m-del-vat').innerText = window.formatRusCurrency(avgDelMVat);
                if (document.getElementById('res-m-total-no-vat')) document.getElementById('res-m-total-no-vat').innerText = window.formatRusCurrency(avgTotalMNoVat);
                if (document.getElementById('res-m-total-vat')) document.getElementById('res-m-total-vat').innerText = window.formatRusCurrency(avgTotalMVat);
            } else {
                if (document.getElementById('res-m-price-no-vat')) document.getElementById('res-m-price-no-vat').innerText = '0.00 руб';
                if (document.getElementById('res-m-price-vat')) document.getElementById('res-m-price-vat').innerText = '0.00 руб';
                if (document.getElementById('res-m-del-no-vat')) document.getElementById('res-m-del-no-vat').innerText = '0.00 руб';
                if (document.getElementById('res-m-del-vat')) document.getElementById('res-m-del-vat').innerText = '0.00 руб';
                if (document.getElementById('res-m-total-no-vat')) document.getElementById('res-m-total-no-vat').innerText = '0.00 руб';
                if (document.getElementById('res-m-total-vat')) document.getElementById('res-m-total-vat').innerText = '0.00 руб';
            }
        } else {
            summaryDetailed.style.display = 'none';
        }
    }

    // Dynamic rendering of Specification Grid (Tab 2)
    let specHtml = `
        <div class="table-wrapper" style="border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.15); margin-top: 15px;">
            <table class="data-table" style="min-width: 900px;">
                <thead>
                    <tr>
                        <th style="padding:10px 15px; font-size:0.7rem; width: 40px;">№</th>
                        <th style="padding:10px 15px; font-size:0.7rem;">Номенклатура</th>
                        <th style="padding:10px 15px; font-size:0.7rem;">Плавка / Серт.</th>
                        <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Количество</th>
                        <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Единиц</th>
                        <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Цена/Ед без НДС</th>
                        <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Сумма без НДС</th>
                        <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Сумма с НДС</th>
                        <th style="padding:10px 15px; font-size:0.7rem; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
    `;

    window.currentBatch.forEach((item, idx) => {
        const qtyUnit = item.isBelt ? 'м.п.' : 'кг';
        const barsUnit = item.isBelt ? 'рул' : 'шт';
        const priceVal = item.isBelt ? item.priceKg : item.priceTonne;

        specHtml += `
            <tr>
                <td style="padding:8px 15px;">${idx + 1}</td>
                <td style="padding:8px 15px;">
                    <span style="font-weight:700; color:#fff;">${item.name}</span>
                    <div style="font-size:0.7rem; color:var(--text-muted);">
                        ${item.isBelt ? `Толщина ПЛАН: ${item.hardness_spec || '—'} | Толщина ФАКТ: ${item.hardness_fact || '—'} | Вес: ${item.weight_per_m && item.qty ? Math.round(item.weight_per_m * item.qty) : '0'} кг` : `Сталь: ${item.steel_type} | Диаметр: ${item.diameter} мм | Длина: ${item.bar_len} мм`}
                    </div>
                </td>
                <td style="padding:8px 15px;">
                    <span style="font-family: monospace; font-size:0.75rem; color:var(--brand-gold);">${item.cert || 'б/с'}</span>
                </td>
                <td style="padding:8px 15px;" class="text-right one-c-badge-numeric">${window.formatWhNumber(item.qty, 1)} ${qtyUnit}</td>
                <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--text-secondary);">${item.bars_count} ${barsUnit}</td>
                <td style="padding:8px 15px;" class="text-right one-c-badge-numeric">${window.formatWhNumber(priceVal, 2)}</td>
                <td style="padding:8px 15px;" class="text-right one-c-badge-numeric">${window.formatWhNumber(item.sumNoVat, 2)}</td>
                <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--emerald-neon); font-weight:900;">${window.formatWhNumber(item.sumWithVat, 2)}</td>
                <td style="padding:8px 15px; text-align:center;">
                    <button type="button" class="action-btn" onclick="window.currentBatch.splice(${idx}, 1); window.renderBatchTable();" style="color:var(--brand-red); border-color:rgba(226,31,38,0.2); background:rgba(226,31,38,0.05);" title="Удалить позицию">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    specHtml += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = specHtml;

    // Dynamic rendering of Costing Breakdown Grid (Tab 3) - REDESIGNED FOR KG/MP BASED LOGISTICS
    if (costingContainer) {
        const priceUnitLabel = type === 'in_belt' ? 'м.п.' : 'кг';
        let costingHtml = `
            <div class="table-wrapper" style="border-radius:12px; border:1px solid rgba(255,180,0,0.08); background:rgba(0,0,0,0.15); margin-top: 15px;">
                <table class="data-table" style="min-width: 900px;">
                    <thead>
                        <tr>
                            <th style="padding:10px 15px; font-size:0.7rem; width: 40px;">№</th>
                            <th style="padding:10px 15px; font-size:0.7rem;">Номенклатура</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Кол-во (${priceUnitLabel})</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Цена закупки за ${priceUnitLabel} (без НДС)</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Доставка позиции (без НДС, руб)</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Доля доставки (% к цене)</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right">Доставка за 1 ${priceUnitLabel} (руб)</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right" style="color:var(--brand-gold);">Себест. за ${priceUnitLabel} (без НДС)</th>
                            <th style="padding:10px 15px; font-size:0.7rem;" class="text-right" style="color:var(--emerald-neon);">Себест. за ${priceUnitLabel} (с НДС)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        window.currentBatch.forEach((item, idx) => {
            const Q = item.vatRate || vatRate;

            // Delivery allocation share calculation
            let share = 0;
            if (distMethod === 'sum') {
                share = totalSumNoVat > 0 ? item.sumNoVat / totalSumNoVat : 0;
            } else {
                share = totalWeight > 0 ? item.qty / totalWeight : 0;
            }

            const itemDeliveryTotal = deliveryCostTotalInput * share;
            const itemDeliveryTotalBase = Math.round(((delVatType === 'with-vat') ? (itemDeliveryTotal / Q) : itemDeliveryTotal) * 100) / 100;
            
            // Delivery cost per unit (kg or meter)
            const deliveryPerKg = item.qty > 0 ? itemDeliveryTotalBase / item.qty : 0;
            
            // Delivery cost as % of specific position purchase cost
            const deliveryPercentOfCost = item.sumNoVat > 0 ? (itemDeliveryTotalBase / item.sumNoVat) * 100 : 0;

            const primeCostNoVatPerKg = item.priceKg + deliveryPerKg;
            const primeCostWithVatPerKg = primeCostNoVatPerKg * Q;

            costingHtml += `
                <tr>
                    <td style="padding:8px 15px;">${idx + 1}</td>
                    <td style="padding:8px 15px;">
                        <span style="font-weight:700; color:#fff;">${item.name}</span>
                    </td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric">${window.formatWhNumber(item.qty, 1)}</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric">${window.formatWhNumber(item.priceKg, 2)}</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--brand-gold);">${window.formatWhNumber(itemDeliveryTotalBase, 2)}</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--brand-gold);">${deliveryPercentOfCost.toFixed(2)}%</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--brand-red); opacity:0.8;">+ ${window.formatWhNumber(deliveryPerKg, 2)}</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--brand-gold); font-weight:700;">${window.formatWhNumber(primeCostNoVatPerKg, 2)}</td>
                    <td style="padding:8px 15px;" class="text-right one-c-badge-numeric" style="color:var(--emerald-neon); font-weight:900;">${window.formatWhNumber(primeCostWithVatPerKg, 2)}</td>
                </tr>
            `;
        });

        costingHtml += `
                    </tbody>
                </table>
            </div>
        `;
        costingContainer.innerHTML = costingHtml;
    }

};
window.saveOperation = async () => {
    const type = document.getElementById('op-type').value;
    const config = OPERATIONS_CONFIG[type];
    
    // Read 1C header metadata
    const docNumber = document.getElementById('op-doc-num')?.value || 'ПМ-00000';
    const docDate = document.getElementById('op-doc-date')?.value || new Date().toISOString();
    const supplier = document.getElementById('op-supplier')?.value || 'Не указан';
    const contract = document.getElementById('op-contract')?.value || '';
    const invoiceNum = document.getElementById('op-invoice-num')?.value || '';
    const invoiceDate = document.getElementById('op-invoice-date')?.value || '';
    const destination = document.getElementById('op-destination')?.value || 'Основной склад';
    const responsible = document.getElementById('op-responsible')?.value || window.currentUser?.name || 'Система';
    const comment = document.getElementById('op-comment')?.value || '';

    const deliveryTotal = window.parseRusFloat(document.getElementById('op-delivery-cost')?.value || '0');
    const delVatType = document.getElementById('op-delivery-vat-type')?.value || 'no-vat';
    const distMethod = document.getElementById('op-delivery-dist-method')?.value || 'weight';
    const vatRate = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');

    let itemsToProcess = [];

    // Dedicated custom production handler for Edge Trimming and Slicing operations
    if (type === 'prod_belt_blank' || type === 'prod_belt_strip') {
        const sourceItem = document.getElementById('op-source-item-select').value;
        const sourceQty = window.parseRusFloat(document.getElementById('op-source-qty')?.value || '0');
        const qty = window.parseRusFloat(document.getElementById('op-qty')?.value || '0');

        if (!sourceItem) { window.showToast('Выберите исходный элемент!', 'error'); return; }
        if (sourceQty <= 0) { window.showToast('Укажите расход сырья!', 'error'); return; }
        if (qty <= 0) { window.showToast('Укажите объем выпуска!', 'error'); return; }

        const currentAv = window.parseRusFloat(window.dbWarehouseInv[sourceItem] || 0);
        if (currentAv < sourceQty) {
            window.showToast(`Недостаточно сырья на складе! Доступно: ${currentAv} м.п.`, 'error');
            return;
        }

        const sourceDirId = sourceItem.replace('belt_blank_', '').replace('belt_', '');
        const sourceDir = window.dbDirectories.find(d => String(d.id) === String(sourceDirId));
        if (!sourceDir) { window.showToast('Исходная номенклатура не найдена в справочнике!', 'error'); return; }

        const sourceD = sourceDir.data || sourceDir;

        let targetId = '';
        let targetName = '';
        let cardData = {};

        if (type === 'prod_belt_blank') {
            const margin = window.parseRusFloat(document.getElementById('op-belt-trim-margin').value || '25');
            const targetWidth = parseFloat(document.getElementById('op-belt-trim-target-width').value || '890');
            const targetPriceM2 = parseFloat(document.getElementById('op-belt-trim-target-price-m2').value || '0');
            const sourcePriceMp = parseFloat(sourceD.price_m_no_vat || sourceD.price_mp || sourceD.price || 0);

            targetId = 'belt_blank_' + Date.now();
            targetName = `Лента-Заготовка ${targetWidth}-EP-${sourceD.strength || sourceD.steel_type || '1200'}/${sourceD.cords || 3} ${sourceD.cover_top || 6}/${sourceD.cover_bottom || 2} ${sourceD.rubber_class || 'W'} ${sourceD.tu || ''}`;

            cardData = {
                id: targetId,
                name: targetName,
                category: 'belt_blank',
                width: targetWidth,
                diameter: targetWidth, // store in diameter for DB schema safety
                strength: sourceD.strength || sourceD.steel_type || '1200',
                steel_type: sourceD.strength || sourceD.steel_type || '1200',
                cords: sourceD.cords || 3,
                cover_top: sourceD.cover_top || 6,
                cover_bottom: sourceD.cover_bottom || 2,
                rubber_class: sourceD.rubber_class || 'W',
                tu: sourceD.tu || '',
                thickness: sourceD.thickness || '',
                weight_per_m2: sourceD.weight_per_m2 || '',
                price_m2: targetPriceM2,
                price_mp: sourcePriceMp,
                price: sourcePriceMp, // standard price property
                price_m_no_vat: sourcePriceMp,
                length: qty,
                area: qty * (targetWidth / 1000),
                weight: qty * (sourceD.weight_per_m || 1.5),
                vat_rate: sourceD.vat_rate || 1.22,
                supplier: sourceD.supplier || 'Внутреннее производство',
                date_arrival: new Date().toISOString().split('T')[0],
                source_belt_ref: sourceItem,
                invoice_num: invoiceNum || docNumber,
                invoice_date: invoiceDate,
                responsible: responsible
            };
        } else {
            const stripWidth = parseFloat(document.getElementById('op-belt-strip-width').value || '22');
            const stripCount = parseInt(document.getElementById('op-belt-strip-count').value || '0');
            const priceMp = parseFloat(document.getElementById('op-belt-strip-price-mp').value || '0');

            targetId = 'belt_strip_' + Date.now();
            targetName = `Лента-Полоса ${stripWidth} мм (из заготовки ${sourceD.width || sourceD.diameter || 890} мм)`;

            cardData = {
                id: targetId,
                name: targetName,
                category: 'belt_strip',
                width: stripWidth,
                diameter: stripWidth, // store in diameter for DB schema safety
                thickness: sourceD.thickness || '',
                length: qty,
                price_mp: priceMp,
                price: priceMp, // standard price property
                price_m_no_vat: priceMp,
                weight: qty * (sourceD.weight_per_m || 1.5) / (stripCount || 1),
                vat_rate: sourceD.vat_rate || 1.22,
                supplier: sourceD.supplier || 'Внутреннее производство',
                date_arrival: new Date().toISOString().split('T')[0],
                source_blank_ref: sourceItem,
                invoice_num: invoiceNum || docNumber,
                invoice_date: invoiceDate,
                responsible: responsible
            };
        }

        // 1. Deduct source inventory
        if (type === 'prod_belt_blank') {
            window.dbWarehouseInv[sourceItem] = 0; // Полное списание рулона
        } else {
            window.dbWarehouseInv[sourceItem] = currentAv - sourceQty;
        }

        // 2. Add directory entry
        const dirObj = { id: targetId, category: cardData.category, name: targetName, data: cardData };
        window.dbDirectories.push(dirObj);

        // 3. Add to catalog
        WAREHOUSE_CATALOG[targetId] = {
            name: targetName,
            unit: 'м.п.',
            icon: type === 'prod_belt_blank' ? 'fa-box-tissue' : 'fa-grip-lines-vertical'
        };

        // 4. Add target inventory
        window.dbWarehouseInv[targetId] = qty;

        // 5. Audit Log
        let detailsStr = `Производство на [${destination}]: +${window.formatWhNumber(qty, 1)} м.п. (${targetName}) (Расход: ${window.formatWhNumber(sourceQty, 1)} м.п. ${WAREHOUSE_CATALOG[sourceItem]?.name || sourceItem})`;
        let changesPayload = {
            source: { item: sourceItem, qty: -sourceQty },
            target: { item: targetId, qty: qty }
        };

        window.dbWarehouseLog.push({
            id: Date.now() + Math.random(),
            date: new Date(docDate).toLocaleString(),
            type: config.type,
            details: detailsStr,
            comment: `Склад: ${destination} | Отв: ${responsible} | Исходная партия: ${sourceD.invoice_num || '—'} | ${comment}`,
            changes: changesPayload,
            user: responsible,
            attachments: window.opUploadedAttachments || []
        });

        // 6. Cloud sync directory entry
        if (window.supabase) {
            try {
                const { error: dirErr } = await window.supabase.from('directories').insert([{ id: targetId, data: cardData }]);
                if (dirErr) console.error('❌ Ошибка Supabase при сохранении directories:', dirErr.message);
            } catch (err) {
                console.error('Ошибка directories Supabase:', err);
            }
        }

        window.saveWarehouseData();
        window.refreshWarehouseData();
        window.closeOperationModal();
        window.showToast(`Операция ${docNumber} успешно проведена в системе!`, 'success');
        return;
    }

    if ((type === 'in_metal' || type === 'in_belt') && window.currentBatch.length > 0) {
        itemsToProcess = [...window.currentBatch];
    } else {
        const qty = window.parseRusFloat(document.getElementById('op-qty')?.value);
        if (qty <= 0) { window.showToast('Укажите количество!', 'error'); return; }

        const metalSel = document.getElementById('op-metal-select');
        const metalId = config.isWriteoff ? document.getElementById('op-writeoff-item').value : (metalSel?.value || config.target);
        const metalObj = (window.dbDirectories || []).find(d => String(d.id) === String(metalId));
        const d = metalObj?.data || metalObj || {};
        const selText = metalSel && metalSel.selectedIndex >= 0 ? metalSel.options[metalSel.selectedIndex].text : '';
        
        const steelType = document.getElementById('op-steel-type')?.value || d.steel_type || selText || 'Металл';
        const diameterVal = window.parseRusFloat(document.getElementById('op-diameter')?.value || d.diameter || 0);
        const wpmVal = window.parseRusFloat(document.getElementById('op-weight-per-m')?.value || d.weight_per_m || 0);
        const barsVal = parseInt(document.getElementById('op-bars-count')?.value || d.bars_count || 0);
        const barLenVal = window.parseRusFloat(document.getElementById('op-bar-len')?.value || d.bar_len || 6000);
        const hSpecVal = document.getElementById('op-hardness-spec')?.value || d.hardness_spec || '';
        const hFactVal = document.getElementById('op-hardness-fact')?.value || '';

        const formattedLen = new Intl.NumberFormat('ru-RU').format(barLenVal || 6000).replace(/\u00A0/g, ' ');
        const calculatedName = (steelType && diameterVal) ? `Круг Х/Т ${diameterVal}; ${steelType} (МД ${formattedLen})` : (d.name || selText || metalId);

        itemsToProcess.push({
            id: metalId,
            qty: qty,
            priceKg: window.parseRusFloat(document.getElementById('op-unit-price')?.value || 0),
            priceTonne: window.parseRusFloat(document.getElementById('op-price-tonne')?.value || 0),
            supplier: supplier,
            name: calculatedName,
            steel_type: steelType,
            diameter: diameterVal,
            weight_per_m: wpmVal > 0 ? wpmVal : (diameterVal > 0 ? diameterVal * diameterVal * 0.006165 : 1.5),
            bars_count: barsVal,
            bar_len: barLenVal,
            hardness_spec: hSpecVal,
            hardness_fact: hFactVal,
            vatRate: vatRate,
            cert: document.getElementById('op-cert-num')?.value || ''
        });
    }

    const totalWeight = Math.round(itemsToProcess.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;
    const totalSumNoVat = Math.round(itemsToProcess.reduce((sum, item) => sum + (item.qty * item.priceKg), 0) * 100) / 100;

    for (const item of itemsToProcess) {
        let fullId = item.id;
        const itemCategory = item.isBelt ? 'belt' : 'metal';

        if (itemCategory === 'metal') {
            fullId = String(fullId).startsWith('metal_') ? fullId : `metal_${fullId}`;
        } else {
            fullId = String(fullId).startsWith('belt_') ? fullId : `belt_${fullId}`;
        }

        const Q = item.vatRate || vatRate;
        const G = item.qty / 1000;
        const H = item.priceKg * 1000;
        const C = item.weight_per_m;

        // Base price formulas (with exact 2-decimal rounded precision)
        const I = item.sumNoVat || Math.round(item.qty * item.priceKg * 100) / 100;
        const J = item.sumWithVat || Math.round(I * Q * 100) / 100;
        
        const K = item.isBelt ? item.priceKg : (H / 1000) * C;
        const L = K * Q;

        // Delivery share allocation (1C style)
        let share = 0;
        if (distMethod === 'sum') {
            share = totalSumNoVat > 0 ? (item.qty * item.priceKg) / totalSumNoVat : 0;
        } else {
            share = totalWeight > 0 ? item.qty / totalWeight : 0;
        }

        const itemDeliveryTotal = deliveryTotal * share;
        const itemDeliveryTotalBase = Math.round(((delVatType === 'with-vat') ? (itemDeliveryTotal / Q) : itemDeliveryTotal) * 100) / 100;
        
        const deliveryPerKg = item.qty > 0 ? itemDeliveryTotalBase / item.qty : 0;
        const M = item.isBelt ? deliveryPerKg : deliveryPerKg * C; // Delivery per meter

        const N = M * Q;
        const O = K + M;
        const P = O * Q;

        const cardData = {
            id: fullId,
            name: item.name,
            length: item.bar_len || 6000,
            category: itemCategory,
            steel_type: item.steel_type,
            diameter: item.diameter,
            weight_per_m: C,
            bar_len: item.bar_len || 6000,
            qty_kg: item.qty,
            qty_tonne: G,
            price_tonne: H,
            price: H,
            delivery_total: itemDeliveryTotal,
            use_vat: Q > 1.0,

            sum_no_vat: I,
            sum_vat: J,
            price_m_no_vat: K,
            price_m_vat: L,
            del_m_no_vat: M,
            del_m_vat: N,
            total_m_no_vat: O,
            total_m_vat: P,

            vat_rate: Q,
            supplier: supplier,
            date_arrival: docDate.split('T')[0],

            hardness_spec: item.hardness_spec || '',
            hardness_fact: item.hardness_fact || '',
            actual_bars_count: item.bars_count || 0,
            melt_num: item.cert || '',
            certificate: item.cert || '',
            doc_number: docNumber,
            doc_date: docDate,
            contract_num: contract,
            invoice_num: invoiceNum,
            invoice_date: invoiceDate,
            responsible: responsible
        };

        // Handle source consumption for production operations
        let sourceItem = null;
        let sourceQty = 0;
        if (config.source) {
            const sourceSel = document.getElementById('op-source-item-select');
            sourceItem = (config.source === 'metal' && sourceSel && sourceSel.value) 
                ? sourceSel.value 
                : config.source;
            sourceQty = window.parseRusFloat(document.getElementById('op-source-qty')?.value || '0');
            
            if (sourceQty > 0 && sourceItem) {
                window.dbWarehouseInv[sourceItem] = (window.dbWarehouseInv[sourceItem] || 0) - sourceQty;
            }
        }

        // Update inventory in database
        if (config.isWriteoff) {
            window.dbWarehouseInv[fullId] = (window.dbWarehouseInv[fullId] || 0) - item.qty;
        } else {
            window.dbWarehouseInv[fullId] = (window.dbWarehouseInv[fullId] || 0) + item.qty;
        }

        // Structured 1C comment logging
        let logComment = `Склад: ${destination} | Отв: ${responsible}`;
        if (contract) logComment += ` | Дог: ${contract}`;
        if (invoiceNum) logComment += ` | Накл: ${invoiceNum}`;
        if (item.cert) logComment += ` | Плавка: ${item.cert}`;
        if (comment) logComment += ` | Комм: ${comment}`;

        let detailsStr = '';
        let changesPayload = {};

        if (config.isWriteoff) {
            detailsStr = `Списание с [${destination}]: -${window.formatWhNumber(item.qty, 1)} ${WAREHOUSE_CATALOG[fullId]?.unit || 'кг'} (${item.name || WAREHOUSE_CATALOG[fullId]?.name || fullId})`;
            changesPayload = { target: { item: fullId, qty: -item.qty } };
        } else if (sourceItem && sourceQty > 0) {
            detailsStr = `Изготовление на [${destination}]: +${window.formatWhNumber(item.qty, 1)} ${WAREHOUSE_CATALOG[fullId]?.unit || 'ед'} (${item.name || WAREHOUSE_CATALOG[fullId]?.name || fullId}) (Расход: ${window.formatWhNumber(sourceQty, 1)} ${WAREHOUSE_CATALOG[sourceItem]?.unit || 'кг'} ${WAREHOUSE_CATALOG[sourceItem]?.name || sourceItem})`;
            changesPayload = {
                source: { item: sourceItem, qty: -sourceQty },
                target: { item: fullId, qty: item.qty }
            };
        } else {
            detailsStr = `Приход на [${destination}]: +${window.formatWhNumber(item.qty, 1)} ${WAREHOUSE_CATALOG[fullId]?.unit || 'ед'} (${item.name || WAREHOUSE_CATALOG[fullId]?.name || fullId})`;
            changesPayload = { target: { item: fullId, qty: item.qty } };
        }

        window.dbWarehouseLog.push({
            id: Date.now() + Math.random(),
            date: new Date(docDate).toLocaleString(),
            type: config.type,
            details: detailsStr,
            comment: logComment,
            changes: changesPayload,
            user: responsible,
            attachments: window.opUploadedAttachments || []
        });

        if (window.supabase && (type === 'in_metal' || type === 'in_belt')) {
            const { error: dirErr } = await window.supabase.from('directories').upsert({ id: fullId, data: cardData });
            if (dirErr) {
                console.error('❌ Ошибка Supabase при сохранении карточки номенклатуры (directories):', dirErr.message);
            } else {
                console.log('☁️ Карточка номенклатуры успешно сохранена в directories в Supabase');
            }
        }

        // Save Batch (including precise distributed delivery cost!)
        if (type === 'in_metal' || type === 'in_belt') {
            const batchRecord = {
                id: 'batch_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                invoice: invoiceNum || docNumber,
                doc_number: docNumber,
                doc_date: docDate,
                contract_num: contract,
                invoice_date: invoiceDate,
                name: item.name || 'Товар',
                steel_type: item.steel_type || '',
                dia: parseFloat(item.diameter || 0),
                diameter: parseFloat(item.diameter || 0),
                qty: item.qty,
                weight: item.isBelt ? item.qty * C : item.qty, // Total weight for belt is length * weight_per_m
                available_weight: item.qty,
                total_weight: item.qty,
                price_ton: H,
                price: H,
                deliveryCost: itemDeliveryTotalBase,
                vat_rate: Q,
                supplier: supplier,
                responsible: responsible,
                hardness_spec: item.hardness_spec || '',
                hardness_fact: item.hardness_fact || '',
                bars_count: item.bars_count || 0,
                bar_len: item.bar_len || 0,
                melt_num: item.cert || '',
                certificate: item.cert || '',
                date: docDate,
                isBelt: item.isBelt || false,
                created_at: new Date().toISOString()
            };
            if (!window.dbMetalBatches) window.dbMetalBatches = [];
            window.dbMetalBatches.push(batchRecord);
            localStorage.setItem('prutkon_warehouse_batches', JSON.stringify(window.dbMetalBatches));
            if (window.supabase) {
                try {
                    const { error: batchErr } = await window.supabase.from('metal_batches').insert([{
                        id: batchRecord.id,
                        data: batchRecord
                    }]);
                    if (batchErr) {
                        console.error('❌ Ошибка Supabase при создании партии (metal_batches):', batchErr.message);
                    } else {
                        console.log('☁️ Партия успешно сохранена в metal_batches в Supabase');
                    }
                } catch (err) {
                    console.error('Ошибка вставки партии в Supabase:', err);
                }
            }
        }
    }

    window.currentBatch = [];
    window.saveWarehouseData();
    window.refreshWarehouseData();
    window.closeOperationModal();
    window.showToast(`Операция ${docNumber} успешно проведена в системе!`, 'success');
};

window.onBeltSpecInput = () => {
    // Left empty: calculated dynamically in addBeltToBatch for robust name generation
};

window.onBeltSpecCalc = (trigger) => {
    const Q = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');
    const width = window.parseRusFloat(document.getElementById('op-belt-spec-width')?.value || '0');
    let len = window.parseRusFloat(document.getElementById('op-belt-spec-len')?.value || '0');
    let area = window.parseRusFloat(document.getElementById('op-belt-spec-area-m2')?.value || '0');
    const weight = window.parseRusFloat(document.getElementById('op-belt-spec-weight')?.value || '0');

    let priceM2 = window.parseRusFloat(document.getElementById('op-belt-spec-price-m2')?.value || '0');
    let priceMp = window.parseRusFloat(document.getElementById('op-belt-spec-price-mp')?.value || '0');
    let priceM2Vat = window.parseRusFloat(document.getElementById('op-belt-spec-price-m2-vat')?.value || '0');
    let priceMpVat = window.parseRusFloat(document.getElementById('op-belt-spec-price-mp-vat')?.value || '0');
    let sumNoVat = window.parseRusFloat(document.getElementById('op-belt-spec-sum-no-vat')?.value || '0');
    let sumVat = window.parseRusFloat(document.getElementById('op-belt-spec-sum-vat')?.value || '0');

    const widthFactor = width > 0 ? width / 1000 : 1.0;

    if (trigger === 'area') {
        if (widthFactor > 0) {
            len = Math.round((area / widthFactor) * 100) / 100;
        }
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'qty') {
        area = Math.round((len * widthFactor) * 100) / 100;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'width') {
        priceMp = Math.round(priceM2 * widthFactor * 100) / 100;
        priceM2Vat = priceM2 * Q;
        priceMpVat = priceMp * Q;
        area = Math.round((len * widthFactor) * 100) / 100;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price_m2') {
        priceMp = Math.round(priceM2 * widthFactor * 100) / 100;
        priceM2Vat = priceM2 * Q;
        priceMpVat = priceMp * Q;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price_mp') {
        priceM2 = widthFactor > 0 ? Math.round((priceMp / widthFactor) * 100) / 100 : 0;
        priceM2Vat = priceM2 * Q;
        priceMpVat = priceMp * Q;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price_m2_vat') {
        priceM2 = priceM2Vat / Q;
        priceMp = Math.round(priceM2 * widthFactor * 100) / 100;
        priceMpVat = priceMp * Q;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'price_mp_vat') {
        priceMp = priceMpVat / Q;
        priceM2 = widthFactor > 0 ? Math.round((priceMp / widthFactor) * 100) / 100 : 0;
        priceM2Vat = priceM2 * Q;
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
    } else if (trigger === 'sum_no_vat') {
        if (len > 0) {
            priceMp = sumNoVat / len;
            priceM2 = widthFactor > 0 ? Math.round((priceMp / widthFactor) * 100) / 100 : 0;
            priceM2Vat = priceM2 * Q;
            priceMpVat = priceMp * Q;
            sumVat = Math.round(sumNoVat * Q * 100) / 100;
        } else {
            sumVat = Math.round(sumNoVat * Q * 100) / 100;
        }
    } else if (trigger === 'sum_vat') {
        sumNoVat = Math.round((sumVat / Q) * 100) / 100;
        if (len > 0) {
            priceMp = sumNoVat / len;
            priceM2 = widthFactor > 0 ? Math.round((priceMp / widthFactor) * 100) / 100 : 0;
            priceM2Vat = priceM2 * Q;
            priceMpVat = priceMp * Q;
        }
    } else {
        if (widthFactor > 0 && area > 0 && len === 0) {
            len = Math.round((area / widthFactor) * 100) / 100;
        } else if (widthFactor > 0 && len > 0) {
            area = Math.round((len * widthFactor) * 100) / 100;
        }
        sumNoVat = Math.round(len * priceMp * 100) / 100;
        sumVat = Math.round(sumNoVat * Q * 100) / 100;
        priceM2Vat = priceM2 * Q;
        priceMpVat = priceMp * Q;
    }

    const totalM2 = area > 0 ? area : len * widthFactor;
    if (totalM2 > 0 && weight > 0) {
        document.getElementById('op-belt-spec-wpm2').value = (weight / totalM2).toFixed(2);
    } else {
        document.getElementById('op-belt-spec-wpm2').value = '';
    }

    const setFmt = (id, val, dec = 2) => {
        const el = document.getElementById(id);
        if (el && el !== document.activeElement) {
            el.value = window.formatWhNumber(val, dec);
        }
    };

    setFmt('op-belt-spec-area-m2', area);
    setFmt('op-belt-spec-len', len);
    setFmt('op-belt-spec-price-m2', priceM2);
    setFmt('op-belt-spec-price-mp', priceMp);
    setFmt('op-belt-spec-sum-no-vat', sumNoVat);
    setFmt('op-belt-spec-price-m2-vat', priceM2Vat);
    setFmt('op-belt-spec-price-mp-vat', priceMpVat);
    setFmt('op-belt-spec-sum-vat', sumVat);
};

window.addBeltToBatch = () => {
    const width = window.parseRusFloat(document.getElementById('op-belt-spec-width')?.value || '940');
    const strength = document.getElementById('op-belt-spec-strength')?.value || '1200';
    const cords = document.getElementById('op-belt-spec-cords')?.value || '3';
    const coverTop = document.getElementById('op-belt-spec-cover-top')?.value || '6';
    const coverBottom = document.getElementById('op-belt-spec-cover-bottom')?.value || '2';
    const classVal = document.getElementById('op-belt-spec-class')?.value || 'W';
    const tuVal = document.getElementById('op-belt-spec-tu')?.value || 'ТУ 22.19.40.110-012-48991997-2019';
    const certVal = document.getElementById('op-belt-spec-cert')?.value || '2602-293';
    const thicknessPlan = document.getElementById('op-belt-spec-thickness-plan')?.value || '';
    const thicknessFact = document.getElementById('op-belt-spec-thickness-fact')?.value || '';

    const len = window.parseRusFloat(document.getElementById('op-belt-spec-len')?.value || '0');
    const weight = window.parseRusFloat(document.getElementById('op-belt-spec-weight')?.value || '0');
    const priceM2 = window.parseRusFloat(document.getElementById('op-belt-spec-price-m2')?.value || '0');
    const priceMp = window.parseRusFloat(document.getElementById('op-belt-spec-price-mp')?.value || '0');
    const sumNoVat = window.parseRusFloat(document.getElementById('op-belt-spec-sum-no-vat')?.value || '0');
    const sumWithVat = window.parseRusFloat(document.getElementById('op-belt-spec-sum-vat')?.value || '0');
    const vatRate = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');

    if (len <= 0) { window.showToast('Укажите длину рулона (м.п.)!', 'error'); return; }
    if (priceMp <= 0) { window.showToast('Укажите цену за м.п. без НДС!', 'error'); return; }

    const formattedName = `Лента ${width}-EP-${strength}/${cords} ${coverTop}/${coverBottom} ${classVal} ${tuVal}${certVal ? " (" + certVal + ")" : ""}`;

    window.currentBatch.push({
        id: 'belt_' + Date.now(),
        name: formattedName,
        steel_type: `EP-${strength}/${cords}`, // Store belt parameters in existing directory mappings!
        diameter: width, // Store width in diameter to prevent database structural changes!
        weight_per_m: weight > 0 && len > 0 ? weight / len : 1.5, // Store roll weight per meter!
        qty: len, // Quantity is running meters!
        priceKg: priceMp, // Price per kg is price per running meter!
        priceTonne: priceM2, // Store price per m2 in priceTonne for reference!
        vatRate: vatRate,
        sumNoVat: sumNoVat,
        vatSumOnly: Math.round((sumWithVat - sumNoVat) * 100) / 100,
        sumWithVat: sumWithVat,
        cert: certVal,
        bars_count: 1, // Store rolls count in bars_count!
        bar_len: len,
        hardness_spec: thicknessPlan ? `${thicknessPlan} мм` : '',
        hardness_fact: thicknessFact ? `${thicknessFact} мм` : '',
        supplier: document.getElementById('op-supplier')?.value || '',
        isBelt: true // Flag to distinguish belts in printing and costing tables!
    });

    window.renderBatchTable();
    window.showToast('Позиция ленты успешно добавлена в спецификацию!', 'success');

    // Clear fields
    document.getElementById('op-belt-spec-width').value = '';
    document.getElementById('op-belt-spec-strength').value = '';
    document.getElementById('op-belt-spec-cords').value = '';
    document.getElementById('op-belt-spec-cover-top').value = '';
    document.getElementById('op-belt-spec-cover-bottom').value = '';
    document.getElementById('op-belt-spec-class').value = '';
    document.getElementById('op-belt-spec-tu').value = '';
    document.getElementById('op-belt-spec-cert').value = '';
    if (document.getElementById('op-belt-spec-thickness-plan')) document.getElementById('op-belt-spec-thickness-plan').value = '';
    if (document.getElementById('op-belt-spec-thickness-fact')) document.getElementById('op-belt-spec-thickness-fact').value = '';
    document.getElementById('op-belt-spec-area-m2').value = '';
    document.getElementById('op-belt-spec-len').value = '';
    document.getElementById('op-belt-spec-weight').value = '';
    document.getElementById('op-belt-spec-wpm2').value = '';
    document.getElementById('op-belt-spec-price-m2').value = '';
    document.getElementById('op-belt-spec-price-mp').value = '';
    document.getElementById('op-belt-spec-sum-no-vat').value = '';
    document.getElementById('op-belt-spec-price-m2-vat').value = '';
    document.getElementById('op-belt-spec-price-mp-vat').value = '';
    document.getElementById('op-belt-spec-sum-vat').value = '';
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('warehouse.html')) {
        window.initWarehouse();
        window.renderInventory();
        window.renderMetrics();
        window.renderLog();
    }
});
window.printOperationReceipt = () => {
    const hasBelt = window.currentBatch.some(item => item.isBelt);
    if (window.currentBatch.length === 0) { window.showToast('Список пуст!', 'error'); return; }

    const docNumber = document.getElementById('op-doc-num')?.value || 'ПМ-00000';
    const docDate = document.getElementById('op-doc-date')?.value ? new Date(document.getElementById('op-doc-date').value).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
    const sup = document.getElementById('op-supplier')?.value || 'Не указан';
    const contract = document.getElementById('op-contract')?.value || 'б/д';
    const invoiceNum = document.getElementById('op-invoice-num')?.value || 'б/н';
    const invoiceDate = document.getElementById('op-invoice-date')?.value ? new Date(document.getElementById('op-invoice-date').value).toLocaleDateString('ru-RU') : '';
    const dest = document.getElementById('op-destination')?.value || 'Основной склад';
    const responsible = document.getElementById('op-responsible')?.value || 'Не указан';
    const deliveryTotal = window.parseRusFloat(document.getElementById('op-delivery-cost')?.value || '0');
    const delVatType = document.getElementById('op-delivery-vat-type')?.value || 'no-vat';
    const distMethod = document.getElementById('op-delivery-dist-method')?.value || 'weight';
    const vatRate = window.parseRusFloat(document.getElementById('op-vat-rate')?.value || '1.22');

    // Sum document totals exactly using rounded values
    const totalWeight = Math.round(window.currentBatch.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;
    const totalBars = window.currentBatch.reduce((sum, item) => sum + item.bars_count, 0);
    const totalSumNoVat = Math.round(window.currentBatch.reduce((sum, item) => sum + item.sumNoVat, 0) * 100) / 100;
    const totalSumVat = Math.round(window.currentBatch.reduce((sum, item) => sum + item.sumWithVat, 0) * 100) / 100;
    
    let printHtml = `
        <html>
        <head>
            <title>Приходный ордер № ${docNumber} - ПРУТКОН</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; color: #000; font-size: 11px; line-height: 1.4; }
                .sheet-header { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .sheet-header td { border: none; padding: 2px; }
                .document-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
                .org-info { border-bottom: 1px solid #000; font-weight: bold; font-size: 12px; padding-bottom: 4px; margin-bottom: 20px; }
                
                table.data-grid { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 10px; }
                table.data-grid th, table.data-grid td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
                table.data-grid th { background: #e0e0e0; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 9px; }
                
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                
                .sign-strip { width: 100%; border-collapse: collapse; margin-top: 40px; }
                .sign-strip td { border: none; padding: 8px 0; }
                .sign-line { border-bottom: 1px solid #000; width: 150px; display: inline-block; margin: 0 10px; }
                
                .stamp-box { border: 2px dashed #ccc; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #aaa; border-radius: 50%; margin: 10px auto; text-transform: uppercase; text-align: center; }
            </style>
        </head>
        <body>
            <table class="sheet-header">
                <tr>
                    <td class="bold" style="font-size: 12px;">ООО "ПРУТКОН"</td>
                    <td class="text-right" style="font-size: 9px; color: #666;">
                        Типовая межотраслевая форма № М-4<br>
                        Утверждена постановлением Госкомстата России от 30.10.97 № 71а
                    </td>
                </tr>
            </table>

            <div class="document-title">
                ПРИХОДНЫЙ ОРДЕР № ${docNumber}<br>
                <span style="font-size: 12px; font-weight: normal;">от ${docDate} г.</span>
            </div>

            <table class="sheet-header" style="background: #fdfdfd; border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <tr>
                    <td>Склад получатель: <b>${dest}</b></td>
                    <td>Поставщик: <b>${sup}</b></td>
                </tr>
                <tr>
                    <td>Договор: <b>${contract}</b></td>
                    <td>Сопр. документ: <b>${invoiceNum} ${invoiceDate ? 'от ' + invoiceDate : ''}</b></td>
                </tr>
                <tr>
                    <td>Исполнитель: <b>${responsible}</b></td>
                    <td>Статус: <b>Проведен</b></td>
                </tr>
            </table>

            <table class="data-grid">
                <thead>
                    <tr>
                        <th rowspan="2">№</th>
                        <th rowspan="2">Материал (Наименование, Характеристики)</th>
                        <th rowspan="2">Плавка / Сертификат</th>
                        <th rowspan="2">${hasBelt ? "Единиц" : "Прутков (шт)"}</th>
                        <th rowspan="2">${hasBelt ? "Кол-во (м.п. / кг)" : "Масса (кг)"}</th>
                        <th colspan="2">Стоимость закупки</th>
                        <th colspan="3">Транспортные расходы</th>
                        <th rowspan="2">Всего с НДС (руб)</th>
                    </tr>
                    <tr>
                        <th>Цена за ${hasBelt ? "ед" : "кг"}</th>
                        <th>Сумма без НДС</th>
                        <th>Доля доставки (% к цене)</th>
                        <th>Доставка позиции (без НДС, руб)</th>
                        <th>Доставка за ${hasBelt ? "ед" : "кг"} (руб)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    window.currentBatch.forEach((item, idx) => {
        const Q = item.vatRate || vatRate;

        let share = 0;
        if (distMethod === 'sum') {
            share = totalSumNoVat > 0 ? item.sumNoVat / totalSumNoVat : 0;
        } else {
            share = totalWeight > 0 ? item.qty / totalWeight : 0;
        }

        const itemDeliveryTotal = deliveryTotal * share;
        const itemDeliveryTotalBase = Math.round(((delVatType === 'with-vat') ? (itemDeliveryTotal / Q) : itemDeliveryTotal) * 100) / 100;
        
        const deliveryPerKg = item.qty > 0 ? itemDeliveryTotalBase / item.qty : 0;
        const deliveryPercentOfCost = item.sumNoVat > 0 ? (itemDeliveryTotalBase / item.sumNoVat) * 100 : 0;

        const totalItemCostWithVat = Math.round((item.sumWithVat + (itemDeliveryTotalBase * Q)) * 100) / 100;

        printHtml += `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>
                    <b>${item.name}</b>
                    <div style="font-size:8px; color:#555; margin-top:2px;">
                        Сталь: ${item.steel_type} | Диаметр: ${item.diameter} мм
                    </div>
                </td>
                <td class="text-center">${item.cert || 'б/с'}</td>
                <td class="text-right">${item.bars_count}</td>
                <td class="text-right bold">${window.formatWhNumber(item.qty, 1)}</td>
                <td class="text-right">${window.formatWhNumber(item.priceKg, 2)}</td>
                <td class="text-right">${window.formatWhNumber(item.sumNoVat, 2)}</td>
                <td class="text-right">${deliveryPercentOfCost.toFixed(2)}%</td>
                <td class="text-right">${window.formatWhNumber(itemDeliveryTotalBase, 2)}</td>
                <td class="text-right">${window.formatWhNumber(deliveryPerKg, 2)}</td>
                <td class="text-right bold">${window.formatWhNumber(totalItemCostWithVat, 2)}</td>
            </tr>
        `;
    });

    const finalDeliveryCost = (delVatType === 'with-vat') ? deliveryTotal : deliveryTotal * vatRate;
    const finalInvoiceTotal = totalSumVat + finalDeliveryCost;

    printHtml += `
            <tr style="background:#f0f0f0; font-weight:bold;">
                <td colspan="3" class="text-center">ИТОГО ПО НАКЛАДНОЙ:</td>
                <td class="text-right">${totalBars}</td>
                <td class="text-right">${window.formatWhNumber(totalWeight, 1)}</td>
                <td></td>
                <td class="text-right">${window.formatWhNumber(totalSumNoVat, 2)}</td>
                <td class="text-right">100%</td>
                <td class="text-right">${window.formatWhNumber(delVatType === 'with-vat' ? deliveryTotal / vatRate : deliveryTotal, 2)}</td>
                <td></td>
                <td class="text-right" style="font-size:11px;">${window.formatWhNumber(totalSumVat, 2)}</td>
            </tr>
        </tbody>
    </table>

    <div style="float: left; width: 60%; font-size: 10px;">
        Транспортно-заготовительные расходы (ТЗР): <b>${window.formatWhNumber(deliveryTotal, 2)} руб</b> (НДС: ${delVatType === 'with-vat' ? 'с НДС' : 'без НДС'})<br>
        Способ распределения ТЗР: <b>${distMethod === 'weight' ? 'Пропорционально весу' : 'Пропорционально стоимости'}</b>
    </div>
    
    <div style="float: right; width: 40%; text-align: right; margin-bottom: 20px;">
        <table style="width:100%; border:none; font-size:11px;">
            <tr style="border:none;"><td style="border:none; padding:4px;" class="text-right">Спецификация с НДС:</td><td style="border:none; padding:4px; width:120px;" class="text-right bold">${window.formatWhNumber(totalSumVat, 2)} р.</td></tr>
            <tr style="border:none;"><td style="border:none; padding:4px;" class="text-right">Транспортные услуги (с НДС):</td><td style="border:none; padding:4px;" class="text-right bold">${window.formatWhNumber(finalDeliveryCost, 2)} р.</td></tr>
            <tr style="border:none; font-size:12px; font-weight:bold;"><td style="border:none; padding:4px;" class="text-right">ВСЕГО ПО ОРДЕРУ:</td><td style="border:none; padding:4px;" class="text-right">${window.formatWhNumber(finalInvoiceTotal, 2)} р.</td></tr>
        </table>
    </div>
    <div style="clear:both;"></div>

    <table class="sign-strip">
        <tr>
            <td width="33%">
                Принял материальные ценности:<br><br>
                Кладовщик <span class="sign-line"></span> / <span class="bold">${responsible}</span>
            </td>
            <td width="33%" class="text-center">
                <div class="stamp-box">ООО "ПРУТКОН"<br>Складской учет<br>ДЛЯ ДОКУМЕНТОВ</div>
            </td>
            <td width="33%" class="text-right">
                Сдал материальные ценности:<br><br>
                Поставщик/Экспедитор <span class="sign-line"></span> / __________________
            </td>
        </tr>
    </table>

    <script>window.print();<\/script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
};

window.onSourceQtyInput = () => {
    const type = document.getElementById('op-type').value;
    if (type === 'prod_blank') {
        window.doBlankCalc();
    } else if (type === 'prod_belt_blank') {
        window.calculateBeltTrimming();
    } else if (type === 'prod_belt_strip') {
        window.calculateBeltSlicing();
    }
    window.updateLiveSummary();
};

window.onBlankSourceTypeChange = () => {
    const sourceType = document.getElementById('op-blank-source-type').value;
    const sourceSelectWrapper = document.getElementById('op-source-select-wrapper');
    const sourceItemSelect = document.getElementById('op-source-item-select');
    const sourceLabel = document.getElementById('op-source-label');

    sourceSelectWrapper.style.display = 'block';

    if (sourceType === 'metal') {
        const groups = {};
        for (let key in WAREHOUSE_CATALOG) {
            if (key.startsWith('metal_')) {
                const av = window.parseRusFloat(window.dbWarehouseInv[key] || 0);
                const dia = getCatalogItemDia(key);
                const label = dia ? `Диаметр: Ø${dia} мм` : 'Без диаметра';
                if (!groups[label]) groups[label] = [];
                groups[label].push({ key, name: WAREHOUSE_CATALOG[key].name, av });
            }
        }
        let metalOpts = '<option value="">-- Выберите металл --</option>';
        for (let label in groups) {
            metalOpts += `<optgroup label="${label}">`;
            metalOpts += groups[label].map(m => `<option value="${m.key}">${window.stripTU(m.name)} (Остаток: ${m.av} кг)</option>`).join('');
            metalOpts += `</optgroup>`;
        }
        const oldAv = window.parseRusFloat(window.dbWarehouseInv['metal'] || 0);
        if (oldAv > 0) metalOpts += `<option value="metal">Металл (Прочее) (Остаток: ${oldAv} кг)</option>`;
        sourceItemSelect.innerHTML = metalOpts;
        sourceLabel.innerText = 'Металл (кг)';
    } else if (sourceType === 'belt_strip') {
        const groups = {};
        for (let key in WAREHOUSE_CATALOG) {
            if (key.startsWith('belt_strip_')) {
                const av = window.parseRusFloat(window.dbWarehouseInv[key] || 0);
                const width = getCatalogItemWidth(key);
                const label = width ? `Ширина: ${width} мм` : 'Полосы';
                if (!groups[label]) groups[label] = [];
                groups[label].push({ key, name: WAREHOUSE_CATALOG[key].name, av });
            }
        }
        let stripOpts = '<option value="">-- Выберите ленту-полосу --</option>';
        for (let label in groups) {
            stripOpts += `<optgroup label="${label}">`;
            stripOpts += groups[label].map(s => `<option value="${s.key}">${window.stripTU(s.name)} (Остаток: ${s.av} м.п.)</option>`).join('');
            stripOpts += `</optgroup>`;
        }
        sourceItemSelect.innerHTML = stripOpts;
        sourceLabel.innerText = 'Лента-Полоса (м.п.)';
    }
    window.updateSourceHint();
};

window.onSourceItemSelectChange = () => {
    const type = document.getElementById('op-type').value;
    const sourceItem = document.getElementById('op-source-item-select').value;
    if (!sourceItem) return;

    const dirId = sourceItem.replace('belt_blank_', '').replace('belt_strip_', '').replace('belt_', '').replace('metal_', '');
    const dirEntry = window.dbDirectories.find(d => String(d.id) === String(dirId));
    if (!dirEntry) return;

    const dObj = dirEntry.data || dirEntry;

    if (type === 'prod_belt_blank') {
        const av = window.parseRusFloat(window.dbWarehouseInv[sourceItem] || 0);
        const sourceQtyInput = document.getElementById('op-source-qty');
        if (sourceQtyInput) {
            sourceQtyInput.value = av;
        }
        const width = parseFloat(dObj.diameter || dObj.width || dObj.width_plan || 940);
        document.getElementById('op-belt-trim-margin').value = 25;
        window.calculateBeltTrimming();
    } else if (type === 'prod_belt_strip') {
        document.getElementById('op-belt-strip-width').value = 22;
        window.calculateBeltSlicing();
    }
};

window.calculateBeltTrimming = () => {
    const sourceItem = document.getElementById('op-source-item-select').value;
    if (!sourceItem) return;

    const dirId = sourceItem.replace('belt_blank_', '').replace('belt_', '');
    const dirEntry = window.dbDirectories.find(d => String(d.id) === String(dirId));
    if (!dirEntry) return;

    const dObj = dirEntry.data || dirEntry;
    const sourceWidth = parseFloat(dObj.diameter || dObj.width || 940);
    const sourcePriceMp = parseFloat(dObj.price_m_no_vat || dObj.price_mp || dObj.price || 0);

    const margin = window.parseRusFloat(document.getElementById('op-belt-trim-margin').value || '25');
    const targetWidth = sourceWidth - (margin * 2);
    document.getElementById('op-belt-trim-target-width').value = targetWidth;

    const targetWidthMeters = targetWidth / 1000;
    const targetPriceM2 = targetWidthMeters > 0 ? (sourcePriceMp / targetWidthMeters) : 0;
    document.getElementById('op-belt-trim-target-price-m2').value = targetPriceM2.toFixed(2);

    // Update Live CSS Preview
    const marginPercent = sourceWidth > 0 ? (margin / sourceWidth) * 100 : 0;
    const leftEl = document.getElementById('trim-preview-left');
    const rightEl = document.getElementById('trim-preview-right');
    const centerEl = document.getElementById('trim-preview-center');

    if (leftEl) leftEl.style.width = `${marginPercent}%`;
    if (rightEl) rightEl.style.width = `${marginPercent}%`;
    if (centerEl) centerEl.innerText = `${targetWidth} мм`;

    // Populate flat values for form save
    const qtyInput = document.getElementById('op-qty');
    if (qtyInput) {
        const consumedLen = window.parseRusFloat(document.getElementById('op-source-qty')?.value || '0');
        qtyInput.value = consumedLen;
    }
    
    const priceInput = document.getElementById('op-unit-price');
    if (priceInput) {
        priceInput.value = sourcePriceMp.toFixed(2);
    }

    const sumInput = document.getElementById('op-sum-no-vat');
    if (sumInput) {
        const consumedLen = window.parseRusFloat(document.getElementById('op-source-qty')?.value || '0');
        sumInput.value = (consumedLen * sourcePriceMp).toFixed(2);
    }
};

window.calculateBeltSlicing = () => {
    const sourceItem = document.getElementById('op-source-item-select').value;
    if (!sourceItem) return;

    const dirId = sourceItem.replace('belt_blank_', '').replace('belt_', '');
    const dirEntry = window.dbDirectories.find(d => String(d.id) === String(dirId));
    if (!dirEntry) return;

    const dObj = dirEntry.data || dirEntry;
    const blankWidth = parseFloat(dObj.diameter || dObj.width || 890);
    const blankPriceMp = parseFloat(dObj.price_m_no_vat || dObj.price_mp || dObj.price || 0);

    const stripWidth = window.parseRusFloat(document.getElementById('op-belt-strip-width').value || '22');
    const stripCount = stripWidth > 0 ? Math.floor(blankWidth / stripWidth) : 0;
    document.getElementById('op-belt-strip-count').value = stripCount;

    const priceMp = stripCount > 0 ? (blankPriceMp / stripCount) : 0;
    document.getElementById('op-belt-strip-price-mp').value = priceMp.toFixed(2);

    // Populate flat values for form save
    const consumedLen = window.parseRusFloat(document.getElementById('op-source-qty')?.value || '0');
    const totalStripMeters = consumedLen * stripCount;

    const qtyInput = document.getElementById('op-qty');
    if (qtyInput) qtyInput.value = totalStripMeters;

    const priceInput = document.getElementById('op-unit-price');
    if (priceInput) priceInput.value = priceMp.toFixed(2);

    const sumInput = document.getElementById('op-sum-no-vat');
    if (sumInput) {
        sumInput.value = (consumedLen * blankPriceMp).toFixed(2);
    }
};

const getCatalogItemWidth = (k) => {
    const item = WAREHOUSE_CATALOG[k];
    if (!item) return 0;
    const match = String(item.name || '').match(/(?:Лента|Заготовка|Полоса)\s*(\d+)/i) || String(item.name || '').match(/^(\d+)/) || String(k).match(/(?:belt_blank_|belt_strip_|belt_)(\d+)/i);
    return match ? parseFloat(match[1]) : 0;
};

window.handleOpAttachments = (input) => {
    const preview = document.getElementById('op-attachments-preview');
    if (!preview) return;
    preview.innerHTML = '';
    window.opUploadedAttachments = [];

    if (!input.files || input.files.length === 0) return;

    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result // Base64 Data URL
            };
            window.opUploadedAttachments.push(fileData);

            // Display a badge in the modal preview
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #fff;';
            badge.innerHTML = `<i class="fa-solid fa-file-invoice"></i> ${file.name.substring(0, 12)}${file.name.length > 12 ? '...' : ''} <span style="opacity:0.5;">(${(file.size/1024).toFixed(1)} KB)</span>`;
            preview.appendChild(badge);
        };
        reader.readAsDataURL(file);
    });
};
