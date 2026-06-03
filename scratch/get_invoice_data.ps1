# Find invoice data in transcript
$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $logPath
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($line in $lines) {
    if ($line.Contains("УП-10775") -or $line.Contains("1567396") -or $line.Contains("1 567 396")) {
        try {
            $data = ConvertFrom-Json $line
            $content = $data.content
            if ($content) {
                # print any lines that have numbers or steel marks
                $paragraphs = $content -split "`n"
                foreach ($p in $paragraphs) {
                    if ($p -like "*112*" -or $p -like "*10,*" -or $p -like "*1 567*" -or $p -like "*60С2ХА*" -or $p -like "*УП-10775*") {
                        Write-Output "Step $($data.step_index): $p"
                    }
                }
            }
        } catch {}
    }
}
