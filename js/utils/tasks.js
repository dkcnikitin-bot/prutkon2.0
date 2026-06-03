/* 
 * tasks.js - ПРУТКОН ОС | CRM Task Engine (v18.0.0 Platinum)
 */

(function(window) {
    const Tasks = {
        config: { modalId: 'task-modal', dealInputId: 'task-deal-id', titleInputId: 'task-title', descInputId: 'task-desc', priorityInputId: 'task-priority', deadlineInputId: 'task-deadline', respInputId: 'task-responsible' },
        templates: [
            { id: 'call', title: '📞 Созвониться', desc: 'Уточнить замеры L/W/P' },
            { id: 'payment', title: '💰 Счет', desc: 'Выставить КП и счет' },
            { id: 'prod', title: '🏗️ В работу', desc: 'Передать в цех' }
        ],
        async open(erpId, bitrixDealId) {
            const modal = document.getElementById(this.config.modalId);
            if (!modal) return;
            document.getElementById(this.config.dealInputId).value = bitrixDealId || '';
            document.getElementById(this.config.titleInputId).value = `ЗАДАЧА ПРУТКОН: ${erpId}`;
            this.renderTemplates();
            await this.populateUsers();
            modal.style.display = 'flex';
        },
        renderTemplates() {
            const c = document.getElementById('task-templates-container');
            if (c) c.innerHTML = this.templates.map(t => `<button type="button" class="template-pill" onclick="window.Tasks.applyTemplate('${t.id}')">${t.title}</button>`).join('');
        },
        applyTemplate(id) {
            const t = this.templates.find(x => x.id === id);
            if (!t) return;
            document.getElementById(this.config.titleInputId).value = t.title;
            document.getElementById(this.config.descInputId).value = t.desc;
        },
        async populateUsers() {
            const s = document.getElementById(this.config.respInputId);
            if (!s) return;
            const users = window.bitrixUsers || await window.getBitrixUsers();
            s.innerHTML = (users || []).map(u => `<option value="${u.ID}">${u.NAME} ${u.LAST_NAME || ''}</option>`).join('');
        },
        async create() {
            const f = { TITLE: document.getElementById(this.config.titleInputId).value, RESPONSIBLE_ID: document.getElementById(this.config.respInputId).value, UF_CRM_TASK: [`D_${document.getElementById(this.config.dealInputId).value}`] };
            const res = await window.callBitrix('tasks.task.add', { fields: f });
            if (res) { window.showToast("Задача создана", "success"); this.close(); }
        },
        close() { document.getElementById(this.config.modalId).style.display = 'none'; }
    };
    window.Tasks = Tasks;
    window.openTaskModal = (erpId, bId) => Tasks.open(erpId, bId);
    window.confirmCreateTask = () => Tasks.confirm();
})(window);
