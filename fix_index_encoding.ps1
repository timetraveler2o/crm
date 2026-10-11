$path = 'c:\Users\rahul\Downloads\source_code (3)\backend\src\index.ts'
$content = Get-Content $path -Raw
[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($False)))
