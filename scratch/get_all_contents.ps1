# Extract conversation history from transcript.jsonl
$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$outputPath = "scratch\contents.txt"

$lines = Get-Content $logPath
$results = @()

foreach ($line in $lines) {
    try {
        $json = ConvertFrom-Json $line
        $source = $json.source
        $type = $json.type
        $content = $json.content
        
        # We only care about explicit user inputs or model responses
        if ($type -eq "USER_INPUT" -or $type -eq "PLANNER_RESPONSE" -or $type -eq "USER_EXPLICIT" -or $source -eq "USER_EXPLICIT") {
            if ($content) {
                $results += "========================================="
                $results += "STEP $($json.step_index) | SOURCE: $source | TYPE: $type"
                $results += "========================================="
                $results += $content
                $results += ""
            }
        }
    } catch {}
}

$results | Out-File -FilePath $outputPath -Encoding utf8
Write-Output "Done. Written $($results.Count) lines to $outputPath"
