# Fix remaining field inconsistencies in templates
$frontendPath = "c:/Users/visha/Documents/careerbird-frontend/public/resume-templates/html"

Write-Host "Fixing remaining field inconsistencies..." -ForegroundColor Green

Get-ChildItem -Path $frontendPath -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    Write-Host "Processing: $($_.Name)" -ForegroundColor Yellow
    
    $content = Get-Content -Path $filePath -Raw -Encoding UTF8
    
    # Fix conditional checks that still use lowercase
    $content = $content -replace '\{\{#if title\}\}', '{{#if Title}}'
    $content = $content -replace '\{\{#if email\}\}', '{{#if Email}}'
    $content = $content -replace '\{\{#if phone\}\}', '{{#if Phone}}'
    $content = $content -replace '\{\{#if location\}\}', '{{#if Location}}'
    $content = $content -replace '\{\{#if linkedin\}\}', '{{#if LinkedIn}}'
    $content = $content -replace '\{\{#if website\}\}', '{{#if Website}}'
    $content = $content -replace '\{\{#if summary\}\}', '{{#if Summary}}'
    
    # Fix nested field references in experience section
    $content = $content -replace '\{\{company\}\}', '{{Company}}'
    $content = $content -replace '\{\{startDate\}\}', '{{StartDate}}'
    $content = $content -replace '\{\{endDate\}\}', '{{EndDate}}'
    $content = $content -replace '\{\{description\}\}', '{{Description}}'
    
    # Fix nested field references in education section
    $content = $content -replace '\{\{degree\}\}', '{{Degree}}'
    $content = $content -replace '\{\{institution\}\}', '{{Institution}}'
    
    # Fix nested field references in certifications section
    $content = $content -replace '\{\{issuer\}\}', '{{Issuer}}'
    $content = $content -replace '\{\{date\}\}', '{{Date}}'
    
    # Fix nested field references in projects section
    $content = $content -replace '\{\{technologies\}\}', '{{Technologies}}'
    
    # Fix conditional checks for nested fields
    $content = $content -replace '\{\{#if startDate\}\}', '{{#if StartDate}}'
    $content = $content -replace '\{\{#if endDate\}\}', '{{#if EndDate}}'
    $content = $content -replace '\{\{#if description\}\}', '{{#if Description}}'
    $content = $content -replace '\{\{#if date\}\}', '{{#if Date}}'
    $content = $content -replace '\{\{#if technologies\}\}', '{{#if Technologies}}'
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "Done: $($_.Name)" -ForegroundColor Green
}

Write-Host "Completed!" -ForegroundColor Green