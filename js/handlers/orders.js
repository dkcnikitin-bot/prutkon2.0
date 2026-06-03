/*
 * orders.js - ПРУТКОН ОС | Менеджер заказов (v19.0.0)
 * Интеграция с Битрикс24 и управление продажами
 */

console.log("📦 Orders Manager v19.0.0 loading...");

async function initManagerPanel() {
    // 1. Принудительная загрузка пользователей Битрикс24
    if (window.getBitrixUsers) {
        window.bitrixUsers = await window.getBitrixUsers();
        if (window.bitrixUsers && window.bitrixUsers.length > 0) {
            console.log(`✅ Синхронизировано ${window.bitrixUsers.length} пользователей CRM.`);
        } else {
            console.warn("⚠️ Битрикс24 вернул пустой список пользователей.");
        }
    }
    
    // 2. Рендеринг реестра с небольшой задержкой для инициализации core.js
    setTimeout(() => {
        renderOrders();
    }, 450);

    // 3. Настройка живого поиска
    const searchInput = document.getElementById('order-search');
    if (searchInput) searchInput.addEventListener('input', () => renderOrders());

    // 4. Популяция селектора исполнителей для задач
    populateTaskResponsibles();
}

const MANAGER_STAGES = [
    'Новая', 'В работе', 'Запрос доп сведений у клиента', 'Запрос поставщикам', 
    'Согласование КП', 'Счёт на предоплату', 'Заказ оплачен, подтвержден', 
    'В работе (производство)', 'Производство', 'Заказ готов', 
    'Разрешена отгрузка', 'Заказ отгружен', 'Заказ принят клиентом', 
    'Проверка оплаты и документов', 'Сделка успешна', 'Сделка провалена'
];

window.currentCardOrder = null;

// ==========================================
// 1. ГЛАВНЫЙ РЕЕСТР ПРОДАЖ (ОТРИСОВКА)
// ==========================================

function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('order-search')?.value || "").toLowerCase();
    const filterStatus = document.getElementById('filter-status')?.value || 'all';

    let items = (window.orders || []).filter(o => {
        const docText = (o.id + (o.clientName || "") + (o.art || "")).toLowerCase();
        const matchesSearch = docText.includes(searchTerm);
        
        let matchesStatus = true;
        if (filterStatus === 'active') matchesStatus = !['Сделка успешна', 'Сделка провалена'].includes(o.status);
        if (filterStatus === 'production') matchesStatus = (o.status || "").includes('Производ') || (o.status || "").includes('производ');
        if (filterStatus === 'done') matchesStatus = o.status === 'Сделка успешна';
        
        return matchesSearch && matchesStatus;
    });

    tbody.innerHTML = '';
    let totalSum = 0, waitingCount = 0, paidCount = 0, syncedCount = 0;

    items.forEach(o => {
        const curTotal = (o.total || 0);
        totalSum += curTotal;
        if (o.status?.includes('Запрос') || o.status?.includes('уточнения')) waitingCount++;
        if (o.status?.includes('оплачен') || o.status?.toLowerCase().includes('производ')) paidCount++;
        if (o.bitrixDealId) syncedCount++;

        const tr = document.createElement('tr');
        tr.onclick = (e) => { 
            if (['BUTTON', 'I', 'A'].includes(e.target.tagName)) return;
            window.openDealCard(o.id); 
        };
        
        let bxClass = 'bx-initial';
        if (o.status?.includes('Производ') || o.status?.includes('работе')) bxClass = 'bx-prod';
        if (o.status === 'Сделка успешна' || o.status?.includes('готов')) bxClass = 'bx-success';
        if (o.status?.includes('Запрос') || o.status?.includes('провалена')) bxClass = 'bx-alert';

        tr.innerHTML = `
            <td><strong style="color:var(--brand-red); font-family:'JetBrains Mono';">${o.id}</strong></td>
            <td style="opacity:0.6; font-weight:700; font-size:11px;">${o.date}</td>
            <td>
                <div style="font-weight:700; color:#fff; font-size:14px;">${o.art || 'ОБЪЕКТ НЕ УКАЗАН'}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:3px;"><i class="fa-solid fa-user-circle"></i> ${o.clientName || '---'}</div>
            </td>
            <td style="font-weight:900; color:#fff; font-family:'JetBrains Mono'; font-size:1.1rem;">${window.formatCurrency(curTotal)}</td>
            <td>
                <span class="bx-badge ${bxClass}">${o.status || 'ВХОДЯЩИЙ'}</span>
            </td>
            <td style="text-align:right;">
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="action-btn" style="padding:0; width:34px;" onclick="event.stopPropagation(); window.openTaskModal('${o.id}', '${o.bitrixDealId}')"><i class="fa-solid fa-thumbtack"></i></button>
                    <button class="action-btn" style="padding:0; width:34px;" onclick="event.stopPropagation(); window.openDealCard('${o.id}')"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateMetricsDashboard(totalSum, waitingCount, paidCount, syncedCount, items.length);
}
window.renderOrders = renderOrders;

function updateMetricsDashboard(total, waiting, paid, synced, totalCount) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
    el('stats-total-sum', window.formatCurrency(total));
    el('stats-waiting', waiting);
    el('stats-paid', paid);
    
    const syncEl = document.getElementById('stats-bitrix-sync');
    if (syncEl) {
        const percent = totalCount > 0 ? Math.round((synced / totalCount) * 100) : 100;
        syncEl.innerText = percent + "%";
    }
}

// ==========================================
// 2. ЦЕНТР УПРАВЛЕНИЯ ЗАКАЗОМ
// ==========================================

window.openDealCard = async (id) => {
    console.log("📂 Открытие Центра Управления ПРУТКОН:", id);
    const o = window.orders.find(it => it.id === id);
    if (!o) return;
    window.currentCardOrder = o;

    const el = (id, txt) => { const e = document.getElementById(id); if (e) e.innerText = txt; };
    el('card-order-id', o.id);
    el('card-order-date', `ЗАРЕГИСТРИРОВАН В БАЗЕ ПРУТКОН: ${o.date}`);
    el('card-total-sum', window.formatCurrency(o.total || 0));
    
    const badge = document.getElementById('card-status-badge');
    if (badge) {
        badge.innerText = (o.status || 'ВХОДЯЩИЙ').toUpperCase();
        let bCls = 'bx-initial';
        if (o.status?.includes('Производ') || o.status?.includes('работе')) bCls = 'bx-prod';
        if (o.status?.includes('готов') || o.status === 'Сделка успешна') bCls = 'bx-success';
        if (o.status?.includes('Запрос')) bCls = 'bx-alert';
        badge.className = 'bx-badge ' + bCls;
    }
    
    el('card-client-name', o.clientName || 'ЗАПРОС CRM...');
    el('card-client-phone', o.clientPhone || '---');
    
    const avatar = document.getElementById('card-client-avatar');
    if (avatar) avatar.innerText = (o.clientName || "П")[0].toUpperCase();

    // Заполнение селектора стадий
    const sel = document.getElementById('card-status-select');
    if (sel) {
        sel.innerHTML = MANAGER_STAGES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('');
        sel.onchange = (ev) => window.handleStatusChange(o.id, ev.target.value);
    }

    // Рендеринг спецификации изделий
    const itemsCont = document.getElementById('card-items-container');
    if (itemsCont) {
        itemsCont.innerHTML = (o.items || []).map(i => `
            <div style="padding:15px 30px; border-bottom:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01);">
                <div style="flex:1;">
                    <div style="font-weight:700; color:#fff; font-size:14px;">${i.name}</div>
                    <div style="font-size:11px; opacity:0.3; margin-top:4px; font-family:'JetBrains Mono'; font-weight:700;">
                        АРТИКУЛ: ${i.art || '---'} | ХОД: ${i.stroke || 0}мм | КОЛИЧЕСТВО: ${i.qty || 1} шт.
                    </div>
                </div>
                <div style="text-align:right;">
                    <span style="font-weight:900; color:var(--emerald-neon); font-size:1.1rem; font-family:'JetBrains Mono';">${window.formatCurrency((i.qty||1)*(i.price||0))}</span>
                </div>
            </div>
        `).join('') || `<div style="padding:60px; text-align:center; opacity:0.1; font-weight:900; letter-spacing:3px;">ПУСТОЙ СПИСОК</div>`;
    }

    // Логика блока утверждения
    const appBox = document.getElementById('approval-box');
    if (appBox) {
        const isApprover = (window.currentUser?.name?.includes('Алексей') || window.currentUser?.role === 'Администратор');
        appBox.style.display = (isApprover && o.status === 'Запрос доп сведений') ? 'flex' : 'none';
    }

    // Блокировка редактирования для запущенных заказов
    const isLocked = ['Производство', 'Заказ готов', 'Заказ отгружен', 'Сделка успешна'].includes(o.status);
    const editBtn = document.getElementById('edit-order-btn');
    const lockMsg = document.getElementById('edit-lock-msg');
    if (editBtn) editBtn.style.display = isLocked ? 'none' : 'block';
    if (lockMsg) lockMsg.style.display = isLocked ? 'block' : 'none';

    document.getElementById('deal-card-modal').style.display = 'flex';
    
    // Подгрузка данных из CRM в реальном времени
    if (o.bitrixDealId) {
        window.fetchBitrixContactDetails(o.bitrixDealId);
        window.renderBitrixTimeline(o.bitrixDealId);
    }
    
    window.refreshCardStatusUI();
    window.renderInternalLog(o);
};

// ==========================================
// 3. CRM, ЗАДАЧИ И ТЕХНИЧЕСКИЙ АУДИТ
// ==========================================

window.handleStatusChange = (id, newStatus) => {
    const o = window.orders.find(it => it.id === id);
    if (!o) return;
    o.status = newStatus;
    window.addAudit(id, `ЭТАП СМЕНЕН: ${newStatus}`, window.currentUser?.name);
    window.saveOrders();
    renderOrders();
    if (window.currentCardOrder?.id === id) window.refreshCardStatusUI();
};

window.sendCardComment = async () => {
    const input = document.getElementById('card-comment-input');
    const o = window.currentCardOrder;
    if (!o || !o.bitrixDealId || !input.value.trim()) return;
    
    const res = await window.addBitrixDealComment(o.bitrixDealId, "🚀 ПРУТКОН УВЕДОМЛЕНИЕ: " + input.value.trim());
    if (res) {
        input.value = '';
        window.renderBitrixTimeline(o.bitrixDealId);
    }
};

window.renderBitrixTimeline = async (dealId) => {
    const list = document.getElementById('card-timeline-list');
    if (!list) return;
    
    const comments = await window.getBitrixTimelineComments(dealId);
    if (!comments || comments.length === 0) {
        list.innerHTML = `<div style="text-align:center; opacity:0.1; padding:45px;">ИСТОРИЯ В CRM ОТСУТСТВУЕТ</div>`;
        return;
    }
    
    list.innerHTML = comments.map(it => {
        const isTask = it.taskId;
        const statusIcon = it.isCompleted ? '<i class="fa-solid fa-check-double" style="color:var(--emerald-neon)"></i>' : '<i class="fa-solid fa-clock" style="color:var(--gold-industrial)"></i>';
        const finishAction = (isTask && !it.isCompleted) 
            ? `<button class="btn btn-primary btn-sm" style="margin-top:10px; font-size:9px; padding:4px 10px;" onclick="window.completeBitrixTask('${it.taskId}').then(() => window.renderBitrixTimeline('${dealId}'))">ЗАВЕРШИТЬ ЗАДАЧУ</button>` 
            : '';

        return `
            <div class="timeline-entry ${isTask?'is-task':''}" style="${it.isCompleted ? 'opacity:0.5; border-left:3px solid var(--emerald-neon)' : (isTask ? 'border-left:3px solid var(--gold-industrial)' : '')}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-size:9px; color:var(--text-muted); font-weight:800; margin-bottom:5px; text-transform:uppercase;">${it.date} | ${it.author || 'CRM'}</div>
                    ${isTask ? statusIcon : ''}
                </div>
                <div style="font-size:12px; color:#fff; font-weight:700; line-height:1.4;">${it.text}</div>
                ${finishAction}
            </div>
        `;
    }).join('');
};

window.renderInternalLog = (o) => {
    const cont = document.getElementById('card-audit-list');
    if (!cont) return;
    cont.innerHTML = (o.audit || []).map(a => `
        <div style="margin-bottom:10px; border-bottom:1px solid var(--border-glass); padding-bottom:6px;">
            <div style="font-weight:900; color:#fff; font-size:10px; text-transform:uppercase;">${a.action}</div>
            <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); font-weight:800; margin-top:3px;">
                <span>${a.timestamp}</span><span>${a.user}</span>
            </div>
        </div>
    `).reverse().join('');
};

window.refreshCardStatusUI = () => {
    const o = window.currentCardOrder;
    if (!o) return;
    const stages = ["Новый заказ", "Расчет", "Запрос доп сведений", "Производство", "Готов к отгрузке", "Выполнен"];
    const curIdx = stages.findIndex(s => (o.status || "").toLowerCase().includes(s.toLowerCase()));
    
    const stepper = document.getElementById('card-status-stepper');
    if (stepper) {
        stepper.innerHTML = stages.map((s, i) => `
            <div style="display:flex; align-items:center; gap:20px; opacity:${i<=curIdx?'1':'0.2'}">
                <div style="width:14px; height:2px; background:${i<=curIdx?'var(--brand-red)':'var(--border-glass)'};"></div>
                <span style="font-size:10px; font-weight:${i===curIdx?'900':'500'}; color:#fff; text-transform:uppercase; letter-spacing:1px;">${s}</span>
            </div>
        `).join('');
    }
};



window.approvalSuccessAction = async () => {
    if (!window.currentCardOrder) return;
    const o = window.currentCardOrder;
    o.status = "Производство";
    window.addAudit(o.id, "ЗАКАЗ ПОДТВЕРЖДЕН РУКОВОДИТЕЛЕМ", "Власов Алексей");
    if (o.bitrixDealId) await window.updateBitrixDealStage(o.bitrixDealId, window.bitrixConfig.mapping?.stage_production);
    window.saveOrders();
    renderOrders();
    window.refreshCardStatusUI();
    document.getElementById('approval-box').style.display = 'none';
};

window.approvalRejectAction = async () => {
    const o = window.currentCardOrder;
    const reason = prompt("Причина отклонения:");
    if (!o || !reason) return;
    o.status = "Расчет";
    window.addAudit(o.id, `ОТКЛОНЕНО РУКОВОДИТЕЛЕМ. КОММЕНТАРИЙ: ${reason}`, "Власов Алексей");
    window.saveOrders();
    renderOrders();
    window.refreshCardStatusUI();
    document.getElementById('approval-box').style.display = 'none';
};

window.editCurrentOrder = () => {
    if (!window.currentCardOrder) return;
    localStorage.setItem('prutkon_edit_order', JSON.stringify(window.currentCardOrder));
    window.location.href = 'calculator.html';
};

async function populateTaskResponsibles() {
    const sel = document.getElementById('task-responsible');
    if (!sel) return;
    const users = window.bitrixUsers || await window.getBitrixUsers();
    sel.innerHTML = '<option value="">Выбрать исполнителя из CRM...</option>' + 
        (users || []).map(u => `<option value="${u.ID}">${u.NAME} ${u.LAST_NAME || ''}</option>`).join('');
}

window.sendForApprovalAction = async () => {
    const o = window.currentCardOrder;
    if (!o) return;

    window.confirmAction('Утверждение запуска', `Отправить заказ ${o.id} на согласование?`, async () => {
        o.status = "Запрос доп сведений";
        window.saveOrders();
        renderOrders();
        window.refreshCardStatusUI();
        
        if (o.bitrixDealId) {
            const alexey = (window.bitrixUsers || []).find(u => u.NAME?.includes('Алексей') && u.LAST_NAME?.includes('Власов'));
            await window.callBitrix('tasks.task.add', { fields: { 
                TITLE: `⚙️ КОНТРОЛЬ ЗАПУСКА ЗАКАЗА: ${o.id}`, 
                DESCRIPTION: `СРОЧНО: Требуется утверждение спецификации заказа №${o.id}. Итого к оплате: ${o.total} руб.`, 
                RESPONSIBLE_ID: alexey ? alexey.ID : null, 
                UF_CRM_TASK: [`D_${o.bitrixDealId}`],
                PRIORITY: 2
            } });
            window.renderBitrixTimeline(o.bitrixDealId);
        }
    });
};

window.syncOrdersWithBitrix = async () => {
    const linkedOrders = (window.orders || []).filter(order => order.bitrixDealId);
    if (!linkedOrders.length) {
        window.showToast('Нет заказов, связанных с Bitrix24', 'info');
        return;
    }

    window.showToast('Синхронизирую заказы с Bitrix24...', 'info');
    let updatedCount = 0;

    for (const order of linkedOrders) {
        const deal = await window.getBitrixDeal(order.bitrixDealId);
        if (!deal) continue;

        order.total = parseFloat(deal.OPPORTUNITY || order.total || 0);
        updatedCount++;
    }

    window.saveOrders();
    renderOrders();

    if (window.currentCardOrder?.id) {
        const refreshed = (window.orders || []).find(order => order.id === window.currentCardOrder.id);
        if (refreshed) window.currentCardOrder = refreshed;
    }

    window.showToast(`Синхронизация завершена: ${updatedCount} заказ(ов) обновлено`, 'success');
};

window.syncSingleOrderWithBitrix = async (id) => {
    const o = window.orders.find(it => it.id === id);
    if (!o || !o.bitrixDealId) return;
    window.showToast("Синхронизация с сервером...", "info");
    const deal = await window.getBitrixDeal(o.bitrixDealId);
    if (deal) {
        o.total = parseFloat(deal.OPPORTUNITY || 0);
        window.saveOrders(); renderOrders();
        if (window.currentCardOrder?.id === id) window.openDealCard(id);
        window.showToast("Сумма обновлена из Битрикс24", "success");
    }
};
