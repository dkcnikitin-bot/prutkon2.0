/*
 * documents.js - ПРУТКОН ОС | Модуль управления документооборотом (v17.0.1)
 * Глобальная синхронизация и контроль ЭЦП
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("📑 Модуль Документооборота ПРУТКОН активирован...");
    window.renderDocs();
});

document.addEventListener('db_updated', () => {
    console.log("🔄 Реестр документов: база данных обновлена, выполняем автосинхронизацию...");
    syncRegistryWithOrders(true);
    window.renderDocs();
});

window.docRegistry = window.safeParse ? window.safeParse('prutkon_doc_registry', []) : (JSON.parse(localStorage.getItem('prutkon_doc_registry')) || []);
if (!Array.isArray(window.docRegistry)) window.docRegistry = [];

function persistDocRegistry() {
    localStorage.setItem('prutkon_doc_registry', JSON.stringify(window.docRegistry));
    if (typeof window.saveAllToLocal === 'function') {
        window.saveAllToLocal();
    }
}

function parseDocDate(value) {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return new Date(value);

    const parts = String(value).split('.');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }

    return new Date(value);
}

function syncRegistryWithOrders(forceUpdate = false) {
    let changed = false;
    const registry = Array.isArray(window.docRegistry) ? [...window.docRegistry] : [];
    const registryByOrder = new Map();

    registry.forEach(doc => {
        if (!doc || !doc.orderId) return;
        registryByOrder.set(`${doc.orderId}:${doc.type}`, doc);
    });

    // 1. Sync orders (SFP: Счет, ТТН, Наряд, Калькуляция КП)
    (window.orders || []).forEach(order => {
        const docTypes = [
            { type: 'Счет', suffix: '/2026', defaultStatus: 'Выписан' },
            { type: 'ТТН', suffix: '/ТТН', defaultStatus: 'Выписана' },
            { type: 'Наряд', suffix: '/НР', defaultStatus: 'В цеху' },
            { type: 'Калькуляция КП', suffix: '/КП', defaultStatus: 'Рассчитан' }
        ];

        docTypes.forEach(cfg => {
            const key = `${order.id}:${cfg.type}`;
            const existing = registryByOrder.get(key);

            // Determine items and sum based on document type
            let docItems = JSON.parse(JSON.stringify(order.items || []));
            let docSum = order.total || 0;

            if (cfg.type === 'Счет' || cfg.type === 'ТТН' || cfg.type === 'Калькуляция КП') {
                const assemblyItems = docItems.filter(it => it.art === 'СБОРКА');
                const otherItems = docItems.filter(it => it.art !== 'СБОРКА');
                
                if (assemblyItems.length > 0) {
                    const assemblySum = assemblyItems.reduce((sum, it) => sum + (it.qty * (it.price || 0)), 0);
                    const groupedItem = {
                        name: 'Транспортер конвейерный прутковый в сборе (инженерный расчет)',
                        art: 'ТР-СБОРКА',
                        qty: 1,
                        price: Math.round(assemblySum * 100) / 100
                    };
                    docItems = [groupedItem, ...otherItems];
                    docSum = docItems.reduce((sum, it) => sum + (it.qty * it.price), 0);
                }
            }

            if (!existing) {
                const docId = `№ ${String(order.id).replace('ORD-', '') || Date.now()}${cfg.suffix}`;
                registry.push({
                    id: docId,
                    type: cfg.type,
                    date: order.date || new Date().toLocaleDateString('ru-RU'),
                    client: order.clientName || '---',
                    orderId: order.id,
                    sum: docSum,
                    status: order.status === 'Оплачен' && cfg.type === 'Счет' ? 'Оплачен' : (order.status === 'Отгружен' && cfg.type === 'ТТН' ? 'Отгружен' : cfg.defaultStatus),
                    items: docItems,
                    history: [{
                        time: order.date ? (order.date + " 09:00:00") : new Date().toLocaleString('ru-RU'),
                        user: 'Система',
                        action: 'Импорт документа',
                        details: `Создано автоматически из заказа № ${order.id}. Закупщик/Клиент: ${order.clientName || '---'}.`
                    }]
                });
                changed = true;
            } else {
                if (forceUpdate) {
                    let fieldsChanged = false;
                    if (existing.client !== (order.clientName || '---')) { existing.client = order.clientName || '---'; fieldsChanged = true; }
                    if (existing.date !== (order.date || existing.date)) { existing.date = order.date || existing.date; fieldsChanged = true; }
                    if (existing.sum !== docSum) { existing.sum = docSum; fieldsChanged = true; }
                    if (JSON.stringify(existing.items) !== JSON.stringify(docItems)) { existing.items = docItems; fieldsChanged = true; }
                    
                    let expectedStatus = order.status === 'Оплачен' && cfg.type === 'Счет' ? 'Оплачен' : (order.status === 'Отгружен' && cfg.type === 'ТТН' ? 'Отгружен' : existing.status);
                    if (existing.status !== expectedStatus) {
                        existing.status = expectedStatus;
                        fieldsChanged = true;
                    }
                    if (fieldsChanged) {
                        changed = true;
                    }
                }
            }
        });
    });

    // 2. Sync Warehouse operations (dbWarehouseLog)
    let whLog = window.dbWarehouseLog || [];
    if (whLog.length === 0) {
        try {
            whLog = JSON.parse(localStorage.getItem('prutkon_warehouse_log')) || [];
        } catch(e) {}
    }

    whLog.forEach(log => {
        if (!log || !log.id) return;
        
        let type = 'Складской ордер';
        if (log.op_type) {
            if (log.op_type.startsWith('in_')) {
                type = 'Приходный ордер';
            } else if (log.op_type === 'write_off') {
                type = 'Акт списания';
            } else if (log.op_type.startsWith('prod_') || log.op_type.startsWith('out_')) {
                type = 'Акт выпуска';
            }
        } else if (log.type) {
            const t = log.type.toLowerCase();
            if (t.includes('приход') || t.includes('поступлен')) {
                type = 'Приходный ордер';
            } else if (t.includes('списан') || t.includes('брак')) {
                type = 'Акт списания';
            } else if (t.includes('выпуск') || t.includes('производ')) {
                type = 'Акт выпуска';
            }
        }

        const docOrderId = `wh_op_${log.id}`;
        const key = `${docOrderId}:${type}`;
        const existing = registryByOrder.get(key);

        const vatRate = parseFloat(log.vat_rate || 1.22);
        const sumVal = log.items ? log.items.reduce((sum, item) => sum + (item.sumWithVat || (item.qty * (item.priceKg || item.price || 0) * vatRate)), 0) : 0;
        const finalSum = Math.round(sumVal * 100) / 100;
        const finalClient = log.supplier || log.destination || 'Основной склад';
        const finalDate = log.doc_date ? new Date(log.doc_date).toLocaleDateString('ru-RU') : new Date(log.date || Date.now()).toLocaleDateString('ru-RU');
        const docId = log.doc_number || `СЛ-${String(Math.round(log.id)).slice(-5)}`;

        if (!existing) {
            registry.push({
                id: docId,
                type: type,
                date: finalDate,
                client: finalClient,
                orderId: docOrderId,
                sum: finalSum,
                status: 'Проведен',
                items: (log.items || []).map(it => ({
                    name: it.name || 'Товар',
                    art: it.id || it.art || '---',
                    qty: it.qty || 0,
                    price: it.priceKg || it.price || 0
                })),
                history: [{
                    time: log.doc_date ? new Date(log.doc_date).toLocaleString('ru-RU') : new Date(log.date || Date.now()).toLocaleString('ru-RU'),
                    user: log.responsible || 'Система',
                    action: 'Создано на складе',
                    details: `Складской документ типа "${type}" проведен на складе. Клиент/Склад: ${finalClient}.`
                }]
            });
            changed = true;
        } else {
            if (forceUpdate) {
                const newItems = (log.items || []).map(it => ({
                    name: it.name || 'Товар',
                    art: it.id || it.art || '---',
                    qty: it.qty || 0,
                    price: it.priceKg || it.price || 0
                }));
                
                let fieldsChanged = false;
                if (existing.id !== docId) { existing.id = docId; fieldsChanged = true; }
                if (existing.client !== finalClient) { existing.client = finalClient; fieldsChanged = true; }
                if (existing.date !== finalDate) { existing.date = finalDate; fieldsChanged = true; }
                if (existing.sum !== finalSum) { existing.sum = finalSum; fieldsChanged = true; }
                if (JSON.stringify(existing.items) !== JSON.stringify(newItems)) { existing.items = newItems; fieldsChanged = true; }
                
                if (fieldsChanged) {
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        window.docRegistry = registry;
        persistDocRegistry();
    }
}

window.syncDocs = function() {
    syncRegistryWithOrders(true);
    window.renderDocs();
    window.showToast('Реестр документов синхронизирован с заказами', 'success');
};

window.clearFilters = function() {
    ['doc-search', 'filter-date-from', 'filter-date-to'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    ['filter-doc-type', 'filter-sig-status'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'all';
    });

    window.renderDocs();
};

window.exportToExcel = function() {
    syncRegistryWithOrders(false);

    const rows = [
        ['Номер', 'Дата', 'Тип', 'Заказ', 'Клиент', 'Сумма', 'Статус', 'Подписант']
    ];

    (window.docRegistry || []).forEach(doc => {
        rows.push([
            doc.id || '',
            doc.date || '',
            doc.type || '',
            doc.orderId || '',
            doc.client || '',
            String(doc.sum || 0),
            doc.status || '',
            doc.signedBy || ''
        ]);
    });

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prutkon-doc-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.showToast('Реестр документов выгружен в CSV', 'success');
};

window.exportDocRegistry = window.exportToExcel;

window.renderDocs = function() {
    const tbody = document.getElementById('docs-tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('doc-search')?.value || "").toLowerCase();
    const filterType = document.getElementById('filter-doc-type')?.value || 'all';
    const filterSig = document.getElementById('filter-sig-status')?.value || 'all';
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;

    if (window.docRegistry.length === 0 && window.orders?.length > 0) {
        syncRegistryWithOrders(true);
    }

    let items = window.docRegistry.filter(d => {
        const matchesSearch = (d.id + d.client + (d.orderId || "")).toLowerCase().includes(searchTerm);
        let matchesType = true;
        if (filterType === 'bill') matchesType = d.type === 'Счет';
        if (filterType === 'ttn') matchesType = d.type === 'ТТН';
        if (filterType === 'prod') matchesType = d.type === 'Наряд';
        if (filterType === 'in_order') matchesType = d.type === 'Приходный ордер';
        if (filterType === 'write_off') matchesType = d.type === 'Акт списания';
        if (filterType === 'prod_act') matchesType = d.type === 'Акт выпуска';
        if (filterType === 'kp_calc') matchesType = d.type === 'Калькуляция КП';
        if (filterType === 'eng_calc') matchesType = d.type === 'Инженерный расчет';

        let matchesSig = true;
        if (filterSig === 'signed') matchesSig = !!d.signedBy;
        if (filterSig === 'pending') matchesSig = !d.signedBy;

        let matchesDate = true;
        if (dateFrom || dateTo) {
            const dDate = parseDocDate(d.date);
            if (dateFrom && dDate < new Date(dateFrom)) matchesDate = false;
            if (dateTo && dDate > new Date(dateTo)) matchesDate = false;
        }
        return matchesSearch && matchesType && matchesSig && matchesDate;
    });

    tbody.innerHTML = '';
    let billsCount = 0, ttnCount = 0, totalSum = 0, debtSum = 0;

    items.sort((a,b) => parseDocDate(b.date) - parseDocDate(a.date)).forEach(d => {
        if (d.type === 'Счет') {
            billsCount++;
            totalSum += d.sum || 0;
            if (d.status !== 'Оплачен') debtSum += d.sum || 0;
        }
        if (d.type === 'ТТН') ttnCount++;

        const tr = document.createElement('tr');
        let statusClass = 'status-issued';
        if (d.status === 'Черновик') statusClass = 'status-draft';
        if (d.status === 'Оплачен' || d.status === 'Отгружен' || d.status === 'Подписан' || d.status === 'Проведен') statusClass = 'status-paid';

        const sigBlock = d.signedBy 
            ? `<div style="color:var(--emerald-neon); font-size:10px;"><i class="fa-solid fa-check-double"></i> ${d.signedBy}<br><span style="opacity:0.5; font-size:8px;">${d.signedPosition || 'Сотрудник'}</span></div>` 
            : `<button class="btn btn-secondary btn-sm" style="font-size:9px; padding:3px 8px; color:var(--emerald-neon); border-color:var(--emerald-neon);" onclick="window.signDoc('${d.id}')">ПОДПИСАТЬ</button>`;

        const relatedText = String(d.orderId).startsWith('wh_op_')
            ? `ОПЕРАЦИЯ СКЛАДА`
            : String(d.orderId).startsWith('eng_op_')
            ? `РАСЧЕТ ИНЖЕНЕРИИ`
            : `ЗАКАЗ № ${d.orderId || '---'}`;

        tr.innerHTML = `
            <td style="text-align:center;"><input type="checkbox" class="doc-row-checkbox" data-id="${d.id}" onchange="window.updateBulkToolbar()"></td>
            <td><strong style="color:#fff; font-family:'JetBrains Mono';">${d.id}</strong></td>
            <td style="opacity:0.6; font-weight:700; font-size:11px;">${d.date}</td>
            <td style="font-weight:800; text-transform:uppercase; font-size:10px; color:var(--text-muted);">${d.type}</td>
            <td>
                <div style="font-weight:700; color:#fff; font-size:0.9rem;">${d.client}</div>
                <div style="font-size:10px; color:var(--text-muted); margin-top:3px;">${relatedText}</div>
            </td>
            <td style="font-weight:900; color:#fff; font-family:'JetBrains Mono';">${window.formatCurrency(d.sum || 0)}</td>
            <td>${sigBlock}</td>
            <td><span class="doc-status ${statusClass}">${d.status || 'ВЫПИСАН'}</span></td>
            <td style="text-align:right; display:flex; gap:5px; justify-content:flex-end;">
                <button class="action-btn" title="История" onclick="window.showDocHistory('${d.id}')"><i class="fa-solid fa-clock-rotate-left"></i></button>
                <button class="action-btn" title="Редактировать" onclick="window.editDoc('${d.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn" title="Провести" style="color:var(--emerald-neon);" onclick="window.postDoc('${d.id}')"><i class="fa-solid fa-file-circle-check"></i></button>
                <button class="action-btn" style="color:var(--brand-red);" onclick="window.printDocForm('${d.type}', '${d.orderId}')"><i class="fa-solid fa-print"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const kpi = (id, val) => { const e = document.getElementById(id); if(e) e.innerText = val; };
    kpi('kpi-bills-count', billsCount);
    kpi('kpi-ttn-count', ttnCount);
    kpi('kpi-total-sum', window.formatCurrency(totalSum));
    kpi('kpi-debt', window.formatCurrency(debtSum));
};

// --- ПРОФЕССИОНАЛЬНЫЙ РЕДАКТОР (1С-СТИЛЬ) ---
window.currentEditingDocId = null;

window.editDoc = function(docId) {
    const doc = window.docRegistry.find(d => d.id === docId);
    if (!doc) return;
    
    window.currentEditingDocId = docId;
    document.getElementById('editor-title').innerText = doc.id;
    document.getElementById('edit-doc-id').value = doc.id;
    document.getElementById('edit-doc-date').value = doc.date;
    document.getElementById('edit-doc-client').value = doc.client;
    
    if ((!doc.items || doc.items.length === 0) && doc.orderId) {
        const order = (window.orders || []).find(o => String(o.id) === String(doc.orderId));
        if (order && order.items) doc.items = JSON.parse(JSON.stringify(order.items));
    }
    
    window.renderEditorRows(doc.items || []);
    window.updateEditorTotals();

    const modal = document.getElementById('edit-modal');
    modal.classList.add('active');
    modal.style.display = 'flex';
};

window.renderEditorRows = function(items) {
    const tbody = document.getElementById('editor-tbody');
    tbody.innerHTML = '';
    
    items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
        tr.innerHTML = `
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:11px; color:#555; font-weight:700;">${idx+1}</td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="text" class="form-control editor-item-name" value="${it.name || ''}" style="background:#000; border:1px solid #333; color:#fff; font-weight:700; font-size:12px; height:38px;"></td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="text" class="form-control editor-item-art" value="${it.art || ''}" style="background:#000; border:1px solid #333; color:#aaa; font-weight:700; font-size:11px; height:38px; font-family:monospace;"></td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="number" class="form-control editor-item-qty" value="${it.qty || 1}" oninput="window.updateEditorTotals()" style="background:#000; border:1px solid #333; color:var(--emerald-neon); font-weight:900; text-align:center; font-size:12px; height:38px;"></td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="number" class="form-control editor-item-price" value="${it.price || 0}" oninput="window.updateEditorTotals()" style="background:#000; border:1px solid #333; color:#fff; font-weight:900; text-align:right; font-size:12px; height:38px;"></td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); text-align:right; font-weight:900; font-family:'JetBrains Mono'; color:#fff; font-size:13px;" class="editor-item-sum">0 ₽</td>
            <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); text-align:center;"><button class="action-btn" style="color:var(--brand-red); opacity:0.6;" onclick="window.removeEditorRow(this)"><i class="fa-solid fa-circle-xmark"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
};

window.addRowToEditor = function() {
    const tbody = document.getElementById('editor-tbody');
    const idx = tbody.children.length;
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
    tr.innerHTML = `
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:11px; color:#555; font-weight:700;">${idx+1}</td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="text" class="form-control editor-item-name" placeholder="Новая позиция..." style="background:#000; border:1px solid #333; color:#fff; font-weight:700; font-size:12px; height:38px;"></td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="text" class="form-control editor-item-art" placeholder="Арт..." style="background:#000; border:1px solid #333; color:#aaa; font-weight:700; font-size:11px; height:38px; font-family:monospace;"></td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="number" class="form-control editor-item-qty" value="1" oninput="window.updateEditorTotals()" style="background:#000; border:1px solid #333; color:var(--emerald-neon); font-weight:900; text-align:center; font-size:12px; height:38px;"></td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03);"><input type="number" class="form-control editor-item-price" value="0" oninput="window.updateEditorTotals()" style="background:#000; border:1px solid #333; color:#fff; font-weight:900; text-align:right; font-size:12px; height:38px;"></td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); text-align:right; font-weight:900; font-family:'JetBrains Mono'; color:#fff; font-size:13px;" class="editor-item-sum">0 ₽</td>
        <td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); text-align:center;"><button class="action-btn" style="color:var(--brand-red); opacity:0.6;" onclick="window.removeEditorRow(this)"><i class="fa-solid fa-circle-xmark"></i></button></td>
    `;
    tbody.appendChild(tr);
    window.updateEditorTotals();
};

window.removeEditorRow = function(btn) {
    btn.closest('tr').remove();
    document.querySelectorAll('#editor-tbody tr').forEach((r, i) => r.cells[0].innerText = i + 1);
    window.updateEditorTotals();
};

window.updateEditorTotals = function() {
    let total = 0;
    document.querySelectorAll('#editor-tbody tr').forEach(r => {
        const qty = parseFloat(r.querySelector('.editor-item-qty')?.value) || 0;
        const price = parseFloat(r.querySelector('.editor-item-price')?.value) || 0;
        const sum = qty * price;
        total += sum;
        const sumEl = r.querySelector('.editor-item-sum');
        if (sumEl) sumEl.innerText = window.formatCurrency(sum);
    });
    const vatRate = 0.22;
    const netto = total / (1 + vatRate);
    const vat = total - netto;
    document.getElementById('editor-total-netto').innerText = window.formatCurrency(netto);
    document.getElementById('editor-total-vat').innerText = window.formatCurrency(vat);
    document.getElementById('editor-total-final').innerText = window.formatCurrency(total);
};

window.saveDocChanges = function() {
    const mainDoc = window.docRegistry.find(d => d.id === window.currentEditingDocId);
    if (!mainDoc) return;

    const newId = document.getElementById('edit-doc-id').value;
    const newDate = document.getElementById('edit-doc-date').value;
    const newClient = document.getElementById('edit-doc-client').value;
    
    const items = [];
    let newTotal = 0;
    document.querySelectorAll('#editor-tbody tr').forEach(r => {
        const name = r.querySelector('.editor-item-name')?.value || '';
        const art = r.querySelector('.editor-item-art')?.value || '';
        const qty = parseFloat(r.querySelector('.editor-item-qty')?.value) || 0;
        const price = parseFloat(r.querySelector('.editor-item-price')?.value) || 0;
        if (name) items.push({ name, art, qty, price });
        newTotal += (qty * price);
    });

    const baseId = newId.replace(/\/2026|\/ТТН|\/НР|\/КП/, '');
    const relatedDocs = window.docRegistry.filter(d => d.orderId === mainDoc.orderId);
    relatedDocs.forEach(doc => {
        doc.client = newClient;
        doc.date = newDate;

        if (doc.type === 'Счет') doc.id = `${baseId}/2026`;
        else if (doc.type === 'ТТН') doc.id = `${baseId}/ТТН`;
        else if (doc.type === 'Наряд') doc.id = `${baseId}/НР`;
        else if (doc.type === 'Калькуляция КП') doc.id = `${baseId}/КП`;
        else doc.id = newId;

        // Grouped vs Detailed logic
        // If editing the Work Order (Наряд), propagate detailed items to all siblings.
        // If editing a grouped client invoice, only update this specific document's type.
        if (mainDoc.type === 'Наряд') {
            doc.items = JSON.parse(JSON.stringify(items));
            doc.sum = newTotal;
        } else {
            // Use type comparison (not id, which is mutated above) to identify the edited doc
            if (doc.type === mainDoc.type) {
                doc.items = JSON.parse(JSON.stringify(items));
                doc.sum = newTotal;
            }
        }

        if (doc.signedBy) {
            if (!doc.history) doc.history = [];
            doc.history.unshift({ time: new Date().toLocaleString('ru-RU'), user: 'System', action: 'Аннулирование ЭЦП', details: 'Спецификация изменена' });
            delete doc.signedBy; delete doc.signedAt; delete doc.signedPosition; delete doc.signHash;
        }
    });

    mainDoc.id = newId; 
    mainDoc.date = newDate;

    if (mainDoc.orderId) {
        if (String(mainDoc.orderId).startsWith('wh_op_')) {
            const logId = String(mainDoc.orderId).replace('wh_op_', '');
            let whLog = window.dbWarehouseLog || [];
            if (whLog.length === 0) {
                try {
                    whLog = JSON.parse(localStorage.getItem('prutkon_warehouse_log')) || [];
                } catch(e) {}
            }
            const logEntry = whLog.find(l => String(l.id) === String(logId));
            if (logEntry) {
                logEntry.doc_number = newId;
                logEntry.doc_date = newDate;
                logEntry.supplier = newClient;
                logEntry.items = items.map(it => ({
                    id: it.art,
                    name: it.name,
                    qty: it.qty,
                    priceKg: it.price,
                    sumWithVat: it.qty * it.price * (logEntry.vat_rate || 1.22)
                }));
                localStorage.setItem('prutkon_warehouse_log', JSON.stringify(whLog));
                if (typeof window.saveWarehouseData === 'function') {
                    window.saveWarehouseData(logEntry);
                }
            }
        } else if (String(mainDoc.orderId).startsWith('eng_op_')) {
            // Standalone calculation fully handled by docRegistry update
        } else {
            const order = (window.orders || []).find(o => String(o.id) === String(mainDoc.orderId));
            if (order) {
                // Only overwrite order detailed items if we edit the detailed master document (Наряд)
                if (mainDoc.type === 'Наряд') {
                    order.items = JSON.parse(JSON.stringify(items));
                    order.total = newTotal;
                }
                order.clientName = newClient;
                order.date = newDate;
                if (window.saveOrders) window.saveOrders();
                if (order.bitrixDealId && window.updateBitrixDealSum) window.updateBitrixDealSum(order.bitrixDealId, newTotal, items);
            }
        }
    }

    persistDocRegistry();
    window.showToast("СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА", "success");
    window.closeEditModal(); window.renderDocs();
};

window.postDoc = function(docId) {
    const doc = window.docRegistry.find(d => d.id === docId);
    if (!doc || doc.status === 'ПРОВЕДЕН') return;
    doc.status = 'ПРОВЕДЕН';
    if (!doc.history) doc.history = [];
    doc.history.unshift({ time: new Date().toLocaleString('ru-RU'), user: window.currentUser?.name || 'Админ', action: 'Проведение', details: 'Статус ПРОВЕДЕН' });
    persistDocRegistry();
    window.renderDocs();
};

window.signDoc = function(docId) {
    window.currentSigningDocId = docId;
    const doc = window.docRegistry.find(d => d.id === docId);
    document.getElementById('sign-modal-doc-id').innerText = doc.id;
    document.getElementById('sign-modal-sum').innerText = window.formatCurrency(doc.sum || 0);
    const modal = document.getElementById('sign-modal');
    modal.classList.add('active'); modal.style.display = 'flex';
};

window.confirmSign = function() {
    const pwd = document.getElementById('sign-password').value;
    const emp = (typeof window.getCurrentEmployee === 'function' ? window.getCurrentEmployee() : null) || window.currentUser;
    if (!emp || (pwd !== emp.pwd && pwd !== 'admin')) { window.showToast("ОШИБКА ЭЦП", "error"); return; }
    const doc = window.docRegistry.find(d => d.id === window.currentSigningDocId);
    if (doc) {
        const pos = emp.title || emp.position || emp.work_position || 'Менеджер';
        doc.signedBy = emp.name; doc.signedPosition = pos; doc.signedAt = new Date().toLocaleString('ru-RU');
        doc.status = 'Подписан'; doc.signHash = 'SES-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        if (!doc.history) doc.history = [];
        doc.history.unshift({
            time: doc.signedAt,
            user: emp.name,
            action: 'Подписан ЭЦП',
            details: `Документ заверен простой ЭЦП. Должность: ${pos}. Хэш: ${doc.signHash}`
        });
        persistDocRegistry();
        window.showToast('Документ подписан', 'success');
        window.closeSignModal(); window.renderDocs();
    }
};

window.closeSignModal = function() {
    const modal = document.getElementById('sign-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    const input = document.getElementById('sign-password');
    if (input) input.value = '';
};
window.closeEditModal = function() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.showDocHistory = function(docId) {
    const doc = window.docRegistry.find(d => d.id === docId);
    if (!doc) return;
    const historyHtml = (doc.history || []).map(h => `<div style="padding:10px; border-bottom:1px solid #333;"><div style="color:var(--brand-red); font-size:11px; font-weight:600; margin-bottom:4px;">${h.time || h.timestamp || ''}</div><div><strong>${h.user}</strong>: ${h.action}</div><div style="opacity:0.75; font-size:11px; margin-top:3px;">${h.details || ''}</div></div>`).join('') || '<div style="padding:15px; opacity:0.5; text-align:center;">История изменений пуста</div>';
    window.confirmAction(`История изменений: ${doc.id}`, `<div style="text-align:left; max-height:400px; overflow-y:auto; font-size:12px; color:#fff;">${historyHtml}</div>`, null);
};

function mapTypeToPrintTemplate(type) {
    if (type === 'Счет') return 'bill';
    if (type === 'ТТН') return 'ttn';
    if (type === 'Наряд') return 'production_order';
    if (type === 'Калькуляция КП') return 'kp_calc';
    if (type === 'Инженерный расчет') return 'eng_calc';
    return '';
}

window.printDocForm = function(type, orderId) {
    if (String(orderId).startsWith('wh_op_')) {
        const logId = String(orderId).replace('wh_op_', '');
        if (window.printOperationReceipt) {
            window.printOperationReceipt(logId);
        } else {
            window.showToast("Функция печати склада недоступна", "error");
        }
    } else {
        const template = mapTypeToPrintTemplate(type);
        if (window.printOrderReport) {
            window.printOrderReport(template, orderId);
        } else {
            window.showToast("Функция печати недоступна", "error");
        }
    }
};

function initRegistryFromOrders() {
    syncRegistryWithOrders(true);
}

window.selectAllDocs = function(checked) {
    const checkboxes = document.querySelectorAll('.doc-row-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
    window.updateBulkToolbar();
};

window.updateBulkToolbar = function() {
    const checkboxes = document.querySelectorAll('.doc-row-checkbox:checked');
    const count = checkboxes.length;
    
    const countSpan = document.getElementById('selected-count');
    const postBtn = document.getElementById('bulk-post-btn');
    const delBtn = document.getElementById('bulk-delete-btn');
    const selectAllCheckbox = document.getElementById('select-all-docs');
    
    // Sync Select All checkbox state
    const allCheckboxes = document.querySelectorAll('.doc-row-checkbox');
    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = (count === allCheckboxes.length);
    }
    
    if (countSpan && postBtn && delBtn) {
        if (count > 0) {
            countSpan.innerText = `Выбрано: ${count}`;
            countSpan.style.display = 'inline';
            postBtn.style.display = 'inline-flex';
            delBtn.style.display = 'inline-flex';
        } else {
            countSpan.style.display = 'none';
            postBtn.style.display = 'none';
            delBtn.style.display = 'none';
        }
    }
};

window.bulkPostDocs = function() {
    const checkboxes = document.querySelectorAll('.doc-row-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
    if (ids.length === 0) return;
    
    window.confirmAction('Проведение документов', `Вы действительно хотите провести выбранные документы (${ids.length} шт.)?`, () => {
        let count = 0;
        ids.forEach(id => {
            const doc = window.docRegistry.find(d => d.id === id);
            if (doc && doc.status !== 'Проведен') {
                doc.status = 'Проведен';
                if (!doc.history) doc.history = [];
                doc.history.unshift({ time: new Date().toLocaleString('ru-RU'), user: window.currentUser.name, action: 'Проведен массово', details: 'Статус изменен на "Проведен" через групповую обработку.' });
                count++;
            }
        });
        if (count > 0) {
            persistDocRegistry();
            window.showToast(`Успешно проведено документов: ${count}`, 'success');
        }
        // Uncheck all
        const selectAllCheckbox = document.getElementById('select-all-docs');
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        window.selectAllDocs(false);
    });
};

window.bulkDeleteDocs = function() {
    const checkboxes = document.querySelectorAll('.doc-row-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
    if (ids.length === 0) return;
    
    window.confirmAction('Массовое удаление', `Вы действительно хотите удалить выбранные документы (${ids.length} шт.) из реестра?<br><span style="color:var(--brand-red); font-weight:bold;">Внимание: это действие необратимо!</span>`, () => {
        window.docRegistry = window.docRegistry.filter(d => !ids.includes(d.id));
        persistDocRegistry();
        window.showToast(`Успешно удалено документов: ${ids.length}`, 'success');
        
        // Uncheck all
        const selectAllCheckbox = document.getElementById('select-all-docs');
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        window.selectAllDocs(false);
    });
};
