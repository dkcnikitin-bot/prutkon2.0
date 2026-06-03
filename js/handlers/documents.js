/*
 * documents.js - ПРУТКОН ОС | Модуль управления документооборотом (v17.0.1)
 * Глобальная синхронизация и контроль ЭЦП
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("📑 Модуль Документооборота ПРУТКОН активирован...");
    window.renderDocs();
});

window.docRegistry = window.safeParse ? window.safeParse('prutkon_doc_registry', []) : (JSON.parse(localStorage.getItem('prutkon_doc_registry')) || []);
if (!Array.isArray(window.docRegistry)) window.docRegistry = [];

function persistDocRegistry() {
    localStorage.setItem('prutkon_doc_registry', JSON.stringify(window.docRegistry));
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
    const registry = Array.isArray(window.docRegistry) ? [...window.docRegistry] : [];
    const registryByOrder = new Map();

    registry.forEach(doc => {
        if (!doc?.orderId) return;
        registryByOrder.set(`${doc.orderId}:${doc.type || 'Счет'}`, doc);
    });

    (window.orders || []).forEach(order => {
        const key = `${order.id}:Счет`;
        const existing = registryByOrder.get(key);

        if (!existing) {
            registry.push({
                id: `№ ${String(order.id).replace('ORD-', '') || Date.now()}/2026`,
                type: 'Счет',
                date: order.date || new Date().toLocaleDateString('ru-RU'),
                client: order.clientName || '---',
                orderId: order.id,
                sum: order.total || 0,
                status: 'Выписан',
                items: JSON.parse(JSON.stringify(order.items || [])),
                history: []
            });
            return;
        }

        if (forceUpdate || !existing.client) existing.client = order.clientName || existing.client || '---';
        if (forceUpdate || !existing.date) existing.date = order.date || existing.date;
        if (forceUpdate || !existing.sum) existing.sum = order.total || 0;
        if (forceUpdate || !existing.items?.length) existing.items = JSON.parse(JSON.stringify(order.items || []));
    });

    window.docRegistry = registry;
    persistDocRegistry();
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
        if (d.status === 'Оплачен' || d.status === 'Отгружен' || d.status === 'Подписан') statusClass = 'status-paid';

        const sigBlock = d.signedBy 
            ? `<div style="color:var(--emerald-neon); font-size:10px;"><i class="fa-solid fa-check-double"></i> ${d.signedBy}<br><span style="opacity:0.5; font-size:8px;">${d.signedPosition || 'Сотрудник'}</span></div>` 
            : `<button class="btn btn-secondary btn-sm" style="font-size:9px; padding:3px 8px; color:var(--emerald-neon); border-color:var(--emerald-neon);" onclick="window.signDoc('${d.id}')">ПОДПИСАТЬ</button>`;

        tr.innerHTML = `
            <td><strong style="color:#fff; font-family:'JetBrains Mono';">${d.id}</strong></td>
            <td style="opacity:0.6; font-weight:700; font-size:11px;">${d.date}</td>
            <td style="font-weight:800; text-transform:uppercase; font-size:10px; color:var(--text-muted);">${d.type}</td>
            <td>
                <div style="font-weight:700; color:#fff; font-size:0.9rem;">${d.client}</div>
                <div style="font-size:10px; color:var(--text-muted); margin-top:3px;">ЗАКАЗ № ${d.orderId || '---'}</div>
            </td>
            <td style="font-weight:900; color:#fff; font-family:'JetBrains Mono';">${window.formatCurrency(d.sum || 0)}</td>
            <td>${sigBlock}</td>
            <td><span class="doc-status ${statusClass}">${d.status || 'ВЫПИСАН'}</span></td>
            <td style="text-align:right; display:flex; gap:5px; justify-content:flex-end;">
                <button class="action-btn" title="История" onclick="window.showDocHistory('${d.id}')"><i class="fa-solid fa-clock-rotate-left"></i></button>
                <button class="action-btn" title="Редактировать" onclick="window.editDoc('${d.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn" title="Провести" style="color:var(--emerald-neon);" onclick="window.postDoc('${d.id}')"><i class="fa-solid fa-file-circle-check"></i></button>
                <button class="action-btn" style="color:var(--brand-red);" onclick="window.printOrderReport('${mapTypeToPrintTemplate(d.type)}', '${d.orderId}')"><i class="fa-solid fa-print"></i></button>
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
        const qty = parseFloat(r.querySelector('.editor-item-qty').value) || 0;
        const price = parseFloat(r.querySelector('.editor-item-price').value) || 0;
        const sum = qty * price;
        total += sum;
        r.querySelector('.editor-item-sum').innerText = window.formatCurrency(sum);
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
        const name = r.querySelector('.editor-item-name').value;
        const art = r.querySelector('.editor-item-art').value;
        const qty = parseFloat(r.querySelector('.editor-item-qty').value) || 0;
        const price = parseFloat(r.querySelector('.editor-item-price').value) || 0;
        items.push({ name, art, qty, price });
        newTotal += (qty * price);
    });

    const relatedDocs = window.docRegistry.filter(d => d.orderId === mainDoc.orderId);
    relatedDocs.forEach(doc => {
        doc.items = JSON.parse(JSON.stringify(items));
        doc.sum = newTotal;
        doc.client = newClient;
        if (doc.signedBy) {
            if (!doc.history) doc.history = [];
            doc.history.unshift({ time: new Date().toLocaleString('ru-RU'), user: 'System', action: 'Аннулирование ЭЦП', details: 'Спецификация изменена' });
            delete doc.signedBy; delete doc.signedAt; delete doc.signedPosition; delete doc.signHash;
        }
    });

    mainDoc.id = newId; mainDoc.date = newDate;

    if (mainDoc.orderId) {
        const order = (window.orders || []).find(o => String(o.id) === String(mainDoc.orderId));
        if (order) {
            order.items = JSON.parse(JSON.stringify(items));
            order.total = newTotal;
            if (window.saveOrders) window.saveOrders();
            if (order.bitrixDealId && window.updateBitrixDealSum) window.updateBitrixDealSum(order.bitrixDealId, newTotal, items);
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
    const historyHtml = (doc.history || []).map(h => `<div style="padding:10px; border-bottom:1px solid #333;"><div style="color:var(--brand-red);">${h.time}</div><div>${h.user}: ${h.action}</div><div style="opacity:0.6;">${h.details}</div></div>`).join('') || 'История пуста';
    window.confirmAction(`История: ${doc.id}`, `<div style="text-align:left; max-height:400px; overflow-y:auto;">${historyHtml}</div>`, null);
};

function mapTypeToPrintTemplate(type) {
    if (type === 'Счет') return 'bill';
    if (type === 'ТТН') return 'ttn';
    if (type === 'Спецификация') return 'spec';
    return 'production';
}

function initRegistryFromOrders() {
    syncRegistryWithOrders(true);
}
