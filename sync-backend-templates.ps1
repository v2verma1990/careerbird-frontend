# PowerShell script to sync HTML templates from backend to frontend
# This ensures consistency between backend and frontend templates

$backendPath = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"
$frontendPath = "c:/Users/visha/Documents/careerbird-frontend/public/resume-templates/html"

Write-Host "Syncing HTML templates from backend to frontend..." -ForegroundColor Green

# Get all HTML files from backend
$backendFiles = Get-ChildItem -Path $backendPath -Filter "*.html" | Where-Object { $_.Name -ne "test-resume-data.html" -and $_.Name -ne "fixed-template.html" }

foreach ($file in $backendFiles) {
    $sourcePath = $file.FullName
    $destinationPath = Join-Path $frontendPath $file.Name
    
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    # Read the backend template
    $content = Get-Content -Path $sourcePath -Raw -Encoding UTF8
    
    # Transform backend template format to frontend format
    # Backend uses {{Name}}, {{Title}}, etc. (capitalized)
    # Frontend needs to match the sample data format
    
    # Replace capitalized field names with lowercase for consistency with sample data
    $content = $content -replace '\{\{Name\}\}', '{{Name}}'
    $content = $content -replace '\{\{Title\}\}', '{{Title}}'
    $content = $content -replace '\{\{Email\}\}', '{{Email}}'
    $content = $content -replace '\{\{Phone\}\}', '{{Phone}}'
    $content = $content -replace '\{\{Location\}\}', '{{Location}}'
    $content = $content -replace '\{\{LinkedIn\}\}', '{{LinkedIn}}'
    $content = $content -replace '\{\{Website\}\}', '{{Website}}'
    $content = $content -replace '\{\{Summary\}\}', '{{Summary}}'
    
    # Handle color placeholders - backend uses {{color}}, we need to make it work with our color system
    $content = $content -replace '\{\{color\}\}', '#3e88cf'
    
    # Handle experience section - ensure it matches our data structure
    $content = $content -replace '\{\{#each Experience\}\}', '{{#each experience}}'
    $content = $content -replace '\{\{Title\}\}', '{{title}}'
    $content = $content -replace '\{\{Company\}\}', '{{company}}'
    $content = $content -replace '\{\{StartDate\}\}', '{{startDate}}'
    $content = $content -replace '\{\{EndDate\}\}', '{{endDate}}'
    $content = $content -replace '\{\{Description\}\}', '{{description}}'
    
    # Handle education section
    $content = $content -replace '\{\{#each Education\}\}', '{{#each education}}'
    $content = $content -replace '\{\{Degree\}\}', '{{degree}}'
    $content = $content -replace '\{\{Institution\}\}', '{{institution}}'
    
    # Handle skills section
    $content = $content -replace '\{\{#each Skills\}\}', '{{#each skills}}'
    
    # Handle certifications section
    $content = $content -replace '\{\{#each Certifications\}\}', '{{#each certifications}}'
    $content = $content -replace '\{\{Name\}\}', '{{name}}'
    $content = $content -replace '\{\{Issuer\}\}', '{{issuer}}'
    $content = $content -replace '\{\{Date\}\}', '{{date}}'
    
    # Handle projects section
    $content = $content -replace '\{\{#each Projects\}\}', '{{#each projects}}'
    
    # Write the transformed content to frontend
    Set-Content -Path $destinationPath -Value $content -Encoding UTF8
    
    Write-Host "✓ Synced: $($file.Name)" -ForegroundColor Green
}

Write-Host "`nTemplate sync completed!" -ForegroundColor Green
Write-Host "Total files synced: $($backendFiles.Count)" -ForegroundColor Cyan