# 📘 Извлечение изображений из Excel

## Проблема
Ваш Excel файл содержит изображения внутри себя (в папке `xl/media/`). 
При импорте пути указывают на несуществующие файлы.

## Решение 1: Ручное извлечение

### Шаг 1: Откройте Excel как ZIP
1. Создайте копию файла `Прайс.xlsx`
2. Переименуйте копию в `Прайс.zip`
3. Откройте архив

### Шаг 2: Найдите изображения
Изображения находятся в папке: `xl/media/`

Файлы называются примерно так:
- `image1.png`
- `image2.png`
- `row_0002_img_01.png`

### Шаг 3: Извлеките в правильную папку
Создайте структуру:
```
extracted_xlsx/
└── 1/
    └── 3/
        └── Paltsy/
            ├── row_0002_img_01.png
            ├── row_0003_img_02.png
            └── row_0004_img_03.png
```

### Шаг 4: Проверьте пути в Excel
Убедитесь что в колонках `Photo_Path` и `Photo_Filename` указаны:
- **Photo_Path:** `C:\Users\Никитин Иван\Documents\Пруткон 3\extracted_xlsx\1\3\Paltsy\`
- **Photo_Filename:** `row_0002_img_01.png`

---

## Решение 2: Автоматическое извлечение (PowerShell)

Сохраните этот скрипт как `extract_images.ps1` и запустите:

```powershell
# Скрипт извлечения изображений из Excel
param(
    [string]$excelFile = "Прайс.xlsx",
    [string]$outputFolder = "extracted_xlsx"
)

# Открываем Excel как ZIP
Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($excelFile)

# Находим все изображения
$images = $zip.Entries | Where-Object { 
    $_.FullName -match "^xl/media/.*\.(png|jpg|jpeg|gif|webp)$" 
}

foreach ($img in $images) {
    # Извлекаем имя файла
    $filename = Split-Path $img.FullName -Leaf
    
    # Создаём папку назначения (можно настроить логику)
    $destPath = Join-Path $outputFolder "temp_images"
    New-Item -ItemType Directory -Force -Path $destPath | Out-Null
    
    # Извлекаем файл
    $destFile = Join-Path $destPath $filename
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($img, $destFile, $true)
    
    Write-Host "✅ Извлечено: $filename"
}

$zip.Dispose()
Write-Host "🎉 Готово! Изображения в папке: $destPath"
```

---

## Решение 3: Исправить пути в Excel

Если изображения уже извлечены в другую папку:

1. Откройте Excel
2. Найдите колонку `Photo_Path`
3. Замените все пути на правильные через **Найти и заменить** (Ctrl+H):
   - **Найти:** `C:\Users\Никитин Иван\Documents\Пруткон 3\`
   - **Заменить на:** *(пусто)*
   
   Или укажите правильный относительный путь:
   - **Найти:** `C:\Users\Никитин Иван\Documents\Пруткон 3\extracted_xlsx\`
   - **Заменить на:** `extracted_xlsx\`

---

## Проверка работы

После извлечения проверьте что файлы существуют:

```powershell
# Проверка существования файлов
Test-Path "extracted_xlsx\1\3\Paltsy\row_0002_img_01.png"
Test-Path "extracted_xlsx\1\3\Paltsy\row_0003_img_02.png"
Test-Path "extracted_xlsx\1\3\Paltsy\row_0004_img_03.png"
```

Если все возвращают `True` — можно импортировать!

---

## Примечание

Система импорта **автоматически обрабатывает** абсолютные пути и обрезает их до `extracted_xlsx/...`. 
Главное чтобы файлы физически существовали по этому пути.
