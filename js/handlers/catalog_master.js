/* catalog_master.js - ПРУТКОН ERP Catalog Master (Entry Point) */

// Динамическая загрузка модулей мастера
const scripts = [
    'js/handlers/catalog_master/state.js',
    'js/handlers/catalog_master/step1.js',
    'js/handlers/catalog_master/step2.js',
    'js/handlers/catalog_master/step3.js',
    'js/handlers/catalog_master/step4.js',
    'js/handlers/catalog_master/step5.js',
    'js/handlers/catalog_master/step6.js',
    'js/handlers/catalog_master/specification.js',
    'js/handlers/catalog_master/manager.js',
    'js/handlers/rods_production.js',
    'js/utils/prutkon_features.js'
];

scripts.forEach(src => {
    const cleanSrc = src.split('?')[0];
    if (!document.querySelector(`script[src^="${cleanSrc}"]`)) {
        const s = document.createElement('script');
        if (window.location.protocol === 'file:') {
            s.src = cleanSrc;
        } else {
            s.src = cleanSrc + '?v=19.1.7_' + Date.now();
        }
        s.async = false; // Сохраняем порядок загрузки
        document.head.appendChild(s);
    }
});

// Пробрасываем глобальную функцию на всякий случай
window.openCatalogMaster = () => {
    if (window.CatalogManager) {
        window.CatalogManager.open();
    } else {
        setTimeout(window.openCatalogMaster, 100);
    }
};