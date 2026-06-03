/* 
 * bitrix.js - ПРУТКОН ОС | CRM Integration Master (v19.0.0)
 * Полная поддержка AI-парсинга, поиска и интеграции сделок.
 */

console.log("🛰 Bitrix24 Integration v19.0.0 loading...");

window.bitrixConfig = JSON.parse(localStorage.getItem('prutkon_bitrix_config')) || {
    webhookUrl: '', enabled: false, mapping: { stage_initial: '', stage_approval: '', stage_production: '', deal_category: 0, fields: {} }
};

window.callBitrix = async function(method, params, silent = false) {
    if (!window.bitrixConfig.webhookUrl) return null;
    let url = window.bitrixConfig.webhookUrl.replace(/\/$/, "") + "/" + method;
    try {
        const formData = new URLSearchParams();
        const flatten = (obj, prefix = '') => {
            if (obj === null || obj === undefined) return;
            for (let k in obj) {
                let key = prefix ? `${prefix}[${k}]` : k;
                if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) flatten(obj[k], key);
                else if (Array.isArray(obj[k])) obj[k].forEach((v, i) => formData.append(`${key}[${i}]`, v));
                else formData.append(key, obj[k]);
            }
        };
        flatten(params);
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }).catch(() => null);
        if (!response?.ok) return null;
        const res = await response.json();
        if (res.error) { if (!silent) console.error(`BX24 Error: ${res.error_description}`); return null; }
        return res.result;
    } catch (e) { return null; }
};

// --- AI PARSER (НЕЙРОСЕТЕВОЙ МОДУЛЬ) ---
window.parseAiRequest = async function() {
    const text = document.getElementById('ai-parse-input').value;
    if (!text.trim()) return;
    
    window.showToast("Искусственный интеллект анализирует запрос...", "info");
    
    // Имитация AI-фильтрации (в реальности здесь можно делать запрос к LLM или расширенный RegExp)
    const length = text.match(/длин[а-я\s]+(\d+)/i)?.[1] || text.match(/(\d+)\s*м/i)?.[1] * 1000 || 12000;
    const width = text.match(/ширин[а-я\s]+(\d+)/i)?.[1] || text.match(/(\d+)\s*мм/i)?.[1] || 800;
    const pitch = text.match(/шаг[а-я\s]+(\d+)/i)?.[1] || 40;
    
    window.aiExtracted = { length, width, pitch };
    
    document.getElementById('ai-detected-text').innerText = `L=${length}мм, W=${width}мм, P=${pitch}мм`;
    document.getElementById('ai-parse-result').classList.remove('hidden');
};

window.applyAiData = function() {
    if (!window.aiExtracted) return;
    if (document.getElementById('calc-length')) document.getElementById('calc-length').value = window.aiExtracted.length;
    if (document.getElementById('calc-width')) document.getElementById('calc-width').value = window.aiExtracted.width;
    if (document.getElementById('calc-pitch')) document.getElementById('calc-pitch').value = window.aiExtracted.pitch;
    if (window.calculateCP) window.calculateCP();
    window.showToast("Данные извлечены в калькулятор", "success");
    document.getElementById('ai-parse-result').classList.add('hidden');
};

// --- CRM SEARCH & SELECT (CALC BRIDGE) ---
window.handleBitrixSearchInput = function(query) {
    const resultsCont = document.getElementById('bitrix-search-results');
    if (!resultsCont) return;
    
    if (query.length < 2) { 
        resultsCont.style.display = 'none'; 
        window.hideBitrixLoading();
        return;
    }
    // Автозапуск поиска после паузы
    clearTimeout(window.bitrixSearchTimeout);
    window.bitrixSearchTimeout = setTimeout(() => {
        window.runBitrixSearch();
    }, 500); // Задержка 500мс чтобы не спамить запросами
};

window.showBitrixLoading = function() {
    const loader = document.getElementById('bitrix-search-loading');
    if (loader) loader.classList.remove('hidden');
};

window.hideBitrixLoading = function() {
    const loader = document.getElementById('bitrix-search-loading');
    if (loader) loader.classList.add('hidden');
};

window.runBitrixSearch = async function() {
    const query = document.getElementById('bitrix-client-search')?.value;
    const resultsCont = document.getElementById('bitrix-search-results');
    if (!resultsCont || !query || query.length < 2) return;
    
    // Показываем индикатор загрузки
    window.showBitrixLoading();
    resultsCont.style.display = 'block';
    resultsCont.innerHTML = '<div style="padding:20px; text-align:center; color:#aaa;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:10px;"></i><br>Поиск в CRM...</div>';

    try {
        const contacts = await window.searchBitrixClient(query);
        const companies = await window.searchBitrixCompany(query);

        resultsCont.innerHTML = '';
        
        if (contacts.length === 0 && companies.length === 0) {
            // Кнопка быстрого создания
            const isPhone = /[\d\+]{7,}/.test(query);
            const createBtn = document.createElement('div');
            createBtn.style = "padding:15px; background:rgba(0,180,255,0.08); border-bottom:1px solid rgba(0,180,255,0.3); cursor:pointer; color:#fff;";
            createBtn.innerHTML = `<div style="color:var(--accent-blue); font-weight:800; margin-bottom:5px;"><i class="fa-solid fa-user-plus"></i> КЛИЕНТ НЕ НАЙДЕН</div><div style="opacity:0.7; font-size:11px;">Нажмите для создания нового контакта "${query}"</div>`;
            createBtn.onclick = async () => {
                const phone = isPhone ? query.replace(/[^\d\+]/g, '') : '';
                const name = !isPhone ? query : 'Новый Клиент';
                window.hideBitrixLoading();
                const newId = await window.createBitrixContact(name, phone);
                if (newId) window.selectBitrixClient(newId, null, name, phone);
            };
            resultsCont.appendChild(createBtn);
            window.hideBitrixLoading();
            return;
        }

        // Список найденных контактов
        contacts.forEach(c => {
            const div = document.createElement('div');
            div.style = "padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.15s;";
            div.onmouseover = function() { this.style.background = 'rgba(0,180,255,0.05)'; };
            div.onmouseout = function() { this.style.background = ''; };
            const phone = c.PHONE?.[0]?.VALUE || '---';
            div.innerHTML = `<div style="color:#fff; font-weight:700; font-size:14px;">👤 ${c.NAME || ''} ${c.LAST_NAME || ''}</div><div style="font-size:12px; color:var(--accent-blue); font-family:monospace; margin-top:4px;">${phone}</div>`;
            div.onclick = () => {
                window.hideBitrixLoading();
                window.selectBitrixClient(c.ID, null, `${c.NAME || ''} ${c.LAST_NAME || ''}`, phone);
            };
            resultsCont.appendChild(div);
        });

        // Список компаний
        companies.forEach(c => {
            const div = document.createElement('div');
            div.style = "padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.15s;";
            div.onmouseover = function() { this.style.background = 'rgba(0,200,100,0.05)'; };
            div.onmouseout = function() { this.style.background = ''; };
            div.innerHTML = `<div style="color:var(--emerald-neon); font-weight:700; font-size:14px;">🏢 ${c.TITLE}</div><div style="font-size:11px; opacity:0.5; margin-top:4px;">Компания (CRM)</div>`;
            div.onclick = () => {
                window.hideBitrixLoading();
                window.selectBitrixClient(null, c.ID, c.TITLE, 'Корпоративный');
            };
            resultsCont.appendChild(div);
        });
        
        window.showToast(`Найдено: ${contacts.length} контактов, ${companies.length} компаний`, 'success');
    } catch (e) {
        console.error("Bitrix Search Error:", e);
        resultsCont.innerHTML = '<div style="padding:15px; color:var(--brand-red); text-align:center;">Ошибка поиска: ' + e.message + '</div>';
    }
    
    window.hideBitrixLoading();
};

window.selectBitrixClient = function(cId, compId, name, phone) {
    const clientIdInput = document.getElementById('selected-client-id');
    const companyIdInput = document.getElementById('selected-company-id');
    const clientName = document.getElementById('client-name-display');
    const clientPhone = document.getElementById('client-phone-display');
    const searchInput = document.getElementById('bitrix-client-search');
    const selectedInfo = document.getElementById('selected-client-info');
    const searchResults = document.getElementById('bitrix-search-results');

    if (clientIdInput) clientIdInput.value = cId || '';
    if (companyIdInput) companyIdInput.value = compId || '';
    if (clientName) clientName.innerText = name || '—';
    if (clientPhone) clientPhone.innerText = phone || '';
    if (searchInput) searchInput.value = name || '';
    if (selectedInfo) selectedInfo.style.display = 'block';
    if (searchResults) searchResults.style.display = 'none';
};

window.clearBitrixClient = function() {
    const clientIdInput = document.getElementById('selected-client-id');
    const companyIdInput = document.getElementById('selected-company-id');
    const selectedInfo = document.getElementById('selected-client-info');
    const searchInput = document.getElementById('bitrix-client-search');

    if (clientIdInput) clientIdInput.value = '';
    if (companyIdInput) companyIdInput.value = '';
    if (selectedInfo) selectedInfo.style.display = 'none';
    if (searchInput) searchInput.value = '';
};

// --- CORE BX FUNCTIONS ---
window.getBitrixTimelineComments = async function(dealId) {
    let all = [];
    try {
        const res = await window.callBitrix('crm.timeline.comment.list', { filter: { ENTITY_ID: dealId, ENTITY_TYPE: 'deal' } }, true);
        (res || []).forEach(it => all.push({ date: it.CREATED, text: "💬 " + it.COMMENT.replace(/<[^>]*>/g, ''), author: "CRM" }));
        
        const tasks = await window.callBitrix('tasks.task.list', { filter: { "UF_CRM_TASK": "D_" + dealId }, select: ["ID", "TITLE", "STATUS", "CREATED_DATE"] }, true);
        (tasks?.tasks || []).forEach(t => all.push({ date: t.createdDate, text: "📌 " + t.title, author: "ЗАДАЧА", taskId: t.id, isCompleted: t.status == 5 }));
    } catch(e) {}
    return all.sort((a,b) => new Date(b.date) - new Date(a.date));
};

window.completeBitrixTask = async function(taskId) {
    window.showToast("Завершение задачи...", "info");
    const res = await window.callBitrix('tasks.task.complete', { taskId });
    if (res) window.showToast("Задача завершена!", "success");
    return res;
};

window.updateBitrixDealSum = async function(id, sum, items = []) {
    try {
        await window.callBitrix('crm.deal.update', { id, fields: { OPPORTUNITY: Number(sum), CURRENCY_ID: 'RUB' } }, true);
        if (items?.length) {
            const rows = items.map(it => ({ PRODUCT_NAME: `${it.name} [${it.art}]`, PRICE: it.price, QUANTITY: it.qty || 1, MEASURE_CODE: 796 }));
            await window.callBitrix('crm.deal.productrows.set', { id, rows }, true);
        }
        return true;
    } catch (e) { return false; }
};

window.updateBitrixDealStage = async function(id, stageId) {
    if (!id || !stageId) return false;
    try {
        const res = await window.callBitrix('crm.deal.update', { id, fields: { STAGE_ID: stageId } }, true);
        return !!res;
    } catch (e) {
        return false;
    }
};

window.addBitrixDealComment = async function(dealId, comment) {
    if (!dealId || !comment) return false;
    try {
        const res = await window.callBitrix('crm.timeline.comment.add', {
            fields: {
                ENTITY_ID: dealId,
                ENTITY_TYPE: 'deal',
                COMMENT: comment
            }
        }, true);
        return !!res;
    } catch (e) {
        return false;
    }
};

window.createBitrixDeal = async function(payload = {}) {
    if (!window.bitrixConfig?.webhookUrl) {
        if (window.showToast) window.showToast('Сначала настройте интеграцию с Bitrix24', 'warning');
        return null;
    }

    const mapping = window.bitrixConfig.mapping || {};
    const fields = {
        TITLE: payload.title || 'Новый расчет ПРУТКОН',
        OPPORTUNITY: Number(payload.amount || 0),
        CURRENCY_ID: 'RUB',
        CATEGORY_ID: mapping.deal_category || 0
    };

    if (mapping.stage_initial) fields.STAGE_ID = mapping.stage_initial;
    if (payload.contactId) fields.CONTACT_ID = payload.contactId;
    if (payload.companyId) fields.COMPANY_ID = payload.companyId;
    if (payload.comments) fields.COMMENTS = payload.comments;

    const brandField = mapping.fields?.brand;
    const modelField = mapping.fields?.model;
    if (brandField && payload.brand) fields[brandField] = payload.brand;
    if (modelField && payload.model) fields[modelField] = payload.model;

    try {
        const dealId = await window.callBitrix('crm.deal.add', { fields });
        if (!dealId) return null;

        if (payload.items?.length) {
            await window.updateBitrixDealSum(dealId, payload.amount || 0, payload.items);
        }

        if (payload.comment) {
            await window.addBitrixDealComment(dealId, payload.comment);
        }

        return dealId;
    } catch (e) {
        return null;
    }
};

window.searchBitrixClient = async function(q) {
    const cleanQ = q.replace(/[^\d\+]/g, '');
    let res = [];
    
    // ПРИОРИТЕТ 1: Поиск по телефону через специализированный метод дубликатов
    if (cleanQ.length >= 7) {
        try {
            const dupRes = await window.callBitrix('crm.duplicate.findbycomm', {
                entity_type: "CONTACT",
                type: "PHONE",
                values: [cleanQ]
            });
            
            let contactIds = [];
            if (Array.isArray(dupRes)) {
                contactIds = dupRes;
            } else if (dupRes && dupRes.CONTACT) {
                contactIds = dupRes.CONTACT;
            }
            if (contactIds.length > 0) {
                res = await window.callBitrix('crm.contact.list', {
                    filter: { "ID": contactIds },
                    select: ["ID", "NAME", "LAST_NAME", "PHONE"]
                }) || [];
            }
        } catch (e) {
            console.error("Duplicate find error:", e);
        }
    }
    
    // ПРИОРИТЕТ 2: Если по телефону ничего не нашли или это текстовый поиск (имя/фамилия)
    if (!res || res.length === 0) {
        // Пробуем FIND (некоторые порталы поддерживают его как глобальный поиск)
        res = await window.callBitrix('crm.contact.list', { 
            filter: { "FIND": q }, 
            select: ["ID", "NAME", "LAST_NAME", "PHONE"] 
        });
        
        // ПРИОРИТЕТ 3: Явный поиск по Имени
        if (!res || res.length === 0) {
            res = await window.callBitrix('crm.contact.list', { 
                filter: { "%NAME": q }, 
                select: ["ID", "NAME", "LAST_NAME", "PHONE"] 
            }) || [];
        }
        
        // ПРИОРИТЕТ 4: Явный поиск по Фамилии
        if (!res || res.length === 0) {
            res = await window.callBitrix('crm.contact.list', { 
                filter: { "%LAST_NAME": q }, 
                select: ["ID", "NAME", "LAST_NAME", "PHONE"] 
            }) || [];
        }
    }
    
    return res || [];
};

window.searchBitrixCompany = async function(q) {
    return await window.callBitrix('crm.company.list', { 
        filter: { "%TITLE": q }, 
        select: ["ID", "TITLE"] 
    }) || [];
};

window.createBitrixContact = async function(name, phone) {
    try {
        const parts = name.trim().split(' ');
        const firstName = parts[0] || 'Новый';
        const lastName = parts.slice(1).join(' ') || 'Клиент (Пруткон)';
        
        const res = await window.callBitrix('crm.contact.add', {
            fields: {
                NAME: firstName,
                LAST_NAME: lastName,
                OPENED: "Y",
                TYPE_ID: "CLIENT",
                PHONE: [{ VALUE: phone, VALUE_TYPE: "WORK" }]
            }
        });
        
        if (res) {
            if(window.showToast) window.showToast(`Контакт ${firstName} успешно создан!`, "success");
            return res; // Возвращает ID
        }
    } catch (e) {
        console.error("Create contact error:", e);
        if(window.showToast) window.showToast("Ошибка при создании контакта", "error");
    }
    return null;
};

window.getBitrixUsers = async function() { return await window.callBitrix('user.get', { ACTIVE: true }) || []; };
window.getBitrixDeal = async function(id) { return await window.callBitrix('crm.deal.get', { id: Number(id) }); };
window.fetchBitrixContactDetails = async function(dealId) {
    const deal = await window.getBitrixDeal(dealId);
    if (deal?.CONTACT_ID) {
        const c = await window.callBitrix('crm.contact.get', { id: deal.CONTACT_ID });
        if (c) {
            const nameEl = document.getElementById('card-client-name');
            const phoneEl = document.getElementById('card-client-phone');
            if (nameEl) nameEl.innerText = `${c.NAME} ${c.LAST_NAME || ''}`;
            if (phoneEl) phoneEl.innerText = c.PHONE?.[0]?.VALUE || '---';
        }
    }
};

window.getBitrixCategories = async function() {
    return await window.callBitrix('crm.dealcategory.list', { order: { SORT: 'ASC' }, select: ["ID", "NAME"] }) || [];
};

window.getBitrixStages = async function(categoryId) {
    let entityId = (!categoryId || categoryId === "0") ? 'DEAL_STAGE' : 'DEAL_STAGE_' + categoryId;
    return await window.callBitrix('crm.status.list', { filter: { ENTITY_ID: entityId }, order: { SORT: 'ASC' } }) || [];
};

window.saveBitrixConfig = function(cfg) {
    if(!cfg) return;
    window.bitrixConfig = cfg;
    localStorage.setItem('prutkon_bitrix_config', JSON.stringify(cfg));
    if(window.showToast) window.showToast("Конфигурация Битрикс24 сохранена", "success");
};

window.testBitrixConnection = async function() {
    if(window.showToast) window.showToast("Проверка связи с Битрикс24...", "info");
    const res = await window.callBitrix('profile');
    if (res && res.ID) {
        if(window.showToast) window.showToast("Связь успешно установлена!", "success");
        if (document.getElementById('bitrix-status-msg')) {
             document.getElementById('bitrix-status-msg').innerHTML = '<span class="emerald"><i class="fa-solid fa-check"></i> Соединение активно (' + (res.NAME ? res.NAME : res.ID) + ')</span>';
        }
    } else {
        if(window.showToast) window.showToast("Ошибка подключения к Битрикс24", "error");
        if (document.getElementById('bitrix-status-msg')) {
             document.getElementById('bitrix-status-msg').innerHTML = '<span class="brand-red"><i class="fa-solid fa-triangle-exclamation"></i> Ошибка подключения</span>';
        }
    }
};
