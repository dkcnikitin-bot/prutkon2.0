$brainPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c"
$jsonFiles = Get-ChildItem -Path $brainPath -Filter *.json
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($file in $jsonFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    if ($content.Contains("60С2ХА") -or $content.Contains("10775") -or $content.Contains("10,577") -or $content.Contains("10.577")) {
        Write-Output "=== Found in $($file.Name) ==="
        # print first 500 chars
        Write-Output $content.Substring(0, [Math]::Min(1000, $content.Length))
        Write-Output "=============================="
        Write-Output ""
    }
}
