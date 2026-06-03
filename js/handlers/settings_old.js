/* settings.js - ПРУТКОН ERP System Settings & Team Module */

// Предустановленные роли
window.ROLE_PRESETS = [
    'Администратор',
    'Мастер производства',
    'Генеральный конструктор',
    'Сбыт / Снабжение',
    'Работник',
    'Бухгалтер',
    'Инженер'
];

// История изменений в текущей сессии
window.settingsChangeLog = [];

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure core.js window objects are ready
    setTimeout(() => {
        // Инициализируем Firebase соединение
        if (window.connectFirebase) {
            window.connectFirebase(true); // silent mode
        }
        
        renderEmpSettings();
        initializeSettingsTabs();
        updateFirebaseStatusDisplay();
    }, 300);
});

// Обновляем отображение статуса Firebase
window.updateFirebaseStatusDisplay = function() {
    const statusEl = document.getElementById('firebase-status');
    const textEl = document.getElementById('firebase-status-text');
    
    if (!statusEl || !textEl) return;
    
    // Проверяем статус соединения
    const isConnected = window.fbConnected === true;
    const hasCloud = window.fbDB !== undefined;
    
    if (isConnected && hasCloud) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-check" style="color:#00ff9d; animation: glow 1.5s infinite;"></i>';
        textEl.innerText = '✅ Cloud Firestore подключена';
        statusEl.title = 'Синхронизация активна';
    } else if (hasCloud) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-exclamation" style="color:#ffaa00;"></i>';
        textEl.innerText = '⚠️ Локальный режим (данные сохраняются локально)';
        statusEl.title = 'Работаем без облака';
    } else {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-slash" style="color:#ff1e27;"></i>';
        textEl.innerText = '❌ Нет соединения (используется LocalStorage)';
        statusEl.title = 'Offline режим';
    }
};

function initializeSettingsTabs() {
    const saveBtn = document.querySelector('button[onclick*="saveAllSettings"]');
    if (saveBtn) {
        saveBtn.className = 'btn btn-primary w-100';
        saveBtn.style.marginTop = '15px';
        saveBtn.style.height = '50px';
        saveBtn.style.fontSize = '0.9rem';
    }
}

function renderEmpSettings() {
    const tbody = document.getElementById('settings-emp-tbody');
    if (!tbody) return;

    // Use mock or global window.dbEmployees
    const employees = window.dbEmployees || [
        { name: 'Никитин И.', role: 'Администратор', pwd: '623401', base: 150000, share: 0.1 },
        { name: 'Алексеев А.', role: 'Мастер производства', pwd: '111', base: 85000, share: 0.05 }
    ];

    tbody.innerHTML = '';
    
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        
        // Создаем select для ролей
        let roleOptions = window.ROLE_PRESETS.map(role => 
            `<option value="${role}" ${emp.role === role ? 'selected' : ''}>${role}</option>`
        ).join('');
        
        tr.innerHTML = `
            <td><input type="text" class="form-control emp-input" data-idx="${index}" data-field="name" value="${emp.name}" style="height:34px; font-size:0.85rem; width:150px;"></td>
            <td>
                <select class="form-control emp-input" data-idx="${index}" data-field="role" style="height:34px; font-size:0.85rem; width:150px;">
                    ${roleOptions}
                    <option value="${emp.role}">${emp.role}</option>
                </select>
            </td>
            <td><input type="number" class="form-control emp-input" data-idx="${index}" data-field="base" value="${emp.base}" style="height:34px; font-size:0.85rem; width:100px;"></td>
            <td><input type="number" class="form-control emp-input" data-idx="${index}" data-field="share" value="${(emp.share * 100).toFixed(0)}" style="height:34px; font-size:0.85rem; width:60px;"></td>
            <td><input type="password" class="form-control emp-input" data-idx="${index}" data-field="pwd" placeholder="Пароль..." value="${emp.pwd || ''}" style="height:34px; font-size:0.85rem; width:80px;"></td>
            <td><input type="text" class="form-control emp-input" data-idx="${index}" data-field="signature" placeholder="ФИО подпись..." value="${emp.signature || ''}" style="height:34px; font-size:0.85rem; width:120px;"></td>
            <td>
                <button class="action-btn" title="Удалить" onclick="window.delEmp(${index})"><i class="fa-solid fa-user-minus" style="color:var(--brand-red)"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Добавляем обработчики для отслеживания изменений
    document.querySelectorAll('.emp-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const field = e.target.dataset.field;
            const oldVal = window.dbEmployees[idx][field];
            const newVal = e.target.value;
            
            window.updateEmp(idx, field, newVal);
            logChange('emp_update', {
                index: idx,
                name: window.dbEmployees[idx].name,
                field: field,
                oldValue: oldVal,
                newValue: newVal,
                timestamp: new Date().toLocaleTimeString('ru-RU')
            });
            highlightSaveButton();
            updateFirebaseStatusDisplay(); // Обновляем статус
        });
    });
}

window.addEmployee = () => {
    if(!window.dbEmployees) window.dbEmployees = [];
    const newEmp = { 
        name: 'Новый сотрудник', 
        role: 'Работник', 
        pwd: '123', 
        base: 30000, 
        share: 0, 
        signature: '',
        created: new Date().toLocaleString('ru-RU')
    };
    window.dbEmployees.push(newEmp);
    
    logChange('emp_add', {
        name: newEmp.name,
        timestamp: new Date().toLocaleTimeString('ru-RU')
    });
    
    renderEmpSettings();
    highlightSaveButton();
};

window.updateEmp = (idx, field, val) => {
    if(!window.dbEmployees || !window.dbEmployees[idx]) return;
    
    if(field === 'share') val = parseFloat(val) / 100 || 0;
    if(field === 'base') val = parseInt(val) || 0;
    
    window.dbEmployees[idx][field] = val;
    window.dbEmployees[idx].lastModified = new Date().toLocaleString('ru-RU');
};

window.delEmp = (idx) => {
    if(!window.dbEmployees) return;
    if(confirm('Удалить сотрудника из реестра?')) {
        const empName = window.dbEmployees[idx].name;
        window.dbEmployees.splice(idx, 1);
        
        logChange('emp_delete', {
            name: empName,
            timestamp: new Date().toLocaleTimeString('ru-RU')
        });
        
        renderEmpSettings();
        highlightSaveButton();
    }
};

// Логирование всех изменений
function logChange(action, data) {
    const logEntry = {
        action,
        data,
        timestamp: new Date().toISOString()
    };
    window.settingsChangeLog.push(logEntry);
    localStorage.setItem('prutkon_settings_log', JSON.stringify(window.settingsChangeLog));
    console.log('📝 Изменение записано:', action, data);
}

// Подсвечивает кнопку сохранения
function highlightSaveButton() {
    const saveBtn = document.querySelector('button[onclick*="fbPush"]');
    if (saveBtn) {
        saveBtn.style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => saveBtn.style.animation = '', 600);
    }
}

// Сохранение всех изменений
window.saveAllSettings = () => {
    const hasChanges = window.settingsChangeLog.length > 0;
    
    console.log('💾 Сохранение настроек...');
    console.table(window.settingsChangeLog);
    
    // Сохраняем локально
    localStorage.setItem('prutkon_employees', JSON.stringify(window.dbEmployees));
    localStorage.setItem('prutkon_settings_log', JSON.stringify(window.settingsChangeLog));
    
    // Отправляем в Firebase если доступна
    if (window.fbPush) {
        window.fbPush();
        alert('✅ Все параметры и пароли сохранены!\n\n' + 
              (hasChanges ? `Записано изменений: ${window.settingsChangeLog.length}` : 'Нет новых изменений'));
    } else {
        alert('✅ Данные сохранены локально');
    }
    
    // Очищаем лог после сохранения
    window.settingsChangeLog = [];
    localStorage.removeItem('prutkon_settings_log');
    console.log('✅ Параметры успешно сохранены');
};
