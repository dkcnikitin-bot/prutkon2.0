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

function parseSpecs(specs) {
    const source = String(specs || '');
    return {
        l: parseFloat(source.match(/L=([^,]+)/)?.[1] || 0),
        w: parseFloat(source.match(/W=([^,]+)/)?.[1] || 0),
        p: parseFloat(source.match(/P=([^,]+)/)?.[1] || 0)
    };
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
        div.style = `border-left: 5px solid ${isReadyStatus(order.status) ? 'var(--emerald-neon)' : 'var(--brand-red)'}; display:grid; grid-template-columns: 1fr 200px; gap:25px; padding:25px;`;

        let itemsHtml = '';
        (order.items || []).forEach(item => {
            const { l, w, p } = parseSpecs(item.specs);

            itemsHtml += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:10px 0;">
                    <strong style="color:var(--accent-blue);">${item.art || '---'}</strong> | ${item.name || 'Без названия'}
                    <div style="font-family:'JetBrains Mono', monospace; font-size:0.9rem; color:#fff; margin-top:8px; display:flex; gap:20px; flex-wrap:wrap;">
                        <span>L: <b style="color:var(--brand-red)">${l} мм</b></span>
                        <span>W: <b style="color:var(--brand-red)">${w} мм</b></span>
                        <span>P: <b style="color:var(--brand-red)">${p} мм</b></span>
                    </div>
                </div>
            `;

            if (l > 0 && p > 0) rodsTotal += Math.floor(l / p);
            if (l > 0) beltsTotal += (l / 1000) * 2;
            weightTotal += (l / 1000) * (w / 1000) * 12;
        });

        div.innerHTML = `
            <div>
                <h2 style="margin-bottom:15px; color:#fff;">Задание: ${order.id}</h2>
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
        window.printOrderReport('production', id);
        return;
    }
    window.showToast(`Техническая карта для ${id} пока недоступна`, 'info');
};
