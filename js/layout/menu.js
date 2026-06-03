/**
 * ПРУТКОН ОС: Модуль меню (Sidebar Navigation)
 * Отвечает за рендеринг пунктов навигации в боковой панели.
 */

window.renderSidebar = () => {
    const aside = document.getElementById('global-sidebar');
    if (!aside) return;

    aside.className = "sidebar no-print";
    aside.innerHTML = `
        <div class="sidebar-header">
            <img src="assets/logo.png" alt="PRUTKON" onerror="this.src='assets/logo.svg'">
        </div>
        <nav class="sidebar-nav">
            <ul id="sidebar-nav-list" class="nav-list"></ul>
        </nav>
        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="user-info">
                    <span id="sidebar-user-name" class="user-name">Загрузка...</span>
                    <span id="sidebar-user-role" class="user-role">Система</span>
                </div>
                <button class="btn-logout" onclick="window.doLogout()" title="Выход">
                    <i class="fa-solid fa-power-off"></i>
                </button>
            </div>
        </div>
    `;

    window.renderNavItems();
    window.updateSidebarUser();
};

window.renderNavItems = () => {
    const l = document.getElementById('sidebar-nav-list'); 
    if (!l) return;
    
    const navs = [
        { id: 'index.html', icon: 'fa-gauge-high', label: 'Рабочий стол' },
        { id: 'calculator.html', icon: 'fa-calculator', label: 'Калькулятор КП' },
        { id: 'orders.html', icon: 'fa-cart-shopping', label: 'Менеджер заказов' },
        { id: 'production.html', icon: 'fa-industry', label: 'Производство' },
        { id: 'rods_production.html', icon: 'fa-drafting-compass', label: 'Инженерия' },
        { id: 'prices.html', icon: 'fa-tags', label: 'Прайс-листы' },
        { id: 'catalog.html', icon: 'fa-book-open', label: 'Реестр моделей' },
        { id: 'directories.html', icon: 'fa-folder-tree', label: 'Справочники' },
        { id: 'documents.html', icon: 'fa-file-invoice', label: 'Документы' },
        { id: 'warehouse.html', icon: 'fa-boxes-stacked', label: 'Склад' },
        { id: 'settings.html', icon: 'fa-sliders', label: 'Настройки' }
    ];
    
    const cp = window.location.pathname.split('/').pop() || 'index.html';
    
    l.innerHTML = navs.map(n => `
        <li class="nav-item ${cp === n.id ? 'active' : ''}">
            <a href="${n.id}">
                <i class="fa-solid ${n.icon}"></i> 
                <span>${n.label}</span>
            </a>
        </li>
    `).join('');
};

window.updateSidebarUser = () => {
    const emp = (window.getCurrentEmployee && window.getCurrentEmployee()) || 
                (window.dbEmployees && window.dbEmployees[localStorage.getItem('prutkon_login_idx')]) || 
                { name: 'Загрузка...', role: 'Система' };
    
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    
    if (nameEl) nameEl.innerText = emp.name;
    if (roleEl) roleEl.innerText = emp.role;
};

