$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (Test-Path $logPath) {
    $lines = [System.IO.File]::ReadAllLines($logPath, [System.Text.Encoding]::UTF8)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        try {
            $d = ConvertFrom-Json $lines[$i]
            if ($d.step_index -ge 860 -and $d.step_index -le 912) {
                Write-Output "========================================="
                Write-Output "STEP $($d.step_index) | SOURCE: $($d.source) | TYPE: $($d.type)"
                Write-Output "========================================="
                if ($d.thinking) {
                    Write-Output "THINKING:"
                    Write-Output $d.thinking
                }
                if ($d.content) {
                    Write-Output "CONTENT:"
                    Write-Output $d.content
                }
                Write-Output "========================================="
                Write-Output ""
            }
        } catch {}
    }
} else {
    Write-Output "Log not found!"
}
