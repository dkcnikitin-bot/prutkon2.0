/* catalog_master/step3.js - ПРУТКОН ERP Шаг 3: Технические параметры ремней */

window.CatalogStep3 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        const hasCentralBelt = (s.convType !== '2x');
        
        let rows = dicts.beltTypes.map(b => `
            <tr style="border-bottom:1px solid #111; background:rgba(0,0,0,0.2); transition:0.3s;">
                <td style="padding:15px; text-align:center;"><img src="${IMG}${b.img}" style="height:45px; background:#fff; border-radius:10px; padding:6px; box-shadow:0 5px 15px rgba(0,0,0,0.5);"></td>
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
                { L: 'ШИРИНА РЕМНЯ (W)', k: 'Width', D: dicts.beltWidths },
                { L: 'ТОЛЩИНА РЕМНЯ (T)', k: 'Thickness', D: dicts.beltThicknesses },
                { L: 'МЕЖОСЕВОЕ РАССТОЯНИЕ (D)', k: isC?'centralHoleDist':'sideHoleDist', D: dicts.beltHoleDistances, custom: true },
                { L: 'ДИАМЕТР ОТВЕРСТИЙ (ø)', k: isC?'centralHoleDiam':'sideHoleDiam', D: dicts.beltHoleDiameters, custom: true }
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
                        <label class="text-xs neutral block mb-2" style="font-weight:900; color:#555; text-transform:uppercase; letter-spacing:1px;">${p.L}:</label>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">${pills}</div>
                    </div>`;
            }).join('');

            return `
                <div style="background:rgba(255,255,255,0.02); padding:30px; border-radius:25px; border:1px solid #181818; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                    <div style="color:var(--brand-red); font-weight:900; font-size:1rem; border-bottom:3px solid #111; padding-bottom:15px; margin-bottom:25px; text-transform:uppercase; letter-spacing:2px;">
                        ${isC?'ВНУТРЕННИЙ (ЦЕНТРАЛЬНЫЙ)':'НАРУЖНЫЙ (БОКОВОЙ)'} ПОЯС: <span style="color:#fff;">${tName}</span>
                    </div>
                    ${h}
                </div>`;
        };

        return `
            <div class="step-panel animate-fade-in">
                <div style="border:2px solid #111; border-radius:20px; overflow:hidden; margin-bottom:30px;">
                    <table style="width:100%; border-collapse:collapse; background:rgba(0,0,0,0.1);">
                        <thead style="font-size:0.65rem; color:#444; text-transform:uppercase; background:rgba(226,31,38,0.05); letter-spacing:2px;">
                            <tr>
                                <th style="padding:20px; width:100px;">ЧЕРТЕЖ</th>
                                <th style="text-align:left;">ТИП ТЯГОВОГО ПОЯСА</th>
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
        if(isC) s.centralBeltType = (s.centralBeltType===id?'':id); 
        else s.sideBeltType = (s.sideBeltType===id?'':id);
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },
    setParam(k, v) { 
        window.CatalogState[k] = v; 
        window.CatalogManager.refreshStep(); 
        window.CatalogManager.syncReport();
    }
};
