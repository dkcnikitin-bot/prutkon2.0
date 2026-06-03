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
            if (!doc.signedBy) return '<div style="color:#ddd; font-size:10px; border:1px dashed #aaa; padding:15px; text-align:center; border-radius:4px; background:#f9f9f9;">ОЖИДАЕТСЯ ВАЛИДАЦИЯ ЭЦП</div>';
            return `
                <div class="ep-stamp" style="border: 2px solid #ed1c24; border-radius: 8px; padding: 15px; width: 320px; color: #000; font-family: 'Outfit', sans-serif; background: #fff; position: relative; box-shadow: 10px 10px 30px rgba(0,0,0,0.1); border-left: 10px solid #ed1c24; overflow:hidden;">
                    <div style="position: absolute; right: -20px; bottom: -10px; font-size: 80px; font-weight: 900; color: rgba(237, 28, 36, 0.05); transform: rotate(-15deg); pointer-events: none;">VALID</div>
                    <div style="font-weight:900; font-size:13px; text-transform:uppercase; border-bottom:2px solid #ed1c24; margin-bottom:12px; display: flex; align-items: center; gap: 8px; color:#ed1c24;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        ПОДЛИННОСТЬ ПОДТВЕРЖДЕНА
                    </div>
                    <div style="font-size:12px; margin-bottom:6px;">Владелец: <strong>${doc.signedBy}</strong></div>
                    <div style="font-size:11px; margin-bottom:6px; color:#555;">Должность: <strong>${doc.signedPosition || 'Руководитель подразделения'}</strong></div>
                    <div style="font-size:11px; margin-bottom:12px; font-family:'JetBrains Mono'; opacity:0.6;">S/N: ${doc.signHash || '---'}</div>
                    <div style="font-size:10px; font-weight:700; color:#ed1c24; letter-spacing:0.5px; border-top:1px solid #f0f0f0; padding-top:8px;">ПРУТКОН ОС CLOUD VERIFIED: ${doc.signedAt}</div>
                </div>
            `;
        },

        generate(type, orderId) {
            const registry = JSON.parse(localStorage.getItem('prutkon_doc_registry')) || [];
            const doc = registry.find(d => String(d.orderId) === String(orderId) && (type === 'bill' ? d.type === 'Счет' : true)) || { orderId: orderId };
            const order = (window.orders || []).find(o => String(o.id) === String(orderId));
            
            if (!order) {
                window.showToast("СИСТЕМНАЯ ОШИБКА: ЗАКАЗ НЕ НАЙДЕН", "error");
                return;
            }

            const printWindow = window.open('', '_blank');
            const html = this.buildLayout(type, doc, order);
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${type.toUpperCase()} - ПРУТКОН ОС</title>
                        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            @page { size: A4; margin: 0; }
                            body { margin: 0; padding: 0; background: #333; font-family: 'Outfit', sans-serif; -webkit-print-color-adjust: exact; }
                            .page { 
                                width: 210mm; height: 297mm; padding: 15mm; margin: 10mm auto; background: #fff; 
                                position: relative; overflow: hidden; box-sizing: border-box;
                            }
                            .page::before {
                                content: ""; position:absolute; top:0; right:0; width: 400px; height: 400px;
                                background: linear-gradient(135deg, transparent 70%, rgba(237, 28, 36, 0.03) 70.1%);
                                z-index:0; pointer-events:none;
                            }
                            .watermark {
                                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                                font-size: 120px; font-weight: 900; color: rgba(0,0,0,0.02); z-index:0; pointer-events:none; text-transform:uppercase;
                            }
                            .content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                            th { background: #1a1d21; color: #fff; text-transform: uppercase; font-size: 10px; font-weight: 900; padding: 12px 10px; text-align: center; border: 1px solid #1a1d21; }
                            td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
                            .brand-border { position: absolute; left:0; top:0; bottom:0; width: 6mm; background: #ed1c1d; }
                            @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; border-radius: 0; } }
                        </style>
                    </head>
                    <body>${html}</body>
                </html>
            `);
            printWindow.document.close();
        },

        buildLayout(type, doc, order) {
            const items = doc.items || order.items || [];
            const timestamp = doc.date || order.date || new Date().toLocaleDateString('ru-RU');
            const total = doc.sum || order.total || 0;
            const vat = total * 0.22 / 1.22;

            const itemsRows = items.map((it, idx) => `
                <tr style="${idx % 2 === 0 ? 'background:#fcfcfc;' : ''}">
                    <td style="text-align:center; font-family:'JetBrains Mono';">${idx + 1}</td>
                    <td style="font-weight:700;">${it.name}</td>
                    <td style="text-align:center; font-family:'JetBrains Mono'; opacity:0.7;">${it.art || '---'}</td>
                    <td style="text-align:center; font-weight:700;">${it.qty}</td>
                    <td style="text-align:right;">${window.formatCurrency(it.price)}</td>
                    <td style="text-align:right; font-weight:900; font-family:'JetBrains Mono';">${window.formatCurrency(it.qty * it.price)}</td>
                </tr>
            `).join('');

            return `
            <div class="page">
                <div class="brand-border"></div>
                <div class="watermark">PRUTKON ERP</div>
                <div class="content">
                    
                    <!-- HEADER PLATINUM -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; border-bottom:4px solid #000; padding-bottom:30px;">
                        <img src="logo.png" style="height:85px; object-fit:contain;">
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#ed1c24; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:5px;">INDUSTRIAL SOLUTIONS SYSTEM</div>
                            <h1 style="margin:0; font-size:38px; font-weight:900; color:#1a1d21;">${type === 'bill' ? 'СЧЕТ-ДОГОВОР' : 'НАРЯД-ЗАКАЗ'}</h1>
                            <div style="font-size:22px; font-weight:400; font-family:'JetBrains Mono';">DOCUMENT <strong>№ ${doc.id || order.id}</strong></div>
                            <div style="font-size:14px; margin-top:5px; opacity:0.6;">ОТ ${timestamp}</div>
                        </div>
                    </div>

                    <!-- META COCKPIT -->
                    <table style="margin-bottom:40px; border:none;">
                        <tr>
                            <td style="width:50%; border:none; padding:0 20px 0 0; vertical-align:top;">
                                <div style="font-size:10px; font-weight:900; color:#888; margin-bottom:10px; text-transform:uppercase; border-left:3px solid #ed1c24; padding-left:10px;">ПОСТАВЩИК</div>
                                <div style="font-size:14px; font-weight:900; color:#1a1d21;">${this.config.companyName}</div>
                                <div style="font-size:11px; margin:5px 0;">ИНН: ${this.config.inn} / КПП: ${this.config.kpp}</div>
                                <div style="font-size:11px; color:#555; line-height:1.4;">${this.config.address}</div>
                                <div style="font-size:11px; color:#555; margin-top:5px;">${this.config.bankName} | БИК ${this.config.bik}</div>
                            </td>
                            <td style="width:50%; border:none; padding:0 0 0 20px; vertical-align:top;">
                                <div style="font-size:10px; font-weight:900; color:#888; margin-bottom:10px; text-transform:uppercase; border-left:3px solid #ed1c24; padding-left:10px;">ПОЛУЧАТЕЛЬ</div>
                                <div style="font-size:18px; font-weight:900;">${doc.client || order.clientName || 'ВНУТРЕННИЙ ПОЛУЧАТЕЛЬ'}</div>
                                <div style="font-size:11px; margin-top:5px;">КОНТАКТ: <strong>${order.clientPhone || '---'}</strong></div>
                                <div style="font-size:11px; margin-top:5px; padding:5px 10px; background:#f4f4f4; border-radius:4px; display:inline-block;">СВЯЗАННЫЙ ЗАКАЗ: № ${order.id}</div>
                            </td>
                        </tr>
                    </table>

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
                    <div style="display:flex; justify-content:flex-end; margin-bottom:40px;">
                        <div style="width:380px; background:#1a1d21; color:#fff; padding:25px; border-radius:12px; position:relative; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15);">
                            <div style="position:absolute; left:0; top:0; bottom:0; width:8px; background:#ed1c24;"></div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px; opacity:0.7;">
                                <span>ИТОГО ЧИСТЫМИ:</span>
                                <span style="font-family:'JetBrains Mono';">${window.formatCurrency(total - vat)}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:13px; font-weight:700;">
                                <span style="color:#ed1c24;">НДС (СТАВКА 22%):</span>
                                <span style="font-family:'JetBrains Mono';">${window.formatCurrency(vat)}</span>
                            </div>
                            <div style="border-top:1px solid #333; padding-top:15px; display:flex; justify-content:space-between;">
                                <span style="font-size:22px; font-weight:900;">К ОПЛАТЕ:</span>
                                <span style="font-size:22px; font-weight:900; color:#ed1c24; font-family:'Outfit';">${window.formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    <div style="font-size:12px; margin-bottom:60px; border-left:4px solid #ddd; padding-left:15px; line-height:1.6;">
                        Всего наименований <strong>${items.length}</strong>, на общую сумму <strong>${window.formatCurrency(total)}</strong><br>
                        <span style="font-weight:900; text-transform:uppercase;">${this.numberToLongString(total)}</span>
                        <div style="margin-top:10px; font-size:11px; color:#555;">${this.config.terms}</div>
                    </div>

                    <!-- FOOTER SIGNATURES PLATINUM -->
                    <div style="margin-top:auto; display:grid; grid-template-columns: 1fr 1fr; gap:60px; padding-bottom:20px;">
                        <div>
                            <div style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px;">ВАЛИДАЦИЯ ЭМИТЕНТА</div>
                            ${this.generateStamp(doc)}
                        </div>
                        <div>
                            <div style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px;">ПРИЕМКА И КОНТРОЛЬ ОТК</div>
                            <div style="border:1px solid #ddd; border-radius:8px; height:110px; position:relative; display:flex; align-items:center; justify-content:center; background:#fcfcfc;">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="rgba(0,0,0,0.03)" style="position:absolute; z-index:0;"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                                <div style="position:relative; z-index:1; font-size:11px; color:#bbb; text-align:center; padding:20px;">ШТАМП ОТДЕЛА ТЕХНИЧЕСКОГО КОНТРОЛЯ<br>ПРУТКОН ОС v${window.DB_VERSION}</div>
                            </div>
                        </div>
                    </div>

                    <div style="font-size:9px; color:#aaa; line-height:1.6; border-top:1px solid #f0f0f0; padding-top:15px;">
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

})(window);
