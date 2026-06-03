/* settings.js v20 - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ */

window.ROLE_PRESETS = ['Администратор', 'Директор', 'Зам директора', 'Менеджер'];

window.ROLE_PERMISSIONS = {
    'Администратор': ['all'],
    'Директор': ['all', 'reports', 'settings'],
    'Зам директора': ['production', 'equipment', 'orders', 'reports'],
    'Менеджер': ['orders', 'prices', 'calculator', 'production']
};

window.PROGRAM_VERSIONS = [
    { version: '8.6.0', date: '2026-04-02', changes: 'Переделка сотрудников в карточки, 4 новые роли, история версий' },
    { version: '8.5.4', date: '2026-04-02', changes: 'Автоподключение, резервная копия, экспорт логов' },
    { version: '8.5.3', date: '2026-04-01', changes: 'Роли доступа, статус Firebase' },
    { version: '8.5.2', date: '2026-03-30', changes: 'Дизайн glassmorphism, логирование' },
    { version: '8.5.1', date: '2026-03-28', changes: 'Исправления багов HTML' },
    { version: '8.5.0', date: '2026-03-25', changes: 'Первая версия ERP ПРУТКОН' }
];

window.settingsChangeLog = [];
window.logID = 0;
window.editingEmployeeIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Settings.js загружен');
    
    // Загружаем логи из localStorage
    const savedLogs = localStorage.getItem('prutkon_settings_log');
    if (savedLogs) {
        try {
            window.settingsChangeLog = JSON.parse(savedLogs);
            window.logID = window.settingsChangeLog.length;
            console.log('📝 Загружено ' + window.logID + ' логов');
        } catch(e) {
            console.error('❌ Ошибка загрузки логов:', e);
        }
    }
    
    setTimeout(() => {
        console.log('🔌 Подключение Firebase...');
        
        // Инициализируем Firebase соединение
        if (window.connectFirebase) {
            window.connectFirebase(true);
        }
        
        window.initializeEmployees();
        window.renderEmpSettings();
        window.updateFirebaseStatusDisplay();
        window.renderVersionHistory();
        
        console.log('✅ Инициализация завершена');
    }, 100);
});

// === ИНИЦИАЛИЗАЦИЯ СОТРУДНИКОВ ===
window.initializeEmployees = function() {
    if (!window.dbEmployees || window.dbEmployees.length === 0) {
        window.dbEmployees = [
            { 
                id: 1,
                name: 'Никитин И.И.', 
                role: 'Администратор', 
                pwd: '623401', 
                base: 180000, 
                share: 0.10, 
                signature: 'Никитин И.И.',
                status: 'Активен',
                hired: '2025-01-01',
                dept: 'Администрация',
                phone: '+7(999)000-00-00'
            },
            { 
                id: 2,
                name: 'Директор', 
                role: 'Директор', 
                pwd: '623401', 
                base: 150000, 
                share: 0.08, 
                signature: 'Директор',
                status: 'Активен',
                hired: '2025-01-05',
                dept: 'Администрация',
                phone: ''
            },
            { 
                id: 3,
                name: 'Администратор', 
                role: 'Администратор', 
                pwd: '623401', 
                base: 75000, 
                share: 0.02, 
                signature: 'Администратор',
                status: 'Активен',
                hired: '2025-01-10',
                dept: 'IT',
                phone: ''
            }
        ];
        localStorage.setItem('prutkon_employees', JSON.stringify(window.dbEmployees));
        console.log('✅ Создано 3 сотрудников по умолчанию');
    } else {
        console.log('📋 Загружено ' + window.dbEmployees.length + ' сотрудников из localStorage');
    }
};

// === ОБНОВЛЕНИЕ СТАТУСА FIREBASE ===
window.updateFirebaseStatusDisplay = function() {
    const statusEl = document.getElementById('firebase-status');
    const textEl = document.getElementById('firebase-status-text');
    
    if (!statusEl || !textEl) {
        console.warn('⚠️ Элементы статуса Firebase не найдены в DOM');
        return;
    }
    
    const isConnected = window.fbConnected === true;
    const hasCloud = window.fbDB !== undefined;
    
    console.log('🔍 Firebase status check - isConnected:', isConnected, 'hasCloud:', hasCloud);
    
    if (isConnected && hasCloud) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-check" style="color:#00ff9d; animation: glow 1.5s infinite;"></i>';
        textEl.innerText = '✅ Cloud Firestore подключена';
        console.log('✅ Firebase подключена');
    } else if (!isConnected && hasCloud) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-exclamation" style="color:#ffaa00;"></i>';
        textEl.innerText = '⚠️ Локальный режим (данные сохраняются локально)';
        console.log('⚠️ Firebase недоступна - локальный режим');
    } else {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-slash" style="color:#ff1e27;"></i>';
        textEl.innerText = '❌ Нет соединения (используется LocalStorage)';
        console.log('❌ Нет Firebase SDK');
    }
};

// === ТАБЛИЦА СОТРУДНИКОВ ===
window.renderEmpSettings = function() {
    const tbody = document.getElementById('settings-emp-tbody');
    if (!tbody) {
        console.error('❌ Таблица #settings-emp-tbody не найдена!');
        return;
    }

    console.log('🔄 Рендеринг таблицы сотрудников...');
    window.initializeEmployees();
    tbody.innerHTML = '';
    
    if (!window.dbEmployees || window.dbEmployees.length === 0) {
        console.warn('⚠️ Нет сотрудников для отображения');
        return;
    }
    
    window.dbEmployees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'cursor: pointer; transition: all 0.2s ease;';
        tr.onmouseover = () => tr.style.opacity = '0.8';
        tr.onmouseout = () => tr.style.opacity = '1';
        
        tr.innerHTML = `
            <td style="font-weight:500; color:#00ff9d;">${emp.name}</td>
            <td><span style="background:rgba(255,30,39,0.2); padding:4px 10px; border-radius:4px; font-size:0.85rem;">${emp.role}</span></td>
            <td style="color:#ffaa00; text-align:center;"><i class="fa-solid fa-circle-info"></i></td>
            <td style="text-align:right;">
                <button class="action-btn" title="Редактировать" onclick="window.openEmployeeCard(${index}); return false;" style="margin-right:5px;"><i class="fa-solid fa-edit"></i></button>
                <button class="action-btn" title="Удалить" onclick="window.delEmp(${index}); return false;"><i class="fa-solid fa-trash" style="color:#ff1e27;"></i></button>
            </td>
        `;
        
        // Клик на строку = открыть карточку
        tr.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                console.log('👆 Клик на сотрудника:', emp.name);
                window.openEmployeeCard(index);
            }
        });
        
        tbody.appendChild(tr);
    });
    
    console.log('✅ Таблица отрендерена');
};

// === ОТКРЫТЬ КАРТОЧКУ СОТРУДНИКА ===
window.openEmployeeCard = function(index) {
    console.log('🔓 Открываю карточку сотрудника #' + index);
    
    if (!window.dbEmployees[index]) {
        console.error('❌ Сотрудник #' + index + ' не найден');
        return;
    }
    
    window.editingEmployeeIndex = index;
    const emp = window.dbEmployees[index];
    
    // Создаём или получаем модальное окно
    let modal = document.getElementById('emp-card-modal');
    if (!modal) {
        console.log('📦 Создаю новое модальное окно');
        modal = document.createElement('div');
        modal.id = 'emp-card-modal';
        document.body.appendChild(modal);
    }
    
    let roleOptions = window.ROLE_PRESETS.map(r => 
        `<option value="${r}" ${emp.role === r ? 'selected' : ''}>${r}</option>`
    ).join('');
    
    const html = `
        <div class="panel glass-panel" style="width: 500px; max-height: 85vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--brand-red); margin: 0;"><i class="fa-solid fa-user-circle"></i> Карточка сотрудника</h3>
                <button onclick="window.closeEmployeeCard()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#888;">✕</button>
            </div>
            
            <div class="form-group">
                <label>Полное имя</label>
                <input type="text" id="emp-name" class="form-control" value="${emp.name}" style="height:40px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Роль доступа</label>
                    <select id="emp-role" class="form-control" style="height:40px;">
                        ${roleOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Статус</label>
                    <select id="emp-status" class="form-control" style="height:40px;">
                        <option value="Активен" ${emp.status === 'Активен' ? 'selected' : ''}>Активен</option>
                        <option value="Отпуск" ${emp.status === 'Отпуск' ? 'selected' : ''}>Отпуск</option>
                        <option value="Уволен" ${emp.status === 'Уволен' ? 'selected' : ''}>Уволен</option>
                    </select>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Оклад (руб.)</label>
                    <input type="number" id="emp-base" class="form-control" value="${emp.base}" style="height:40px;">
                </div>
                <div class="form-group">
                    <label>% ФОТ</label>
                    <input type="number" id="emp-share" class="form-control" value="${((emp.share || 0) * 100).toFixed(0)}" style="height:40px;" placeholder="%">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Пароль (623401 по умолч.)</label>
                    <input type="password" id="emp-pwd" class="form-control" value="${emp.pwd}" style="height:40px;">
                </div>
                <div class="form-group">
                    <label>Подпись</label>
                    <input type="text" id="emp-signature" class="form-control" value="${emp.signature || ''}" style="height:40px;">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Дата приёма</label>
                    <input type="date" id="emp-hired" class="form-control" value="${emp.hired}" style="height:40px;">
                </div>
                <div class="form-group">
                    <label>Отдел</label>
                    <input type="text" id="emp-dept" class="form-control" value="${emp.dept || ''}" style="height:40px;">
                </div>
            </div>
            
            <div class="form-group">
                <label>Телефон</label>
                <input type="tel" id="emp-phone" class="form-control" value="${emp.phone || ''}" style="height:40px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 25px;">
                <button class="btn btn-secondary" onclick="window.closeEmployeeCard()" style="cursor:pointer;"><i class="fa-solid fa-xmark"></i> Отмена</button>
                <button class="btn btn-primary" onclick="window.saveEmployeeCard()" style="cursor:pointer;"><i class="fa-solid fa-check"></i> Сохранить</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    modal.className = 'modal active';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex !important; align-items: center; justify-content: center; z-index: 1000;';
    
    // Закрытие при клике вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('👆 Закрытие карточки (клик вне окна)');
            window.closeEmployeeCard();
        }
    });
    
    console.log('✅ Карточка открыта для', emp.name);
};

window.closeEmployeeCard = function() {
    console.log('🔒 Закрываю карточку');
    const modal = document.getElementById('emp-card-modal');
    if (modal) {
        modal.className = 'modal';
        modal.style.display = 'none';
    }
    window.editingEmployeeIndex = null;
};

window.saveEmployeeCard = function() {
    if (window.editingEmployeeIndex === null) {
        console.error('❌ Нет открытой карточки');
        return;
    }
    
    const idx = window.editingEmployeeIndex;
    const emp = window.dbEmployees[idx];
    const oldData = JSON.parse(JSON.stringify(emp));
    
    console.log('💾 Сохраняю карточку для', emp.name);
    
    emp.name = document.getElementById('emp-name').value;
    emp.role = document.getElementById('emp-role').value;
    emp.status = document.getElementById('emp-status').value;
    emp.base = parseInt(document.getElementById('emp-base').value) || 0;
    emp.share = parseFloat(document.getElementById('emp-share').value) / 100 || 0;
    emp.pwd = document.getElementById('emp-pwd').value;
    emp.signature = document.getElementById('emp-signature').value;
    emp.hired = document.getElementById('emp-hired').value;
    emp.dept = document.getElementById('emp-dept').value;
    emp.phone = document.getElementById('emp-phone').value;
    
    // Логируем изменения
    const changes = {};
    for (let key in oldData) {
        if (oldData[key] !== emp[key]) {
            changes[key] = { old: oldData[key], new: emp[key] };
        }
    }
    
    window.logChange('emp_card_update', {
        index: idx,
        name: emp.name,
        changes: changes
    });
    
    window.closeEmployeeCard();
    window.renderEmpSettings();
    window.saveAllSettings();
    
    console.log('✅ Карточка сохранена');
};

// === ДОБАВИТЬ СОТРУДНИКА ===
window.addEmployee = function() {
    console.log('➕ Добавляю нового сотрудника');
    
    if(!window.dbEmployees) window.dbEmployees = [];
    const newEmp = { 
        id: Math.max(...(window.dbEmployees.map(e => e.id || 0)), 0) + 1,
        name: 'Новый сотрудник', 
        role: 'Менеджер', 
        pwd: '623401', 
        base: 50000, 
        share: 0, 
        signature: '',
        status: 'Активен',
        hired: new Date().toISOString().split('T')[0],
        dept: 'Производство',
        phone: ''
    };
    window.dbEmployees.push(newEmp);
    
    window.logChange('emp_add', {
        name: newEmp.name,
        role: newEmp.role,
        id: newEmp.id
    });
    
    window.renderEmpSettings();
    window.saveAllSettings();
};

// === УДАЛИТЬ СОТРУДНИКА ===
window.delEmp = function(idx) {
    if(!window.dbEmployees) return;
    if(confirm('🗑️ Удалить сотрудника ' + window.dbEmployees[idx].name + '?')) {
        const empName = window.dbEmployees[idx].name;
        const empRole = window.dbEmployees[idx].role;
        window.dbEmployees.splice(idx, 1);
        
        console.log('🗑️ Удалён сотрудник:', empName);
        
        window.logChange('emp_delete', {
            name: empName,
            role: empRole
        });
        
        window.renderEmpSettings();
        window.saveAllSettings();
    }
};

// === ЛОГИРОВАНИЕ ===
window.logChange = function(action, data) {
    window.logID++;
    const logEntry = {
        id: window.logID,
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        timeReadable: new Date().toLocaleString('ru-RU'),
        user: window.currentUser || 'System'
    };
    window.settingsChangeLog.push(logEntry);
    localStorage.setItem('prutkon_settings_log', JSON.stringify(window.settingsChangeLog));
    
    console.log('📝 [#' + window.logID + '] ' + action + ':', data);
};

// === ИСТОРИЯ ВЕРСИЙ ===
window.renderVersionHistory = function() {
    const versionContainer = document.getElementById('version-history-list');
    if (!versionContainer) {
        console.warn('⚠️ #version-history-list не найден');
        return;
    }
    
    console.log('📜 Рендеринг истории версий');
    versionContainer.innerHTML = '';
    
    window.PROGRAM_VERSIONS.slice().reverse().forEach(v => {
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 12px; margin-bottom: 8px; border-left: 3px solid #00ff9d;
            background: rgba(0,255,157,0.05); border-radius: 4px; font-size: 0.85rem;
        `;
        
        const date = new Date(v.date).toLocaleDateString('ru-RU');
        div.innerHTML = `
            <strong style="color: #00ff9d;">v${v.version}</strong>
            <br><small style="color: #aaa;"><i class="fa-solid fa-calendar"></i> ${date}</small>
            <br><small style="color: #ccc; margin-top: 6px; display: block;">${v.changes}</small>
        `;
        
        versionContainer.appendChild(div);
    });
    
    console.log('✅ История версий отрендерена');
};

// === СОХРАНЕНИЕ ===
window.saveAllSettings = function() {
    console.log('💾 Сохранение всех настроек...');
    
    localStorage.setItem('prutkon_employees', JSON.stringify(window.dbEmployees));
    localStorage.setItem('prutkon_settings_log', JSON.stringify(window.settingsChangeLog));
    localStorage.setItem('prutkon_last_save', new Date().toISOString());
    
    window.logChange('settings_save', {
        employees: window.dbEmployees.length,
        timestamp: new Date().toLocaleTimeString('ru-RU')
    });
    
    // Отправляем в Firebase если доступна
    if (window.fbConnected && window.fbDB) {
        try {
            window.fbDB.collection('erp_data').doc('employees').set({
                data: window.dbEmployees,
                logs: window.settingsChangeLog,
                lastUpdate: new Date().toISOString()
            }).catch(err => {
                console.warn('⚠️ Ошибка Firebase:', err.message);
            });
            console.log('☁️ Данные отправлены в Firebase');
        } catch(e) {
            console.warn('⚠️ Не удалось отправить в Firebase:', e.message);
        }
    }
    
    alert('✅ Все изменения сохранены!');
    console.log('✅ Сохранение завершено');
};

// === РЕЗЕРВНАЯ КОПИЯ ===
window.backupData = function() {
    const backup = {
        employees: window.dbEmployees,
        logs: window.settingsChangeLog,
        version: '8.6.0',
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prutkon_backup_' + new Date().toISOString().slice(0,19).replace(/[:\-]/g, '') + '.json';
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Резервная копия создана');
};
