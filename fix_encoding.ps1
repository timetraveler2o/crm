$path = 'c:\Users\rahul\Downloads\source_code (3)\backend\src\index.ts'
$content = Get-Content $path -Raw
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
