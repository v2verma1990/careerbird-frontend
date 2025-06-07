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
    
    # Replace single braces with double braces for common fields
    $content = $content -replace '{name}', '{{name}}'
    $content = $content -replace '{title}', '{{title}}'
    $content = $content -replace '{email}', '{{email}}'
    $content = $content -replace '{phone}', '{{phone}}'
    $content = $content -replace '{location}', '{{location}}'
    $content = $content -replace '{summary}', '{{summary}}'
    $content = $content -replace '{linkedin}', '{{linkedin}}'
    $content = $content -replace '{website}', '{{website}}'
    
    # Replace Handlebars block helpers
    $content = $content -replace '{#if', '{{#if'
    $content = $content -replace '{/if}', '{{/if}}'
    $content = $content -replace '{#each', '{{#each'
    $content = $content -replace '{/each}', '{{/each}}'
    $content = $content -replace '{else}', '{{else}}'
    
    # Replace experience fields
    $content = $content -replace '{title}', '{{title}}'
    $content = $content -replace '{company}', '{{company}}'
    $content = $content -replace '{startDate}', '{{startDate}}'
    $content = $content -replace '{endDate}', '{{endDate}}'
    $content = $content -replace '{description}', '{{description}}'
    
    # Replace education fields
    $content = $content -replace '{degree}', '{{degree}}'
    $content = $content -replace '{institution}', '{{institution}}'
    $content = $content -replace '{gpa}', '{{gpa}}'
    
    # Replace project fields
    $content = $content -replace '{name}', '{{name}}'
    $content = $content -replace '{technologies}', '{{technologies}}'
    
    # Replace this. references in each loops
    $content = $content -replace '{this\.', '{{this.'
    
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