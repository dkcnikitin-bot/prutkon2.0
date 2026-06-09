/**
 * PRUTKON ERP OS - CORE.JS (v19.0.0)
 * ПОЛНОЕ ИСПРАВЛЕННОЕ ЯДРО (БЕЗ СОКРАЩЕНИЙ)
 */

window.DB_VERSION = "19.0.0";
window.DB_KEY = "prutkon_data_v1";

// --- 1. СИНХРОНИЗАЦИЯ ---
// --- 1. СИНХРОНИЗАЦИЯ (SUPABASE CLOUD) ---
let _supabaseSyncTimeout = null;
window.saveAllToLocal = async () => {
    if (typeof window.syncWarehouseToPrices === 'function') window.syncWarehouseToPrices();
    const data = {
        products: window.dbProducts || [],
        categories: window.dbCategories || [],
        orders: window.orders || [],
        employees: window.dbEmployees || [],
        directories: window.dbDirectories || [],
        audit: window.dbAuditLog || [],
        trans_products: window.dbTransProducts || [],
        trans_categories: window.dbTransCategories || [],
        catalog_data: window.catalogData || [],
        catalog_categories: window.catalogCategories || [],
        directory_categories: window.dbDirectoryCategories || [],
        warehouse_inv: window.dbWarehouseInv || {},
        warehouse_log: window.dbWarehouseLog || [],
        warehouse_batches: window.dbMetalBatches || [],
        rods_registry: JSON.parse(localStorage.getItem('prutkon_rods_registry') || '{}')
    };
    
    // 1. Локальный бэкап
    localStorage.setItem(window.DB_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('db_updated'));

    // 2. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ (Дебаунс - 1.5 секунды)
    if (window.supabase) {
        if (!navigator.onLine) {
            console.log("☁️ Supabase: Оффлайн режим, сохранено локально.");
            const div = document.getElementById('supabase-status-indicator');
            if (div) {
                div.style.color = '#ffb400';
                div.style.borderColor = '#ffb400';
                div.innerHTML = '● ОБЛАКО: АВТОНОМНЫЙ РЕЖИМ';
            }
            return;
        }

        const div = document.getElementById('supabase-status-indicator');
        if (div) {
            div.style.color = '#00b4ff';
            div.innerHTML = '● ОБЛАКО: ОЖИДАНИЕ СИНХРОНИЗАЦИИ...';
        }

        clearTimeout(_supabaseSyncTimeout);
        _supabaseSyncTimeout = setTimeout(async () => {
            try {
                if (div) {
                    div.style.color = '#ffb400';
                    div.innerHTML = '● ОБЛАКО: СИНХРОНИЗАЦИЯ...';
                }
                const pack = (arr) => (arr || []).map(obj => ({ 
                    id: String(obj.id || obj.art || obj.name || Math.random()), 
                    data: obj 
                }));

                if (window.orders) {
                    const { error } = await window.supabase.from('orders').upsert(pack(window.orders));
                    if (error) console.error("❌ Synced orders error:", error);
                }
                if (window.dbEmployees) {
                    const { error } = await window.supabase.from('employees').upsert(pack(window.dbEmployees));
                    if (error) console.error("❌ Synced employees error:", error);
                }
                if (window.dbDirectories) {
                    const { error } = await window.supabase.from('directories').upsert(pack(window.dbDirectories));
                    if (error) console.error("❌ Synced directories error:", error);
                }
                
                if (window.dbWarehouseInv) {
                    const invArr = Object.keys(window.dbWarehouseInv).map(k => ({ 
                        id: k, 
                        data: { item_key: k, quantity: Number(window.dbWarehouseInv[k] || 0) } 
                    }));
                    const { error } = await window.supabase.from('warehouse_inventory').upsert(invArr);
                    if (error) console.error("❌ Synced warehouse_inventory error:", error);
                }

                if (localStorage.getItem('prutkon_rods_registry')) {
                    const rodsObj = JSON.parse(localStorage.getItem('prutkon_rods_registry') || '{}');
                    const { error } = await window.supabase.from('system_settings').upsert([{ 
                        key: 'rods_registry', 
                        value: rodsObj,
                        updated_at: new Date().toISOString()
                    }]);
                    if (error) console.error("❌ Synced system_settings (rods_registry) error:", error);
                }

                console.log("✅ Supabase: Облако синхронизировано (JSONB)");
                window.updateCloudStatus('ok');
            } catch (e) {
                console.error("Supabase sync error:", e);
                window.updateCloudStatus('error', e.message);
            }
        }, 1500);
    }
};

window.saveAllToLocalQuiet = () => {
    if (typeof window.syncWarehouseToPrices === 'function') window.syncWarehouseToPrices();
    const data = {
        products: window.dbProducts || [],
        categories: window.dbCategories || [],
        orders: window.orders || [],
        employees: window.dbEmployees || [],
        directories: window.dbDirectories || [],
        audit: window.dbAuditLog || [],
        trans_products: window.dbTransProducts || [],
        trans_categories: window.dbTransCategories || [],
        catalog_data: window.catalogData || [],
        catalog_categories: window.catalogCategories || [],
        directory_categories: window.dbDirectoryCategories || [],
        warehouse_inv: window.dbWarehouseInv || {},
        warehouse_log: window.dbWarehouseLog || [],
        warehouse_batches: window.dbMetalBatches || [],
        rods_registry: JSON.parse(localStorage.getItem('prutkon_rods_registry') || '{}')
    };
    localStorage.setItem(window.DB_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('db_updated'));
};

window.saveAllToCloud = async () => {
    window.renderLiveStatus('push');
    try {
        const results = {
            orders: window.orders || [],
            employees: window.dbEmployees || [],
            inventory: Object.entries(window.dbWarehouseInv || {}).map(([k, v]) => ({ item_key: k, quantity: v }))
        };

        const pack = (arr) => arr.map(obj => ({ id: String(obj.id || obj.item_key || Math.random()), data: obj }));

        await window.supabase.from('orders').upsert(pack(results.orders));
        await window.supabase.from('employees').upsert(pack(results.employees));
        
        if (localStorage.getItem('prutkon_rods_registry')) {
            const rodsObj = JSON.parse(localStorage.getItem('prutkon_rods_registry') || '{}');
            const { error } = await window.supabase.from('system_settings').upsert([{ 
                key: 'rods_registry', 
                value: rodsObj,
                updated_at: new Date().toISOString()
            }]);
            if (error) console.error("❌ Synced system_settings (rods_registry) saveAllToCloud error:", error);
        }
        
        console.log("✅ Все данные синхронизированы с Supabase");
        window.renderLiveStatus('sync');
    } catch (e) {
        console.error("Ошибка синхронизации:", e);
        window.updateCloudStatus('error', e.message);
    }
};

let _realtimeSubscribed = false;
window.subscribeRealtime = () => {
    if (!window.supabase || _realtimeSubscribed) return;
    _realtimeSubscribed = true;
    console.log("☁️ Supabase: Подключение к каналу реального времени...");
    
    window.supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
            const newObj = payload.new.data || payload.new;
            const idx = window.orders.findIndex(o => o.id === newObj.id);
            if (idx !== -1) window.orders[idx] = newObj;
            else window.orders.unshift(newObj);
            if (window.saveAllToLocalQuiet) window.saveAllToLocalQuiet();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'directories' }, payload => {
            const newObj = payload.new.data || payload.new;
            console.log('🔔 Справочник изменен в облаке:', newObj);
            const idx = (window.dbDirectories || []).findIndex(d => d.id === newObj.id);
            const fullObj = { id: payload.new.id, ...newObj };
            if (idx !== -1) window.dbDirectories[idx] = fullObj;
            else window.dbDirectories.push(fullObj);
            if (window.saveAllToLocalQuiet) window.saveAllToLocalQuiet();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
            const newObj = payload.new.data || payload.new;
            console.log('🔔 Сотрудник изменен в облаке:', newObj);
            const idx = (window.dbEmployees || []).findIndex(e => e.id === newObj.id);
            if (idx !== -1) window.dbEmployees[idx] = newObj;
            else window.dbEmployees.push(newObj);
            if (window.saveAllToLocalQuiet) window.saveAllToLocalQuiet();
            if (window.updateLoginSelect) window.updateLoginSelect();
            
            // Sync cache if it is current user
            const loginId = localStorage.getItem('prutkon_login_id');
            if (loginId && String(loginId) === String(newObj.id)) {
                localStorage.setItem('prutkon_current_employee', JSON.stringify(newObj));
                if (window.checkAuth) window.checkAuth();
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, payload => {
            const newObj = payload.new.data || payload.new;
            if (newObj.item_key) window.dbWarehouseInv[newObj.item_key] = newObj.quantity;
            if (window.saveAllToLocalQuiet) window.saveAllToLocalQuiet();
        })
        .subscribe();
};

window.loadFromCloud = async (force = false) => {
    if (!window.supabase) return;
    
    // Throttling: if synced recently, skip heavy loading but ensure realtime is active
    const lastSync = localStorage.getItem('prutkon_last_sync_time');
    const now = Date.now();
    if (!force && lastSync && (now - parseInt(lastSync) < 15000)) { // 15 seconds cache
        console.log("☁️ Supabase: Использован локальный кэш данных (последняя синхронизация менее 15 сек. назад)");
        window.updateCloudStatus('ok');
        window.dispatchEvent(new CustomEvent('db_updated'));
        window.subscribeRealtime();
        return;
    }
    
    console.log("☁️ Supabase: Инициализация потоков реального времени...");
    
    try {
        if (window.supabase && !localStorage.getItem('prutkon_employees_migrated_v21')) {
            console.log("🚀 Run employee migration to v21...");
            const newEmps = [
                { id: 1, name: 'Никитин Иван Андреевич', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 100000, share: 0 },
                { id: 2, name: 'Ивахненко Иван', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
                { id: 3, name: 'Кокарев Сергей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
                { id: 4, name: 'Метелла Артем', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
                { id: 5, name: 'Жарикова Джульетта', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
                { id: 6, name: 'Власов Алексей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
                { id: 7, name: 'Родионова Анастасия', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 }
            ];
            const { error: delErr } = await window.supabase.from('employees').delete().neq('id', '0');
            if (delErr) console.error("Migration: delete old error", delErr);
            const pack = (arr) => arr.map(obj => ({ id: String(obj.id), data: obj }));
            const { error: insErr } = await window.supabase.from('employees').upsert(pack(newEmps));
            if (!insErr) {
                window.dbEmployees = newEmps;
                localStorage.setItem('prutkon_employees', JSON.stringify(newEmps));
                localStorage.setItem('prutkon_employees_migrated_v21', 'true');
                console.log("✅ Employee migration to v21 completed successfully!");
            } else {
                console.error("Migration: insert error", insErr);
            }
        }

        // 1. Первоначальная загрузка заказов (Безопасное слияние)
        const { data: ords } = await window.supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (ords) { 
            const cloudOrds = ords.map(o => o.data || o);
            const localOrds = window.orders || [];
            cloudOrds.forEach(co => {
                const idx = localOrds.findIndex(lo => lo.id === co.id);
                if (idx === -1) localOrds.push(co);
                else localOrds[idx] = co;
            });
            window.orders = localOrds.sort((a, b) => (b.id || 0) - (a.id || 0));
            window.dispatchEvent(new CustomEvent('db_updated')); 
        }

        // 2. Первоначальная загрузка сотрудников (Безопасное слияние)
        const { data: emps } = await window.supabase.from('employees').select('*');
        if (emps) { 
            const cloudEmps = emps.map(e => e.data || e);
            const localEmps = window.dbEmployees || [];
            cloudEmps.forEach(ce => {
                const idx = localEmps.findIndex(le => le.id === ce.id);
                if (idx === -1) localEmps.push(ce);
                else localEmps[idx] = ce;
            });
            window.dbEmployees = localEmps;
            
            // Sync cache for current employee
            const loginId = localStorage.getItem('prutkon_login_id');
            if (loginId) {
                const currentEmp = window.dbEmployees.find(e => String(e.id) === String(loginId));
                if (currentEmp) {
                    localStorage.setItem('prutkon_current_employee', JSON.stringify(currentEmp));
                }
            }
            
            if (window.updateLoginSelect) window.updateLoginSelect(); 
            if (window.checkAuth) window.checkAuth();
        }

        // 3. Первоначальная загрузка справочников (Безопасное слияние)
        const { data: dirs } = await window.supabase.from('directories').select('*');
        if (dirs) {
            const cloudDirs = dirs.map(d => ({ id: d.id, ... (d.data || d) }));
            const localDirs = window.dbDirectories || [];
            cloudDirs.forEach(cd => {
                const idx = localDirs.findIndex(ld => ld.id === cd.id);
                if (idx === -1) localDirs.push(cd);
                else localDirs[idx] = cd;
            });
            window.dbDirectories = localDirs;
        }

        // 4. Первоначальная загрузка логов склада
        const { data: logs } = await window.supabase.from('warehouse_log').select('*').order('id', { ascending: false }).limit(50);
        if (logs) {
            window.dbWarehouseLog = logs.map(l => l.data || l).reverse();
        }

        // Сохраняем в кэш после первичного слияния всех данных
        if (typeof window.saveAllToLocalQuiet === 'function') {
            window.saveAllToLocalQuiet();
        }

        // Save last sync timestamp
        localStorage.setItem('prutkon_last_sync_time', Date.now().toString());

        // 5. Подписка на изменения (Realtime)
        window.subscribeRealtime();

        window.updateCloudStatus('ok');
    } catch(e) {
        console.error("Supabase load error:", e);
        window.updateCloudStatus('error', e.message);
    }
};

window.getGlobalKey = (key) => {
    if(key === 'products') return window.dbProducts;
    if(key === 'categories') return window.dbCategories;
    if(key === 'orders') return window.orders;
    if(key === 'employees') return window.dbEmployees;
    if(key === 'directories') return window.dbDirectories;
    if(key === 'audit') return window.dbAuditLog;
    if(key === 'trans_products') return window.dbTransProducts;
    if(key === 'trans_categories') return window.dbTransCategories;
    if(key === 'catalog_data') return window.catalogData;
    if(key === 'catalog_categories') return window.catalogCategories;
    if(key === 'directory_categories') return window.dbDirectoryCategories;
    if(key === 'warehouse_inv') return window.dbWarehouseInv;
    if(key === 'warehouse_log') return window.dbWarehouseLog;
    if(key === 'warehouse_batches') return window.dbMetalBatches;
    if(key === 'rods_registry') return JSON.parse(localStorage.getItem('prutkon_rods_registry') || '{}');
};

window.setGlobalKey = (key, val) => {
    if(key === 'products') window.dbProducts = val;
    if(key === 'categories') window.dbCategories = val;
    if(key === 'orders') window.orders = val;
    if(key === 'employees') window.dbEmployees = val;
    if(key === 'directories') window.dbDirectories = val;
    if(key === 'audit') window.dbAuditLog = val;
    if(key === 'trans_products') window.dbTransProducts = val;
    if(key === 'trans_categories') window.dbTransCategories = val;
    if(key === 'catalog_data') window.catalogData = val;
    if(key === 'catalog_categories') window.catalogCategories = val;
    if(key === 'directory_categories') window.dbDirectoryCategories = val;
    if(key === 'warehouse_inv') window.dbWarehouseInv = val;
    if(key === 'warehouse_log') window.dbWarehouseLog = val;
    if(key === 'warehouse_batches') window.dbMetalBatches = val;
    if(key === 'rods_registry') {
        localStorage.setItem('prutkon_rods_registry', JSON.stringify(val));
        if (window.db) {
            Object.assign(window.db, val);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.loadFromCloud();
    window.createCloudStatusIndicator();
});

window.createCloudStatusIndicator = () => {
    const div = document.createElement('div');
    div.id = 'supabase-status-indicator';
    div.style = 'position: fixed; bottom: 10px; left: 10px; padding: 5px 10px; background: rgba(0,0,0,0.7); color: #00ff9d; font-size: 10px; border-radius: 5px; z-index: 9999; border: 1px solid #004400; font-family: monospace; cursor: help;';
    div.innerHTML = '<span style="color:#555">●</span> ОБЛАКО: ИНИЦИАЛИЗАЦИЯ...';
    div.title = 'Статус синхронизации с Supabase Cloud';
    document.body.appendChild(div);
};

window.updateCloudStatus = (status, msg) => {
    const div = document.getElementById('supabase-status-indicator');
    if (!div) return;
    if (status === 'ok') {
        div.style.color = '#00ff9d';
        div.style.borderColor = '#00ff9d';
        div.innerHTML = '● ОБЛАКО: ПОДКЛЮЧЕНО (SUPABASE)';
    } else if (status === 'error') {
        div.style.color = '#ff4444';
        div.style.borderColor = '#ff4444';
        div.innerHTML = '● ОБЛАЧНЫЙ ПОТОК: ОШИБКА БАЗЫ';
        div.title = msg;
    }
};

// --- UTILS ---
window.parseRusFloat = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    // Убираем пробелы, валютные символы и меняем запятую на точку
    const s = String(str).replace(/\s/g, '').replace(/[₽%]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
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

window.autoCalculateMetalData = (item) => {
    const C = window.parseRusFloat(item.weight_per_m);
    const G = window.parseRusFloat(item.weight);
    const H = window.parseRusFloat(item.price);
    const M = window.parseRusFloat(item.delivery_m_no_vat);
    const Q = window.parseRusFloat(item.vat_rate);

    if (Q > 0) {
        item.sum_no_vat = window.formatRusCurrency(G * H);
        item.sum_vat = window.formatRusCurrency(G * H * Q);
        item.price_m_no_vat = window.formatRusCurrency((H / 1000) * C);
        item.price_m_vat = window.formatRusCurrency((H / 1000) * C * Q);
        item.delivery_m_vat = window.formatRusCurrency(M * Q);
        item.total_price_m_no_vat = window.formatRusCurrency(((H / 1000) * C) + M);
        item.total_price_m_vat = window.formatRusCurrency((((H / 1000) * C) + M) * Q);
    }
};

window.safeParse = (key, def) => {
    try {
        const stored = localStorage.getItem(window.DB_KEY);
        if (!stored) return def;
        const data = JSON.parse(stored);
        const map = {
            'prutkon_products': data.products,
            'prutkon_categories': data.categories,
            'prutkon_orders': data.orders,
            'prutkon_employees': data.employees,
            'prutkon_directories': data.directories,
            'prutkon_audit_log': data.audit,
            'prutkon_trans_products': data.trans_products,
            'prutkon_trans_categories': data.trans_categories,
            'prutkon_catalog_data': data.catalog_data,
            'prutkon_catalog_categories': data.catalog_categories,
            'prutkon_dir_categories': data.directory_categories
        };
        return map[key] || def;
    } catch (e) { return def; }
};

// --- 2. ДАННЫЕ (КАТЕГОРИИ И КЛИЕНТЫ) ---
window.dbCategories = window.safeParse('prutkon_categories', [
    { id: 'transporters', name: 'Транспортеры', parent: null, schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'belts', name: 'Ремни', parent: null, schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'sec_rods', name: 'Прутки', parent: null },
    { id: 'blanks', name: 'заготовки', parent: 'sec_rods', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'sub_rods_rti', name: 'Прутки РТИ и гнутые', parent: 'sec_rods' },
    { id: 'rods_rti', name: 'Прутки РТИ', parent: 'sub_rods_rti', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rods_bent_metal', name: 'Прутки гнутые металл', parent: 'sub_rods_rti', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rods_bent_rti', name: 'Прутки гнутые РТИ', parent: 'sub_rods_rti', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rods_hedgehog', name: 'Прутки ёжные', parent: 'sub_rods_rti', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rods_finger', name: 'Прутки пальцевые', parent: 'sub_rods_rti', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rods_double', name: 'Сдвоенный пруток', parent: 'sec_rods', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'pushers', name: 'Сталкиватели', parent: null, schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'fingers', name: 'Пальцы', parent: null, schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'flaps', name: 'Хлопушки', parent: null, schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'hardware_small', name: 'Скобяные изделия', parent: null },
    { id: 'locks', name: 'Замки', parent: 'hardware_small', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'fasteners', name: 'Метизы', parent: 'hardware_small', schema: ['tech_type', 'available', 'photo', 'drawing', 'art_prutkon', 'blank_ref', 'art_all', 'stats', 'stock', 'global'] },
    { id: 'rollers', name: 'Ролики и звездочки', parent: null },
    { id: 'mesh', name: 'Ленты и полотна', parent: null },
    { id: 'glue', name: 'Клей', parent: null },
    { id: 'pvc_belts', name: 'Конвейерные ленты ПВХ', parent: null },
    { id: 'others', name: 'Другие запчасти', parent: null }
]);

window.dbProducts = window.safeParse('prutkon_products', []);
window.dbDirectoryCategories = window.safeParse('prutkon_dir_categories', [
    { id: 'metal', name: 'Материалы', schema: ['diameter', 'weight_per_m', 'length', 'bars_count', 'total_len', 'steel_type', 'available', 'weight', 'price', 'delivery_total', 'sum_no_vat', 'sum_vat', 'price_m_no_vat', 'price_m_vat', 'delivery_m_no_vat', 'delivery_m_vat', 'total_price_m_no_vat', 'total_price_m_vat', 'vat_rate', 'invoice_num', 'delivery_date', 'supplier'] },
    { id: 'belt', name: 'Справочник лент', schema: ['width', 'strength', 'cords', 'cover_top', 'cover_bottom', 'rubber_class', 'tu', 'thickness', 'weight_per_m2', 'price_m2', 'price_mp', 'length', 'area', 'weight', 'vat_rate', 'invoice_num', 'delivery_date', 'supplier'] },
    { id: 'belt_blank', name: 'Ленты-заготовки', schema: ['width', 'strength', 'cords', 'cover_top', 'cover_bottom', 'rubber_class', 'tu', 'thickness', 'weight_per_m2', 'price_m2', 'price_mp', 'length', 'area', 'weight', 'vat_rate', 'invoice_num', 'delivery_date', 'supplier', 'source_belt_ref'] },
    { id: 'belt_strip', name: 'Ленты-полосы', schema: ['width', 'thickness', 'length', 'price_mp', 'weight', 'vat_rate', 'invoice_num', 'delivery_date', 'supplier', 'source_blank_ref'] },
    { id: 'hardware', name: 'Скобяные изделия', schema: ['name', 'price', 'unit', 'supplier', 'invoice_num', 'delivery_date', 'description'] },
    { id: 'fasteners', name: 'Метизы и крепеж', schema: ['name', 'price', 'unit', 'supplier', 'invoice_num', 'delivery_date', 'description'] },
    { id: 'brands', name: 'Бренды / Производители', schema: ['country', 'website', 'priority'] },
    { id: 'dealers', name: 'Поставщики / Дилеры', schema: ['address', 'manager', 'contact'] }
]);

// Автоматический апгрейд категорий справочника для новых разделов
if (Array.isArray(window.dbDirectoryCategories)) {
    if (!window.dbDirectoryCategories.some(c => c.id === 'hardware')) {
        window.dbDirectoryCategories.push({ id: 'hardware', name: 'Скобяные изделия', schema: ['name', 'price', 'unit', 'supplier', 'invoice_num', 'delivery_date', 'description'] });
    }
    if (!window.dbDirectoryCategories.some(c => c.id === 'fasteners')) {
        window.dbDirectoryCategories.push({ id: 'fasteners', name: 'Метизы и крепеж', schema: ['name', 'price', 'unit', 'supplier', 'invoice_num', 'delivery_date', 'description'] });
    }
    localStorage.setItem('prutkon_dir_categories', JSON.stringify(window.dbDirectoryCategories));
}

window.dbDirectories = window.safeParse('prutkon_directories', []);
if (!window.dbDirectories || window.dbDirectories.length === 0) {
    window.dbDirectories = [
        { id: 101, category: 'metal', name: '10-ОМZ', diameter: '10', weight_per_m: '0,616', length: '6000', bars_count: '850', total_len: '5100', steel_type: '60С2ХА', available: 'Нет', weight: '3,135', price: '112 167,00 ₽', sum_no_vat: '351 755,71 ₽', sum_vat: '422 141,87 ₽', price_m_no_vat: '69,09 ₽', price_m_vat: '84,30 ₽', delivery_m_no_vat: '5,73 ₽', delivery_m_vat: '6,99 ₽', total_price_m_no_vat: '74,82 ₽', total_price_m_vat: '91,29 ₽', vat_rate: '1,2', invoice_num: 'НК-00123', delivery_date: '08.02.2026', supplier: 'АО ОМЗ' },
        { id: 102, category: 'metal', name: '11-ОМZ', diameter: '11', weight_per_m: '0,746', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '3,365', price: '112 167,00 ₽', sum_no_vat: '377 554,12 ₽', sum_vat: '460 616,03 ₽', price_m_no_vat: '83,68 ₽', price_m_vat: '102,09 ₽', delivery_m_no_vat: '6,94 ₽', delivery_m_vat: '8,46 ₽', total_price_m_no_vat: '90,61 ₽', total_price_m_vat: '110,55 ₽', vat_rate: '1,2', invoice_num: 'НК-00123', delivery_date: '08.02.2026', supplier: 'АО ОМЗ' },
        { id: 103, category: 'metal', name: '12-ОМZ', diameter: '12', weight_per_m: '0,888', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '3,278', price: '112 167,00 ₽', sum_no_vat: '367 683,43 ₽', sum_vat: '448 573,78 ₽', price_m_no_vat: '99,60 ₽', price_m_vat: '121,52 ₽', delivery_m_no_vat: '8,26 ₽', delivery_m_vat: '10,07 ₽', total_price_m_no_vat: '107,86 ₽', total_price_m_vat: '131,59 ₽', vat_rate: '1,2', invoice_num: 'НК-00124', delivery_date: '08.02.2026', supplier: 'АО ОМЗ' },
        { id: 104, category: 'metal', name: '13-ОМZ', diameter: '13', weight_per_m: '1,04', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '0,797', price: '112 167,00 ₽', sum_no_vat: '89 397,10 ₽', sum_vat: '109 064,46 ₽', price_m_no_vat: '116,65 ₽', price_m_vat: '142,32 ₽', delivery_m_no_vat: '9,67 ₽', delivery_m_vat: '11,80 ₽', total_price_m_no_vat: '126,33 ₽', total_price_m_vat: '154,12 ₽', vat_rate: '1,2', invoice_num: 'НК-00124', delivery_date: '08.02.2026', supplier: 'АО ОМЗ' },
        { id: 105, category: 'metal', name: '10-МЕТ', diameter: '10', weight_per_m: '0,616', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '0,35', price: '161 120,00 ₽', sum_no_vat: '56 392,00 ₽', sum_vat: '67 670,40 ₽', price_m_no_vat: '99,25 ₽', price_m_vat: '119,10 ₽', delivery_m_no_vat: '11,48 ₽', delivery_m_vat: '13,77 ₽', total_price_m_no_vat: '110,73 ₽', total_price_m_vat: '132,87 ₽', vat_rate: '1,2', invoice_num: 'М-908', delivery_date: '17.02.2023', supplier: 'ПАО Ижсталь (Мечел)' },
        { id: 106, category: 'metal', name: '11-МЕТ', diameter: '11', weight_per_m: '0,746', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '0,44', price: '161 120,00 ₽', sum_no_vat: '70 892,80 ₽', sum_vat: '85 071,36 ₽', price_m_no_vat: '120,20 ₽', price_m_vat: '144,23 ₽', delivery_m_no_vat: '13,90 ₽', delivery_m_vat: '16,68 ₽', total_price_m_no_vat: '134,10 ₽', total_price_m_vat: '160,92 ₽', vat_rate: '1,2', invoice_num: 'М-908', delivery_date: '17.02.2023', supplier: 'ПАО Ижсталь (Мечел)' },
        { id: 107, category: 'metal', name: '12-МЕТ', diameter: '12', weight_per_m: '0,888', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '0,4', price: '161 120,00 ₽', sum_no_vat: '64 448,00 ₽', sum_vat: '77 337,60 ₽', price_m_no_vat: '143,07 ₽', price_m_vat: '171,69 ₽', delivery_m_no_vat: '16,55 ₽', delivery_m_vat: '19,86 ₽', total_price_m_no_vat: '159,62 ₽', total_price_m_vat: '191,55 ₽', vat_rate: '1,2', invoice_num: 'М-909', delivery_date: '17.02.2023', supplier: 'ПАО Ижсталь (Мечел)' },
        { id: 108, category: 'metal', name: '13-МЕТ', diameter: '13', weight_per_m: '1,04', length: '6000', steel_type: '60С2ХА', available: 'Нет', weight: '0,42', price: '161 120,00 ₽', sum_no_vat: '67 670,40 ₽', sum_vat: '81 204,48 ₽', price_m_no_vat: '167,56 ₽', price_m_vat: '201,08 ₽', delivery_m_no_vat: '19,38 ₽', delivery_m_vat: '23,25 ₽', total_price_m_no_vat: '186,94 ₽', total_price_m_vat: '224,33 ₽', vat_rate: '1,2', invoice_num: 'М-909', delivery_date: '17.02.2023', supplier: 'ПАО Ижсталь (Мечел)' }
    ];
}

window.orders = window.safeParse('prutkon_orders', []);
window.dbEmployees = window.safeParse('prutkon_employees', []);
if (!window.dbEmployees || window.dbEmployees.length === 0) {
    window.dbEmployees = [
        { id: 1, name: 'Никитин Иван Андреевич', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 100000, share: 0 },
        { id: 2, name: 'Ивахненко Иван', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
        { id: 3, name: 'Кокарев Сергей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
        { id: 4, name: 'Метелла Артем', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
        { id: 5, name: 'Жарикова Джульетта', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
        { id: 6, name: 'Власов Алексей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
        { id: 7, name: 'Родионова Анастасия', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 }
    ];
}
window.dbAuditLog = window.safeParse('prutkon_audit_log', []);
window.dbTransProducts = window.safeParse('prutkon_trans_products', []);
window.dbTransCategories = window.safeParse('prutkon_trans_categories', [
    { id: 'transporters', name: 'Транспортеры' }
]);
window.catalogData = window.safeParse('prutkon_catalog_data', []);
window.catalogCategories = window.safeParse('prutkon_catalog_categories', [
    { id: 'models', name: 'Каталог моделей техники' }
]);
window.getCurrentEmployee = () => {
    if (!window.dbEmployees) return null;
    const loginId = localStorage.getItem('prutkon_login_id');
    if (loginId !== null) {
        const emp = window.dbEmployees.find(e => String(e.id) === String(loginId));
        if (emp) return emp;
    }
    const loginIdx = localStorage.getItem('prutkon_login_idx');
    if (loginIdx !== null) {
        const emp = window.dbEmployees[parseInt(loginIdx)];
        if (emp) return emp;
    }
    return null;
};
window.currentUser = window.getCurrentEmployee() || window.dbEmployees[0] || { name: 'Система', role: 'Admin' };

// --- 3. ГЛОБАЛЬНЫЕ КОНСТАНТЫ ---
window.steelTypes = ['60С2ХА', 'Ст3', '40Х', '65Г', '60С2А', '50ХФА', 'AISI 304', 'AISI 316'];
window.getSteelDensity = function(steelName) {
    if (!steelName) return 7.85;
    const name = String(steelName).toUpperCase().trim();
    if (name.includes('316')) return 8.00;
    if (name.includes('304') || name.includes('321') || name.includes('18Н10') || name.includes('12Х18') || name.includes('08Х18')) return 7.93;
    if (name.includes('430') || name.includes('12Х17')) return 7.70;
    if (name.includes('40Х') || name.includes('30ХГ') || name.includes('40ХН')) return 7.82;
    return 7.85;
};
window.MEASURE_UNITS = ['кг', 'т', 'шт', 'м.п', 'рулон'];

// --- 4. UI ХЕЛПЕРЫ ---
window.formatCurrency = (v) => window.formatRusNumber(v, 2) + " ₽";

window.showToast = (msg, type = 'info') => {
    let t = document.getElementById('system-toast');
    if (!t) {
        t = document.createElement('div'); t.id = 'system-toast';
        t.style.cssText = "position:fixed; bottom:50px; right:30px; z-index:100000; padding:15px 25px; border-radius:12px; font-weight:700; color:#fff; backdrop-filter:blur(15px); transition:0.3s; transform:translateY(100px); opacity:0; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
        document.body.appendChild(t);
    }
    const col = { success:'#00ff9d', error:'#ff1e27', info:'#00b4ff' };
    t.style.background = (col[type] || col.info) + 'cc';
    t.innerHTML = `<i class="fa-solid fa-bell"></i> ${msg}`;
    t.style.transform = 'translateY(0)'; t.style.opacity = '1';
    setTimeout(() => { t.style.transform = 'translateY(100px)'; t.style.opacity = '0'; }, 3000);
};

window.confirmAction = (title, text, cb) => {
    let m = document.getElementById('system-confirm-modal');
    if (!m) {
        m = document.createElement('div'); m.id = 'system-confirm-modal'; m.className = 'modal confirm-modal';
        m.innerHTML = `<div class="confirm-card"><h3 id="confirm-title"></h3><p id="confirm-text"></p><div class="confirm-actions"><button class="btn btn-secondary" onclick="document.getElementById('system-confirm-modal').classList.remove('active')">Отмена</button><button id="confirm-yes" class="btn btn-primary">Да</button></div></div>`;
        document.body.appendChild(m);
    }
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-text').innerText = text;
    document.getElementById('confirm-yes').onclick = () => { m.classList.remove('active'); cb(); };
    m.classList.add('active');
};

// --- 4. АУДИТ И БЭКАП ---
window.logAudit = (type, action) => {
    window.dbAuditLog.unshift({ ts: new Date().toLocaleString(), user: window.currentUser.name, action: action });
    if (window.dbAuditLog.length > 100) window.dbAuditLog.pop();
    window.saveAllToLocal();
};

window.exportSystemBackup = () => {
    const data = { products: window.dbProducts, categories: window.dbCategories, orders: window.orders, v: window.DB_VERSION, ts: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
};

window.restoreSystemBackup = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const d = JSON.parse(ev.target.result);
                if (d.products) window.dbProducts = d.products;
                if (d.categories) window.dbCategories = d.categories;
                if (d.orders) window.orders = d.orders;
                window.saveAllToLocal();
                if (window.showToast) window.showToast(`Резервная копия восстановлена (v${d.v || '?'})`, 'success');
                setTimeout(() => location.reload(), 1500);
            } catch(err) { alert('Ошибка чтения файла бэкапа: ' + err.message); }
        };
        reader.readAsText(file);
    };
    inp.click();
};

window.showAuditLog = () => {
    const logs = window.dbAuditLog || [];
    let html = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
        <div style="background:#080808;border:1px solid #181818;border-radius:20px;width:700px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;">
            <div style="padding:25px;border-bottom:1px solid #111;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;color:#fff;font-size:1rem;text-transform:uppercase;letter-spacing:2px;"><i class="fa-solid fa-list-ul" style="color:var(--brand-red);margin-right:10px;"></i>Журнал аудита ОС</h3>
                <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;">&times;</button>
            </div>
            <div style="overflow-y:auto;padding:20px;flex:1;">
                ${logs.length === 0 ? '<div style="text-align:center;padding:40px;opacity:0.3;">Журнал пуст</div>' :
                logs.map(l => `<div style="padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                        <strong style="color:#fff;font-size:0.8rem;">${l.user || 'Система'}</strong>
                        <span style="opacity:0.4;font-size:0.65rem;">${l.ts || l.time || ''}</span>
                    </div>
                    <div style="color:#888;font-size:0.75rem;">${l.action || ''}</div>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstElementChild);
};

window.showVersionHistory = () => {
    const hist = window.DEFAULT_VERSION_HISTORY || [];
    let html = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
        <div style="background:#080808;border:1px solid #181818;border-radius:20px;width:750px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">
            <div style="padding:25px;border-bottom:1px solid #111;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;color:#fff;font-size:1rem;text-transform:uppercase;letter-spacing:2px;"><i class="fa-solid fa-code-branch" style="color:var(--brand-red);margin-right:10px;"></i>История версий ПРУТКОН ОС</h3>
                <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;">&times;</button>
            </div>
            <div style="overflow-y:auto;padding:20px;flex:1;">
                ${hist.map(v => `<div style="padding:15px;background:rgba(255,255,255,0.02);border-radius:12px;margin-bottom:10px;border-left:3px solid var(--brand-red);">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <strong style="color:var(--brand-red);font-size:0.9rem;">v${v.version} — ${v.codename}</strong>
                        <span style="opacity:0.4;font-size:0.65rem;">${v.date}</span>
                    </div>
                    <ul style="margin:0;padding-left:15px;color:#888;font-size:0.75rem;">
                        ${(v.changes||[]).map(c => `<li style="margin-bottom:3px;">${c}</li>`).join('')}
                    </ul>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstElementChild);
};


// --- 5. ИМПОРТ (UNIVERSAL ENGINE V2) ---
window.runUniversalImport = async ({ data, mappings, artSources, targetCategory, categoryName, options, onProgress }) => {
    const results = [];
    const moduleName = (options && options.moduleName) ? options.moduleName : "Excel Импорт";
    const userName = (window.currentUser && window.currentUser.name) ? window.currentUser.name : "Система";
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i]; 
        if (!row || row.length === 0) continue;
        
        // Извлекаем артикул
        let art = ""; 
        artSources.forEach(idx => { 
            if (row[idx]) art = String(row[idx]).trim(); 
        });
        
        if (!art || art === "---" || art === "") continue;
        
        const item = { 
            id: Date.now() + i, 
            category: targetCategory, 
            art: art, 
            history: [{ time: new Date().toLocaleString(), user: userName, action: `Импорт из Excel (${moduleName})` }]
        };
        
        // Заполняем поля из маппинга
        for (let key in mappings) {
            const colIdx = mappings[key];
            const val = row[colIdx];
            if (val !== undefined && val !== null && val !== '') {
                if (key.startsWith('DYNAMIC_')) {
                    item[key.replace('DYNAMIC_', '')] = String(val).trim();
                } else {
                    item[key] = val;
                }
            }
        }
        
        // 🔥 Отладка фото (первые 3 строки)
        if (results.length < 3) {
            console.log(`📦 ROW[${i}] art="${art}"`, {
                photo_filename: item.photo_filename,
                photo_path: item.photo_path,
                allKeys: Object.keys(item)
            });
        }
        
        // === 🖼️ СБОРКА ПУТИ К ФОТО (V2 - с поддержкой абсолютных путей) ===
        let photoFilename = '';
        let photoRelDir = '';
        
        // Обработка photo_filename
        if (item.photo_filename) {
            const raw = String(item.photo_filename).trim();
            if (raw && raw !== '---') {
                photoFilename = raw.split('\\').pop().split('/').pop().trim();
            }
            delete item.photo_filename;
        }
        
        // Обработка photo_path
        if (item.photo_path) {
            const raw = String(item.photo_path).trim();
            if (raw && raw !== '---') {
                let normalized = raw.replace(/\\/g, '/').replace(/\/$/, '');
                const markerLow = normalized.toLowerCase();
                const marker = 'extracted_xlsx';
                const idx = markerLow.indexOf(marker);
                
                if (idx >= 0) {
                    photoRelDir = normalized.substring(idx);
                } else {
                    const idx2 = markerLow.indexOf('extracted');
                    if (idx2 >= 0) {
                        photoRelDir = normalized.substring(idx2);
                    } else {
                        const parts = normalized.split('/');
                        photoRelDir = parts.slice(-2).join('/');
                    }
                }
            }
            delete item.photo_path;
        }
        
        // Формируем итоговый путь к фото
        if (photoFilename && photoFilename !== '---' && photoFilename !== '') {
            if (photoRelDir && photoRelDir !== '---') {
                const dirClean = photoRelDir.replace(/\/$/, '');
                item.photo = `${dirClean}/${photoFilename}`;
            } else {
                item.photo = `extracted_xlsx/${photoFilename}`;
            }
        } else if (photoRelDir && photoRelDir !== '---') {
            item.photo = photoRelDir;
        }
        
        // 🔥 Логирование для отладки (первые 5 товаров)
        if (item.photo && results.length < 5) {
            console.log(`🖼 PHOTO [${item.art}]: ${item.photo}`);
        }
        
        // Конвертация числовых полей
        if (item.price) {
            item.price = parseFloat(String(item.price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        }
        if (item.stock) {
            item.stock = parseInt(String(item.stock).replace(/\s/g, '')) || 0;
        }
        
        results.push(item);
        
        if (onProgress) {
            onProgress(i, data.length, results.length, `✅ ${art}`);
        }
        
        if (i % 50 === 0) await new Promise(r => setTimeout(r, 1));
    }
    
    return results;
};


// --- 6. КОНСТРУКТОР (ДЛЯ INDEX.HTML) ---
window.getTimeGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Добрый день";
    if (hour >= 5 && hour < 12) greeting = "Доброе утро";
    else if (hour >= 12 && hour < 18) greeting = "Добрый день";
    else if (hour >= 18 && hour < 23) greeting = "Добрый вечер";
    else greeting = "Доброй ночи";
    
    const emp = (typeof window.getCurrentEmployee === 'function') ? window.getCurrentEmployee() : null;
    const name = emp ? emp.name : "Пользователь";
    const role = emp ? emp.role : "Оператор";
    return {
        greeting: `${greeting}, ${name}!`,
        role: role,
        date: new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };
};

window.renderConstructor = () => {
    const p = document.getElementById('constructor-main'); if (!p) return;
    const greet = window.getTimeGreeting();
    p.innerHTML = `
        <div class="welcome-panel glass-panel" style="margin-bottom:25px; border-top:4px solid var(--brand-red); display:flex; justify-content:between; align-items:center; padding:30px 40px; border-radius:16px;">
            <div class="welcome-info">
                <h1 id="dash-greeting" style="margin:0 0 5px; font-family:'Outfit'; font-size:2.2rem; font-weight:800; background:linear-gradient(90deg, #fff 0%, var(--text-secondary) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${greet.greeting}</h1>
                <p id="dash-role-date" style="color:var(--text-muted); font-size:0.9rem; margin:0;"><i class="fa-solid fa-user-gear" style="color:var(--brand-red)"></i> Роль: <strong style="color:#fff;">${greet.role}</strong> &nbsp;|&nbsp; <i class="fa-solid fa-calendar-days"></i> ${greet.date}</p>
            </div>
            <div id="dash-load-circle" style="position:relative; width:90px; height:90px; display:flex; align-items:center; justify-content:center;">
                <svg width="90" height="90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="transparent"/>
                    <circle id="dash-progress-ring" cx="50" cy="50" r="40" stroke="var(--neon-emerald)" stroke-width="8" fill="transparent" stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease-in-out; filter:drop-shadow(0 0 8px rgba(0, 255, 157, 0.5));"/>
                </svg>
                <div id="dash-load-value" style="position:absolute; font-family:'Outfit'; font-size:1.1rem; font-weight:800; color:#fff;">0%</div>
            </div>
        </div>

        <div class="quick-actions-container mb-4" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin-bottom:30px;">
            <div class="quick-btn glass-panel-heavy shimmer-btn" onclick="window.location.href='orders.html'" style="border-top:3px solid var(--brand-red); cursor:pointer; padding:20px; text-align:center; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <i class="fa-solid fa-cart-shopping" style="color:var(--brand-red); font-size:1.8rem; filter:drop-shadow(0 0 10px rgba(226,31,38,0.4));"></i>
                <strong style="color:#fff; font-size:0.9rem; margin-top:5px;">Заказы и Сделки</strong>
                <span style="font-size:0.7rem; color:var(--text-muted);">Активные сделки в CRM</span>
            </div>
            <div class="quick-btn glass-panel-heavy shimmer-btn" onclick="window.location.href='catalog.html'" style="border-top:3px solid var(--brand-gold); cursor:pointer; padding:20px; text-align:center; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <i class="fa-solid fa-folder-open" style="color:var(--brand-gold); font-size:1.8rem; filter:drop-shadow(0 0 10px rgba(255,180,0,0.4));"></i>
                <strong style="color:#fff; font-size:0.9rem; margin-top:5px;">Каталог продукции</strong>
                <span style="font-size:0.7rem; color:var(--text-muted);">База изделий и чертежей</span>
            </div>
            <div class="quick-btn glass-panel-heavy shimmer-btn" onclick="window.location.href='warehouse.html'" style="border-top:3px solid var(--accent-blue); cursor:pointer; padding:20px; text-align:center; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <i class="fa-solid fa-warehouse" style="color:var(--accent-blue); font-size:1.8rem; filter:drop-shadow(0 0 10px rgba(0,147,255,0.4));"></i>
                <strong style="color:#fff; font-size:0.9rem; margin-top:5px;">Складской учет</strong>
                <span style="font-size:0.7rem; color:var(--text-muted);">Приемка, остатки, партии</span>
            </div>
            <div class="quick-btn glass-panel-heavy shimmer-btn" onclick="window.location.href='rods_production.html'" style="border-top:3px solid var(--emerald-neon); cursor:pointer; padding:20px; text-align:center; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <i class="fa-solid fa-industry" style="color:var(--emerald-neon); font-size:1.8rem; filter:drop-shadow(0 0 10px rgba(0,255,157,0.4));"></i>
                <strong style="color:#fff; font-size:0.9rem; margin-top:5px;">Производство прутков</strong>
                <span style="font-size:0.7rem; color:var(--text-muted);">Конструктор и списание</span>
            </div>
        </div>

        <div class="stats-grid mb-5" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-bottom:30px;">
            <div class="stat-card glass-panel" style="padding:20px 25px; border-radius:12px; border-left:4px solid var(--brand-red);">
                <div class="stat-label" style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;"><i class="fa-solid fa-coins"></i> Выручка (Общая)</div>
                <div id="dash-revenue" class="stat-value" style="color:#fff; font-size:1.8rem; font-weight:900; font-family:'Outfit';">0 ₽</div>
            </div>
            <div class="stat-card glass-panel" style="padding:20px 25px; border-radius:12px; border-left:4px solid var(--brand-gold);">
                <div class="stat-label" style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;"><i class="fa-solid fa-list-check"></i> Активные сделки</div>
                <div id="dash-orders-count" class="stat-value" style="color:var(--brand-gold); font-size:1.8rem; font-weight:900; font-family:'Outfit';">0</div>
            </div>
            <div class="stat-card glass-panel" style="padding:20px 25px; border-radius:12px; border-left:4px solid var(--emerald-neon);">
                <div class="stat-label" style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;"><i class="fa-solid fa-weight-hanging"></i> Запасы металла на складе</div>
                <div id="dash-metal-weight" class="stat-value" style="color:var(--emerald-neon); font-size:1.8rem; font-weight:900; font-family:'Outfit';">0 кг</div>
            </div>
        </div>

        <div class="dash-row" style="display:grid; grid-template-columns: 1.5fr 1fr; gap:25px;">
            <div class="panel glass-panel" style="padding:25px; border-radius:12px;">
                <h3 class="mb-4" style="font-family:'Outfit'; font-weight:800; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;"><i class="fa-solid fa-clock-rotate-left"></i> Последние сделки в CRM</h3>
                <table class="w-full"><tbody id="dash-orders-list"></tbody></table>
            </div>
            <div class="panel glass-panel" style="padding:25px; border-radius:12px;">
                <h3 class="mb-4" style="font-family:'Outfit'; font-weight:800; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;"><i class="fa-solid fa-bolt" style="color:var(--brand-gold);"></i> Лента активности и склада</h3>
                <div id="dash-audit-feed" class="audit-feed" style="max-height:280px; overflow-y:auto; padding-right:5px;"></div>
            </div>
        </div>
    `;
};

// --- 7. UI RENDERING (делегируем модулям header.js, menu.js, footer.js) ---
window.renderLayout = () => {
    if (typeof window.renderSidebar === 'function') {
        window.renderSidebar();
    }
};

if (typeof window.renderTopMenu !== 'function') {
    window.renderTopMenu = () => console.warn('header.js not loaded');
}
if (typeof window.renderNavItems !== 'function') {
    window.renderNavItems = () => console.warn('menu.js not loaded');
}
if (typeof window.renderSystemFooter !== 'function') {
    window.renderSystemFooter = () => console.warn('footer.js not loaded');
};

// --- 8. AUTHENTICATION ---
window.ensureLoginModal = () => {
    let m = document.getElementById('login-modal');
    if (!m) {
        m = document.createElement('div');
        m.id = 'login-modal';
        m.className = 'modal active';
        m.style.display = 'flex';
        m.innerHTML = `
            <div class="glass-panel" style="width:420px; padding:50px; text-align:center; border-top:4px solid var(--brand-red);">
                <div style="margin-bottom:35px;">
                    <i class="fa-solid fa-user-shield" style="font-size:3.5rem; color:var(--brand-red); margin-bottom:20px; filter:drop-shadow(0 0 20px rgba(226,31,38,0.3));"></i>
                    <h2 style="font-family:'Outfit'; margin:0 0 10px; font-size:1.8rem;">ПРУТКОН ОС</h2>
                    <p style="color:var(--text-muted); font-size:0.85rem;">Авторизация для доступа к системе</p>
                </div>
                <div class="form-group mb-4">
                    <select id="login-role" class="form-control" style="height:50px; font-size:1rem; font-weight:600;">
                        ${window.dbEmployees.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group mb-4">
                    <input type="password" id="login-pwd" class="form-control" placeholder="Пароль" style="height:50px; font-size:1rem;" onkeypress="if(event.key==='Enter')window.doLogin()">
                </div>
                <button class="btn btn-primary w-100" style="height:50px; font-size:1rem;" onclick="window.doLogin()">
                    <i class="fa-solid fa-arrow-right-to-bracket"></i> Войти в систему
                </button>
                <div style="margin-top:25px; font-size:0.7rem; color:var(--text-muted);">
                    Пароль по умолчанию: <strong style="color:var(--brand-red);">1234</strong>
                </div>
            </div>`;
        document.body.appendChild(m);
    }
    window.updateLoginSelect();
    return m;
};

window.checkAuth = () => {
    const emp = window.getCurrentEmployee();
    const app = document.querySelector('.main-content');
    let m = document.getElementById('login-modal');
    if (!m) m = window.ensureLoginModal();
    
    if (emp) {
        window.currentUser = emp;
        if (app) { 
            app.style.opacity = '1'; 
            app.style.pointerEvents = 'auto'; 
            app.style.display = ''; 
        }
        if (m) { m.classList.remove('active'); m.style.display = 'none'; }
        const av = emp.name.split(' ').map(x => x[0]).join('').slice(0, 2);
        document.querySelectorAll('.user-name').forEach(el => el.innerText = emp.name);
        document.querySelectorAll('.user-role').forEach(el => el.innerText = emp.role);
        document.querySelectorAll('.avatar').forEach(a => { a.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(av)}&background=E21F26&color=fff&size=128`; });
        return true;
    }
    if (app) { 
        app.style.opacity = '0'; 
        app.style.pointerEvents = 'none'; 
        app.style.display = 'none'; 
    }
    if (m) { m.classList.add('active'); m.style.display = 'flex'; }
    return false;
};

window.updateLoginSelect = () => {
    const sel = document.getElementById('login-role');
    if (sel && window.dbEmployees) {
        sel.innerHTML = window.dbEmployees.map((e) => `<option value="${e.id}">${e.name}</option>`).join('');
    }
};

window.doLogin = () => { 
    const id = document.getElementById('login-role').value; 
    const p = document.getElementById('login-pwd').value; 
    const emp = window.dbEmployees.find(e => String(e.id) === String(id));
    if (emp && p === emp.pwd) { 
        localStorage.setItem('prutkon_login_id', emp.id);
        const currentIdx = window.dbEmployees.indexOf(emp);
        localStorage.setItem('prutkon_login_idx', currentIdx);
        window.location.reload(); 
    } else { 
        alert("ОШИБКА АВТОРИЗАЦИИ"); 
    } 
};

window.doLogout = () => { 
    localStorage.removeItem('prutkon_login_id'); 
    localStorage.removeItem('prutkon_login_idx'); 
    window.location.reload(); 
};

window.stripTU = (name) => {
    if (!name) return '';
    return name.replace(/\s*(?:ТУ|ГОСТ)\s*\S+/g, '').replace(/\s*(?:ТУ|ГОСТ)-\S+/g, '').trim();
};

window.formatProductNameForList = (p) => {
    if (!p) return '';
    let name = window.stripTU(p.name || '');
    
    // Check if it is a belt or blank or strip
    const isBelt = p.category === 'belts' || String(p.art || '').startsWith('belt') || String(p.id || '').startsWith('belt');
    if (isBelt) {
        let parts = [];
        if (p.thickness) parts.push(`${p.thickness} мм`);
        if (p.strength) parts.push(`${p.strength}`);
        if (parts.length > 0) {
            const partsStr = parts.join(', ');
            if (!name.includes(partsStr)) {
                name += ` (${partsStr})`;
            }
        }
    } else {
        // For rods
        let diaVal = p.dia || p.diameter;
        if (!diaVal) {
            const match = String(p.name || '').match(/Ø\s*(\d+(\.\d+)?)/i) || String(p.art || '').match(/(?:BL|DBL|PR)-(\d+(\.\d+)?)/i);
            if (match) diaVal = match[1];
        }
        if (diaVal) {
            const diaStr = `Ø${diaVal} мм`;
            if (!name.includes(diaStr) && !name.includes(`Ø ${diaVal}`) && !name.includes(`Ø${diaVal}`)) {
                name += ` (${diaStr})`;
            }
        }
    }
    return name;
};

window.syncWarehouseToPrices = () => {
    if (!window.dbWarehouseInv || !Array.isArray(window.dbProducts)) return;
    
    let rodsObj = {};
    try {
        const raw = localStorage.getItem('prutkon_rods_registry');
        if (raw) rodsObj = JSON.parse(raw);
    } catch(e) {}
    if (window.db) {
        const RODS_KEYS = ['rods_metal', 'rods_blanks', 'rods_standard', 'rods_bent', 'rods_rubber', 'rods_double'];
        RODS_KEYS.forEach(k => {
            if (window.db[k] && Array.isArray(window.db[k])) rodsObj[k] = window.db[k];
        });
    }

    const findDirectoryItem = (id) => {
        if (!window.dbDirectories) return null;
        return window.dbDirectories.find(d => String(d.id) === String(id));
    };

    const WAREHOUSE_CATALOG_FALLBACK = {
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

    for (let key in window.dbWarehouseInv) {
        if (key === 'metal' || key.startsWith('metal_')) continue;
        
        const qty = parseFloat(window.dbWarehouseInv[key] || 0);
        
        let art = '';
        let type = '';
        if (key.includes('_')) {
            const parts = key.split('_');
            type = parts[0];
            art = parts.slice(1).join('_');
        } else {
            type = key;
            art = key;
        }

        let existingProd = window.dbProducts.find(p => p && String(p.art) === String(art));
        if (qty <= 0 && !existingProd) continue;

        let name = '';
        let category = '';
        let price = 0;
        let drawing = '';
        let dia = 0;
        let length = 0;
        let thickness = '';
        let strength = '';
        
        if (type === 'belt' || type === 'belt_blank' || type === 'belt_strip') {
            category = 'belts';
            const dirId = key.replace('belt_blank_', '').replace('belt_strip_', '').replace('belt_', '');
            const dirItem = findDirectoryItem(dirId);
            if (dirItem) {
                const d = dirItem.data || dirItem;
                name = d.name || (type === 'belt_blank' ? 'Лента-Заготовка' : type === 'belt_strip' ? 'Лента-Полоса' : 'Лента');
                drawing = d.drawing || d.photo || '';
                price = parseFloat(String(d.price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                thickness = d.thickness || '';
                strength = d.strength || d.steel_type || '';
                length = d.length || 0;
                dia = d.diameter || d.width || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Лента';
            }
        } else if (type === 'blank') {
            category = 'blanks';
            const found = (rodsObj.rods_blanks || []).find(b => b.article === art);
            if (found) {
                name = `Заготовка L=${found.length} мм, Ø${found.dia} мм`;
                price = found.price || 0;
                drawing = found.drawing || found.photo || '';
                dia = found.dia || 0;
                length = found.length || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Заготовка';
            }
        } else if (type === 'straight') {
            const found = (rodsObj.rods_standard || []).find(r => r.article === art || r.name === art);
            if (found) {
                name = found.name;
                price = found.price || 0;
                drawing = found.drawing || found.photo || '';
                dia = found.dia || found.diameter || 0;
                length = found.length || found.width || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Пруток прямой';
            }
            
            const nameLower = name.toLowerCase();
            if (nameLower.includes('еж') || nameLower.includes('ёж')) {
                category = 'rods_hedgehog';
            } else if (nameLower.includes('палец')) {
                category = 'rods_finger';
            } else if (nameLower.includes('резин') || nameLower.includes('rti') || nameLower.includes('рти')) {
                category = 'rods_rti';
            } else {
                category = 'sec_rods';
            }
        } else if (type === 'double') {
            category = 'rods_double';
            const found = (rodsObj.rods_double || []).find(r => r.article === art || r.name === art);
            if (found) {
                name = found.name;
                price = found.price || 0;
                drawing = found.drawing || found.photo || '';
                dia = found.dia || found.diameter || 0;
                length = found.length || found.width || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Сдвоенный пруток';
            }
        } else if (type === 'bent') {
            const found = (rodsObj.rods_bent || []).find(r => r.article === art || r.name === art);
            if (found) {
                name = found.name;
                price = found.price || 0;
                drawing = found.drawing || found.photo || '';
                dia = found.dia || found.diameter || 0;
                length = found.length || found.width || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Гнутый пруток';
            }
            
            const nameLower = name.toLowerCase();
            if (nameLower.includes('еж') || nameLower.includes('ёж') || nameLower.includes('палец')) {
                category = 'rods_hedgehog';
            } else {
                category = 'rods_bent_metal';
            }
        } else if (type === 'rubberized' || type === 'bent_rubberized') {
            const found = (rodsObj.rods_rubber || []).find(r => r.article === art || r.name === art);
            if (found) {
                name = found.name;
                price = found.price || 0;
                drawing = found.drawing || found.photo || '';
                dia = found.dia || found.diameter || 0;
                length = found.length || found.width || 0;
            } else {
                name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Обрезиненный пруток';
            }
            
            const nameLower = name.toLowerCase();
            if (nameLower.includes('гнут') || nameLower.includes('сварн') || nameLower.includes('комби') || nameLower.includes('bent') || type === 'bent_rubberized') {
                category = 'rods_bent_rti';
            } else {
                category = 'rods_rti';
            }
        } else if (type === 'hedge') {
            category = 'rods_hedgehog';
            const nameLower = art.toLowerCase();
            if (nameLower.includes('палец')) category = 'rods_finger';
            name = WAREHOUSE_CATALOG_FALLBACK[key]?.name || 'Пруток ёжный';
        }

        if (!category) continue;

        if (!dia) {
            const matchDia = String(name || '').match(/Ø\s*(\d+(\.\d+)?)/i) || String(key).match(/(?:BL|DBL|PR)-(\d+(\.\d+)?)/i);
            if (matchDia) dia = parseFloat(matchDia[1]);
        }
        if (!length) {
            const matchLen = String(name || '').match(/(?:Ширина|L|L=)\s*(\d+)/i);
            if (matchLen) length = parseFloat(matchLen[1]);
        }

        const nameCleaned = window.stripTU(name || art);

        if (existingProd) {
            existingProd.stock = qty;
            if (nameCleaned) existingProd.name = nameCleaned;
            if (price > 0) existingProd.price = price;
            if (drawing) existingProd.drawing = drawing;
            if (category) existingProd.category = category;
            if (dia) existingProd.dia = dia;
            if (length) existingProd.length = length;
            if (thickness) existingProd.thickness = thickness;
            if (strength) existingProd.strength = strength;
        } else {
            window.dbProducts.push({
                id: 'auto_prod_' + art + '_' + Date.now(),
                art: art,
                name: nameCleaned,
                category: category,
                stock: qty,
                price: price || 0,
                drawing: drawing,
                dia: dia,
                length: length,
                thickness: thickness,
                strength: strength,
                history: [{ time: new Date().toLocaleString(), user: 'Система', action: 'Автоматическое заведение из остатков склада' }]
            });
        }
    }
};

// --- 9. SUPABASE BRIDGES ---
window.saveOrders = window.saveAllToLocal;
window.saveCatalog = window.saveAllToLocal;
window.addAudit = (id, action, user) => window.logAudit('INFO', `${action} (ID: ${id})`);


/**
 * ГЛОБАЛЬНАЯ МИГРАЦИЯ: Перенос всех локальных данных в Supabase
 */
window.migrateToCloud = async function() {
    console.log("🚀 Начинаю ультимативную миграцию (JSONB)...");
    if (!window.supabase) return console.error("Supabase не подключен!");

    const results = { orders: 0, inventory: 0, employees: 0, settings: 0, directories: 0 };

    // Упаковщик: берет объект и превращает его в { id: ..., data: { ... } }
    const pack = (arr, idKey = 'id') => arr.map(obj => ({
        id: String(obj[idKey] || obj.art || obj.name || Math.random()),
        data: obj
    }));

    try {
        // 1. Заказы
        const rawOrders = JSON.parse(localStorage.getItem('prutkon_orders') || '[]');
        if (rawOrders.length) {
            console.log("📦 Перенос заказов...");
            const { error } = await window.supabase.from('orders').upsert(pack(rawOrders));
            if (!error) results.orders = rawOrders.length;
        }

        // 2. Склад
        const rawInv = JSON.parse(localStorage.getItem('prutkon_warehouse_inv') || '[]');
        if (rawInv.length) {
            console.log("🏗️ Перенос склада...");
            const { error } = await window.supabase.from('warehouse_inventory').upsert(pack(rawInv));
            if (!error) results.inventory = rawInv.length;
        }

        // 3. Сотрудники
        const rawEmps = JSON.parse(localStorage.getItem('prutkon_employees') || '[]');
        if (rawEmps.length) {
            console.log("👥 Перенос сотрудников...");
            const { error } = await window.supabase.from('employees').upsert(pack(rawEmps));
            if (!error) results.employees = rawEmps.length;
        }

        // 4. Справочники
        const rawDirs = JSON.parse(localStorage.getItem('prutkon_directories') || '[]');
        if (rawDirs.length) {
            console.log("📖 Перенос справочников...");
            const { error } = await window.supabase.from('directories').upsert(pack(rawDirs));
            if (!error) results.directories = rawDirs.length;
        }

        alert(`✅ УЛЬТИМАТИВНАЯ МИГРАЦИЯ ЗАВЕРШЕНА!\nЗаказов: ${results.orders}\nСклад: ${results.inventory}\nСотрудников: ${results.employees}`);
        window.location.reload();
    } catch (e) {
        console.error("Critical Migration Error:", e);
    }
};

// --- 11. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderSidebar === 'function') {
        window.renderSidebar();
    } else {
        window.renderLayout();
        window.renderNavItems();
    }
    window.renderTopMenu();
    window.renderSystemFooter();
    window.ensureLoginModal();
    if (window.checkAuth()) { console.log('Auth OK'); }
    
    setInterval(() => { 
        const el = document.getElementById("top-bar-clock"); 
        if (el) el.innerText = new Date().toLocaleTimeString("ru-RU"); 
    }, 1000);

    window.addEventListener('online', () => {
        if (window.showToast) window.showToast("Связь восстановлена. Синхронизация с облаком...", "success");
        window.saveAllToLocal();
    });
    window.addEventListener('offline', () => {
        if (window.showToast) window.showToast("Связь потеряна. Автономный режим.", "warning");
        const div = document.getElementById('supabase-status-indicator');
        if (div) {
            div.style.color = '#ffb400';
            div.style.borderColor = '#ffb400';
            div.innerHTML = '● ОБЛАКО: АВТОНОМНЫЙ РЕЖИМ';
        }
    });
    
    console.log(`Core OS v${window.DB_VERSION} operational.`);
});

console.log("PRUTKON CORE v19.0.0 OPERATIONAL");
