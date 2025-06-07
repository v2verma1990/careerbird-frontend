$templateDir = "c:/Users/visha/Documents/glowup-resume-maker/backend/ResumeAI.API/html"
$publicTemplateDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$backupTemplateDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html-backup"

# Get all HTML files
$templateFiles = Get-ChildItem -Path $templateDir -Filter "*.html"
$publicTemplateFiles = Get-ChildItem -Path $publicTemplateDir -Filter "*.html"
$backupTemplateFiles = Get-ChildItem -Path $backupTemplateDir -Filter "*.html"

# Function to fix a template file
function Fix-Template {
    param (
        [string]$filePath
    )
    
    Write-Host "Fixing template: $filePath"
    
    # Read the content of the file
    $content = Get-Content -Path $filePath -Raw
    
    # First, normalize by removing excess braces (more than 2)
    $content = $content -replace '{{{+', '{{'
    $content = $content -replace '}}}+', '}}'
    
    # Then ensure all single braces for variables are converted to double braces
    $content = $content -replace '(?<!\{)\{(?!\{)([a-zA-Z0-9_\.]+)(?<!\})\}(?!\})', '{{$1}}'
    
    # Fix Handlebars block helpers
    $content = $content -replace '(?<!\{)\{(?!\{)(#if|\/if|#each|\/each|else)(?<!\})\}(?!\})', '{{$1}}'
    
    # Fix this references in loops
    $content = $content -replace '(?<!\{)\{(?!\{)(this\.[a-zA-Z0-9_\.]+)(?<!\})\}(?!\})', '{{$1}}'
    
    # Write the content back to the file
    Set-Content -Path $filePath -Value $content
    
    Write-Host "Fixed template: $filePath"
}

# Fix all template files
foreach ($file in $templateFiles) {
    Fix-Template -filePath $file.FullName
}

foreach ($file in $publicTemplateFiles) {
    Fix-Template -filePath $file.FullName
}

foreach ($file in $backupTemplateFiles) {
    Fix-Template -filePath $file.FullName
}

Write-Host "All templates have been fixed!"