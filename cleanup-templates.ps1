# Cleanup script for resume templates

# Define paths
$backupTemplateDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html-backup"

# Check if backup directory exists
if (Test-Path $backupTemplateDir) {
    Write-Host "Removing backup templates directory: $backupTemplateDir"
    Remove-Item -Path $backupTemplateDir -Recurse -Force
    Write-Host "Backup templates directory removed successfully."
} else {
    Write-Host "Backup templates directory does not exist: $backupTemplateDir"
}

Write-Host "Template cleanup completed!"