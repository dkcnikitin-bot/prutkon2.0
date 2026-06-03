/* catalog_master/step2.js - ПРУТКОН ERP Шаг 2: Геометрия изделия */

window.CatalogStep2 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        
        const len = parseFloat(s.length) || 0;
        const pitch = parseFloat(s.pitch) || 0;
        const theoreticalRods = (pitch > 0) ? Math.round(len / pitch) : 0;
        const actualRods = parseInt(s.rodsCount) || 0;
        const hasInput = (len > 0 && pitch > 0);
        const hasWarning = hasInput && (theoreticalRods !== actualRods);

        let layoutHtml = (s.convType !== '2x') ? `
            <div style="display:flex; align-items:center; gap:20px; background:rgba(255,255,255,0.02); padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.05);">
                <div style="flex-grow:1;"><label class="text-xs neutral mb-1 block" style="font-weight:900;">ГЕОМЕТРИЧЕСКАЯ СХЕМА ЗАМЕРА:</label><div style="display:flex; gap:10px;">
                    <button class="btn btn-xs ${s.centralBeltsLayout==='symmetric'?'btn-primary':'btn-secondary'}" onclick="window.CatalogStep2.setLayout('symmetric')" style="font-weight:900;">СИММЕТРИЧНО</button>
                    <button class="btn btn-xs ${s.centralBeltsLayout==='offset'?'btn-primary':'btn-secondary'}" onclick="window.CatalogStep2.setLayout('offset')" style="font-weight:900;">СО СМЕЩЕНИЕМ</button>
                </div></div>
                <div style="font-size:0.6rem; color:#666; border-left:2px solid var(--brand-red); padding-left:15px; max-width:250px; line-height:1.3; font-weight:700;">Позволяет задать уникальные расстояния между тяговыми поясами (1-2-3-4).</div>
            </div>` : '';

        if (s.centralBeltsLayout === 'offset' && s.convType !== '2x') {
            layoutHtml += `
                <div style="background:rgba(226,31,38,0.1); border-radius:12px; margin-bottom:15px; overflow:hidden; border:1px solid var(--brand-red);"><table style="width:100%; text-align:center;"><thead style="font-size:0.5rem; color:var(--brand-red); background:rgba(226,31,38,0.1);"><tr><th style="padding:5px; font-weight:900;">РАССТОЯНИЕ 1-2</th><th style="padding:5px; font-weight:900;">РАССТОЯНИЕ 2-3</th>${s.convType==='4x'?'<th style="padding:5px; font-weight:900;">РАССТОЯНИЕ 3-4</th>':''}</tr></thead><tbody><tr>
                    <td><input type="text" id="m-d12-2" value="${s.dist12}" oninput="window.CatalogStep2.sync()" style="background:none; border:none; color:#fff; text-align:center; font-weight:900; width:100%; padding:12px; font-size:1.2rem;"></td>
                    <td><input type="text" id="m-d23-2" value="${s.dist23}" oninput="window.CatalogStep2.sync()" style="background:none; border:none; color:#fff; text-align:center; font-weight:900; width:100%; padding:12px; font-size:1.2rem;"></td>
                    ${s.convType==='4x'?`<td><input type="text" id="m-d34-2" value="${s.dist34}" oninput="window.CatalogStep2.sync()" style="background:none; border:none; color:#fff; text-align:center; font-weight:900; width:100%; padding:12px; font-size:1.2rem;"></td>`:''}
                </tr></tbody></table></div>`;
        }

        return `
            <div class="step-panel animate-fade-in">
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:25px;">
                    ${dicts.convTypes.map(it => `<div onclick="window.CatalogStep2.setType('${it.id}')" style="cursor:pointer; background:rgba(255,255,255,0.03); border:2px solid ${s.convType===it.id?'var(--brand-red)':'rgba(255,255,255,0.05)'}; border-radius:18px; padding:15px; text-align:center; transition:0.3s;"><img src="${IMG}${it.img}" style="height:55px; margin-bottom:5px; filter:${s.convType===it.id?'none':'grayscale(1) contrast(0.5)'}"><div style="font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${it.name}</div></div>`).join('')}
                </div>
                ${layoutHtml}
                <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:20px; background:rgba(255,255,255,0.01); padding:25px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); align-items:center;">
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><label class="text-xs neutral font-bold" style="text-transform:uppercase;">ДЛИНА КОЛЬЦА (ММ):</label><input type="number" id="m-len-2" value="${s.length}" oninput="window.CatalogStep2.sync('len')" class="step2-input"></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;"><label class="text-xs neutral font-bold" style="text-transform:uppercase;">ШИРИНА ТРАНСПОРТЕРА (ММ):</label><input type="number" id="m-wid-2" value="${s.width}" oninput="window.CatalogStep2.sync()" class="step2-input"></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;"><label class="text-xs neutral font-bold" style="text-transform:uppercase;">ШАГ ПРУТКОВ (ММ):</label><select id="m-pit-2" onchange="window.CatalogStep2.sync('pit')" class="step2-input" style="font-weight:900;">${dicts.pitches.map(p=>`<option value="${p}" ${p==s.pitch?'selected':''}>${p} мм</option>`).join('')}</select></div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:15px;"><label class="text-xs font-black" style="color:#fff; font-size:1rem; text-transform:uppercase;">ИТОГО ПРУТКОВ (ШТ):</label><input type="number" id="m-rod-2" value="${s.rodsCount}" oninput="window.CatalogStep2.sync()" style="background:none; border:none; width:150px; font-size:2.2rem; color:${hasWarning?'var(--brand-red)':'#fff'}; font-weight:900; text-align:right; outline:none;" placeholder="0"></div>
                    </div>
                    <div style="background:#000; padding:25px; border-left:10px solid ${!hasInput?'#222':(hasWarning?'var(--brand-red)':'#198754')}; border-radius:15px; text-align:center; box-shadow: inset 0 0 40px rgba(0,0,0,0.8);">
                        <div class="text-xs neutral mb-1" style="letter-spacing:1px; font-weight:900; text-transform:uppercase;">ТЕОРЕТИЧЕСКИЙ РАСЧЕТ:</div>
                        <div style="font-size:4rem; font-weight:900; line-height:1; font-family:'Roboto Mono'; text-shadow:0 0 20px rgba(255,255,255,0.1);">${theoreticalRods}</div>
                        <div style="font-size:0.65rem; color:${!hasInput?'#444':(hasWarning?'var(--brand-red)':'#198754')}; font-weight:900; margin-top:15px; text-transform:uppercase; letter-spacing:1px;">${!hasInput?'Ожидание данных':(hasWarning?'ОШИБКА РАСЧЕТА!':'РАСЧЕТ ВЕРЕН')}</div>
                    </div>
                </div>
                ${s.convType !== '2x' ? `<div style="margin-top:25px; text-align:center;"><label class="text-xs neutral mb-4 block" style="font-weight:900; text-transform:uppercase; letter-spacing:1px; font-size:0.75rem;">СПОСОБ КРЕПЛЕНИЯ ЦЕНТРАЛЬНЫХ РЕМНЕЙ:</label><div style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px;">${dicts.centralBeltMounts.map(it=>`<div onclick="window.CatalogStep2.setMount('${it.id}')" style="cursor:pointer; background:rgba(255,255,255,0.03); border:3px solid ${s.centralBeltMount===it.id?'var(--brand-red)':'transparent'}; border-radius:15px; padding:12px; text-align:center; transition:0.3s;"><img src="${IMG}${it.img}" style="height:45px; background:#fff; border-radius:8px; padding:3px; margin-bottom:5px; filter:${s.centralBeltMount===it.id?'none':'grayscale(1) brightness(0.6)'}"><div style="font-size:0.6rem; font-weight:900; color:#fff; text-transform:uppercase; line-height:1.2;">${it.name}</div></div>`).join('')}</div></div>` : ''}
            </div>
            <style>.step2-input { background:rgba(0,0,0,0.4); border:1px solid #333; color:#fff; padding:10px; border-radius:8px; width:140px; text-align:center; font-size:1.1rem; font-weight:900; transition:0.3s; }.step2-input:focus { border-color:var(--brand-red); background:#000; box-shadow:0 0 15px rgba(226,31,38,0.2); outline:none; }</style>
        `;
    },
    sync(source) {
        const s = window.CatalogState;
        s.dist12 = document.getElementById('m-d12-2')?.value || '';
        s.dist23 = document.getElementById('m-d23-2')?.value || '';
        s.dist34 = document.getElementById('m-d34-2')?.value || ''; // Будет null если скрыто, что нам и нужно
        s.length = document.getElementById('m-len-2')?.value || '';
        s.width = document.getElementById('m-wid-2')?.value || '';
        s.pitch = document.getElementById('m-pit-2')?.value || '';
        s.rodsCount = document.getElementById('m-rod-2')?.value || '';
        
        if (source === 'len' || source === 'pit') {
            const l = parseFloat(s.length) || 0; const p = parseFloat(s.pitch) || 0;
            if (l > 0 && p > 0) {
                s.rodsCount = Math.round(l / p).toString();
                const rodInput = document.getElementById('m-rod-2');
                if (rodInput) rodInput.value = s.rodsCount;
            }
        }
        window.CatalogManager.syncReport();
    },
    setType(v) { 
        const s = window.CatalogState;
        s.convType = v; 
        if (v === '3x') s.dist34 = ''; 
        if (v === '2x') { s.centralBeltType = ''; s.dist23 = ''; s.dist34 = ''; }
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },
    setLayout(v) { window.CatalogState.centralBeltsLayout = v; window.CatalogManager.refreshStep(); },
    setMount(v) { window.CatalogState.centralBeltMount = v; window.CatalogManager.refreshStep(); window.CatalogManager.syncReport(); }
};
