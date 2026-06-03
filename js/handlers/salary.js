/* salary.js - PRUTKON ERP Salary Module */

document.addEventListener('DOMContentLoaded', () => {
    renderSalaries();
});

window.dbSalaryEntries = window.safeParse ? window.safeParse('prutkon_salary_entries', {}) : {};
if (!window.dbSalaryEntries || typeof window.dbSalaryEntries !== 'object') window.dbSalaryEntries = {};

function getSalaryRevenueBase() {
    return (window.orders || [])
        .filter(order => !/провален/i.test(String(order.status || '')))
        .reduce((sum, order) => sum + (order.total || 0), 0);
}

window.handleSalaryExtraChange = function(empId, value) {
    window.dbSalaryEntries[String(empId)] = {
        extra: Number(value) || 0
    };
    localStorage.setItem('prutkon_salary_entries', JSON.stringify(window.dbSalaryEntries));
    renderSalaries();
    window.showToast('Доплата сохранена', 'success');
};

window.payAllSalaries = function() {
    window.logSystemEvent?.('salary_paid', 'Зафиксирована ведомость выплат');
    window.showToast('Ведомость выплат зафиксирована', 'success');
};

function renderSalaries() {
    const tbody = document.getElementById('salary-tbody');
    if (!tbody) return;

    const employees = (Array.isArray(window.dbEmployees) && window.dbEmployees.length ? window.dbEmployees : [
        { id: 1, name: 'Никитин И.', role: 'Главный инженер', base: 150000, share: 0.1, extra: 0 },
        { id: 2, name: 'Алексеев А.', role: 'Мастер цеха', base: 85000, share: 0.05, extra: 0 }
    ]);

    const totalRevenue = getSalaryRevenueBase();
    const totalFOT = totalRevenue * 0.25;

    let totalNetAll = 0;
    tbody.innerHTML = '';

    employees.forEach(emp => {
        const extra = Number(window.dbSalaryEntries[String(emp.id)]?.extra ?? emp.extra ?? 0);
        const prem = totalFOT * (emp.share || 0);
        const gross = (emp.base || 0) + prem + extra;
        const net = gross * 0.87;
        totalNetAll += net;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${emp.name}</strong><br><small class="neutral">${emp.role}</small></td>
            <td>${window.formatCurr(emp.base)}</td>
            <td class="emerald">+${window.formatCurr(prem)}</td>
            <td><input type="number" class="form-control" value="${extra}" style="width:100px; height:34px; padding:0 8px" onchange="window.handleSalaryExtraChange('${emp.id}', this.value)"></td>
            <td class="neutral">${window.formatCurr(gross)}</td>
            <td style="font-weight:800; font-size:1.1rem" class="emerald">${window.formatCurr(net)}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalNet = document.getElementById('total-net');
    const totalFot = document.getElementById('total-fot');
    const totalTax = document.getElementById('total-tax');

    if (totalNet) totalNet.innerText = window.formatCurr(totalNetAll);
    if (totalFot) totalFot.innerText = window.formatCurr(totalFOT);
    if (totalTax) totalTax.innerText = window.formatCurr(totalNetAll * 0.13 / 0.87);
}
