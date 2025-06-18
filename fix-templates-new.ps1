# Simple script to fix template field names
$frontendPath = "c:/Users/visha/Documents/careerbird-frontend/public/resume-templates/html"

Write-Host "Fixing template field names..." -ForegroundColor Green

Get-ChildItem -Path $frontendPath -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    Write-Host "Processing: $($_.Name)" -ForegroundColor Yellow
    
    $content = Get-Content -Path $filePath -Raw -Encoding UTF8
    
    # Fix basic fields
    $content = $content -replace '\{\{name\}\}', '{{Name}}'
    $content = $content -replace '\{\{title\}\}', '{{Title}}'
    $content = $content -replace '\{\{email\}\}', '{{Email}}'
    $content = $content -replace '\{\{phone\}\}', '{{Phone}}'
    $content = $content -replace '\{\{location\}\}', '{{Location}}'
    $content = $content -replace '\{\{linkedin\}\}', '{{LinkedIn}}'
    $content = $content -replace '\{\{website\}\}', '{{Website}}'
    $content = $content -replace '\{\{summary\}\}', '{{Summary}}'
    
    # Fix arrays
    $content = $content -replace '\{\{#each experience\}\}', '{{#each Experience}}'
    $content = $content -replace '\{\{#each education\}\}', '{{#each Education}}'
    $content = $content -replace '\{\{#each skills\}\}', '{{#each Skills}}'
    $content = $content -replace '\{\{#each certifications\}\}', '{{#each Certifications}}'
    $content = $content -replace '\{\{#each projects\}\}', '{{#each Projects}}'
    
    # Fix conditionals
    $content = $content -replace '\{\{#if certifications\}\}', '{{#if Certifications}}'
    $content = $content -replace '\{\{#if projects\}\}', '{{#if Projects}}'
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "Done: $($_.Name)" -ForegroundColor Green
}

Write-Host "Completed!" -ForegroundColor Green