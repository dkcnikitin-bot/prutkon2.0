/*
 * printer.js - ПРУТКОН ОС | Модуль генерации печатных форм (v18.0.0 «Platinum Industrial»)
 * Авторский дизайн: Индустриальный минимализм с премиальной типографикой
 */

(function(window) {
    const Printer = {
        config: JSON.parse(localStorage.getItem('prutkon_printer_config')) || {
            companyName: 'ООО "ПРУТКОН"',
            inn: '7700000000',
            kpp: '770001001',
            address: 'РФ, 127000, Москва, Промзона "Север", д.1',
            bankName: 'АО "АЛЬФА-БАНК"',
            bik: '044525593',
            rs: '40702810000000000000',
            ks: '30101810200000000593',
            terms: 'Оплата данного счета означает согласие с условиями поставки товара. Срок изготовления 15 рабочих дней.'
        },

        // Штамп ЭЦП ПРЕМИУМ
        generateStamp(doc) {
            if (!doc.signedBy) return '<div style="color:#ddd; font-size:10px; border:1px dashed #aaa; padding:15px; text-align:center; border-radius:4px; background:#f9f9f9; font-weight:bold;">ОЖИДАЕТСЯ ВАЛИДАЦИЯ ЭЦП</div>';
            return `
                <div class="ep-stamp" style="border: 2px solid #ed1c24; border-radius: 8px; padding: 12px; width: 280px; color: #000; font-family: 'Outfit', sans-serif; background: #fff; position: relative; box-shadow: 5px 5px 15px rgba(0,0,0,0.05); border-left: 8px solid #ed1c24; overflow:hidden;">
                    <div style="position: absolute; right: -15px; bottom: -5px; font-size: 60px; font-weight: 900; color: rgba(237, 28, 36, 0.04); transform: rotate(-15deg); pointer-events: none; user-select:none;">VALID</div>
                    <div style="font-weight:900; font-size:11px; text-transform:uppercase; border-bottom:2px solid #ed1c24; margin-bottom:8px; display: flex; align-items: center; gap: 6px; color:#ed1c24; letter-spacing:0.5px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        ПОДЛИННОСТЬ ПОДТВЕРЖДЕНА
                    </div>
                    <div style="font-size:11px; margin-bottom:4px;">Владелец: <strong>${doc.signedBy}</strong></div>
                    <div style="font-size:10px; margin-bottom:4px; color:#555;">Должность: <strong>${doc.signedPosition || 'Руководитель подразделения'}</strong></div>
                    <div style="font-size:10px; margin-bottom:8px; font-family:'JetBrains Mono'; opacity:0.6;">S/N: ${doc.signHash || '---'}</div>
                    <div style="font-size:9px; font-weight:700; color:#ed1c24; letter-spacing:0.5px; border-top:1px solid #f0f0f0; padding-top:6px;">ПРУТКОН ОС SECURE CLOUD: ${doc.signedAt}</div>
                </div>
            `;
        },

        generate(type, orderId) {
            const registry = JSON.parse(localStorage.getItem('prutkon_doc_registry')) || [];
            const typeMap = {
                'bill': 'Счет',
                'ttn': 'ТТН',
                'production_order': 'Наряд',
                'kp_calc': 'Калькуляция КП',
                'eng_calc': 'Инженерный расчет'
            };
            const docType = typeMap[type] || 'Счет';
            const doc = registry.find(d => String(d.orderId) === String(orderId) && d.type === docType) || { orderId: orderId };
            let order = (window.orders || []).find(o => String(o.id) === String(orderId));
            
            if (!order) {
                order = {
                    id: doc.orderId || orderId,
                    date: doc.date || new Date().toLocaleDateString('ru-RU'),
                    clientName: doc.client || 'Не указан',
                    total: doc.sum || 0,
                    items: doc.items || []
                };
            }

            const printWindow = window.open('', '_blank');
            const html = this.buildLayout(type, doc, order);
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${type.toUpperCase()} - ПРУТКОН ОС</title>
                        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            @page { size: A4; margin: 0; }
                            body { margin: 0; padding: 0; background: #e5e9f0; font-family: 'Inter', 'Outfit', sans-serif; -webkit-print-color-adjust: exact; color: #000; }
                            .page { 
                                width: 210mm; height: 297mm; padding: 18mm; margin: 10mm auto; background: #fff; 
                                position: relative; overflow: hidden; box-sizing: border-box;
                                box-shadow: 0 15px 35px rgba(0,0,0,0.1); border-radius: 8px;
                            }
                            .page::before {
                                content: ""; position:absolute; top:0; right:0; width: 400px; height: 400px;
                                background: linear-gradient(135deg, transparent 70%, rgba(237, 28, 36, 0.02) 70.1%);
                                z-index:0; pointer-events:none;
                            }
                            .watermark {
                                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                                font-size: 110px; font-weight: 900; color: rgba(0,0,0,0.015); z-index:0; pointer-events:none; text-transform:uppercase;
                            }
                            .content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                            th { background: #111; color: #fff; text-transform: uppercase; font-size: 10px; font-weight: 900; padding: 10px 8px; text-align: center; border: 1px solid #111; letter-spacing:0.5px; }
                            td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 11px; }
                            .brand-border { position: absolute; left:0; top:0; bottom:0; width: 4mm; background: #ed1c24; }
                            @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; border-radius: 0; } }
                        </style>
                    </head>
                    <body>
                        ${html}
                        <script>window.print();<\/script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        },

        buildLayout(type, doc, order) {
            const items = doc.items || order.items || [];
            const timestamp = doc.date || order.date || new Date().toLocaleDateString('ru-RU');
            const total = doc.sum || order.total || 0;
            const vat = total * 0.22 / 1.22;

            const findDrawingForArticle = (art, name) => {
                if (!art && !name) return '';
                
                // 1. Search in dbProducts (Price list products)
                if (window.dbProducts) {
                    const p = window.dbProducts.find(x => (x.art && String(x.art) === String(art)) || (x.name && String(x.name) === String(name)));
                    if (p && (p.drawing || p.photo)) return p.drawing || p.photo;
                }
                
                // 2. Search in dbDirectories (Directories)
                if (window.dbDirectories) {
                    const d = window.dbDirectories.find(x => (x.art_prutkon && String(x.art_prutkon) === String(art)) || (x.name && String(x.name) === String(name)));
                    if (d && (d.drawing || d.photo)) return d.drawing || d.photo;
                }
                
                // 3. Search in rods registry
                let rodsObj = {};
                try {
                    const raw = localStorage.getItem('prutkon_rods_registry');
                    if (raw) rodsObj = JSON.parse(raw);
                } catch(e) {}
                if (window.db) {
                    const RODS_KEYS = ['rods_metal', 'rods_blanks', 'rods_standard', 'rods_bent', 'rods_rubber', 'rods_double'];
                    RODS_KEYS.forEach(k => {
                        if (window.db[k] && Array.isArray(window.db[k])) rodsObj[k] = window.db[k];
                    });
                }
                
                const lists = [rodsObj.rods_standard, rodsObj.rods_bent, rodsObj.rods_rubber, rodsObj.rods_double];
                for (let list of lists) {
                    if (list && Array.isArray(list)) {
                        const found = list.find(x => (x.article && String(x.article) === String(art)) || (x.name && String(x.name) === String(name)));
                        if (found && (found.drawing || found.photo)) return found.drawing || found.photo;
                    }
                }
                
                return '';
            };

            if (type === 'production_order') {
                const itemsRows = items.map((it, idx) => {
                    const drawing = findDrawingForArticle(it.art, it.name);
                    const imgHtml = drawing 
                        ? `<img src="${drawing}" style="max-height:85px; max-width:140px; object-fit:contain; border:1px solid #ddd; padding:2px; border-radius:4px; background:#fff;">`
                        : `<div style="font-size:10px; color:#aaa; font-style:italic;">Чертеж отсутствует</div>`;
                    
                    return `
                        <tr style="${idx % 2 === 0 ? 'background:#fcfcfc;' : ''}">
                            <td style="text-align:center; font-family:'JetBrains Mono';">${idx + 1}</td>
                            <td style="font-weight:700; font-size:12px;">${it.name}</td>
                            <td style="text-align:center; font-family:'JetBrains Mono'; opacity:0.8;">
                                <strong>${it.art || '---'}</strong>
                                ${it.stroke ? `<div style="font-size:10px; color:#555; margin-top:3px;">Ход: ${it.stroke} мм</div>` : ''}
                            </td>
                            <td style="text-align:center; font-weight:900; font-size:13px; font-family:'JetBrains Mono';">${it.qty} шт</td>
                            <td style="text-align:center; padding:5px;">${imgHtml}</td>
                        </tr>
                    `;
                }).join('');

                return `
                <div class="page">
                    <div class="brand-border" style="background:#555;"></div>
                    <div class="watermark" style="color:rgba(0,0,0,0.015);">PRODUCTION</div>
                    <div class="content">
                        
                        <!-- HEADER -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:4px solid #555; padding-bottom:20px;">
                            <img src="logo.png" style="height:70px; object-fit:contain;" onerror="this.style.display='none'">
                            <div style="text-align:right;">
                                <div style="font-size:10px; color:#555; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:5px;">ПРОИЗВОДСТВЕННЫЙ ОТДЕЛ</div>
                                <h1 style="margin:0; font-size:32px; font-weight:900; color:#1a1d21;">ЗАКАЗ-НАРЯД</h1>
                                <div style="font-size:20px; font-weight:400; font-family:'JetBrains Mono';">НАРЯД <strong>№ ${order.id}</strong></div>
                                <div style="font-size:13px; margin-top:5px; opacity:0.6;">ОТ ${timestamp}</div>
                            </div>
                        </div>

                        <!-- META INFO -->
                        <table style="margin-bottom:30px; border:none;">
                            <tr>
                                <td style="width:50%; border:none; padding:0 20px 0 0; vertical-align:top;">
                                    <div style="font-size:10px; font-weight:900; color:#888; margin-bottom:8px; text-transform:uppercase; border-left:3px solid #555; padding-left:10px;">ТЕХНИЧЕСКИЕ ДАННЫЕ</div>
                                    <div style="font-size:12px; margin:3px 0;">Объект/Кратко: <strong>${order.art || 'Не указан'}</strong></div>
                                    <div style="font-size:12px; margin:3px 0;">Клиент: <strong>${order.clientName || '---'}</strong></div>
                                    <div style="font-size:12px; margin:3px 0;">Статус заказа: <strong>${order.status || 'В производстве'}</strong></div>
                                </td>
                                <td style="width:50%; border:none; padding:0 0 0 20px; vertical-align:top;">
                                    <div style="font-size:10px; font-weight:900; color:#888; margin-bottom:8px; text-transform:uppercase; border-left:3px solid #555; padding-left:10px;">НАЗНАЧЕНИЕ / ОТВЕТСТВЕННЫЕ</div>
                                    <div style="font-size:12px; margin:3px 0;">Цех: <strong>Сборочно-механический</strong></div>
                                    <div style="font-size:12px; margin:3px 0;">Исполнитель: <strong>Мастера смены ОТК</strong></div>
                                    <div style="font-size:12px; margin:3px 0;">Создатель наряда: <strong>${order.responsibleName || 'Оператор ERP'}</strong></div>
                                </td>
                            </tr>
                        </table>

                        <!-- ITEMS GRID -->
                        <table style="flex-grow:1; margin-bottom:20px;">
                            <thead>
                                <tr>
                                    <th style="width:30px; background:#555; border-color:#555;">№</th>
                                    <th style="text-align:left; background:#555; border-color:#555;">Наименование детали</th>
                                    <th style="width:140px; background:#555; border-color:#555;">Артикул / Параметры</th>
                                    <th style="width:80px; background:#555; border-color:#555;">Кол-во</th>
                                    <th style="background:#555; border-color:#555;">Чертеж детали</th>
                                </tr>
                            </thead>
                            <tbody>${itemsRows}</tbody>
                        </table>

                        <!-- WORKORDER FOOTER -->
                        <div style="margin-top:auto; display:grid; grid-template-columns: 1fr 1fr; gap:60px; padding-bottom:10px; border-top:1px solid #ddd; padding-top:20px;">
                            <div>
                                <div style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:10px; letter-spacing:1px;">СДАЛ (МЕНЕДЖЕР)</div>
                                <div style="font-size:12px; margin-top:25px; border-bottom:1px solid #000; width:200px;"></div>
                                <div style="font-size:10px; color:#555; margin-top:5px;">Подпись / Расшифровка подписи</div>
                            </div>
                            <div>
                                <div style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:10px; letter-spacing:1px;">ПРИНЯЛ В ЦЕХУ (МАСТЕР)</div>
                                <div style="font-size:12px; margin-top:25px; border-bottom:1px solid #000; width:200px;"></div>
                                <div style="font-size:10px; color:#555; margin-top:5px;">Подпись / Расшифровка подписи</div>
                            </div>
                        </div>

                        <div style="font-size:9px; color:#aaa; line-height:1.6; padding-top:15px; text-align:center;">
                            ПРУТКОН ОС v${window.DB_VERSION} | Наряд-заказ на производство сформирован автоматически
                        </div>
                    </div>
                </div>`;
            }

            const itemsRows = items.map((it, idx) => `
                <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
                    <td style="text-align:center; font-family:'JetBrains Mono'; font-weight:500;">${idx + 1}</td>
                    <td style="font-weight:700; color:#1e293b; font-size:12px;">${it.name}</td>
                    <td style="text-align:center; font-family:'JetBrains Mono'; opacity:0.8; font-weight:700;">${it.art || '---'}</td>
                    <td style="text-align:center; font-weight:900; font-family:'JetBrains Mono';">${it.qty}</td>
                    <td style="text-align:right; font-family:'JetBrains Mono';">${window.formatCurrency ? window.formatCurrency(it.price) : (parseFloat(it.price || 0).toFixed(2) + " ₽")}</td>
                    <td style="text-align:right; font-weight:900; font-family:'JetBrains Mono';">${window.formatCurrency ? window.formatCurrency(it.qty * it.price) : (parseFloat(it.qty * it.price || 0).toFixed(2) + " ₽")}</td>
                </tr>
            `).join('');

            let metaHtml = '';
            if (type === 'bill') {
                metaHtml = `
                    <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ПОДТВЕРЖДЕННЫЕ РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ</div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; color: #000;">
                        <tr>
                            <td style="border: 1px solid #111; width: 50%; padding: 8px;" colspan="2" rowspan="2">
                                <strong>${this.config.bankName}</strong><br>
                                <span style="font-size: 9px; color: #666; font-style: italic;">Банк получателя</span>
                            </td>
                            <td style="border: 1px solid #111; width: 10%; padding: 8px; font-weight: bold; text-align: center;">БИК</td>
                            <td style="border: 1px solid #111; width: 40%; padding: 8px; font-family: 'JetBrains Mono'; font-weight: bold;">${this.config.bik}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #111; padding: 8px; font-weight: bold; text-align: center;">Сч. №</td>
                            <td style="border: 1px solid #111; padding: 8px; font-family: 'JetBrains Mono'; font-weight: bold;">${this.config.ks}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #111; width: 25%; padding: 8px;">ИНН <strong>${this.config.inn}</strong></td>
                            <td style="border: 1px solid #111; width: 25%; padding: 8px;">КПП <strong>${this.config.kpp}</strong></td>
                            <td style="border: 1px solid #111; padding: 8px; font-weight: bold; text-align: center;" rowspan="2">Сч. №</td>
                            <td style="border: 1px solid #111; padding: 8px; font-family: 'JetBrains Mono'; font-weight: bold;" rowspan="2">${this.config.rs}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #111; padding: 8px;" colspan="2">
                                <strong>${this.config.companyName}</strong><br>
                                <span style="font-size: 9px; color: #666; font-style: italic;">Получатель</span>
                            </td>
                        </tr>
                    </table>

                    <table style="margin-bottom:25px; border:none; width:100%;">
                        <tr style="background:transparent;">
                            <td style="width:50%; border:none; padding:0 20px 0 0; vertical-align:top;">
                                <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ПОСТАВЩИК</div>
                                <div style="font-size:12px; font-weight:900; color:#111;">${this.config.companyName}</div>
                                <div style="font-size:11px; color:#555; line-height:1.4; margin-top:4px;">${this.config.address}</div>
                            </td>
                            <td style="width:50%; border:none; padding:0 0 0 20px; vertical-align:top;">
                                <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ПЛАТЕЛЬЩИК</div>
                                <div style="font-size:14px; font-weight:900; color:#111;">${doc.client || order.clientName || 'ВНУТРЕННИЙ ПОЛУЧАТЕЛЬ'}</div>
                                <div style="font-size:11px; margin-top:4px;">Телефон: <strong>${order.clientPhone || '---'}</strong></div>
                            </td>
                        </tr>
                    </table>
                `;
            } else {
                metaHtml = `
                    <table style="margin-bottom:25px; border:none; width:100%;">
                        <tr style="background:transparent;">
                            <td style="width:50%; border:none; padding:0 20px 0 0; vertical-align:top;">
                                <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ОТПРАВИТЕЛЬ / ПОСТАВЩИК</div>
                                <div style="font-size:13px; font-weight:900; color:#111;">${this.config.companyName}</div>
                                <div style="font-size:11px; margin:4px 0; color:#444;">ИНН: ${this.config.inn} / КПП: ${this.config.kpp}</div>
                                <div style="font-size:11px; color:#666; line-height:1.4;">${this.config.address}</div>
                            </td>
                            <td style="width:50%; border:none; padding:0 0 0 20px; vertical-align:top;">
                                <div style="font-size: 9px; font-weight: 900; color: #888; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #ed1c24; padding-left: 8px;">ПОЛУЧАТЕЛЬ / КЛИЕНТ</div>
                                <div style="font-size:16px; font-weight:900; color:#111;">${doc.client || order.clientName || 'ВНУТРЕННИЙ ПОЛУЧАТЕЛЬ'}</div>
                                <div style="font-size:11px; margin-top:4px; color:#444;">Телефон: <strong>${order.clientPhone || '---'}</strong></div>
                                <div style="font-size:11px; margin-top:8px; padding:4px 8px; background:#f1f5f9; border-radius:4px; display:inline-block; font-weight:700; color:#1e293b;">ERP-ЗАКАЗ: № ${order.id}</div>
                            </td>
                        </tr>
                    </table>
                `;
            }

            return `
            <div class="page">
                <div class="brand-border"></div>
                <div class="watermark">PRUTKON ERP</div>
                <div class="content">
                    
                    <!-- HEADER PLATINUM -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:4px solid #111; padding-bottom:20px;">
                        <img src="logo.png" style="height:70px; object-fit:contain;" onerror="this.style.display='none';">
                        <div style="text-align:right;">
                            <div style="font-size:11px; color:#ed1c24; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:5px;">INDUSTRIAL SOLUTIONS SYSTEM</div>
                            <h1 style="margin:0; font-size:32px; font-weight:900; color:#111;">${type === 'bill' ? 'СЧЕТ-ДОГОВОР' : type === 'ttn' ? 'ТОВАРНАЯ НАКЛАДНАЯ (ТТН)' : type === 'kp_calc' ? 'КАЛЬКУЛЯЦИЯ КП (СМЕТА)' : type === 'eng_calc' ? 'ИНЖЕНЕРНЫЙ РАСЧЕТ' : 'НАРЯД-ЗАКАЗ'}</h1>
                            <div style="font-size:20px; font-weight:400; font-family:'JetBrains Mono';">DOCUMENT <strong>№ ${doc.id || order.id}</strong></div>
                            <div style="font-size:13px; margin-top:5px; opacity:0.6;">ОТ ${timestamp}</div>
                        </div>
                    </div>
 
                    <!-- META COCKPIT OR BILL TABLE -->
                    ${metaHtml}
 
                    <!-- ITEMS GRID -->
                    <table style="flex-grow:0;">
                        <thead>
                            <tr>
                                <th style="width:30px;">№</th>
                                <th style="text-align:left;">Наименование товара (услуги)</th>
                                <th style="width:140px;">Артикул</th>
                                <th style="width:60px;">К-во</th>
                                <th style="width:120px; text-align:right;">Цена</th>
                                <th style="width:140px; text-align:right;">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>${itemsRows}</tbody>
                    </table>
 
                    <!-- TOTALS PLATINUM -->
                    <div style="display:flex; justify-content:flex-end; margin-bottom:30px;">
                        <div style="width:360px; background:#111; color:#fff; padding:20px; border-radius:8px; position:relative; overflow:hidden; box-shadow:0 15px 30px rgba(0,0,0,0.1);">
                            <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:#ed1c24;"></div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px; opacity:0.7;">
                                <span>ИТОГО ЧИСТЫМИ:</span>
                                <span style="font-family:'JetBrains Mono'; font-weight:700;">${window.formatCurrency ? window.formatCurrency(total - vat) : (parseFloat(total - vat).toFixed(2) + " ₽")}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:12px; font-weight:700;">
                                <span style="color:#ed1c24;">НДС (СТАВКА 22%):</span>
                                <span style="font-family:'JetBrains Mono';">${window.formatCurrency ? window.formatCurrency(vat) : (parseFloat(vat).toFixed(2) + " ₽")}</span>
                            </div>
                            <div style="border-top:1px solid #222; padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:18px; font-weight:900; letter-spacing:0.5px;">${type === 'ttn' ? 'ИТОГО К ОТГРУЗКЕ:' : type === 'kp_calc' ? 'ИТОГО ПО КП:' : type === 'eng_calc' ? 'СТОИМОСТЬ РАСЧЕТА:' : 'К ОПЛАТЕ:'}</span>
                                <span style="font-size:20px; font-weight:900; color:#ed1c24; font-family:'Outfit';">${window.formatCurrency ? window.formatCurrency(total) : (parseFloat(total).toFixed(2) + " ₽")}</span>
                            </div>
                        </div>
                    </div>
 
                    <div style="font-size:11px; margin-bottom:40px; border-left:4px solid #ed1c24; padding-left:12px; line-height:1.5; color:#333;">
                        Всего наименований <strong>${items.length}</strong>, на общую сумму <strong>${window.formatCurrency ? window.formatCurrency(total) : (parseFloat(total).toFixed(2) + " ₽")}</strong><br>
                        <span style="font-weight:900; text-transform:uppercase; font-size:10px;">${this.numberToLongString(total)}</span>
                        <div style="margin-top:8px; font-size:10px; color:#666;">${this.config.terms}</div>
                    </div>
 
                    <!-- FOOTER SIGNATURES PLATINUM -->
                    <div style="margin-top:auto; display:grid; grid-template-columns: 1fr 1fr; gap:60px; padding-bottom:15px; border-top:1px solid #f0f0f0; padding-top:20px;">
                        <div>
                            <div style="font-size:9px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:10px; letter-spacing:1px;">ВАЛИДАЦИЯ ЭМИТЕНТА</div>
                            ${this.generateStamp(doc)}
                        </div>
                        <div>
                            <div style="font-size:9px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:10px; letter-spacing:1px;">ПРИЕМКА И КОНТРОЛЬ ОТК</div>
                            <div style="border:1px solid #e2e8f0; border-radius:8px; height:120px; position:relative; display:flex; align-items:center; justify-content:center; background:#fbfbfb; overflow:hidden;">
                                <div style="border: 3px double #002244; color: #002244; font-family: 'Outfit', sans-serif; width: 90px; height: 90px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; line-height: 1.2; text-align: center; transform: rotate(-8deg); opacity: 0.85; user-select:none; z-index:10;">
                                    <div style="font-size: 6px; border-bottom: 1px solid #002244; padding-bottom: 1px; width: 60px; text-transform: uppercase;">ПРУТКОН</div>
                                    <div style="font-size: 10px; font-weight: 900; margin: 1px 0;">ОТК №2</div>
                                    <div style="font-size: 5px; letter-spacing: 0.5px; text-transform: uppercase;">КОНТРОЛЬ ПРОЙДЕН</div>
                                </div>
                            </div>
                        </div>
                    </div>
 
                    <div style="font-size:9px; color:#94a3b8; line-height:1.4; border-top:1px solid #f1f5f9; padding-top:10px;">
                        ЭЛЕКТРОННЫЙ ЮРИДИЧЕСКИЙ ДОКУМЕНТ. Сформировано в автоматизированной системе управления производством ПРУТКОН ОС. Данный документ защищен криптографическими алгоритмами SES и приравнивается к бумажному оригиналу согласно ФЗ №63.
                    </div>
                </div>
            </div>`;
        },
 
        numberToLongString(num) {
            return num + " рублей 00 копеек";
        }
    };
 
    window.Printer = Printer;
    window.printOrderReport = (type, orderId) => {
        const id = orderId || (window.currentCardOrder ? window.currentCardOrder.id : null);
        if(!id) { window.showToast("ОШИБКА: ОБЪЕКТ НЕ ВЫБРАН", "warning"); return; }
        Printer.generate(type, id);
    };
 
    window.printOperationReceipt = (logId = null) => {
        if (!logId) return;
        
        let whLog = window.dbWarehouseLog || [];
        if (whLog.length === 0) {
            try {
                whLog = JSON.parse(localStorage.getItem('prutkon_warehouse_log')) || [];
            } catch(e) {}
        }
        
        let log = whLog.find(l => String(l.id) === String(logId));
        
        // Попытка восстановить/обогатить данные из реестра документов
        let docFromRegistry = null;
        try {
            const registry = JSON.parse(localStorage.getItem('prutkon_doc_registry')) || [];
            docFromRegistry = registry.find(d => String(d.orderId) === `wh_op_${logId}`);
        } catch(e) {}
        
        const signedBy = docFromRegistry ? (docFromRegistry.signedBy || '') : '';
        const signedPosition = docFromRegistry ? (docFromRegistry.signedPosition || '') : '';
        const signedAt = docFromRegistry ? (docFromRegistry.signedAt || '') : '';
        const signHash = docFromRegistry ? (docFromRegistry.signHash || '') : '';
        
        if (!log && docFromRegistry) {
            log = {
                id: logId,
                doc_number: docFromRegistry.id,
                doc_date: docFromRegistry.date,
                supplier: docFromRegistry.client,
                destination: 'Основной склад',
                contract: 'б/д',
                invoice_num: 'б/н',
                carrier: 'Не указан',
                responsible: docFromRegistry.signedBy || 'Не указан',
                items: (docFromRegistry.items || []).map(it => ({
                    name: it.name,
                    id: it.art,
                    qty: it.qty,
                    price: it.price,
                    priceKg: it.price,
                    sumWithVat: it.qty * it.price * 1.22,
                    sumNoVat: it.qty * it.price
                })),
                vat_rate: 1.22
            };
        } else if (log && (!log.items || log.items.length === 0) && docFromRegistry) {
            log.items = (docFromRegistry.items || []).map(it => ({
                name: it.name,
                id: it.art,
                qty: it.qty,
                price: it.price,
                priceKg: it.price,
                sumWithVat: it.qty * it.price * 1.22,
                sumNoVat: it.qty * it.price
            }));
            log.supplier = log.supplier || docFromRegistry.client;
            log.doc_number = log.doc_number || docFromRegistry.id;
            log.doc_date = log.doc_date || docFromRegistry.date;
        }
        
        if (!log) {
            if (window.showToast) window.showToast('Операция не найдена!', 'error');
            return;
        }
        
        const docNumber = log.doc_number || 'ПМ-00000';
        const docDate = log.doc_date ? new Date(log.doc_date).toLocaleDateString('ru-RU') : new Date(log.date || Date.now()).toLocaleDateString('ru-RU');
        const sup = log.supplier || 'Не указан';
        const contract = log.contract || 'б/д';
        const invoiceNum = log.invoice_num || 'б/н';
        const invoiceDate = log.invoice_date ? new Date(log.invoice_date).toLocaleDateString('ru-RU') : '';
        const carrier = log.carrier || 'Не указан';
        const dest = log.destination || 'Основной склад';
        const responsible = log.responsible || 'Не указан';
        const deliveryTotal = parseFloat(log.delivery_cost || 0);
        const delVatType = log.delivery_vat_type || 'no-vat';
        const distMethod = log.delivery_dist_method || 'weight';
        const vatRate = parseFloat(log.vat_rate || 1.22);
        const batch = log.items || [];
        
        const hasBelt = batch.some(item => item.isBelt);
        const totalWeight = Math.round(batch.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;
        const totalBars = batch.reduce((sum, item) => sum + (item.bars_count || 0), 0);
        const totalSumNoVat = Math.round(batch.reduce((sum, item) => sum + (item.sumNoVat || (item.qty * (item.priceKg || item.price || 0))), 0) * 100) / 100;
        const totalSumVat = Math.round(batch.reduce((sum, item) => sum + (item.sumWithVat || ((item.qty * (item.priceKg || item.price || 0)) * (item.vatRate || vatRate))), 0) * 100) / 100;
        
        let printHtml = `
            <html>
            <head>
                <title>Приходный ордер № ${docNumber} - ПРУТКОН</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; background: #e5e9f0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; color: #000; }
                    .page { 
                        width: 210mm; height: 297mm; padding: 12mm; margin: 10mm auto; background: #fff; 
                        position: relative; overflow: hidden; box-sizing: border-box;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.1); border-radius: 8px;
                        display: flex; flex-direction: column;
                    }
                    .sheet-header { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                    .sheet-header td { border: none; padding: 2px; }
                    .document-title { text-align: center; font-size: 16px; font-weight: 900; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit'; border-bottom: 2px solid #000; padding-bottom: 8px; }
                    
                    table.data-grid { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 9px; }
                    table.data-grid th, table.data-grid td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; }
                    table.data-grid th { background: #0f172a; color: #fff; font-weight: 900; text-align: center; text-transform: uppercase; font-size: 8px; border: 1px solid #0f172a; }
                    
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .bold { font-weight: bold; }
                    
                    .sign-strip { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    .sign-strip td { border: none; padding: 4px 0; font-size: 10px; }
                    .sign-line { border-bottom: 1px solid #000; width: 120px; display: inline-block; margin: 0 10px; }
                    
                    @media print {
                        body { background: #fff; margin: 0; padding: 0; }
                        .page { margin: 0; box-shadow: none; border-radius: 0; width: 210mm; height: 297mm; }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <table class="sheet-header">
                        <tr>
                            <td class="bold" style="font-size: 14px; font-family:'Outfit';">ООО "ПРУТКОН"</td>
                            <td class="text-right" style="font-size: 9px; color: #64748b; line-height: 1.3;">
                                Типовая межотраслевая форма № М-4<br>
                                Утверждена постановлением Госкомстата России от 30.10.97 № 71а
                            </td>
                        </tr>
                    </table>
                    
                    <div class="document-title">ПРИХОДНЫЙ ОРДЕР № ${docNumber} от ${docDate}</div>
                    
                    <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; font-size:11px;">
                        <tr>
                            <td style="width: 15%; padding: 6px 0; font-weight: bold; border:none;">Поставщик:</td>
                            <td style="width: 35%; padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;"><strong>${sup}</strong></td>
                            <td style="width: 15%; padding: 6px 0; font-weight: bold; padding-left: 20px; border:none;">Склад:</td>
                            <td style="width: 35%; padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;"><strong>${dest}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; border:none;">Договор:</td>
                            <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;">${contract}</td>
                            <td style="padding: 6px 0; font-weight: bold; padding-left: 20px; border:none;">Сопроводительный док:</td>
                            <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;">Счет-фактура № ${invoiceNum} от ${invoiceDate || '---'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; border:none;">Перевозчик:</td>
                            <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;">${carrier}</td>
                            <td style="padding: 6px 0; font-weight: bold; padding-left: 20px; border:none;">Ответственный:</td>
                            <td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; border-top:none; border-left:none; border-right:none;"><strong>${responsible}</strong></td>
                        </tr>
                    </table>
                    
                    <table class="data-grid">
                        <thead>
                            <tr>
                                <th>№ п/п</th>
                                <th>Наименование, характеристика</th>
                                <th>Номенклатурный номер</th>
                                <th>Код ед. изм.</th>
                                <th>Наименование ед. изм.</th>
                                <th class="text-right">Количество (Вес/Метры)</th>
                                ${hasBelt ? '' : '<th class="text-right">Количество (Прутки)</th>'}
                                <th class="text-right">Цена без НДС, руб.</th>
                                <th class="text-right">Сумма без НДС, руб.</th>
                                <th class="text-right">НДС, %</th>
                                <th class="text-right">Сумма НДС, руб.</th>
                                <th class="text-right">Всего с НДС, руб.</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        batch.forEach((item, index) => {
            const pPriceKg = parseFloat(item.priceKg || item.price || 0);
            const pQty = parseFloat(item.qty || 0);
            const pSumNoVat = Math.round((pQty * pPriceKg) * 100) / 100;
            const pVatRate = parseFloat(item.vatRate || vatRate);
            const pSumWithVat = Math.round((pSumNoVat * pVatRate) * 100) / 100;
            const pVatSum = Math.round((pSumWithVat - pSumNoVat) * 100) / 100;
            const unit = item.isBelt ? 'м.п.' : 'кг';
            const vatPercent = Math.round((pVatRate - 1) * 100);
            
            printHtml += `
                <tr style="${index % 2 === 0 ? 'background:#f8fafc;' : ''}">
                    <td class="text-center">${index + 1}</td>
                    <td style="font-weight:600; color:#1e293b;">${item.name}</td>
                    <td class="text-center bold" style="font-family:'JetBrains Mono';">${item.id || item.art || '---'}</td>
                    <td class="text-center">${item.isBelt ? '006' : '166'}</td>
                    <td class="text-center">${unit}</td>
                    <td class="text-right bold" style="font-family:'JetBrains Mono';">${pQty.toFixed(2)}</td>
                    ${hasBelt ? '' : `<td class="text-right" style="font-family:'JetBrains Mono';">${item.bars_count || 0}</td>`}
                    <td class="text-right" style="font-family:'JetBrains Mono';">${pPriceKg.toFixed(2)}</td>
                    <td class="text-right bold" style="font-family:'JetBrains Mono';">${pSumNoVat.toFixed(2)}</td>
                    <td class="text-right">${vatPercent}%</td>
                    <td class="text-right" style="font-family:'JetBrains Mono';">${pVatSum.toFixed(2)}</td>
                    <td class="text-right bold" style="font-family:'JetBrains Mono';">${pSumWithVat.toFixed(2)}</td>
                </tr>
            `;
        });
        
        const colSpan = hasBelt ? 8 : 9;
        const vatPercentTotal = Math.round((vatRate - 1) * 100);
        const totalVatSum = Math.round((totalSumVat - totalSumNoVat) * 100) / 100;
        
        printHtml += `
                            <tr class="bold" style="background: #f1f5f9;">
                                <td colspan="5" class="text-right">ИТОГО:</td>
                                <td class="text-right" style="font-family:'JetBrains Mono';">${totalWeight.toFixed(2)}</td>
                                ${hasBelt ? '' : `<td class="text-right" style="font-family:'JetBrains Mono';">${totalBars}</td>`}
                                <td></td>
                                <td class="text-right" style="font-family:'JetBrains Mono';">${totalSumNoVat.toFixed(2)}</td>
                                <td class="text-right">${vatPercentTotal}%</td>
                                <td class="text-right" style="font-family:'JetBrains Mono';">${totalVatSum.toFixed(2)}</td>
                                <td class="text-right" style="font-size: 11px; background: #e2e8f0; font-family:'JetBrains Mono';">${totalSumVat.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-bottom: 20px; font-size: 11px; color:#475569;">
                        Всего принято наименований <span class="bold" style="color:#0f172a;">${batch.length}</span>, общей стоимостью с НДС <span class="bold" style="color:#0f172a;">${totalSumVat.toFixed(2)} руб.</span>
                    </div>
                    
                    <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:flex-end;">
                        <table class="sign-strip" style="width:70%; margin:0;">
                            <tr>
                                <td style="position:relative; height:60px; vertical-align:bottom;">
                                    Принял (кладовщик): 
                                    ${signedBy ? `
                                        <div style="display:inline-block; vertical-align:middle; margin-left:10px;">
                                            <div style="border:1.5px solid #22c55e; border-left:6px solid #22c55e; border-radius:4px; padding:6px 10px; font-family:'Inter'; background:#fff; font-size:8px; line-height:1.2; width:220px; box-sizing:border-box;">
                                                <div style="color:#22c55e; font-weight:900; text-transform:uppercase; margin-bottom:3px; font-size:7px;">ЭЦП ПОДТВЕРЖДЕНА</div>
                                                <div>Владелец: <b>${signedBy}</b></div>
                                                <div>Должность: ${signedPosition}</div>
                                                <div style="font-family:'JetBrains Mono'; opacity:0.6; font-size:6px;">S/N: ${signHash}</div>
                                                <div style="border-top:1px solid #f0f0f0; margin-top:3px; padding-top:2px; font-size:6px; color:#22c55e;">ПРУТКОН ОС: ${signedAt}</div>
                                            </div>
                                        </div>
                                    ` : `<div class="sign-line"></div> / <span class="bold">${responsible}</span>`}
                                </td>
                            </tr>
                            <tr>
                                <td style="height:40px; vertical-align:bottom;">
                                    Сдал (представитель поставщика): <div class="sign-line"></div> / <span class="bold">${sup}</span>
                                </td>
                            </tr>
                        </table>
                        
                        <div style="border: 2px dashed #008080; color: #008080; font-family: 'Outfit', sans-serif; width: 90px; height: 90px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; text-align: center; transform: rotate(-5deg); opacity: 0.85; user-select:none; margin-bottom:10px;">
                            <div style="font-size: 6px; border-bottom: 1px solid #008080; padding-bottom: 2px; width: 60px;">СКЛАД №1</div>
                            <div style="font-size: 12px; font-weight: 900; margin: 2px 0;">ПРИНЯТО</div>
                            <div style="font-size: 6px;">ОТК ПРУТКОН</div>
                        </div>
                    </div>
                </div>
                <script>window.print();<\/script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
    };
 
})(window);
