$templatesDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$templatesJsonPath = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/templates.json"

Write-Host "Checking templates directory: $templatesDir"
if (Test-Path $templatesDir) {
    Write-Host "Templates directory exists"
} else {
    Write-Host "Templates directory does not exist"
}

Write-Host "Checking templates.json: $templatesJsonPath"
if (Test-Path $templatesJsonPath) {
    Write-Host "templates.json exists"
    $templatesJson = Get-Content -Path $templatesJsonPath -Raw
    $templates = ConvertFrom-Json -InputObject $templatesJson
    Write-Host "Found $($templates.templates.Count) templates in templates.json"
    
    # Check each template in templates.json
    foreach ($template in $templates.templates) {
        $templatePath = Join-Path -Path $templatesDir -ChildPath "$($template.id).html"
        $exists = Test-Path $templatePath
        Write-Host "Template $($template.id): HTML file exists: $exists at $templatePath"
        
        if ($exists) {
            # Check file size and content
            $fileInfo = Get-Item $templatePath
            Write-Host "  File size: $($fileInfo.Length) bytes"
            
            # Check if file is empty or has minimal content
            if ($fileInfo.Length -lt 100) {
                Write-Host "  WARNING: File is very small, might be empty or corrupted"
            }
            
            # Check first few bytes
            $content = Get-Content -Path $templatePath -Raw
            if ($content.Length -gt 0) {
                $firstChars = $content.Substring(0, [Math]::Min(20, $content.Length))
                Write-Host "  First 20 chars: $firstChars"
            } else {
                Write-Host "  WARNING: File is empty"
            }
        }
    }
} else {
    Write-Host "templates.json does not exist"
}

# Check for any HTML files not listed in templates.json
Write-Host "`nChecking for HTML files not listed in templates.json:"
$htmlFiles = Get-ChildItem -Path $templatesDir -Filter "*.html" | ForEach-Object { $_.Name -replace '\.html$', '' }
$templateIds = $templates.templates.id
$missingTemplates = $htmlFiles | Where-Object { $_ -notin $templateIds }
if ($missingTemplates) {
    Write-Host "Found HTML files not listed in templates.json:"
    $missingTemplates | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "All HTML files are listed in templates.json"
}

# Check for template IDs in templates.json that don't have HTML files
Write-Host "`nChecking for template IDs without HTML files:"
$missingHtmlFiles = $templateIds | Where-Object { $_ -notin $htmlFiles }
if ($missingHtmlFiles) {
    Write-Host "Found template IDs without HTML files:"
    $missingHtmlFiles | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "All template IDs have corresponding HTML files"
}