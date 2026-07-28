/* catalog_master/step2.js - ПРУТКОН ERP Шаг 2: Геометрия изделия */

window.CatalogStep2 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        
        const len = parseFloat(s.length) || 0;
        const pitch = parseFloat(s.pitch) || 0;
        const hasOverlap = (s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot' || s.connectionType === 'screws');
        const overlap = hasOverlap ? (parseInt(s.connectionOverlapSteps) || 6) : 0;
        const theoreticalRods = (pitch > 0) ? Math.round(len / pitch) - overlap : 0;
        const actualRods = parseInt(s.rodsCount) || 0;
        const hasInput = (len > 0 && pitch > 0);
        const hasWarning = hasInput && (theoreticalRods !== actualRods);

        // Инициализация бокового свеса на основе бренда
        if (s.sideMargin === undefined) {
            const brandL = (s.brand || '').toLowerCase();
            if (brandL.includes('dewulf')) s.sideMargin = 126;
            else if (brandL.includes('ropa')) s.sideMargin = 130;
            else if (brandL.includes('grimme')) s.sideMargin = 115;
            else s.sideMargin = 120;
        }
        if (!s.centralBeltsLayout) s.centralBeltsLayout = 'symmetric';

        const margin = parseFloat(s.sideMargin) || 120;
        const width = parseFloat(s.width) || 0;
        
        let d12 = s.dist12;
        let d23 = s.dist23;
        let d34 = s.dist34;
        
        if (s.centralBeltsLayout === 'symmetric') {
            if (s.convType === '2x') {
                d12 = width > 2 * margin ? (width - 2 * margin).toFixed(0) : '';
                d23 = '';
                d34 = '';
            } else if (s.convType === '3x') {
                const centerDist = width > 2 * margin ? ((width - 2 * margin) / 2).toFixed(1) : '';
                d12 = centerDist;
                d23 = centerDist;
                d34 = '';
            } else if (s.convType === '4x') {
                const centerDist = width > 2 * margin ? ((width - 2 * margin) / 3).toFixed(1) : '';
                d12 = centerDist;
                d23 = centerDist;
                d34 = centerDist;
            }
            s.dist12 = d12;
            s.dist23 = d23;
            s.dist34 = d34;
        }

        // Алерт об автозаполнении по справочнику моделей
        let modelAlertHtml = '';
        const MODEL_DIMENSIONS = window.MODEL_DIMENSIONS || {};
        const selectedModelName = (s.model || '').toLowerCase().trim();
        if (MODEL_DIMENSIONS[selectedModelName]) {
            const nodeInfo = s.harvesterNode ? ` (Узел: <span style="color:#2ec866; font-weight:900;">${s.harvesterNode}</span>)` : '';
            modelAlertHtml = `
                <div style="background:rgba(25,135,84,0.08); border:1px solid rgba(25,135,84,0.25); padding:10px 15px; border-radius:10px; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-circle-info" style="color:#2ec866;"></i>
                    <div style="font-size:0.65rem; color:#fff; font-weight:700; line-height:1.2;">
                        Параметры автоматически установлены по справочнику моделей для комбайна <span style="color:#2ec866; font-weight:900;">${s.brand} ${s.model}</span>${nodeInfo}.
                    </div>
                </div>
            `;
        }

        let layoutHtml = `
            <div style="display:flex; align-items:center; gap:20px; background:rgba(255,255,255,0.02); padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.05);">
                <div style="flex-grow:1;"><label class="text-xs neutral mb-1 block" style="font-weight:900; letter-spacing:0.5px;">ГЕОМЕТРИЧЕСКАЯ СХЕМА ЗАМЕРА:</label><div style="display:flex; gap:10px;">
                    <button class="btn btn-xs ${s.centralBeltsLayout==='symmetric'?'btn-primary':'btn-secondary'}" onclick="window.CatalogStep2.setLayout('symmetric')" style="font-weight:900;">СИММЕТРИЧНО (АВТО)</button>
                    <button class="btn btn-xs ${s.centralBeltsLayout==='offset'?'btn-primary':'btn-secondary'}" onclick="window.CatalogStep2.setLayout('offset')" style="font-weight:900;">СО СМЕЩЕНИЕМ (РУЧНАЯ)</button>
                </div></div>
                <div style="font-size:0.6rem; color:#666; border-left:2px solid var(--brand-red); padding-left:15px; max-width:350px; line-height:1.3; font-weight:700;">
                    Симметричный режим автоматически рассчитывает расстояния между ремнями на основе боковых свесов.
                </div>
            </div>`;

        const isReadOnly = s.centralBeltsLayout === 'symmetric' ? 'readonly style="background:rgba(255,255,255,0.02); color:#ff9f0a; pointer-events:none; border:none; text-align:center; font-weight:900; width:100%; padding:12px; font-size:1.2rem; outline:none;"' : 'style="background:none; border:none; color:#fff; text-align:center; font-weight:900; width:100%; padding:12px; font-size:1.2rem; outline:none;"';

        layoutHtml += `
            <div style="background:rgba(0,0,0,0.4); border-radius:12px; margin-bottom:15px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);"><table style="width:100%; text-align:center;"><thead style="font-size:0.55rem; color:#888; background:rgba(0,0,0,0.5); letter-spacing:1px; text-transform:uppercase;"><tr>
                <th style="padding:8px; font-weight:900;">РАССТОЯНИЕ D1-2 (ММ)</th>
                ${s.convType!=='2x'?'<th style="padding:8px; font-weight:900;">РАССТОЯНИЕ D2-3 (ММ)</th>':''}
                ${s.convType==='4x'?'<th style="padding:8px; font-weight:900;">РАССТОЯНИЕ D3-4 (ММ)</th>':''}
            </tr></thead><tbody><tr>
                <td><input type="text" id="m-d12-2" value="${d12}" oninput="window.CatalogStep2.sync()" ${isReadOnly}></td>
                ${s.convType!=='2x'?`<td><input type="text" id="m-d23-2" value="${d23}" oninput="window.CatalogStep2.sync()" ${isReadOnly}></td>`:''}
                ${s.convType==='4x'?`<td><input type="text" id="m-d34-2" value="${d34}" oninput="window.CatalogStep2.sync()" ${isReadOnly}></td>`:''}
            </tr></tbody></table></div>`;

        return `
            <div class="step-panel animate-fade-in">
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:20px;">
                    ${dicts.convTypes.map(it => `<div onclick="window.CatalogStep2.setType('${it.id}')" style="cursor:pointer; background:rgba(255,255,255,0.03); border:2px solid ${s.convType===it.id?'var(--brand-red)':'rgba(255,255,255,0.05)'}; border-radius:18px; padding:15px; text-align:center; transition:0.3s;"><img src="${window.getSafeImagePath(it.img)}" style="height:55px; margin-bottom:5px; filter:${s.convType===it.id?'none':'grayscale(1) contrast(0.5)'}"><div style="font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${it.name}</div></div>`).join('')}
                </div>
                ${modelAlertHtml}
                ${layoutHtml}
                <div style="background:rgba(255,255,255,0.01); padding:25px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:20px 30px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <label class="text-xs neutral font-bold" style="text-transform:uppercase; margin-bottom: 2px; display:block;">ДЛИНА В КОЛЬЦО (ММ):</label>
                                <span style="font-size:0.55rem; color:#666; display:block; line-height:1.2;">Полная развернутая длина ленты по внутреннему контуру (мм).</span>
                            </div>
                            <input type="number" id="m-len-2" value="${s.length}" oninput="window.CatalogStep2.sync('len')" class="step2-input">
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <label class="text-xs neutral font-bold" style="text-transform:uppercase; margin-bottom: 2px; display:block;">ШИРИНА ТРАНСПОРТЕРА (ММ):</label>
                                <span style="font-size:0.55rem; color:#666; display:block; line-height:1.2;">Габаритный размер по концам металлических прутков (мм).</span>
                            </div>
                            <input type="number" id="m-wid-2" value="${s.width}" oninput="window.CatalogStep2.sync('width')" class="step2-input">
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <label class="text-xs neutral font-bold" style="text-transform:uppercase; margin-bottom: 2px; display:block;">БОКОВОЙ СВЕС ПРУТКА (ММ):</label>
                                <span style="font-size:0.55rem; color:#666; display:block; line-height:1.2;">Свес от края прутка до центра бокового ремня (Grimme = 115 мм, Dewulf = 126 мм, Ropa = 130 мм).</span>
                            </div>
                            <input type="number" id="m-margin-2" value="${s.sideMargin}" oninput="window.CatalogStep2.sync('margin')" class="step2-input">
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <label class="text-xs neutral font-bold" style="text-transform:uppercase; margin-bottom: 2px; display:block;">ШАГ ПРУТКОВ (ММ):</label>
                                <span style="font-size:0.55rem; color:#666; display:block; line-height:1.2;">Межцентровое расстояние между соседними прутками (мм).</span>
                            </div>
                            <select id="m-pit-2" onchange="window.CatalogStep2.sync('pit')" class="step2-input" style="font-weight:900;">${dicts.pitches.map(p=>`<option value="${p}" ${p==s.pitch?'selected':''}>${p} мм</option>`).join('')}</select>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:20px; margin-top:20px;">
                        <div>
                            <label class="text-xs font-black" style="color:#fff; font-size:1.1rem; text-transform:uppercase; margin-bottom: 2px; display:block;">ИТОГО ПРУТКОВ (ШТ):</label>
                            <span style="font-size:0.55rem; color:#666; display:block; line-height:1.2;">Расчетное количество металлических прутков (Длина / Шаг).</span>
                        </div>
                        <input type="number" id="m-rod-2" value="${s.rodsCount}" oninput="window.CatalogStep2.sync()" style="background:none; border:none; width:150px; font-size:2.5rem; color:#fff; font-weight:900; text-align:right; outline:none;" placeholder="0">
                    </div>
                </div>
                ${s.convType !== '2x' ? `<div style="margin-top:25px; text-align:center;"><label class="text-xs neutral mb-4 block" style="font-weight:900; text-transform:uppercase; letter-spacing:1px; font-size:0.75rem;">СПОСОБ КРЕПЛЕНИЯ ЦЕНТРАЛЬНЫХ РЕМНЕЙ:</label><div style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px;">${dicts.centralBeltMounts.map(it=>`<div onclick="window.CatalogStep2.setMount('${it.id}')" style="cursor:pointer; background:rgba(255,255,255,0.03); border:3px solid ${s.centralBeltMount===it.id?'var(--brand-red)':'transparent'}; border-radius:15px; padding:12px; text-align:center; transition:0.3s;"><img src="${window.getSafeImagePath(it.img)}" style="height:45px; background:#fff; border-radius:8px; padding:3px; margin-bottom:5px; filter:${s.centralBeltMount===it.id?'none':'grayscale(1) brightness(0.6)'}"><div style="font-size:0.6rem; font-weight:900; color:#fff; text-transform:uppercase; line-height:1.2;">${it.name}</div></div>`).join('')}</div></div>` : ''}
            </div>
            <style>.step2-input { background:rgba(0,0,0,0.4); border:1px solid #333; color:#fff; padding:10px; border-radius:8px; width:140px; text-align:center; font-size:1.1rem; font-weight:900; transition:0.3s; }.step2-input:focus { border-color:var(--brand-red); background:#000; box-shadow:0 0 15px rgba(226,31,38,0.2); outline:none; }</style>
        `;
    },
    sync(source) {
        const s = window.CatalogState;
        s.sideMargin = document.getElementById('m-margin-2')?.value || '';
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

        // Обновляем автоназвание при изменении геометрических параметров
        if (window.CatalogStep1 && window.CatalogStep1.updateAutoName) {
            window.CatalogStep1.updateAutoName();
        }

        // Расчет и автозаполнение межременных расстояний по свесам
        const margin = parseFloat(s.sideMargin) || 120;
        const width = parseFloat(s.width) || 0;
        let d12 = '', d23 = '', d34 = '';
        if (s.centralBeltsLayout === 'symmetric') {
            if (s.convType === '2x') {
                d12 = width > 2 * margin ? (width - 2 * margin).toFixed(0) : '';
            } else if (s.convType === '3x') {
                const centerDist = width > 2 * margin ? ((width - 2 * margin) / 2).toFixed(1) : '';
                d12 = centerDist;
                d23 = centerDist;
            } else if (s.convType === '4x') {
                const centerDist = width > 2 * margin ? ((width - 2 * margin) / 3).toFixed(1) : '';
                d12 = centerDist;
                d23 = centerDist;
                d34 = centerDist;
            }
            s.dist12 = d12;
            s.dist23 = d23;
            s.dist34 = d34;
            
            const el12 = document.getElementById('m-d12-2'); if(el12) el12.value = d12;
            const el23 = document.getElementById('m-d23-2'); if(el23) el23.value = d23;
            const el34 = document.getElementById('m-d34-2'); if(el34) el34.value = d34;
        } else {
            s.dist12 = document.getElementById('m-d12-2')?.value || '';
            s.dist23 = document.getElementById('m-d23-2')?.value || '';
            s.dist34 = document.getElementById('m-d34-2')?.value || '';
        }

        // Мгновенный расчет теоретических прутков без полной перерисовки
        const len = parseFloat(s.length) || 0;
        const pitch = parseFloat(s.pitch) || 0;
        const hasOverlap = (s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot' || s.connectionType === 'screws');
        const overlap = hasOverlap ? (parseInt(s.connectionOverlapSteps) || 6) : 0;
        const theoreticalRods = (pitch > 0) ? Math.round(len / pitch) - overlap : 0;
        const actualRods = parseInt(s.rodsCount) || 0;
        const hasInput = (len > 0 && pitch > 0);
        const hasWarning = hasInput && (theoreticalRods !== actualRods);

        const tipEl = document.getElementById('step2-overlap-tip');
        if (tipEl) {
            tipEl.textContent = hasOverlap ? `С учетом нахлеста соединений (${s.connectionOverlapSteps || 6} шагов)` : 'Без нахлеста соединений (разъемный стык)';
        }

        const thEl = document.getElementById('step2-theoretical-rods');
        if (thEl) thEl.textContent = theoreticalRods.toString();
        
        const statusEl = document.getElementById('step2-calc-status');
        if (statusEl) {
            statusEl.textContent = !hasInput ? 'Ожидание данных' : (hasWarning ? 'ОШИБКА РАСЧЕТА!' : 'РАСЧЕТ ВЕРЕН');
            statusEl.style.color = !hasInput ? '#444' : (hasWarning ? 'var(--brand-red)' : '#198754');
        }
        
        const boxEl = document.getElementById('step2-indicator-box');
        if (boxEl) {
            boxEl.style.borderLeftColor = !hasInput ? '#222' : (hasWarning ? 'var(--brand-red)' : '#198754');
        }
        
        const rodInput = document.getElementById('m-rod-2');
        if (rodInput) {
            rodInput.style.color = hasWarning ? 'var(--brand-red)' : '#fff';
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
