# Simple script to sync templates from backend to frontend
$backendPath = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"
$frontendPath = "c:/Users/visha/Documents/careerbird-frontend/public/resume-templates/html"

Write-Host "Syncing templates..." -ForegroundColor Green

# Copy all HTML files except test files
Get-ChildItem -Path $backendPath -Filter "*.html" | Where-Object { 
    $_.Name -ne "test-resume-data.html" -and $_.Name -ne "fixed-template.html" 
} | ForEach-Object {
    $sourcePath = $_.FullName
    $destinationPath = Join-Path $frontendPath $_.Name
    
    Write-Host "Copying: $($_.Name)" -ForegroundColor Yellow
    Copy-Item -Path $sourcePath -Destination $destinationPath -Force
    Write-Host "Done: $($_.Name)" -ForegroundColor Green
}

Write-Host "Sync completed!" -ForegroundColor Green