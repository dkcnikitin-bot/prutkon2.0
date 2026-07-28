/* catalog_master/step5.js - ПРУТКОН ERP Шаг 5: Соединение и Замки */

window.CatalogStep5 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const IMG = 'extracted_xlsx/xl/media/';
        
        // Получаем список замков из базы заготовок (поиск по категории или названию)
        const locks = (window.dbProducts || []).filter(p => {
            const cat = (p.category || "").toLowerCase();
            const name = (p.name || "").toLowerCase();
            return cat.includes('замок') || cat.includes('locks') || name.includes('замок') || name.includes('замки');
        });
        
        return `
            <div class="step-panel animate-fade-in" style="max-width:1100px; margin:0 auto;">
                <h4 style="font-size:0.75rem; color:#444; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:25px; text-align:center;">
                    <i class="fa-solid fa-link" style="color:var(--brand-red); margin-right:8px;"></i> ТИП СОЕДИНЕНИЯ ТРАНСПОРТЕРА
                </h4>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:40px;">
                    ${dicts.connectionTypes.map(t => {
                        const active = s.connectionType === t.id;
                        return `
                            <div onclick="window.CatalogStep5.setType('${t.id}')" class="panel glass-panel select-card ${active ? 'active' : ''}" 
                                 style="padding:15px; text-align:center; cursor:pointer; border:1px solid ${active ? 'var(--brand-red)' : 'rgba(255,255,255,0.05)'}; background:${active ? 'rgba(226,31,38,0.05)' : 'rgba(0,0,0,0.2)'}; transition:0.3s;">
                                <div style="font-size:0.65rem; font-weight:900; text-transform:uppercase; color:${active ? '#fff' : '#666'}; margin-bottom:12px; height:30px; display:flex; align-items:center; justify-content:center;">${t.name}</div>
                                <div style="background:#000; border-radius:10px; padding:10px; border:1px solid #111; margin-bottom:15px;">
                                    <img src="${window.getSafeImagePath(t.img)}" 
                                         style="width:100%; height:80px; object-fit:contain; filter:${active ? 'none' : 'grayscale(1)'}; transition:0.3s;">
                                </div>
                                <div style="width:20px; height:20px; border-radius:50%; border:2px solid ${active ? 'var(--brand-red)' : '#222'}; margin:0 auto; display:flex; align-items:center; justify-content:center;">
                                    ${active ? '<div style="width:10px; height:10px; background:var(--brand-red); border-radius:50%;"></div>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${s.connectionType === 'screws' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot' || s.connectionType === 'vulcanization' ? `
                <div class="panel glass-panel animate-fade-in" style="padding:20px; border:1px solid #111; background:rgba(0,0,0,0.5); margin-bottom:20px; border-radius:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <label style="font-size:0.75rem; color:#fff; font-weight:900; text-transform:uppercase; display:block; margin-bottom: 5px;">Увеличение длины ремня на стык (в шагах):</label>
                            <span style="font-size:0.75rem; color:#ffb400; font-weight: bold;" id="overlap-display-val">
                                Текущее увеличение: ${s.connectionOverlapSteps !== undefined ? s.connectionOverlapSteps : 6} шагов * ${s.pitch || 0} мм = ${(s.connectionOverlapSteps !== undefined ? s.connectionOverlapSteps : 6) * (parseFloat(s.pitch) || 0)} мм
                            </span>
                        </div>
                        <input type="number" id="m-overlap-steps" value="${s.connectionOverlapSteps !== undefined ? s.connectionOverlapSteps : 6}" 
                               oninput="window.CatalogStep5.syncOverlap(this.value)" 
                               style="background:rgba(0,0,0,0.4); border:1px solid #333; color:#fff; padding:10px; border-radius:8px; width:90px; text-align:center; font-size:1.1rem; font-weight:900;">
                    </div>
                </div>
                ` : ''}

                <!-- ВЫБОР КОНКРЕТНОГО ЗАМКА -->
                ${s.connectionType === 'mechanical' || s.connectionType === 'screws' ? `
                <div class="panel glass-panel animate-fade-in" style="padding:25px; border:1px solid #111; background:rgba(0,0,0,0.5);">
                    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:30px; align-items:center;">
                        <div>
                            <label style="font-size:0.65rem; color:#555; text-transform:uppercase; font-weight:900; display:block; margin-bottom:10px;">ВЫБОР МОДЕЛИ ЗАМКА:</label>
                            <select class="form-control" style="height:45px; font-weight:700; font-size:0.9rem;" onchange="window.CatalogStep5.setLock(this.value)">
                                <option value="">-- Выберите замок из прайса --</option>
                                ${locks.map(p => `<option value="${p.id}" ${s.lockId === p.id ? 'selected' : ''}>${p.art} | ${p.name} [${p.brand || ''}]</option>`).join('')}
                            </select>
                            <div style="margin-top: 15px;">
                                <button onclick="window.CatalogStep5.openQuickCreateLock()" class="btn btn-secondary" style="width:100%; height:35px; font-size:0.65rem; font-weight:900; text-transform:uppercase; border-radius:8px; background:#0c0c0c; border:1px solid #222;" title="Если замка нет в прайсе, добавить новый">
                                    <i class="fa-solid fa-plus" style="margin-right:8px; color:var(--brand-red);"></i> СОЗДАТЬ В ИНЖЕНЕРИИ
                                </button>
                            </div>
                        </div>
                        <div style="padding-left:20px; border-left:1px solid #111;">
                            ${s.lockId ? this.renderLockPreview(s.lockId) : '<div style="font-size:0.65rem; color:#333; text-transform:uppercase;">Выберите замок для просмотра характеристик</div>'}
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="panel glass-panel mb-3" style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); font-size:0.65rem; color:#888; line-height:1.4; margin-top:20px;">
                    <strong style="color:#fff; text-transform:uppercase; font-size:0.7rem; display:block; margin-bottom:5px;"><i class="fa-solid fa-circle-info" style="color:var(--brand-red); font-weight:900;"></i> Справка по заполнению Шага 5 (Соединение ремней):</strong>
                    * <b>Винтовая скрутка (стык)</b> — Соединение ремней внахлест. Соединительные пластины на стыке затягиваются винтами M6, а остальные — заклепками. (Требует указания шагов нахлеста)<br>
                    * <b>Вулканизация / Бесшовное</b> — Склеивание концов ремня. Не требует крепежных винтов или замков, поставляется в виде готового кольца.<br>
                    * <b>Механический замок</b> — Разъемный стальной замок. Упрощает установку на комбайн. (Требует выбора модели замка из прайс-листа)<br>
                    * <b>Увеличение длины ремня на стык (в шагах)</b> — Нахлест концов ремня при скрутке. По чертежу равен 6 шагам (удлиняет ремни на 6 × шаг прутка). (Обязательно при скрутке)<br>
                    * <b>Модель замка</b> — Конкретный механический замок из базы. (Обязательно при замковом стыке)
                </div>

                <div style="margin-top:20px; text-align:center; font-size:0.65rem; color:#444; text-transform:uppercase; font-weight:900; letter-spacing:1px;">
                    <i class="fa-solid fa-circle-info" style="margin-right:8px; color:var(--brand-red);"></i> Внимание: выбор типа соединения влияет на итоговую длину ремней и способ монтажа в цеху.
                </div>
            </div>
        `;
    },

    renderLockPreview(id) {
        const p = (window.dbProducts || []).find(x => x.id === id);
        if (!p) return '';
        return `
            <div style="display:flex; gap:20px; align-items:center;">
                <img src="${window.getSafeImagePath(p.photo || p.img)}" style="width:100px; height:60px; object-fit:contain; background:#fff; padding:5px; border-radius:8px;">
                <div>
                    <div style="font-size:0.85rem; font-weight:700; color:#fff;">${p.name}</div>
                    <div style="font-size:0.6rem; color:var(--brand-red); font-weight:900; margin-top:4px;">АРТИКУЛ: ${p.art}</div>
                    <div style="font-size:0.6rem; color:#555; margin-top:4px;">ПАРАМЕТРЫ: Шаг ${p.pitch || '—'} / Рядность: ${p.rows || '—'} / Исполнение: ${p.ver || '—'}</div>
                </div>
            </div>
        `;
    },

    setType(id) {
        window.CatalogState.connectionType = id;
        if (id === 'mechanical') {
            window.CatalogState.asmLocksCount = parseInt(window.CatalogState.asmBeltsCount) || (window.CatalogState.convType === '3x' ? 3 : (window.CatalogState.convType === '4x' ? 4 : 2));
            window.CatalogState.asmLockRodsCount = 1;
            window.CatalogState.connectionOverlapSteps = 0;
        } else if (id === 'screws') {
            window.CatalogState.asmLocksCount = 0;
            window.CatalogState.asmLockRodsCount = 0;
            window.CatalogState.connectionOverlapSteps = 6;
        } else {
            window.CatalogState.asmLocksCount = 0;
            window.CatalogState.asmLockRodsCount = 0;
            window.CatalogState.connectionOverlapSteps = 0;
        }
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },

    syncOverlap(val) {
        const parsed = parseInt(val);
        window.CatalogState.connectionOverlapSteps = isNaN(parsed) ? 0 : parsed;
        const displayVal = document.getElementById('overlap-display-val');
        if (displayVal) {
            const pitch = parseFloat(window.CatalogState.pitch) || 0;
            displayVal.innerText = `Текущее увеличение: ${window.CatalogState.connectionOverlapSteps} шагов * ${pitch} мм = ${window.CatalogState.connectionOverlapSteps * pitch} мм`;
        }
        window.CatalogManager.syncReport();
    },

    setLock(id) {
        window.CatalogState.lockId = id;
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },

    openQuickCreateLock() {
        const old = document.getElementById('quick-lock-modal');
        if (old) old.remove();

        const s = window.CatalogState;
        const targetPitch = parseFloat(s.pitch) || 40;
        
        const defaultArt = `lock_pitch${targetPitch}_NEW`;
        const defaultName = `Замок механический для шага ${targetPitch} мм`;
        const defaultCost = 1450;
        const defaultPrice = 3190;

        const modalHtml = `
        <div id="quick-lock-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:200000; display:flex; align-items:center; justify-content:center; font-family:'Inter', sans-serif;">
            <div style="background:rgba(15,15,25,0.96); border:2px solid var(--brand-red); width:500px; padding:35px; border-radius:20px; box-shadow:0 15px 50px rgba(0,0,0,0.8); color:#fff; position:relative; overflow:hidden;">
                <button onclick="document.getElementById('quick-lock-modal').remove()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#aaa; font-size:1.8rem; cursor:pointer; transition:0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#aaa'">&times;</button>
                
                <h3 style="margin:0 0 25px; color:#fff; font-size:1.2rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-plus-circle" style="color:var(--brand-red);"></i> Создание замка на склад
                </h3>

                <div style="display:flex; flex-direction:column; gap:15px; margin-bottom:25px;">
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Артикул замка</label>
                        <input type="text" id="ql-art" value="${defaultArt}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--brand-red); font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none; font-family:monospace;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Наименование замка</label>
                        <input type="text" id="ql-name" value="${defaultName}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Шаг (мм)</label>
                            <input type="number" id="ql-pitch" value="${targetPitch}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-weight:bold; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Бренд / Производитель</label>
                            <input type="text" id="ql-brand" value="Prutkon" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:#fff; font-size:0.9rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:15px; margin-top:5px;">
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Себестоимость (₽)</label>
                            <input type="number" id="ql-cost" value="${defaultCost}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--neon-emerald); font-weight:900; font-size:1.1rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px;">Цена продажи (₽)</label>
                            <input type="number" id="ql-price" value="${defaultPrice}" style="background:rgba(255,255,255,0.03); border:1px solid #222; color:var(--brand-gold); font-weight:900; font-size:1.1rem; padding:10px; border-radius:8px; width:100%; outline:none;">
                        </div>
                    </div>
                </div>

                <div id="ql-hint-block" style="background:rgba(226,31,38,0.03); padding:15px; border-radius:12px; border:1px solid rgba(226,31,38,0.15); font-size:0.7rem; color:#ccc; line-height:1.4; margin-bottom:20px;">
                    <i class="fa-solid fa-info-circle" style="color:var(--brand-red); margin-right:6px;"></i>
                    <b>Калькуляция замка:</b> Включает комплект крепежных заклепок/болтов и соединительный штырь. Наценка 120%.
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('quick-lock-modal').remove()" style="background:#111; border:1px solid #222; color:#fff; font-weight:900; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; padding:12px 20px; border-radius:10px; cursor:pointer; transition:0.3s;" onmouseover="this.style.background='#222'" onmouseout="this.style.background='#111'">Отмена</button>
                    <button onclick="window.CatalogStep5.saveQuickLock()" style="background:var(--brand-red); border:none; color:#fff; font-weight:900; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; padding:12px 25px; border-radius:10px; cursor:pointer; box-shadow:0 5px 15px rgba(226,31,38,0.3); transition:0.3s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Сохранить на склад</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    saveQuickLock() {
        const art = document.getElementById('ql-art').value.trim();
        const name = document.getElementById('ql-name').value.trim();
        const pitch = parseFloat(document.getElementById('ql-pitch').value) || 40;
        const brand = document.getElementById('ql-brand').value.trim();
        const cost = parseFloat(document.getElementById('ql-cost').value) || 0;
        const price = parseFloat(document.getElementById('ql-price').value) || 0;

        if (!art || !name) {
            alert('Заполните артикул и наименование замка!');
            return;
        }

        const newLock = {
            id: 'lock_' + Date.now(),
            art: art,
            article: art,
            name: name,
            category: 'locks',
            pitch: pitch,
            brand: brand,
            cost: cost,
            price: price,
            currency: 'RUB',
            date: new Date().toISOString().split('T')[0]
        };

        if (!window.dbProducts) window.dbProducts = [];
        window.dbProducts.push(newLock);
        localStorage.setItem('prutkon_products', JSON.stringify(window.dbProducts));

        // Привязываем новый замок
        window.CatalogState.lockId = newLock.id;

        const modal = document.getElementById('quick-lock-modal');
        if (modal) modal.remove();

        if (window.showToast) {
            window.showToast(`🚀 Замок "${art}" успешно сохранен на склад и выбран!`, 'success');
        }

        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    }
};
