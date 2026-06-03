$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$userMsgs = @()
foreach ($line in $lines) {
    try {
        $data = ConvertFrom-Json $line
        if ($data.type -eq "USER_INPUT") {
            $userMsgs += "=== STEP $($data.step_index) ==="
            $userMsgs += $data.content
            $userMsgs += "=========================="
            $userMsgs += ""
        }
    } catch {}
}
$userMsgs | Out-File -FilePath "scratch/user_messages.txt" -Encoding utf8
Write-Output "Done! Written $($userMsgs.Count) lines to scratch/user_messages.txt"
