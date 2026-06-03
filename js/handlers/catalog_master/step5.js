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
                                    <img src="${IMG}${t.img}" 
                                         onerror="if(this.src.endsWith('.jpg')) this.src = this.src.replace('.jpg', '.png');"
                                         style="width:100%; height:80px; object-fit:contain; filter:${active ? 'none' : 'grayscale(1)'}; transition:0.3s;">
                                </div>
                                <div style="width:20px; height:20px; border-radius:50%; border:2px solid ${active ? 'var(--brand-red)' : '#222'}; margin:0 auto; display:flex; align-items:center; justify-content:center;">
                                    ${active ? '<div style="width:10px; height:10px; background:var(--brand-red); border-radius:50%;"></div>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

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
                        </div>
                        <div style="padding-left:20px; border-left:1px solid #111;">
                            ${s.lockId ? this.renderLockPreview(s.lockId) : '<div style="font-size:0.65rem; color:#333; text-transform:uppercase;">Выберите замок для просмотра характеристик</div>'}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- ФИНАЛЬНАЯ ПАНЕЛЬ ДЕЙСТВИЙ (КАК НА СКРИНЕ) -->
                <div class="panel glass-panel" style="margin-top:40px; padding:30px; border:2px solid #181818; background:rgba(0,0,0,0.8); border-radius:30px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
                    <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:30px;">
                        
                        <!-- ГРУППА 1: ДОБАВЛЕНИЕ -->
                        <div style="display:flex; align-items:center; gap:15px;">
                            <button onclick="window.CatalogManager.finishAction('new')" 
                                    style="background:#2d5a27; color:#ff3b30; border:none; padding:15px 25px; border-radius:8px; font-weight:900; font-size:0.85rem; text-transform:uppercase; cursor:pointer; line-height:1.2;">
                                добавить новый<br>конвейер
                            </button>
                            <div style="font-size:0.7rem; color:#fff; font-weight:700; line-height:1.2; text-transform:uppercase;">
                                добавить или обновить -<br><span style="color:#ff3b30;">не отправить заказ!!!</span>
                            </div>
                        </div>

                        <!-- ГРУППА 2: КОММЕРЦИЯ -->
                        <div onclick="window.CatalogManager.finishAction('kp')" style="cursor:pointer; color:#fff; font-size:0.75rem; text-transform:uppercase; font-weight:800; border-bottom:1px solid #444; padding-bottom:5px;">
                            сформировать КП
                        </div>

                        <!-- ГРУППА 3: ПРОВЕРКА ПО -->
                        <div onclick="window.CatalogManager.finishAction('review')" style="cursor:pointer; font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:900; line-height:1.4; transition:0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">
                            Сохранить с проверкой<br>
                            <span style="color:#fff;">(Алексей/Кокарев)</span><br>
                            с изменений
                        </div>

                        <!-- ГРУППА 4: КОНСТРУКТОР -->
                        <div onclick="window.CatalogManager.finishAction('blueprint')" style="cursor:pointer; border:1px solid #007aff; padding:15px; border-radius:4px; max-width:200px; transition:0.3s;" onmouseover="this.style.background='rgba(0,122,255,0.1)'" onmouseout="this.style.background='transparent'">
                            <div style="font-size:0.6rem; color:#fff; text-transform:uppercase; font-weight:900; line-height:1.4;">
                                Сформировать чертеж / нет<br>
                                чертежа - Данил<br>
                                конструктор
                            </div>
                        </div>

                    </div>
                </div>

                <div style="margin-top:30px; text-align:center; font-size:0.6rem; color:#333; text-transform:uppercase; font-weight:900; letter-spacing:1px;">
                    <i class="fa-solid fa-circle-info" style="margin-right:8px;"></i> Внимание: выбор типа соединения влияет на итоговую длину ремней и способ монтажа в цеху.
                </div>
            </div>
        `;
    },

    renderLockPreview(id) {
        const p = (window.dbProducts || []).find(x => x.id === id);
        if (!p) return '';
        return `
            <div style="display:flex; gap:20px; align-items:center;">
                <img src="${p.photo || 'no_photo.png'}" style="width:100px; height:60px; object-fit:contain; background:#fff; padding:5px; border-radius:8px;">
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
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },

    setLock(id) {
        window.CatalogState.lockId = id;
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    }
};
