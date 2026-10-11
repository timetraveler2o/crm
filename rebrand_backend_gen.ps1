$files = @(
    "c:\Users\rahul\Downloads\source_code (3)\backend\src\__generated__\db_schema.ts",
    "c:\Users\rahul\Downloads\source_code (3)\backend\src\__generated__\db_raw_schema.sql",
    "c:\Users\rahul\Downloads\source_code (3)\backend\dist\bundle.js"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw
        $c = $c -replace 'Flight Desk India', 'Get Set Flight'
        $c = $c -replace 'Explore My Travel', 'Look Book Ticket'
        $c = $c -replace 'Travelohome', 'Traveloboom'
        $c = $c -replace '@flightdeskindia\.ca', '@getsetflight.com'
        $c = $c -replace '@flightdeskindia\.com', '@getsetflight.com'
        $c = $c -replace '@exploremytravel\.com', '@lookbookticket.com'
        $c = $c -replace '@travelohome\.com', '@traveloboom.com'
        $c = $c -replace 'flightdeskindia\.ca', 'getsetflight.com'
        $c = $c -replace 'flightdeskindia\.com', 'getsetflight.com'
        $c = $c -replace 'exploremytravel\.com', 'lookbookticket.com'
        $c = $c -replace 'travelohome\.com', 'traveloboom.com'
        $c = $c -replace 'RN Softech Solutions', 'Get Set Flight'
        $c = $c -replace 'RN Softech', 'Get Set Flight'
        $c = $c -replace 'rnsoftechsolutions\.com', 'getsetflight.com'
        $c = $c -replace 'rn-softech-logo\.png', 'https://getsetflight.com/get_set_flight_logo.png'
        $c = $c -replace 'rn-favicon\.png', 'https://getsetflight.com/get_set_flight_logo.png'
        $c = $c -replace '"FDI"', '"GSF"'
        $c = $c -replace "'FDI'", "'GSF'"
        $c = $c -replace '"EMT"', '"LBT"'
        $c = $c -replace "'EMT'", "'LBT'"
        $c = $c -replace '"TRV"', '"TBM"'
        $c = $c -replace "'TRV'", "'TBM'"
        $c = $c -replace 'fdi-logo\.png', 'gsf-logo.png'
        $c = $c -replace 'emt-logo\.png', 'lbt-logo.png'
        $c = $c -replace 'travelo-logo\.png', 'tbm-logo.png'
        Set-Content $f $c -NoNewline
        Write-Output ("Updated: " + $f)
    }
}
Write-Output "Done!"
