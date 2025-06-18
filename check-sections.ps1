$templateDir = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"
$templates = Get-ChildItem -Path $templateDir -Filter "*.html"

Write-Host "Checking templates for missing sections..."

foreach ($template in $templates) {
    $content = Get-Content -Path $template.FullName -Raw
    $hasCert = $content -match "certifications"
    $hasProj = $content -match "projects"
    
    if (-not $hasCert -or -not $hasProj) {
        Write-Host "$($template.Name): Certifications=$hasCert, Projects=$hasProj"
    }
}

Write-Host "Check complete!"