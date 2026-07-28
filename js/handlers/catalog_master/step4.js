/* catalog_master/step4.js - ПРУТКОН ERP Шаг 4: Комплектующие и Инженерный расчет */

window.CatalogStep4 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        
        if (!s.userOverrodeBaseRods && s.rodsCount) {
            s.calcBaseRods = s.rodsCount;
        }
        if (!s.calcBaseRods || s.calcBaseRods === '0') {
            s.calcBaseRods = s.rodsCount || '500';
        }

        if (!window.allProductsListForStep4) {
            window.allProductsListForStep4 = [...(window.dbProducts || []), ...(window.dbTransProducts || []), ...(window.catalogData || [])].filter(p => p.id && p.name && p.art);
        }

        const rows = dicts.additionalComponentsDef.map(it => {
            const si = s.additionalItems.find(x=>x.id===it.id); 
            const ok = !!si;
            return `
                <tr style="border-bottom:1px solid #111; background:${ok?'rgba(226,31,38,0.05)':'transparent'}; transition:0.3s;">
                    <td style="text-align:center; padding:10px;"><i class="fa-solid ${ok?'fa-square-check':'fa-square'}" style="font-size:1.8rem; cursor:pointer; color:${ok?'var(--brand-red)':'#101010'}" onclick="window.CatalogStep4.toggle('${it.id}')"></i></td>
                    <td style="padding:10px; text-align:center;"><img src="${window.getSafeImagePath(ok && si.photo ? si.photo : it.img)}" style="height:45px; background:#fff; border-radius:8px; padding:4px; object-fit:contain; ${!ok?'opacity:0.1; filter:grayscale(1)':''}"></td>
                    <td style="font-weight:900; font-size:0.85rem; color:${ok?'#fff':'#333'}; padding-right:15px; text-transform:uppercase; position:relative;">
                        ${it.name}
                        ${ok ? `
                        <div style="margin-top:5px; position:relative;">
                            <input type="text" class="m4-inp" style="width:100%; text-align:left; font-weight:normal; font-size:0.7rem; padding:4px;" placeholder="Умный поиск (арт, назв, W, P, L)..." oninput="window.CatalogStep4.handleSmartSearch('${it.id}', this.value)" onfocus="window.CatalogStep4.handleSmartSearch('${it.id}', this.value)" onblur="setTimeout(() => { const el=document.getElementById('ss-res-${it.id}'); if(el) el.classList.add('hidden'); }, 250)" value="${si.art || ''}">
                            <div id="ss-res-${it.id}" class="hidden" style="position:absolute; top:100%; left:0; width:350px; max-height:250px; overflow-y:auto; background:#111; border:1px solid var(--brand-red); z-index:9999; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.8); text-align:left; text-transform:none;"></div>
                            <div style="margin-top:4px; text-align:right;">
                                <a href="javascript:void(0)" onclick="window.CatalogStep4.openQuickCreateComponent('${it.id}')" style="font-size:0.55rem; color:var(--brand-red); font-weight:bold; text-decoration:underline;"><i class="fa-solid fa-plus-circle"></i> Создать в Инженерии</a>
                            </div>
                        </div>
                        ` : ''}
                    </td>
                    <td><input type="text" class="m4-inp" value="${ok?si.step:''}" placeholder="0" oninput="window.CatalogStep4.update('${it.id}','step',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.order:''}" placeholder="0" oninput="window.CatalogStep4.update('${it.id}','order',this.value)" ${!ok?'disabled':''}></td>
                    <td style="background:rgba(255,255,255,0.03);"><input type="text" id="tot-4-${it.id}" class="m4-inp" style="color:var(--brand-red); font-weight:900; width:85px;" value="${ok?si.total:''}" readonly></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.diam:''}" placeholder="—" oninput="window.CatalogStep4.update('${it.id}','diam',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.rubberDiam:''}" placeholder="—" oninput="window.CatalogStep4.update('${it.id}','rubberDiam',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.width:''}" oninput="window.CatalogStep4.update('${it.id}','width',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.height:''}" oninput="window.CatalogStep4.update('${it.id}','height',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.teeth:''}" oninput="window.CatalogStep4.update('${it.id}','teeth',this.value)" ${!ok?'disabled':''}></td>
                    <td><input type="text" class="m4-inp" value="${ok?si.pos:''}" oninput="window.CatalogStep4.update('${it.id}','pos',this.value)" ${!ok?'disabled':''}></td>
                    <td style="border-left:1px solid #222;"><input type="text" class="m4-inp" style="color:#198754; font-weight:900; width:80px;" value="${ok?si.price:''}" oninput="window.CatalogStep4.update('${it.id}','price',this.value)" placeholder="₽" ${!ok?'disabled':''}></td>
                </tr>`;
        }).join('');

        return `
            <div class="step-panel animate-fade-in">
                <!-- БЛОК ПОИСКА СОВПАДЕНИЙ (ИЗ prices_trans.html) -->
                <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:15px; border:1px solid #111; margin-bottom:20px; display:flex; align-items:center; gap:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                    <div style="flex:1;">
                        <div style="font-size:1.1rem; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:1px;">ПОИСК СОВПАДЕНИЙ</div>
                        <div style="font-size:0.55rem; color:#444; text-transform:uppercase; margin-top:2px;">Анализ базы данных на основе геометрии</div>
                    </div>
                    <div style="flex:1; color:var(--brand-red); font-size:0.6rem; text-transform:uppercase; font-weight:900; text-align:center;">
                         Совпадение без учета длины
                    </div>
                      <div style="flex:2; display:flex; gap:10px;">
                          <button onclick="window.CatalogStep4.searchMatches()" class="btn btn-secondary" style="flex:1; height:40px; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; border-radius:10px; background:#0c0c0c; border:1px solid #222;">
                              <i class="fa-solid fa-magnifying-glass-chart" style="margin-right:10px; color:var(--brand-red);"></i> ИСКАТЬ ПРУТОК-МАТЧ  В БАЗЕ
                          </button>
                          <button onclick="window.CatalogStep4.openQuickCreateComponent('rod_straight')" class="btn btn-secondary" style="flex:1; height:40px; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; border-radius:10px; background:#0c0c0c; border:1px solid #222;" title="Создание позиции прутка">
                              <i class="fa-solid fa-plus" style="margin-right:10px; color:var(--brand-red);"></i> СОЗДАТЬ В ИНЖЕНЕРИИ
                          </button>
                      </div>
                </div>
                <div id="m4-match-results" class="hidden animate-fade-in" style="margin-bottom:30px; padding:20px; background:rgba(255,255,255,0.02); border-radius:20px; border:1px solid #181818;"></div>

                <div style="background:linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(226,31,38,0.05) 100%); padding:20px; border-radius:18px; border:1px solid #222; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:30px; align-items:center;">
                    <div style="display:flex; align-items:center; gap:15px; border-right:1px solid #222; padding-right:20px;">
                        <label class="text-xs neutral font-black" style="text-transform:uppercase; letter-spacing:1px; font-size:0.7rem;">БАЗА ПРУТКОВ (ИЗ ШАГА 2):</label>
                        <input id="m-base-4" type="number" value="${s.calcBaseRods}" oninput="window.CatalogStep4.syncBase()" style="background:#000; border:1px solid var(--brand-red); color:#fff; width:100px; text-align:center; padding:8px; border-radius:8px; font-size:1.4rem; font-weight:900; outline:none; box-shadow: 0 0 15px rgba(226,31,38,0.2);">
                    </div>
                    <div style="display:flex; align-items:center; gap:15px; border-right:1px solid #222; padding-right:20px;">
                        <label class="text-xs neutral font-black" style="text-transform:uppercase; letter-spacing:1px; font-size:0.7rem;">СУММА ШАГОВ (ЦИКЛ):</label>
                        <div id="m-cycle-4" style="font-size:2.2rem; font-weight:900; color:#fff; border-bottom:3px solid var(--brand-red); min-width:60px; text-align:center; font-family:'Roboto Mono'; line-height:1;">${s.calcCycleSum}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.55rem; color:#444; text-transform:uppercase; letter-spacing:2px; font-weight:900;">МГНОВЕННЫЙ ИНЖЕНЕРНЫЙ ПЕРЕСЧЕТ:</div>
                        <div style="font-size:0.7rem; color:var(--brand-red); font-weight:900;">(БАЗА / ЦИКЛ) × ШАГ ПОЗИЦИИ</div>
                    </div>
                </div>

                <div class="panel glass-panel mb-3" style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); font-size:0.65rem; color:#888; line-height:1.4; margin-bottom: 20px;">
                    <strong style="color:#fff; text-transform:uppercase; font-size:0.7rem; display:block; margin-bottom:5px;"><i class="fa-solid fa-circle-info" style="color:var(--brand-red);"></i> Справка по заполнению Шага 4 (Расчет дополнительных элементов):</strong>
                    * <b>База прутков</b> — Полное число прутков полотна (из Шага 2). (Обязательно)<br>
                    * <b>Шаг чередования (Ч)</b> — Интервал установки. Например, шаг 3 означает установку каждого 3-го прутка этого типа. (Обязательно, если элемент включен)<br>
                    * <b>Порядковый номер (№ Пор.)</b> — Стартовый индекс укладки в цикле. (Не обязательно)<br>
                    * <b>Итоговое кол-во (ШТ)</b> — Рассчитывается автоматически. Уменьшает количество стандартных базовых прутков в спецификации.<br>
                    * <b>Умный поиск (в названии)</b> — Кликните в поле ввода названия, чтобы выбрать конкретный артикул элемента из прайс-листа. (Обязательно)<br>
                    * <b>Цена (₽)</b> — Подтягивается автоматически при выборе артикула или заполняется вручную. (Обязательно)
                </div>

                <div style="background:#000; border:1px solid #111; border-radius:18px; overflow-x:auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                    <table style="width:100%; border-collapse:collapse; min-width:1450px; font-size:0.65rem;">
                        <thead style="background:rgba(226,31,38,0.07); color:#555; text-transform:uppercase; letter-spacing:1px;">
                            <tr>
                                <th style="padding:15px;">ВКЛ</th>
                                <th>ВИД</th>
                                <th style="text-align:left;">НАИМЕНОВАНИЕ</th>
                                <th>ШАГ (Ч)</th>
                                <th>№ ПОР.</th>
                                <th>ИТОГО (ШТ)</th>
                                <th>Ø ПР.</th>
                                <th>Ø РЕЗ.</th>
                                <th>ШИР.</th>
                                <th>ВЫС.</th>
                                <th>ЗУБЬЯ</th>
                                <th>ПОЗ.</th>
                                <th>ЦЕНА ₽</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
            <style>
                .m4-inp { background:rgba(255,255,255,0.03); border:1px solid #181818; color:#fff; text-align:center; padding:8px; border-radius:6px; width:55px; font-weight:900; font-size:0.85rem; }
                .m4-inp:focus { border-color:var(--brand-red); background:#000; outline:none; }
                .m4-inp:disabled { border:none; opacity:0; pointer-events:none; }
            </style>
        `;
    },
    autoMatchProduct(id) {
        const s = window.CatalogState;
        if (!window.allProductsListForStep4) {
            window.allProductsListForStep4 = [...(window.dbProducts || []), ...(window.dbTransProducts || []), ...(window.catalogData || [])].filter(p => p.id && p.name && p.art);
        }
        
        const products = window.allProductsListForStep4;
        const targetDiam = parseFloat(s.diam || s.screwDiam) || 0;
        const targetWidth = parseFloat(s.width) || 0;
        
        const searchConfig = {
            rod_straight: { keys: ['пруток'], exclude: ['гнут', 'обрез', 'пальц', 'сдвоен', 'витой', 'решет', 'пластин'] },
            rod_bent: { keys: ['гнут'], exclude: ['обрез', 'пальц', 'сдвоен', 'решет'] },
            rod_rubber: { keys: ['обрезин'], exclude: ['гнут', 'пальц', 'сдвоен', 'решет'] },
            rod_plate: { keys: ['пластин'], exclude: [] },
            flappers: { keys: ['хлопушк'], exclude: [] },
            pushers_pu: { keys: ['толкател'], exclude: [] },
            paddles_steel: { keys: ['лопатк'], exclude: [] },
            rod_twisted: { keys: ['витой'], exclude: [] },
            rod_fingers: { keys: ['пальц'], exclude: [] },
            rod_bent_rubber: { keys: ['гнутый', 'обрезин'], exclude: [] },
            rod_grate: { keys: ['решетч'], exclude: [] },
            rod_double_clamp: { keys: ['сдвоен', 'хомут'], exclude: [] },
            rod_double_welded: { keys: ['сдвоен', 'сварн'], exclude: [] },
            belt_conveyor: { keys: ['лента', 'конвейер'], exclude: [] },
            fingers: { keys: ['пальцы'], exclude: [] }
        };
        
        const config = searchConfig[id];
        if (!config) return null;
        
        let candidates = products.filter(p => {
            const nameLower = (p.name || '').toLowerCase();
            const artLower = (p.art || '').toLowerCase();
            const searchStr = `${nameLower} ${artLower}`;
            
            const hasKeys = config.keys.every(k => searchStr.includes(k));
            if (!hasKeys) return false;
            
            const hasExclude = config.exclude.some(ex => searchStr.includes(ex));
            if (hasExclude) return false;
            
            return true;
        });
        
        if (candidates.length === 0) return null;
        
        let scoredCandidates = candidates.map(p => {
            let score = 0;
            const pDiam = parseFloat(p.diam || p.diameter) || 0;
            const pWidth = parseFloat(p.width || p.length) || 0;
            
            if (targetDiam > 0 && Math.abs(pDiam - targetDiam) < 0.5) score += 100;
            if (targetWidth > 0 && Math.abs(pWidth - targetWidth) < 10) score += 50;
            
            return { item: p, score: score };
        });
        
        scoredCandidates.sort((a, b) => b.score - a.score);
        return scoredCandidates[0].item;
    },
    toggle(id) {
        const s = window.CatalogState;
        const idx = s.additionalItems.findIndex(x=>x.id===id);
        if(idx > -1) {
            s.additionalItems.splice(idx,1);
        } else {
            const newItem = { id:id, step:'1', order:(s.additionalItems.length + 1).toString(), total:'0', diam:s.diam || '11', rubberDiam:'', width:s.width || '', height:'', teeth:'', pos:'1', price:'', art:'', photo:'' };
            const matched = this.autoMatchProduct(id);
            if (matched) {
                newItem.art = matched.art || '';
                newItem.price = matched.price || '';
                if(matched.width) newItem.width = matched.width;
                if(matched.pitch) newItem.pitch = matched.pitch;
                if(matched.diam) newItem.diam = matched.diam;
                if(matched.length) newItem.height = matched.length;
                if(matched.photo) newItem.photo = matched.photo;
                else if(matched.img) newItem.photo = matched.img.includes('/') ? matched.img : 'extracted_xlsx/xl/media/' + matched.img;
            }
            s.additionalItems.push(newItem);
        }
        window.CatalogManager.refreshStep();
        this.recalc();
    },
    selectProduct(id, art) {
        const s = window.CatalogState;
        const si = s.additionalItems.find(x => x.id === id);
        if (!si) return;
        
        si.art = art;
        const p = window.allProductsListForStep4.find(x => x.art === art);
        if (p) {
            si.price = p.price || '';
            if(p.width) si.width = p.width;
            if(p.pitch) si.pitch = p.pitch;
            if(p.diam) si.diam = p.diam;
            if(p.length) si.height = p.length; // usually maps to length in this context
            if(p.photo) si.photo = p.photo;
            else if(p.img) si.photo = p.img.includes('/') ? p.img : 'extracted_xlsx/xl/media/' + p.img;
            if(window.showToast) window.showToast(`Подгружены данные: ${p.name}`, 'success');
        }
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
        this.recalc();
    },
    handleSmartSearch(id, query) {
        const resEl = document.getElementById(`ss-res-${id}`);
        if (!resEl) return;
        
        const s = window.CatalogState;
        let matches = [];

        if (!query || query.trim().length === 0) {
            matches = window.allProductsListForStep4.filter(p => {
                const pW = parseFloat(p.width) || 0;
                const sW = parseFloat(s.width) || 0;
                const pP = parseFloat(p.pitch) || 0;
                const sP = parseFloat(s.pitch) || 0;
                let matchW = (sW > 0) ? (Math.abs(pW - sW) < 2) : true;
                let matchP = (sP > 0) ? (Math.abs(pP - sP) < 0.5) : true;
                return (matchW || matchP) && (pW > 0 || pP > 0);
            }).slice(0, 15);
        } else {
            const qParts = query.toLowerCase().split(' ').filter(Boolean);
            let scoredMatches = window.allProductsListForStep4.map(p => {
                const str = `${p.art||''} ${p.name||''} ${p.category||''} ${p.width||''} ${p.length||''} ${p.pitch||''} ${p.diam||''}`.toLowerCase();
                let score = 0;
                let allMatch = true;
                
                for (let word of qParts) {
                    if (!str.includes(word)) {
                        allMatch = false;
                        break;
                    }
                    // Увеличиваем вес если совпадает диаметр или ширина
                    if (word === String(p.diam)) score += 50;
                    if (word === String(p.width)) score += 30;
                    if (word === String(p.pitch)) score += 30;
                }
                
                // Умный поиск: если ширина совпадает с шириной транспортера (s.width)
                if (s.width && Math.abs((parseFloat(p.width) || 0) - parseFloat(s.width)) < 2) {
                    score += 20;
                }

                return { item: p, score: score, isMatch: allMatch };
            }).filter(x => x.isMatch);

            // Сортируем: сначала те, у кого совпал диаметр (наивысший score), затем по остальным параметрам
            matches = scoredMatches.sort((a, b) => b.score - a.score).map(x => x.item).slice(0, 15);
        }
        
        if (matches.length === 0) {
            resEl.innerHTML = '<div style="padding:10px; color:#888; font-size:0.7rem; text-align:center;">Ничего не найдено (введите запрос)</div>';
        } else {
            resEl.innerHTML = matches.map(p => {
                const imgPath = window.getSafeImagePath(p.photo || p.img);
                return `
                <div onclick="window.CatalogStep4.applySmartMatch('${id}', '${p.art}')" style="padding:8px 10px; border-bottom:1px solid #222; cursor:pointer; display:flex; gap:10px; align-items:center; transition:0.2s;" onmouseover="this.style.background='rgba(226,31,38,0.2)'" onmouseout="this.style.background='transparent'">
                    <img src="${imgPath}" style="width:36px; height:36px; object-fit:contain; background:#fff; border-radius:4px;">
                    <div style="flex:1;">
                        <div style="font-size:0.75rem; font-weight:900; color:#fff; line-height:1.2;">${p.name}</div>
                        <div style="font-size:0.6rem; color:var(--accent-blue); margin-top:3px;">Арт: ${p.art} | Цена: <span style="color:var(--emerald-neon); font-weight:bold;">${p.price || 0} ₽</span></div>
                        <div style="font-size:0.55rem; color:#888; margin-top:2px;">
                            ${p.width ? `<span style="border:1px solid #333; padding:1px 4px; border-radius:3px; margin-right:3px;">W:${p.width}</span>` : ''}
                            ${p.length ? `<span style="border:1px solid #333; padding:1px 4px; border-radius:3px; margin-right:3px;">L:${p.length}</span>` : ''}
                            ${p.pitch ? `<span style="border:1px solid #333; padding:1px 4px; border-radius:3px; margin-right:3px;">P:${p.pitch}</span>` : ''}
                            ${p.diam ? `<span style="border:1px solid #333; padding:1px 4px; border-radius:3px; margin-right:3px;">Ø:${p.diam}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }
        resEl.classList.remove('hidden');
    },
    applySmartMatch(id, art) {
        const resEl = document.getElementById(`ss-res-${id}`);
        if(resEl) resEl.classList.add('hidden');
        this.selectProduct(id, art);
    },
    update(id, f, v) {
        const i = window.CatalogState.additionalItems.find(x=>x.id===id);
        if(i) { i[f] = v; if(f==='step') this.recalc(); window.CatalogManager.syncReport(); }
    },
    syncBase() { 
        window.CatalogState.calcBaseRods = document.getElementById('m-base-4')?.value || ''; 
        window.CatalogState.userOverrodeBaseRods = true;
        this.recalc(); 
    },
    recalc() {
        const s = window.CatalogState;
        let cycle = 0; s.additionalItems.forEach(i => cycle += (parseFloat(i.step)||0));
        s.calcCycleSum = cycle;
        const cEl = document.getElementById('m-cycle-4'); if(cEl) cEl.textContent = cycle;
        const base = parseFloat(s.calcBaseRods)||0;
        if(base > 0 && cycle > 0) {
            s.additionalItems.forEach(item => {
                const step = parseFloat(item.step)||0;
                item.total = Math.round((base / cycle) * step).toString();
                const tEl = document.getElementById(`tot-4-${item.id}`); 
                if(tEl) tEl.value = item.total;
            });
        }
        window.CatalogManager.syncReport();
    },
    searchMatches() {
        const s = window.CatalogState;
        const resultsEl = document.getElementById('m4-match-results');
        resultsEl.classList.remove('hidden');
        resultsEl.innerHTML = '<div style="text-align:center; padding:20px; color:#555; text-transform:uppercase; letter-spacing:2px;">Анализ базы данных... <i class="fa-solid fa-spinner fa-spin direct"></i></div>';
        
        setTimeout(() => {
            const dbTrans = window.dbTransProducts || [];
            const matches = dbTrans.filter(p => {
                const pW = parseFloat(p.width) || 0;
                const sW = parseFloat(s.width) || 0;
                const pP = parseFloat(p.pitch) || 0;
                const sP = parseFloat(s.pitch) || 0;
                
                const matchW = (Math.abs(pW - sW) < 2); // Ширина совпадает
                const matchP = (sP > 0) ? (Math.abs(pP - sP) < 0.5) : true; // Шаг совпадает
                
                return matchW && matchP; 
            }).slice(0, 5); // Топ-5

            if(matches.length === 0) {
                resultsEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--brand-red); font-weight:900;">СОВПАДЕНИЙ НЕ НАЙДЕНО. ПЕРЕЙДИТЕ К СЛЕДУЮЩЕМУ БЛОКУ.</div>';
            } else {
                let h = '<div style="font-weight:900; color:#fff; font-size:0.75rem; margin-bottom:15px; border-bottom:1px solid #222; padding-bottom:10px;">НАЙДЕНЫ ПОХОЖИЕ ТЕХНИЧЕСКИЕ РЕШЕНИЯ:</div>';
                matches.forEach(m => {
                    h += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:12px 20px; border-radius:12px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.03);">
                        <div>
                            <div style="font-weight:900; color:var(--brand-red); font-size:0.9rem;">${m.art}</div>
                            <div style="font-size:0.7rem; color:#555;">${m.name} | Ширина: ${m.width} мм</div>
                        </div>
                        <button onclick="window.CatalogStep4.applyMatch('${m.id}')" class="btn btn-secondary btn-sm" style="font-size:0.65rem; border-radius:8px;">ПРИМЕНИТЬ ДАННЫЕ</button>
                    </div>`;
                });
                resultsEl.innerHTML = h;
            }
        }, 800);
    },
    applyMatch(id) {
        if(confirm('Заменить текущие параметры данными из найденной модели?')) {
            const m = window.dbTransProducts.find(x => x.id == id);
            if(m) {
                 const s = window.CatalogState;
                 if (m.art) s.art = m.art;
                 if (m.name) s.name = m.name;
                 if (m.width) s.width = m.width;
                 if (m.pitch || m.p) s.pitch = String(m.pitch || m.p);
                 if (m.length || m.len) s.length = String(m.length || m.len);
                 
                 // Recalculate rods if length and pitch are present
                 const l = parseFloat(s.length) || 0;
                 const p = parseFloat(s.pitch) || 0;
                 if (l > 0 && p > 0) {
                     s.rodsCount = Math.round(l / p).toString();
                 }
                 
                 window.CatalogManager.refreshStep();
                 window.CatalogManager.syncReport();
                 if (window.showToast) window.showToast('Данные модели успешно применены!', 'success');
            }
        }
    },
    openQuickCreateComponent(componentId) {
        // Удаляем старый оверлей, если он остался
        const old = document.getElementById('quick-comp-modal');
        if (old) old.remove();

        const s = window.CatalogState;
        const targetDia = parseFloat(s.diam) || 11;
        const targetWidth = parseFloat(s.width) || 1500;
        
        let category = 'components'; // rods, belts, components
        if (componentId.startsWith('rod_')) {
            category = 'rods';
        } else if (componentId.includes('belt') || componentId.includes('conveyor')) {
            category = 'belts';
        }

        let defaultName = '';
        let defaultArt = '';
        let extraFieldsHtml = '';
        let defaultCost = 150;
        let defaultPrice = 330;

        if (category === 'rods') {
            let rodType = 'Прямой';
            let artType = 'straight';
            if (componentId === 'rod_bent') { rodType = 'Сложный / Гнутый'; artType = 'bent'; }
            if (componentId === 'rod_rubber') { rodType = 'Ообрезиненный'; artType = 'rubber'; }
            
            defaultArt = `rod_${targetDia}_${targetWidth}_${artType}_NEW`;
            defaultName = `Пруток ${rodType.toLowerCase()} Ø${targetDia} мм L=${targetWidth} мм`;

            // Расчет веса и себестоимости прутка
            let metalPrice = 180;
            if (window.dbDirectories) {
                const metalDir = window.dbDirectories.find(d => d.category === 'metal' && parseFloat(d.diameter || d.data?.diameter) === targetDia);
                if (metalDir) {
                    const d = metalDir.data || metalDir;
                    metalPrice = parseFloat(d.price || d.price_ton_vat / 1000) || 180;
                }
            }
            const weight = 0.006165 * targetDia * targetDia * (targetWidth / 1000);
            const matCost = weight * metalPrice;
            let opCost = 150;
            if (componentId === 'rod_bent') opCost += 120;
            if (componentId === 'rod_rubber') opCost += 200;
            
            defaultCost = Math.round(matCost + opCost);
            defaultPrice = Math.round(defaultCost * 2.2);

            extraFieldsHtml = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Диаметр стали (мм)</label>
                        <input type="number" id="q-dia" value="${targetDia}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;" oninput="window.CatalogStep4.recalcQuickCompFields('${componentId}', 'rods')">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Длина прутка (мм)</label>
                        <input type="number" id="q-len" value="${targetWidth}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;" oninput="window.CatalogStep4.recalcQuickCompFields('${componentId}', 'rods')">
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Тип обработки</label>
                    <select id="q-type" style="background:#080808; border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;" onchange="window.CatalogStep4.recalcQuickCompFields('${componentId}', 'rods')">
                        <option value="Прямой" ${rodType==='Прямой'?'selected':''}>Прямой пруток</option>
                        <option value="Сложный / Гнутый" ${rodType==='Сложный / Гнутый'?'selected':''}>Сложный / Гнутый</option>
                        <option value="Ообрезиненный" ${rodType==='Ообрезиненный'?'selected':''}>Обрезиненный</option>
                    </select>
                </div>
            `;
        } else if (category === 'belts') {
            const targetWidthBelt = 60; // Дефотная ширина тяговых лент
            defaultArt = `belt_${targetWidthBelt}_NEW`;
            defaultName = `Лента тяговая шириной ${targetWidthBelt} мм`;
            defaultCost = 850;
            defaultPrice = 1850;

            extraFieldsHtml = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Ширина ленты (мм)</label>
                        <input type="number" id="q-width" value="${targetWidthBelt}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;" oninput="window.CatalogStep4.recalcQuickCompFields('${componentId}', 'belts')">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Толщина ленты (мм)</label>
                        <input type="number" id="q-thick" value="11" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                    </div>
                </div>
            `;
        } else {
            // Обычные комплектующие
            let compName = 'Хлопушка';
            let artPrefix = 'flapper';
            if (componentId === 'pushers_pu') { compName = 'Толкатель ПУ'; artPrefix = 'pusher'; }
            if (componentId === 'paddles_steel') { compName = 'Лопатка стальная'; artPrefix = 'paddle'; }
            if (componentId === 'fingers') { compName = 'Пальцы резиновые'; artPrefix = 'fingers'; }

            defaultArt = `${artPrefix}_std_NEW`;
            defaultName = `${compName} стандартная позиция`;
            defaultCost = 250;
            defaultPrice = 550;

            extraFieldsHtml = `
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Характеристики / Размеры</label>
                    <input type="text" id="q-spec" value="Стандартное исполнение" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                </div>
            `;
        }

        const modalHtml = `
        <div id="quick-comp-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:200000; display:flex; align-items:center; justify-content:center; font-family:'Inter', sans-serif;">
            <div style="background:rgba(15,15,25,0.96); border:2px solid var(--brand-red); width:500px; padding:35px; border-radius:20px; box-shadow:0 15px 50px rgba(0,0,0,0.8); color:#fff; position:relative; overflow:hidden;">
                <button onclick="document.getElementById('quick-comp-modal').remove()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#aaa; font-size:1.8rem; cursor:pointer; transition:0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#aaa'">&times;</button>
                
                <h3 style="margin:0 0 25px; color:#fff; font-size:1.2rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-plus-circle" style="color:var(--brand-red);"></i> Создание позиции на склад
                </h3>

                <div style="display:flex; flex-direction:column; gap:15px; margin-bottom:25px;">
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Артикул изделия</label>
                        <input type="text" id="q-art" value="${defaultArt}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--brand-red); font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none; font-family:monospace;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Наименование изделия</label>
                        <input type="text" id="q-name" value="${defaultName}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                    </div>
                    
                    ${extraFieldsHtml}

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:15px; margin-top:5px;">
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Себестоимость (₽)</label>
                            <input type="number" id="q-cost" value="${defaultCost}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--neon-emerald); font-weight:900; font-size:1.1rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Цена продажи (₽)</label>
                            <input type="number" id="q-price" value="${defaultPrice}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--brand-gold); font-weight:900; font-size:1.1rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                    </div>
                </div>

                <div id="q-hint-block" style="background:rgba(226,31,38,0.03); padding:15px; border-radius:12px; border:1px solid rgba(226,31,38,0.15); font-size:0.7rem; color:#ccc; line-height:1.4; margin-bottom:20px;">
                    Калькуляция позиции...
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('quick-comp-modal').remove()" style="background:#111; border:1px solid #222; color:#fff; font-weight:900; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; padding:12px 20px; border-radius:10px; cursor:pointer; transition:0.3s;" onmouseover="this.style.background='#222'" onmouseout="this.style.background='#111'">Отмена</button>
                    <button onclick="window.CatalogStep4.saveQuickComp('${componentId}', '${category}')" style="background:var(--brand-red); border:none; color:#fff; font-weight:900; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; padding:12px 25px; border-radius:10px; cursor:pointer; box-shadow:0 5px 15px rgba(226,31,38,0.3); transition:0.3s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Сохранить на склад</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.recalcQuickCompFields(componentId, category);
    },

    recalcQuickCompFields(componentId, category) {
        const hint = document.getElementById('q-hint-block');
        if (!hint) return;

        if (category === 'rods') {
            const dia = parseFloat(document.getElementById('q-dia').value) || 11;
            const len = parseFloat(document.getElementById('q-len').value) || 1500;
            const type = document.getElementById('q-type').value;

            let metalPrice = 180;
            if (window.dbDirectories) {
                const metalDir = window.dbDirectories.find(d => d.category === 'metal' && parseFloat(d.diameter || d.data?.diameter) === dia);
                if (metalDir) {
                    const d = metalDir.data || metalDir;
                    metalPrice = parseFloat(d.price || d.price_ton_vat / 1000) || 180;
                }
            }
            const weight = 0.006165 * dia * dia * (len / 1000);
            const matCost = weight * metalPrice;
            
            let opCost = 150;
            if (type.includes('гнут') || type.includes('Гнутый')) opCost += 120;
            if (type.includes('резин') || type.includes('Ообрезиненный')) opCost += 200;

            const cost = Math.round(matCost + opCost);
            const price = Math.round(cost * 2.2);

            document.getElementById('q-cost').value = cost;
            document.getElementById('q-price').value = price;

            hint.innerHTML = `
                <i class="fa-solid fa-info-circle" style="color:var(--brand-red); margin-right:6px;"></i>
                <b>Авторасчет:</b> Сталь Ø${dia} мм (${metalPrice} ₽/кг) &middot; Вес прутка: ${weight.toFixed(3)} кг<br>
                Себестоимость: <b>${cost} ₽</b> (материал ${Math.round(matCost)} ₽ + работа ${opCost} ₽) &middot; Прайс: <b>${price} ₽</b>
            `;
        } else if (category === 'belts') {
            const width = parseFloat(document.getElementById('q-width').value) || 60;
            const cost = Math.round(width * 14);
            const price = Math.round(width * 31);
            
            document.getElementById('q-cost').value = cost;
            document.getElementById('q-price').value = price;

            hint.innerHTML = `
                <i class="fa-solid fa-info-circle" style="color:var(--brand-red); margin-right:6px;"></i>
                <b>Авторасчет ленты:</b> Ширина ${width} мм &middot; Материал: Резинотканевый трак DNG+<br>
                Себестоимость м.п.: <b>${cost} ₽</b> &middot; Цена продажи м.п.: <b>${price} ₽</b>
            `;
        } else {
            const cost = parseFloat(document.getElementById('q-cost').value) || 250;
            const price = Math.round(cost * 2.2);
            document.getElementById('q-price').value = price;

            hint.innerHTML = `
                <i class="fa-solid fa-info-circle" style="color:var(--brand-red); margin-right:6px;"></i>
                <b>Калькуляция комплектующего:</b> Базовый расчет себестоимости с наценкой 120% на складской резерв.
            `;
        }
    },

    saveQuickComp(componentId, category) {
        const art = document.getElementById('q-art').value.trim();
        const name = document.getElementById('q-name').value.trim();
        const cost = parseFloat(document.getElementById('q-cost').value) || 0;
        const price = parseFloat(document.getElementById('q-price').value) || 0;

        if (!art || !name) {
            alert('Заполните артикул и наименование изделия!');
            return;
        }

        const newProduct = {
            id: 'comp_' + Date.now(),
            art: art,
            article: art,
            name: name,
            category: category === 'rods' ? 'rods' : (category === 'belts' ? 'belts' : 'components'),
            cost: cost,
            price: price,
            currency: 'RUB',
            date: new Date().toISOString().split('T')[0]
        };

        if (category === 'rods') {
            newProduct.dia = parseFloat(document.getElementById('q-dia').value) || 11;
            newProduct.width = parseFloat(document.getElementById('q-len').value) || 1500;
            newProduct.type = document.getElementById('q-type').value;
        } else if (category === 'belts') {
            newProduct.width = parseFloat(document.getElementById('q-width').value) || 60;
            newProduct.thickness = parseFloat(document.getElementById('q-thick').value) || 11;
        }

        if (!window.dbProducts) window.dbProducts = [];
        window.dbProducts.push(newProduct);
        localStorage.setItem('prutkon_products', JSON.stringify(window.dbProducts));

        window.allProductsListForStep4 = null; 

        const s = window.CatalogState;
        let item = s.additionalItems.find(x => x.id === componentId);
        if (!item) {
            item = { id: componentId, step: '1', order: '1', total: s.calcBaseRods || '105' };
            s.additionalItems.push(item);
        }
        
        item.art = art;
        item.price = price.toString();
        
        if (category === 'rods') {
            item.diam = newProduct.dia.toString();
            item.width = newProduct.width.toString();
        } else if (category === 'belts') {
            s.sideBeltWidth = newProduct.width.toString();
            s.sideBeltThickness = newProduct.thickness.toString();
        }

        const modal = document.getElementById('quick-comp-modal');
        if (modal) modal.remove();

        if (window.showToast) {
            window.showToast(`🚀 Позиция "${art}" успешно сохранена на склад и добавлена в расчет!`, 'success');
        }

        // Вызываем полный перерасчет и синхронизацию с менеджером
        window.CatalogStep4.recalc();
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    }
};
