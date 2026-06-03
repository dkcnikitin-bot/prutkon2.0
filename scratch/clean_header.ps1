$path = "core.js"
$lines = Get-Content $path -Encoding UTF8
# Берем только то, что идет после v18.0.0 (которая начинается примерно на 58 линии оригинала)
# В текущем файле v18.0.0 начинается на линии 58.
$tail = $lines[57..($lines.Count-1)]

$cleanTop = @"
window.DB_VERSION = "18.1.0";
window.VERSION_HISTORY_KEY = "prutkon_version_history";
window.safeParse = (key, def) => {
    try { const val = localStorage.getItem(key); return val ? JSON.parse(val) : def; } 
    catch (e) { console.error(`Error parsing ${key}`, e); return def; }
};

window.DEFAULT_VERSION_HISTORY = [
    {
        version: "18.1.0",
        codename: "Dynamic Price Schema",
        date: "21.04.2026",
        changes: [
            "PRICE MASTER REBORN: Внедрена система динамических схем для категорий прайса.",
            "HIERARCHY: Добавлена многоуровневая структура категорий (Прутки РТИ, Гнутые и др.).",
            "AUTO FIELDS: Мастер добавления и таблица теперь автоматически подстраиваются под выбранный тип товара.",
            "INTEGRITY: Исправлены критические ошибки инициализации и отображения интерфейса."
        ]
    },
    {
        version: "18.0.1",
        codename: "Integrity Hotfix",
        date: "16.04.2026",
        changes: [
            "BITRIX24 RESTORE: Исправлены критические синтаксические ошибки в модуле связи (bitrix.js).",
            "BUTTONS FIX: Восстановлена работоспособность кнопок Битрикс: поиск клиентов, этапы и вебхуки.",
            "STABILITY: Все модули (Калькулятор, Заказы, Прайсы) больше не крашатся из-за битого кэша.",
            "UI STRICT: Строгое соблюдение правил 'type=\"button\"' для кнопок."
        ]
    }
];
"@

$finalContent = $cleanTop + "`r`n" + ($tail -join "`r`n")
$finalContent | Set-Content $path -Encoding UTF8
Write-Host "core.js header cleaned successfully."
