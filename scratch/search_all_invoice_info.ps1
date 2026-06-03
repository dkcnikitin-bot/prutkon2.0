$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (-not (Test-Path $logPath)) {
    Write-Output "Log file not found!"
    exit
}

$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$keywords = @("10775", "1 567", "1567", "ОМЗ", "60С2ХА", "112", "120", "10,577", "10.577")

foreach ($line in $lines) {
    try {
        $d = ConvertFrom-Json $line
        $text = $d.content + " " + $d.thinking
        $match = $false
        foreach ($kw in $keywords) {
            if ($text.Contains($kw)) {
                $match = $true
                break
            }
        }
        if ($match) {
            Write-Output "=== STEP $($d.step_index) ($($d.source) | $($d.type)) ==="
            if ($d.content) {
                # Find paragraphs containing keywords
                $paras = $d.content -split "`n"
                foreach ($p in $paras) {
                    $pMatch = $false
                    foreach ($kw in $keywords) {
                        if ($p.Contains($kw)) { $pMatch = $true; break }
                    }
                    if ($pMatch) {
                        Write-Output "Content: $p"
                    }
                }
            }
            if ($d.thinking) {
                $paras = $d.thinking -split "`n"
                foreach ($p in $paras) {
                    $pMatch = $false
                    foreach ($kw in $keywords) {
                        if ($p.Contains($kw)) { $pMatch = $true; break }
                    }
                    if ($pMatch) {
                        Write-Output "Thinking: $p"
                    }
                }
            }
            Write-Output "=========================="
            Write-Output ""
        }
    } catch {}
}
