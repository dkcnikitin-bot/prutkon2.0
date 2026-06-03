$files = Get-ChildItem -Include *.html,*.js -Recurse
foreach ($file in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        # Characteristic mojibake patterns for 'П' (D0 9F) -> 'Рџ' (D0 D0 9F in some cases, or just D0 9F in 1251)
        # Actually, if the file is 'double encoded', then П is stored as Рџ.
        # Р (D0) in UTF8 is C3 90. џ (9F) in UTF8 is C2 9F.
        # So 'П' is stored as C3 90 C2 9F.
        
        if ($text -match "РџСЂСѓС‚РєРѕРЅ|РќР°РёРјРµРЅРѕРІР°РЅРёРµ") {
            Write-Host "Fixing $($file.FullName)"
            # Round-trip through cp1251
            $wrong_bytes = [System.Text.Encoding]::GetEncoding(1251).GetBytes($text)
            $fixed_text = [System.Text.Encoding]::UTF8.GetString($wrong_bytes)
            
            if ($fixed_text -match "Пруткон|Наименование") {
                [System.IO.File]::WriteAllText($file.FullName, $fixed_text, [System.Text.Encoding]::UTF8)
            }
        }
    } catch {
        Write-Warning "Failed to process $($file.Name): $_"
    }
}
