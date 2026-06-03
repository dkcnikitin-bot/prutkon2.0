/* catalog_master/step1.js - ПРУТКОН ERP Шаг 1: Идентификация Изделия */

window.CatalogStep1 = {
    render() {
        const s = window.CatalogState;
        const dicts = window.CatalogDicts;
        const cats = window.catalogCategories || [];
        
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
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Год:</label>
                            <input type="number" value="${s.year || 2026}" class="form-control" style="height:32px; font-weight:700; font-size:0.85rem; background:#000; border:1px solid #222; text-align:center;" oninput="window.CatalogStep1.set('year', this.value)">
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Раздел справочника:</label>
                            <select class="form-control" style="height:32px; font-weight:700; font-size:0.8rem; background:#000; border:1px solid #222;" onchange="window.CatalogStep1.set('category', this.value)">
                                ${cats.map(c => `<option value="${c.id}" ${s.category===c.id?'selected':''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- СТРОКА 2: НАЗВАНИЕ, БРЕНД, МОДЕЛЬ -->
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Полное название (для накладных):</label>
                            <input type="text" value="${s.name || ''}" class="form-control" style="height:32px; font-weight:700; font-size:0.8rem; background:#000; border:1px solid #222;" oninput="window.CatalogStep1.set('name', this.value)">
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Бренд:</label>
                            <input type="text" value="${s.brand || ''}" class="form-control" style="height:32px; font-weight:700; font-size:0.8rem; background:#000; border:1px solid #222;" oninput="window.CatalogStep1.set('brand', this.value)">
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Модель техники:</label>
                            <input type="text" value="${s.model || ''}" class="form-control" style="height:32px; font-weight:700; font-size:0.8rem; background:#000; border:1px solid #222;" oninput="window.CatalogStep1.set('model', this.value)">
                        </div>
                    </div>

                    <!-- СТРОКА 3: КУЛЬТУРЫ (PILLS) -->
                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:8px; display:block;">Применимость (культуры):</label>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${dicts.crops.map(crop => {
                                const active = s.crops.includes(crop);
                                return `<div onclick="window.CatalogStep1.toggleCrop('${crop}')" style="cursor:pointer; padding:4px 10px; border-radius:6px; font-size:0.65rem; font-weight:800; border:1px solid ${active?'var(--brand-red)':'#181818'}; background:${active?'rgba(226,31,38,0.1)':'#000'}; color:${active?'#fff':'#444'}; transition:0.2s;">${crop}</div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- СТРОКА 4: ФОТО -->
                    <div class="form-group">
                        <label style="font-size:0.6rem; color:#555; text-transform:uppercase; font-weight:900; margin-bottom:5px; display:block;">Ссылка на фото:</label>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="text" value="${s.photo || ''}" class="form-control" style="height:32px; font-size:0.75rem; background:#000; border:1px solid #222; flex:1;" oninput="window.CatalogStep1.set('photo', this.value)">
                            ${s.photo ? `<img src="${s.photo}" style="height:32px; width:45px; object-fit:cover; border-radius:4px; border:1px solid #222;">` : ''}
                        </div>
                    </div>

                </div>
            </div>
        `;
    },
    set(k, v) { window.CatalogState[k] = v; window.CatalogManager.syncReport(); },
    toggleCrop(c) {
        const s = window.CatalogState;
        const idx = s.crops.indexOf(c);
        if(idx > -1) s.crops.splice(idx,1);
        else s.crops.push(c);
        window.CatalogManager.refreshStep();
        window.CatalogManager.syncReport();
    },
    genArt() {
        const art = '100.' + Math.floor(10000 + Math.random() * 90000);
        const el = document.getElementById('m-art-1');
        if(el) el.value = art;
        this.set('art', art);
    }
};
