const fs = require('fs');
const path = 'core.js';
const encoding = 'utf8';

try {
    let content = fs.readFileSync(path, encoding);
    let lines = content.split(/\r?\n/);

    // Линии 1-6 оставляем (window.DB_VERSION, safeParse и т.д.)
    const header = lines.slice(0, 6);
    
    // Линии 61 и далее оставляем (старая история и логика)
    // Но мы должны быть уверены, что 61 - это начало v18.0.0 или что-то в этом роде.
    // Судя по view_file, v18.0.0 начинается на 58-й линии.
    const tail = lines.slice(57); 

    const newHistory = [
        '',
        'window.DEFAULT_VERSION_HISTORY = [',
        '    {',
        '        version: "18.1.0",',
        '        codename: "Dynamic Price Schema",',
        '        date: "21.04.2026",',
        '        changes: [',
        '            "PRICE MASTER REBORN: Внедрена система динамических схем для категорий прайса.",',
        '            "HIERARCHY: Добавлена многоуровневая структура категорий (Прутки РТИ, Гнутые и др.).",',
        '            "AUTO FIELDS: Мастер добавления и таблица теперь автоматически подстраиваются под выбранный тип товара.",',
        '            "INTEGRITY: Исправлены критические ошибки инициализации и отображения интерфейса."',
        '        ]',
        '    },',
        '    {',
        '        version: "18.0.1",',
        '        codename: "Integrity Hotfix",',
        '        date: "16.04.2026",',
        '        changes: [',
        '            "BITRIX24 RESTORE: Исправлены критические синтаксические ошибки в модуле связи (bitrix.js).",',
        '            "BUTTONS FIX: Восстановлена работоспособность кнопок Битрикс: поиск клиентов, этапы и вебхуки.",',
        '            "STABILITY: Все модули (Калькулятор, Заказы, Прайсы) больше не крашатся из-за битого кэша.",',
        '            "UI STRICT: Строгое соблюдение правил \'type=\\"button\\"\' для кнопок."',
        '        ]',
        '    }',
        '];',
        ''
    ];

    const finalContent = [...header, ...newHistory, ...tail].join('\n');
    fs.writeFileSync(path, finalContent, encoding);
    console.log("core.js recovered successfully.");
} catch (err) {
    console.error("Recovery failed:", err);
    process.exit(1);
}
