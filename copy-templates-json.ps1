$sourceFile = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/templates.json"
$targetDir = "c:/Users/visha/Documents/glowup-resume-maker/backend/ResumeAI.API/bin/Debug/net9.0"
$targetFile = "$targetDir/templates.json"

# Create target directory if it doesn't exist
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
    Write-Host "Created target directory: $targetDir"
}

# Copy templates.json to target directory
Copy-Item -Path $sourceFile -Destination $targetFile -Force
Write-Host "templates.json copied to $targetFile"

# Verify templates.json
if (Test-Path $targetFile) {
    $fileInfo = Get-Item $targetFile
    Write-Host "templates.json exists in target directory: $targetFile"
    Write-Host "  Size: $($fileInfo.Length) bytes"
    
    # Check content
    $content = Get-Content -Path $targetFile -Raw
    $templates = ConvertFrom-Json -InputObject $content
    Write-Host "  Found $($templates.templates.Count) templates in templates.json"
    
    # Check if modern-executive is in the templates.json
    $modernExecutive = $templates.templates | Where-Object { $_.id -eq "modern-executive" }
    if ($modernExecutive) {
        Write-Host "  modern-executive template found in templates.json"
        Write-Host "  Name: $($modernExecutive.name)"
        Write-Host "  Description: $($modernExecutive.description)"
    } else {
        Write-Host "  ERROR: modern-executive template not found in templates.json"
    }
} else {
    Write-Host "ERROR: templates.json does not exist in target directory"
}