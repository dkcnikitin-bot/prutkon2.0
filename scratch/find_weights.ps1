$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (Test-Path $logPath) {
    $lines = [System.IO.File]::ReadAllLines($logPath, [System.Text.Encoding]::UTF8)
    foreach ($line in $lines) {
        if ($line.Contains("10,577") -or $line.Contains("10.577") -or $line.Contains("10577")) {
            $d = ConvertFrom-Json $line
            Write-Output "Step $($d.step_index):"
            Write-Output $d.thinking
            Write-Output $d.content
            Write-Output "====================================="
        }
    }
}
