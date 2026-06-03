/* catalog_master/manager.js - ПРУТКОН ERP Catalog Master Orchestrator */

window.CatalogManager = {
    open() {
        const modal = document.getElementById('modal-add-model'); if(!modal) return;
        modal.classList.remove('hidden');
        modal.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.96); z-index:99999; overflow-y:auto; display:block; padding-bottom:100px;`;
        modal.innerHTML = `<div id="m-root" style="width:100%; max-width:1250px; margin:30px auto; font-family:'Inter',sans-serif;"></div>`;
        
        // Гарантируем загрузку базы для поиска совпадений из prices_trans.js
        if (!window.dbTransProducts && window.db && window.db.trans) {
            window.dbTransProducts = window.db.trans;
        }

        window.CatalogState.step = 1;
        this.render();
    },

    openExcelImport() {
        this.close();
        if (window.openCatalogExcelImport) {
            window.openCatalogExcelImport();
        } else {
            if(window.showToast) window.showToast("Ошибка: Мастер импорта не найден (catalog.js)", "error");
        }
    },

    close() { const el = document.getElementById('modal-add-model'); if(el) el.style.display='none'; },

    render() {
        const root = document.getElementById('m-root'); if(!root) return;
        const s = window.CatalogState;
        
        // ВСТРОЕННЫЕ СТИЛИ ДЛЯ ГАРАНТИИ ВЕРСТКИ
        const style = `
            <style>
                .catalog-master-modal { font-family: 'Inter', sans-serif; color: #fff; }
                .master-container { background: #000; border: 1px solid #181818; border-radius: 20px; width: 1200px; margin: 20px auto; overflow: hidden; display: flex; flex-direction: column; height: 90vh; }
                
                .master-header { background: #080808; padding: 20px 30px; border-bottom: 1px solid #111; display: flex; justify-content: space-between; align-items: center; }
                .master-title { font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; }
                
                .master-stepper { display: flex; align-items: center; gap: 15px; position: absolute; left: 50%; transform: translateX(-50%); }
                .wiz-step { display: flex; flex-direction: column; align-items: center; gap: 5px; opacity: 0.3; transition: 0.3s; }
                .wiz-step.active { opacity: 1; }
                .wiz-step.complete { opacity: 0.7; }
                .wiz-step-num { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 900; }
                .wiz-step.active .wiz-step-num { border-color: var(--brand-red); background: var(--brand-red); color: #fff; box-shadow: 0 0 15px rgba(226,31,38,0.5); }
                .wiz-step.complete .wiz-step-num { border-color: var(--brand-red); color: var(--brand-red); }
                .wiz-step-label { font-size: 0.5rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                .wiz-line { width: 40px; height: 2px; background: #111; }
                .wiz-step.complete + .wiz-line { background: var(--brand-red); opacity: 0.3; }

                .master-body { flex: 1; overflow-y: auto; padding: 40px; background: radial-gradient(circle at top right, rgba(226,31,38,0.03), transparent); }
                .master-footer { padding: 20px 30px; background: #080808; border-top: 1px solid #111; display: flex; gap: 20px; align-items: center; }
                
                .report-overlay { width: 1200px; margin: 0 auto 50px; }
                .report-header-title { font-weight: 900; font-size: 0.7rem; color: #fff; letter-spacing: 3px; text-transform: uppercase; }
                .hidden { display: none !important; }
            </style>
        `;

        const stepsHtml = [];
        [1,2,3,4,5].forEach((i, idx) => {
            stepsHtml.push(`
                <div class="wiz-step ${i === s.step ? 'active' : (i < s.step ? 'complete' : '')}">
                    <div class="wiz-step-num">${i}</div>
                    <div class="wiz-step-label">${['ОСНОВА','ГЕОМЕТРИЯ','РЕМНИ','ОБВЕС','ЗАМКИ'][idx]}</div>
                </div>
            `);
            if (i < 5) stepsHtml.push('<div class="wiz-line"></div>');
        });
        
        root.innerHTML = `
            ${style}
            <div class="catalog-master-modal">
                <div class="master-container glass-panel">
                    <div class="master-header">
                        <div class="master-title">
                            <i class="fa-solid fa-industry" style="color:var(--brand-red); margin-right:12px;"></i>
                            МАСТЕР ПОСТРОЕНИЯ КОНВЕЙЕРА v4.2.5
                        </div>
                        <div class="master-stepper">${stepsHtml.join('')}</div>
                        <button class="action-btn" onclick="window.CatalogManager.close()" style="background:none; border:none; color:#444; font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="master-body">
                        <div id="m-step-view"></div>
                    </div>

                    <div class="master-footer">
                        <button class="btn btn-secondary" style="height:44px; padding:0 30px; font-weight:900; font-size:0.75rem;" onclick="window.CatalogManager.move(-1)" ${s.step===1?'disabled':''}>
                            <i class="fa-solid fa-chevron-left" style="margin-right:10px;"></i> НАЗАД
                        </button>
                        <button class="btn btn-primary" style="flex-grow:1; height:44px; font-weight:900; letter-spacing:2px; font-size:0.8rem;" onclick="window.CatalogManager.move(1)">
                            ${s.step===5?'ЗАВЕРШИТЬ И СОХРАНИТЬ В БАЗУ':'ПЕРЕЙТИ К СЛЕДУЮЩЕМУ ШАГУ'} <i class="fa-solid fa-chevron-right" style="margin-left:15px;"></i>
                        </button>
                    </div>
                </div>
                <div id="m-report-view" class="report-overlay">${window.CatalogReport.render()}</div>
            </div>
        `;
        this.refreshStep();
        this.syncReport();
    },

    getStepTitle() {
        return ["База и Применимость", "Геометрия Полотна", "Конфигурация Ремней", "Доп. Элементы и Расчет", "Замки"][window.CatalogState.step-1];
    },

    move(dir) {
        let ns = window.CatalogState.step + dir;
        if(ns < 1) return;
        if(ns > 5) { this.finishAction('new'); return; }
        window.CatalogState.step = ns;
        this.render();
    },

    refreshStep() {
        const v = document.getElementById('m-step-view');
        const s = window.CatalogState.step;
        if(s===1) v.innerHTML = window.CatalogStep1.render();
        else if(s===2) v.innerHTML = window.CatalogStep2.render();
        else if(s===3) v.innerHTML = window.CatalogStep3.render();
        else if(s===4) v.innerHTML = window.CatalogStep4.render();
        else if(s===5) v.innerHTML = window.CatalogStep5.render();
    },

    syncReport() {
        const v = document.getElementById('m-report-view');
        if(v) v.innerHTML = window.CatalogReport.render();
    },

    finish() {
        if(window.showToast) window.showToast("Спецификация успешно сформирована и передана в производство!", "success");
        else alert("Спецификация успешно сформирована и передана в производство!");
        this.close();
    },

    async finishAction(type) {
        const s = window.CatalogState;
        const nowStr = new Date().toLocaleString('ru-RU');
        const dateStr = new Date().toLocaleDateString('ru-RU');
        
        // Создаем стандартный объект заказа для ПРУТКОН ОС
        const orderData = {
            id: 'ORD-' + Math.floor(Math.random() * 900000 + 100000),
            date: dateStr,
            art: s.art || 'Б/А',
            name: s.name || 'Новый конвейер',
            brand: s.brand || '---',
            model: s.model || '---',
            clientName: 'Мастер Каталога',
            total: Number(s.calcTotalSum || 0),
            status: type === 'review' ? 'В ПРОВЕРКЕ' : type === 'blueprint' ? 'КБ ДАНИЛ' : 'WAIT_APPROVAL', // Статус в зависимости от кнопки
            items: [
                {
                    name: s.name || 'Конвейер в сборе',
                    art: s.art,
                    qty: 1,
                    price: Number(s.calcTotalSum || 0),
                    total: Number(s.calcTotalSum || 0),
                    specs: `L=${s.length||0}, W=${s.width||0}, P=${s.pitch||0}`
                }
            ],
            audit: [{ timestamp: nowStr, user: window.currentUser?.name || 'Система', action: 'СОЗДАНО ЧЕРЕЗ МАСТЕР' }]
        };

        if (type === 'new' || type === 'review' || type === 'blueprint') {
            // 1. Сохраняем в глобальный массив заказов
            if (!window.orders) window.orders = [];
            window.orders.unshift(orderData);
            
            // 2. Вызываем системное сохранение (Локально + Firebase)
            if (window.saveOrders) {
                window.saveOrders();
            } else {
                localStorage.setItem('prutkon_orders', JSON.stringify(window.orders.slice(0, 500)));
            }
            
            // 3. Интеграция с Bitrix24
            if (window.createBitrixDeal) {
                try {
                    let dealTitle = `УТВЕРЖДЕНИЕ: ${s.name} (${s.art})`;
                    let dealComment = `Сформировано из Мастера Каталога. Модель: ${s.model}. Артикул: ${s.art}. Требуется подтверждение руководства.`;
                    
                    if (type === 'review') {
                        dealTitle = `ПРОВЕРКА КОКАРЕВ: ${s.name} (${s.art})`;
                        dealComment = `Требуется проверка Алексея Кокарева (с изменений). Модель: ${s.model}.`;
                    } else if (type === 'blueprint') {
                        dealTitle = `В ЧЕРТЕЖ: ${s.name} (${s.art})`;
                        dealComment = `Требуется сформировать чертеж (Конструктор Данил). Модель: ${s.model}.`;
                    }

                    const bId = await window.createBitrixDeal({
                        title: dealTitle,
                        amount: Number(s.calcTotalSum || 0),
                        comment: dealComment
                    });
                    if(bId) {
                        orderData.bitrixDealId = bId;
                        if (window.saveOrders) window.saveOrders();
                    }
                } catch(e) { console.error("Bitrix Error:", e); }
            }

            let successMsg = "Спецификация направлена на утверждение руководству!";
            if (type === 'review') successMsg = "Спецификация отправлена на проверку Алексею!";
            if (type === 'blueprint') successMsg = "Задача отправлена в КБ конструктору Данилу!";

            if(window.showToast) window.showToast(successMsg, "success");
            this.close();
            if(window.refreshOrdersList) window.refreshOrdersList();
            if(window.renderOrders) window.renderOrders(); // Если мы на странице заказов
        } 
        else if (type === 'kp') {
            if(window.showToast) window.showToast("Генерация Коммерческого Предложения (PDF)...", "info");
            if(window.CatalogReport && window.CatalogReport.print) window.CatalogReport.print();
        }
    }
};

// Aliases for legacy compatibility if needed
window.CatalogMaster = window.CatalogManager;
