/**
 * ПРУТКОН ОС: Модуль шапки (Header)
 * Отвечает за рендеринг верхней системной панели и статуса синхронизации.
 */

window.renderTopMenu = () => {
    let tb = document.getElementById("system-top-menu");
    if (!tb) { 
        tb = document.createElement("div"); 
        tb.id = "system-top-menu"; 
        tb.className = "system-top-bar no-print"; 
        document.body.prepend(tb); 
    }
    const emp = (typeof window.getCurrentEmployee === 'function' ? window.getCurrentEmployee() : null) || 
                (window.dbEmployees && window.dbEmployees[localStorage.getItem('prutkon_login_idx')]) || 
                { name: 'Гость', role: '--' };
    
    tb.innerHTML = `
        <div class="system-logo"><i class="fa-solid fa-layer-group"></i> ПРУТКОН ОС</div>
        <div id="live-status-container" style="display:flex; align-items:center; gap:10px; border-right:1px solid rgba(255,255,255,0.05); padding-right:15px; margin-right:15px;">
             <div class="sync-status-badge"><div class="live-pulse"></div> LIVE</div>
        </div>
        <ul class="app-menu">
            <li class="menu-item">Система
                <div class="menu-dropdown" style="min-width:240px;">
                    <a href="index.html" class="dropdown-link"><i class="fa-solid fa-gauge"></i> Главный пульт</a>
                    <a href="javascript:location.reload()" class="dropdown-link"><i class="fa-solid fa-rotate"></i> Перезагрузить ОС</a>
                    <hr style="opacity:0.1; margin:5px 0">
                    <a href="javascript:window.saveAllToCloud()" class="dropdown-link" style="color:var(--emerald-neon)"><i class="fa-solid fa-cloud-arrow-up"></i> Облачный бэкап (Supabase)</a>
                    <a href="javascript:window.exportSystemBackup()" class="dropdown-link"><i class="fa-solid fa-file-export"></i> Локальная копия (.json)</a>
                    <a href="javascript:window.restoreSystemBackup()" class="dropdown-link" style="color:var(--gold-industrial)"><i class="fa-solid fa-file-import"></i> Восстановить данные</a>
                    <hr style="opacity:0.1; margin:5px 0">
                    <a href="javascript:window.doLogout()" class="dropdown-link"><i class="fa-solid fa-power-off"></i> Завершить сеанс</a>
                </div>
            </li>
            <li class="menu-item">База данных
                <div class="menu-dropdown">
                    <a href="prices.html" class="dropdown-link"><i class="fa-solid fa-tags"></i> Прайс-лист (Заготовки)</a>
                    <a href="prices_trans.html" class="dropdown-link"><i class="fa-solid fa-truck-ramp-box"></i> Прайс-лист (Транспорт)</a>
                    <a href="catalog.html" class="dropdown-link"><i class="fa-solid fa-book-open"></i> Единый реестр моделей</a>
                    <a href="directories.html" class="dropdown-link"><i class="fa-solid fa-folder-tree"></i> Системные справочники</a>
                    <hr style="opacity:0.1; margin:5px 0">
                    <a href="prices.html?action=add" class="dropdown-link"><i class="fa-solid fa-plus-circle"></i> Новый товар (Мастер)</a>
                    <a href="prices.html?action=import" class="dropdown-link"><i class="fa-solid fa-file-excel"></i> Импорт Excel (Заготовки)</a>
                </div>
            </li>
            <li class="menu-item">Инструменты
                <div class="menu-dropdown">
                    <a href="calculator.html" class="dropdown-link"><i class="fa-solid fa-calculator"></i> Калькулятор КП (Мастер)</a>
                    <a href="rods_production.html" class="dropdown-link"><i class="fa-solid fa-industry"></i> Диспетчер производства</a>
                    <a href="orders.html" class="dropdown-link"><i class="fa-solid fa-cart-shopping"></i> Менеджер заказов</a>
                    <hr style="opacity:0.1; margin:5px 0">
                    <a href="reports.html" class="dropdown-link"><i class="fa-solid fa-chart-line"></i> Аналитический центр</a>
                </div>
            </li>
            <li class="menu-item">Сервис
                <div class="menu-dropdown">
                    <a href="settings.html" class="dropdown-link"><i class="fa-solid fa-user-lock"></i> Права доступа и роли</a>
                    <a href="javascript:window.showAuditLog()" class="dropdown-link"><i class="fa-solid fa-list-ul"></i> Журнал аудита ОС (История)</a>
                    <a href="javascript:window.showVersionHistory()" class="dropdown-link"><i class="fa-solid fa-code-branch"></i> История системных версий</a>
                </div>
            </li>
        </ul>
        <div style="margin-left:auto; display:flex; gap:20px; align-items:center; padding-right:15px;">
             <span id="top-bar-clock" style="font-family:'JetBrains Mono'; font-size:0.75rem; opacity:0.6; color:#fff">00:00:00</span>
        </div>`;
};

window.renderLiveStatus = (state) => {
    const badge = document.querySelector('.sync-status-badge');
    if (!badge) return;
    if (state === 'push') badge.innerHTML = `<span class="emerald" style="animation: pulse 1s infinite;"><i class="fa-solid fa-cloud-arrow-up"></i> ПЕРЕДАЧА...</span>`;
    else if (state === 'sync') {
        badge.innerHTML = `<span style="color:var(--emerald-neon)"><i class="fa-solid fa-check"></i> ОБНОВЛЕНО</span>`;
        setTimeout(() => window.renderLiveStatus('idle'), 2000);
    } else badge.innerHTML = `<div class="live-pulse"></div> LIVE`;
};
