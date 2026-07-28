/* catalog_master/step1.js - ПРУТКОН ERP Шаг 1: Идентификация Изделия */

const HARVESTER_BRANDS = {
    'Grimme': ['SE 75-20', 'SE 75-30', 'SE 75-40', 'SE 75-55', 'SE 85-55', 'SE 150-60', 'SE 260', 'SV 260', 'GT 170', 'WR 200', 'Tectron 415', 'Varitron 220', 'Varitron 270', 'Varitron 470', 'EVO 280', 'EVO 290'],
    'Ropa': ['Keiler 1', 'Keiler 2', 'Tiger 6', 'Tiger 6S', 'Panther 2', 'Panther 2S', 'Maus 5', 'Maus 6'],
    'Dewulf': ['Kwatro', 'Torro', 'RA3060', 'Enduro', 'R3060', 'Zeno', 'R2060', 'R1060'],
    'AVR': ['Puma 3', 'Puma 4', 'Spirit 5200', 'Spirit 7200', 'Spirit 9200', 'Spirit 6100', 'Spirit 6200', 'Spirit 8200'],
    'Holmer': ['Terra Dos T4-30', 'Terra Dos T4-40', 'Terra Felis 3'],
    'Wühlmaus': ['1033', '1633', '2011', '2411'],
    'Amac': ['ZM2', 'ZM4', 'AX2', 'G2'],
    'Kverneland': ['UN 3100', 'UN 3200', 'Minos']
};

window.MODEL_DIMENSIONS = {
    // Grimme
    'se 75-20': [
        { name: '1-й просеивающий (основной)', width: 750, length: 2500, pitch: 35, convType: '2x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 750, length: 2800, pitch: 28, convType: '2x', sideMargin: 115 },
        { name: 'Транспортер ботвы (крупная петля)', width: 800, length: 3000, pitch: 200, convType: '2x', sideMargin: 115 }
    ],
    'se 75-30': [
        { name: '1-й просеивающий (основной)', width: 750, length: 2900, pitch: 35, convType: '2x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 750, length: 2800, pitch: 28, convType: '2x', sideMargin: 115 }
    ],
    'se 75-40': [
        { name: '1-й просеивающий (основной)', width: 750, length: 2900, pitch: 40, convType: '2x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 750, length: 2800, pitch: 28, convType: '2x', sideMargin: 115 }
    ],
    'se 75-55': [
        { name: '1-й просеивающий (основной)', width: 750, length: 3200, pitch: 40, convType: '2x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 750, length: 2900, pitch: 32, convType: '2x', sideMargin: 115 }
    ],
    'se 85-55': [
        { name: '1-й просеивающий (основной)', width: 850, length: 3200, pitch: 40, convType: '2x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 850, length: 2900, pitch: 32, convType: '2x', sideMargin: 115 }
    ],
    'se 150-60': [
        { name: '1-й просеивающий (широкий)', width: 1500, length: 3800, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3200, pitch: 35, convType: '3x', sideMargin: 115 },
        { name: 'Ботвоотделитель', width: 1650, length: 3600, pitch: 200, convType: '3x', sideMargin: 115 }
    ],
    'se 260': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3900, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3300, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'sv 260': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3900, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3300, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'gt 170': [
        { name: '1-й просеивающий (основной)', width: 1700, length: 4100, pitch: 35, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1700, length: 3500, pitch: 28, convType: '3x', sideMargin: 115 }
    ],
    'wr 200': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3500, pitch: 35, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3000, pitch: 28, convType: '3x', sideMargin: 115 }
    ],
    'tectron 415': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 4200, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3600, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'varitron 220': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3800, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3200, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'varitron 270': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3900, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1500, length: 3300, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'varitron 470': [
        { name: '1-й просеивающий (основной)', width: 1700, length: 4200, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1700, length: 3600, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'evo 280': [
        { name: '1-й просеивающий', width: 1600, length: 3900, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1600, length: 3300, pitch: 35, convType: '3x', sideMargin: 115 }
    ],
    'evo 290': [
        { name: '1-й просеивающий', width: 1600, length: 4000, pitch: 40, convType: '3x', sideMargin: 115 },
        { name: '2-й просеивающий', width: 1600, length: 3400, pitch: 35, convType: '3x', sideMargin: 115 }
    ],

    // Ropa
    'keiler 1': [
        { name: '1-й просеивающий', width: 800, length: 2800, pitch: 36, convType: '2x', sideMargin: 130 },
        { name: '2-й просеивающий', width: 800, length: 2600, pitch: 32, convType: '2x', sideMargin: 130 }
    ],
    'keiler 2': [
        { name: '1-й просеивающий (основной)', width: 1500, length: 3800, pitch: 40, convType: '3x', sideMargin: 130 },
        { name: '2-й просеивающий', width: 1500, length: 3400, pitch: 36, convType: '3x', sideMargin: 130 }
    ],
    'tiger 6': [
        { name: 'Основной просеивающий транспортер', width: 1700, length: 4200, pitch: 40, convType: '3x', sideMargin: 130 },
        { name: 'Погрузочный транспортер', width: 1000, length: 4500, pitch: 50, convType: '2x', sideMargin: 130 }
    ],
    'tiger 6s': [
        { name: 'Основной просеивающий транспортер', width: 1700, length: 4200, pitch: 40, convType: '3x', sideMargin: 130 },
        { name: 'Погрузочный транспортер', width: 1000, length: 4500, pitch: 50, convType: '2x', sideMargin: 130 }
    ],
    'panther 2': [
        { name: 'Основной просеивающий транспортер', width: 1600, length: 3900, pitch: 40, convType: '3x', sideMargin: 130 }
    ],
    'panther 2s': [
        { name: 'Основной просеивающий транспортер', width: 1600, length: 3900, pitch: 40, convType: '3x', sideMargin: 130 }
    ],
    'maus 5': [
        { name: 'Приемный транспортер', width: 1000, length: 5000, pitch: 50, convType: '2x', sideMargin: 130 }
    ],
    'maus 6': [
        { name: 'Приемный транспортер', width: 1000, length: 5000, pitch: 50, convType: '2x', sideMargin: 130 }
    ],

    // Dewulf
    'kwatro': [
        { name: '1-й просеивающий (основной)', width: 1760, length: 4200, pitch: 40, convType: '4x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 1760, length: 3900, pitch: 36, convType: '4x', sideMargin: 126 }
    ],
    'torro': [
        { name: '1-й просеивающий', width: 800, length: 2900, pitch: 36, convType: '2x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 800, length: 2600, pitch: 32, convType: '2x', sideMargin: 126 }
    ],
    'ra3060': [
        { name: '1-й просеивающий', width: 1650, length: 3900, pitch: 40, convType: '3x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 1650, length: 3500, pitch: 36, convType: '3x', sideMargin: 126 }
    ],
    'r3060': [
        { name: '1-й просеивающий', width: 1650, length: 3900, pitch: 40, convType: '3x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 1650, length: 3500, pitch: 36, convType: '3x', sideMargin: 126 }
    ],
    'enduro': [
        { name: '1-й просеивающий', width: 1650, length: 4000, pitch: 40, convType: '3x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 1650, length: 3500, pitch: 36, convType: '3x', sideMargin: 126 }
    ],
    'zeno': [
        { name: '1-й просеивающий', width: 800, length: 2800, pitch: 36, convType: '2x', sideMargin: 126 }
    ],
    'r2060': [
        { name: '1-й просеивающий', width: 1650, length: 3800, pitch: 40, convType: '3x', sideMargin: 126 },
        { name: '2-й просеивающий', width: 1650, length: 3400, pitch: 36, convType: '3x', sideMargin: 126 }
    ],
    'r1060': [
        { name: '1-й просеивающий', width: 800, length: 2800, pitch: 36, convType: '2x', sideMargin: 126 }
    ],

    // AVR
    'puma 3': [
        { name: '1-й просеивающий', width: 1700, length: 4000, pitch: 40, convType: '3x', sideMargin: 120 },
        { name: '2-й просеивающий', width: 1700, length: 3600, pitch: 35, convType: '3x', sideMargin: 120 }
    ],
    'puma 4': [
        { name: '1-й просеивающий', width: 1700, length: 4000, pitch: 40, convType: '3x', sideMargin: 120 },
        { name: '2-й просеивающий', width: 1700, length: 3600, pitch: 35, convType: '3x', sideMargin: 120 }
    ],
    'spirit 5200': [
        { name: '1-й просеивающий', width: 800, length: 2800, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'spirit 7200': [
        { name: '1-й просеивающий', width: 800, length: 2900, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'spirit 9200': [
        { name: '1-й просеивающий', width: 1600, length: 3800, pitch: 40, convType: '3x', sideMargin: 120 },
        { name: '2-й просеивающий', width: 1600, length: 3400, pitch: 35, convType: '3x', sideMargin: 120 }
    ],
    'spirit 6100': [
        { name: '1-й просеивающий', width: 800, length: 2800, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'spirit 6200': [
        { name: '1-й просеивающий', width: 800, length: 2900, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'spirit 8200': [
        { name: '1-й просеивающий', width: 1600, length: 3800, pitch: 40, convType: '3x', sideMargin: 120 }
    ],

    // Holmer
    'terra dos t4-30': [
        { name: 'Просеивающий транспортер', width: 1000, length: 4200, pitch: 50, convType: '2x', sideMargin: 120 }
    ],
    'terra dos t4-40': [
        { name: 'Просеивающий транспортер', width: 1000, length: 4200, pitch: 50, convType: '2x', sideMargin: 120 }
    ],
    'terra felis 3': [
        { name: 'Приемный транспортер', width: 1000, length: 4800, pitch: 50, convType: '2x', sideMargin: 120 }
    ],

    // Wühlmaus
    '1033': [
        { name: '1-й просеивающий', width: 750, length: 2500, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    '1633': [
        { name: '1-й просеивающий', width: 750, length: 2800, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    '2011': [
        { name: '1-й просеивающий', width: 1500, length: 3500, pitch: 40, convType: '3x', sideMargin: 120 }
    ],
    '2411': [
        { name: '1-й просеивающий', width: 1500, length: 3800, pitch: 40, convType: '3x', sideMargin: 120 }
    ],

    // Amac
    'zm2': [
        { name: 'Просеивающий транспортер', width: 750, length: 2600, pitch: 36, convType: '2x', sideMargin: 120 }
    ],
    'zm4': [
        { name: 'Просеивающий транспортер', width: 1500, length: 3600, pitch: 40, convType: '3x', sideMargin: 120 }
    ],
    'ax2': [
        { name: 'Просеивающий транспортер', width: 750, length: 2600, pitch: 36, convType: '2x', sideMargin: 120 }
    ],
    'g2': [
        { name: 'Просеивающий транспортер', width: 750, length: 2600, pitch: 36, convType: '2x', sideMargin: 120 }
    ],

    // Kverneland
    'un 3100': [
        { name: '1-й просеивающий', width: 750, length: 2400, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'un 3200': [
        { name: '1-й просеивающий', width: 750, length: 2800, pitch: 35, convType: '2x', sideMargin: 120 }
    ],
    'minos': [
        { name: '1-й просеивающий', width: 800, length: 2600, pitch: 36, convType: '2x', sideMargin: 120 }
    ]
};

window.CatalogStep1 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const cats = window.catalogCategories || [];

        const brandOptions = Object.keys(HARVESTER_BRANDS).map(b => `<option value="${b}">`).join('');
        const selectedBrandName = Object.keys(HARVESTER_BRANDS).find(b => b.toLowerCase() === (s.brand || '').toLowerCase().trim());
        const modelList = selectedBrandName ? HARVESTER_BRANDS[selectedBrandName] : [];
        const modelOptions = modelList.map(m => `<option value="${m}">`).join('');
        
        let nodeSelectionHtml = '';
        const modelKey = (s.model || '').toLowerCase().trim();
        const nodes = (window.MODEL_DIMENSIONS && window.MODEL_DIMENSIONS[modelKey]) ? window.MODEL_DIMENSIONS[modelKey] : null;
        if (nodes && Array.isArray(nodes)) {
            nodeSelectionHtml = `
                <div style="background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.1); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <label style="font-size:0.6rem; color:#888; text-transform:uppercase; font-weight:900; margin-bottom:10px; display:block;">
                        <i class="fa-solid fa-layer-group" style="color:var(--brand-red); margin-right:5px;"></i> Узлы транспортера в справочнике (выберите для автозаполнения размеров):
                    </label>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${nodes.map((n, idx) => {
                            const active = s.harvesterNode === n.name;
                            return `
                                <div onclick="window.CatalogStep1.selectNode(${idx})" style="cursor:pointer; padding:6px 12px; border-radius:8px; font-size:0.7rem; font-weight:800; border:1px solid ${active?'var(--brand-red)':'#181818'}; background:${active?'rgba(226,31,38,0.1)':'#080808'}; color:${active?'#fff':'#aaa'}; transition:0.2s; display:flex; align-items:center; gap:8px;">
                                    <i class="fa-solid ${active?'fa-square-check':'fa-square'}" style="color:${active?'var(--brand-red)':'#444'};"></i>
                                    <div>
                                        <span style="display:block; font-weight:900; color:#fff;">${n.name}</span>
                                        <span style="display:block; font-size:0.55rem; color:#666; margin-top:2px;">${n.width}x${n.length} ш.${n.pitch} (${n.convType})</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="step-panel animate-fade-in" style="max-width:1100px; margin:0 auto;">
                <div class="panel glass-panel" style="padding:20px; border-radius:15px; border:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.2);">
                    <!-- СТРОКА 1: АРТИКУЛ, ГОД, РАЗДЕЛ -->
                    <div style="display:grid; grid-template-columns: 180px 100px 1fr; gap:15px; margin-bottom:15px;">
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Артикул:</label>
                            <div style="display:flex; gap:5px;">
                                <input type="text" id="m-art-1" value="${s.art || ''}" class="form-control" style="font-weight:700; height:32px; font-size:0.85rem; background:#000; border:1px solid #222;" oninput="window.CatalogStep1.set('art', this.value)">
                                <button onclick="window.CatalogStep1.genArt()" class="btn btn-secondary" style="width:32px; height:32px; padding:0; border-radius:6px;"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--brand-red); font-size:0.75rem;"></i></button>
                            </div>
                            <div style="font-size:0.6rem; color:#666; margin-top:3px; line-height:1.2;">Уникальный код. Нажмите 🪄 для автокода. (Обязательно)</div>
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Год:</label>
                            <input type="number" value="${s.year || 2026}" class="form-control" style="height:32px; font-weight:700; font-size:0.85rem; background:#000; border:1px solid #222; text-align:center;" oninput="window.CatalogStep1.set('year', this.value)">
                            <div style="font-size:0.6rem; color:#666; margin-top:3px; line-height:1.2;">Год разработки. (Обязательно)</div>
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Раздел справочника:</label>
                            <select class="form-control" style="height:32px; font-weight:700; font-size:0.8rem; background:#000; border:1px solid #222;" onchange="window.CatalogStep1.set('category', this.value)">
                                ${cats.map(c => `<option value="${c.id}" ${s.category===c.id?'selected':''}>${c.name}</option>`).join('')}
                            </select>
                            <div style="font-size:0.6rem; color:#666; margin-top:3px; line-height:1.2;">Тип конвейера для группировки в базе. (Обязательно)</div>
                        </div>
                    </div>
                    <!-- СТРОКА 2: НАЗВАНИЕ, БРЕНД, МОДЕЛЬ -->
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div style="background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;">
                            <label style="font-size:0.7rem; color:#aaa; text-transform:uppercase; font-weight:900; margin-bottom:8px; display:block;">
                                <i class="fa-solid fa-signature" style="color:var(--brand-red); margin-right:5px;"></i> Полное название (автоназвание):
                            </label>
                            <input type="text" id="m1-full-name" value="${s.name || ''}" class="form-control" style="height:38px; font-weight:700; font-size:0.9rem; background:#000; border:1px solid #222; border-radius:8px; padding-left:12px; color:#fff;" oninput="window.CatalogStep1.onNameInput(this.value)" placeholder="Генерируется автоматически...">
                            <div style="font-size:0.6rem; color:#555; margin-top:5px; line-height:1.2;">Официальное наименование для накладных и КП. Генерируется на лету.</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
                            <label style="font-size:0.7rem; color:#aaa; text-transform:uppercase; font-weight:900; margin-bottom:8px; display:block;">
                                <i class="fa-solid fa-industry" style="color:var(--brand-red); margin-right:5px;"></i> Производитель (Бренд):
                            </label>
                            <div style="position:relative; width:100%;">
                                <input type="text" id="m1-brand-input" value="${s.brand || ''}" class="form-control" style="height:38px; font-weight:700; font-size:0.95rem; background:#000; border:1px solid #222; border-radius:8px; padding-left:12px; color:#fff; width:100%; box-sizing:border-box;" oninput="window.CatalogStep1.onBrandInput(this.value)" onfocus="window.CatalogStep1.showBrandDropdown()" onblur="window.CatalogStep1.hideBrandDropdown()" placeholder="Выберите бренд...">
                                <div id="m1-brand-dropdown" class="custom-dropdown hidden"></div>
                            </div>
                            <div style="font-size:0.6rem; color:#555; margin-top:5px; line-height:1.2;">Марка сельхозмашины. (Обязательно)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
                            <label style="font-size:0.7rem; color:#aaa; text-transform:uppercase; font-weight:900; margin-bottom:8px; display:block;">
                                <i class="fa-solid fa-truck-monster" style="color:var(--brand-red); margin-right:5px;"></i> Модель техники:
                            </label>
                            <div style="position:relative; width:100%;">
                                <input type="text" id="m1-model-input" value="${s.model || ''}" class="form-control" style="height:38px; font-weight:700; font-size:0.95rem; background:#000; border:1px solid #222; border-radius:8px; padding-left:12px; color:#fff; width:100%; box-sizing:border-box;" oninput="window.CatalogStep1.onModelInput(this.value)" onfocus="window.CatalogStep1.showModelDropdown()" onblur="window.CatalogStep1.hideModelDropdown()" placeholder="Выберите или введите...">
                                <div id="m1-model-dropdown" class="custom-dropdown hidden"></div>
                            </div>
                            <div style="font-size:0.6rem; color:#555; margin-top:5px; line-height:1.2;">Конкретная модель комбайна. (Обязательно)</div>
                        </div>
                    </div>
                    ${nodeSelectionHtml}

                    <!-- СВОЙ ТРАНСПОРТЕР -->
                    <div style="background: rgba(226,31,38,0.02); border: 1px dashed rgba(226,31,38,0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 0.8rem; font-weight: 900; color: #fff; text-transform: uppercase;">Собрать свой транспортер</div>
                            <div style="font-size: 0.6rem; color: #aaa; margin-top: 3px;">Создать транспортер с произвольными размерами без выбора из справочника моделей</div>
                        </div>
                        <button onclick="window.CatalogStep1.setupCustomConveyor()" class="btn btn-secondary" style="height: 38px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px; background: #0c0c0c; border: 1px solid var(--brand-red); color: #fff; padding: 0 20px;">
                            <i class="fa-solid fa-screwdriver-wrench" style="margin-right: 8px; color: var(--brand-red);"></i> СОЗДАТЬ СВОЙ ТРАНСПОРТЕР
                        </button>
                    </div>

                    <!-- СТРОКА 3: КУЛЬТУРЫ (PILLS) -->
                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:8px; display:block;">Применимость (обрабатываемые сельхозкультуры):</label>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${dicts.crops.map(crop => {
                                const active = s.crops.includes(crop);
                                return `<div onclick="window.CatalogStep1.toggleCrop('${crop}')" style="cursor:pointer; padding:4px 10px; border-radius:6px; font-size:0.65rem; font-weight:800; border:1px solid ${active?'var(--brand-red)':'#181818'}; background:${active?'rgba(226,31,38,0.1)':'#000'}; color:${active?'#fff':'#444'}; transition:0.2s;">${crop}</div>`;
                            }).join('')}
                        </div>
                        <div style="font-size:0.6rem; color:#666; margin-top:3px; line-height:1.2;">Укажите обрабатываемые культуры. Облегчает фильтрацию. (Не обязательно)</div>
                    </div>

                    <!-- СТРОКА 4: ФОТО -->
                    <div class="form-group">
                        <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Ссылка на фото:</label>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="text" value="${s.photo || ''}" class="form-control" style="height:32px; font-size:0.75rem; background:#000; border:1px solid #222; flex:1;" oninput="window.CatalogStep1.set('photo', this.value)">
                            ${s.photo ? `<img src="${s.photo}" style="height:32px; width:45px; object-fit:cover; border-radius:4px; border:1px solid #222;">` : ''}
                        </div>
                        <div style="font-size:0.6rem; color:#666; margin-top:3px; line-height:1.2;">URL-ссылка или локальный путь к изображению изделия. (Не обязательно)</div>
                    </div>

                </div>
            </div>
            
            <style>
                .custom-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                    background: #0e0e0e;
                    border: 1px solid #222;
                    border-radius: 8px;
                    z-index: 9999;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.85);
                    margin-top: 5px;
                }
                .custom-dropdown::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-dropdown::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 3px;
                }
                .custom-dropdown-item {
                    padding: 10px 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #bbb;
                    cursor: pointer;
                    transition: 0.2s;
                    border-bottom: 1px solid #181818;
                    text-align: left;
                }
                .custom-dropdown-item:hover {
                    background: var(--brand-red);
                    color: #fff;
                }
                .custom-dropdown.hidden {
                    display: none;
                }
            </style>
        `;
    },
    set(k, v) {
        window.CatalogState[k] = v;
        if (k === 'brand') {
            delete window.CatalogState.sideBeltType;
            delete window.CatalogState.centralBeltType;
            delete window.CatalogState.sideBeltWidth;
            delete window.CatalogState.centralBeltWidth;
            delete window.CatalogState.sideBeltThickness;
            delete window.CatalogState.centralBeltThickness;
            delete window.CatalogState.sideHoleDist;
            delete window.CatalogState.centralHoleDist;
            delete window.CatalogState.sideHoleDiam;
            delete window.CatalogState.centralHoleDiam;
            delete window.CatalogState.sideMargin;
        }
        window.CatalogManager.syncReport();
    },
    onBrandInput(val) {
        this.set('brand', val);
        delete window.CatalogState.harvesterNode;
        this.updateAutoName();
        this.showBrandDropdown();
    },
    onModelInput(val) {
        this.set('model', val);
        delete window.CatalogState.harvesterNode;
        this.updateAutoName();
        this.showModelDropdown();

        // Автозаполнение первым узлом при точном совпадении введенной модели
        const modelKey = val.toLowerCase().trim();
        if (window.MODEL_DIMENSIONS && window.MODEL_DIMENSIONS[modelKey]) {
            this.selectNode(0);
        }
    },
    onNameInput(val) {
        window.CatalogState.name = val;
        window.CatalogState.userOverrodeName = (val.trim() !== ''); // Замок авто-обновления, если ввели вручную
        window.CatalogManager.syncReport();
    },
    showBrandDropdown() {
        const val = (window.CatalogState.brand || '').toLowerCase();
        const brands = Object.keys(HARVESTER_BRANDS).filter(b => b.toLowerCase().includes(val));
        const el = document.getElementById('m1-brand-dropdown');
        if (el) {
            el.innerHTML = brands.map(b => `<div class="custom-dropdown-item" onmousedown="window.CatalogStep1.selectBrand('${b}')"><i class="fa-solid fa-file-circle-check" style="color:var(--brand-red); margin-right:8px;"></i>${b}</div>`).join('');
            el.classList.remove('hidden');
        }
    },
    hideBrandDropdown() {
        const el = document.getElementById('m1-brand-dropdown');
        if (el) el.classList.add('hidden');
    },
    selectBrand(b) {
        const input = document.getElementById('m1-brand-input');
        if (input) input.value = b;
        this.onBrandInput(b);
        this.hideBrandDropdown();
    },
    showModelDropdown() {
        const brandVal = (window.CatalogState.brand || '').trim();
        const selectedBrandName = Object.keys(HARVESTER_BRANDS).find(b => b.toLowerCase() === brandVal.toLowerCase());
        const modelList = selectedBrandName ? HARVESTER_BRANDS[selectedBrandName] : [];
        
        const modelVal = (window.CatalogState.model || '').toLowerCase();
        const filteredModels = modelList.filter(m => m.toLowerCase().includes(modelVal));
        
        const el = document.getElementById('m1-model-dropdown');
        if (el) {
            if (filteredModels.length > 0) {
                el.innerHTML = filteredModels.map(m => `<div class="custom-dropdown-item" onmousedown="window.CatalogStep1.selectModel('${m}')"><i class="fa-solid fa-file-circle-check" style="color:var(--brand-red); margin-right:8px;"></i>${m}</div>`).join('');
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    },
    hideModelDropdown() {
        const el = document.getElementById('m1-model-dropdown');
        if (el) el.classList.add('hidden');
    },
    selectModel(m) {
        const input = document.getElementById('m1-model-input');
        if (input) input.value = m;
        this.onModelInput(m);
        this.hideModelDropdown();
    },
    selectNode(idx) {
        const s = window.CatalogState;
        const modelKey = (s.model || '').toLowerCase().trim();
        const nodes = (window.MODEL_DIMENSIONS && window.MODEL_DIMENSIONS[modelKey]) ? window.MODEL_DIMENSIONS[modelKey] : null;
        if (nodes && nodes[idx]) {
            const dims = nodes[idx];
            s.harvesterNode = dims.name;
            s.width = dims.width.toString();
            s.length = dims.length.toString();
            s.pitch = dims.pitch.toString();
            s.convType = dims.convType;
            s.sideMargin = dims.sideMargin;
            
            // Если в базе явно задан тип стыка и нахлест, берем их
            if (dims.connectionType || dims.connection_type) {
                s.connectionType = dims.connectionType || dims.connection_type;
            }
            if (dims.connectionOverlapSteps !== undefined || dims.connection_overlap_steps !== undefined) {
                s.connectionOverlapSteps = parseInt(dims.connectionOverlapSteps !== undefined ? dims.connectionOverlapSteps : dims.connection_overlap_steps) || 0;
            }
            
            // Расчет количества прутков с учетом стыка
            const hasOverlap = (s.connectionType === 'vulcanization' || s.connectionType === 'vulcanization_cold' || s.connectionType === 'vulcanization_hot' || s.connectionType === 'screws');
            const overlap = hasOverlap ? (parseInt(s.connectionOverlapSteps) || 6) : 0;
            const computedRods = Math.round(dims.length / dims.pitch) - overlap;
            s.rodsCount = (dims.rodsCount || dims.rods_count || computedRods).toString();
            
            // Сбрасываем кэш ремней
            delete s.sideBeltType;
            delete s.centralBeltType;
            delete s.sideBeltWidth;
            delete s.centralBeltWidth;
            delete s.sideBeltThickness;
            delete s.centralBeltThickness;
            delete s.sideHoleDist;
            delete s.centralHoleDist;
            delete s.sideHoleDiam;
            delete s.centralHoleDiam;

            if (window.showToast) {
                window.showToast(`Выбран узел: ${dims.name} (${dims.width}x${dims.length} ш.${dims.pitch})`, "success");
            }
            this.updateAutoName();
            window.CatalogManager.refreshStep();
            window.CatalogManager.syncReport();
        }
    },
    updateAutoName() {
        const s = window.CatalogState;
        if (s.userOverrodeName) return;

        const brand = (s.brand || '').trim();
        const model = (s.model || '').trim();
        const node = (s.harvesterNode || '').trim();
        const crops = s.crops && s.crops.length > 0 ? s.crops.join('/') : '';
        
        const L = s.length ? `${s.length}мм` : '';
        const W = s.width ? `${s.width}мм` : '';
        const P = s.pitch ? `ш.${s.pitch}` : '';
        
        let geom = [W, L, P].filter(Boolean).join('x');
        if (geom) geom = `(${geom})`;
        
        let parts = [
            'Транспортер',
            brand,
            model,
            node ? `(${node})` : '',
            geom,
            crops ? `[${crops}]` : ''
        ].filter(Boolean);
        
        const autoName = parts.join(' ');
        s.name = autoName;

        const el = document.getElementById('m1-full-name');
        if (el) el.value = autoName;
    },
    toggleCrop(c) {
        const s = window.CatalogState;
        const idx = s.crops.indexOf(c);
        if(idx > -1) s.crops.splice(idx,1);
        else s.crops.push(c);
        this.updateAutoName();
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },
    genArt() {
        const art = '100.' + Math.floor(10000 + Math.random() * 90000);
        const el = document.getElementById('m-art-1');
        if(el) el.value = art;
        this.set('art', art);
    },
    setupCustomConveyor() {
        const s = window.CatalogState;
        s.brand = 'Свой';
        s.model = 'Индивидуальный заказ';
        s.harvesterNode = 'Свободный размер';
        s.width = '800';
        s.length = '3000';
        s.pitch = '40';
        s.convType = '2x';
        s.sideMargin = 120;
        s.rodsCount = '69'; // 3000 / 40 - 6 стык
        s.connectionType = 'screws';
        s.connectionOverlapSteps = 6;
        s.category = 'other';
        s.crops = [];
        
        if (!s.art) {
            s.art = '100.' + Math.floor(10000 + Math.random() * 90000);
        }

        this.updateAutoName();

        if (window.showToast) {
            window.showToast("🚀 Создан пользовательский шаблон! Введите точные размеры на Шаге 2.", "success");
        }

        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
        
        setTimeout(() => {
            window.CatalogState.step = 2;
            window.CatalogManager.render();
        }, 300);
    }
};
