# PowerShell script to fix all resume templates
# Convert PascalCase field names to lowercase

$templateDir = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"
$templates = Get-ChildItem -Path $templateDir -Filter "*.html"

Write-Host "Found $($templates.Count) templates to fix..."

foreach ($template in $templates) {
    Write-Host "Processing: $($template.Name)"
    
    $content = Get-Content -Path $template.FullName -Raw
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
    
    # Fix References
    $content = $content -replace '{{#each References}}', '{{#each references}}'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $template.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($template.Name)"
    } else {
        Write-Host "  No changes: $($template.Name)"
    }
}

Write-Host "Template fixing complete!"