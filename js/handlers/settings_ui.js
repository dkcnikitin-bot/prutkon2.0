/**
 * ПРУТКОН ОС: Модуль интерфейса настроек (Settings UI)
 * Содержит шаблоны и логику отрисовки вкладок настроек.
 */

window.settingsUI = {
    renderTabs: () => `
        <div class="tabs-scrollable mb-4" style="border-bottom:none;">
            <button class="btn btn-secondary btn-sm active" id="tab-btn-team" onclick="window.switchTab('team')"><i class="fa-solid fa-users"></i> Команда</button>
            <button class="btn btn-secondary btn-sm" id="tab-btn-constructor" onclick="window.switchTab('constructor')"><i class="fa-solid fa-cubes"></i> UI</button>
            <button class="btn btn-secondary btn-sm" id="tab-btn-changelog" onclick="window.switchTab('changelog')"><i class="fa-solid fa-history"></i> Журнал</button>
            <button class="btn btn-secondary btn-sm" id="tab-btn-docs" onclick="window.switchTab('docs')"><i class="fa-solid fa-file-invoice"></i> Шаблоны</button>
            <button class="btn btn-secondary btn-sm" id="tab-btn-system" onclick="window.switchTab('system')"><i class="fa-solid fa-gears"></i> Система</button>
        </div>
    `,
    
    TEAM: () => `
        <div id="tab-content-team" class="tab-pane active">
            <div class="grid grid-2 gap-4">
                <div class="panel glass-panel">
                    <div class="flex justify-between items-center mb-4">
                         <h3 class="mb-0 brand-red"><i class="fa-solid fa-users"></i> Персонал</h3>
                         <div id="stat-emp-count" class="badge">0</div>
                    </div>
                    <div class="table-wrapper" style="border:none;">
                        <table class="data-table">
                            <thead>
                                <tr><th>Сотрудник</th><th>Роль</th><th>Статус</th><th></th></tr>
                            </thead>
                            <tbody id="settings-emp-tbody"></tbody>
                        </table>
                    </div>
                    <button class="btn btn-primary w-100 mt-4" onclick="window.addEmployee()"><i class="fa-solid fa-plus"></i> Добавить сотрудника</button>
                </div>
                <div class="panel glass-panel">
                    <h3 class="mb-4 brand-red"><i class="fa-solid fa-shield"></i> Уровни доступа</h3>
                    <div id="role-permissions-list" class="flex flex-col gap-3"></div>
                </div>
            </div>
        </div>
    `,
    
    CONSTRUCTOR: () => `
        <div id="tab-content-constructor" class="tab-pane hidden">
            <div class="panel glass-panel">
                <h3 class="mb-4 brand-red"><i class="fa-solid fa-cubes"></i> Конструктор рабочего стола</h3>
                <div id="constructor-blocks-list" class="grid grid-2 gap-4">
                     <div class="panel flex items-center justify-between">
                         <div><strong>Приветствие</strong><br/><small>WELCOME BLOCK</small></div>
                         <label class="checkbox-container"><input type="checkbox" class="block-toggle" data-block="WELCOME"><span class="checkmark"></span></label>
                     </div>
                     <div class="panel flex items-center justify-between">
                         <div><strong>Статистика</strong><br/><small>STATS BLOCK</small></div>
                         <label class="checkbox-container"><input type="checkbox" class="block-toggle" data-block="STATS"><span class="checkmark"></span></label>
                     </div>
                     <div class="panel flex items-center justify-between">
                         <div><strong>Свежие заказы</strong><br/><small>RECENT ORDERS</small></div>
                         <label class="checkbox-container"><input type="checkbox" class="block-toggle" data-block="RECENT_ORDERS"><span class="checkmark"></span></label>
                     </div>
                     <div class="panel flex items-center justify-between">
                         <div><strong>Быстрые инструменты</strong><br/><small>QUICK ACTIONS</small></div>
                         <label class="checkbox-container"><input type="checkbox" class="block-toggle" data-block="QUICK_ACTIONS"><span class="checkmark"></span></label>
                     </div>
                     <div class="panel flex items-center justify-between">
                         <div><strong>Лента аудита</strong><br/><small>AUDIT FEED</small></div>
                         <label class="checkbox-container"><input type="checkbox" class="block-toggle" data-block="AUDIT_FEED"><span class="checkmark"></span></label>
                     </div>
                </div>
                <button class="btn btn-primary mt-4" onclick="window.saveConstructorLayout()">Применить раскладку</button>
            </div>
        </div>
    `,
    
    CHANGELOG: () => `
        <div id="tab-content-changelog" class="tab-pane hidden">
            <div class="panel glass-panel">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="mb-0 brand-red"><i class="fa-solid fa-history"></i> Журнал действий</h3>
                    <div class="flex gap-2">
                        <input type="text" id="log-search" class="form-control" placeholder="Фильтр..." style="width:200px;" oninput="window.renderFullChangeLog()">
                        <select id="log-filter-user" class="form-control" onchange="window.renderFullChangeLog()"><option value="all">Все</option></select>
                    </div>
                </div>
                <div class="table-wrapper" style="max-height:600px; overflow-y:auto;">
                    <table class="data-table">
                        <thead>
                            <tr><th>Дата</th><th>Юзер</th><th>Действие</th><th>Объект</th></tr>
                        </thead>
                        <tbody id="full-change-log-tbody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    
    DOCS: () => `
        <div id="tab-content-docs" class="tab-pane hidden">
            <div class="grid grid-2 gap-4">
                <div class="panel glass-panel">
                    <h3 class="mb-4 brand-red"><i class="fa-solid fa-file-invoice"></i> Реквизиты организации</h3>
                    <div class="grid grid-2 gap-4">
                         <div class="form-group"><label>Название</label><input id="print-company" class="form-control"></div>
                         <div class="form-group"><label>ИНН</label><input id="print-inn" class="form-control"></div>
                         <div class="form-group"><label>КПП</label><input id="print-kpp" class="form-control"></div>
                         <div class="form-group"><label>БИК</label><input id="print-bik" class="form-control"></div>
                         <div class="form-group"><label>Банк</label><input id="print-bank" class="form-control"></div>
                         <div class="form-group"><label>Р/С</label><input id="print-rs" class="form-control"></div>
                         <div class="form-group"><label>Юр. Адрес</label><textarea id="print-address" class="form-control" rows="2"></textarea></div>
                         <div class="form-group"><label>Термины/Условия</label><textarea id="print-terms" class="form-control" rows="2"></textarea></div>
                    </div>
                    <button class="btn btn-primary w-100 mt-4" onclick="window.savePrinterSettings()">Сохранить реквизиты</button>
                </div>
                
                <div class="panel glass-panel">
                    <h3 class="mb-4 blue"><i class="fa-solid fa-code"></i> Редактор шаблонов (HTML)</h3>
                    <div class="form-group">
                        <label>Целевой документ</label>
                        <select id="tpl-selector" class="form-control mb-3" onchange="window.onTemplateTypeChange()">
                            <option value="kp">Коммерческое предложение (КП)</option>
                            <option value="invoice">Счет на оплату (НДС)</option>
                            <option value="order">Наряд на производство</option>
                            <option value="spec">Спецификация</option>
                            <option value="ttn">ТТН / Накладная</option>
                        </select>
                    </div>
                    <textarea id="tpl-html-editor" class="form-control" style="height:350px; font-family:var(--font-mono); font-size:0.75rem;"></textarea>
                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-secondary flex-1" onclick="window.resetCurrentTemplate()">Сбросить</button>
                        <button class="btn btn-primary flex-1" onclick="window.savePrinterSettings()">Сохранить шаблон</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    SYSTEM: () => `
        <div id="tab-content-system" class="tab-pane hidden">
            <div class="grid grid-2 gap-4">
                <div class="panel glass-panel">
                    <h3 class="mb-4 brand-red"><i class="fa-solid fa-cloud"></i> Облако (Supabase)</h3>
                    <div id="firebase-status-banner" class="flex items-center gap-4 padding-20 mb-4" style="background:rgba(226,31,38,0.05); border-radius:12px; border-left:4px solid var(--brand-red);">
                        <div id="firebase-status"><i class="fa-solid fa-cloud-bolt text-lg brand-red"></i></div>
                        <div>
                            <div id="firebase-status-text" class="text-bold">Проверка...</div>
                            <div id="firebase-status-subtext" class="text-xs neutral">Синхронизация в реальном времени</div>
                        </div>
                    </div>
                    <button class="btn btn-primary w-100" onclick="window.saveAllSettings()">Принудительная синхронизация</button>
                    <div class="mt-4 grid grid-2 gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="window.backupData()"><i class="fa-solid fa-download"></i> Бэкап .JSON</button>
                        <button class="btn btn-secondary btn-sm" onclick="window.exportLogs()"><i class="fa-solid fa-file-csv"></i> Логи .CSV</button>
                    </div>
                </div>
                
                <div class="panel glass-panel">
                    <h3 class="mb-4 brand-red"><i class="fa-solid fa-history"></i> Состояние системы</h3>
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="neutral">Записей в логе:</span>
                            <strong id="stat-log-count" class="brand-red">0</strong>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="neutral">Кол-во сотрудников:</span>
                            <span id="stat-emp-count-v2" class="badge">0</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="neutral">Последнее сохранение:</span>
                            <span id="stat-last-backup" class="text-xs">---</span>
                        </div>
                    </div>
                    <div class="mt-4 pt-4" style="border-top:1px solid rgba(255,255,255,0.05);">
                        <div class="text-xs neutral mb-2">Версия БД: <strong id="db-version-display" class="emerald">---</strong></div>
                        <button class="btn btn-secondary btn-sm w-100" onclick="window.location.reload()"><i class="fa-solid fa-rotate"></i> Перегрузить ядро</button>
                    </div>
                </div>
                
                <div class="panel glass-panel" style="grid-column: span 2;">
                    <h3 class="mb-4 brand-red"><i class="fa-solid fa-code-branch"></i> История обновлений</h3>
                    <div id="version-history-list" class="flex flex-col gap-4">
                        <!-- Сюда рендерится история из settings.js -->
                    </div>
                </div>

                <div class="panel glass-panel">
                    <h3 class="mb-4 blue"><i class="fa-solid fa-satellite"></i> CRM (Bitrix24)</h3>
                    <div class="form-group mb-3">
                        <label>Webhook URL</label>
                        <input type="text" id="bitrix-webhook-url" class="form-control text-xs" placeholder="https://yourdomain.bitrix24.ru/rest/1/...">
                    </div>
                    <div class="grid grid-2 gap-3 mb-4">
                        <div class="form-group"><label>Воронка</label><select id="bitrix-pipeline-id" class="form-control"></select></div>
                        <div class="form-group"><label>Стадия Произв.</label><select id="bitrix-stage-id" class="form-control"></select></div>
                    </div>
                    <div class="grid grid-2 gap-3 mb-4">
                        <div class="form-group"><label>Поле: Бренд</label><input id="bitrix-field-brand" class="form-control" placeholder="UF_CRM_..."></div>
                        <div class="form-group"><label>Поле: Модель</label><input id="bitrix-field-model" class="form-control" placeholder="UF_CRM_..."></div>
                    </div>
                    <div id="bitrix-status-msg" class="mb-3 text-xs"></div>
                    <div class="flex gap-2">
                        <button class="btn btn-secondary flex-1" onclick="window.testBitrixConnection()">Тест</button>
                        <button class="btn btn-primary flex-1" onclick="window.uiSaveBitrixConfig()">Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: () => {
        const container = document.getElementById('settings-main-container');
        if (!container) return;
        
        container.innerHTML = `
            ${window.settingsUI.renderTabs()}
            ${window.settingsUI.TEAM()}
            ${window.settingsUI.CONSTRUCTOR()}
            ${window.settingsUI.CHANGELOG()}
            ${window.settingsUI.DOCS()}
            ${window.settingsUI.SYSTEM()}
        `;
        
        console.log("⚙️ Settings UI Assembled.");
    }
};
