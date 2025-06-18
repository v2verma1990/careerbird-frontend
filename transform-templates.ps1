# PowerShell script to transform backend templates to work with frontend sample data
# This ensures templates work correctly with our sample data structure

$frontendPath = "c:/Users/visha/Documents/careerbird-frontend/public/resume-templates/html"

Write-Host "Transforming templates to match sample data structure..." -ForegroundColor Green

# Get all HTML files from frontend
$templateFiles = Get-ChildItem -Path $frontendPath -Filter "*.html"

foreach ($file in $templateFiles) {
    $filePath = $file.FullName
    
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    # Read the template content
    $content = Get-Content -Path $filePath -Raw -Encoding UTF8
    
    # Transform field names to match our sample data structure
    # Our sample data uses capitalized field names: Name, Title, Email, etc.
    
    # Basic fields
    $content = $content -replace '\{\{name\}\}', '{{Name}}'
    $content = $content -replace '\{\{title\}\}', '{{Title}}'
    $content = $content -replace '\{\{email\}\}', '{{Email}}'
    $content = $content -replace '\{\{phone\}\}', '{{Phone}}'
    $content = $content -replace '\{\{location\}\}', '{{Location}}'
    $content = $content -replace '\{\{linkedin\}\}', '{{LinkedIn}}'
    $content = $content -replace '\{\{website\}\}', '{{Website}}'
    $content = $content -replace '\{\{summary\}\}', '{{Summary}}'
    
    # Handle conditional fields
    $content = $content -replace '\{\{#if name\}\}', '{{#if Name}}'
    $content = $content -replace '\{\{#if title\}\}', '{{#if Title}}'
    $content = $content -replace '\{\{#if email\}\}', '{{#if Email}}'
    $content = $content -replace '\{\{#if phone\}\}', '{{#if Phone}}'
    $content = $content -replace '\{\{#if location\}\}', '{{#if Location}}'
    $content = $content -replace '\{\{#if linkedin\}\}', '{{#if LinkedIn}}'
    $content = $content -replace '\{\{#if website\}\}', '{{#if Website}}'
    $content = $content -replace '\{\{#if summary\}\}', '{{#if Summary}}'
    
    # Handle experience section - our sample data uses "Experience" array
    $content = $content -replace '\{\{#each experience\}\}', '{{#each Experience}}'
    $content = $content -replace '\{\{title\}\}', '{{Title}}'
    $content = $content -replace '\{\{company\}\}', '{{Company}}'
    $content = $content -replace '\{\{startDate\}\}', '{{StartDate}}'
    $content = $content -replace '\{\{endDate\}\}', '{{EndDate}}'
    $content = $content -replace '\{\{description\}\}', '{{Description}}'
    
    # Handle education section - our sample data uses "Education" array
    $content = $content -replace '\{\{#each education\}\}', '{{#each Education}}'
    $content = $content -replace '\{\{degree\}\}', '{{Degree}}'
    $content = $content -replace '\{\{institution\}\}', '{{Institution}}'
    
    # Handle skills section - our sample data uses "Skills" array
    $content = $content -replace '\{\{#each skills\}\}', '{{#each Skills}}'
    
    # Handle certifications section - our sample data uses "Certifications" array
    $content = $content -replace '\{\{#each certifications\}\}', '{{#each Certifications}}'
    $content = $content -replace '\{\{#if certifications\}\}', '{{#if Certifications}}'
    $content = $content -replace '\{\{name\}\}', '{{Name}}'
    $content = $content -replace '\{\{issuer\}\}', '{{Issuer}}'
    $content = $content -replace '\{\{date\}\}', '{{Date}}'
    
    # Handle projects section - our sample data uses "Projects" array
    $content = $content -replace '\{\{#each projects\}\}', '{{#each Projects}}'
    $content = $content -replace '\{\{#if projects\}\}', '{{#if Projects}}'
    
    # Fix avatar URL to use Name instead of name
    $content = $content -replace 'name=\{\{name\}\}', 'name={{Name}}'
    
    # Write the transformed content back
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    
    Write-Host "✓ Transformed: $($file.Name)" -ForegroundColor Green
}

Write-Host "Template transformation completed!" -ForegroundColor Green
Write-Host "Total files processed: $($templateFiles.Count)" -ForegroundColor Cyan