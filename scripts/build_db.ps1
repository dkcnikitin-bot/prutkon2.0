$ErrorActionPreference = "Stop"
$xlDir = (Convert-Path ".\extracted_xlsx\xl")

Write-Host "Loading Shared Strings..."
$sharedStringsContent = Get-Content -Path "$xlDir\sharedStrings.xml" -Raw -Encoding UTF8
$sharedStrings = [xml]$sharedStringsContent
$strings = New-Object System.Collections.ArrayList

if ($sharedStrings.sst.si) {
    foreach ($si in $sharedStrings.sst.si) {
        if ($si.t) {
            $val = $si.t
            if ($val.GetType().Name -eq "XmlNode[]") { $val = ($val | ForEach-Object { $_.InnerText }) -join "" }
            elseif ($val.GetType().Name -ne "String") { $val = $val.InnerText }
            $strings.Add($val) > $null
        } else {
            $text = ""
            if ($si.r) {
                if ($si.r -is [array]) { $text = ($si.r | ForEach-Object { if ($_.t) { $_.t } else { "" } }) -join "" }
                else { $text = if ($si.r.t) { $si.r.t } else { "" } }
            }
            $strings.Add($text) > $null
        }
    }
}

Write-Host "Loaded $($strings.Count) strings."

$wbText = Get-Content -Path "$xlDir\workbook.xml" -Raw -Encoding UTF8
$relsText = Get-Content -Path "$xlDir\_rels\workbook.xml.rels" -Raw -Encoding UTF8

$sheetsMapping = @{}
$relMatches = [regex]::Matches($relsText, 'Id="([^"]+)"\s+Type="[^"]*worksheet"\s+Target="([^"]+)"')
foreach ($m in $relMatches) {
    $target = $m.Groups[2].Value -replace "/", "\"
    $sheetsMapping[$m.Groups[1].Value] = $target
}

$db = @{}
$sheetMatches = [regex]::Matches($wbText, 'name="([^"]+)"[^>]*r:id="([^"]+)"')
foreach ($m in $sheetMatches) {
    $sheetName = $m.Groups[1].Value
    $rId = $m.Groups[2].Value
    $target = $sheetsMapping[$rId]
    
    if (-not $target) { continue }
    
    $sheetPath = Join-Path $xlDir $target
    
    if (-not (Test-Path $sheetPath)) { Write-Host "not found $sheetPath"; continue }
    
    Write-Host "Processing $sheetName"
    try {
        $sheetXmlContent = Get-Content -Path $sheetPath -Raw -Encoding UTF8
        # Remove XML namespaces to avoid complex XPath
        $sheetXmlContent = $sheetXmlContent -replace 'xmlns(:\w+)?="[^"]*"', ''
        $sheetXml = [xml]$sheetXmlContent
        $sheetData = New-Object System.Collections.ArrayList
        
        if ($sheetXml.worksheet.sheetData.row) {
            foreach ($row in $sheetXml.worksheet.sheetData.row) {
                $rowData = New-Object System.Collections.ArrayList
                if ($row.c) {
                    $cells = if ($row.c -is [array]) { $row.c } else { @($row.c) }
                    foreach ($c in $cells) {
                        $val = $c.v
                        if ($c.t -eq "s") {
                            $idx = [int]$val
                            if ($idx -lt $strings.Count) { $val = $strings[$idx] }
                        } elseif ($c.t -eq "str") {
                            $val = $c.v
                            if ($c.v -is [System.Xml.XmlElement]) { $val = $c.v.InnerText }
                        } else {
                            if ($val -is [System.Xml.XmlElement]) { $val = $val.InnerText }
                        }
                        
                        $cleanVal = ""
                        if ($val -and $val -is [String]) { 
                            $cleanVal = (($val -replace "`n", " ") -replace "`r", "") -replace "`"","'"
                        } elseif ($val) {
                            $cleanVal = [string]$val
                        }
                        $rowData.Add($cleanVal) > $null
                    }
                }
                if ($rowData.Count > 0) {
                    $sheetData.Add($rowData) > $null
                }
            }
        }
        
        if ($sheetData.Count > 0) {
            $db[$sheetName] = $sheetData
        }
    } catch {
        Write-Host "Error parsing $sheetName : $_"
    }
}

$mediaFiles = Get-ChildItem -Path "$xlDir\media" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
$db["_Images"] = $mediaFiles

$json = $db | ConvertTo-Json -Depth 10 -Compress
$jsContent = "const EXCEL_DB = " + $json + ";"
[IO.File]::WriteAllText("excel_data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Success! Created excel_data.js"
