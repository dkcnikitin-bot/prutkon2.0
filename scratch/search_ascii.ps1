# ASCII PowerShell script to search transcript.jsonl
$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$outputPath = "scratch\transcript_matches.txt"

$lines = Get-Content $logPath
$results = @()

# Using purely numeric / ASCII keywords
$keywords = @("112 167", "112167", "10,577", "10.577", "1 567 396", "1567396", "10775", "120 000", "120000")

foreach ($line in $lines) {
    $matched = $false
    foreach ($kw in $keywords) {
        if ($line.Contains($kw)) {
            $matched = $true
            break
        }
    }
    if ($matched) {
        try {
            $json = ConvertFrom-Json $line
            $content = $json.content
            if ($content) {
                $results += "=== STEP $($json.step_index) ==="
                $results += $content
            }
        } catch {
            $results += "=== RAW STEP ==="
            $results += $line
        }
    }
}

$results | Out-File -FilePath $outputPath -Encoding utf8
Write-Output "Done. Written lines: $($results.Count)"
