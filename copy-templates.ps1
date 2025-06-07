$sourceDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$backupDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html-backup"
$targetDir = "c:/Users/visha/Documents/glowup-resume-maker/backend/ResumeAI.API/bin/Debug/net9.0/html"

Write-Host "Creating backup of templates..."
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force
}

# Copy all templates to backup directory
Copy-Item -Path "$sourceDir/*.html" -Destination $backupDir -Force
Write-Host "Templates backed up to $backupDir"

# Create target directory if it doesn't exist
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
    Write-Host "Created target directory: $targetDir"
}

# Copy all templates to target directory
Copy-Item -Path "$sourceDir/*.html" -Destination $targetDir -Force
Write-Host "Templates copied to $targetDir"

# List all templates in target directory
Write-Host "Templates in target directory:"
Get-ChildItem -Path $targetDir -Filter "*.html" | ForEach-Object {
    Write-Host "  - $($_.Name) ($($_.Length) bytes)"
}

# Verify modern-executive.html specifically
$modernExecutivePath = Join-Path -Path $targetDir -ChildPath "modern-executive.html"
if (Test-Path $modernExecutivePath) {
    $fileInfo = Get-Item $modernExecutivePath
    Write-Host "modern-executive.html exists in target directory: $modernExecutivePath"
    Write-Host "  Size: $($fileInfo.Length) bytes"
    
    # Check content
    $content = Get-Content -Path $modernExecutivePath -Raw
    if ($content.Length -gt 0) {
        $firstChars = $content.Substring(0, [Math]::Min(50, $content.Length))
        Write-Host "  First 50 chars: $firstChars"
    } else {
        Write-Host "  WARNING: File is empty"
    }
} else {
    Write-Host "ERROR: modern-executive.html does not exist in target directory"
}