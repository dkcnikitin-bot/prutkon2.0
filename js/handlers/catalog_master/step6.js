/* catalog_master/step6.js - ПРУТКОН ERP Шаг 6: Сборка транспортера и Смета */

window.CatalogStep6 = {
    render() {
        const s = window.CatalogState;
        
        // Автоматически синхронизируем/предустанавливаем базовые параметры
        if (s.asmRodsCount === undefined || s.asmRodsCount === '') {
            s.asmRodsCount = s.rodsCount || '0';
        }
        if (s.asmBeltsCount === undefined || s.asmBeltsCount === '') {
            s.asmBeltsCount = s.convType === '2x' ? '2' : (s.convType === '4x' ? '4' : '3');
        }
        if (s.asmLocksCount === undefined || s.asmLocksCount === '') {
            const beltsCount = s.convType === '2x' ? '2' : (s.convType === '4x' ? '4' : '3');
            s.asmLocksCount = (s.connectionType === 'mechanical' || s.connectionType === 'screws') ? beltsCount : '0';
        }
        if (s.asmLockRodsCount === undefined || s.asmLockRodsCount === '') {
            s.asmLockRodsCount = (parseInt(s.asmLocksCount) > 0) ? '1' : '0';
        }
        if (s.asmBeltLaborId === undefined) s.asmBeltLaborId = '';
        if (s.asmAssemblyLaborId === undefined) s.asmAssemblyLaborId = '';

        // Загрузка услуг
        let laborItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'labor') : [];
        if (laborItems.length === 0) {
            laborItems = [
                { id: 'labor_belt_1', name: 'Подготовка стандартного ремня (2-3 корда)', price: 3150, type: 'prep' },
                { id: 'labor_belt_2', name: 'Подготовка усиленного ремня (4 корда)', price: 4200, type: 'prep' },
                { id: 'labor_belt_3', name: 'Специфическая подготовка ремня (обточка)', price: 5500, type: 'prep' },
                { id: 'labor_ass_1', name: 'Сборка стандартного 2-рядного транспортера', price: 18500, type: 'ass' },
                { id: 'labor_ass_2', name: 'Сборка стандартного 3-рядного транспортера', price: 24500, type: 'ass' },
                { id: 'labor_ass_3', name: 'Сборка усиленного 4-рядного транспортера', price: 32000, type: 'ass' },
                { id: 'labor_ass_4', name: 'Сложная сборка транспортера (цепи, лопатки)', price: 45000, type: 'ass' }
            ];
        }

        let prepOpts = '<option value="">-- Выбрать подготовку --</option>';
        let assOpts = '<option value="">-- Выбрать сборку --</option>';

        laborItems.forEach(i => {
            const nameLower = (i.name || '').toLowerCase();
            const isPrep = i.type === 'prep' || nameLower.includes('подготов') || nameLower.includes('ремен');
            const isAss = i.type === 'ass' || nameLower.includes('сборк') || nameLower.includes('транспорт');

            const optionHtml = `<option value="${i.id}" data-price="${i.price || 0}" data-name="${i.name || ''}" ${s.asmBeltLaborId === i.id || s.asmAssemblyLaborId === i.id ? 'selected' : ''}>${i.name || 'Без названия'} (${parseFloat(i.price || 0).toLocaleString('ru-RU')} ₽)</option>`;
            
            if (isPrep) prepOpts += optionHtml;
            if (isAss) assOpts += optionHtml;
        });

        // Запуск рекалка через setTimeout, чтобы DOM успел отрендериться
        setTimeout(() => {
            this.recalc();
            this.updateTheoreticalStatus();
        }, 100);

        const showOverlap = (s.connectionType === 'screws' || s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot');
        const showLocks = (s.connectionType === 'mechanical' || s.connectionType === 'screws');
        const overlapStepsVal = s.connectionOverlapSteps !== undefined ? s.connectionOverlapSteps : 6;
        const locksCountVal = s.asmLocksCount !== undefined ? s.asmLocksCount : (s.connectionType === 'mechanical' || s.connectionType === 'screws' ? 1 : 0);
        const lockRodsCountVal = s.asmLockRodsCount !== undefined ? s.asmLockRodsCount : 0;

        const l = parseFloat(s.length) || 0;
        const p = parseFloat(s.pitch) || 0;
        const hasOverlap = showOverlap;
        
        let theoreticalRods = 0;
        if (l > 0 && p > 0) {
            theoreticalRods = Math.floor(l / p);
            if (hasOverlap) {
                theoreticalRods += parseInt(overlapStepsVal) || 6;
            }
        }
        const hasInput = (s.length && s.pitch);
        const hasWarning = Math.abs(parseInt(s.asmRodsCount || s.rodsCount || 0) - theoreticalRods) > 1;

        return `
            <div class="step-panel animate-fade-in" style="max-width:1100px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #111; padding-bottom:15px;">
                    <h4 style="font-size:0.75rem; color:#fff; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin:0;">
                        <i class="fa-solid fa-calculator" style="color:var(--brand-red); margin-right:8px;"></i> ШАГ 6: СБОРКА ТРАНСПОРТЕРА И РАСЧЕТ СМЕТЫ
                    </h4>
                    <button class="btn btn-secondary btn-sm" onclick="window.CatalogStep6.print()" style="font-size:0.7rem; font-weight:900; border-radius:8px; padding:6px 15px;">
                        <i class="fa-solid fa-print"></i> ПЕЧАТЬ ФОРМЫ
                    </button>
                </div>

                <div class="panel glass-panel" style="padding:25px; background:rgba(0,0,0,0.6); border:1px solid #111; margin-bottom:25px;">
                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:25px;">
                        <!-- Ввод данных -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                            <div class="form-group">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">КОЛИЧЕСТВО ПРУТКОВ (ШТ)</label>
                                <input type="number" id="m6-rods-count" class="form-control" value="${s.asmRodsCount}" oninput="window.CatalogStep6.syncField('asmRodsCount', this.value)" style="background:#050505; color:#fff; font-weight:900; font-size:1.1rem; border-color:#222;">
                            </div>
                            <div class="form-group">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">КОЛИЧЕСТВО РЕМНЕЙ (ШТ)</label>
                                <input type="number" id="m6-belts-count" class="form-control" value="${s.asmBeltsCount}" oninput="window.CatalogStep6.syncField('asmBeltsCount', this.value)" style="background:#050505; color:#fff; font-weight:900; font-size:1.1rem; border-color:#222;">
                            </div>
                            <div class="form-group">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">ТИП СТЫКА РЕМНЯ</label>
                                <select id="m6-connection-type" class="form-control" onchange="window.CatalogStep6.syncField('connectionType', this.value)" style="background:#050505; color:#fff; font-weight:700; border-color:#222; height:45px;">
                                    <option value="vulcanization" ${s.connectionType==='vulcanization'||s.connectionType==='vulcanization_cold'||s.connectionType==='vulcanization_hot'?'selected':''}>Вулканизация / Бесшовное</option>
                                    <option value="screws" ${s.connectionType==='screws'?'selected':''}>Винтовая скрутка (стык)</option>
                                    <option value="mechanical" ${s.connectionType==='mechanical'?'selected':''}>Механический замок</option>
                                </select>
                            </div>
                            <div class="form-group" style="opacity: ${showOverlap ? '1' : '0.25'}; pointer-events: ${showOverlap ? 'auto' : 'none'}; transition: 0.3s;">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">ШАГИ НАХЛЕСТА СТЫКА (ШТ)</label>
                                <input type="number" id="m6-overlap-steps" class="form-control" value="${overlapStepsVal}" oninput="window.CatalogStep6.syncField('connectionOverlapSteps', this.value)" style="background:#050505; color:#fff; font-weight:900; font-size:1.1rem; border-color:#222;" ${!showOverlap ? 'disabled' : ''}>
                            </div>
                            <div class="form-group" style="opacity: ${showLocks ? '1' : '0.25'}; pointer-events: ${showLocks ? 'auto' : 'none'}; transition: 0.3s;">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">КОЛИЧЕСТВО ЗАМКОВ (РЯДОВ)</label>
                                <input type="number" id="m6-locks-count" class="form-control" value="${locksCountVal}" oninput="window.CatalogStep6.syncField('asmLocksCount', this.value)" style="background:#050505; color:#fff; font-weight:900; font-size:1.1rem; border-color:#222;" ${!showLocks ? 'disabled' : ''}>
                            </div>
                            <div class="form-group" style="opacity: ${showLocks ? '1' : '0.25'}; pointer-events: ${showLocks ? 'auto' : 'none'}; transition: 0.3s;">
                                <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">КОЛ-ВО ПРУТКОВ НА ЗАМОК (ШТ)</label>
                                <input type="number" id="m6-lock-rods" class="form-control" value="${lockRodsCountVal}" oninput="window.CatalogStep6.syncField('asmLockRodsCount', this.value)" style="background:#050505; color:#fff; font-weight:900; font-size:1.1rem; border-color:#222;" ${!showLocks ? 'disabled' : ''}>
                            </div>
                        </div>

                        <!-- Индикатор теоретического расчета -->
                        <div id="step6-indicator-box" style="background:#000; padding:25px; border-left:10px solid ${!hasInput?'#222':(hasWarning?'var(--brand-red)':'#198754')}; border-radius:15px; text-align:center; box-shadow: inset 0 0 40px rgba(0,0,0,0.8); display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%;">
                            <div class="text-xs neutral mb-1" style="letter-spacing:1px; font-weight:900; text-transform:uppercase; color:#888; font-size:0.6rem;">ТЕОРЕТИЧЕСКИЙ РАСЧЕТ:</div>
                            <div id="step6-theoretical-rods" style="font-size:3.5rem; font-weight:900; line-height:1; font-family:'Roboto Mono'; text-shadow:0 0 20px rgba(255,255,255,0.1); color:#fff; margin:10px 0;">${theoreticalRods}</div>
                            <div id="step6-calc-status" style="font-size:0.65rem; color:${!hasInput?'#444':(hasWarning?'var(--brand-red)':'#198754')}; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${!hasInput?'Ожидание данных':(hasWarning?'ОШИБКА РАСЧЕТА!':'РАСЧЕТ ВЕРЕН')}</div>
                            <div style="font-size:0.55rem; color:#888; margin-top:10px; line-height:1.3; text-transform:uppercase; text-align:center;" id="step6-overlap-tip">
                                ${hasOverlap ? `С учетом нахлеста соединений (${overlapStepsVal} шагов)` : 'Без нахлеста соединений (разъемный стык)'}
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; border-top:1px solid #111; padding-top:20px;">
                        <div class="form-group">
                            <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">ПОДГОТОВКА РЕМНЕЙ (УСЛУГА)</label>
                            <select id="m6-belt-labor" class="form-control" onchange="window.CatalogStep6.syncSelect('asmBeltLaborId', this.value)" style="background:#050505; color:#fff; font-weight:700; border-color:#222;">
                                ${prepOpts}
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="color:#888; font-size:0.65rem; text-transform:uppercase; font-weight:900;">СБОРКА (УСЛУГА)</label>
                            <select id="m6-assembly-labor" class="form-control" onchange="window.CatalogStep6.syncSelect('asmAssemblyLaborId', this.value)" style="background:#050505; color:#fff; font-weight:700; border-color:#222;">
                                ${assOpts}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="panel glass-panel mb-3" style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); font-size:0.65rem; color:#888; line-height:1.4; margin-bottom: 25px;">
                    <strong style="color:#fff; text-transform:uppercase; font-size:0.7rem; display:block; margin-bottom:5px;"><i class="fa-solid fa-circle-info" style="color:var(--brand-red);"></i> Справка по заполнению Шага 6 (Расчет сметы сборки):</strong>
                    * <b>Количество прутков / ремней</b> — Автозаполняются из геометрии. Вы можете изменить их вручную для нестандартных сборок.<br>
                    * <b>Подготовка ремней / Сборка (услуги)</b> — Выберите из выпадающего справочника соответствующие услуги по обрезке лент и слесарной сборке. (Обязательно)<br>
                    * <b>Итоговая смета</b> — Рассчитывает поштучно пластины (стык и стандарт), крепеж (винты/клепки) и услуги. (Пересчет автоматический)
                </div>

                <!-- ТАБЛИЦА РАСЧЕТА СБОРКИ -->
                <div class="panel glass-panel" style="padding:25px; border:1px solid #111; background:rgba(0,0,0,0.4); margin-bottom:25px;">
                    <div style="font-weight:900; color:#fff; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; border-bottom:1px solid #222; padding-bottom:10px;">
                        СМЕТНЫЙ РАСЧЕТ СБОРКИ И МАТЕРИАЛОВ
                    </div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="color:#555; text-transform:uppercase; font-size:0.55rem; border-bottom:1px solid #111; letter-spacing:1px;">
                                <th style="padding:10px; text-align:left;">КОМПОНЕНТ / УСЛУГА</th>
                                <th style="padding:10px; text-align:center; width:100px;">КОЛ-ВО</th>
                                <th style="padding:10px; text-align:right; width:150px;">ЦЕНА С НДС</th>
                                <th style="padding:10px; text-align:right; width:150px;">СУММА С НДС</th>
                            </tr>
                        </thead>
                        <tbody id="m6-tbody">
                            <!-- Заполняется динамически через recalc() -->
                        </tbody>
                        <tfoot>
                            <tr style="border-top:1px solid #222;">
                                <td colspan="3" style="padding:15px 10px 0; font-weight:900; color:#555; font-size:0.65rem; text-transform:uppercase;">ИТОГО СБОРКА И МАТЕРИАЛЫ:</td>
                                <td id="m6-assembly-total" style="padding:15px 10px 0; text-align:right; font-weight:900; color:var(--brand-red); font-size:1.1rem; font-family:'Roboto Mono';">0.00 ₽</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding:5px 10px 0; font-weight:900; color:#fff; font-size:0.7rem; text-transform:uppercase;">ОБЩАЯ СМЕТА КОНВЕЙЕРА (С УЧЕТОМ ШАГА 4 И ЗАМКОВ):</td>
                                <td id="m6-conveyor-total" style="padding:5px 10px 0; text-align:right; font-weight:900; color:#fff; font-size:1.3rem; font-family:'Roboto Mono';">0.00 ₽</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- ФИНАЛЬНАЯ ПАНЕЛЬ ДЕЙСТВИЙ (ПЕРЕНЕСЕНА С ШАГА 5) -->
                <div class="panel glass-panel" style="padding:30px; border:2px solid #181818; background:rgba(0,0,0,0.8); border-radius:30px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
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

                        <!-- GРУППА 4: КОНСТРУКТОР -->
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
                    <i class="fa-solid fa-circle-info" style="margin-right:8px;"></i> Расчет включает металл, ленты, комплектующие, механические замки и трудозатраты по сборке конвейерной ленты.
                </div>
            </div>
        `;
    },

    syncField(key, val) {
        window.CatalogState[key] = val;
        if (key === 'connectionType') {
            if (val === 'mechanical') {
                window.CatalogState.asmLocksCount = parseInt(window.CatalogState.asmBeltsCount) || 3;
                window.CatalogState.asmLockRodsCount = 1;
                window.CatalogState.connectionOverlapSteps = 0;
            } else if (val === 'screws') {
                window.CatalogState.asmLocksCount = 0;
                window.CatalogState.asmLockRodsCount = 0;
                window.CatalogState.connectionOverlapSteps = 6;
            } else {
                window.CatalogState.asmLocksCount = 0;
                window.CatalogState.asmLockRodsCount = 0;
                window.CatalogState.connectionOverlapSteps = 6;
            }
            window.CatalogManager.refreshStep();
        } else {
            this.recalc();
            this.updateTheoreticalStatus();
        }
    },

    syncSelect(key, val) {
        window.CatalogState[key] = val;
        this.recalc();
    },

    recalc() {
        const s = window.CatalogState;
        
        const rodsCount = parseInt(s.asmRodsCount) || 0;
        const beltsCount = parseInt(s.asmBeltsCount) || 0;
        const locksCount = parseInt(s.asmLocksCount) || (s.connectionType === 'mechanical' ? (s.convType === '3x' ? 3 : (s.convType === '4x' ? 4 : 2)) : 0);
        const lockRodsCount = parseInt(s.asmLockRodsCount) || 0;

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

        // Сбор цен на услуги
        const beltLaborEl = document.getElementById('m6-belt-labor');
        const assLaborEl = document.getElementById('m6-assembly-labor');
        
        const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
        const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
        
        const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
        const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

        // Расчет количеств по спецификации чертежа
        const overlapSteps = parseInt(s.connectionOverlapSteps) || 6;
        const locksVal = (s.connectionType === 'mechanical' || s.connectionType === 'screws') ? 1 : 0;
        const f = window.calculateConveyorFasteners(rodsCount, s.convType, s.connectionType, overlapSteps, locksVal);
        const screwItem = findProduct('Винт', 'hardware_small') || findProduct('Винт') || { name: 'Винты крепежные M6', price: 15.00 };

        // Расчет метража тягового ремня
        const hasOverlap = (s.connectionType === 'screws' || s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot');
        const singleBeltLenM = ((parseFloat(s.length) || 0) + (hasOverlap ? (overlapSteps * (parseFloat(s.pitch) || 0)) : 0)) / 1000;

        const beltRows = [];
        // Боковые ремни (всегда 2 шт)
        const sideBeltQty = parseFloat((singleBeltLenM * 2).toFixed(3));
        if (sideBeltQty > 0) {
            const sideBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.sideBeltType) || { name: 'DNG+' };
            const sideBeltProduct = findProduct(sideBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.sideBeltWidth || '60'}/${s.sideBeltThickness || '17'}`, price: 1850.00 };
            
            let sideBeltPrice = parseFloat(sideBeltProduct.price) || 0;
            if (sideBeltPrice > 100000) {
                sideBeltPrice = sideBeltPrice / 1000;
            }
            const sideParentWidth = parseFloat(sideBeltProduct.width) || 1200;
            const sideActualWidth = parseFloat(s.sideBeltWidth) || 60;
            if (sideParentWidth > 0) {
                sideBeltPrice = sideBeltPrice * (sideActualWidth / sideParentWidth);
            }
            
            beltRows.push({
                name: `Ремень боковой: ${sideBeltTypeObj.name} (${s.sideBeltWidth || '60'}x${s.sideBeltThickness || '17'} мм)`,
                qty: Math.round(sideBeltQty * 1000),
                price: parseFloat((sideBeltPrice / 1000).toFixed(5)),
                unit: 'мм'
            });
        }

        // Центральные ремни
        const centralBeltsCount = (s.convType === '3x' ? 1 : (s.convType === '4x' ? 2 : 0));
        const centralBeltQty = parseFloat((singleBeltLenM * centralBeltsCount).toFixed(3));
        if (centralBeltsCount > 0 && s.centralBeltType) {
            const centralBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.centralBeltType) || { name: 'DNG+' };
            const centralBeltProduct = findProduct(centralBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.centralBeltWidth || '60'}/${s.centralBeltThickness || '17'}`, price: 1850.00 };
            
            let centralBeltPrice = parseFloat(centralBeltProduct.price) || 0;
            if (centralBeltPrice > 100000) {
                centralBeltPrice = centralBeltPrice / 1000;
            }
            const centralParentWidth = parseFloat(centralBeltProduct.width) || 1200;
            const centralActualWidth = parseFloat(s.centralBeltWidth) || 60;
            if (centralParentWidth > 0) {
                centralBeltPrice = centralBeltPrice * (centralActualWidth / centralParentWidth);
            }
            
            beltRows.push({
                name: `Ремень центральный: ${centralBeltTypeObj.name} (${s.centralBeltWidth || '60'}x${s.centralBeltThickness || '17'} мм)`,
                qty: Math.round(centralBeltQty * 1000),
                price: parseFloat((centralBeltPrice / 1000).toFixed(5)),
                unit: 'мм'
            });
        }
        
        const addonRows = [];
        if (s.additionalItems && s.additionalItems.length) {
            s.additionalItems.forEach(it => {
                const qty = parseFloat(it.total) || 0;
                const price = parseFloat(it.price) || 0;
                if (qty > 0) {
                    const def = window.CatalogDicts.additionalComponentsDef.find(x => x.id === it.id);
                    const displayName = def ? def.name : (it.name || 'Элемент');
                    addonRows.push({
                        name: `${displayName} ${it.art ? `(${it.art})` : ''}`,
                        qty: qty,
                        price: price,
                        unit: 'шт'
                    });
                }
            });
        }

        const lockRows = [];
        if (s.lockId) {
            const lp = (window.dbProducts || []).find(x => x.id === s.lockId);
            if (lp) {
                lockRows.push({
                    name: `Замок соединительный: ${lp.name} ${lp.art ? `(${lp.art})` : ''}`,
                    qty: locksCount,
                    price: parseFloat(lp.price) || 0,
                    unit: 'компл'
                });
            }
        }

        const fastenerRows = [
            ...(f.standardPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стандарт)`, qty: f.standardPlatesSide, price: stdPlate.price, unit: 'шт' }] : []),
            ...(f.standardPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стандарт)`, qty: f.standardPlatesCentral, price: stdPlate.price, unit: 'шт' }] : []),
            ...(f.overlapPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стык)`, qty: f.overlapPlatesSide, price: stdPlate.price, unit: 'шт' }] : []),
            ...(f.overlapPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стык)`, qty: f.overlapPlatesCentral, price: stdPlate.price, unit: 'шт' }] : []),
            ...(f.lockPlatesSide > 0 ? [{ name: `${lockPlate.name} (боковая, замок)`, qty: f.lockPlatesSide, price: lockPlate.price, unit: 'шт' }] : []),
            ...(f.lockPlatesCentral > 0 ? [{ name: `${lockPlate.name} цр (замок)`, qty: f.lockPlatesCentral, price: lockPlate.price, unit: 'шт' }] : []),
            ...(f.screws > 0 ? [{ name: screwItem.name, qty: f.screws, price: screwItem.price, unit: 'шт' }] : []),
            ...(f.rivets > 0 ? [{ name: rivet.name, qty: f.rivets, price: rivet.price, unit: 'шт' }] : []),
            ...(lockRodsCount > 0 ? [{ name: lockRod.name, qty: lockRodsCount, price: lockRod.price, unit: 'шт' }] : [])
        ];

        const serviceRows = [
            { name: beltLaborName, qty: beltsCount, price: beltLaborPrice, unit: 'усл' },
            { name: assLaborName, qty: 1, price: assLaborPrice, unit: 'усл' }
        ];

        const rows = [
            ...beltRows,
            ...addonRows,
            ...lockRows,
            ...fastenerRows,
            ...serviceRows
        ];

        let assemblySum = 0;
        let tbodyHtml = '';

        rows.forEach((r, idx) => {
            let sum = r.qty * r.price;
            let finalPrice = r.price;
            if (s.priceOverrides && s.priceOverrides[r.name] !== undefined) {
                sum = parseFloat(s.priceOverrides[r.name]) || 0;
                finalPrice = r.qty > 0 ? sum / r.qty : 0;
            }
            assemblySum += sum;
            tbodyHtml += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.02); background:${idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'};">
                    <td style="padding:10px; color:#fff; font-size:0.8rem; font-weight:700;">${r.name}</td>
                    <td style="padding:10px; text-align:center; color:#ffb400; font-weight:900;">${r.qty} ${r.unit || 'шт'}</td>
                    <td style="padding:10px; text-align:right; color:#888;">${parseFloat(finalPrice).toLocaleString('ru-RU')} ₽</td>
                    <td style="padding:10px; text-align:right; color:#fff; font-weight:900;">${sum.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `;
        });

        const tbody = document.getElementById('m6-tbody');
        if (tbody) tbody.innerHTML = tbodyHtml;

        const assTotalEl = document.getElementById('m6-assembly-total');
        if (assTotalEl) assTotalEl.innerText = assemblySum.toLocaleString('ru-RU') + ' ₽';

        // РАСЧЕТ И СИНХРОНИЗАЦИЯ ОБЩЕЙ СУММЫ КОНВЕЙЕРА (СМЕТЫ)
        const conveyorTotal = assemblySum;
        s.calcTotalSum = conveyorTotal;

        const convTotalEl = document.getElementById('m6-conveyor-total');
        if (convTotalEl) convTotalEl.innerText = conveyorTotal.toLocaleString('ru-RU') + ' ₽';

        // Синхронизируем печатную спецификацию на лету
        window.CatalogManager.syncReport();
    },

    print() {
        const s = window.CatalogState;
        const rodsCount = parseInt(s.asmRodsCount) || 0;
        const beltsCount = parseInt(s.asmBeltsCount) || 0;
        const locksCount = parseInt(s.asmLocksCount) || (s.connectionType === 'mechanical' ? (s.convType === '3x' ? 3 : (s.convType === '4x' ? 4 : 2)) : 0);
        const lockRodsCount = parseInt(s.asmLockRodsCount) || 0;

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

        const beltLaborEl = document.getElementById('m6-belt-labor');
        const assLaborEl = document.getElementById('m6-assembly-labor');
        
        const beltLaborPrice = beltLaborEl && beltLaborEl.selectedIndex > 0 ? parseFloat(beltLaborEl.options[beltLaborEl.selectedIndex].dataset.price) : 3150;
        const beltLaborName = beltLaborEl && beltLaborEl.selectedIndex > 0 ? beltLaborEl.options[beltLaborEl.selectedIndex].dataset.name : 'Подготовка ремней к соединению';
        
        const assLaborPrice = assLaborEl && assLaborEl.selectedIndex > 0 ? parseFloat(assLaborEl.options[assLaborEl.selectedIndex].dataset.price) : 24500;
        const assLaborName = assLaborEl && assLaborEl.selectedIndex > 0 ? assLaborEl.options[assLaborEl.selectedIndex].dataset.name : 'Сборка транспортера (услуга)';

        const overlapSteps = parseInt(s.connectionOverlapSteps) || 6;
        const locksVal = (s.connectionType === 'mechanical' || s.connectionType === 'screws') ? 1 : 0;
        const f = window.calculateConveyorFasteners(rodsCount, s.convType, s.connectionType, overlapSteps, locksVal);
        const screwItem = findProduct('Винт', 'hardware_small') || findProduct('Винт') || { name: 'Винты крепежные M6', price: 15.00 };

        // Расчет метража тягового ремня
        const hasOverlap = (s.connectionType === 'screws' || s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot');
        const singleBeltLenM = ((parseFloat(s.length) || 0) + (hasOverlap ? (overlapSteps * (parseFloat(s.pitch) || 0)) : 0)) / 1000;

        const beltRows = [];
        // Боковые ремни (всегда 2 шт)
        const sideBeltQty = parseFloat((singleBeltLenM * 2).toFixed(3));
        if (sideBeltQty > 0) {
            const sideBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.sideBeltType) || { name: 'DNG+' };
            const sideBeltProduct = findProduct(sideBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.sideBeltWidth || '60'}/${s.sideBeltThickness || '17'}`, price: 1850.00 };
            
            let sideBeltPrice = parseFloat(sideBeltProduct.price) || 0;
            if (sideBeltPrice > 100000) {
                sideBeltPrice = sideBeltPrice / 1000;
            }
            const sideParentWidth = parseFloat(sideBeltProduct.width) || 1200;
            const sideActualWidth = parseFloat(s.sideBeltWidth) || 60;
            if (sideParentWidth > 0) {
                sideBeltPrice = sideBeltPrice * (sideActualWidth / sideParentWidth);
            }
            
            beltRows.push({
                name: `Ремень боковой: ${sideBeltTypeObj.name} (${s.sideBeltWidth || '60'}x${s.sideBeltThickness || '17'} мм)`,
                qty: Math.round(sideBeltQty * 1000),
                price: parseFloat((sideBeltPrice / 1000).toFixed(5)),
                unit: 'мм',
                art: sideBeltProduct.art || 'belt_side'
            });
        }

        // Центральные ремни
        const centralBeltsCount = (s.convType === '3x' ? 1 : (s.convType === '4x' ? 2 : 0));
        const centralBeltQty = parseFloat((singleBeltLenM * centralBeltsCount).toFixed(3));
        if (centralBeltsCount > 0 && s.centralBeltType) {
            const centralBeltTypeObj = window.CatalogDicts.beltTypes.find(x => x.id === s.centralBeltType) || { name: 'DNG+' };
            const centralBeltProduct = findProduct(centralBeltTypeObj.name, 'belts') || findProduct('Ремень тяговой', 'belts') || findProduct('Ремень тяговый', 'belts') || findProduct('Лента', 'belts') || { name: `Ремень тяговый DS ${s.centralBeltWidth || '60'}/${s.centralBeltThickness || '17'}`, price: 1850.00 };
            
            let centralBeltPrice = parseFloat(centralBeltProduct.price) || 0;
            if (centralBeltPrice > 100000) {
                centralBeltPrice = centralBeltPrice / 1000;
            }
            const centralParentWidth = parseFloat(centralBeltProduct.width) || 1200;
            const centralActualWidth = parseFloat(s.centralBeltWidth) || 60;
            if (centralParentWidth > 0) {
                centralBeltPrice = centralBeltPrice * (centralActualWidth / centralParentWidth);
            }
            
            beltRows.push({
                name: `Ремень центральный: ${centralBeltTypeObj.name} (${s.centralBeltWidth || '60'}x${s.centralBeltThickness || '17'} мм)`,
                qty: Math.round(centralBeltQty * 1000),
                price: parseFloat((centralBeltPrice / 1000).toFixed(5)),
                unit: 'мм',
                art: centralBeltProduct.art || 'belt_center'
            });
        }
        
        const totalBeltQty = parseFloat((sideBeltQty + centralBeltQty).toFixed(3));
        
        const addonRows = [];
        if (s.additionalItems && s.additionalItems.length) {
            s.additionalItems.forEach(it => {
                const qty = parseFloat(it.total) || 0;
                const price = parseFloat(it.price) || 0;
                if (qty > 0) {
                    const def = window.CatalogDicts.additionalComponentsDef.find(x => x.id === it.id);
                    const displayName = def ? def.name : (it.name || 'Элемент');
                    addonRows.push({
                        name: displayName,
                        qty: qty,
                        price: price,
                        unit: 'шт',
                        art: it.art || ''
                    });
                }
            });
        }

        const lockRows = [];
        if (s.lockId) {
            const lp = (window.dbProducts || []).find(x => x.id === s.lockId);
            if (lp) {
                lockRows.push({
                    name: `Замок соединительный: ${lp.name}`,
                    qty: locksCount,
                    price: parseFloat(lp.price) || 0,
                    unit: 'компл',
                    art: lp.art || ''
                });
            }
        }

        const fastenerRows = [
            ...(f.standardPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стандарт)`, qty: f.standardPlatesSide, price: stdPlate.price, unit: 'шт', art: stdPlate.art || 'plate_side' }] : []),
            ...(f.standardPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стандарт)`, qty: f.standardPlatesCentral, price: stdPlate.price, unit: 'шт', art: stdPlate.art || 'plate_center' }] : []),
            ...(f.overlapPlatesSide > 0 ? [{ name: `${stdPlate.name} (боковая, стык)`, qty: f.overlapPlatesSide, price: stdPlate.price, unit: 'шт', art: stdPlate.art || 'plate_overlap_side' }] : []),
            ...(f.overlapPlatesCentral > 0 ? [{ name: `${stdPlate.name} цр (стык)`, qty: f.overlapPlatesCentral, price: stdPlate.price, unit: 'шт', art: stdPlate.art || 'plate_overlap_center' }] : []),
            ...(f.lockPlatesSide > 0 ? [{ name: `${lockPlate.name} (боковая, замок)`, qty: f.lockPlatesSide, price: lockPlate.price, unit: 'шт', art: lockPlate.art || 'plate_lock_side' }] : []),
            ...(f.lockPlatesCentral > 0 ? [{ name: `${lockPlate.name} цр (замок)`, qty: f.lockPlatesCentral, price: lockPlate.price, unit: 'шт', art: lockPlate.art || 'plate_lock_center' }] : []),
            ...(f.screws > 0 ? [{ name: screwItem.name, qty: f.screws, price: screwItem.price, unit: 'шт', art: screwItem.art || 'screw' }] : []),
            ...(f.rivets > 0 ? [{ name: rivet.name, qty: f.rivets, price: rivet.price, unit: 'шт', art: rivet.art || 'rivet' }] : []),
            ...(lockRodsCount > 0 ? [{ name: lockRod.name, qty: lockRodsCount, price: lockRod.price, unit: 'шт', art: lockRod.art || 'rod_lock' }] : [])
        ];

        const serviceRows = [
            { name: beltLaborName, qty: beltsCount, price: beltLaborPrice, unit: 'усл', art: 'labor_belt' },
            { name: assLaborName, qty: 1, price: assLaborPrice, unit: 'усл', art: 'labor_assembly' }
        ];

        const rows = [
            ...beltRows,
            ...addonRows,
            ...lockRows,
            ...fastenerRows,
            ...serviceRows
        ];

        let totalCost = 0;
        let tbodyRows = '';
        rows.forEach((r, idx) => {
            let sum = r.qty * r.price;
            let finalPrice = r.price;
            if (s.priceOverrides && s.priceOverrides[r.name] !== undefined) {
                sum = parseFloat(s.priceOverrides[r.name]) || 0;
                finalPrice = r.qty > 0 ? sum / r.qty : 0;
            }
            totalCost += sum;
            tbodyRows += `
                <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
                    <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:500;">${idx + 1}</td>
                    <td style="font-family:'JetBrains Mono'; color:#64748b; font-size:10px;">${r.art || '---'}</td>
                    <td style="font-weight:700; color:#1e293b; font-size:11px;">${r.name}</td>
                    <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:900; color:#ff9f0a; font-size:11px;">${r.qty} ${r.unit || 'шт'}</td>
                    <td style="text-align:right; font-family:'JetBrains Mono'; font-size:11px;">${parseFloat(finalPrice).toLocaleString('ru-RU')} ₽</td>
                    <td style="text-align:right; font-weight:900; font-family:'JetBrains Mono'; font-size:11px;">${sum.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `;
        });

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Пожалуйста, разрешите всплывающие окна для печати!');
            return;
        }

        const timestamp = new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const docId = 'ИР-М-' + Math.floor(Math.random() * 90000 + 10000);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Инженерный расчет сборки - ПРУТКОН ОС</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 0; background: #e5e9f0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; color: #000; }
                        .page { 
                            width: 210mm; height: 297mm; padding: 18mm; margin: 10mm auto; background: #fff; 
                            box-sizing: border-box; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative;
                            display: flex; flex-direction: column;
                        }
                        @media print {
                            body { background: none; }
                            .page { margin: 0; border: none; box-shadow: none; }
                            .no-print { display: none !important; }
                        }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #ed1c24; padding-bottom: 15px; margin-bottom: 20px; }
                        .logo-box { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 24px; color: #ed1c24; letter-spacing: 1px; }
                        .doc-info { text-align: right; font-size: 11px; color: #475569; }
                        .title { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 18px; margin: 15px 0; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
                        
                        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 11px; }
                        .meta-card { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
                        .meta-title { font-weight: 900; color: #64748b; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
                        .meta-value { font-weight: 700; color: #0f172a; }

                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { background: #0f172a; color: #fff; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; padding: 10px; }
                        td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
                        
                        .totals-box { margin-left: auto; width: 40%; margin-top: 15px; border-top: 2px solid #ed1c24; padding-top: 10px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                        .grand-total { font-size: 16px; font-weight: 900; color: #ed1c24; margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
                        
                        .footer { margin-top: auto; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="header">
                            <div class="logo-box">PRUTKON <span style="font-weight:300; color:#0f172a;">SYSTEM</span></div>
                            <div class="doc-info">
                                <div><b>ДОКУМЕНТ:</b> ${docId}</div>
                                <div><b>ДАТА:</b> ${timestamp}</div>
                                <div><b>СТАТУС:</b> ИНЖЕНЕРНЫЙ РАСЧЕТ</div>
                            </div>
                        </div>

                        <div class="title">Сметный расчет комплектующих сборки</div>

                        <div class="meta-grid">
                            <div class="meta-card">
                                <div class="meta-title">Параметры спецификации транспортера</div>
                                <div class="meta-value">
                                    Количество прутков: <b>${rodsCount} шт</b><br>
                                    Количество ремней: <b>${beltsCount} шт</b><br>
                                    Длина ремней (сумм.): <b>${totalBeltQty} м.п.</b>
                                </div>
                            </div>
                            <div class="meta-card">
                                <div class="meta-title">Замковое соединение</div>
                                <div class="meta-value">
                                    Количество замков: <b>${locksCount} рядов</b><br>
                                    Прутков на замок: <b>${lockRodsCount} шт</b><br>
                                    Тип соединения: <b>${s.connectionType === 'mechanical' ? 'Механический замок' : 'Вулканизация/Другое'}</b>
                                </div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 30px;">№</th>
                                    <th style="width: 130px; text-align: left;">Артикул</th>
                                    <th style="text-align: left;">Наименование компонента / услуги</th>
                                    <th style="width: 80px; text-align: center;">Кол-во</th>
                                    <th style="width: 100px; text-align: right;">Цена</th>
                                    <th style="width: 110px; text-align: right;">Сумма с НДС</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tbodyRows}
                            </tbody>
                        </table>

                        <div class="totals-box">
                            <div class="total-row grand-total">
                                <span>ИТОГО СБОРКА:</span>
                                <span>${totalCost.toLocaleString('ru-RU')} ₽</span>
                            </div>
                        </div>

                        <div style="margin-top: 30px; font-size: 10px; color:#475569; line-height:1.4;">
                            * Расчет произведен автоматически на основе действующих цен справочника ПРУТКОН ERP.<br>
                            Данный документ является внутренним инженерным расчетом и не является счетом на оплату.
                        </div>

                        <div class="footer">
                            <div>Разработано: ПРУТКОН Инжиниринг</div>
                            <div>Страница 1 из 1</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    },

    updateTheoreticalStatus() {
        const s = window.CatalogState;
        const l = parseFloat(s.length) || 0;
        const p = parseFloat(s.pitch) || 0;
        const hasOverlap = (s.connectionType === 'screws' || s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot');
        const overlapSteps = parseInt(s.connectionOverlapSteps) || 6;
        
        let theoreticalRods = 0;
        if (l > 0 && p > 0) {
            theoreticalRods = Math.floor(l / p);
            if (hasOverlap) {
                theoreticalRods += overlapSteps;
            }
        }
        
        const hasInput = (s.length && s.pitch);
        const hasWarning = Math.abs(parseInt(s.asmRodsCount || s.rodsCount || 0) - theoreticalRods) > 1;
        
        const box = document.getElementById('step6-indicator-box');
        const countEl = document.getElementById('step6-theoretical-rods');
        const statusEl = document.getElementById('step6-calc-status');
        const tipEl = document.getElementById('step6-overlap-tip');
        
        if (countEl) countEl.innerText = theoreticalRods;
        if (box) {
            box.style.borderLeftColor = !hasInput ? '#222' : (hasWarning ? 'var(--brand-red)' : '#198754');
        }
        if (statusEl) {
            statusEl.innerText = !hasInput ? 'Ожидание данных' : (hasWarning ? 'ОШИБКА РАСЧЕТА!' : 'РАСЧЕТ ВЕРЕН');
            statusEl.style.color = !hasInput ? '#444' : (hasWarning ? 'var(--brand-red)' : '#198754');
        }
        if (tipEl) {
            tipEl.innerText = hasOverlap ? `С учетом нахлеста соединений (${overlapSteps} шагов)` : 'Без нахлеста соединений (разъемный стык)';
        }
    }
};
