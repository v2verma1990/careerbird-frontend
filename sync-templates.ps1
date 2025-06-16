# Script to sync resume templates from frontend to backend
# This ensures that all templates are available in the backend for serving via API

$frontendTemplatesPath = "public/resume-templates/html"
$backendTemplatesPath = "backend/ResumeAI.API/html"

# Ensure the backend templates directory exists
if (-not (Test-Path $backendTemplatesPath)) {
    Write-Host "Creating backend templates directory: $backendTemplatesPath"
    New-Item -ItemType Directory -Path $backendTemplatesPath -Force | Out-Null
}

# Get all template files from the frontend
$frontendTemplates = Get-ChildItem -Path $frontendTemplatesPath -Filter "*.html"

Write-Host "Found $($frontendTemplates.Count) templates in frontend directory"

# Copy each template to the backend
foreach ($template in $frontendTemplates) {
    $destinationPath = Join-Path $backendTemplatesPath $template.Name
    
    Write-Host "Copying $($template.Name) to backend..."
    Copy-Item -Path $template.FullName -Destination $destinationPath -Force
}

Write-Host "Template sync complete. All templates are now available in the backend."