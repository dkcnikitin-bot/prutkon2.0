/**
 * БЛОК 2-6: Дополнительные фичи (Карточки номенклатуры, Справочники, Расчеты, SUPABASE)
 */

window.PrutkonFeatures = {
    init: function() {
        this.injectModals();
        this.loadDirectories();
        this.setupRealtimeListeners();
    },

    injectModals: function() {
        if (document.getElementById('modal-metal-card')) return;
        
        const modalsHtml = `
        <!-- БЛОК 2.1: Карточка Металла -->
        <div id="modal-metal-card" class="modal">
            <div class="glass-panel" style="width: 800px; padding: 35px; max-height: 90vh; overflow-y: auto;">
                <button onclick="document.getElementById('modal-metal-card').classList.remove('active')" style="float: right; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h3 class="mb-4 text-white"><i class="fa-solid fa-cube text-brand-red"></i> <span id="mc-title-text">Карточка Металла (Supabase Sync)</span></h3>
                <div class="grid grid-2 gap-4">
                    <div class="form-group"><label>Код / ID материала</label><input type="text" id="mc-id" class="form-control" readonly></div>
                    <div class="form-group" id="mc-name-group" style="display:none;"><label>Наименование</label><input type="text" id="mc-name" class="form-control"></div>
                    <div class="form-group" id="mc-dia-group"><label>Диаметр (мм)</label><select id="mc-dia" class="form-control" onchange="PrutkonFeatures.recalcMetalFinance()"></select></div>
                    <div class="form-group" id="mc-weight-m-group"><label>Вес 1 м.п. (кг)</label><input type="number" id="mc-weight-m" class="form-control" step="0.001" oninput="PrutkonFeatures.recalcMetalFinance()"></div>
                    <div class="form-group" id="mc-length-group"><label>Длина хлыста (мм)</label><input type="number" id="mc-length" class="form-control" value="6000" oninput="PrutkonFeatures.recalcMetalFinance()"></div>
                    <div class="form-group" id="mc-steel-group"><label>Марка стали</label><input type="text" id="mc-steel" class="form-control" list="mc-steels-list"></div>
                    <div class="form-group"><label>Поставщик</label><input type="text" id="mc-supplier" class="form-control" list="mc-suppliers-list"></div>
                    <div class="form-group"><label>Дата поставки</label><input type="date" id="mc-date" class="form-control"></div>
                    <div class="form-group"><label>Текущий остаток (т)</label><input type="number" id="mc-stock-t" class="form-control" readonly style="color:var(--emerald-neon); font-weight:bold;"></div>
                    <div class="form-group"><label>Текущий остаток (кг)</label><input type="number" id="mc-stock-kg" class="form-control" readonly style="color:var(--emerald-neon); font-weight:bold;"></div>
                    <div class="form-group" id="mc-hard-spec-group"><label>Твердость (спецификация)</label><input type="text" id="mc-hard-spec" class="form-control"></div>
                    <div class="form-group" id="mc-hard-fact-group"><label>Твердость (факт)</label><input type="text" id="mc-hard-fact" class="form-control"></div>
                </div>
                <h4 class="mt-4 mb-3" style="color: var(--brand-gold)">Финансы и Налоги</h4>
                <div class="form-group mb-3">
                    <label class="toggle-switch">
                        <input type="checkbox" id="mc-tax-toggle" onchange="PrutkonFeatures.recalcMetalFinance()">
                        <span class="slider round"></span>
                        <span style="margin-left: 45px; font-size: 0.8rem;">Расчет с учетом НДС (22%)</span>
                    </label>
                </div>
                <div class="grid grid-2 gap-4">
                    <div class="form-group"><label>Цена за 1 тонну (без НДС)</label><input type="number" id="mc-price-ton-no-vat" class="form-control" oninput="PrutkonFeatures.recalcMetalFinance()"></div>
                    <div class="form-group"><label>Цена за 1 тонну (с НДС)</label><input type="number" id="mc-price-ton-vat" class="form-control" readonly></div>
                    <div class="form-group" id="mc-price-m-no-vat-group"><label>Цена за 1 м.п. (без НДС)</label><input type="number" id="mc-price-m-no-vat" class="form-control" readonly></div>
                    <div class="form-group" id="mc-price-m-vat-group"><label>Цена за 1 м.п. (с НДС)</label><input type="number" id="mc-price-m-vat" class="form-control" readonly></div>
                    <div class="form-group" id="mc-delivery-total-group"><label>Стоимость доставки (общая)</label><input type="number" id="mc-delivery-total" class="form-control" oninput="PrutkonFeatures.recalcMetalFinance()"></div>
                    <div class="form-group" id="mc-delivery-m-group"><label>Стоимость доставки (1 м.п.)</label><input type="number" id="mc-delivery-m" class="form-control" readonly></div>
                </div>

                <!-- Блок истории -->
                <h4 class="mt-4 mb-3" style="color: var(--brand-gold)"><i class="fa-solid fa-clock-rotate-left"></i> История движения и списаний</h4>
                <div id="mc-history-block" style="background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); padding: 15px; max-height: 300px; overflow-y: auto;">
                    <div style="opacity: 0.5; text-align: center; padding: 20px;">Загрузка истории...</div>
                </div>

                <datalist id="mc-suppliers-list"></datalist>
                <datalist id="mc-steels-list"></datalist>
                <div class="mt-4 flex justify-end gap-2">
                    <button class="btn btn-primary" onclick="PrutkonFeatures.saveMetalCard()"><i class="fa-solid fa-cloud-upload"></i> Сохранить изменения</button>
                </div>
            </div>
        </div>

        <!-- БЛОК 2.2: Карточка Прутка (Сводный паспорт) -->
        <div id="modal-rod-card" class="modal">
            <div class="glass-panel" style="width: 900px; padding: 35px; max-height: 90vh; overflow-y: auto;">
                <button onclick="document.getElementById('modal-rod-card').classList.remove('active')" style="float: right; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h3 class="mb-4 text-white"><i class="fa-solid fa-passport text-brand-red"></i> Карточка Прутка (Единый паспорт изделия)</h3>
                
                <div class="grid grid-4 gap-4">
                    <!-- Идентификация -->
                    <div class="form-group" style="grid-column:span 2;"><label>Артикул / Код изделия [A]</label><input type="text" id="rc-art" class="form-control text-bold" style="color:var(--brand-red)" readonly></div>
                    <div class="form-group" style="grid-column:span 2;"><label>Тип прутка [B]</label><input type="text" id="rc-rod-type" class="form-control" readonly></div>
                    <div class="form-group" style="grid-column:span 2;"><label>Техника (Бренд/Модель) [F]</label><input type="text" id="rc-tech" class="form-control" readonly></div>
                    <div class="form-group"><label>Связанная заготовка [E]</label><input type="text" id="rc-blank-id" class="form-control" readonly></div>
                    <div class="form-group"><label>Диаметр стали (мм) [R]</label><input type="text" id="rc-dia" class="form-control" readonly></div>

                    <!-- Кросс-номера -->
                    <div class="form-group"><label>Артикул Hessels [L]</label><input type="text" id="rc-hessels" class="form-control" readonly></div>
                    <div class="form-group"><label>Артикул ROPA [M]</label><input type="text" id="rc-ropa" class="form-control" readonly></div>
                    <div class="form-group"><label>Артикул Broekema [N]</label><input type="text" id="rc-broekema" class="form-control" readonly></div>
                    <div class="form-group"><label>Артикул Grimme [P]</label><input type="text" id="rc-grimme" class="form-control" readonly></div>

                    <!-- Технические параметры и РТИ -->
                    <div class="form-group"><label>Ширина ремня (мм) [S]</label><input type="text" id="rc-belt-width" class="form-control" readonly></div>
                    <div class="form-group"><label>Готовая длина (мм) [J]</label><input type="number" id="rc-final-len" class="form-control" readonly></div>
                    <div class="form-group"><label>Межосевое по бокам (мм) [U]</label><input type="text" id="rc-pitch-side" class="form-control" readonly></div>
                    <div class="form-group"><label>Межосевое в центре (мм) [V]</label><input type="text" id="rc-pitch-center" class="form-control" readonly></div>

                    <div class="form-group"><label>Рез. наконечники [W]</label><input type="text" id="rc-rubber-tips" class="form-control" readonly></div>
                    <div class="form-group"><label>Высота шпильки [X]</label><input type="number" id="rc-pin-height" class="form-control" readonly></div>
                    <div class="form-group"><label>Ширина по резине [Y]</label><input type="number" id="rc-rubber-width" class="form-control" readonly></div>
                    <div class="form-group"><label>Диаметр по резине [Z]</label><input type="number" id="rc-rubber-dia" class="form-control" readonly></div>

                    <div class="form-group" style="grid-column:span 2;">
                        <label>URL чертежа / фото</label>
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="rc-drawing-url" class="form-control" readonly>
                            <button id="rc-drawing-open-btn" class="btn btn-secondary" onclick="window.openDrawingUrl('rc-drawing-url')" style="padding: 0 15px;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Открыть</button>
                        </div>
                    </div>
                    <div class="form-group" style="grid-column:span 2;">
                        <label>URL чертежа гнутья</label>
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="rc-drawing-bent-url" class="form-control" readonly>
                            <button id="rc-drawing-bent-open-btn" class="btn btn-secondary" onclick="window.openDrawingUrl('rc-drawing-bent-url')" style="padding: 0 15px;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Открыть</button>
                        </div>
                    </div>
                </div>

                <h4 class="mt-4 mb-3" style="color: var(--brand-gold)"><i class="fa-solid fa-code-branch"></i> Жизненный цикл изделия (Сквозной Workflow)</h4>
                <div id="rc-dynamic-workflow-actions" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                    <div style="color: var(--text-muted); text-align: center; font-size: 0.85rem;">Выберите изделие из реестра для управления жизненным циклом...</div>
                </div>

                <h4 class="mt-4 mb-3" style="color: var(--brand-gold)">Ценообразование (Каскадный расчет)</h4>
                <div class="grid grid-3 gap-4">
                    <div class="form-group"><label>Себестоимость [K]</label><input type="text" id="rc-cost" class="form-control" readonly style="font-weight:bold; color:var(--neon-emerald)"></div>
                    <div class="form-group"><label>Прайсовая цена (с НДС) [H]</label><input type="text" id="rc-price" class="form-control" readonly style="font-weight:bold; color:var(--brand-gold)"></div>
                    <div class="form-group"><label>Цена интернет евро [I]</label><input type="text" id="rc-price-euro" class="form-control" readonly style="font-weight:bold; color:#007aff"></div>
                </div>

                <!-- Блок истории и документов для прутка -->
                <h4 class="mt-4 mb-3" style="color: var(--brand-gold)"><i class="fa-solid fa-clock-rotate-left"></i> История движения и сопроводительные документы</h4>
                <div id="rc-history-block" style="background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); padding: 15px; max-height: 300px; overflow-y: auto; margin-bottom: 25px;">
                    <div style="opacity: 0.5; text-align: center; padding: 20px;">Загрузка истории...</div>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                    <button class="btn btn-primary" onclick="document.getElementById('modal-rod-card').classList.remove('active')"><i class="fa-solid fa-check"></i> Закрыть карточку</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalsHtml);
    },

    systemDirectories: {
        get belt_widths() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_widths') : [];
            if (dbItems.length > 0) return dbItems.map(d => parseFloat(d.name) || d.name);
            return [20, 30, 40, 45, 50, 55, 60, 65, 70, 75, '60-75'];
        },
        get belt_pitches() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'belt_pitches') : [];
            if (dbItems.length > 0) return dbItems.map(d => parseFloat(d.name) || d.name);
            return [20, 23, 28, 30, 32, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44, 45, 48, 50, 55, 56, 60, 64, 65, 70, 75, 80, 175, 185];
        },
        get rod_diameters() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'rod_diameters') : [];
            if (dbItems.length > 0) return dbItems.map(d => parseFloat(d.name) || d.name);
            return [8, 9, 10, 11, 12, 13, 16];
        },
        get conn_types() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'connection_types') : [];
            if (dbItems.length > 0) return dbItems.map(d => d.name);
            return ['Механический замок', 'Подготовлен к вулканизации', 'Вулканизация холодная', 'Вулканизация горячая', 'Открытый тип', 'Винтовая скрутка'];
        },
        get rod_types() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'rod_types') : [];
            if (dbItems.length > 0) return dbItems.map(d => d.name);
            return ['Обрезиненный прямой', 'Обрезиненный гнутый', 'Стальной гнутый', 'Игольчатый V', 'Игольчатый H', 'Игольчатый I', 'Пальчиковый прямой', 'Пальчиковый с боковыми', 'Стальной трехременный', 'Стальной 4х ременный', 'Обрезиненный гнутый трехременный'];
        },
        get crops() {
            const dbItems = window.dbDirectories ? window.dbDirectories.filter(d => d.category === 'crops') : [];
            if (dbItems.length > 0) return dbItems.map(d => d.name);
            return [
                'Транспортер основного просеивания (шаг 30)',
                'Транспортер ботвы',
                'Выгрузной транспортер',
                'Транспортер №30',
                'Транспортер №40',
                'Боковой элеватор',
                'Приемный транспортер',
                'Сортировочный транспортер'
            ];
        }
    },

    loadDirectories: async function() {
        if (!window.supabase) {
            console.warn("Supabase не инициализирован.");
            this.populateSelects();
            return;
        }
        try {
            const { data, error } = await window.supabase.from('system_settings').select('value').eq('key', 'system_enums').maybeSingle();
            if (data && data.value) {
                this.systemDirectories = Object.assign(this.systemDirectories, data.value);
            } else {
                // Если записи нет (406/404), создаем её со стандартными значениями
                await window.supabase.from('system_settings').upsert({ key: 'system_enums', value: this.systemDirectories });
            }
            this.populateSelects();
        } catch (e) {
            console.error("Ошибка загрузки справочников Supabase:", e);
            this.populateSelects();
        }
    },

    populateSelects: function() {
        const fill = (id, arr) => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = arr.map(v => `<option value="${v}">${v}</option>`).join('');
        };
        fill('mc-dia', this.systemDirectories.rod_diameters);
        fill('rc-dia', this.systemDirectories.rod_diameters);
        fill('rc-pitch', this.systemDirectories.belt_pitches);
        fill('rc-rod-type', this.systemDirectories.rod_types);
        
        const brandRecords = (window.dbDirectories || []).filter(d => d.category === 'brands');
        const brands = brandRecords.length > 0 ? [...new Set(brandRecords.map(b => b.name))].sort() : ['ROPA', 'Grimme', 'Holmer', 'Dewulf', 'AVR'];
        fill('rc-brand', brands);
    },

    calcBlankLength: function() {
        const finalLen = parseFloat(document.getElementById('rc-final-len').value) || 0;
        const centerParts = parseInt(document.getElementById('rc-center-parts').value) || 0;
        const isCompression = parseInt(document.getElementById('rc-compression').value) === 1;

        let blankLen = finalLen;
        if (centerParts === 1) blankLen += 10;
        if (centerParts === 2) blankLen += 20;
        if (centerParts === 3) blankLen += 30;
        if (isCompression) blankLen -= 50;

        document.getElementById('rc-calc-blank-len').value = blankLen;
        return blankLen;
    },

    recalcMetalFinance: function() {
        const id = document.getElementById('mc-id').value;
        const dirs = window.dbDirectories || [];
        const item = dirs.find(d => String(d.id) === String(id));
        const isMetal = !item || !item.category || item.category === 'metal';

        const hasVat = document.getElementById('mc-tax-toggle').checked;
        const vatRate = 1.22;
        
        const priceTonNoVat = parseFloat(document.getElementById('mc-price-ton-no-vat').value) || 0;
        const weightM = parseFloat(document.getElementById('mc-weight-m').value) || 0;
        const totalDelivery = parseFloat(document.getElementById('mc-delivery-total').value) || 0;
        const stockKg = parseFloat(document.getElementById('mc-stock-kg').value) || 0;

        const priceTonVat = hasVat ? priceTonNoVat * vatRate : priceTonNoVat;
        document.getElementById('mc-price-ton-vat').value = priceTonVat.toFixed(2);

        if (isMetal) {
            const priceMNoVat = (priceTonNoVat / 1000) * weightM;
            const priceMVat = hasVat ? priceMNoVat * vatRate : priceMNoVat;
            document.getElementById('mc-price-m-no-vat').value = priceMNoVat.toFixed(2);
            document.getElementById('mc-price-m-vat').value = priceMVat.toFixed(2);

            let deliveryM = 0;
            if (stockKg > 0) deliveryM = (totalDelivery / stockKg) * weightM;
            document.getElementById('mc-delivery-m').value = deliveryM.toFixed(2);
        }
    },

    generateSKU: function() {
        const brand = document.getElementById('rc-brand').value || 'BRAND';
        const drawArt = document.getElementById('rc-drawing-art').value || '0000';
        const width = document.getElementById('rc-rubber-width').value || '0';
        const type = document.getElementById('rc-rod-type').value || 'Прямой';
        
        const sku = `${brand}-${drawArt}-${width}-${type}`;
        document.getElementById('rc-art').value = sku;
    },

    setupRealtimeListeners: function() {
        if (!window.supabase) return;
        window.supabase.channel('metals-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directories' }, payload => {
                console.log("☁️ Справочник металлов обновлен в Supabase");
                if (window.initData) window.initData();
            })
            .subscribe();
    },

    openMetalCard: function(id) {
        document.getElementById('modal-metal-card').classList.add('active');
        
        if (!id) {
            document.getElementById('mc-id').value = 'metal_new_' + Date.now();
            document.getElementById('mc-dia').value = '';
            document.getElementById('mc-weight-m').value = '';
            document.getElementById('mc-length').value = 6000;
            document.getElementById('mc-steel').value = '';
            document.getElementById('mc-supplier').value = '';
            document.getElementById('mc-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('mc-hard-spec').value = '';
            document.getElementById('mc-hard-fact').value = '';
            document.getElementById('mc-price-ton-no-vat').value = '';
            document.getElementById('mc-delivery-total').value = '';
            document.getElementById('mc-tax-toggle').checked = true;
            document.getElementById('mc-stock-kg').value = '0';
            document.getElementById('mc-stock-t').value = '0.000';
            if (document.getElementById('mc-name')) document.getElementById('mc-name').value = '';
            
            const titleEl = document.getElementById('mc-title-text') || document.querySelector('#modal-metal-card h3');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-cube text-brand-red"></i> Карточка Металла (Supabase Sync)`;
            
            const nameGrp = document.getElementById('mc-name-group');
            if (nameGrp) nameGrp.style.display = 'none';

            ['mc-dia-group', 'mc-weight-m-group', 'mc-length-group', 'mc-steel-group', 'mc-hard-spec-group', 'mc-hard-fact-group', 'mc-price-m-no-vat-group', 'mc-price-m-vat-group', 'mc-delivery-total-group', 'mc-delivery-m-group'].forEach(grpId => {
                const el = document.getElementById(grpId) || document.getElementById(grpId.replace('-group',''))?.closest('.form-group');
                if (el) el.style.display = '';
            });
            const stockTGrp = document.getElementById('mc-stock-t')?.closest('.form-group');
            if (stockTGrp) stockTGrp.style.display = '';

            const priceTonLabel = document.getElementById('mc-price-ton-no-vat')?.previousElementSibling;
            if (priceTonLabel) priceTonLabel.innerText = 'Цена за 1 тонну (без НДС)';
            const priceTonVatLabel = document.getElementById('mc-price-ton-vat')?.previousElementSibling;
            if (priceTonVatLabel) priceTonVatLabel.innerText = 'Цена за 1 тонну (с НДС)';
            const stockKgLabel = document.getElementById('mc-stock-kg')?.previousElementSibling;
            if (stockKgLabel) stockKgLabel.innerText = 'Текущий остаток (кг)';

            if (document.getElementById('mc-history-block')) {
                document.getElementById('mc-history-block').innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 20px;">Нет движения для новой карточки</div>';
            }
            return;
        }

        // Поиск данных по exact ID или с префиксами
        const dirs = window.dbDirectories || [];
        let metal = dirs.find(d => String(d.id) === String(id));
        let fullId = id;

        if (!metal) {
            if (id.startsWith('metal_')) {
                const baseId = id.replace('metal_', '');
                metal = dirs.find(d => String(d.id) === String(baseId));
            } else if (id.startsWith('hardware_')) {
                const baseId = id.replace('hardware_', '');
                metal = dirs.find(d => String(d.id) === String(baseId));
            } else if (id.startsWith('fasteners_')) {
                const baseId = id.replace('fasteners_', '');
                metal = dirs.find(d => String(d.id) === String(baseId));
            } else {
                fullId = `metal_${id}`;
                metal = dirs.find(d => String(d.id) === fullId);
            }
        }
        if (!metal) fullId = id;

        document.getElementById('mc-id').value = fullId;
        
        // Заполнение подсказок
        const suppliers = dirs.filter(d => d.category === 'dealers' || (d.data && d.data.supplier)).map(d => d.name || d.data?.supplier);
        document.getElementById('mc-suppliers-list').innerHTML = [...new Set(suppliers)].filter(Boolean).map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');
        
        const steels = dirs.filter(d => d.steel_type || (d.data && d.data.steel_type)).map(d => d.steel_type || d.data?.steel_type);
        document.getElementById('mc-steels-list').innerHTML = [...new Set(steels)].filter(Boolean).map(s => `<option value="${s.replace(/"/g, '&quot;')}">`).join('');

        const category = metal ? (metal.category || metal.data?.category || 'metal') : 'metal';
        const isMetal = category === 'metal';

        const titleEl = document.getElementById('mc-title-text') || document.querySelector('#modal-metal-card h3');
        if (titleEl) {
            if (category === 'hardware') {
                titleEl.innerHTML = `<i class="fa-solid fa-toolbox text-brand-red"></i> Карточка: Скобяное изделие`;
            } else if (category === 'fasteners') {
                titleEl.innerHTML = `<i class="fa-solid fa-screwdriver-wrench text-brand-red"></i> Карточка: Метизы и крепеж`;
            } else {
                titleEl.innerHTML = `<i class="fa-solid fa-cube text-brand-red"></i> Карточка Металла (Supabase Sync)`;
            }
        }

        const nameGrp = document.getElementById('mc-name-group');
        if (nameGrp) nameGrp.style.display = isMetal ? 'none' : '';
        if (document.getElementById('mc-name')) {
            document.getElementById('mc-name').value = metal ? (metal.name || metal.data?.name || '') : '';
        }

        ['mc-dia-group', 'mc-weight-m-group', 'mc-length-group', 'mc-steel-group', 'mc-hard-spec-group', 'mc-hard-fact-group', 'mc-price-m-no-vat-group', 'mc-price-m-vat-group', 'mc-delivery-total-group', 'mc-delivery-m-group'].forEach(grpId => {
            const el = document.getElementById(grpId) || document.getElementById(grpId.replace('-group',''))?.closest('.form-group');
            if (el) el.style.display = isMetal ? '' : 'none';
        });
        const stockTGrp = document.getElementById('mc-stock-t')?.closest('.form-group');
        if (stockTGrp) stockTGrp.style.display = isMetal ? '' : 'none';

        const priceTonLabel = document.getElementById('mc-price-ton-no-vat')?.previousElementSibling;
        if (priceTonLabel) priceTonLabel.innerText = isMetal ? 'Цена за 1 тонну (без НДС)' : 'Цена за 1 шт (без НДС)';
        const priceTonVatLabel = document.getElementById('mc-price-ton-vat')?.previousElementSibling;
        if (priceTonVatLabel) priceTonVatLabel.innerText = isMetal ? 'Цена за 1 тонну (с НДС)' : 'Цена за 1 шт (с НДС)';
        const stockKgLabel = document.getElementById('mc-stock-kg')?.previousElementSibling;
        if (stockKgLabel) stockKgLabel.innerText = isMetal ? 'Текущий остаток (кг)' : 'Текущий остаток (шт)';

        if (metal) {
            const d = metal.data || metal;
            document.getElementById('mc-dia').value = d.diameter || '';
            document.getElementById('mc-weight-m').value = d.weight_per_m || '';
            document.getElementById('mc-length').value = d.length || 6000;
            document.getElementById('mc-steel').value = d.steel_type || '';
            document.getElementById('mc-supplier').value = d.supplier || '';
            document.getElementById('mc-date').value = d.date_arrival || '';
            document.getElementById('mc-hard-spec').value = d.hardness_spec || '';
            document.getElementById('mc-hard-fact').value = d.hardness_fact || '';
            document.getElementById('mc-price-ton-no-vat').value = d.price || '';
            document.getElementById('mc-delivery-total').value = d.delivery_total || '';
            document.getElementById('mc-tax-toggle').checked = !!d.use_vat;
            
            const stockKg = window.dbWarehouseInv ? (window.dbWarehouseInv[fullId] || 0) : 0;
            document.getElementById('mc-stock-kg').value = stockKg;
            document.getElementById('mc-stock-t').value = (stockKg / 1000).toFixed(3);

            this.recalcMetalFinance();
        } else {
            const stockKg = window.dbWarehouseInv ? (window.dbWarehouseInv[fullId] || 0) : 0;
            document.getElementById('mc-stock-kg').value = stockKg;
            document.getElementById('mc-stock-t').value = (stockKg / 1000).toFixed(3);
        }

        this.renderMetalHistory(fullId);
    },

    renderMetalHistory: function(metalId) {
        const historyBlock = document.getElementById('mc-history-block');
        if (!historyBlock) return;
        
        const fullId = metalId.startsWith('metal_') ? metalId : `metal_${metalId}`;
        const shortId = metalId.startsWith('metal_') ? metalId.replace('metal_', '') : metalId;
        
        const logs = (window.dbWarehouseLog || []).filter(log => {
            if (!log.changes) {
                const hasId = (log.details && log.details.includes(fullId)) || (log.comment && log.comment.includes(fullId)) ||
                              (log.details && log.details.includes(shortId)) || (log.comment && log.comment.includes(shortId));
                return hasId;
            }
            const targetItem = log.changes.target?.item || '';
            const sourceItem = log.changes.source?.item || '';
            return targetItem === fullId || targetItem === shortId || 
                   sourceItem === fullId || sourceItem === shortId ||
                   (log.details && log.details.includes(fullId)) || (log.comment && log.comment.includes(fullId)) ||
                   (log.details && log.details.includes(shortId)) || (log.comment && log.comment.includes(shortId));
        }).reverse();

        if (logs.length === 0) {
            historyBlock.innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 20px;">Нет записей о движении этого металла</div>';
            return;
        }

        let html = `
            <table style="width: 100%; font-size: 0.8rem; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                        <th style="padding: 8px; width: 80px;">Дата</th>
                        <th style="padding: 8px; width: 120px;">Операция</th>
                        <th style="padding: 8px;">Детали / Комментарий</th>
                        <th style="padding: 8px; width: 90px;">Оператор</th>
                        <th style="padding: 8px; text-align: right; width: 90px;">Кол-во</th>
                        <th style="padding: 8px; width: 120px;">Документы</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            let qtyStr = '---';
            let color = '#fff';
            let sign = '';
            
            const isTarget = log.changes && log.changes.target && (log.changes.target.item === fullId || log.changes.target.item === shortId);
            const isSource = log.changes && log.changes.source && (log.changes.source.item === fullId || log.changes.source.item === shortId);
            
            if (isTarget) {
                const qty = log.changes.target.qty;
                color = qty > 0 ? 'var(--emerald-neon)' : 'var(--brand-red)';
                sign = qty > 0 ? '+' : '';
                qtyStr = `${sign}${window.formatWhNumber ? window.formatWhNumber(qty, 2) : qty.toFixed(2)} кг`;
            } else if (isSource) {
                const qty = log.changes.source.qty;
                color = qty > 0 ? 'var(--brand-red)' : 'var(--emerald-neon)';
                sign = qty > 0 ? '-' : '+';
                qtyStr = `${sign}${window.formatWhNumber ? window.formatWhNumber(Math.abs(qty), 2) : Math.abs(qty).toFixed(2)} кг`;
            } else if (log.changes && log.changes.qty) {
                const qty = log.changes.qty;
                qtyStr = `${qty} кг`;
            }

            const operator = log.user || 'Система';
            const details = log.details || '';
            const comment = log.comment ? `<div style="font-size:0.75rem; color:var(--emerald-neon); opacity:0.8; margin-top:2px;">↳ ${log.comment}</div>` : '';
            
            let attachmentsHtml = '';
            if (log.attachments && log.attachments.length > 0) {
                attachmentsHtml = log.attachments.map(att => `
                    <a href="${att.data}" download="${att.name}" class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:2px 4px; border-radius:3px; display:inline-flex; align-items:center; gap:3px; color:#fff; font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation();" title="${att.name}">
                        <i class="fa-solid fa-download"></i> ${att.name.substring(0,8)}${att.name.length > 8 ? '..' : ''}
                    </a>
                `).join(' ');
            }

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: top;">
                    <td style="padding: 8px; color: var(--text-muted);">${log.date.split(',')[0]}</td>
                    <td style="padding: 8px; color: #fff;">${log.type}</td>
                    <td style="padding: 8px; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                        ${details}
                        ${comment}
                    </td>
                    <td style="padding: 8px; color: var(--text-muted);">${operator}</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold; color: ${color};">${qtyStr}</td>
                    <td style="padding: 8px;">${attachmentsHtml || '<span style="opacity:0.3;">---</span>'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historyBlock.innerHTML = html;
    },

    renderRodHistory: function(art) {
        const historyBlock = document.getElementById('rc-history-block');
        if (!historyBlock) return;
        
        if (!art) {
            historyBlock.innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 20px;">Нет данных для отображения истории</div>';
            return;
        }
        
        const logs = (window.dbWarehouseLog || []).filter(log => {
            if (!log.changes) {
                const hasArt = (log.details && log.details.includes(art)) || (log.comment && log.comment.includes(art));
                return hasArt;
            }
            const targetItem = log.changes.target?.item || '';
            const sourceItem = log.changes.source?.item || '';
            
            return targetItem.endsWith('_' + art) || targetItem === art ||
                   sourceItem.endsWith('_' + art) || sourceItem === art ||
                   (log.details && log.details.includes(art)) ||
                   (log.comment && log.comment.includes(art));
        }).reverse();

        if (logs.length === 0) {
            historyBlock.innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 20px;">Нет записей о движении этого прутка</div>';
            return;
        }

        let html = `
            <table style="width: 100%; font-size: 0.8rem; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                        <th style="padding: 8px; width: 80px;">Дата</th>
                        <th style="padding: 8px; width: 120px;">Операция</th>
                        <th style="padding: 8px;">Детали / Комментарий</th>
                        <th style="padding: 8px; width: 90px;">Оператор</th>
                        <th style="padding: 8px; text-align: right; width: 90px;">Кол-во</th>
                        <th style="padding: 8px; width: 120px;">Документы</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            let qtyStr = '---';
            let color = '#fff';
            let sign = '';
            
            const isTarget = log.changes && log.changes.target && (log.changes.target.item === art || log.changes.target.item.endsWith('_' + art));
            const isSource = log.changes && log.changes.source && (log.changes.source.item === art || log.changes.source.item.endsWith('_' + art));
            
            if (isTarget) {
                const qty = log.changes.target.qty;
                color = qty > 0 ? 'var(--emerald-neon)' : 'var(--brand-red)';
                sign = qty > 0 ? '+' : '';
                qtyStr = `${sign}${qty} шт`;
            } else if (isSource) {
                const qty = log.changes.source.qty;
                color = qty > 0 ? 'var(--brand-red)' : 'var(--emerald-neon)';
                sign = qty > 0 ? '-' : '+';
                qtyStr = `${sign}${Math.abs(qty)} шт`;
            } else if (log.changes && log.changes.qty) {
                const qty = log.changes.qty;
                qtyStr = `${qty} шт`;
            }

            const operator = log.user || 'Система';
            const details = log.details || '';
            const comment = log.comment ? `<div style="font-size:0.75rem; color:var(--emerald-neon); opacity:0.8; margin-top:2px;">↳ ${log.comment}</div>` : '';
            
            let attachmentsHtml = '';
            if (log.attachments && log.attachments.length > 0) {
                attachmentsHtml = log.attachments.map(att => `
                    <a href="${att.data}" download="${att.name}" class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:2px 4px; border-radius:3px; display:inline-flex; align-items:center; gap:3px; color:#fff; font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation();" title="${att.name}">
                        <i class="fa-solid fa-download"></i> ${att.name.substring(0,8)}${att.name.length > 8 ? '..' : ''}
                    </a>
                `).join(' ');
            }

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: top;">
                    <td style="padding: 8px; color: var(--text-muted);">${log.date.split(',')[0]}</td>
                    <td style="padding: 8px; color: #fff;">${log.type}</td>
                    <td style="padding: 8px; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                        ${details}
                        ${comment}
                    </td>
                    <td style="padding: 8px; color: var(--text-muted);">${operator}</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold; color: ${color};">${qtyStr}</td>
                    <td style="padding: 8px;">${attachmentsHtml || '<span style="opacity:0.3;">---</span>'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historyBlock.innerHTML = html;
    },

    saveMetalCard: async function() {
        const id = document.getElementById('mc-id').value;
        const dirs = window.dbDirectories || [];
        const metal = dirs.find(d => String(d.id) === String(id));
        const category = metal ? (metal.category || metal.data?.category || 'metal') : 'metal';
        const isMetal = category === 'metal';

        const payload = {
            id: id,
            category: category,
            name: isMetal ? undefined : document.getElementById('mc-name').value,
            diameter: isMetal ? parseFloat(document.getElementById('mc-dia').value) : undefined,
            weight_per_m: isMetal ? parseFloat(document.getElementById('mc-weight-m').value) : undefined,
            length: isMetal ? parseFloat(document.getElementById('mc-length').value) : undefined,
            steel_type: isMetal ? document.getElementById('mc-steel').value : undefined,
            supplier: document.getElementById('mc-supplier').value,
            date_arrival: document.getElementById('mc-date').value,
            hardness_spec: isMetal ? document.getElementById('mc-hard-spec').value : undefined,
            hardness_fact: isMetal ? document.getElementById('mc-hard-fact').value : undefined,
            price: parseFloat(document.getElementById('mc-price-ton-no-vat').value),
            delivery_total: isMetal ? parseFloat(document.getElementById('mc-delivery-total').value) : undefined,
            use_vat: document.getElementById('mc-tax-toggle').checked
        };

        // Remove undefined fields
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
        
        const record = {
            id: id,
            name: isMetal ? (metal?.name || '') : payload.name,
            category: category,
            data: payload
        };

        if (window.supabase) {
            const { error } = await window.supabase.from('directories').upsert({
                id: id,
                data: payload
            });
            
            if (!error) {
                window.showToast('Карточка успешно обновлена в Supabase', 'success');
                
                const idx = window.dbDirectories.findIndex(d => d.id === id);
                if (idx !== -1) window.dbDirectories[idx] = record;
                else window.dbDirectories.push(record);
                
                if (window.saveAllToLocal) window.saveAllToLocal();
                if (typeof window.initWarehouseCatalog === 'function') window.initWarehouseCatalog();
                if (typeof window.renderInventory === 'function') window.renderInventory();
                
                document.getElementById('modal-metal-card').classList.remove('active');
            } else {
                window.showToast('Ошибка Supabase: ' + error.message, 'error');
            }
        } else {
            const idx = window.dbDirectories.findIndex(d => d.id === id);
            if (idx !== -1) window.dbDirectories[idx] = record;
            else window.dbDirectories.push(record);
            if (window.saveAllToLocal) window.saveAllToLocal();
            if (typeof window.initWarehouseCatalog === 'function') window.initWarehouseCatalog();
            if (typeof window.renderInventory === 'function') window.renderInventory();
            document.getElementById('modal-metal-card').classList.remove('active');
        }
    },

    saveRodCard: async function() {
        const data = {
            key: 'rod_card_' + document.getElementById('rc-art').value,
            value: {
                art: document.getElementById('rc-art').value,
                dia: document.getElementById('rc-dia').value,
                calc_blank_len: document.getElementById('rc-calc-blank-len').value,
                cost: document.getElementById('rc-cost').value,
                price: document.getElementById('rc-price').value
            }
        };
        
        if (window.supabase) {
            const { error } = await window.supabase.from('system_settings').upsert(data);
            if (!error) {
                window.showToast('Параметры прутка сохранены в реестр', 'success');
                if (window.saveAllToLocal) window.saveAllToLocal();
            }
        }
    },

    openRodCard: function(artOrName) {
        document.getElementById('modal-rod-card').classList.add('active');
        
        let found = null;
        let stepName = "";
        let stepNum = 0;
        let listName = "";

        let cleanKey = artOrName || '';
        const prefixes = ['blank_', 'straight_', 'double_', 'bent_', 'rubberized_', 'hedge_', 'bent_rubberized_'];
        for (const pref of prefixes) {
            if (cleanKey.startsWith(pref)) {
                cleanKey = cleanKey.substring(pref.length);
                break;
            }
        }

        if (window.db) {
            const look = (list, sName, sNum, lName) => {
                if (!list || !Array.isArray(list)) return;
                const match = list.find(x => String(x.article) === String(cleanKey) || String(x.name) === String(cleanKey) || String(x.article) === String(artOrName) || String(x.name) === String(artOrName));
                if (match) { found = match; stepName = sName; stepNum = sNum; listName = lName; }
            };
            look(window.db.rods_blanks, "Шаг 2 (Заготовка)", 2, "rods_blanks");
            if (!found) look(window.db.rods_standard, "Шаг 3 (Стандартный пруток)", 3, "rods_standard");
            if (!found) look(window.db.rods_bent, "Шаг 4 (Сложный / Гнутый пруток)", 4, "rods_bent");
            if (!found) look(window.db.rods_rubber, "Шаг 4 (Обрезиненный пруток)", 4, "rods_rubber");
            if (!found) look(window.db.rods_double, "Шаг 5 (Сдвоенный пруток)", 5, "rods_double");
        }

        const actContainer = document.getElementById('rc-dynamic-workflow-actions');

        if (!found) {
            document.getElementById('rc-art').value = artOrName || 'НОВЫЙ';
            if (actContainer) {
                actContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center;">Изделие "${artOrName}" не найдено в базе или создано вручную.</div>`;
            }
            return;
        }

        document.getElementById('rc-art').value = found.article || found.name || artOrName;
        document.getElementById('rc-rod-type').value = found.type || found.processingType || (stepNum === 4 ? (found.tips ? 'Обрезиненный' : 'Сложный / Гнутый') : 'Прямой');
        document.getElementById('rc-tech').value = found.techType || '';
        document.getElementById('rc-blank-id').value = found.blankId !== undefined ? found.blankId : (found.baseId !== undefined ? found.baseId : '');
        document.getElementById('rc-dia').value = found.dia || found.diameter || '';
        
        document.getElementById('rc-hessels').value = found.artHessels || '';
        document.getElementById('rc-ropa').value = found.artRopa || '';
        document.getElementById('rc-broekema').value = found.artBroekema || '';
        document.getElementById('rc-grimme').value = found.artGrimme || '';

        document.getElementById('rc-belt-width').value = found.beltWidth || found.width || '';
        document.getElementById('rc-final-len').value = found.length || found.finalLength || found.blankLength || '';
        document.getElementById('rc-pitch-side').value = found.pitchSide || '';
        document.getElementById('rc-pitch-center').value = found.pitchCenter || '';

        document.getElementById('rc-rubber-tips').value = found.tips || '';
        document.getElementById('rc-pin-height').value = found.spikeH || '';
        document.getElementById('rc-rubber-width').value = found.widthRubber || '';
        document.getElementById('rc-rubber-dia').value = found.diaRubber || '';

        document.getElementById('rc-drawing-url').value = found.photo || found.drawing || '';
        document.getElementById('rc-drawing-bent-url').value = found.drawing || '';

        const cost = parseFloat(found.priceNoVat || found.costPrice || found.price || 0);
        const price = parseFloat(found.price || cost * 2);
        document.getElementById('rc-cost').value = window.formatCurr(cost);
        document.getElementById('rc-price').value = window.formatCurr(price);
        document.getElementById('rc-price-euro').value = (price / 105).toFixed(2) + " €";

        // Генерация блока жизненного цикла
        if (actContainer) {
            let originHtml = "";
            if (stepNum === 2) {
                originHtml = `<span>Исходный металл со склада: <strong style="color:#fff;">${found.metalName || 'Сырье'}</strong> (Вес: ${window.formatWhNumber(found.weightKg || found.weight || 0, 2)} кг)</span>`;
            } else if (stepNum === 3) {
                const bObj = window.db.rods_blanks?.[found.blankId];
                originHtml = `<span>Изготовлено из: <strong style="color:#fff;">${bObj ? bObj.name : ('Заготовка ID ' + found.blankId)}</strong> (Длина: ${found.blankLength || bObj?.length || 0} мм)</span>`;
            } else if (stepNum === 4) {
                const allRods = [...(window.db.rods_standard || []), ...(window.db.rods_bent || [])];
                const baseObj = allRods[found.baseId];
                originHtml = `<span>Модификация / РТИ на основе: <strong style="color:#fff;">${baseObj ? baseObj.name : ('Базовый пруток ID ' + found.baseId)}</strong></span>`;
            } else if (stepNum === 5) {
                const bObj = window.db.rods_blanks?.[found.blankId];
                originHtml = `<span>Собрано из 2 заготовок: <strong style="color:#fff;">${bObj ? bObj.name : ('Заготовка ID ' + found.blankId)}</strong></span>`;
            }

            let nextButtonsHtml = "";
            const safeObjStr = encodeURIComponent(JSON.stringify({ ...found, stepNum, listIdx: window.db[listName].findIndex(x => x === found) }));

            if (stepNum === 2) {
                nextButtonsHtml += `<button class="btn btn-sm btn-primary" onclick="PrutkonFeatures.transferItemToStep(3, '${safeObjStr}')"><i class="fa-solid fa-arrow-right"></i> Передать в Шаг 3 (Стандартный пруток)</button>`;
                nextButtonsHtml += `<button class="btn btn-sm btn-secondary" onclick="PrutkonFeatures.transferItemToStep(5, '${safeObjStr}')"><i class="fa-solid fa-arrow-right"></i> Передать в Шаг 5 (Сдвоенный)</button>`;
            } else if (stepNum === 3) {
                nextButtonsHtml += `<button class="btn btn-sm btn-primary" onclick="PrutkonFeatures.transferItemToStep(4, '${safeObjStr}')"><i class="fa-solid fa-arrow-right"></i> Модифицировать в Шаг 4 (Сложные / РТИ)</button>`;
            }

            let html = `
                <div class="flex justify-between items-center mb-3 pb-3" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span class="badge" style="background: var(--brand-red); font-size: 0.8rem; font-weight: bold; padding: 4px 10px;">${stepName}</span>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${originHtml}</div>
                </div>
                <div class="flex gap-2 mb-3">
                    <div style="color: #fff; font-size: 0.85rem; font-weight: bold; align-self: center;">Переход в производство:</div>
                    ${nextButtonsHtml || '<span style="color: var(--text-muted); font-size: 0.85rem; align-self: center;">Финальный производственный этап</span>'}
                </div>
                <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px;" class="flex justify-between items-center">
                    <span style="font-size: 0.85rem; color: var(--brand-gold)"><i class="fa-solid fa-boxes-stacked"></i> Операция со складом ГП:</span>
                    <button class="btn btn-sm" style="background: var(--emerald-neon); color: #000; font-weight: bold;" onclick="PrutkonFeatures.writeOffItemToWarehouse('${found.name || found.article}', ${cost})">
                        <i class="fa-solid fa-box-check"></i> Переместить на Склад Готовой Продукции
                    </button>
                </div>
            `;
            actContainer.innerHTML = html;
        }
        
        // Рендерим историю и документы
        this.renderRodHistory(found.article || found.name);
    },

    transferItemToStep: function(nextStep, safeObjStr) {
        try {
            const item = JSON.parse(decodeURIComponent(safeObjStr));
            document.getElementById('modal-rod-card').classList.remove('active');
            if (window.switchProductionStep) window.switchProductionStep(nextStep);

            if (nextStep === 3 && item.stepNum === 2) {
                if (document.getElementById('r-blank-select')) {
                    document.getElementById('r-blank-select').value = item.listIdx;
                    if (window.calcStep3) window.calcStep3();
                }
            } else if (nextStep === 5 && item.stepNum === 2) {
                if (document.getElementById('d-blank-select')) {
                    if (document.getElementById('d-dia-select')) document.getElementById('d-dia-select').value = item.dia;
                    if (window.updateBlanksForStep5) window.updateBlanksForStep5();
                    document.getElementById('d-blank-select').value = item.listIdx;
                    if (window.calcStep5) window.calcStep5();
                }
            } else if (nextStep === 4 && item.stepNum === 3) {
                if (document.getElementById('bent-rod-select')) {
                    document.getElementById('bent-rod-select').value = item.listIdx;
                    if (window.calcStep4) window.calcStep4();
                }
            }
            window.showToast(`🚀 Заготовка/Пруток успешно передан(а) в Шаг ${nextStep}!`, 'success');
        } catch(e) { console.error(e); }
    },

    writeOffItemToWarehouse: function(itemName, itemPrice) {
        if (!window.dbWarehouseLog) window.dbWarehouseLog = [];
        window.dbWarehouseLog.push({
            id: Date.now() + Math.random(),
            date: new Date().toLocaleString(),
            type: 'Перемещение ГП',
            details: `Выпуск из производства: +1 шт "${itemName}" (${window.formatCurr ? window.formatCurr(itemPrice) : itemPrice + ' р.'})`,
            comment: `Перемещено на склад готовой продукции из инженерного цеха`,
            changes: { target: { item: itemName, qty: 1 } },
            user: window.currentUser?.name || 'Система'
        });
        if (window.saveAllToLocal) window.saveAllToLocal();
        window.showToast(`📦 Изделие "${itemName}" успешно оприходовано на Склад Готовой Продукции!`, 'success');
        document.getElementById('modal-rod-card').classList.remove('active');
    }
};

window.openDrawingUrl = function(inputId) {
    const url = document.getElementById(inputId)?.value?.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        window.open(url, '_blank');
    } else if (url) {
        window.open('https://' + url.replace(/^(http:\/\/|https:\/\/)/, ''), '_blank');
    } else {
        window.showToast('Ссылка на чертеж/фото не заполнена в базе', 'warning');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PrutkonFeatures.init();
});
