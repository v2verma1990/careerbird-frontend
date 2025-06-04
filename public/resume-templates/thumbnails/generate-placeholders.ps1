# PowerShell script to generate placeholder thumbnails for resume templates

# Define the template IDs from templates.json
$templateIds = @(
    "minimal",
    "modern-clean",
    "creative",
    "professional",
    "executive",
    "tech",
    "elegant",
    "academic",
    "entry-level",
    "chronological"
)

# Create a function to download a placeholder image
function Download-Placeholder {
    param (
        [string]$templateId,
        [string]$outputPath
    )
    
    # Format the template name for display
    $templateName = $templateId -replace "-", " "
    $templateName = (Get-Culture).TextInfo.ToTitleCase($templateName)
    
    # Create the URL for the placeholder image
    $url = "https://via.placeholder.com/300x400/e0e0e0/333333?text=$templateName+Template"
    
    Write-Host "Downloading placeholder for $templateName to $outputPath"
    
    try {
        # Download the image
        Invoke-WebRequest -Uri $url -OutFile $outputPath
        Write-Host "Successfully downloaded $templateId placeholder" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to download $templateId placeholder: $_" -ForegroundColor Red
    }
}

# Create thumbnails directory if it doesn't exist
$thumbnailsDir = $PSScriptRoot

# Download placeholders for each template
foreach ($templateId in $templateIds) {
    $outputPath = Join-Path -Path $thumbnailsDir -ChildPath "$templateId.png"
    Download-Placeholder -templateId $templateId -outputPath $outputPath
}

Write-Host "Placeholder generation complete. Please replace these with actual template thumbnails." -ForegroundColor Yellow