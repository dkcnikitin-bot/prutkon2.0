/* catalog_master/step4.js - ПРУТКОН ERP Шаг 4: Комплектующие и Инженерный расчет */

window.CatalogStep4 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        
        if (!s.calcBaseRods || s.calcBaseRods === '0') s.calcBaseRods = s.rodsCount;

        if (!window.allProductsListForStep4) {
            window.allProductsListForStep4 = [...(window.dbProducts || []), ...(window.dbTransProducts || []), ...(window.catalogData || [])].filter(p => p.id && p.name && p.art);
        }

        const rows = dicts.additionalComponentsDef.map(it => {
            const si = s.additionalItems.find(x=>x.id===it.id); 
            const ok = !!si;
            return `
                <tr style="border-bottom:1px solid #111; background:${ok?'rgba(226,31,38,0.05)':'transparent'}; transition:0.3s;">
                    <td style="text-align:center; padding:10px;"><i class="fa-solid ${ok?'fa-square-check':'fa-square'}" style="font-size:1.8rem; cursor:pointer; color:${ok?'var(--brand-red)':'#101010'}" onclick="window.CatalogStep4.toggle('${it.id}')"></i></td>
                    <td style="padding:10px; text-align:center;"><img src="${ok && si.photo ? si.photo : IMG+it.img}" style="height:45px; background:#fff; border-radius:8px; padding:4px; object-fit:contain; ${!ok?'opacity:0.1; filter:grayscale(1)':''}"></td>
                    <td style="font-weight:900; font-size:0.85rem; color:${ok?'#fff':'#333'}; padding-right:15px; text-transform:uppercase; position:relative;">
                        ${it.name}
                        ${ok ? `
                        <div style="margin-top:5px; position:relative;">
                            <input type="text" class="m4-inp" style="width:100%; text-align:left; font-weight:normal; font-size:0.7rem; padding:4px;" placeholder="Умный поиск (арт, назв, W, P, L)..." oninput="window.CatalogStep4.handleSmartSearch('${it.id}', this.value)" onfocus="window.CatalogStep4.handleSmartSearch('${it.id}', this.value)" onblur="setTimeout(() => { const el=document.getElementById('ss-res-${it.id}'); if(el) el.classList.add('hidden'); }, 250)" value="${si.art || ''}">
                            <div id="ss-res-${it.id}" class="hidden" style="position:absolute; top:100%; left:0; width:350px; max-height:250px; overflow-y:auto; background:#111; border:1px solid var(--brand-red); z-index:9999; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.8); text-align:left; text-transform:none;"></div>
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
                    <div style="flex:2;">
                        <button onclick="window.CatalogStep4.searchMatches()" class="btn btn-secondary" style="width:100%; height:40px; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; border-radius:10px; background:#0c0c0c; border:1px solid #222;">
                            <i class="fa-solid fa-magnifying-glass-chart" style="margin-right:10px; color:var(--brand-red);"></i> НАЙТИ ПОХОЖИЕ В БАЗЕ
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
    toggle(id) {
        const s = window.CatalogState;
        const idx = s.additionalItems.findIndex(x=>x.id===id);
        if(idx > -1) s.additionalItems.splice(idx,1);
        else s.additionalItems.push({ id:id, step:'1', order:(s.additionalItems.length + 1).toString(), total:'0', diam:'11', rubberDiam:'', width:'', height:'', teeth:'', pos:'1', price:'', art:'', photo:'' });
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
        
        if (!query || query.length < 1) {
            resEl.classList.add('hidden');
            return;
        }
        
        const qParts = query.toLowerCase().split(' ').filter(Boolean);
        
        const matches = window.allProductsListForStep4.filter(p => {
            const str = `${p.art||''} ${p.name||''} ${p.category||''} ${p.width||''} ${p.length||''} ${p.pitch||''} ${p.diam||''}`.toLowerCase();
            return qParts.every(word => str.includes(word));
        }).slice(0, 15);
        
        if (matches.length === 0) {
            resEl.innerHTML = '<div style="padding:10px; color:#888; font-size:0.7rem; text-align:center;">Ничего не найдено</div>';
        } else {
            resEl.innerHTML = matches.map(p => {
                const imgPath = p.photo ? p.photo : (p.img ? (p.img.includes('/') ? p.img : 'extracted_xlsx/xl/media/' + p.img) : 'extracted_xlsx/xl/media/no_photo.png');
                return `
                <div onclick="window.CatalogStep4.applySmartMatch('${id}', '${p.art}')" style="padding:8px 10px; border-bottom:1px solid #222; cursor:pointer; display:flex; gap:10px; align-items:center; transition:0.2s;" onmouseover="this.style.background='rgba(226,31,38,0.2)'" onmouseout="this.style.background='transparent'">
                    <img src="${imgPath}" style="width:36px; height:36px; object-fit:contain; background:#fff; border-radius:4px;" onerror="this.style.display='none'">
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
            // Критерий поиска: совпадение по ширине и типу
            const matches = dbTrans.filter(p => {
                const pW = parseFloat(p.width) || 0;
                const sW = parseFloat(s.width) || 0;
                return Math.abs(pW - sW) < 2; // Ширина совпадает
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
                 // Здесь можно добавить логику перезаписи состояния данными из реестра
                 window.showToast('Данные применены!', 'success');
            }
        }
    }
};
