/* catalog_master/step3.js - ПРУТКОН ERP Шаг 3: Технические параметры ремней */

window.CatalogStep3 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        const hasCentralBelt = (s.convType !== '2x');

        // Автоматическое определение параметров ремней на основе бренда
        const brandL = (s.brand || '').toLowerCase();
        
        if (s.sideBeltType === undefined || s.sideBeltType === '') {
            s.sideBeltType = 'DNG_PLUS'; // По умолчанию DNG+
        }
        if (hasCentralBelt && (s.centralBeltType === undefined || s.centralBeltType === '')) {
            s.centralBeltType = 'DNG_PLUS';
        }

        if (s.sideBeltWidth === undefined || s.sideBeltWidth === '') {
            s.sideBeltWidth = '60'; // Стандартная ширина боковых ремней
        }
        if (hasCentralBelt && (s.centralBeltWidth === undefined || s.centralBeltWidth === '')) {
            s.centralBeltWidth = (brandL.includes('grimme') || brandL.includes('dewulf')) ? '75' : '60';
        }

        if (s.sideBeltThickness === undefined || s.sideBeltThickness === '') {
            s.sideBeltThickness = '17'; // Стандартная толщина 17 мм
        }
        if (hasCentralBelt && (s.centralBeltThickness === undefined || s.centralBeltThickness === '')) {
            s.centralBeltThickness = '17';
        }

        if (s.sideHoleDist === undefined || s.sideHoleDist === '') {
            s.sideHoleDist = brandL.includes('dewulf') ? '32' : '23'; // Dewulf: 32мм, Grimme/Ropa: 23мм
        }
        if (hasCentralBelt && (s.centralHoleDist === undefined || s.centralHoleDist === '')) {
            if (brandL.includes('dewulf')) {
                s.centralHoleDist = '32';
            } else if (brandL.includes('grimme') && s.centralBeltWidth === '75') {
                s.centralHoleDist = '28'; // Центральный ремень Grimme 75мм: 28мм
            } else {
                s.centralHoleDist = '23';
            }
        }

        if (s.sideHoleDiam === undefined || s.sideHoleDiam === '') {
            s.sideHoleDiam = brandL.includes('dewulf') ? '8' : '6'; // Dewulf: 8мм (м8), Grimme/Ropa: 6мм (м6)
        }
        if (hasCentralBelt && (s.centralHoleDiam === undefined || s.centralHoleDiam === '')) {
            s.centralHoleDiam = brandL.includes('dewulf') ? '8' : '6';
        }
        
        let rows = dicts.beltTypes.map(b => `
            <tr style="border-bottom:1px solid #111; background:rgba(0,0,0,0.2); transition:0.3s;">
                <td style="padding:15px; text-align:center;"><img src="${window.getSafeImagePath(b.img)}" style="height:45px; background:#fff; border-radius:10px; padding:6px; box-shadow:0 5px 15px rgba(0,0,0,0.5);"></td>
                <td style="font-weight:900; font-size:1.1rem; color:#fff; text-transform:uppercase; letter-spacing:1px;">${b.name}</td>
                <td style="text-align:center;" onclick="window.CatalogStep3.setBelt('${b.id}', false)">
                    <i class="fa-solid ${s.sideBeltType===b.id?'fa-circle-check':'fa-circle'}" style="font-size:2.2rem; cursor:pointer; color:${s.sideBeltType===b.id?'var(--brand-red)':'#080808'}; transition:0.3s;"></i>
                </td>
                ${hasCentralBelt ? `
                <td style="text-align:center;" onclick="window.CatalogStep3.setBelt('${b.id}', true)">
                    <i class="fa-solid ${s.centralBeltType===b.id?'fa-circle-check':'fa-circle'}" style="font-size:2.2rem; cursor:pointer; color:${s.centralBeltType===b.id?'white':'#080808'}; transition:0.3s;"></i>
                </td>` : `<td style="opacity:0.05; text-align:center;"><i class="fa-solid fa-lock" style="font-size:1.5rem;"></i></td>`}
            </tr>
        `).join('');

        const renderFullParams = (isC) => {
            const bk = isC ? 'central' : 'side'; 
            const tid = s[bk + 'BeltType']; if(!tid) return '';
            const tName = dicts.beltTypes.find(b=>b.id===tid).name;
            
            const paramsConfig = [
                { L: 'ШИРИНА РЕМНЯ (W)', k: 'Width', D: dicts.beltWidths, desc: 'Ширина тяговой резинотканевой ленты. (Обязательно)' },
                { L: 'ТОЛЩИНА РЕМНЯ (T)', k: 'Thickness', D: dicts.beltThicknesses, desc: 'Толщина ленты. Определяет прочность полотна. (Обязательно)' },
                { L: 'МЕЖОСЕВОЕ РАССТОЯНИЕ (D)', k: isC?'centralHoleDist':'sideHoleDist', D: dicts.beltHoleDistances, custom: true, desc: 'Расстояние между центрами крепежных отверстий. (Обязательно)' },
                { L: 'ДИАМЕТР ОТВЕРСТИЙ (ø)', k: isC?'centralHoleDiam':'sideHoleDiam', D: dicts.beltHoleDiameters, custom: true, desc: 'Диаметр отверстий под заклепку или крепежный винт. (Обязательно)' }
            ];

            let h = paramsConfig.map(p => {
                const stateKey = p.custom ? p.k : (bk + 'Belt' + p.k);
                const currentVal = s[stateKey];
                let pills = p.D.map(opt => `
                    <button class="param-pill ${currentVal===opt?'active':''}" 
                            onclick="window.CatalogStep3.setParam('${stateKey}','${opt}')">${opt}</button>
                `).join('');
                return `
                    <div style="margin-bottom:20px;">
                        <label class="text-xs neutral block mb-1" style="font-weight:900; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom: 2px;">${p.L}:</label>
                        <span style="font-size:0.55rem; color:#666; display:block; margin-bottom:8px; line-height:1.2;">${p.desc}</span>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">${pills}</div>
                    </div>`;
            }).join('');

            const wKey = bk + 'BeltWidth';
            const dKey = isC ? 'centralHoleDist' : 'sideHoleDist';
            const widthVal = parseFloat(s[wKey]) || 0;
            const distVal = parseFloat(s[dKey]) || 0;
            const edgeVal = (widthVal > distVal) ? ((widthVal - distVal) / 2).toFixed(1) : null;

            return `
                <div style="background:rgba(255,255,255,0.02); padding:30px; border-radius:25px; border:1px solid #181818; box-shadow: 0 10px 30px rgba(0,0,0,0.4); display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="color:var(--brand-red); font-weight:900; font-size:1rem; border-bottom:3px solid #111; padding-bottom:15px; margin-bottom:25px; text-transform:uppercase; letter-spacing:2px;">
                            ${isC?'ВНУТРЕННИЙ (ЦЕНТРАЛЬНЫЙ)':'НАРУЖНЫЙ (БОКОВОЙ)'} РЕМЕНЬ: <span style="color:#fff;">${tName}</span>
                        </div>
                        ${h}
                    </div>
                    
                    <div style="margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px dashed rgba(226,31,38,0.2); font-size: 0.7rem; text-align: center; line-height:1.4;">
                        <span style="color:#888; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">РАЗМЕР ПО БОКАМ (КРАЙ РЕМНЯ):</span>
                        <strong style="color:var(--brand-red); font-size:1.1rem; margin-left:8px; font-family:'Roboto Mono';">
                            ${edgeVal ? edgeVal + ' мм' : '—'}
                        </strong>
                        <div style="font-size:0.55rem; color:#444; margin-top:4px; text-transform:uppercase; font-weight:bold;">
                            (Ширина ремня W - Межосевое D) ÷ 2
                        </div>
                    </div>
                </div>`;
        };

        return `
            <div class="step-panel animate-fade-in">
                <div style="border:2px solid #111; border-radius:20px; overflow:hidden; margin-bottom:30px;">
                    <table style="width:100%; border-collapse:collapse; background:rgba(0,0,0,0.1);">
                        <thead style="font-size:0.65rem; color:#444; text-transform:uppercase; background:rgba(226,31,38,0.05); letter-spacing:2px;">
                            <tr>
                                <th style="padding:20px; width:100px;">ЧЕРТЕЖ</th>
                                <th style="text-align:left;">ТИП ТЯГОВОГО РЕМНЯ</th>
                                <th>БОКОВОЙ</th>
                                <th>ЦЕНТРАЛЬНЫЙ</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div style="display:grid; grid-template-columns:${hasCentralBelt && s.centralBeltType?'1fr 1fr':'1fr'}; gap:30px;">
                    ${renderFullParams(false)}
                    ${renderFullParams(true)}
                </div>
                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="window.CatalogManager.saveStateAndRedirect('warehouse.html?return=catalog')" class="btn btn-secondary" style="height:40px; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; border-radius:10px; background:#0c0c0c; border:1px solid #222;">
                        <i class="fa-solid fa-plus" style="margin-right:10px; color:var(--brand-red);"></i> ЕСЛИ РЕМНЯ НЕТ НА СКЛАДЕ - ДОБАВИТЬ НОВЫЙ РЕМЕНЬ
                    </button>
                </div>
            </div>
            <style>
                .param-pill { background:rgba(255,255,255,0.03); border:1px solid #222; color:#666; padding:8px 16px; border-radius:8px; font-size:0.9rem; font-weight:900; cursor:pointer; transition:0.3s; }
                .param-pill:hover { background:rgba(255,255,255,0.1); color:#fff; transform:translateY(-2px); }
                .param-pill.active { background:var(--brand-red)!important; color:#fff!important; border-color:var(--brand-red)!important; box-shadow: 0 0 15px rgba(226,31,38,0.4); transform:scale(1.05); }
            </style>
        `;
    },
    setBelt(id, isC) {
        const s = window.CatalogState;
        if(isC) {
            s.centralBeltType = (s.centralBeltType===id?'':id); 
            // При выборе типа центрального ремня копируем параметры бокового, если типы совпадают
            if (s.centralBeltType && s.centralBeltType === s.sideBeltType) {
                s.centralBeltWidth = s.sideBeltWidth;
                s.centralBeltThickness = s.sideBeltThickness;
                s.centralHoleDist = s.sideHoleDist;
                s.centralHoleDiam = s.sideHoleDiam;
            }
        } else {
            s.sideBeltType = (s.sideBeltType===id?'':id);
            // При изменении типа бокового ремня, если центральный совпадает, синхронизируем
            if (s.sideBeltType && s.sideBeltType === s.centralBeltType) {
                s.centralBeltWidth = s.sideBeltWidth;
                s.centralBeltThickness = s.sideBeltThickness;
                s.centralHoleDist = s.sideHoleDist;
                s.centralHoleDiam = s.sideHoleDiam;
            }
        }
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },
    setParam(k, v) { 
        const s = window.CatalogState;
        s[k] = v; 
        
        // Синхронизация: если у центрального и бокового ремня совпадает тип,
        // то изменение параметров бокового автоматически обновляет центральный!
        if (s.centralBeltType && s.centralBeltType === s.sideBeltType) {
            if (k === 'sideBeltWidth') s.centralBeltWidth = v;
            if (k === 'sideBeltThickness') s.centralBeltThickness = v;
            if (k === 'sideHoleDist') s.centralHoleDist = v;
            if (k === 'sideHoleDiam') s.centralHoleDiam = v;
        }
        
        window.CatalogManager.refreshStep(); 
        window.CatalogManager.syncReport();
    }
};
