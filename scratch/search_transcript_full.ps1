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
        $text = $d.content + " " + $d.thinking
        # We look for steps where we did research, or where the model analyzed the invoice
        if ($text -like "*10,577*" -or $text -like "*10.577*" -or $text -like "*1 447 396*" -or $text -like "*1 567 396*" -or $text -like "*УП-10775*") {
            if ($d.source -eq "MODEL" -and $d.type -eq "PLANNER_RESPONSE") {
                Write-Output "=== MODEL STEP $idx ==="
                Write-Output "Thinking:"
                Write-Output $d.thinking
                Write-Output "Content:"
                Write-Output $d.content
                Write-Output "========================"
                Write-Output ""
            }
        }
    } catch {}
}
