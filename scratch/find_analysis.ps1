$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($line in $lines) {
    try {
        $data = ConvertFrom-Json $line
        $step = $data.step_index
        if (($step -ge 553 -and $step -le 570) -or ($step -ge 633 -and $step -le 655) -or ($step -ge 871 -and $step -le 885)) {
            if ($data.source -eq "MODEL") {
                Write-Output "=== STEP $step (MODEL) ==="
                if ($data.thinking) {
                    Write-Output "THINKING:"
                    $paragraphs = $data.thinking -split "`n"
                    foreach ($p in $paragraphs) {
                        if ($p -like "*круг*" -or $p -like "*лист*" -or $p -like "*60С2ХА*" -or $p -like "*112*" -or $p -like "*10,*" -or $p -like "*10.*" -or $p -like "*1 567*" -or $p -like "*1567*") {
                            Write-Output "  $p"
                        }
                    }
                }
                if ($data.content) {
                    Write-Output "CONTENT:"
                    $paragraphs = $data.content -split "`n"
                    foreach ($p in $paragraphs) {
                        if ($p -like "*круг*" -or $p -like "*лист*" -or $p -like "*60С2ХА*" -or $p -like "*112*" -or $p -like "*10,*" -or $p -like "*10.*" -or $p -like "*1 567*" -or $p -like "*1567*") {
                            Write-Output "  $p"
                        }
                    }
                }
                Write-Output "=========================="
                Write-Output ""
            }
        }
    } catch {}
}
