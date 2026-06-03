/* reports.js - PRUTKON ERP Reporting Module */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderReportsData, 500);
});

window.refreshReportsData = function() {
    renderReportsData();
    window.showToast('Отчеты обновлены', 'success');
};

function normalizeReportStatus(status) {
    return String(status || '').toLowerCase();
}

function classifyReportGroup(order) {
    const status = normalizeReportStatus(order.status);
    if (/провален/.test(status)) return 'Провалено';
    if (/успеш|принят|отгруж/.test(status)) return 'Завершено';
    if (/производ|готов/.test(status)) return 'Производство';
    if (/запрос|соглас|оплачен|предоплат|документ/.test(status)) return 'Согласование';
    return 'Новые и расчет';
}

function getReportGroups(orders) {
    const labels = ['Новые и расчет', 'Согласование', 'Производство', 'Завершено', 'Провалено'];
    return labels.map(label => ({
        label,
        items: orders.filter(order => classifyReportGroup(order) === label)
    }));
}

function renderReportsData() {
    const revenueEl = document.getElementById('rep-revenue');
    const ordersEl = document.getElementById('rep-orders');
    const avgEl = document.getElementById('rep-avg');
    const breakdownBody = document.getElementById('reports-breakdown-body');

    const orders = Array.isArray(window.orders) ? window.orders : [];
    const billableOrders = orders.filter(order => !/провален/i.test(String(order.status || '')));
    const totalRevenue = billableOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const avgRevenue = billableOrders.length > 0 ? totalRevenue / billableOrders.length : 0;

    if (revenueEl) revenueEl.innerText = window.formatCurr ? window.formatCurr(totalRevenue) : totalRevenue;
    if (ordersEl) ordersEl.innerText = totalOrders;
    if (avgEl) avgEl.innerText = window.formatCurr ? window.formatCurr(avgRevenue) : avgRevenue;

    if (breakdownBody) {
        const groups = getReportGroups(orders);
        breakdownBody.innerHTML = groups.map(group => {
            const sum = group.items.reduce((acc, order) => acc + (order.total || 0), 0);
            return `
                <tr>
                    <td>${group.label}</td>
                    <td>${group.items.length}</td>
                    <td class="emerald">${window.formatCurr ? window.formatCurr(sum) : sum}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="3" class="table-empty">Нет данных для аналитики</td></tr>';
    }
}
