/* catalog_master/specification.js - ПРУТКОН ERP Техническая спецификация */

window.CatalogReport = {
    render() {
        const s = window.CatalogState;
        const IMG = 'extracted_xlsx/xl/media/';
        let bodyHtml = '';
        let totalSum = 0;

        if (!s.priceOverrides) s.priceOverrides = {};
        const add = (name, q, sub, img, price, totalVal) => {
            const itemKey = name;
            let finalTotal = totalVal;
            if (s.priceOverrides && s.priceOverrides[itemKey] !== undefined) {
                finalTotal = parseFloat(s.priceOverrides[itemKey]);
            }
            
            if (finalTotal !== undefined && finalTotal !== null) {
                totalSum += finalTotal;
            }
            
            const isPrinting = document.body.classList.contains('printing') || window.location.search.includes('print');
            let priceHtml = '';
            
            if (isPrinting) {
                priceHtml = (finalTotal !== undefined && finalTotal !== null) ? `${Math.round(finalTotal).toLocaleString('ru-RU')} ₽` : '—';
            } else {
                if (finalTotal !== undefined && finalTotal !== null) {
                    priceHtml = `
                        <div style="display:flex; align-items:center; justify-content:flex-end; gap:5px;">
                            <input type="number" value="${Math.round(finalTotal)}" 
                                onchange="window.CatalogReport.setOverride('${itemKey}', this.value)" 
                                style="width:85px; text-align:right; border:1px solid #ccc; border-radius:6px; background:#fff; color:#111; font-family:'JetBrains Mono'; font-weight:900; font-size:0.75rem; padding:3px 6px; outline:none;"
                                title="Нажмите для редактирования стоимости">
                            <span style="font-size:0.7rem; color:#777;">₽</span>
                        </div>
                    `;
                } else {
                    priceHtml = '—';
                }
            }

            return `
                <tr style="border-bottom:1px solid #eee; background:transparent; page-break-inside:avoid;">
                    <td style="text-align:center; padding:10px;"><img src="${window.getSafeImagePath(img)}" style="height:35px; background:#fff; border:1px solid #ddd; border-radius:6px; padding:3px;"></td>
                    <td style="padding:10px;"><div style="font-weight:700; color:#111; font-size:0.85rem;">${name}</div><div style="font-size:0.65rem; color:#666;">${sub}</div></td>
                    <td style="text-align:center; color:#e21f26; font-weight:900; font-size:0.85rem; white-space:nowrap;">${q}</td>
                    <td style="text-align:right; font-family:'JetBrains Mono'; font-size:0.75rem; color:#111; font-weight:900; width:130px;">${priceHtml}</td>
                </tr>`;
        };

        // Поиск цен в справочнике с фильтрацией по категории
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
        const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
        const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
        const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

        // 1. ПРИМЕЧАНИЯ ПО ГЕОМЕТРИИ (ШАГ 2+)
        if (s.step >= 2) {
            if (s.convType !== '2x') {
                const m = window.CatalogDicts.centralBeltMounts.find(x=>x.id===s.centralBeltMount);
                if (m) bodyHtml += add(`СПОСОБ КРЕПЛЕНИЯ ЦЕНТРАЛЬНЫХ РЕМНЕЙ: ${m.name}`, '—', `Технология соединения: Штамповка / Литая скоба`, m.img);
            }
            let distStr = `Боковой свес: ${s.sideMargin || 120} мм / Межосевое D1-2: ${s.dist12 || 0} мм`;
            if (s.convType !== '2x') distStr += ` / Межосевое D2-3: ${s.dist23 || 0} мм`;
            if (s.convType === '4x') distStr += ` / Межосевое D3-4: ${s.dist34 || 0} мм`;
            bodyHtml += add(`РАСПОЛОЖЕНИЕ ТЯГОВЫХ РЕМНЕЙ (${s.centralBeltsLayout === 'symmetric' ? 'СИММЕТРИЧНО' : 'СО СМЕЩЕНИЕМ'})`, '—', distStr, s.convType === '2x' ? '2.png' : (s.convType === '4x' ? '4.png' : '3.png'));
        }

        // 2. Тяговые ленты (ШАГ 3+)
        if (s.step >= 3) {
            let overlapSteps = 0;
            if (s.connectionType === 'screws' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot' || s.connectionType === 'vulcanization') {
                overlapSteps = s.connectionOverlapSteps !== undefined ? parseInt(s.connectionOverlapSteps) : 6;
            }
            const pitchMm = parseFloat(s.pitch) || 0;
            const beltLengthMm = (parseFloat(s.length) || 0) + (overlapSteps * pitchMm);
            const sideBeltsQty = (beltLengthMm * 2) / 1000;
            let centralBeltsCount = (s.convType === '3x' ? 1 : (s.convType === '4x' ? 2 : 0));
            const centralBeltsQty = (beltLengthMm * centralBeltsCount) / 1000;

            if(s.sideBeltType) {
                const b = window.CatalogDicts.beltTypes.find(x=>x.id===s.sideBeltType) || { name: 'DNG+' };
                const sideBeltProduct = findProduct(b.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: 'Ремень тяговый', price: 1850.00 };
                
                // Пропорциональный расчет цены ремня по ширине полосы к исходной ширине
                let sideBeltPrice = parseFloat(sideBeltProduct.price) || 0;
                if (sideBeltPrice > 100000) {
                    sideBeltPrice = sideBeltPrice / 1000;
                }
                const sideParentWidth = parseFloat(sideBeltProduct.width) || 1200;
                const sideActualWidth = parseFloat(s.sideBeltWidth) || 60;
                if (sideParentWidth > 0) {
                    sideBeltPrice = sideBeltPrice * (sideActualWidth / sideParentWidth);
                }
                
                const cost = sideBeltsQty * sideBeltPrice;
                if (b) bodyHtml += add(`БОКОВОЙ ТЯГОВЫЙ РЕМЕНЬ: ${b.name} (КОМПЛЕКТ 2 ШТ)`, Math.round(sideBeltsQty * 1000) + ' мм', `Ширина: ${s.sideBeltWidth} мм / Толщина: ${s.sideBeltThickness} мм / Межосевое: ${s.sideHoleDist} мм (отв. Ø ${s.sideHoleDiam} мм) / Боковой свес: ${s.sideMargin || 120} мм`, b.img, sideBeltPrice, cost);
            }
            if(centralBeltsCount > 0 && s.centralBeltType) {
                const b = window.CatalogDicts.beltTypes.find(x=>x.id===s.centralBeltType) || { name: 'DNG+' };
                const centralBeltProduct = findProduct(b.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: 'Ремень тяговый', price: 1850.00 };
                
                // Пропорциональный расчет цены ремня по ширине полосы к исходной ширине
                let centralBeltPrice = parseFloat(centralBeltProduct.price) || 0;
                if (centralBeltPrice > 100000) {
                    centralBeltPrice = centralBeltPrice / 1000;
                }
                const centralParentWidth = parseFloat(centralBeltProduct.width) || 1200;
                const centralActualWidth = parseFloat(s.centralBeltWidth) || 60;
                if (centralParentWidth > 0) {
                    centralBeltPrice = centralBeltPrice * (centralActualWidth / centralParentWidth);
                }
                
                const cost = centralBeltsQty * centralBeltPrice;
                if (b) bodyHtml += add(`ЦЕНТРАЛЬНЫЙ ТЯГОВЫЙ РЕМЕНЬ: ${b.name} (${centralBeltsCount} ШТ)`, Math.round(centralBeltsQty * 1000) + ' мм', `Ширина: ${s.centralBeltWidth} мм / Толщина: ${s.centralBeltThickness} мм / Межосевое: ${s.centralHoleDist} мм (отв. Ø ${s.centralHoleDiam} мм)`, b.img, centralBeltPrice, cost);
            }
        }

        // 3. Дополнительная комплектация (ШАГ 4+)
        if (s.step >= 4) {
            const sortedItems = [...s.additionalItems].sort((a, b) => (parseInt(a.order) || 999) - (parseInt(b.order) || 999));
            sortedItems.forEach(it => {
                const d = window.CatalogDicts.additionalComponentsDef.find(x=>x.id===it.id);
                const qty = parseFloat(it.total) || 0;
                const price = parseFloat(it.price) || 0;
                const cost = qty * price;
                if (d && qty > 0) bodyHtml += add(d.name, it.total+' шт', `Чередование: ${it.step} | Порядок: № ${it.order} | Диаметр: ${it.diam} мм`, d.img, price, cost);
            });
            
            // АВТОПОДБОР КОМПЛЕКТУЮЩИХ (ПЛАСТИНЫ, КЛЕПКИ/ВИНТЫ) ПО СПЕЦИФИКАЦИИ ЧЕРТЕЖА
            if (s.rodsCount) {
                const overlapSteps = parseInt(s.connectionOverlapSteps) || 6;
                const locksCount = (s.connectionType === 'mechanical' || s.connectionType === 'screws') ? 1 : 0;
                
                const f = window.calculateConveyorFasteners(s.rodsCount, s.convType, s.connectionType, overlapSteps, locksCount);
                const plateWidth = s.sideBeltWidth || '60';
                const holeDiam = s.sideHoleDiam || '6';
                
                // 1. Вывод прижимных пластин стыка
                if (f.overlapPlatesSide > 0) {
                    const cost = f.overlapPlatesSide * stdPlate.price;
                    bodyHtml += add(`Прижимная пластина (боковая, стык)`, f.overlapPlatesSide + ' шт', `Для соединения внахлест под ремень шириной ${plateWidth} мм`, '23.jpg', stdPlate.price, cost);
                }
                if (f.overlapPlatesCentral > 0) {
                    const cost = f.overlapPlatesCentral * stdPlate.price;
                    bodyHtml += add(`Прижимная пластина цр (стык)`, f.overlapPlatesCentral + ' шт', `Для соединения внахлест центрального ремня`, '23.jpg', stdPlate.price, cost);
                }
                
                // 2. Вывод стандартных прижимных пластин
                if (f.standardPlatesSide > 0) {
                    const cost = f.standardPlatesSide * stdPlate.price;
                    bodyHtml += add(`Прижимная пластина (боковая, стандарт)`, f.standardPlatesSide + ' шт', `Автоподбор под боковой ремень шириной ${plateWidth} мм`, '23.jpg', stdPlate.price, cost);
                }
                if (f.standardPlatesCentral > 0) {
                    const cost = f.standardPlatesCentral * stdPlate.price;
                    bodyHtml += add(`Прижимная пластина цр (стандарт)`, f.standardPlatesCentral + ' шт', `Автоподбор под центральный ремень`, '23.jpg', stdPlate.price, cost);
                }
                
                // 3. Вывод пластин механического замка (если применимо)
                if (f.lockPlatesSide > 0) {
                    const cost = f.lockPlatesSide * lockPlate.price;
                    bodyHtml += add(`Прижимная пластина (боковая, замок)`, f.lockPlatesSide + ' шт', `Для замкового соединения`, '23.jpg', lockPlate.price, cost);
                }
                if (f.lockPlatesCentral > 0) {
                    const cost = f.lockPlatesCentral * lockPlate.price;
                    bodyHtml += add(`Прижимная пластина цр (замок)`, f.lockPlatesCentral + ' шт', `Для замкового соединения цр`, '23.jpg', lockPlate.price, cost);
                }
                
                // 4. Вывод крепежа
                if (f.screws > 0) {
                    const cost = f.screws * screwItem.price;
                    bodyHtml += add(`ВИНТЫ КРЕПЕЖНЫЕ M${holeDiam}`, f.screws + ' шт', `Крепление пластин стыка (по 2 шт. на пластину)`, '38.jpg', screwItem.price, cost);
                }
                if (f.rivets > 0) {
                    const cost = f.rivets * rivet.price;
                    bodyHtml += add(`ЗАКЛЕПКИ ${holeDiam} мм`, f.rivets + ' шт', `Для стандартных пластин (по 2 шт. на пластину)`, '35.jpg', rivet.price, cost);
                }
            }
        }

        // 4. СОЕДИНЕНИЕ И ЗАМКИ (ШАГ 5)
        if (s.step >= 5) {
            const ct = window.CatalogDicts.connectionTypes.find(x=>x.id===s.connectionType);
            if (ct) {
                bodyHtml += add(`ТИП СОЕДИНЕНИЯ: ${ct.name}`, '1 шт', `Техническое исполнение узла стыковки`, ct.img);
            }
            if (s.lockId) {
                const lp = (window.dbProducts || []).find(x => x.id === s.lockId);
                if (lp) {
                    const price = parseFloat(lp.price) || 0;
                    const locksCount = parseInt(s.asmLocksCount) || (s.convType === '3x' ? 3 : (s.convType === '4x' ? 4 : 2));
                    const totalLockCost = price * locksCount;
                    bodyHtml += add(`ЗАМОК СОЕДИНИТЕЛЬНЫЙ: ${lp.name}`, locksCount + ' шт', `Артикул: ${lp.art} | Шаг: ${lp.pitch || '—'}`, '35.jpg', price, totalLockCost);
                }
            }
        }

        // 5. СБОРКА И СМЕТА (ШАГ 6)
        if (s.step >= 6) {
            const beltsCount = parseInt(s.asmBeltsCount) || 0;
            const lockRodsCount = parseInt(s.asmLockRodsCount) || 0;

            if (lockRodsCount > 0) {
                const cost = lockRodsCount * lockRod.price;
                bodyHtml += add(`${lockRod.name} (комплектующие сборки)`, lockRodsCount + ' шт', `Пруток для замыкания стыка`, '20.jpg', lockRod.price, cost);
            }

            // Services
            const costBeltLabor = beltsCount * beltLaborPrice;
            bodyHtml += add(beltLaborName, beltsCount + ' шт', `Технологическая подготовка ремней к сборке`, '36.jpg', beltLaborPrice, costBeltLabor);
            bodyHtml += add(assLaborName, '1 шт', `Полная сборка конвейерной ленты на стапеле`, '36.jpg', assLaborPrice, assLaborPrice);
        }

        const showPreview = s.step >= 2;
        const convTypeData = window.CatalogDicts.convTypes.find(t=>t.id===s.convType);
        const previewImg = showPreview && convTypeData ? `<img src="${window.getSafeImagePath(convTypeData.img)}" style="width:100%; height:80px; object-fit:contain;">` : `<div style="height:80px; display:flex; align-items:center; justify-content:center; color:#222; font-size:0.5rem; text-transform:uppercase; font-weight:900;">Схема (Шаг 2)</div>`;

        let tfootHtml = '';
        if (totalSum > 0) {
            tfootHtml = `
                <tfoot>
                    <tr style="border-top:2px solid #ccc; background:rgba(0,0,0,0.02);">
                        <td colspan="3" style="padding:12px; font-weight:900; font-size:0.75rem; color:#333; text-transform:uppercase; text-align:left;">ИТОГО РАСЧЕТНАЯ СУММА:</td>
                        <td style="padding:12px; font-family:'JetBrains Mono'; font-weight:900; font-size:0.95rem; color:#e21f26; text-align:right;">${Math.round(totalSum).toLocaleString('ru-RU')} ₽</td>
                    </tr>
                </tfoot>
            `;
        }

        return `
            <div style="background:#ffffff; color:#111; border:1px solid #ddd; border-radius:20px; overflow:hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); margin-bottom:50px;">
                <!-- ВЕРХНЯЯ БРЕНДОВАЯ ПОЛОСА -->
                <div style="background:linear-gradient(90deg, #f8f9fa, rgba(226,31,38,0.08) 50%, #f8f9fa); padding:12px 25px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; font-size:0.7rem; color:#333; letter-spacing:3px; text-transform:uppercase;">ТЕХНОЛОГИЧЕСКАЯ СПЕЦИФИКАЦИЯ (РЕВИЗИЯ 1.0)</div>
                    <div style="font-family:'JetBrains Mono'; font-size:0.8rem; color:#e21f26; font-weight:900;">APT: ${s.art||'—'}</div>
                </div>

                <div class="grid-container" style="padding:25px; display:grid; grid-template-columns: 200px 1fr; gap:30px;">
                    <!-- ЛЕВАЯ КОЛОНКА (МЕТРИКИ) -->
                    <div class="left-col" style="border-right:1px solid #eee; padding-right:25px;">
                        <div style="background:#fff; padding:15px; border-radius:15px; margin-bottom:20px; border:1px solid #eee; display:flex; justify-content:center; align-items:center;">${previewImg}</div>
                        
                        <div style="margin-bottom:20px; text-align:center;">
                            <div style="font-size:1.1rem; font-weight:900; color:#111;">${s.step >= 2 ? (s.length||0) + ' × ' + (s.width||0) : '— × —'}</div>
                            <div style="font-size:0.55rem; color:#777; text-transform:uppercase; font-weight:900;">ДЛИНА В КОЛЬЦО × ШИРИНА (ММ)</div>
                        </div>

                        <div class="left-col-metrics" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
                            <div style="text-align:center; background:#f8f9fa; padding:8px; border-radius:10px; border:1px solid #eee;">
                                <div style="font-size:0.9rem; font-weight:900; color:#111;">${s.step >= 2 ? (s.rodsCount||0) : 0}</div>
                                <div style="font-size:0.45rem; color:#777; text-transform:uppercase;">ПРУТКОВ</div>
                            </div>
                            <div style="text-align:center; background:#f8f9fa; padding:8px; border-radius:10px; border:1px solid #eee;">
                                <div style="font-size:0.9rem; font-weight:900; color:#e21f26;">${s.year||'—'}</div>
                                <div style="font-size:0.45rem; color:#777; text-transform:uppercase;">ГОД</div>
                            </div>
                        </div>

                        <div style="border-top:1px solid #eee; padding-top:15px;">
                            <div style="font-size:0.55rem; color:#777; text-transform:uppercase; font-weight:900; margin-bottom:10px;">ПРИМЕНИМОСТЬ:</div>
                            <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                ${s.crops && s.crops.length ? s.crops.map(c => `<span style="font-size:0.5rem; background:#fff; color:#e21f26; padding:3px 8px; border-radius:4px; font-weight:900; border:1px solid rgba(226,31,38,0.2);">${c}</span>`).join('') : '<span style="font-size:0.5rem; color:#999;">НЕ УКАЗАНО</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- ПРАВАЯ КОЛОНКА (ДЕТАЛИЗАЦИЯ) -->
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
                            <div>
                                <div style="font-size:0.6rem; color:#e21f26; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${s.brand||'БЕЗ БРЕНДА'} • ${s.model||'МОДЕЛЬ НЕ УКАЗАНА'}</div>
                                <div style="font-weight:900; font-size:1.4rem; color:#111; text-transform:uppercase;">${s.name||'НОВОЕ ТЕХНИЧЕСКОЕ ИЗДЕЛИЕ'}</div>
                            </div>
                        </div>

                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="color:#777; text-transform:uppercase; font-size:0.55rem; border-bottom:2px solid #eee; letter-spacing:1px;">
                                    <th style="padding:10px; width:60px; text-align:center;">ID</th>
                                    <th style="padding:10px; text-align:left;">КОМПОНЕНТ / ХАРАКТЕРИСТИКИ</th>
                                    <th style="padding:10px; text-align:center; width:110px;">ДЛИНА / КОЛ-ВО</th>
                                    <th style="padding:10px; text-align:right; width:130px;">СУММА</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bodyHtml || '<tr><td colspan="4" style="padding:30px; text-align:center; font-size:0.65rem; color:#999; text-transform:uppercase; font-weight:900; letter-spacing:2px;">Спецификация ожидает ввода данных с Шага 2...</td></tr>'}
                            </tbody>
                            ${tfootHtml}
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    print() {
        const s = window.CatalogState;
        
        // Включаем класс печати для скрытия инпутов в html
        document.body.classList.add('printing');
        const html = this.render();
        document.body.classList.remove('printing');
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            if(window.showToast) window.showToast("Пожалуйста, разрешите всплывающие окна для печати!", "warning");
            return;
        }
        printWindow.document.write(`
            <html>
                <head>
                    <title>СПЕЦИФИКАЦИЯ ${s.art || ''} - ПРУТКОН ОС</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <style>
                        body { margin: 0; padding: 20px; background: #fff; font-family: 'Inter', sans-serif; color: #000; -webkit-print-color-adjust: exact; }
                        img { max-height: 45px; object-fit: contain; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { border-bottom: 2px solid #000; padding: 8px; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #555; }
                        td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 13px; }
                        .neutral { color: #555; }
                        .brand-red { color: #ed1c24; }
                        .text-white { color: #000 !important; }
                        /* Print layout adaptations */
                        div, p, span, tr, td, th { color: #000 !important; }
                        
                        @media print {
                            body { padding: 0; }
                            button, input { display: none !important; }
                            
                            /* Разворачиваем грид в блочный поток для чистой печати */
                            .grid-container {
                                display: block !important;
                            }
                            .left-col {
                                width: 100% !important;
                                border-right: none !important;
                                border-bottom: 1px solid #ddd !important;
                                padding-right: 0 !important;
                                padding-bottom: 15px !important;
                                margin-bottom: 15px !important;
                                display: flex !important;
                                justify-content: space-between !important;
                                align-items: center !important;
                            }
                            .left-col-metrics {
                                display: flex !important;
                                gap: 15px !important;
                                margin-top: 5px;
                            }
                            
                            /* Избегаем разрывов внутри строк таблицы */
                            tr { page-break-inside: avoid !important; }
                            table { page-break-inside: auto !important; }
                            thead { display: table-header-group !important; }
                            tfoot { display: table-footer-group !important; }
                        }
                    </style>
                </head>
                <body>
                    <div style="max-width: 900px; margin: 0 auto;">
                        ${html}
                    </div>
                    <script>
                        // Convert dark theme colors to light theme for clean printing
                        document.querySelectorAll('*').forEach(el => {
                            const bg = el.style.background || '';
                            if (bg.includes('rgba(0,0,0') || bg === 'rgb(0, 0, 0)' || bg === '#000' || bg === '#050505' || bg.includes('linear-gradient')) {
                                el.style.background = '#fff';
                                el.style.borderColor = '#ddd';
                            }
                            if (el.style.color === 'rgb(255, 255, 255)' || el.style.color === '#fff') {
                                el.style.color = '#000';
                            }
                        });
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
    },
    
    setOverride(key, val) {
        const s = window.CatalogState;
        if (!s.priceOverrides) s.priceOverrides = {};
        s.priceOverrides[key] = parseFloat(val) || 0;
        
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    }
};
