/*
 * calculator.js - ПРУТКОН ОС | Калькулятор КП (v18.25.5)
 */

console.log("🧮 Calculator v18.25.5 loading...");

// ГЛОБАЛЬНЫЕ ДАННЫЕ ПРАЙСОВ
window.allProducts = []; // Объединённый список всех товаров
window.currentEditOrderId = null;
window.editingBasketItemIdx = null;

// Fallbacks если core.js не загружен
window.safeParse = window.safeParse || function (key, def) { try { return JSON.parse(localStorage.getItem(key)) || def; } catch (e) { return def; } };
window.formatCurrency = window.formatCurrency || function (val) { return parseFloat(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'; };

if (!window.dbTransProducts) window.dbTransProducts = [];
if (!window.catalogData) window.catalogData = [];
if (!window.calcBasket) window.calcBasket = window.safeParse('prutkon_calc_basket', []);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    checkEditMode();
    setTimeout(renderBasket, 500);
    window.updateBitrixDealBadge?.(document.getElementById('calc-bitrix-deal-id')?.value || '');
    
    // Загрузка всех товаров из прайсов
    setTimeout(window.loadAllProducts, 500);
    
    // Заполнение выпадашки категорий
    setTimeout(window.populateProductCategories, 1000);
    
    // Инициализация калькулятора
    initCalculator();
    populateBrands();
});

// ==================== ФУНКЦИИ МОДАЛА МОДЕЛЕЙ ====================

window.addNewModelModal = () => {
    if (window.CatalogMaster) {
        window.CatalogMaster.open();
    } else if (window.showToast) {
        window.showToast("Мастер создания моделей не загружен", "error");
    }
};

// ==================== РЕЖИМ РЕДАКТИРОВАНИЯ ====================

window.switchCalcTab = (tab) => {
    const manualResult = document.getElementById('manual-tab-content');
    const aiResult = document.getElementById('ai-tab-content');
    const tabs = document.querySelectorAll('#calc-tabs button');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'manual') {
        manualResult?.classList.remove('hidden');
        aiResult?.classList.add('hidden');
        tabs[0]?.classList.add('active');
    } else {
        manualResult?.classList.add('hidden');
        aiResult?.classList.remove('hidden');
        tabs[1]?.classList.add('active');
    }
};

function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('editId');
    if (!editId) return;

    if (!window.orders || window.orders.length === 0) {
        setTimeout(checkEditMode, 1000);
        return;
    }

    const order = window.orders.find(o => o.id === editId);
    if (order) {
        window.currentEditOrderId = editId;
        window.calcBasket = [...(order.items || [])];
        localStorage.setItem('prutkon_calc_basket', JSON.stringify(window.calcBasket));

        const clientInput = document.getElementById('bitrix-client-search');
        if (clientInput) clientInput.value = order.clientName || '';

        const dealIdInput = document.getElementById('calc-bitrix-deal-id');
        if (dealIdInput) dealIdInput.value = order.bitrixDealId || '';
        window.updateBitrixDealBadge?.(order.bitrixDealId || '');

        if (window.calcBasket.length > 0) {
            loadItemToForm(0);
        }

        if (window.showToast) window.showToast(`Заказ ${editId} подгружен (${window.calcBasket.length} поз.)`, 'warning');
        renderBasket();
        updateEditHeader();
    }
}

function updateEditHeader() {
    const header = document.querySelector('.view-header h2');
    if (header && window.currentEditOrderId) {
        header.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--accent-blue)"></i> Редактирование заказа <span style="color:var(--brand-red)">${window.currentEditOrderId}</span>`;
    }
}

function initCalculator() {
    const brandSelect = document.getElementById('calc-brand-select');
    const modelSelect = document.getElementById('calc-model-select');
    const yearSelect = document.getElementById('calc-year-select');

    if (brandSelect) {
        brandSelect.addEventListener('change', (e) => {
            window.populateModels(e.target.value);
            window.populateYears(e.target.value, '');
        });
    }
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            window.populateYears(brandSelect.value, e.target.value);
        });
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            const found = window.catalogData.find(item =>
                (item.brand === brandSelect.value) && (item.model === modelSelect.value) && (item.year === e.target.value || !e.target.value)
            );
            if (found) window.fillForm(found);
        });
    }

    const artInput = document.getElementById('calc-article-full');
    const nameInput = document.getElementById('calc-name-full');

    const handleSearchInput = (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (val.length < 3) return;
        const source = [...(window.catalogData || []), ...(window.dbTransProducts || []), ...(window.dbProducts || [])];
        const queryWords = val.split(/\s+/).filter(Boolean);
        const found = source.find(t => {
            const searchStr = `${t.art || ''} ${t.name || ''} ${t.brand || ''} ${t.model || ''} ${t.pitch || t.p || ''}`.toLowerCase();
            return queryWords.every(word => searchStr.includes(word));
        });
        if (found) {
            window.fillForm(found);
            if (window.showToast) {
                if (!window.lastToastTime || Date.now() - window.lastToastTime > 3000) {
                    window.showToast(`Найдено: ${found.brand || ''} ${found.model || ''} (${found.pitch || found.p || '—'} мм)`, 'success');
                    window.lastToastTime = Date.now();
                }
            }
        }
    };

    if (artInput) {
        artInput.addEventListener('input', handleSearchInput);
    }
    if (nameInput) {
        nameInput.addEventListener('input', handleSearchInput);
    }

    ['calc-length', 'calc-width', 'calc-pitch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            window.selectedBasePrice = null;
            calculateCP();
        });
    });
    
    const elQty = document.getElementById('calc-qty');
    if (elQty) elQty.addEventListener('input', calculateCP);

    const elClientQty = document.getElementById('calc-client-qty');
    if (elClientQty) elClientQty.addEventListener('input', calculateCP);
}

window.toggleCalcClientProvided = (checked) => {
    const group = document.getElementById('calc-client-qty-group');
    if (group) group.style.display = checked ? 'grid' : 'none';
    if (!checked) {
        const input = document.getElementById('calc-client-qty');
        if (input) input.value = 0;
    }
    window.calculateCP();
};

function populateBrands() {
    const sel = document.getElementById('calc-brand-select');
    if (!sel || !window.catalogData) return;
    const brands = [...new Set(window.catalogData.map(item => item.brand))].filter(Boolean).sort();
    sel.innerHTML = '<option value="">-- Бренд --</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
}
window.populateBrands = populateBrands;

window.populateModels = function (brand) {
    const sel = document.getElementById('calc-model-select');
    if (!sel || !brand) return;
    const filtered = window.catalogData.filter(item => item.brand === brand);
    const models = [...new Set(filtered.map(item => item.model || item.art))].filter(Boolean).sort();
    sel.innerHTML = '<option value="">-- Модель --</option>' + models.map(m => `<option value="${m}">${m}</option>`).join('');
    if (filtered.length > 0) window.fillForm(filtered[0]);
};

window.populateYears = function (brand, model) {
    const sel = document.getElementById('calc-year-select');
    if (!sel) return;
    const items = window.catalogData.filter(item => item.brand === brand && item.model === model);
    const years = [...new Set(items.map(item => item.year || 'Стандарт'))].filter(Boolean).sort();
    sel.innerHTML = '<option value="">-- Версии --</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
};

window.fillForm = function (t) {
    if (!t) return;
    if (document.getElementById('calc-article-full')) document.getElementById('calc-article-full').value = t.art || '';
    if (document.getElementById('calc-name-full')) document.getElementById('calc-name-full').value = t.name || `${t.brand || ''} ${t.model || ''}`.trim();
    if (document.getElementById('calc-length')) document.getElementById('calc-length').value = t.length || t.l || 12000;
    if (document.getElementById('calc-width')) document.getElementById('calc-width').value = t.width || t.w || 800;
    if (document.getElementById('calc-pitch')) document.getElementById('calc-pitch').value = t.pitch || t.p || 40;
    if (document.getElementById('calc-qty')) document.getElementById('calc-qty').value = 1;
    
    if (t.price) {
        window.selectedBasePrice = parseFloat(t.price);
    } else {
        window.selectedBasePrice = null;
    }
    
    calculateCP();
};

window.loadItemToForm = function (idx) {
    const item = window.calcBasket[idx];
    if (!item) return;

    window.editingBasketItemIdx = idx;

    if (document.getElementById('calc-article-full')) document.getElementById('calc-article-full').value = item.art || '';
    if (document.getElementById('calc-name-full')) document.getElementById('calc-name-full').value = item.name || '';
    if (document.getElementById('calc-qty')) document.getElementById('calc-qty').value = item.qty || 1;

    const matches = item.specs?.match(/L=(\d+), W=(\d+), P=(\d+)/);
    if (matches) {
        if (document.getElementById('calc-length')) document.getElementById('calc-length').value = matches[1];
        if (document.getElementById('calc-width')) document.getElementById('calc-width').value = matches[2];
        if (document.getElementById('calc-pitch')) document.getElementById('calc-pitch').value = matches[3];
    }

    // Сохраняем цену из корзины, чтобы формула её не перебила
    if (item.price) {
        window.selectedBasePrice = parseFloat(item.price);
    }

    calculateCP();

    const btn = document.getElementById('btn-add-to-basket');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Обновить позицию';
    if (window.showToast) window.showToast('Параметры позиции загружены для изменения', 'info');
};

function calculateCP() {
    const L = parseFloat(document.getElementById('calc-length')?.value) || 0;
    const W = parseFloat(document.getElementById('calc-width')?.value) || 0;
    const P = parseFloat(document.getElementById('calc-pitch')?.value) || 0;
    const Q = parseFloat(document.getElementById('calc-qty')?.value) || 1;
    const priceDisplay = document.getElementById('calc-main-price');

    const isClientProvided = document.getElementById('calc-client-provided')?.checked || false;
    let clientQty = isClientProvided ? (parseFloat(document.getElementById('calc-client-qty')?.value) || 0) : 0;
    clientQty = Math.max(0, Math.min(clientQty, Q));
    const makeQty = Q - clientQty;

    const displayMakeQty = document.getElementById('calc-make-qty-display');
    if (displayMakeQty) displayMakeQty.innerText = makeQty;

    let total = 0;

    if (window.selectedBasePrice !== undefined && window.selectedBasePrice !== null) {
        if (isClientProvided && clientQty > 0) {
            const laborVatMarkup = ((L / 1000) * 250) * 2.0 * 1.22;
            const laborPrice = Math.min(laborVatMarkup, window.selectedBasePrice * 0.4);
            total = (makeQty * window.selectedBasePrice) + (clientQty * laborPrice);
        } else {
            total = window.selectedBasePrice * Q;
        }
    } else {
        if (L <= 0 || W <= 0 || P <= 0) {
            if (priceDisplay) priceDisplay.innerText = '0,00 ₽';
            return 0;
        }

        const rods = Math.floor(L / P);
        const material = (rods * 350) + (L * 2 * 0.95);
        const labor = (L / 1000) * 250;
        
        const baseTotalMake = (material + labor) * 1.4;
        const baseTotalClient = labor * 1.4;

        total = (makeQty * baseTotalMake) + (clientQty * baseTotalClient);
    }

    if (priceDisplay) priceDisplay.innerText = window.formatCurrency(total);
    return total;
}

window.calcBasket = window.safeParse('prutkon_calc_basket', []);
if (!Array.isArray(window.calcBasket)) window.calcBasket = [];

window.updateBitrixDealBadge = function (dealId) {
    const dealInput = document.getElementById('calc-bitrix-deal-id');
    const badge = document.getElementById('calc-bitrix-deal-status');
    const normalizedDealId = dealId ? String(dealId) : '';

    if (dealInput) dealInput.value = normalizedDealId;
    if (!badge) return;

    if (!normalizedDealId) {
        badge.style.display = 'none';
        badge.innerHTML = '';
        return;
    }
    
    badge.style.display = 'inline-flex';
    badge.innerHTML = `<i class="fa-solid fa-link"></i> Сделка Bitrix24: #${normalizedDealId}`;
};

window.addItemToBasket = () => {
    const totalNum = calculateCP();
    if (totalNum <= 0) return window.showToast?.('Сначала заполните размеры для расчета цены!', 'warning');

    const q = parseInt(document.getElementById('calc-qty')?.value) || 1;
    const unitPrice = totalNum / q;

    const clientQty = document.getElementById('calc-client-provided')?.checked ? (parseInt(document.getElementById('calc-client-qty')?.value) || 0) : 0;
    const makeQty = q - clientQty;

    let specs = `L=${document.getElementById('calc-length')?.value}, W=${document.getElementById('calc-width')?.value}, P=${document.getElementById('calc-pitch')?.value}`;
    if (clientQty > 0) {
        specs += `, От клиента: ${clientQty} шт., Изготовление: ${makeQty} шт.`;
    }

    const item = {
        id: window.editingBasketItemIdx !== null ? window.calcBasket[window.editingBasketItemIdx].id : Date.now(),
        art: document.getElementById('calc-article-full')?.value || 'Б/А',
        name: document.getElementById('calc-name-full')?.value || 'Транспортер',
        specs: specs,
        qty: q,
        price: unitPrice,
        total: totalNum,
        priceFormatted: window.formatCurrency(totalNum)
    };

    if (window.editingBasketItemIdx !== null) {
        window.calcBasket[window.editingBasketItemIdx] = item;
        window.editingBasketItemIdx = null;
        const btn = document.getElementById('btn-add-to-basket');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Добавить в корзину';
        window.showToast?.('Позиция обновлена', 'success');
    } else {
        window.calcBasket.push(item);
        window.showToast?.('Добавлено в корзину', 'success');
    }

    localStorage.setItem('prutkon_calc_basket', JSON.stringify(window.calcBasket));
    renderBasket();
};

function renderBasket() {
    const cont = document.getElementById('calc-basket-items');
    if (!cont) return;
    cont.innerHTML = '';

    let grandTotal = 0;
    window.calcBasket.forEach((item, idx) => {
        grandTotal += (item.total || 0);
        const div = document.createElement('div');
        div.className = 'glass-panel p-3 mb-3';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="font-size:0.8rem;">
                    <strong style="color:#fff;">${item.name}</strong><br>
                    <code style="color:var(--accent-blue); font-size:0.7rem;">${item.art}</code><br>
                    <span class="neutral" style="font-size:0.75rem;">${item.specs}</span>
                    <div class="mt-2" style="font-weight:700; color:var(--emerald-neon);">
                        ${item.qty} шт. x ${window.formatCurrency(item.price)} = ${window.formatCurrency(item.total)}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="action-btn" style="color:var(--accent-blue); background:rgba(0,180,255,0.1); width:32px; height:32px;" onclick="window.loadItemToForm(${idx})" title="Редактировать">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn" style="color:var(--brand-red); background:rgba(255,0,0,0.1); width:32px; height:32px;" onclick="window.delBasket(${idx})" title="Удалить">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        cont.appendChild(div);
    });

    if (document.getElementById('calc-basket-total')) document.getElementById('calc-basket-total').innerText = window.formatCurrency(grandTotal);
    if (document.getElementById('basket-count-badge')) document.getElementById('basket-count-badge').innerText = `${window.calcBasket.length} поз.`;
}

window.delBasket = (index) => {
    window.calcBasket.splice(index, 1);
    localStorage.setItem('prutkon_calc_basket', JSON.stringify(window.calcBasket));
    renderBasket();
};

window.createFinalOrder = () => {
    if (!window.calcBasket.length) {
        window.showToast?.('Корзина пуста', 'warning');
        return;
    }

    const isEditing = !!window.currentEditOrderId;
    const confirmMsg = isEditing ? `Сохранить изменения в заказе ${window.currentEditOrderId}?` : 'Создать финальный заказ?';

    if (window.confirmAction) {
        window.confirmAction('Оформление', confirmMsg, processOrder);
    } else {
        if (confirm(confirmMsg)) processOrder();
    }

    async function processOrder() {
        const total = window.calcBasket.reduce((s, i) => s + (i.total || 0), 0);
        window.renderLiveStatus?.('sync');

        if (isEditing) {
            const idx = window.orders?.findIndex(o => o.id === window.currentEditOrderId);
            if (idx !== undefined && idx !== -1) {
                window.orders[idx].items = [...window.calcBasket];
                window.orders[idx].total = total;
                window.orders[idx].updatedAt = new Date().toLocaleString('ru-RU');

                if (window.orders[idx].bitrixDealId && window.updateBitrixDealSum) {
                    await window.updateBitrixDealSum(window.orders[idx].bitrixDealId, total, window.calcBasket);
                    await window.addBitrixDealComment?.(window.orders[idx].bitrixDealId, `Заказ ${window.currentEditOrderId} отредактирован. Новая сумма: ${total} руб.`);
                }
                window.showToast?.('Заказ обновлен в ERP и Bitrix24!', 'success');
            }
        } else {
            const order = {
                id: 'ORD-' + Math.floor(Math.random() * 900000 + 100000),
                date: new Date().toLocaleDateString('ru-RU'),
                items: [...window.calcBasket],
                total: total,
                status: 'Новая',
                clientName: document.getElementById('bitrix-client-search')?.value || 'Розничный клиент',
                bitrixDealId: document.getElementById('calc-bitrix-deal-id')?.value || null
            };
            if (!window.orders) window.orders = [];
            window.orders.unshift(order);
            if (order.bitrixDealId && window.updateBitrixDealSum) {
                await window.updateBitrixDealSum(order.bitrixDealId, total);
                await window.addBitrixDealComment?.(order.bitrixDealId, `Создан новый расчет ${order.id} на сумму ${total} руб.`);
            }
            window.showToast?.('Заказ создан!', 'success');
        }

        window.saveOrders?.();
        window.calcBasket = [];
        localStorage.setItem('prutkon_calc_basket', '[]');
        window.renderLiveStatus?.('idle');
        window.updateBitrixDealBadge('');

        window.showToast?.('Заказ успешно сохранен локально!', 'success');

        const finishBtn = document.createElement('button');
        finishBtn.className = 'btn btn-primary w-100 mt-4';
        finishBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> ЗАВЕРШИТЬ И ВЕРНУТЬСЯ В РЕЕСТР';
        finishBtn.onclick = () => window.location.href = 'orders.html';

        const basketCont = document.querySelector('.basket-panel');
        if (basketCont) {
            basketCont.innerHTML = '';
            basketCont.appendChild(finishBtn);
        } else {
            setTimeout(() => window.location.href = 'orders.html', 1500);
        }
    }
};

window.createBitrixDealFromBasket = async () => { /* Оставлен как есть, если используется Bitrix API */ };

// ==================== ОБЪЕДИНЕНИЕ С ПРАЙСАМИ ====================

// Загрузка всех товаров из всех прайсов
window.loadAllProducts = function() {
    const products = [];
    
    // Товары из основного прайса
    if (window.dbProducts && window.dbProducts.length > 0) {
        window.dbProducts.forEach(p => {
            products.push({
                id: p.id,
                art: p.art,
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: p.category,
                photo: p.photo,
                source: 'prices'
            });
        });
    }
    
    // Товары из транспортеров
    if (window.dbTransProducts && window.dbTransProducts.length > 0) {
        window.dbTransProducts.forEach(p => {
            products.push({
                id: p.id,
                art: p.art,
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: 'Транспортеры',
                source: 'trans'
            });
        });
    }
    
    // Справочник моделей и деталей
    if (window.catalogData && window.catalogData.length > 0) {
        window.catalogData.forEach(p => {
            products.push({
                id: p.id,
                art: p.art,
                name: p.name,
                price: p.price || 0,
                stock: p.stock || 0,
                category: p.category || 'Справочник',
                source: 'catalog'
            });
        });
    }
    
    window.allProducts = products;
    console.log(`📦 Загружено товаров: ${products.length}`);
};

// Заполнение выпадашки категорий
window.populateProductCategories = function() {
    const sel = document.getElementById('calc-product-category');
    if (!sel) return;
    
    const categories = [...new Set(window.allProducts.map(p => p.category).filter(Boolean))].sort();
    
    sel.innerHTML = '<option value="">-- Выберите категорию --</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    
    console.log(`📂 Категории: ${categories.length}`);
};

// Загрузка типов товаров для выбранной категории
window.loadProductTypes = function() {
    const category = document.getElementById('calc-product-category')?.value;
    const typeSel = document.getElementById('calc-product-type');
    const productSel = document.getElementById('calc-product-select');
    
    if (!category) {
        typeSel.innerHTML = '<option value="">-- Сначала выберите категорию --</option>';
        productSel.innerHTML = '<option value="">-- Сначала выберите тип --</option>';
        return;
    }
    
    // Фильтруем товары по категории
    const filtered = window.allProducts.filter(p => p.category === category);
    
    // Группируем по типу (можно использовать поле name или кастомное)
    const types = [...new Set(filtered.map(p => {
        // Пробуем извлечь тип из названия (например "Палец 123" -> "Палец")
        const name = p.name || '';
        const firstWord = name.split(' ')[0];
        return firstWord || 'Товар';
    })).filter(Boolean)];
    
    typeSel.innerHTML = '<option value="">-- Все типы --</option>' + 
        types.map(t => `<option value="${t}">${t}</option>`).join('');
    
    // Сразу загружаем все товары категории
    window.loadProductsByType();
};

// Загрузка товаров для выбранного типа
window.loadProductsByType = function() {
    const category = document.getElementById('calc-product-category')?.value;
    const type = document.getElementById('calc-product-type')?.value;
    const sel = document.getElementById('calc-product-select');
    
    if (!category) {
        sel.innerHTML = '<option value="">-- Сначала выберите категорию --</option>';
        return;
    }
    
    let filtered = window.allProducts.filter(p => p.category === category);
    
    if (type) {
        filtered = filtered.filter(p => {
            const name = p.name || '';
            const firstWord = name.split(' ')[0];
            return firstWord === type;
        });
    }
    
    // Сортируем по артикулу
    filtered.sort((a, b) => (a.art || '').localeCompare(b.art || ''));
    
    // Группируем по параметрам
    const groups = {};
    filtered.forEach(p => {
        let grpName = 'Прочие';
        if (category === 'belts') {
            grpName = p.thickness ? `Толщина: ${p.thickness} мм` : 'Толщина: Не указана';
        } else {
            let dia = p.dia || p.diameter;
            if (!dia) {
                const match = String(p.name || '').match(/Ø\s*(\d+(\.\d+)?)/i);
                if (match) dia = match[1];
            }
            grpName = dia ? `Диаметр: Ø${dia} мм` : 'Диаметр: Не указан';
        }
        if (!groups[grpName]) groups[grpName] = [];
        groups[grpName].push(p);
    });

    let opts = '<option value="">-- Выберите товар --</option>';
    for (let grpName in groups) {
        opts += `<optgroup label="${grpName}">`;
        opts += groups[grpName].map(p => {
            const stockStatus = p.stock > 0 ? `✅ ${p.stock} шт.` : '❌ Нет';
            const cleanName = window.formatProductNameForList ? window.formatProductNameForList(p) : p.name;
            return `<option value="${p.id}">${p.art || '---'} | ${cleanName} | ${window.formatCurrency(p.price)} | ${stockStatus}</option>`;
        }).join('');
        opts += `</optgroup>`;
    }
    
    sel.innerHTML = opts;
    console.log(`📦 Найдено товаров: ${filtered.length}`);
};

// Выбор товара из базы
window.selectProductFromBase = function() {
    const sel = document.getElementById('calc-product-select');
    const productId = sel.value;
    
    if (!productId) {
        document.getElementById('calc-product-info').classList.add('hidden');
        return;
    }
    
    const product = window.allProducts.find(p => String(p.id) === String(productId));
    if (!product) return;
    
    // Заполняем поля формы
    if (document.getElementById('calc-article-full')) {
        document.getElementById('calc-article-full').value = product.art || '';
    }
    if (document.getElementById('calc-name-full')) {
        document.getElementById('calc-name-full').value = product.name || '';
    }
    
    // Показываем информацию о товаре
    const infoBox = document.getElementById('calc-product-info');
    if (infoBox) {
        infoBox.classList.remove('hidden');
        
        const artEl = document.getElementById('info-art');
        const nameEl = document.getElementById('info-name');
        const priceEl = document.getElementById('info-price');
        const stockEl = document.getElementById('info-stock');
        
        if (artEl) artEl.innerText = product.art || '---';
        if (nameEl) nameEl.innerText = (product.name || '').substring(0, 50);
        if (priceEl) priceEl.innerText = window.formatCurrency(product.price || 0);
        if (stockEl) stockEl.innerText = `${product.stock || 0} шт.`;
        
        // Цвет остатка
        if (product.stock > 0) {
            stockEl.style.color = 'var(--emerald-neon)';
        } else {
            stockEl.style.color = 'var(--brand-red)';
        }
    }
    
    // Автозаполнение цены в калькуляторе
    if (product.price) {
        window.selectedBasePrice = parseFloat(product.price);
    } else {
        window.selectedBasePrice = null;
    }
    calculateCP();
    
    window.showToast(`Выбран товар: ${product.art}`, 'success');
};