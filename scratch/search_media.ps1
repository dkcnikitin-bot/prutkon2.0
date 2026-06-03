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
        $text = $d.content + " " + $d.thinking
        if ($text -like "*media_*" -or $text -like "*.jpg*" -or $text -like "*.png*" -or $text -like "*УП-10775*") {
            Write-Output "=== Match in Step $($d.step_index) ==="
            Write-Output "Source: $($d.source) | Type: $($d.type)"
            # Print a snippet of content
            if ($d.content) {
                Write-Output "Content snippet:"
                $c = $d.content
                if ($c.Length -gt 500) { $c = $c.Substring(0, 500) + "..." }
                Write-Output $c
            }
            Write-Output "========================"
            Write-Output ""
        }
    } catch {}
}
