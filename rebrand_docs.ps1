$files = @(
    "c:\Users\rahul\Downloads\source_code (3)\YOUWARE.md",
    "c:\Users\rahul\Downloads\source_code (3)\dist\index.html"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw
        $c = $c -replace 'RN Softech Solutions', 'Get Set Flight'
        $c = $c -replace 'RN SOFTECH SOLUTIONS', 'Get Set Flight'
        $c = $c -replace 'RN Softech CRM', 'Get Set Flight CRM'
        $c = $c -replace 'RN Softech', 'Get Set Flight'
        $c = $c -replace 'rn-softech-logo\.png', 'https://getsetflight.com/get_set_flight_logo.png'
        $c = $c -replace 'rn-favicon\.png', 'https://getsetflight.com/get_set_flight_logo.png'
        $c = $c -replace 'Flight Desk India', 'Get Set Flight'
        $c = $c -replace 'Explore My Travel', 'Look Book Ticket'
        $c = $c -replace 'Travelohome', 'Traveloboom'
        $c = $c -replace 'FlightDesk India', 'Get Set Flight'
        $c = $c -replace 'flightdeskindia\.ca', 'getsetflight.com'
        $c = $c -replace 'flightdeskindia\.com', 'getsetflight.com'
        $c = $c -replace 'exploremytravel\.com', 'lookbookticket.com'
        $c = $c -replace 'travelohome\.com', 'traveloboom.com'
        $c = $c -replace 'fdi-logo\.png', 'gsf-logo.png'
        $c = $c -replace 'emt-logo\.png', 'lbt-logo.png'
        $c = $c -replace 'travelo-logo\.png', 'tbm-logo.png'
        $c = $c -replace "'FDI'", "'GSF'"
        $c = $c -replace "'EMT'", "'LBT'"
        $c = $c -replace "'TRV'", "'TBM'"
        Set-Content $f $c -NoNewline
        Write-Output ("Updated: " + $f)
    }
}
Write-Output "Done!"
