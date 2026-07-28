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
    
    const totalSumEl = document.getElementById('order-total-sum');
    if (totalSumEl) {
        totalSumEl.innerText = window.formatCurrency ? window.formatCurrency(order.total || 0) : `${order.total || 0} ₽`;
    }
    
    // Рендерим табличную часть
    const tbody = document.querySelector('#order-items-table tbody');
    if (tbody) {
        const items = order.items || [];
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; padding:30px;">Спецификация заказа пуста</td></tr>`;
            return;
        }
        
        tbody.innerHTML = items.map((it, idx) => {
            const drawing = findDrawingForArticle(it.art, it.name);
            const imgHtml = drawing 
                ? `<img src="${drawing}" class="drawing-thumbnail" onclick="window.previewImage('${drawing}')" title="Кликните для увеличения">`
                : `<span style="opacity:0.3; font-style:italic; font-size:0.75rem;">Чертеж отсутствует</span>`;
            
            const stockRes = getWarehouseStock(it.art, it.name);
            const isDeducted = order.checklist && order.checklist[idx]?.done === true;
            const isReady = order.checklist && order.checklist[idx]?.ready === true;
            
            let whActionHtml = '';
            if (isDeducted) {
                const check = order.checklist[idx];
                whActionHtml = `
                    <div style="color:var(--emerald-neon); font-size:0.7rem; font-weight:bold; margin-bottom:5px; display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-circle-check"></i> Списано со склада (${check.operator || 'Мастер'}, ${check.date})
                    </div>
                `;
            } else {
                whActionHtml = `
                    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:5px;">
                        <div style="font-size:0.65rem; color:#aaa;">На складе: <strong style="color:var(--brand-gold);">${stockRes.qty} шт</strong></div>
                        <button onclick="window.writeOffItemFromWarehouse('${order.id}', ${idx})" class="btn btn-secondary" style="height:24px; padding:0 8px; font-size:0.6rem; font-weight:800; border:1px solid rgba(255,180,0,0.3); background:rgba(255,180,0,0.05); color:var(--brand-gold); border-radius:4px; display:inline-flex; align-items:center; gap:4px; width:fit-content; cursor:pointer;">
                            <i class="fa-solid fa-warehouse"></i> Списать ${it.qty} шт
                        </button>
                    </div>
                `;
            }

            const readyActionHtml = `
                <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                    <input type="checkbox" id="chk-ready-${idx}" ${isReady ? 'checked' : ''} onchange="window.toggleItemReady('${order.id}', ${idx}, this.checked)" style="width:14px; height:14px; cursor:pointer;">
                    <label for="chk-ready-${idx}" style="font-size:0.7rem; color:${isReady ? 'var(--emerald-neon)' : '#ccc'}; font-weight:700; cursor:pointer; margin:0;">
                        ${isReady ? 'Деталь заготовлена ✓' : 'Готово к сборке'}
                    </label>
                </div>
            `;

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
                    <td style="text-align:center; vertical-align:middle; width:140px;">${imgHtml}</td>
                    <td style="vertical-align:middle; padding:8px 15px; border-left:1px solid rgba(255,255,255,0.03);">
                        ${whActionHtml}
                        ${readyActionHtml}
                    </td>
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

function getWarehouseStock(art, name) {
    if (!window.dbWarehouseInv) window.dbWarehouseInv = {};
    if (window.dbProducts) {
        const p = window.dbProducts.find(x => (x.art && String(x.art) === String(art)) || (x.name && String(x.name) === String(name)));
        if (p && window.dbWarehouseInv[p.id] !== undefined) {
            return { qty: parseFloat(window.dbWarehouseInv[p.id]), key: p.id };
        }
        if (p && window.dbWarehouseInv[p.art] !== undefined) {
            return { qty: parseFloat(window.dbWarehouseInv[p.art]), key: p.art };
        }
    }
    if (window.dbDirectories) {
        const d = window.dbDirectories.find(x => (x.art_prutkon && String(x.art_prutkon) === String(art)) || (x.name && String(x.name) === String(name)) || (x.id && String(x.id) === String(art)));
        if (d && window.dbWarehouseInv[d.id] !== undefined) {
            return { qty: parseFloat(window.dbWarehouseInv[d.id]), key: d.id };
        }
        const keyWithMetal = d ? (String(d.id).startsWith('metal_') ? d.id : `metal_${d.id}`) : '';
        if (keyWithMetal && window.dbWarehouseInv[keyWithMetal] !== undefined) {
            return { qty: parseFloat(window.dbWarehouseInv[keyWithMetal]), key: keyWithMetal };
        }
    }
    if (art && window.dbWarehouseInv[art] !== undefined) {
        return { qty: parseFloat(window.dbWarehouseInv[art]), key: art };
    }
    return { qty: 0, key: art || name };
}

window.writeOffItemFromWarehouse = (orderId, itemIdx) => {
    const order = (window.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    const items = order.items || [];
    const it = items[itemIdx];
    if (!it) return;

    const res = getWarehouseStock(it.art, it.name);
    if (!res.key) {
        alert("Товар не найден в справочнике склада!");
        return;
    }

    const qtyToWriteOff = parseFloat(it.qty) || 0;
    if (qtyToWriteOff <= 0) {
        alert("Количество для списания должно быть больше нуля!");
        return;
    }

    if (res.qty < qtyToWriteOff) {
        if (!confirm(`Недостаточно товара на складе! Доступно: ${res.qty}, требуется: ${qtyToWriteOff}. Все равно списать?`)) {
            return;
        }
    }

    window.dbWarehouseInv[res.key] = Math.max(0, res.qty - qtyToWriteOff);

    if (!window.dbWarehouseLog) window.dbWarehouseLog = [];
    const logEntry = {
        id: 'wh_log_' + Date.now(),
        date: new Date().toISOString(),
        type: 'write_off',
        invoice_num: `НАРЯД-${orderId}`,
        supplier: 'Производство',
        destination: `Заказ №${orderId}`,
        carrier: 'Цех сборки',
        responsible: window.currentUser?.name || 'Мастер смены',
        items: [
            {
                id: res.key,
                art: it.art || res.key,
                name: it.name,
                qty: qtyToWriteOff,
                price: it.price || 0,
                priceKg: it.price || 0,
                sumNoVat: qtyToWriteOff * (it.price || 0),
                sumWithVat: qtyToWriteOff * (it.price || 0) * 1.2
            }
        ]
    };
    window.dbWarehouseLog.unshift(logEntry);

    if (window.saveWarehouseData) {
        window.saveWarehouseData();
    } else {
        localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
        localStorage.setItem('prutkon_warehouse_log', JSON.stringify(window.dbWarehouseLog.slice(0, 500)));
    }

    if (!order.checklist) order.checklist = {};
    order.checklist[itemIdx] = {
        ...(order.checklist[itemIdx] || {}),
        done: true,
        date: new Date().toLocaleDateString('ru-RU'),
        operator: window.currentUser?.name || 'Мастер смены'
    };
    window.saveOrders();

    window.selectProductionOrder();
    if (window.showToast) window.showToast(`Успешно списано со склада: ${it.name} (${qtyToWriteOff} шт)`, "success");
};

window.writeOffAllOrderItemsAction = () => {
    if (!selectedOrderId) return;
    const order = (window.orders || []).find(o => String(o.id) === String(selectedOrderId));
    if (!order) return;
    if (!confirm("Вы уверены, что хотите списать все несписанные комплектующие этого заказа со склада?")) return;

    const items = order.items || [];
    let successCount = 0;
    
    if (!order.checklist) order.checklist = {};

    items.forEach((it, idx) => {
        if (order.checklist[idx]?.done) return;
        
        const res = getWarehouseStock(it.art, it.name);
        if (!res.key) return;

        const qtyToWriteOff = parseFloat(it.qty) || 0;
        if (qtyToWriteOff <= 0) return;

        window.dbWarehouseInv[res.key] = Math.max(0, (window.dbWarehouseInv[res.key] || 0) - qtyToWriteOff);

        if (!window.dbWarehouseLog) window.dbWarehouseLog = [];
        const logEntry = {
            id: 'wh_log_' + Date.now() + '_' + idx,
            date: new Date().toISOString(),
            type: 'write_off',
            invoice_num: `НАРЯД-${selectedOrderId}`,
            supplier: 'Производство',
            destination: `Заказ №${selectedOrderId}`,
            carrier: 'Цех сборки',
            responsible: window.currentUser?.name || 'Мастер смены',
            items: [
                {
                    id: res.key,
                    art: it.art || res.key,
                    name: it.name,
                    qty: qtyToWriteOff,
                    price: it.price || 0,
                    priceKg: it.price || 0,
                    sumNoVat: qtyToWriteOff * (it.price || 0),
                    sumWithVat: qtyToWriteOff * (it.price || 0) * 1.2
                }
            ]
        };
        window.dbWarehouseLog.unshift(logEntry);
        
        order.checklist[idx] = {
            ...(order.checklist[idx] || {}),
            done: true,
            date: new Date().toLocaleDateString('ru-RU'),
            operator: window.currentUser?.name || 'Мастер смены'
        };
        successCount++;
    });

    if (successCount > 0) {
        if (window.saveWarehouseData) {
            window.saveWarehouseData();
        } else {
            localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
            localStorage.setItem('prutkon_warehouse_log', JSON.stringify(window.dbWarehouseLog.slice(0, 500)));
        }
        window.saveOrders();
        window.selectProductionOrder();
        if (window.showToast) window.showToast(`Успешно списано позиций со склада: ${successCount}`, "success");
    } else {
        if (window.showToast) window.showToast("Все позиции уже списаны со склада!", "info");
    }
};

window.toggleItemReady = (orderId, itemIdx, checked) => {
    const order = (window.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    if (!order.checklist) order.checklist = {};
    if (!order.checklist[itemIdx]) order.checklist[itemIdx] = {};
    order.checklist[itemIdx].ready = checked;
    window.saveOrders();
    window.selectProductionOrder();
    if (window.showToast) {
        window.showToast(checked ? "Деталь отмечена как готовая ✓" : "Деталь возвращена в работу", "info");
    }
};

window.sendOrderToProduction = async () => {
    if (!selectedOrderId) return;
    const order = (window.orders || []).find(o => String(o.id) === String(selectedOrderId));
    if (!order) return;

    order.status = "Производство";
    
    if (!order.audit) order.audit = [];
    order.audit.push({
        timestamp: new Date().toLocaleString('ru-RU'),
        user: window.currentUser?.name || 'Система',
        action: 'НАПРАВЛЕН В ПРОИЗВОДСТВО ИЗ ЗАКАЗ-НАРЯДА'
    });

    if (order.bitrixDealId && window.updateBitrixDealStage) {
        try {
            await window.updateBitrixDealStage(order.bitrixDealId, window.bitrixConfig?.mapping?.stage_production || 'C1:PREPARATION');
        } catch(e) { console.error("Bitrix update error:", e); }
    }

    window.saveOrders();
    window.selectProductionOrder();
    
    if (window.showToast) window.showToast(`Заказ №${selectedOrderId} успешно отправлен в производство!`, "success");
};
