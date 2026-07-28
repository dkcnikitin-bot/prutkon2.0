/* production.js - PRUTKON ERP Production Terminal Module */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderProd, 500);
});

window.refreshProductionData = renderProd;

function normalizeProductionStatus(status) {
    return String(status || '').toLowerCase();
}

function isProductionStatus(status) {
    const normalized = normalizeProductionStatus(status);
    return normalized.includes('производ') || normalized.includes('готов') || normalized.includes('отгруз');
}

function isReadyStatus(status) {
    const normalized = normalizeProductionStatus(status);
    return normalized.includes('готов') || normalized.includes('отгруз');
}

function getConveyorParams(order) {
    let l = order.conveyorLength || 0;
    let w = order.conveyorWidth || 0;
    let p = order.conveyorPitch || 0;

    // If not found in root, parse from items specs or order name
    if (!l || !w || !p) {
        const name = String(order.name || '');
        const match = name.match(/(\d+)\s*(?:мм|mm)?\s*[xXхХ]\s*(\d+)\s*(?:мм|mm)?\s*[xXхХ]\s*[шШ]\.?\s*(\d+)/i) || 
                      name.match(/(\d+)\s*[xXхХ]\s*(\d+)\s*[xXхХ]\s*[шШ]\.?\s*(\d+)/i) ||
                      name.match(/(\d+)\s*(?:мм|mm)?\s*[xXхХ]\s*(\d+)\s*(?:мм|mm)?/i);
        if (match) {
            if (match[3]) {
                const v1 = parseFloat(match[1]);
                const v2 = parseFloat(match[2]);
                w = Math.min(v1, v2);
                l = Math.max(v1, v2);
                p = parseFloat(match[3]);
            } else if (match[2]) {
                const v1 = parseFloat(match[1]);
                const v2 = parseFloat(match[2]);
                w = Math.min(v1, v2);
                l = Math.max(v1, v2);
            }
        }
    }
    
    // Fallback: search in items specs
    if (!w || !l) {
        (order.items || []).forEach(item => {
            const specs = String(item.specs || '');
            const rodLen = specs.match(/Длина:\s*(\d+)/i)?.[1];
            if (rodLen) w = parseFloat(rodLen);
            
            const beltLen = specs.match(/Длина ремня:\s*([\d.]+)/i)?.[1];
            if (beltLen) {
                l = Math.round(parseFloat(beltLen) * 1000 / 2);
            }
        });
    }

    return { l, w, p };
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

function renderProd() {
    const queue = document.getElementById('production-queue');
    if (!queue) return;

    const items = (window.orders || []).filter(order => isProductionStatus(order.status));

    let rodsTotal = 0;
    let weightTotal = 0;
    let beltsTotal = 0;

    queue.innerHTML = '';

    if (items.length === 0) {
        queue.innerHTML = '<div class="dash-empty">Нет активных заданий для производства</div>';
    }

    items.forEach(order => {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style = `border-left: 5px solid ${isReadyStatus(order.status) ? 'var(--emerald-neon)' : 'var(--brand-red)'}; display:grid; grid-template-columns: 1fr 200px; gap:25px; padding:25px; margin-bottom:20px;`;

        const { l, w, p } = getConveyorParams(order);

        let itemsHtml = '';
        (order.items || []).forEach((item, idx) => {
            const isDeducted = order.checklist && order.checklist[idx]?.done === true;
            const isReady = order.checklist && order.checklist[idx]?.ready === true;
            const stockRes = getWarehouseStock(item.art, item.name);

            let whActionHtml = '';
            if (isDeducted) {
                const check = order.checklist[idx];
                whActionHtml = `
                    <span style="color:var(--emerald-neon); font-size:0.75rem; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">
                        <i class="fa-solid fa-circle-check"></i> Списано
                    </span>
                `;
            } else {
                whActionHtml = `
                    <span style="display:inline-flex; align-items:center; gap:8px;">
                        <span style="font-size:0.75rem; color:#aaa;">На складе: <strong style="color:var(--brand-gold);">${stockRes.qty} шт</strong></span>
                        <button onclick="window.writeOffProdItem('${order.id}', ${idx})" class="btn btn-secondary" style="height:20px; padding:0 6px; font-size:0.6rem; font-weight:800; border:1px solid rgba(255,180,0,0.3); background:rgba(255,180,0,0.05); color:var(--brand-gold); border-radius:3px; cursor:pointer;">
                            Списать
                        </button>
                    </span>
                `;
            }

            const readyActionHtml = `
                <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-size:0.75rem; color:${isReady ? 'var(--emerald-neon)' : '#ccc'}; font-weight:bold;">
                    <input type="checkbox" ${isReady ? 'checked' : ''} onchange="window.toggleProdItemReady('${order.id}', ${idx}, this.checked)" style="width:14px; height:14px; cursor:pointer; margin:0;">
                    <span>${isReady ? 'Заготовлено ✓' : 'Заготовить'}</span>
                </label>
            `;

            itemsHtml += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:12px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                    <div>
                        <strong style="color:var(--accent-blue);">${item.art || '---'}</strong> | <span style="font-weight:700; color:#fff;">${item.name || 'Без названия'}</span>
                        <div style="font-size:0.75rem; color:#aaa; margin-top:3px;">
                            ${item.specs || 'Параметры отсутствуют'}
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <span style="font-family:'JetBrains Mono'; font-weight:900; font-size:1.05rem; color:#fff; background:rgba(255,255,255,0.03); padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">${item.qty}</span>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; min-width:160px;">
                            ${whActionHtml}
                            ${readyActionHtml}
                        </div>
                    </div>
                </div>
            `;

            if (l > 0 && p > 0) rodsTotal += Math.floor(l / p);
            if (l > 0) beltsTotal += (l / 1000) * 2;
            weightTotal += (l / 1000) * (w / 1000) * 12;
        });

        div.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                    <div>
                        <h2 style="margin:0 0 5px 0; color:#fff; font-family:'Outfit'; font-weight:900; font-size:1.6rem;">Задание: ${order.id}</h2>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${order.brand || '---'} • ${order.model || '---'} • ${order.name || '---'}</div>
                    </div>
                    <div style="text-align:right; font-family:'JetBrains Mono', monospace; font-size:1rem; color:#fff; background:rgba(237,28,36,0.05); border:1px solid rgba(237,28,36,0.15); padding:6px 15px; border-radius:8px;">
                        <span style="color:#aaa; font-size:0.75rem; text-transform:uppercase; font-weight:bold; display:block; margin-bottom:2px;">Размеры конвейера</span>
                        L: <b style="color:var(--brand-red)">${l} мм</b> | 
                        W: <b style="color:var(--brand-red)">${w} мм</b> | 
                        P: <b style="color:var(--brand-red)">${p} мм</b>
                    </div>
                </div>
                <div style="margin-bottom:20px;">${itemsHtml}</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <span class="badge ${isReadyStatus(order.status) ? 'badge-success' : 'badge-warning'}">${order.status}</span>
                    <span class="badge" style="background:rgba(255,255,255,0.05)">Заявка: ${order.date || '---'}</span>
                </div>
            </div>
            <div style="text-align:right; border-left:1px solid rgba(255,255,255,0.05); padding-left:20px; display:flex; flex-direction:column; justify-content:center; gap:10px;">
                ${isReadyStatus(order.status) ? `
                    <button class="btn btn-secondary" disabled><i class="fa-solid fa-box"></i> Ждет отгрузки</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.updateStatus('${order.id}', 'Производство')"><i class="fa-solid fa-undo"></i> Вернуть</button>
                ` : `
                    <button class="btn btn-primary" onclick="window.updateStatus('${order.id}', 'Заказ готов')"><i class="fa-solid fa-check"></i> Завершить</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.printTechnicalCard('${order.id}')"><i class="fa-solid fa-print"></i> Тех. карта</button>
                `}
            </div>
        `;
        queue.appendChild(div);
    });

    const rods = document.getElementById('summary-rods');
    const weight = document.getElementById('summary-weight');
    const belts = document.getElementById('summary-belts');

    if (rods) rods.innerText = rodsTotal + ' шт';
    if (weight) weight.innerText = weightTotal.toFixed(1) + ' кг';
    if (belts) belts.innerText = beltsTotal.toFixed(1) + ' м';
}

window.updateStatus = function(id, status) {
    const order = (window.orders || []).find(item => item.id === id);
    if (!order) return;

    order.status = status;
    window.saveOrders();

    if (window.logSystemEvent) {
        window.logSystemEvent('производство_статус', `Заказ ${id} -> ${status}`);
    }

    renderProd();
    window.showToast(`Задание ${id} обновлено: ${status}`, 'success');
};

window.printTechnicalCard = function(id) {
    if (window.printOrderReport) {
        window.printOrderReport('production_order', id);
        return;
    }
    window.showToast(`Техническая карта для ${id} пока недоступна`, 'info');
};

window.toggleProdItemReady = (orderId, itemIdx, checked) => {
    const order = (window.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    if (!order.checklist) order.checklist = {};
    if (!order.checklist[itemIdx]) order.checklist[itemIdx] = {};
    order.checklist[itemIdx].ready = checked;
    window.saveOrders();
    renderProd();
    if (window.showToast) {
        window.showToast(checked ? "Деталь заготовлена ✓" : "Деталь возвращена в работу", "info");
    }
};

window.writeOffProdItem = (orderId, itemIdx) => {
    const order = (window.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    const it = order.items?.[itemIdx];
    if (!it) return;

    const res = getWarehouseStock(it.art, it.name);
    if (!res.key) {
        alert("Товар не найден на складе!");
        return;
    }

    const qty = parseFloat(it.qty) || 0;
    if (res.qty < qty) {
        if (!confirm(`Недостаточно товара на складе! Доступно: ${res.qty}, требуется: ${qty}. Списать?`)) return;
    }

    window.dbWarehouseInv[res.key] = Math.max(0, res.qty - qty);
    
    if (!window.dbWarehouseLog) window.dbWarehouseLog = [];
    window.dbWarehouseLog.unshift({
        id: 'wh_log_' + Date.now(),
        date: new Date().toISOString(),
        type: 'write_off',
        invoice_num: `НАРЯД-${orderId}`,
        supplier: 'Производство',
        destination: `Заказ №${orderId}`,
        carrier: 'Цех сборки',
        responsible: window.currentUser?.name || 'Мастер смены',
        items: [{ id: res.key, art: it.art || res.key, name: it.name, qty: qty, price: it.price || 0 }]
    });

    if (window.saveWarehouseData) {
        window.saveWarehouseData();
    } else {
        localStorage.setItem('prutkon_warehouse_inv', JSON.stringify(window.dbWarehouseInv));
        localStorage.setItem('prutkon_warehouse_log', JSON.stringify(window.dbWarehouseLog));
    }

    if (!order.checklist) order.checklist = {};
    order.checklist[itemIdx] = {
        ...(order.checklist[itemIdx] || {}),
        done: true,
        date: new Date().toLocaleDateString('ru-RU'),
        operator: window.currentUser?.name || 'Мастер смены'
    };

    window.saveOrders();
    renderProd();
    if (window.showToast) window.showToast(`Успешно списано: ${it.name}`, "success");
};
