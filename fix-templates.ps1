$templateDir = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"

# Get all HTML files
$templateFiles = Get-ChildItem -Path $templateDir -Filter "*.html"

# Function to fix a template file
function Fix-Template {
    param (
        [string]$filePath
    )
    
    Write-Host "Fixing template: $filePath"
    
    # Read the content of the file
    $content = Get-Content -Path $filePath -Raw
    $originalContent = $content
    
    # Fix Experience section
    $content = $content -replace '{{#each Experience}}', '{{#each experience}}'
    $content = $content -replace '{{Title}}', '{{title}}'
    $content = $content -replace '{{Company}}', '{{company}}'
    $content = $content -replace '{{StartDate}}', '{{startDate}}'
    $content = $content -replace '{{EndDate}}', '{{endDate}}'
    $content = $content -replace '{{Location}}', '{{location}}'
    $content = $content -replace '{{Description}}', '{{description}}'
    
    # Fix Education section
    $content = $content -replace '{{#each Education}}', '{{#each education}}'
    $content = $content -replace '{{Degree}}', '{{degree}}'
    $content = $content -replace '{{Institution}}', '{{institution}}'
    
    # Fix Skills section
    $content = $content -replace '{{#each Skills}}', '{{#each skills}}'
    
    # Fix personal info
    $content = $content -replace '{{Name}}', '{{name}}'
    $content = $content -replace '{{Email}}', '{{email}}'
    $content = $content -replace '{{Phone}}', '{{phone}}'
    $content = $content -replace '{{Website}}', '{{website}}'
    $content = $content -replace '{{LinkedIn}}', '{{linkedin}}'
    $content = $content -replace '{{Summary}}', '{{summary}}'
    
    # Fix conditional checks
    $content = $content -replace '{{#if Title}}', '{{#if title}}'
    $content = $content -replace '{{#if Company}}', '{{#if company}}'
    $content = $content -replace '{{#if StartDate}}', '{{#if startDate}}'
    $content = $content -replace '{{#if EndDate}}', '{{#if endDate}}'
    $content = $content -replace '{{#if Location}}', '{{#if location}}'
    $content = $content -replace '{{#if Description}}', '{{#if description}}'
    $content = $content -replace '{{#if Degree}}', '{{#if degree}}'
    $content = $content -replace '{{#if Institution}}', '{{#if institution}}'
    $content = $content -replace '{{#if Name}}', '{{#if name}}'
    $content = $content -replace '{{#if Email}}', '{{#if email}}'
    $content = $content -replace '{{#if Phone}}', '{{#if phone}}'
    $content = $content -replace '{{#if Website}}', '{{#if website}}'
    $content = $content -replace '{{#if LinkedIn}}', '{{#if linkedin}}'
    $content = $content -replace '{{#if Summary}}', '{{#if summary}}'
    
    # Write the content back to the file
    Set-Content -Path $filePath -Value $content -NoNewline
    
    # Only report if content changed
    if ($content -ne $originalContent) {
        Write-Host "  ✓ Changes made to $(Split-Path $filePath -Leaf)"
    } else {
        Write-Host "  - No changes needed for $(Split-Path $filePath -Leaf)"
    }
}

# Fix all template files
Write-Host "Found $($templateFiles.Count) templates to fix..."
foreach ($file in $templateFiles) {
    Fix-Template -filePath $file.FullName
}

Write-Host "All templates have been fixed!"