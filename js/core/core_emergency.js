// CORE.JS - EMERGENCY RECOVERY v18.1.2
window.DB_VERSION = "18.1.2";

// 1. ПАРСЕР (БЕЗОПАСНЫЙ)
window.safeParse = (key, def) => {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : def;
    } catch (e) {
        console.error("Parse Error: " + key);
        return def;
    }
};

// 2. БАЗОВЫЕ ДАННЫЕ
window.dbCategories = window.safeParse('prutkon_categories', [
    { id: 'blanks', name: 'Заготовки', schema: ['stock', 'price'] },
    { id: 'locks', name: 'Замки', schema: ['stock', 'price'] }
]);
window.dbProducts = window.safeParse('prutkon_products', []);
window.orders = window.safeParse('prutkon_orders', []);
window.dbEmployees = window.safeParse('prutkon_employees', [
    { id: 1, name: 'Никитин Иван Андреевич', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 100000, share: 0 },
    { id: 2, name: 'Ивахненко Иван', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
    { id: 3, name: 'Кокарев Сергей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
    { id: 4, name: 'Метелла Артем', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
    { id: 5, name: 'Жарикова Джульетта', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 },
    { id: 6, name: 'Власов Алексей', role: 'Администратор', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 80000, share: 0 },
    { id: 7, name: 'Родионова Анастасия', role: 'Менеджер', pwd: '1234', status: 'Активен', hired: '2026-01-01', base: 50000, share: 0 }
]);

// 3. ОТРИСОВКА ИНТЕРФЕЙСА (UI SHELL)
window.renderLayout = () => {
    const s = document.getElementById('global-sidebar');
    if (!s) return;
    s.innerHTML = `
        <div class="sidebar-header"><div class="logo"><img src="chatgpt_image_10_noyab_2025_g_20_40_23_1_1x.png" style="height:35px;"></div></div>
        <nav class="sidebar-nav">
            <ul class="nav-list">
                <li class="nav-item active"><a href="index.html"><i class="fa-solid fa-gauge-high"></i> <span>Рабочий стол</span></a></li>
                <li class="nav-item"><a href="calculator.html"><i class="fa-solid fa-calculator"></i> <span>Калькулятор</span></a></li>
                <li class="nav-item"><a href="prices.html"><i class="fa-solid fa-tags"></i> <span>Прайс</span></a></li>
                <li class="nav-item"><a href="catalog.html"><i class="fa-solid fa-book-open"></i> <span>Реестр</span></a></li>
            </ul>
        </nav>`;
};

window.renderTopMenu = () => {
    let tb = document.getElementById("system-top-menu");
    if (!tb) {
        tb = document.createElement("div");
        tb.id = "system-top-menu";
        tb.className = "system-top-bar no-print";
        document.body.prepend(tb);
    }
    tb.innerHTML = `
        <div class="system-logo"><i class="fa-solid fa-layer-group"></i> ПРУТКОН ОС</div>
        <div class="sync-status-badge"><div class="live-pulse"></div> LIVE</div>
        <ul class="app-menu">
            <li class="menu-item"><a href="index.html">Рабочий стол</a></li>
            <li class="menu-item"><a href="prices.html">Прайс-листы</a></li>
            <li class="menu-item"><a href="javascript:location.reload()">Перезагрузить</a></li>
        </ul>
        <div style="margin-left:auto; padding-right:15px;"><span id="top-bar-clock">00:00:00</span></div>`;
};

// 4. ГЛОБАЛЬНЫЕ КАРКАСЫ (STUBS)
window.uiBlocks = {
    WELCOME: () => `<div class="welcome-panel"><h1>ПРУТКОН ОС</h1><p>Система восстановлена. Версия ${window.DB_VERSION}</p></div>`,
    STATS: () => `<div class="stats-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-top:20px;">
        <div class="panel"><h4>Заказы</h4><div style="font-size:1.5rem;">${window.orders.length}</div></div>
        <div class="panel"><h4>Товары</h4><div style="font-size:1.5rem;">${window.dbProducts.length}</div></div>
        <div class="panel"><h4>Статус</h4><div style="font-size:1.5rem; color:var(--emerald-neon);">OK</div></div>
    </div>`,
    RECENT_ORDERS: () => `<div class="panel" style="margin-top:20px;"><h3>Последние заказы</h3><p style="opacity:0.5;">Синхронизация...</p></div>`,
    QUICK_ACTIONS: () => ``,
    AUDIT_FEED: () => ``
};

window.renderConstructor = () => {
    const main = document.getElementById('constructor-main');
    if (main) main.innerHTML = window.uiBlocks.WELCOME() + window.uiBlocks.STATS();
};

window.formatCurrency = (n) => (n || 0).toLocaleString('ru-RU') + ' ₽';

// 5. ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    window.renderLayout();
    window.renderTopMenu();
    window.renderConstructor();
    setInterval(() => {
        const el = document.getElementById("top-bar-clock");
        if (el) el.innerText = new Date().toLocaleTimeString("ru-RU");
    }, 1000);
    console.log("Core Recovery: SUCCESS");
});