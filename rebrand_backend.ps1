$backendPath = "c:\Users\rahul\Downloads\source_code (3)\backend\src"
$files = Get-ChildItem -Path $backendPath -Recurse -Include *.ts | Where-Object { $_.Name -ne "db_schema.ts" -and $_.Name -ne "db_raw_schema.sql" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    # Company name replacements
    $content = $content -replace 'Flight Desk India', 'Get Set Flight'
    $content = $content -replace 'Explore My Travel', 'Look Book Ticket'
    $content = $content -replace 'Travelohome', 'Traveloboom'
    
    # Email domain replacements
    $content = $content -replace '@flightdeskindia\.ca', '@getsetflight.com'
    $content = $content -replace '@flightdeskindia\.com', '@getsetflight.com'
    $content = $content -replace '@exploremytravel\.com', '@lookbookticket.com'
    $content = $content -replace '@travelohome\.com', '@traveloboom.com'
    
    # Website domain replacements
    $content = $content -replace 'flightdeskindia\.ca', 'getsetflight.com'
    $content = $content -replace 'flightdeskindia\.com', 'getsetflight.com'
    $content = $content -replace 'exploremytravel\.com', 'lookbookticket.com'
    $content = $content -replace 'travelohome\.com', 'traveloboom.com'
    
    # Booking ID prefixes
    $content = $content -replace "'FDI'", "'GSF'"
    $content = $content -replace '"FDI"', '"GSF"'
    $content = $content -replace "'EMT'", "'LBT'"
    $content = $content -replace '"EMT"', '"LBT"'
    $content = $content -replace "'TRV'", "'TBM'"
    $content = $content -replace '"TRV"', '"TBM"'
    
    # RN Softech references
    $content = $content -replace 'RN Softech Solutions', 'Get Set Flight'
    $content = $content -replace 'RN Softech', 'Get Set Flight'
    $content = $content -replace 'rnsoftechsolutions\.com', 'getsetflight.com'
    
    # Logo references
    $content = $content -replace 'fdi-logo\.png', 'gsf-logo.png'
    $content = $content -replace 'emt-logo\.png', 'lbt-logo.png'
    $content = $content -replace 'travelo-logo\.png', 'tbm-logo.png'
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content -NoNewline
        Write-Output ("Updated: " + $file.FullName)
    }
}

Write-Output "Done! Backend files updated."
