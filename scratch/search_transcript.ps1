# PowerShell script to search transcript.jsonl using env var
$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$keywords = @("УП-10775", "1 567 396", "1567396", "10,577", "60С2ХА", "112 167", "112167")

if (-not (Test-Path $logPath)) {
    Write-Output "File not found: $logPath"
    exit
}

$reader = [System.IO.File]::OpenText($logPath)
try {
    while ($null -ne ($line = $reader.ReadLine())) {
        # Check if the line has any keywords. Since $line is UTF-8, we check using .Contains
        $hasKeyword = $false
        foreach ($k in $keywords) {
            # Let's handle Cyrillic keywords by loading them properly or using simple strings
            if ($line.Contains($k)) {
                $hasKeyword = $true
            }
        }
        if ($hasKeyword) {
            try {
                $data = ConvertFrom-Json $line
                $content = $data.content
                if ($null -ne $content) {
                    $paragraphs = $content -split "`n"
                    foreach ($p in $paragraphs) {
                        $found = $false
                        foreach ($k in $keywords) {
                            if ($p.Contains($k)) {
                                $found = $true
                            }
                        }
                        if ($found) {
                            # Convert output encoding to UTF-8 for console safety
                            [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
                            Write-Output "Step $($data.step_index): $p"
                        }
                    }
                }
            } catch {
                # fallback
            }
        }
    }
} finally {
    $reader.Close()
}
