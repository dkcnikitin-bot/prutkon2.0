// Используем глобальные переменные из core.js
// Заказы и производственный прогресс (могут быть переписаны из облака)
let orders = [
    { id: 'ЗН-26042', date: '31.10.2026', art: '100.22233', brand: 'ОАО Агро-Регион', sum: 164500, status: 'В работе', progress: 40 },
    { id: 'ЗН-26041', date: '30.10.2026', art: 'Пруток сдвоенный (20шт)', brand: 'ИП Иванов (Ropa)', sum: 17000, status: 'Новый', progress: 0 },
    { id: 'ЗН-26040', date: '25.10.2026', art: 'Транспортер 8000x600', brand: 'КФХ Агро (Holmer)', sum: 89200, status: 'Завершен', progress: 100 }
];

// Утилиты
function formatCurr(num) {
    return Math.round(num || 0).toLocaleString('ru-RU') + ' ₽';
}

function getTodayStr() {
    var td = new Date();
    var d = td.getDate();
    var m = td.getMonth() + 1;
    var y = td.getFullYear();
    return (d < 10 ? '0' + d : d) + '.' + (m < 10 ? '0' + m : m) + '.' + y;
}
var tdStr = getTodayStr();

function initApp() {
    var dates = document.querySelectorAll('.today-date');
    for (var i = 0; i < dates.length; i++) {
        dates[i].innerText = tdStr;
    }

    // Авто-подключение к Firebase при наличии ключей (из core.js)
    setTimeout(function() {
        if(localStorage.getItem('fb_connected') === 'true' && window.connectFirebase) {
            window.connectFirebase(true);
        }
    }, 500);

    // Сессия восстановления (если не загружена из core.js)
    if (!window.restoreSession) {
        window.restoreSession = function() {
            var emp = null;
            if (typeof window.getCurrentEmployee === 'function') {
                emp = window.getCurrentEmployee();
            }
            if (!emp && window.dbEmployees) {
                var savedId = localStorage.getItem('prutkon_login_id');
                if (savedId !== null) {
                    emp = window.dbEmployees.find(e => String(e.id) === String(savedId));
                }
                if (!emp) {
                    var savedLogin = localStorage.getItem('prutkon_login_idx');
                    if (savedLogin !== null) {
                        emp = window.dbEmployees[parseInt(savedLogin)];
                    }
                }
            }
            if (emp) {
                window.currentUser = emp;
                var modal = document.getElementById('login-modal');
                if (modal) modal.classList.remove('active');
                try {
                    document.querySelectorAll('.user-name').forEach(el => el.innerText = emp.name);
                    document.querySelectorAll('.user-role').forEach(el => el.innerText = emp.role);
                } catch(e) {}
                console.log('Сессия восстановлена для: ' + emp.name);
            }
        };
        window.restoreSession();
    }

    // Навигация
    var navItems = document.querySelectorAll('.nav-item');
    var viewSections = document.querySelectorAll('.view-section');
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function(e) {
            var item = e.currentTarget;
            for (var j = 0; j < navItems.length; j++) navItems[j].classList.remove('active');
            for (var k = 0; k < viewSections.length; k++) viewSections[k].classList.remove('active');
            item.classList.add('active');
            var targetId = item.getAttribute('data-target');
            var targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
        });
    }

    // Умный поиск
    var searchInput = document.getElementById('global-search');
    var searchDropdown = document.getElementById('search-dropdown');

    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', function(e) {
            var q = e.target.value.toLowerCase();
            searchDropdown.innerHTML = '';
            if (q.length < 2) {
                searchDropdown.classList.add('hidden');
                return;
            }

            var results = [];
            var kwords = q.split(/\s+/).filter(function(kw) { return kw.length > 0; });
            
            function matchKW(str) {
                if (!str) return false;
                var s = str.toLowerCase();
                for (var i=0; i<kwords.length; i++) {
                    if (s.indexOf(kwords[i]) === -1) return false;
                }
                return true;
            }

            if (window.db && window.db.trans) window.db.trans.forEach(function(t, idx) {
                var s = t.article + ' ' + t.model + ' ' + t.brand + ' транспортер';
                if (matchKW(s)) results.push({ type: 'Транспортер', text: t.article + ' - ' + t.brand + ' ' + t.model, data: t, cat: 'trans', idx: idx });
            });
            if (window.db && window.db.hardware) window.db.hardware.forEach(function(h, idx) {
                if (matchKW(h.name + ' ' + h.material)) results.push({ type: 'Скобянка', text: h.name, data: h, cat: 'hardware', idx: idx });
            });
            if (window.db && window.db.fasteners) window.db.fasteners.forEach(function(f, idx) {
                if (matchKW(f.name + ' ' + f.material)) results.push({ type: 'Метизы', text: f.name, data: f, cat: 'fasteners', idx: idx });
            });
            if (window.db && window.db.rods) window.db.rods.forEach(function(r, idx) {
                if (matchKW(r.name)) results.push({ type: 'Скобянка (Пруток)', text: r.name, data: r, cat: 'rods', idx: idx });
            });

            if (results.length > 0) {
                results.forEach(function(res) {
                    var div = document.createElement('div');
                    div.className = 'search-item';
                    var imgSrc = res.data.img ? 'extracted_xlsx/xl/media/' + res.data.img : 'extracted_xlsx/xl/media/image11.jpg';
                    div.innerHTML = '<img src="' + imgSrc + '" class="search-item-img">' +
                                    '<div class="search-item-info">' +
                                        '<span class="search-item-title">' + res.text + '</span>' +
                                        '<span class="search-item-model">' + (res.data.material || res.data.brand || '') + '</span>' +
                                    '</div>' +
                                    '<span class="search-item-cat">' + res.type + '</span>';
                    div.onclick = function() {
                        searchInput.value = '';
                        searchDropdown.classList.add('hidden');
                        window.selectFromCatalog(res.cat, res.idx);
                    };
                    searchDropdown.appendChild(div);
                });
                searchDropdown.classList.remove('hidden');
            } else {
                searchDropdown.innerHTML = '<div class="p-1 neutral">Ничего не найдено</div>';
                searchDropdown.classList.remove('hidden');
            }
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-search')) searchDropdown.classList.add('hidden');
        });
    }

    function fillFormWithData(res) {
        if (!res || !res.data) return;
        var t = res.data;
        if (res.type === 'Транспортер') {
            document.getElementById('calc-article').value = t.article || '';
            document.getElementById('calc-brand').value = t.brand || '';
            document.getElementById('calc-model').value = t.model || '';
            document.getElementById('calc-conv-type').value = t.type || 'main';
            document.getElementById('calc-length').value = t.length || 0;
            document.getElementById('calc-width').value = t.width || 0;
            document.getElementById('calc-pitch').value = t.pitch || 0;
            document.getElementById('calc-belts-side').value = t.beltsSide || '';
            document.getElementById('calc-lock-type').value = t.lock || '';
        } else {
            document.getElementById('calc-article').value = t.name || '';
            document.getElementById('calc-chk-met').checked = true;
            document.getElementById('calc-txt-met').value = t.name || '';
        }
    }

    // Автоподстановка данных при вводе артикула
    var calcArtInput = document.getElementById('calc-article');
    if (calcArtInput) {
        calcArtInput.addEventListener('input', function(e) {
            var val = e.target.value.toLowerCase();
            if (val.length < 4) return;
            // Ищем в базе по артикулу
            var found = null;
            db.trans.forEach(function(t) { if(t.article.toLowerCase() === val) found = { type: 'Транспортер', data: t }; });
            if (!found) {
                db.hardware.forEach(function(h) { if(h.name.toLowerCase().indexOf(val) !== -1) found = { type: 'Скобянка', data: h }; });
            }
            if (found) fillFormWithData(found);
        });
    }

    // Калькулятор
    var btnCalcRun = document.getElementById('btn-calc-run');
    if (btnCalcRun) {
        btnCalcRun.addEventListener('click', function() {
            var art = document.getElementById('calc-article').value.trim();
            if (art === '') {
                window.showToast('Укажите артикул!', 'warning');
                return;
            }
            
            var L = parseFloat(document.getElementById('calc-length').value) || 0;
            var W = parseFloat(document.getElementById('calc-width').value) || 0;
            var P = parseFloat(document.getElementById('calc-pitch').value) || 0;
            
            var isBelt = (L > 0 && W > 0 && P > 0);
            var materialCost = 0;
            var finalWeight = 0;
            var rodsCount = 0;

            if (isBelt) {
                rodsCount = Math.floor(L / P);
                var beltMeters = (L / 1000) * 2;
                materialCost += beltMeters * 1200; 
                finalWeight += rodsCount * (W / 1000) * 0.65;
            }

            if (document.getElementById('calc-chk-str').checked) {
                var step1 = parseInt(document.getElementById('calc-stp-str').value) || 1;
                var c1 = isBelt ? Math.ceil(rodsCount / step1) : 50; 
                materialCost += c1 * 250;
            }
            if (document.getElementById('calc-chk-ben').checked) {
                var step2 = parseInt(document.getElementById('calc-stp-ben').value) || 1;
                var c2 = isBelt ? Math.ceil(rodsCount / step2) : 50;
                materialCost += c2 * 320;
            }
            if (document.getElementById('calc-chk-met').checked) {
                materialCost += 5000;
            }

            if (materialCost === 0) materialCost = 5000;

            var laborCost = materialCost * 0.25;
            var total = (materialCost + laborCost) * 1.35; // margin
            
            document.getElementById('calc-res-total').innerText = formatCurr(total);
            if (!isBelt) {
                 document.getElementById('calc-res-rods').innerText = 'Сырье/Шт';
                 document.getElementById('calc-res-weight').innerText = 'по факту';
            } else {
                 document.getElementById('calc-res-rods').innerText = rodsCount + ' шт';
                 document.getElementById('calc-res-weight').innerText = finalWeight.toFixed(1) + ' кг';
            }
            
            document.getElementById('calc-results-wrap').classList.remove('hidden');
        });
    }

    // Корзина калькулятора (Многопозиционные заказы)
    window.calcBasket = [];
    window.addItemToBasket = function() {
        var art = document.getElementById('calc-article').value || 'Деталь';
        var totalStr = document.getElementById('calc-res-total').innerText;
        var totalVal = parseInt(totalStr.replace(/[^\d]/g, '')) || 0;
        var brand = document.getElementById('calc-brand').value || '';
        var model = document.getElementById('calc-model').value || '';
        
        // Сбор полной спецификации
        var spec = {
            art: art,
            brand: brand,
            model: model,
            desc: brand + ' ' + (parseFloat(document.getElementById('calc-length').value) || ''),
            sum: totalVal,
            details: {
                L: parseFloat(document.getElementById('calc-length').value) || 0,
                W: parseFloat(document.getElementById('calc-width').value) || 0,
                P: parseFloat(document.getElementById('calc-pitch').value) || 0,
                rods: document.getElementById('calc-res-rods').innerText,
                weight: document.getElementById('calc-res-weight').innerText,
                type: document.getElementById('calc-conv-type').value,
                belts: document.getElementById('calc-belts-side').value,
                lock: document.getElementById('calc-lock-type').value,
                features: []
            }
        };

        if (document.getElementById('calc-chk-str').checked) spec.details.features.push('Прямой пруток (Ш:' + document.getElementById('calc-stp-str').value + ', D:' + document.getElementById('calc-dia-str').value + ')');
        if (document.getElementById('calc-chk-ben').checked) spec.details.features.push('Гнутый пруток (Ш:' + document.getElementById('calc-stp-ben').value + ', D:' + document.getElementById('calc-dia-ben').value + ')');
        if (document.getElementById('calc-chk-met').checked) spec.details.features.push('Скобянка: ' + document.getElementById('calc-txt-met').value);
        
        window.calcBasket.push(spec);
        renderBasket();
        document.getElementById('calc-results-wrap').classList.add('hidden');
        window.showToast('Позиция ' + art + ' добавлена в состав заказа!', 'success');
    };

    function renderBasket() {
        var tbody = document.getElementById('calc-basket-tbody');
        var totalEl = document.getElementById('calc-basket-total');
        if (!tbody) return;
        
        if (window.calcBasket.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center neutral">Список пуст. Добавьте расчет выше.</td></tr>';
            totalEl.innerText = '0 ₽';
            return;
        }
        
        var h = '';
        var total = 0;
        window.calcBasket.forEach(function(it, i) {
            total += it.sum;
            h += '<tr><td><strong>' + it.art + '</strong></td><td>' + it.desc + '</td><td class="emerald">' + formatCurr(it.sum) + '</td>' +
                 '<td><button class="td-btn btn-danger" onclick="window.delBasketItem('+i+')"><i class="fa-solid fa-times"></i></button></td></tr>';
        });
        tbody.innerHTML = h;
        totalEl.innerText = formatCurr(total);
    }

    window.delBasketItem = function(i) {
        window.calcBasket.splice(i, 1);
        renderBasket();
    };

    window.createFinalOrder = function() {
        if (window.calcBasket.length === 0) return window.showToast('Список изделий пуст!', 'warning');
        
        var firstArt = window.calcBasket[0].art;
        var brand = document.getElementById('calc-brand').value || 'Н/Д';
        var totalSum = window.calcBasket.reduce(function(acc, it) { return acc + it.sum; }, 0);
        
        var newId = 'ЗН-' + Math.floor(26000 + Math.random() * 1000);
        var artText = window.calcBasket.length > 1 ? firstArt + ' + ' + (window.calcBasket.length - 1) + ' поз.' : firstArt;
        
        orders.unshift({ 
            id: newId, 
            date: tdStr, 
            art: artText, 
            brand: brand, 
            sum: totalSum, 
            status: 'Новый', 
            progress: 0,
            items: JSON.parse(JSON.stringify(window.calcBasket)) // Сохраняем детализацию
        });
        
        window.calcBasket = [];
        renderBasket();
        document.getElementById('calc-form').reset();
        renderOrders();
        renderProd();
        document.querySelector('[data-target="orders"]').click();
        window.showToast('Заказ ' + newId + ' успешно сформирован!', 'success');
    };

    // Отрисовка Справочников
    var catTabs = document.querySelectorAll('#catalog-tabs button');
    var catTable = document.getElementById('catalog-table');
    if (catTabs.length > 0) {
        for (var i = 0; i < catTabs.length; i++) {
            catTabs[i].addEventListener('click', function(e) {
                var c = e.target.getAttribute('data-cat');
                for (var j = 0; j < catTabs.length; j++) catTabs[j].classList.remove('active');
                e.target.classList.add('active');
                renderCatTab(c);
            });
        }
        renderCatTab('trans');
    }
    
    // Глобальная функция выбора из каталога
    window.selectedProductForCalc = null;
    window.selectFromCatalog = function(typeStr, index) {
        var res = null;
        if (typeStr === 'trans') res = { type: 'Транспортер', data: db.trans[index] };
        if (typeStr === 'hardware') res = { type: 'Скобянка', data: db.hardware[index] };
        if (typeStr === 'fasteners') res = { type: 'Метизы', data: db.fasteners[index] };
        if (typeStr === 'rods') res = { type: 'Скобянка', data: db.rods[index] };
        if (res) {
            window.selectedProductForCalc = res;
            window.selectedProductForCalc.category = typeStr;
            window.selectedProductForCalc.index = index;
            var m = document.getElementById('product-modal');
            var imgPath = res.data.img ? 'extracted_xlsx/xl/media/' + res.data.img : 'extracted_xlsx/xl/media/image11.jpg';
            document.getElementById('pc-img').src = imgPath;
            document.getElementById('pc-title').innerText = 'Карточка: ' + res.type;
            document.getElementById('pc-subtitle').innerText = 'Арт: ' + (res.data.article || res.data.name);
            
            document.getElementById('pc-edit-art').value = res.data.article || res.data.name;
            document.getElementById('pc-edit-img').value = res.data.img || '';
            document.getElementById('pc-edit-price').value = res.data.price || 0;
            document.getElementById('pc-edit-stock').value = res.data.count || 0;
            
            document.getElementById('pc-ordered-count').innerText = Math.floor(Math.random() * 50) + 1;
            if(m) m.classList.add('active');
        }
    };

    var btnPcClose = document.getElementById('btn-pc-close');
    if(btnPcClose) btnPcClose.addEventListener('click', function() {
        document.getElementById('product-modal').classList.remove('active');
    });

    var btnPcSave = document.getElementById('btn-pc-save');
    if(btnPcSave) btnPcSave.addEventListener('click', function() {
        if(window.selectedProductForCalc) {
            var cat = window.selectedProductForCalc.category;
            var idx = window.selectedProductForCalc.index;
            var data = db[cat][idx];
            data.price = parseFloat(document.getElementById('pc-edit-price').value) || 0;
            data.count = parseInt(document.getElementById('pc-edit-stock').value) || 0;
            data.img = document.getElementById('pc-edit-img').value;
            var newName = document.getElementById('pc-edit-art').value;
            if(data.article !== undefined) data.article = newName;
            else data.name = newName;
            
            document.getElementById('product-modal').classList.remove('active');
            renderCatTab(cat);
            if(window.fbPush) window.fbPush(); // Сразу в облако
        }
    });

    window.openImageSelector = function() {
        var wrap = document.getElementById('image-selector-wrap');
        if (!wrap) return;
        wrap.innerHTML = '';
        realImages.forEach(function(img) {
            var el = document.createElement('img');
            el.src = 'extracted_xlsx/xl/media/' + img;
            el.style = 'width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:0.2s;';
            el.onclick = function() {
                document.getElementById('pc-edit-img').value = img;
                document.getElementById('pc-img').src = 'extracted_xlsx/xl/media/' + img;
                // Highlight selected
                var imgs = wrap.querySelectorAll('img');
                for(var k=0; k<imgs.length; k++) imgs[k].style.borderColor = 'transparent';
                el.style.borderColor = 'var(--neon-emerald)';
            };
            wrap.appendChild(el);
        });
        wrap.classList.toggle('hidden');
    };

    var btnPcDel = document.getElementById('btn-pc-del');
    if(btnPcDel) btnPcDel.addEventListener('click', function() {
        if(window.selectedProductForCalc && confirm('Вы уверены, что хотите безвозвратно удалить этот товар из базы справочника?')) {
            var cat = window.selectedProductForCalc.category;
            var idx = window.selectedProductForCalc.index;
            db[cat].splice(idx, 1);
            document.getElementById('product-modal').classList.remove('active');
            renderCatTab(cat);
        }
    });

    var btnPcUse = document.getElementById('btn-pc-use');
    if(btnPcUse) btnPcUse.addEventListener('click', function() {
        document.getElementById('product-modal').classList.remove('active');
        if(window.selectedProductForCalc) {
            document.querySelector('[data-target="calculator"]').click();
            fillFormWithData(window.selectedProductForCalc);
            window.scrollTo(0, 0);
        }
    });

    // Управление настройками и сотрудниками
    if (!window.dbEmployees) {
        window.dbEmployees = [
            { name: 'Администратор', role: 'admin', base: 50000, share: 0, pwd: 'admin', extra: 0 },
            { name: 'Иванов С.А.', role: 'Мастер цеха', base: 45000, share: 0.40, pwd: '123', extra: 0 },
            { name: 'Петров В.В.', role: 'Оператор ЧПУ', base: 40000, share: 0.35, pwd: '123', extra: 0 }
        ];
    }
    if (!window.dbSalArchive) window.dbSalArchive = [];

    window.renderEmpSettings = function() {
        var el = document.getElementById('settings-emp-list');
        var loginSel = document.getElementById('login-role');
        if(!el) return;
        var h = '';
        var selH = '';
        window.dbEmployees.forEach(function(e, i) {
            h += '<div style="display:flex; gap:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); flex-wrap:wrap">' +
                '<input type="text" class="form-control" value="'+e.name+'" onchange="window.updateEmp('+i+', &quot;name&quot;, this.value)" style="flex:2; min-width:150px" placeholder="ФИО">' +
                '<select class="form-control" onchange="window.updateEmp('+i+', &quot;role&quot;, this.value)" style="flex:1; min-width:140px">' +
                    '<option value="admin" '+(e.role==='admin'?'selected':'')+'>Администратор</option>' +
                    '<option value="manager" '+(e.role==='manager'?'selected':'')+'>Менеджер КП</option>' +
                    '<option value="prod" '+(e.role==='prod'?'selected':'')+'>Зав. производством</option>' +
                '</select>' +
                '<input type="password" class="form-control" value="'+e.pwd+'" onchange="window.updateEmp('+i+', &quot;pwd&quot;, this.value)" style="flex:1; min-width:80px" placeholder="Пароль">' +
                '<input type="number" class="form-control" value="'+e.base+'" onchange="window.updateEmp('+i+', &quot;base&quot;, this.value)" style="flex:1" placeholder="Оклад">' +
                '<input type="number" class="form-control" value="'+(e.share*100)+'" onchange="window.updateEmp('+i+', &quot;share&quot;, this.value)" style="flex:1" title="ФОТ %" placeholder="%">' +
                '<button class="btn btn-danger" onclick="window.delEmp('+i+')"><i class="fa-solid fa-times"></i></button></div>';
            selH += '<option value="'+i+'">'+e.name + ' (' + (e.role === 'admin' ? 'Админ' : e.role === 'manager' ? 'Менеджер' : 'Зав. произв.') + ')</option>';
        });
        el.innerHTML = h;
        if(loginSel) loginSel.innerHTML = selH;
        if(window.fbPush) window.fbPush();
    };
    
    window.addEmployee = function() {
        window.dbEmployees.push({ name: 'Новый сотрудник', role: 'Сотрудник', base: 30000, share: 0.1, pwd: '123', extra: 0 });
        window.renderEmpSettings();
    };

    window.updateEmp = function(idx, fld, val) {
        if (fld === 'share') val = parseFloat(val) / 100;
        if (fld === 'base' || fld === 'extra') val = parseFloat(val) || 0;
        window.dbEmployees[idx][fld] = val;
        renderProd();
    };
    window.delEmp = function(idx) {
        window.dbEmployees.splice(idx, 1);
        renderEmpSettings();
        renderProd();
    };
    window.addEmployee = function() {
        window.dbEmployees.push({ name: '', role: '', base: 0, share: 0 });
        renderEmpSettings();
    };
    // Firebase функции теперь определены в core.js - используем их оттуда
    // Здесь только специфичная логика для заказов/производства
    
    // Расширяем fbListen для обновления локальных данных при изменениях в облаке
    const originalFbListen = window.fbListen;
    window.fbListen = function() {
        if (!window.fbDB) return;
        console.log('📡 Запуск слушателя Cloud Firestore для заказов...');
        
        window.fbDB.collection('erp_data').doc('current').onSnapshot(function(doc) {
            if (doc.exists) {
                var data = doc.data();
                
                // Проверяем, чтобы не зациклить пуш - обновляем только если TS в облаке новее
                if (data.ts && window.lastLocalPush && data.ts <= window.lastLocalPush) return;

                console.log('☁️ Получены данные из облака, обновляю локальные...');
                
                if (data.orders) orders = data.orders;
                if (data.orders_archive) window.ordersArchive = data.orders_archive;
                if (data.employees) window.dbEmployees = data.employees;
                if (data.archive) window.dbSalArchive = data.archive;
                if (data.catalog_db) {
                    for(var key in data.catalog_db) {
                        db[key] = data.catalog_db[key];
                    }
                }
                
                renderOrders();
                renderArchive();
                renderProd();
                renderProd();
            }
        });
    };

    window.archiveOrder = function(id) {
        var idx = orders.findIndex(o => o.id === id);
        if (idx !== -1) {
            if (!window.ordersArchive) window.ordersArchive = [];
            var arc = orders.splice(idx, 1)[0];
            window.ordersArchive.unshift(arc);
            renderOrders();
            renderArchive();
            renderProd();
            window.fbPush();
            window.showToast('Заказ ' + id + ' перемещен в архив', 'success');
        }
    };

        window.restoreFromArchive = function(id) {
        var idx = window.ordersArchive.findIndex(o => o.id === id);
        if (idx !== -1) {
            var order = window.ordersArchive.splice(idx, 1)[0];
            orders.unshift(order);
            renderOrders();
            renderArchive();
            window.fbPush();
        }
    };

    window.cloneOrder = function(id) {
        var o = orders.find(x => x.id === id) || window.ordersArchive.find(x => x.id === id);
        if (o) {
            var newO = JSON.parse(JSON.stringify(o));
            newO.id = 'ЗН-' + Math.floor(26000 + Math.random() * 1000);
            newO.date = tdStr;
            newO.status = 'Новый';
            newO.progress = 0;
            orders.unshift(newO);
            renderOrders();
            renderProd();
            window.showToast('Копия заказа ' + id + ' создана', 'success');
        }
    };

    window.printReport = function() {
        var complSum = 0, cCount = 0;
        var tbody = document.getElementById('print-report-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        orders.forEach(o => {
            if(o.status === 'Завершен' || o.status === 'Оплачен ФОТ') {
                complSum += o.sum;
                cCount++;
            }
            tbody.innerHTML += '<tr><td>'+o.id+'</td><td>'+o.date+'</td><td>'+(o.art || '-')+'</td><td>'+formatCurr(o.sum)+'</td><td>'+o.status+'</td></tr>';
        });
        document.getElementById('print-rep-revenue').innerText = formatCurr(complSum);
        document.getElementById('print-rep-count').innerText = cCount + ' шт';
        document.getElementById('print-rep-fot').innerText = formatCurr(complSum * 0.25);
        
        document.body.classList.add('print-report');
        document.getElementById('print-report-area').classList.remove('hidden');
        window.print();
    };

    function renderArchive() {
        var el = document.getElementById('archive-tbody');
        if (!el) return;
        
        // Авто-архивация: проверяем завершенные заказы старше 3-х дней
        var now = new Date();
        for (var i = orders.length - 1; i >= 0; i--) {
            var o = orders[i];
            if (o.status === 'Завершен' || o.status === 'Отменен') {
                var parts = o.date.split('.');
                if (parts.length === 3) {
                    var oDate = new Date(parts[2], parts[1]-1, parts[0]);
                    var diffDays = (now - oDate) / (1000 * 60 * 60 * 24);
                    if (diffDays > 3) {
                        var arc = orders.splice(i, 1)[0];
                        window.ordersArchive.unshift(arc);
                    }
                }
            }
        }

        var h = '';
        window.ordersArchive.forEach(o => {
            h += '<tr><td>' + o.id + '</td><td>' + o.date + '</td><td>' + o.art + '</td><td>' + formatCurr(o.sum) + '</td>' +
                 '<td><span class="badge status-success">' + o.status + '</span></td>' +
                 '<td><button class="btn btn-secondary btn-sm" onclick="window.restoreFromArchive(\'' + o.id + '\')">Вернуть</button></td></tr>';
        });
        el.innerHTML = h || '<tr><td colspan="6" class="text-center neutral">Архив пуст</td></tr>';
    }

    // Отрисовка заказов
    var ordTable = document.querySelector('#orders-table tbody');
    function renderOrders() {
        if (!ordTable) return;
        ordTable.innerHTML = '';
        orders.forEach(function(o) {
            var tr = document.createElement('tr');
            var statuses = ['Новый', 'В работе', 'Завершен', 'Отменен'];
            var statOpts = '';
            for (var q = 0; q < statuses.length; q++) {
                var s = statuses[q];
                statOpts += '<option value="' + s + '" ' + (o.status === s ? 'selected' : '') + '>' + s + '</option>';
            }
            
            var badgeColor = 'status-primary';
            if (o.status === 'Новый') badgeColor = 'status-warning bg-transparent border';
            if (o.status === 'Завершен') badgeColor = 'status-success';
            if (o.status === 'Отменен') badgeColor = 'status-danger';

            var itemsSpec = '';
            if (o.items && o.items.length > 0) {
                itemsSpec = '<div class="order-spec-mini mt-1" style="font-size:0.75rem; color:var(--text-muted); line-height:1.2;">';
                o.items.forEach(function(it) {
                    itemsSpec += '• ' + it.art + ' (' + (it.details ? it.details.L+'x'+it.details.W : it.desc) + ')<br>';
                });
                itemsSpec += '</div>';
            }

            var tdStrHTML = '<td><strong>' + (o.id || '-') + '</strong></td>';
            tdStrHTML += '<td>' + (o.date || '-') + '</td>';
            tdStrHTML += '<td>' + (o.art || 'Без артикула') + '<br><small class="neutral">' + (o.brand || '-') + '</small>' + itemsSpec + '</td>';
            tdStrHTML += '<td>' + formatCurr(o.sum) + '</td>';
            tdStrHTML += '<td><select class="select-status ' + badgeColor + '" data-id="' + o.id + '">' + statOpts + '</select></td>';
            var arcBtn = o.status === 'Завершен' ? '<button class="action-btn" style="margin-left:5px" title="Архивировать" onclick="window.archiveOrder(\'' + o.id + '\')"><i class="fa-solid fa-box-archive"></i></button>' : '';
            tdStrHTML += '<td><div class="action-wrap" style="display:flex; gap:5px">' +
                                '<button class="action-btn print-bill-btn" data-id="' + o.id + '" title="Печать Счета"><i class="fa-solid fa-print"></i></button>' +
                                '<button class="action-btn" title="Копировать" onclick="window.cloneOrder(\'' + o.id + '\')"><i class="fa-solid fa-copy"></i></button>' +
                                arcBtn +
                           '</div></td>';
            
            tr.innerHTML = tdStrHTML;
            ordTable.appendChild(tr);
        });

        var selects = document.querySelectorAll('.select-status');
        for (var sIdx = 0; sIdx < selects.length; sIdx++) {
            selects[sIdx].addEventListener('change', function(e) {
                var rowId = e.target.getAttribute('data-id');
                for (var i = 0; i < orders.length; i++) {
                    if (orders[i].id === rowId) {
                        orders[i].status = e.target.value;
                        if (e.target.value === 'В работе' && orders[i].progress === 0) orders[i].progress = 10;
                        if (e.target.value === 'Завершен') orders[i].progress = 100;
                    }
                }
                renderOrders();
                renderProd();
                window.fbPush();
            });
        }

        var printBtns = document.querySelectorAll('.print-bill-btn');
        for (var pIdx = 0; pIdx < printBtns.length; pIdx++) {
            printBtns[pIdx].addEventListener('click', function(e) {
                var rowId = e.currentTarget.getAttribute('data-id');
                var ord = null;
                for (var i = 0; i < orders.length; i++) {
                    if (orders[i].id === rowId) ord = orders[i];
                }
                if (ord) {
                    document.getElementById('bill-num').innerText = ord.id;
                    document.getElementById('bill-date').innerText = ord.date;
                    document.getElementById('bill-item').innerText = ord.art + ' (' + ord.brand + ')';
                    document.getElementById('bill-price').innerText = formatCurr(ord.sum);
                    document.getElementById('bill-sum').innerText = formatCurr(ord.sum);
                    document.getElementById('bill-total').innerText = formatCurr(ord.sum);
                    
                    document.getElementById('print-bill-area').classList.remove('hidden');
                    document.body.classList.add('print-bill');
                    window.print();
                }
            });
        }
    }

    // Производство
    function renderProd() {
        var ordBadge = document.getElementById('orders-badge');
        if (ordBadge) ordBadge.innerText = orders.length;
        
        var complSum = 0, cCount = 0, actCount = 0, prodCount = 0;
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].status === 'Завершен' || orders[i].status === 'Оплачен ФОТ') {
                complSum += orders[i].sum;
                cCount++;
            }
            if (orders[i].status !== 'Отменен') actCount++;
            if (orders[i].status === 'Новый' || orders[i].status === 'В работе') prodCount++;
        }
        
        var bProd = document.getElementById('badge-prod');
        if (bProd) {
            bProd.innerText = prodCount;
            bProd.style.display = prodCount > 0 ? 'inline-block' : 'none';
        }
        
        var avg = cCount > 0 ? complSum / cCount : 0;
        
        // Обновление Дашборда и Отчетов
        var dsRev = document.querySelectorAll('.dash-revenue');
        for (var ir = 0; ir < dsRev.length; ir++) dsRev[ir].innerText = formatCurr(complSum);
        
        var elRepRev = document.getElementById('rep-total-rev');
        if(elRepRev) elRepRev.innerText = formatCurr(complSum);
        
        var elRepCount = document.getElementById('rep-completed-count');
        if(elRepCount) elRepCount.innerText = cCount + ' шт';
        
        var dsCount = document.querySelectorAll('.dash-orders-count');
        for (var ic = 0; ic < dsCount.length; ic++) dsCount[ic].innerText = actCount + ' шт';
        
        var dashAvg = document.querySelectorAll('.dash-avg-check');
        for (var ia = 0; ia < dsAvg.length; ia++) dsAvg[ia].innerText = formatCurr(avg);

        // Расчет сводки материалов
        var totalRods = 0, totalWeight = 0, totalBelts = 0;
        orders.forEach(o => {
            if(o.status === 'Новый' || o.status === 'В работе') {
                if(o.items) {
                    o.items.forEach(it => {
                        var d = it.details;
                        if(d) {
                            totalRods += parseFloat(d.rods) || 0;
                            totalWeight += parseFloat(d.weight) || 0;
                            totalBelts += ((parseFloat(d.L) || 0) / 1000) * 2;
                        }
                    });
                }
            }
        });
        var elSR = document.getElementById('summary-rods');
        if(elSR) elSR.innerText = totalRods + ' шт';
        var elSW = document.getElementById('summary-weight');
        if(elSW) elSW.innerText = totalWeight.toFixed(1) + ' кг';
        var elSB = document.getElementById('summary-belts');
        if(elSB) elSB.innerText = totalBelts.toFixed(1) + ' м';

        // ФОТ и Зарплата (Оклад + Премия + Gross/Net/NDFL)
        var fot = complSum * 0.25; // 25% margin mapped to salaries
        var dashFot = document.getElementById('dash-fot-total');
        if (dashFot) dashFot.innerText = formatCurr(fot);

        var salTbody = document.getElementById('salary-tbody');
        var printSalTbody = document.getElementById('print-salary-tbody');
        if (salTbody) {
            var salHtml = '';
            var printHtml = '';
            var totalPrem = 0, totalNet = 0;
            for (var iEmp = 0; iEmp < window.dbEmployees.length; iEmp++) {
                var emp = window.dbEmployees[iEmp];
                var prem = fot * (emp.share || 0);
                var extra = emp.extra || 0;
                var gross = emp.base + prem + extra;
                var ndfl = gross * 0.13;
                var net = gross - ndfl;
                totalPrem += prem;
                totalNet += net;
                
                salHtml += '<tr>' +
                    '<td><strong>' + emp.name + '</strong><br><small class="neutral">'+emp.role+'</small></td>' +
                    '<td>' + formatCurr(emp.base) + '</td>' +
                    '<td class="emerald">+' + formatCurr(prem) + '</td>' +
                    '<td><input type="number" class="form-control" value="'+extra+'" style="width:100px; padding:4px" onchange="window.updateEmp('+iEmp+', &quot;extra&quot;, this.value)"></td>' +
                    '<td>' + formatCurr(gross) + '</td>' +
                    '<td class="text-warning">-' + formatCurr(ndfl) + '</td>' +
                    '<td><strong class="blue">' + formatCurr(net) + '</strong></td>' +
                '</tr>';
                
                printHtml += '<tr><td>' + emp.name + '</td><td>' + formatCurr(emp.base) + '</td><td>' + formatCurr(prem) + '</td><td>' + formatCurr(extra) + '</td><td>' + formatCurr(gross) + '</td><td>' + formatCurr(ndfl) + '</td><td><strong>' + formatCurr(net) + '</strong></td><td></td></tr>';
            }
            salTbody.innerHTML = salHtml;
            if(printSalTbody) printSalTbody.innerHTML = printHtml;
            
            var elPrem = document.getElementById('sal-total-prem');
            if(elPrem) elPrem.innerText = formatCurr(totalPrem);
            var elNet = document.getElementById('sal-total-net');
            if(elNet) elNet.innerText = formatCurr(totalNet);
        }

        window.paySalary = function() {
            var p = document.getElementById('sal-period-sel').value;
            var tn = document.getElementById('sal-total-net').innerText;
            if(confirm('Подтверждаете начисление и выплату зарплаты за ' + p + ' на сумму ' + tn + ' ?\\nАрхив будет сохранен, а текущие закрытые заказы выведены из ФОТ.')) {
                window.dbSalArchive.push({ period: p, total: tn, count: window.dbEmployees.length });
                // Очистка или сброс сумм заказов (Мок закрытия периода)
                orders.forEach(function(o) { if(o.status === 'Завершен') o.status = 'Оплачен ФОТ'; });
                renderProd();
                if(window.fbPush) window.fbPush();
                window.showToast('Выплата за ' + p + ' проведена!', 'success');
            }
        };

        window.printSalary = function() {
            var p = document.getElementById('sal-period-sel').value;
            var tn = document.getElementById('sal-total-net').innerText;
            document.getElementById('print-salary-period').innerText = p;
            document.getElementById('print-salary-date').innerText = getTodayStr();
            document.getElementById('print-salary-total').innerText = tn;
            
            document.body.classList.add('print-salary');
            document.getElementById('print-salary-area').classList.remove('hidden');
            window.print();
        };

        // Render Archive
        var arcTbody = document.getElementById('salary-archive-tbody');
        if (arcTbody) {
            var arcHtml = '';
            window.dbSalArchive.forEach(function(arc) {
                arcHtml += '<tr><td>' + arc.period + '</td><td class="emerald"><strong>' + arc.total + '</strong></td><td>' + arc.count + ' чел.</td><td><span style="background:var(--status-success);color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem">Проведено</span></td></tr>';
            });
            if(window.dbSalArchive.length === 0) arcHtml = '<tr><td colspan="4" class="text-center neutral">Архив пуст</td></tr>';
            arcTbody.innerHTML = arcHtml;
        }

        // Формирование очереди производства
        var htmlQueue = '';
        var hasActive = false;
        
        for (var i = 0; i < orders.length; i++) {
            var o = orders[i];
            if (o.status === 'В работе' || o.status === 'Новый') {
                hasActive = true;
                var p1 = o.progress || 0;
                
                var artLower = (o.art || "").toString().toLowerCase();
                var machine = 'Сборочный цех (Ручная сборка)';
                if (artLower.indexOf('транспортер') !== -1) {
                    machine = 'Агрегатная сборка / Вулканизация';
                } else if (artLower.indexOf('пруток') !== -1 || artLower.indexOf('замок') !== -1) {
                    machine = 'Станок ЧПУ (Гибка/Штамповка)';
                }
                
                var actionBtnHTML = '';
                if (o.status === 'Новый') {
                    actionBtnHTML = '<button class="btn btn-emerald mt-3" style="font-size:0.8rem; padding: 6px 12px; border-radius:4px" onclick="window.workAction(&quot;' + o.id + '&quot;, &quot;start&quot;)"><i class="fa-solid fa-play"></i> Начать производство</button>';
                } else if (o.status === 'В работе') {
                    actionBtnHTML = '<div style="display:flex; gap:10px;" class="mt-3"><button class="btn btn-secondary" style="font-size:0.8rem; padding: 6px 12px; border-radius:4px" onclick="window.workAction(&quot;' + o.id + '&quot;, &quot;progress&quot;)"><i class="fa-solid fa-forward-step"></i> Выполнить цикл (+20%)</button>' +
                                    '<button class="btn btn-success" style="font-size:0.8rem; padding: 6px 12px; background:var(--status-success); color:white; border-radius:4px" onclick="window.workAction(&quot;' + o.id + '&quot;, &quot;finish&quot;)"><i class="fa-solid fa-check-double"></i> Сдать на склад (Завершить)</button></div>';
                }
                
                var itemsSpecProd = '';
                if (o.items && o.items.length > 0) {
                    itemsSpecProd = '<div class="prod-spec glass-panel p-2 mt-2" style="font-size:0.85rem; border:1px solid rgba(255,255,255,0.05);">';
                    o.items.forEach(function(it) {
                        var d = it.details;
                        itemsSpecProd += '<div class="mb-1"><strong>' + it.art + '</strong>: ' + (d ? d.L+'x'+d.W + ' (Шаг '+d.P+') | ' + d.rods : (it.desc || 'Без описания')) + '</div>';
                        if(d && d.features && d.features.length) itemsSpecProd += '<div class="neutral mb-2" style="font-size:0.75rem; padding-left:10px;">' + d.features.join(' | ') + '</div>';
                    });
                    itemsSpecProd += '</div>';
                }
                
                htmlQueue += '<div class="prod-item">' +
                        '<div class="prod-header">' +
                            '<span class="prod-id"><i class="fa-solid fa-file-signature"></i> ' + o.id + '</span>' +
                            '<div style="display:flex; gap:5px;">' +
                                '<button class="action-btn" title="Изменить" onclick="window.openOrderEdit(\'' + o.id + '\')"><i class="fa-solid fa-edit"></i></button>' +
                                '<button class="action-btn" title="Печать Наряда" onclick="window.printProdOrder(\'' + o.id + '\')"><i class="fa-solid fa-print"></i></button>' +
                                '<span class="prod-status ' + (o.status === 'В работе' ? 'status-info' : 'status-warning') + '">' + o.status + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div style="font-size:0.95rem">' + (o.art || 'Без артикула') + ' <br><small class="neutral">' + (o.brand || 'Без бренда') + '</small></div>' +
                        itemsSpecProd +
                        '<div class="prod-progress-bg"><div class="prod-progress-bar" style="width: ' + p1 + '%"></div></div>' +
                        '<div class="prod-machine"><i class="fa-solid fa-industry emerald"></i> <strong>' + machine + '</strong> &nbsp;|&nbsp; Прогресс: ' + p1 + '%</div>' +
                        actionBtnHTML +
                    '</div>';
            }
        }
        
        if (!hasActive) {
            htmlQueue = '<div class="p-4 neutral text-center"><i class="fa-solid fa-mug-hot fa-2x mb-3"></i><br>Нет активных заказов. Оборудование простаивает. Разместите заказ из Калькулятора.</div>';
        }

        var qMain = document.getElementById('production-queue');
        var qDash = document.getElementById('dash-prod-queue');
        if (qMain) qMain.innerHTML = htmlQueue;
        if (qDash) qDash.innerHTML = htmlQueue;
    }

    // Глобальные обработчики для кнопок Производства
    window.workAction = function(id, action) {
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].id === id) {
                if (action === 'start') {
                    orders[i].status = 'В работе';
                    orders[i].progress = 10;
                } else if (action === 'progress') {
                    orders[i].progress = Math.min(orders[i].progress + 20, 99);
                } else if (action === 'finish') {
                    orders[i].progress = 100;
                    orders[i].status = 'Завершен';
                    // Показываем toast уведомление
                    window.showToast('Заказ ' + id + ' завершён!', 'success');
                }
            }
        }
        renderOrders();
        renderProd();
        if(window.fbPush) window.fbPush();
    };

    renderOrders();
    renderProd();

    var btnExport = document.getElementById('btn-export-excel');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            var rows = [["№ Заказа", "Дата", "Изделие/Артикул", "Бренд/Клиент", "Сумма", "Статус"]];
            for(var i = 0; i < orders.length; i++) {
                var o = orders[i];
                rows.push([o.id, o.date, o.art, o.brand, o.sum, o.status]);
            }
            var csvContent = "\uFEFF";
            for(var j = 0; j < rows.length; j++) {
                csvContent += rows[j].join(";") + "\r\n";
            }
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement("a");
            link.setAttribute("href", URL.createObjectURL(blob));
            link.setAttribute("download", "Пруткон_Отчет_" + tdStr + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    window.printInvoiceFromBasket = function() {
        if (window.calcBasket.length === 0) return alert('Список пуст!');
        var firstArt = window.calcBasket[0].art;
        var totalSum = window.calcBasket.reduce(function(acc, it) { return acc + it.sum; }, 0);
        
        document.getElementById('bill-num').innerText = 'Б/Н';
        document.getElementById('bill-date').innerText = tdStr;
        document.getElementById('bill-item').innerText = window.calcBasket.length > 1 ? firstArt + ' + ' + (window.calcBasket.length - 1) + ' поз.' : firstArt;
        document.getElementById('bill-price').innerText = formatCurr(totalSum);
        document.getElementById('bill-sum').innerText = formatCurr(totalSum);
        document.getElementById('bill-total').innerText = formatCurr(totalSum);
        
        document.getElementById('print-bill-area').classList.remove('hidden');
        document.body.classList.add('print-bill');
        window.print();
    };

    window.printCalc = function() {
        var printWrap = document.getElementById('calc-basket-tbody').cloneNode(true);
        // Добавляем таблицу спецификации в область печати
        var printHeader = document.getElementById('print-header-calc');
        var existingTable = printHeader.parentElement.querySelector('.print-spec-table');
        if (existingTable) existingTable.remove();

        if (window.calcBasket.length > 0) {
            var table = document.createElement('table');
            table.className = 'data-table print-spec-table mt-4';
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = '<thead><tr><th>Позиция</th><th>Спецификация и параметры</th><th>Сумма</th></tr></thead>';
            var tbody = document.createElement('tbody');
            window.calcBasket.forEach(function(it) {
                var d = it.details;
                var specTxt = '<strong>Размеры:</strong> ' + d.L + 'x' + d.W + ' (Шаг ' + d.P + ')<br>' +
                              '<strong>Тип:</strong> ' + d.type + ', <strong>Ремни:</strong> ' + d.belts + ', <strong>Замок:</strong> ' + d.lock + '<br>' +
                              '<strong>Прутки:</strong> ' + d.rods + ', <strong>Вес:</strong> ' + d.weight + '<br>' +
                              '<small>' + d.features.join(' | ') + '</small>';
                tbody.innerHTML += '<tr><td>' + it.art + '</td><td>' + specTxt + '</td><td>' + formatCurr(it.sum) + '</td></tr>';
            });
            table.appendChild(tbody);
            printHeader.after(table);
        }

        document.getElementById('print-header-calc').classList.remove('hidden');
        document.body.classList.add('print-calc');
        window.print();
    };

    window.addEventListener('beforeprint', function() {
        // Class is added inside specific print functions to avoid collisions
    });

    window.openOrderEdit = function(id) {
        var o = orders.find(x => x.id === id);
        if(!o) return;
        document.getElementById('edit-order-id').value = o.id;
        document.getElementById('edit-order-art').value = o.art;
        document.getElementById('edit-order-brand').value = o.brand;
        document.getElementById('edit-order-sum').value = o.sum;
        document.getElementById('edit-order-status').value = o.status;
        document.getElementById('order-edit-modal').classList.add('active');
    };

    window.saveOrderEdit = function() {
        var id = document.getElementById('edit-order-id').value;
        var o = orders.find(x => x.id === id);
        if(o) {
            o.art = document.getElementById('edit-order-art').value;
            o.brand = document.getElementById('edit-order-brand').value;
            o.sum = parseFloat(document.getElementById('edit-order-sum').value) || 0;
            o.status = document.getElementById('edit-order-status').value;
            document.getElementById('order-edit-modal').classList.remove('active');
            renderOrders();
            renderProd();
            window.fbPush();
        }
    };

    window.printProdOrder = function(id) {
        var o = orders.find(x => x.id === id);
        if(!o) return;
        
        document.getElementById('print-prod-id').innerText = o.id;
        document.getElementById('print-prod-date').innerText = o.date;
        document.getElementById('print-prod-art').innerText = o.art || "-";
        document.getElementById('print-prod-brand').innerText = o.brand || "-";
        
        var artLower = (o.art || "").toString().toLowerCase();
        var machine = 'Сборочный цех';
        if (artLower.indexOf('транспортер') !== -1) machine = 'Агрегатная сборка / Вулканизация';
        document.getElementById('print-prod-machine').innerText = machine;
        
        var specsHTML = '';
        if(o.items) {
            o.items.forEach(it => {
                specsHTML += '<p><strong>'+(it.art || '-')+'</strong>: ' + (it.details ? it.details.L+'x'+it.details.W+' | '+it.details.rods : (it.desc || "")) + '</p>';
                if(it.details && it.details.features && it.details.features.length) specsHTML += '<p style="margin-left:20px; font-size:0.9rem;">- ' + it.details.features.join('<br>- ') + '</p>';
            });
        }
        document.getElementById('print-prod-specs').innerHTML = specsHTML || 'Детализация отсутствует.';
        
        document.body.classList.add('print-prod-order');
        document.getElementById('print-prod-order-area').classList.remove('hidden');
        window.print();
    };

    window.addEventListener('afterprint', function() {
        document.body.classList.remove('print-calc', 'print-bill', 'print-salary', 'print-report', 'print-prod-order');
        var areas = ['print-salary-area', 'print-report-area', 'print-prod-order-area', 'print-bill-area', 'print-header-calc'];
        areas.forEach(id => {
            var el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    });

}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});
