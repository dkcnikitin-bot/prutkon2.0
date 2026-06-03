/**
 * ПРУТКОН ОС: Модуль подвала (System Footer)
 * Отвечает за рендеринг нижней информационной панели.
 */

window.renderSystemFooter = () => {
    let f = document.getElementById("system-footer");
    if (!f) { 
        f = document.createElement("div"); 
        f.id = "system-footer"; 
        f.className = "system-footer no-print"; 
        document.body.appendChild(f); 
    }
    
    const total = ((window.dbProducts ? window.dbProducts.length : 0) + (window.dbTransProducts ? window.dbTransProducts.length : 0));
    const version = window.DB_VERSION || "1.0.0";
    
    f.innerHTML = `
        <div class="footer-section">
            <i class="fa-solid fa-microchip"></i> ПРУТКОН ОС v${version}
        </div>
        <div class="footer-divider"></div>
        <div class="footer-section" style="color:var(--emerald-neon)">
            ОБЛАЧНЫЙ ПОТОК: АКТИВЕН
        </div>
        <div style="margin-left:auto" class="footer-section">
            РЕЕСТР: <strong>${total}</strong> ПОЗ.
        </div>`;
};
