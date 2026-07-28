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
        if (window.CatalogStep1 && window.CatalogStep1.updateAutoName) {
            window.CatalogStep1.updateAutoName();
        }
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
                
                .master-header { background: #080808; padding: 20px 30px; border-bottom: 1px solid #111; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
                .master-title { font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; white-space: nowrap; }
                
                .master-stepper { display: flex; align-items: center; gap: 15px; }
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
        [1,2,3,4,5,6].forEach((i, idx) => {
            stepsHtml.push(`
                <div class="wiz-step ${i === s.step ? 'active' : (i < s.step ? 'complete' : '')}">
                    <div class="wiz-step-num">${i}</div>
                    <div class="wiz-step-label">${['ОСНОВА','ГЕОМЕТРИЯ','РЕМНИ','ОБВЕС','ЗАМКИ','СБОРКА'][idx]}</div>
                </div>
            `);
            if (i < 6) stepsHtml.push('<div class="wiz-line"></div>');
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
                        <div style="flex: 1; display: flex; justify-content: center; min-width: 0;">
                            <div class="master-stepper">${stepsHtml.join('')}</div>
                        </div>
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
                            ${s.step===6?'ЗАВЕРШИТЬ И СОХРАНИТЬ В БАЗУ':'ПЕРЕЙТИ К СЛЕДУЮЩЕМУ ШАГУ'} <i class="fa-solid fa-chevron-right" style="margin-left:15px;"></i>
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
        return ["База и Применимость", "Геометрия Полотна", "Конфигурация Ремней", "Доп. Элементы и Расчет", "Замки", "Сборка и Смета"][window.CatalogState.step-1];
    },

    move(dir) {
        let ns = window.CatalogState.step + dir;
        if(ns < 1) return;
        
        // Валидация обязательных полей на Шаге 1
        if (window.CatalogState.step === 1 && dir === 1) {
            const s = window.CatalogState;
            if (!s.art || !s.art.trim()) {
                if (window.showToast) window.showToast("Артикул является обязательным полем!", "error");
                else alert("Артикул является обязательным полем!");
                const artInput = document.getElementById('m-art-1');
                if (artInput) {
                    artInput.style.borderColor = 'var(--brand-red)';
                    artInput.focus();
                }
                return;
            }
            if (!s.brand || !s.brand.trim()) {
                if (window.showToast) window.showToast("Укажите производителя (бренд)!", "error");
                else alert("Укажите производителя (бренд)!");
                const bInput = document.getElementById('m1-brand-input');
                if (bInput) { bInput.style.borderColor = 'var(--brand-red)'; bInput.focus(); }
                return;
            }
            if (!s.model || !s.model.trim()) {
                if (window.showToast) window.showToast("Укажите модель техники!", "error");
                else alert("Укажите модель техники!");
                const mInput = document.getElementById('m1-model-input');
                if (mInput) { mInput.style.borderColor = 'var(--brand-red)'; mInput.focus(); }
                return;
            }
        }
        
        if(ns > 6) { this.finishAction('new'); return; }
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
        else if(s===6) v.innerHTML = window.CatalogStep6.render();
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

    getDetailedSpec() {
        const s = window.CatalogState;
        
        const rodsCount = parseInt(s.asmRodsCount) || parseInt(s.rodsCount) || 0;
        const beltsCount = parseInt(s.asmBeltsCount) || (s.convType === '3x' ? 3 : (s.convType === '4x' ? 4 : 2));
        const locksCount = parseInt(s.asmLocksCount) || 0;
        const lockRodsCount = parseInt(s.asmLockRodsCount) || 0;

        const findProduct = (nameQuery, category) => {
            if (!window.dbProducts) return null;
            return window.dbProducts.find(p => p && p.name && 
                p.name.toLowerCase().includes(nameQuery.toLowerCase()) &&
                (!category || p.category === category)
            );
        };

        const stdPlate = findProduct('Пластина соединительная', 'hardware_small') || findProduct('Пластина соединительная') || { name: 'Пластина соединительная', price: 41.48 };
        const rivet = findProduct('Клепка', 'hardware_small') || findProduct('Клепка') || { name: 'Клепка спец 6мм', price: 10.35 };
        const lockPlate = findProduct('Пластина соединительная резьбовая', 'hardware_small') || findProduct('Пластина соединительная резьбовая') || { name: 'Пластина соединительная резьбовая', price: 150 };
        const lockRod = findProduct('пруток', 'sec_rods') || findProduct('пруток') || { name: 'Пруток замковый', price: 1200 };
        const screwItem = findProduct('Винт', 'hardware_small') || findProduct('Винт') || { name: 'Винты крепежные M6', price: 15.00 };

        // Сбор цен на услуги
        const beltLaborEl = document.getElementById('m6-belt-labor');
        const assLaborEl = document.getElementById('m6-assembly-labor');
        
        const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
        const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
        
        const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
        const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

        const overlapSteps = parseInt(s.connectionOverlapSteps) || 6;
        const locksVal = (s.connectionType === 'mechanical' || s.connectionType === 'screws') ? 1 : 0;
        const f = window.calculateConveyorFasteners(rodsCount, s.convType, s.connectionType, overlapSteps, locksVal);

        const hasOverlap = (s.connectionType === 'screws' || s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot');
        const singleBeltLenM = ((parseFloat(s.length) || 0) + (hasOverlap ? (overlapSteps * (parseFloat(s.pitch) || 0)) : 0)) / 1000;

        const specItems = [];

        // 1. Боковые ремни
        const sideBeltQty = parseFloat((singleBeltLenM * 2).toFixed(3));
        if (sideBeltQty > 0) {
            const sideBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.sideBeltType) || { name: 'DNG+' };
            const sideBeltProduct = findProduct(sideBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.sideBeltWidth || '60'}/${s.sideBeltThickness || '17'}`, price: 1850.00 };
            
            let sideBeltPrice = parseFloat(sideBeltProduct.price) || 0;
            if (sideBeltPrice > 100000) sideBeltPrice /= 1000;
            const sideParentWidth = parseFloat(sideBeltProduct.width) || 1200;
            const sideActualWidth = parseFloat(s.sideBeltWidth) || 60;
            if (sideParentWidth > 0) sideBeltPrice *= (sideActualWidth / sideParentWidth);

            const sideBeltQtyMm = Math.round(sideBeltQty * 1000);
            const sideSingleRingLen = parseFloat(s.length) || 0;
            const sideSingleBlankLen = sideSingleRingLen + (overlapSteps * (parseFloat(s.pitch) || 0));
            specItems.push({
                name: `Ремень боковой: ${sideBeltTypeObj.name} (${s.sideBeltWidth || '60'}x${s.sideBeltThickness || '17'} мм)`,
                art: sideBeltProduct.art || 'belt_side',
                qty: sideBeltQtyMm,
                price: parseFloat((Math.round(sideBeltPrice) / 1000).toFixed(5)),
                total: Math.round(sideBeltPrice * sideBeltQty),
                specs: `Ширина: ${s.sideBeltWidth || '60'} мм | Длина в кольцо (1 шт): ${sideSingleRingLen} мм | Длина заготовки (1 шт): ${sideSingleBlankLen} мм (+${overlapSteps} ш.)`
            });
        }

        // 2. Центральные ремни
        const centralBeltsCount = (s.convType === '3x' ? 1 : (s.convType === '4x' ? 2 : 0));
        const centralBeltQty = parseFloat((singleBeltLenM * centralBeltsCount).toFixed(3));
        if (centralBeltsCount > 0 && s.centralBeltType) {
            const centralBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.centralBeltType) || { name: 'DNG+' };
            const centralBeltProduct = findProduct(centralBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.centralBeltWidth || '60'}/${s.centralBeltThickness || '17'}`, price: 1850.00 };
            
            let centralBeltPrice = parseFloat(centralBeltProduct.price) || 0;
            if (centralBeltPrice > 100000) centralBeltPrice /= 1000;
            const centralParentWidth = parseFloat(centralBeltProduct.width) || 1200;
            const centralActualWidth = parseFloat(s.centralBeltWidth) || 60;
            if (centralParentWidth > 0) centralBeltPrice *= (centralActualWidth / centralParentWidth);

            const centralBeltQtyMm = Math.round(centralBeltQty * 1000);
            const centralSingleRingLen = parseFloat(s.length) || 0;
            const centralSingleBlankLen = centralSingleRingLen + (overlapSteps * (parseFloat(s.pitch) || 0));
            specItems.push({
                name: `Ремень центральный: ${centralBeltTypeObj.name} (${s.centralBeltWidth || '60'}x${s.centralBeltThickness || '17'} мм)`,
                art: centralBeltProduct.art || 'belt_center',
                qty: centralBeltQtyMm,
                price: parseFloat((Math.round(centralBeltPrice) / 1000).toFixed(5)),
                total: Math.round(centralBeltPrice * centralBeltQty),
                specs: `Ширина: ${s.centralBeltWidth || '60'} мм | Длина в кольцо (1 шт): ${centralSingleRingLen} мм | Длина заготовки (1 шт): ${centralSingleBlankLen} мм (+${overlapSteps} ш.)`
            });
        }

        // 3. Дополнительные комплектующие (прутки, хлопушки и т.д.)
        if (s.additionalItems && s.additionalItems.length) {
            s.additionalItems.forEach(it => {
                const qty = parseFloat(it.total) || 0;
                const price = parseFloat(it.price) || 0;
                if (qty > 0) {
                    const def = window.CatalogDicts.additionalComponentsDef.find(x => x.id === it.id);
                    const displayName = def ? def.name : (it.name || 'Элемент');
                    specItems.push({
                        name: displayName,
                        art: it.art || it.id,
                        qty: qty,
                        price: price,
                        total: qty * price,
                        specs: `Диаметр: ${it.diam || '—'} мм, Ширина: ${it.width || '—'} мм`
                    });
                }
            });
        }

        // 4. Замки
        if (s.lockId) {
            const lp = (window.dbProducts || []).find(x => x.id === s.lockId);
            if (lp) {
                const lockPrice = parseFloat(lp.price) || 0;
                specItems.push({
                    name: `Замок соединительный: ${lp.name}`,
                    art: lp.art || lp.id,
                    qty: locksCount,
                    price: lockPrice,
                    total: locksCount * lockPrice,
                    specs: `Шаг: ${lp.pitch || '—'} мм`
                });
            }
        }

        // 5. Крепеж
        if (f.standardPlatesSide > 0) {
            specItems.push({ name: `${stdPlate.name} (боковая, стандарт)`, art: stdPlate.art || 'plate_side', qty: f.standardPlatesSide, price: stdPlate.price, total: Math.round(f.standardPlatesSide * stdPlate.price) });
        }
        if (f.standardPlatesCentral > 0) {
            specItems.push({ name: `${stdPlate.name} цр (стандарт)`, art: stdPlate.art || 'plate_center', qty: f.standardPlatesCentral, price: stdPlate.price, total: Math.round(f.standardPlatesCentral * stdPlate.price) });
        }
        if (f.overlapPlatesSide > 0) {
            specItems.push({ name: `${stdPlate.name} (боковая, стык)`, art: stdPlate.art || 'plate_overlap_side', qty: f.overlapPlatesSide, price: stdPlate.price, total: Math.round(f.overlapPlatesSide * stdPlate.price) });
        }
        if (f.overlapPlatesCentral > 0) {
            specItems.push({ name: `${stdPlate.name} цр (стык)`, art: stdPlate.art || 'plate_overlap_center', qty: f.overlapPlatesCentral, price: stdPlate.price, total: Math.round(f.overlapPlatesCentral * stdPlate.price) });
        }
        if (f.lockPlatesSide > 0) {
            specItems.push({ name: `${lockPlate.name} (боковая, замок)`, art: lockPlate.art || 'plate_lock_side', qty: f.lockPlatesSide, price: lockPlate.price, total: Math.round(f.lockPlatesSide * lockPlate.price) });
        }
        if (f.lockPlatesCentral > 0) {
            specItems.push({ name: `${lockPlate.name} цр (замок)`, art: lockPlate.art || 'plate_lock_center', qty: f.lockPlatesCentral, price: lockPlate.price, total: Math.round(f.lockPlatesCentral * lockPlate.price) });
        }
        if (f.screws > 0) {
            specItems.push({ name: screwItem.name, art: screwItem.art || 'screw', qty: f.screws, price: screwItem.price, total: Math.round(f.screws * screwItem.price) });
        }
        if (f.rivets > 0) {
            specItems.push({ name: rivet.name, art: rivet.art || 'rivet', qty: f.rivets, price: rivet.price, total: Math.round(f.rivets * rivet.price) });
        }
        if (lockRodsCount > 0) {
            specItems.push({ name: lockRod.name, art: lockRod.art || 'rod_lock', qty: lockRodsCount, price: lockRod.price, total: Math.round(lockRodsCount * lockRod.price) });
        }

        // 6. Услуги и сборка
        specItems.push({ name: beltLaborName, art: 'labor_belt', qty: beltsCount, price: beltLaborPrice, total: beltsCount * beltLaborPrice });
        specItems.push({ name: assLaborName, art: 'labor_ass', qty: 1, price: assLaborPrice, total: assLaborPrice });

        // Применяем ручные переопределения цен (overrides)
        if (s.priceOverrides) {
            specItems.forEach(item => {
                if (s.priceOverrides[item.name] !== undefined) {
                    item.total = parseFloat(s.priceOverrides[item.name]) || 0;
                    item.price = item.qty > 0 ? Math.round(item.total / item.qty) : 0;
                }
            });
        }

        return specItems;
    },

    async finishAction(type) {
        const s = window.CatalogState;
        const nowStr = new Date().toLocaleString('ru-RU');
        const dateStr = new Date().toLocaleDateString('ru-RU');
        
        // Создаем стандартный объект заказа для ПРУТКОН ОС с подробной спецификацией
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
            items: this.getDetailedSpec(),
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
            
            // Если это новый заказ, сразу формируем коммерческое предложение (КП)
            if (type === 'new') {
                setTimeout(() => {
                    if (window.CatalogReport && window.CatalogReport.print) {
                        window.CatalogReport.print();
                    }
                }, 800);
            }
        } 
        else if (type === 'kp') {
            if(window.showToast) window.showToast("Генерация Коммерческого Предложения (PDF)...", "info");
            if(window.CatalogReport && window.CatalogReport.print) window.CatalogReport.print();
        }
    }
};

// Aliases for legacy compatibility if needed
window.CatalogMaster = window.CatalogManager;

window.CatalogManager.saveStateAndRedirect = function(url) {
    localStorage.setItem('prutkon_catalog_draft', JSON.stringify(window.CatalogState));
    localStorage.setItem('prutkon_catalog_restore', 'true');
    window.location.href = url;
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('prutkon_catalog_restore') === 'true') {
        const saved = localStorage.getItem('prutkon_catalog_draft');
        if (saved) {
            try {
                window.CatalogState = JSON.parse(saved);
                localStorage.removeItem('prutkon_catalog_restore');
                setTimeout(() => window.CatalogManager.open(), 500);
            } catch(e) {}
        }
    }
});
