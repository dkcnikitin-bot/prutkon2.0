/* catalog_master/specification.js - ПРУТКОН ERP Техническая спецификация */

window.CatalogReport = {
    render() {
        const s = window.CatalogState;
        const IMG = 'extracted_xlsx/xl/media/';
        let bodyHtml = '';
        const add = (name, q, sub, img) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                <td style="text-align:center; padding:10px;"><img src="${IMG}${img}" onerror="if(this.src.endsWith('.jpg')) this.src = this.src.replace('.jpg', '.png');" style="height:35px; background:#fff; border-radius:6px; padding:3px;"></td>
                <td style="padding:10px;"><div style="font-weight:900; color:#fff; font-size:0.8rem;">${name}</div><div style="font-size:0.65rem; color:#555;">${sub}</div></td>
                <td style="text-align:center; color:var(--brand-red); font-weight:900; font-size:0.85rem; white-space:nowrap;">${q}</td>
                <td style="text-align:right; font-family:'Roboto Mono'; font-size:0.7rem; color:#333;">—</td>
            </tr>`;

        // 1. ПРИМЕЧАНИЯ ПО ГЕОМЕТРИИ (ШАГ 2+)
        if (s.step >= 2) {
            if (s.convType !== '2x') {
                const m = window.CatalogDicts.centralBeltMounts.find(x=>x.id===s.centralBeltMount);
                if (m) bodyHtml += add(`СПОСОБ КРЕПЛЕНИЯ ЦЕНТРАЛЬНЫХ РЕМНЕЙ: ${m.name}`, '—', `Технология соединения: Штамповка / Литая скоба`, m.img);
            }
            if (s.centralBeltsLayout === 'offset') {
                let distStr = `Расстояние 1-2: ${s.dist12 || 0} мм / Расстояние 2-3: ${s.dist23 || 0} мм`;
                if (s.convType === '4x') distStr += ` / Расстояние 3-4: ${s.dist34 || 0} мм`;
                bodyHtml += add(`ИНДИВИДУАЛЬНОЕ РАССТОЯНИЕ МЕЖДУ РЕМНЯМИ`, '—', distStr, '3x.png');
            }
        }

        // 2. Тяговые ленты (ШАГ 3+)
        if (s.step >= 3) {
            const beltLengthMm = parseFloat(s.length) || 0;
            const sideBeltsQty = (beltLengthMm * 2) / 1000;
            let centralBeltsCount = (s.convType === '3x' ? 1 : (s.convType === '4x' ? 2 : 0));
            const centralBeltsQty = (beltLengthMm * centralBeltsCount) / 1000;

            if(s.sideBeltType) {
                const b = window.CatalogDicts.beltTypes.find(x=>x.id===s.sideBeltType);
                if (b) bodyHtml += add(`БОКОВОЙ ТЯГОВЫЙ ПОЯС: ${b.name} (КОМПЛЕКТ 2 ШТ)`, sideBeltsQty.toFixed(2) + ' м', `Параметры: ${s.sideBeltWidth}/${s.sideBeltThickness}/${s.sideHoleDist}/${s.sideHoleDiam}`, b.img);
            }
            if(centralBeltsCount > 0 && s.centralBeltType) {
                const b = window.CatalogDicts.beltTypes.find(x=>x.id===s.centralBeltType);
                if (b) bodyHtml += add(`ЦЕНТРАЛЬНЫЙ ТЯГОВЫЙ ПОЯС: ${b.name} (${centralBeltsCount} ШТ)`, centralBeltsQty.toFixed(2) + ' м', `Параметры: ${s.centralBeltWidth}/${s.centralBeltThickness}/${s.centralHoleDist}/${s.centralHoleDiam}`, b.img);
            }
        }

        // 3. Дополнительная комплектация (ШАГ 4+)
        if (s.step >= 4) {
            const sortedItems = [...s.additionalItems].sort((a, b) => (parseInt(a.order) || 999) - (parseInt(b.order) || 999));
            sortedItems.forEach(it => {
                const d = window.CatalogDicts.additionalComponentsDef.find(x=>x.id===it.id);
                if (d) bodyHtml += add(d.name, it.total+' шт', `Чередование: ${it.step} | Порядок: № ${it.order} | Жесткость: ${it.diam} мм`, d.img);
            });
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
                    bodyHtml += add(`ЗАМОК СОЕДИНИТЕЛЬНЫЙ: ${lp.name}`, '1 шт', `Артикул: ${lp.art} | Шаг: ${lp.pitch || '—'}`, '35.jpg');
                }
            }
        }

        const showPreview = s.step >= 2;
        const convTypeData = window.CatalogDicts.convTypes.find(t=>t.id===s.convType);
        const previewImg = showPreview && convTypeData ? `<img src="${IMG}${convTypeData.img}" style="width:100%; height:80px; object-fit:contain;">` : `<div style="height:80px; display:flex; align-items:center; justify-content:center; color:#222; font-size:0.5rem; text-transform:uppercase; font-weight:900;">Схема (Шаг 2)</div>`;

        return `
            <div style="background:#050505; border:1px solid #111; border-radius:20px; overflow:hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.8); margin-bottom:50px;">
                <!-- ВЕРХНЯЯ БРЕНДОВАЯ ПОЛОСА -->
                <div style="background:linear-gradient(90deg, #111, rgba(226,31,38,0.2) 50%, #111); padding:10px 25px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; font-size:0.7rem; color:#fff; letter-spacing:3px; text-transform:uppercase;">ТЕХНОЛОГИЧЕСКАЯ СПЕЦИФИКАЦИЯ (РЕВИЗИЯ 1.0)</div>
                    <div style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--brand-red); font-weight:900;">APT: ${s.art||'—'}</div>
                </div>

                <div style="padding:25px; display:grid; grid-template-columns: 200px 1fr; gap:30px;">
                    <!-- ЛЕВАЯ КОЛОНКА (МЕТРИКИ) -->
                    <div style="border-right:1px solid #111; padding-right:25px;">
                        <div style="background:#000; padding:15px; border-radius:15px; margin-bottom:20px; border:1px solid #181818;">${previewImg}</div>
                        
                        <div style="margin-bottom:20px; text-align:center;">
                            <div style="font-size:1rem; font-weight:900; color:#fff;">${s.step >= 2 ? (s.length||0) + ' × ' + (s.width||0) : '— × —'}</div>
                            <div style="font-size:0.55rem; color:#444; text-transform:uppercase; font-weight:900;">ДЛИНА × ШИРИНА (ММ)</div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
                            <div style="text-align:center; background:rgba(255,255,255,0.02); padding:8px; border-radius:10px;">
                                <div style="font-size:0.9rem; font-weight:900; color:#fff;">${s.step >= 2 ? (s.rodsCount||0) : 0}</div>
                                <div style="font-size:0.45rem; color:#444; text-transform:uppercase;">ПРУТКОВ</div>
                            </div>
                            <div style="text-align:center; background:rgba(255,255,255,0.02); padding:8px; border-radius:10px;">
                                <div style="font-size:0.9rem; font-weight:900; color:var(--brand-red);">${s.year||'—'}</div>
                                <div style="font-size:0.45rem; color:#444; text-transform:uppercase;">ГОД</div>
                            </div>
                        </div>

                        <div style="border-top:1px solid #111; padding-top:15px;">
                            <div style="font-size:0.55rem; color:#888; text-transform:uppercase; font-weight:900; margin-bottom:10px;">ПРИМЕНИМОСТЬ:</div>
                            <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                ${s.crops && s.crops.length ? s.crops.map(c => `<span style="font-size:0.5rem; background:#111; color:var(--brand-red); padding:3px 8px; border-radius:4px; font-weight:900; border:1px solid rgba(226,31,38,0.2);">${c}</span>`).join('') : '<span style="font-size:0.5rem; color:#222;">НЕ УКАЗАНО</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- ПРАВАЯ КОЛОНКА (ДЕТАЛИЗАЦИЯ) -->
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; border-bottom:1px solid #111; padding-bottom:10px;">
                            <div>
                                <div style="font-size:0.6rem; color:var(--brand-red); font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${s.brand||'БЕЗ БРЕНДА'} • ${s.model||'МОДЕЛЬ НЕ УКАЗАНА'}</div>
                                <div style="font-weight:900; font-size:1.4rem; color:#fff; text-transform:uppercase;">${s.name||'НОВОЕ ТЕХНИЧЕСКОЕ ИЗДЕЛИЕ'}</div>
                            </div>
                        </div>

                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="color:#555; text-transform:uppercase; font-size:0.55rem; border-bottom:1px solid #111; letter-spacing:1px;">
                                    <th style="padding:10px; width:60px;">ID</th>
                                    <th style="padding:10px; text-align:left;">КОМПОНЕНТ / ХАРАКТЕРИСТИКИ</th>
                                    <th style="padding:10px;">ДЛИНА / КОЛ-ВО</th>
                                    <th style="padding:10px; text-align:right;">ИНФО</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bodyHtml || '<tr><td colspan="4" style="padding:30px; text-align:center; font-size:0.6rem; color:#222; text-transform:uppercase; font-weight:900; letter-spacing:2px;">Спецификация ожидает ввода данных с Шага 2...</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
