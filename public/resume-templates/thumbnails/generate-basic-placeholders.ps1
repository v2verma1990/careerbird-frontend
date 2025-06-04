# PowerShell script to generate basic placeholder images using System.Drawing
Add-Type -AssemblyName System.Drawing

# Template IDs
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

# Colors for different templates
$colors = @(
    "#f5f5f5", # minimal - light gray
    "#e3f2fd", # modern-clean - light blue
    "#f8bbd0", # creative - light pink
    "#e8eaf6", # professional - light indigo
    "#e0f2f1", # executive - light teal
    "#263238", # tech - dark blue-gray
    "#f3e5f5", # elegant - light purple
    "#fff8e1", # academic - light amber
    "#e8f5e9", # entry-level - light green
    "#eceff1"  # chronological - light blue-gray
)

# Create thumbnails directory if it doesn't exist
$thumbnailsDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/thumbnails"
if (-not (Test-Path $thumbnailsDir)) {
    New-Item -ItemType Directory -Path $thumbnailsDir | Out-Null
}

# Generate a placeholder image for each template
for ($i = 0; $i -lt $templateIds.Length; $i++) {
    $templateId = $templateIds[$i]
    $color = $colors[$i]
    $outputPath = Join-Path $thumbnailsDir "$templateId.png"
    
    # Create a 300x400 bitmap
    $bitmap = New-Object System.Drawing.Bitmap 300, 400
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill background
    $backgroundColor = [System.Drawing.ColorTranslator]::FromHtml($color)
    $graphics.Clear($backgroundColor)
    
    # Draw border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Gray, 2)
    $graphics.DrawRectangle($pen, 1, 1, 297, 397)
    
    # Draw template name
    $font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    
    # If using dark background, use white text
    if ($color -eq "#263238") {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    }
    
    $templateName = $templateId.Replace("-", " ")
    $templateName = (Get-Culture).TextInfo.ToTitleCase($templateName)
    
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $graphics.DrawString($templateName, $font, $brush, 
        [System.Drawing.RectangleF]::new(0, 0, 300, 400), $stringFormat)
    
    # Save the image
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created placeholder for $templateId at $outputPath"
}

Write-Host "All placeholders created successfully!"