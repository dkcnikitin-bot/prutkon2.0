/* production_order.js - ПРУТКОН ОС | Обработка заказ-нарядов на производстве */

console.log("⚙️ Production Order Handler loading...");

document.addEventListener('DOMContentLoaded', () => {
    initProductionOrders();
    
    // Перерисовывать при обновлении локальной базы данных
    window.addEventListener('db_updated', () => {
        initProductionOrders();
        selectProductionOrder();
    });
});

let selectedOrderId = null;

function initProductionOrders() {
    populateOrdersDropdown();
}

function populateOrdersDropdown() {
    const sel = document.getElementById('active-orders-select');
    if (!sel) return;
    
    // Сортируем: сначала те, что в производстве, затем остальные активные заказы
    const sorted = (window.orders || []).slice().sort((a, b) => {
        const aProd = (a.status || '').toLowerCase().includes('производ') || (a.status || '').toLowerCase().includes('работе');
        const bProd = (b.status || '').toLowerCase().includes('производ') || (b.status || '').toLowerCase().includes('работе');
        if (aProd && !bProd) return -1;
        if (!aProd && bProd) return 1;
        return (b.id || 0) - (a.id || 0);
    });
    
    let h = '<option value="">-- Выберите заказ-наряд --</option>';
    sorted.forEach(o => {
        const isProd = (o.status || '').toLowerCase().includes('производ') ? '🔥 ' : '';
        h += `<option value="${o.id}">${isProd}Заказ №${o.id} - ${o.art || 'Спецификация'} (${o.status || 'Новый'}) - ${o.clientName || '---'}</option>`;
    });
    sel.innerHTML = h;
    
    if (selectedOrderId) {
        sel.value = selectedOrderId;
    }
}

window.selectProductionOrder = () => {
    const sel = document.getElementById('active-orders-select');
    const noSel = document.getElementById('no-order-selected');
    const details = document.getElementById('order-details-container');
    const printBtn = document.getElementById('print-order-btn');
    
    if (!sel || !sel.value) {
        selectedOrderId = null;
        if (noSel) noSel.style.display = 'block';
        if (details) details.style.display = 'none';
        if (printBtn) printBtn.disabled = true;
        return;
    }
    
    selectedOrderId = sel.value;
    const order = (window.orders || []).find(o => String(o.id) === String(selectedOrderId));
    
    if (!order) {
        if (noSel) noSel.style.display = 'block';
        if (details) details.style.display = 'none';
        if (printBtn) printBtn.disabled = true;
        return;
    }
    
    if (noSel) noSel.style.display = 'none';
    if (details) details.style.display = 'block';
    if (printBtn) printBtn.disabled = false;
    
    // Обновляем метаданные наряда
    document.getElementById('order-title-id').innerText = `Заказ-наряд № ${order.id}`;
    document.getElementById('order-meta-info').innerHTML = `
        <i class="fa-solid fa-calendar"></i> Дата сделки: <strong>${order.date}</strong> &nbsp;|&nbsp; 
        <i class="fa-solid fa-user-circle"></i> Клиент: <strong>${order.clientName || '---'}</strong> &nbsp;|&nbsp; 
        <i class="fa-solid fa-phone"></i> Телефон: <strong>${order.clientPhone || '---'}</strong> &nbsp;|&nbsp;
        <i class="fa-solid fa-folder"></i> Объект/Кратко: <strong>${order.art || '---'}</strong>
    `;
    
    const badge = document.getElementById('order-status-badge');
    if (badge) {
        badge.innerText = (order.status || 'ВХОДЯЩИЙ').toUpperCase();
        let bCls = 'bx-initial';
        if (order.status?.includes('Производ') || order.status?.includes('работе')) bCls = 'bx-prod';
        if (order.status?.includes('готов') || order.status === 'Сделка успешна') bCls = 'bx-success';
        if (order.status?.includes('Запрос')) bCls = 'bx-alert';
        badge.className = 'bx-badge ' + bCls;
    }
    
    document.getElementById('order-total-sum').innerText = window.formatCurrency ? window.formatCurrency(order.total || 0) : `${order.total || 0} ₽`;
    
    // Рендерим табличную часть
    const tbody = document.querySelector('#order-items-table tbody');
    if (tbody) {
        const items = order.items || [];
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; opacity:0.5; padding:30px;">Спецификация заказа пуста</td></tr>`;
            return;
        }
        
        tbody.innerHTML = items.map((it, idx) => {
            const drawing = findDrawingForArticle(it.art, it.name);
            const imgHtml = drawing 
                ? `<img src="${drawing}" class="drawing-thumbnail" onclick="window.previewImage('${drawing}')" title="Кликните для увеличения">`
                : `<span style="opacity:0.3; font-style:italic; font-size:0.75rem;">Чертеж отсутствует</span>`;
            
            return `
                <tr>
                    <td style="font-family:'JetBrains Mono'; font-weight:700; width:50px;">${idx + 1}</td>
                    <td>
                        <strong style="color:#fff; font-size:0.95rem;">${it.name}</strong>
                    </td>
                    <td>
                        <strong style="color:var(--brand-gold); font-family:'JetBrains Mono'; font-size:0.85rem;">${it.art || '---'}</strong>
                        ${it.stroke ? `<div style="font-size:0.65rem; color:var(--text-muted); margin-top:3px;">Ход/Размер: ${it.stroke} мм</div>` : ''}
                    </td>
                    <td style="font-weight:700; font-size:1.1rem; color:#fff; font-family:'JetBrains Mono';">${it.qty} шт</td>
                    <td style="text-align:center; vertical-align:middle; width:180px;">${imgHtml}</td>
                </tr>
            `;
        }).join('');
    }
};

window.printCurrentOrder = () => {
    if (!selectedOrderId) return;
    if (window.printOrderReport) {
        window.printOrderReport('production_order', selectedOrderId);
    } else {
        alert("Модуль печати не загружен!");
    }
};

window.previewImage = (url) => {
    const modal = document.getElementById('image-preview-modal');
    const img = document.getElementById('preview-image-element');
    if (modal && img) {
        img.src = url;
        modal.style.display = 'flex';
    }
};

function findDrawingForArticle(art, name) {
    if (!art && !name) return '';
    
    // 1. Поиск в dbProducts (Прайс-листы)
    if (window.dbProducts) {
        const p = window.dbProducts.find(x => (x.art && String(x.art) === String(art)) || (x.name && String(x.name) === String(name)));
        if (p && (p.drawing || p.photo)) return p.drawing || p.photo;
    }
    
    // 2. Поиск в dbDirectories (Справочники металлов, лент)
    if (window.dbDirectories) {
        const d = window.dbDirectories.find(x => (x.art_prutkon && String(x.art_prutkon) === String(art)) || (x.name && String(x.name) === String(name)));
        if (d && (d.drawing || d.photo)) return d.drawing || d.photo;
    }
    
    // 3. Поиск в реестре прутков
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
    
    const lists = [rodsObj.rods_standard, rodsObj.rods_bent, rodsObj.rods_rubber, rodsObj.rods_double];
    for (let list of lists) {
        if (list && Array.isArray(list)) {
            const found = list.find(x => (x.article && String(x.article) === String(art)) || (x.name && String(x.name) === String(name)));
            if (found && (found.drawing || found.photo)) return found.drawing || found.photo;
        }
    }
    
    return '';
}
