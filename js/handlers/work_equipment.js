/* work_equipment.js - Work, Equipment, Procurement */

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('#work-tabs button');
    const contentTitle = document.getElementById('work-content-title');
    const contentArea = document.getElementById('work-content-area');

    window.workEquipmentSettings = window.safeParse ? window.safeParse('prutkon_work_equipment', {}) : {};
    if (!window.workEquipmentSettings || typeof window.workEquipmentSettings !== 'object') window.workEquipmentSettings = {};
    window.workSalaryEntries = window.safeParse ? window.safeParse('prutkon_salary_entries', {}) : {};
    if (!window.workSalaryEntries || typeof window.workSalaryEntries !== 'object') window.workSalaryEntries = {};

    const applyStoredValues = () => {
        Object.entries(window.workEquipmentSettings).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = value;
        });
    };

    const persistCurrentFields = () => {
        const fields = document.querySelectorAll('#work-content-area input[id], #work-content-area select[id], #work-content-area textarea[id]');
        fields.forEach(field => {
            window.workEquipmentSettings[field.id] = field.value;
        });
        localStorage.setItem('prutkon_work_equipment', JSON.stringify(window.workEquipmentSettings));
    };

    window.saveWorkEquipmentSettings = () => {
        persistCurrentFields();
        window.showToast('Настройки модуля сохранены', 'success');
    };

    window.handleWorkSalaryExtraChange = function(empId, value) {
        window.workSalaryEntries[String(empId)] = { extra: Number(value) || 0 };
        localStorage.setItem('prutkon_salary_entries', JSON.stringify(window.workSalaryEntries));
        renderSalaries();
        window.showToast('Доплата обновлена', 'success');
    };

    window.workEquipmentData = {
        conveyor_belts: {
            title: 'Ленты конвейерные',
            html: '<div class="form-group"><label>Метраж на складе (м)</label><input type="number" id="we-belt-meters" class="form-control" value="1200"></div>' +
                  '<div class="form-group"><label>Закупочная стоимость за 1м (₽)</label><input type="number" id="we-belt-price" class="form-control" value="850"></div>'
        },
        metal_rod: {
            title: 'Металл (пруток)',
            html: '<div class="form-group"><label>Запас Ст3 прутка (т)</label><input type="number" id="we-rod-stock" class="form-control" value="15.5"></div>' +
                  '<div class="form-group"><label>Цена за пруток (шт) (₽)</label><input type="number" id="we-rod-price" class="form-control" value="280"></div>'
        },
        equipment_cycles: {
            title: 'Оборудование и циклы работы',
            html: '<div class="form-group"><label>Цикл пресса (сек)</label><input type="number" id="we-press-cycle" class="form-control" value="45"></div>' +
                  '<div class="form-group"><label>Амортизация станков в день (₽)</label><input type="number" id="we-amort" class="form-control" value="2500"></div>'
        },
        salary: {
            title: 'ФОТ и ЗП',
            html: '<div style="margin-bottom:30px; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">' +
                  '<div class="form-group"><label>ФОТ для производства (ставка за смену ₽)</label><input type="number" id="we-shift-rate" class="form-control" value="3500"></div>' +
                  '<div class="form-group"><label>Оплата за сборку 1м (₽)</label><input type="number" id="we-labor" class="form-control" value="150"></div>' +
                  '</div>' +
                  '<div class="stats-grid mb-4" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px;">' +
                  '<div class="glass-panel" style="padding:25px;"><div class="neutral text-xs">Всего к выплате</div><h2 id="total-net">0 ₽</h2></div>' +
                  '<div class="glass-panel" style="padding:25px;"><div class="neutral text-xs">Общий ФОТ заказов</div><h2 id="total-fot">0 ₽</h2></div>' +
                  '<div class="glass-panel" style="padding:25px;"><div class="neutral text-xs">Реестр начислений</div><h2 id="total-tax">0 ₽</h2></div>' +
                  '</div>' +
                  '<div class="panel glass-panel">' +
                  '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h3 style="color:var(--brand-red); margin:0;">Ведомость выплат по сотрудникам</h3><button class="btn btn-primary btn-sm" onclick="window.showToast(\\\'Ведомость подготовлена\\\', \\\'success\\\')"><i class="fa-solid fa-check-double"></i> Зафиксировать</button></div>' +
                  '<table class="data-table"><thead><tr><th>ФИО сотрудника</th><th>Оклад</th><th>Премия (%)</th><th>Премия (фикс)</th><th>ГРОСС</th><th>К выплате</th></tr></thead>' +
                  '<tbody id="salary-tbody"></tbody></table>' +
                  '</div>'
        },
        costs: {
            title: 'Затраты и прочее',
            html: '<div class="form-group"><label>Аренда цеха в месяц (₽)</label><input type="number" id="we-rent" class="form-control" value="150000"></div>' +
                  '<div class="form-group"><label>Логистика средняя на заказ (₽)</label><input type="number" id="we-logistics" class="form-control" value="5000"></div>'
        },
        electricity: {
            title: 'Электроэнергия',
            html: '<div class="form-group"><label>Тариф за кВт (₽)</label><input type="number" id="we-electro" class="form-control" value="7.5"></div>' +
                  '<div class="form-group"><label>Расход электропечи в час (кВт)</label><input type="number" id="we-furnace-usage" class="form-control" value="35"></div>'
        },
        tools: {
            title: 'Инструменты и оснастка',
            html: '<div class="form-group"><label>Резцы (остаток шт)</label><input type="number" id="we-cutters" class="form-control" value="142"></div>' +
                  '<div class="form-group"><label>Наценка на инструмент (%)</label><input type="number" id="we-margin" class="form-control" value="35"></div>'
        }
    };

    const renderCategory = (categoryId) => {
        const config = window.workEquipmentData[categoryId];
        if (!config) return;
        contentTitle.innerText = config.title;
        contentArea.innerHTML = config.html;
        applyStoredValues();
        if (categoryId === 'salary') renderSalaries();
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', event => {
            persistCurrentFields();
            tabs.forEach(item => item.classList.remove('active'));
            const target = event.currentTarget;
            target.classList.add('active');
            renderCategory(target.getAttribute('data-cat'));
        });
    });

    const activeTab = document.querySelector('#work-tabs button.active');
    if (activeTab) {
        renderCategory(activeTab.getAttribute('data-cat'));
    }

    function renderSalaries() {
        const tbody = document.getElementById('salary-tbody');
        if (!tbody) return;

        const employees = (Array.isArray(window.dbEmployees) && window.dbEmployees.length ? window.dbEmployees : [
            { id: 1, name: 'Никитин И.', role: 'Администратор', base: 150000, share: 0.1, extra: 0 },
            { id: 2, name: 'Алексеев А.', role: 'Мастер', base: 85000, share: 0.05, extra: 0 }
        ]);

        const totalRevenue = (window.orders || [])
            .filter(order => !/провален/i.test(String(order.status || '')))
            .reduce((sum, order) => sum + (order.total || 0), 0);
        const totalFOT = totalRevenue * 0.25;

        let totalNetAll = 0;
        tbody.innerHTML = '';

        employees.forEach(emp => {
            const extra = Number(window.workSalaryEntries[String(emp.id)]?.extra ?? emp.extra ?? 0);
            const prem = totalFOT * (emp.share || 0);
            const gross = (emp.base || 0) + prem + extra;
            const net = gross * 0.87;
            totalNetAll += net;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.name}</strong><br><small class="neutral">${emp.role}</small></td>
                <td>${window.formatCurr ? window.formatCurr(emp.base) : emp.base}</td>
                <td class="emerald">+${window.formatCurr ? window.formatCurr(prem) : prem}</td>
                <td><input type="number" class="form-control" value="${extra}" style="width:100px; height:34px; padding:0 8px" onchange="window.handleWorkSalaryExtraChange('${emp.id}', this.value)"></td>
                <td class="neutral">${window.formatCurr ? window.formatCurr(gross) : gross}</td>
                <td style="font-weight:800; font-size:1.1rem" class="emerald">${window.formatCurr ? window.formatCurr(net) : net}</td>
            `;
            tbody.appendChild(tr);
        });

        const totalNet = document.getElementById('total-net');
        const totalFot = document.getElementById('total-fot');
        const totalTax = document.getElementById('total-tax');

        if (totalNet) totalNet.innerText = window.formatCurr ? window.formatCurr(totalNetAll) : totalNetAll;
        if (totalFot) totalFot.innerText = window.formatCurr ? window.formatCurr(totalFOT) : totalFOT;
        if (totalTax) totalTax.innerText = window.formatCurr ? window.formatCurr(totalNetAll * 0.13 / 0.87) : (totalNetAll * 0.13 / 0.87);
    }
});
