$files = Get-ChildItem -Include *.html,*.js -Recurse
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        if ($content -match "РџСЂСѓС‚РєРѕРЅ|РќР°РёРјРµРЅРѕРІР°РЅРёРµ|Р’Р«Р‘РћР |Р’Р«Р‘РћР") {
            Write-Host "Fixing $($file.FullName)"
            $bytes = [System.Text.Encoding]::GetEncoding(1251).GetBytes($content)
            $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
            # Check if decoding actually produced Russian characters to avoid corruption
            if ($fixed -match "Пруткон|Наименование|ВЫБОР") {
                [System.IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.Encoding]::UTF8)
            }
        }
    } catch {
        Write-Warning "Failed to process $($file.Name): $_"
    }
}
