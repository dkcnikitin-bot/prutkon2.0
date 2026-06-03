$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (-not (Test-Path $logPath)) {
    Write-Output "Log file not found!"
    exit
}

$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

foreach ($line in $lines) {
    try {
        $d = ConvertFrom-Json $line
        $idx = $d.step_index
        if ($idx -ge 500 -and $d.source -eq "USER_EXPLICIT" -and $d.type -eq "USER_INPUT") {
            Write-Output "=== USER MESSAGE Step $idx ==="
            Write-Output $d.content
            Write-Output "=============================="
            Write-Output ""
        }
    } catch {}
}
