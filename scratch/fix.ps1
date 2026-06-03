$c = Get-Content 'core.js'
$c[29] = '    },'
$c[30] = 'DELETE_ME'
$new = $c | Where-Object { $_ -ne 'DELETE_ME' }
$new | Set-Content 'core.js' -Encoding UTF8
Write-Host "Done"
