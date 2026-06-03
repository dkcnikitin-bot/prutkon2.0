$ErrorActionPreference = "Stop"
$xlDir = (Convert-Path ".\extracted_xlsx\xl")

$sharedStringsContent = Get-Content -Path "$xlDir\sharedStrings.xml" -Raw -Encoding UTF8
$strings = New-Object System.Collections.ArrayList

$tMatches = [regex]::Matches($sharedStringsContent, '<t.*?>([^<]*)</t>')
foreach ($m in $tMatches) {
    if ($m.Groups[1].Value) {
        $strings.Add($m.Groups[1].Value) > $null
    } else {
        $strings.Add("") > $null
    }
}

$sheetsToParse = @(
    @("sheet8.xml", "Модели техники"),
    @("sheet9.xml", "ТРАНСПОРТЕРЫ"),
    @("sheet27.xml", "Скобяные изделия"),
    @("sheet28.xml", "Метизы")
)

$db = @{}

foreach ($sh in $sheetsToParse) {
    $sheetPath = Join-Path (Join-Path $xlDir "worksheets") $sh[0]
    if (-not (Test-Path $sheetPath)) { continue }
    
    $sheetXmlContent = Get-Content -Path $sheetPath -Raw -Encoding UTF8
    $sheetData = New-Object System.Collections.ArrayList
    
    $rowMatches = [regex]::Matches($sheetXmlContent, '<row[^>]*>(.*?)</row>')
    foreach ($rM in $rowMatches) {
        $rowData = New-Object System.Collections.ArrayList
        $cMatches = [regex]::Matches($rM.Groups[1].Value, '<c[^>]*?(?:t="([^"]*)")?[^>]*><v>([^<]*)</v></c>')
        
        foreach ($cM in $cMatches) {
            $type = $cM.Groups[1].Value
            $val = $cM.Groups[2].Value
            
            if ($type -eq "s") {
                $idx = [int]$val
                if ($idx -lt $strings.Count) {
                    $val = $strings[$idx]
                }
            }
            $cleanVal = (($val -replace "`n", " ") -replace "`r", "") -replace "`"","'"
            $rowData.Add($cleanVal) > $null
        }
        
        if ($rowData.Count > 0) {
            $sheetData.Add($rowData) > $null
        }
    }
    
    if ($sheetData.Count > 0) {
        $db[$sh[1]] = $sheetData
    }
}

$mediaFiles = Get-ChildItem -Path "$xlDir\media" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
$db["_Images"] = $mediaFiles

$json = $db | ConvertTo-Json -Depth 10 -Compress
$jsContent = "const EXCEL_DB = " + $json + ";"
[IO.File]::WriteAllText("excel_data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Success! Created excel_data.js"
