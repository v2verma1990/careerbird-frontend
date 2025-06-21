# PowerShell script to remove all styling from backend HTML templates
# This creates clean HTML templates that rely on frontend CSS

$backendHtmlPath = "backend/ResumeAI.API/html"
$templates = @(
    "modern-clean.html",
    "professional.html", 
    "minimal.html",
    "creative.html",
    "executive.html",
    "tech.html",
    "elegant.html",
    "academic.html",
    "entry-level.html",
    "chronological.html",
    "academic-scholar.html",
    "creative-designer.html",
    "finance-expert.html",
    "marketing-pro.html",
    "startup-founder.html",
    "tech-minimalist.html",
    "modern-executive.html"
)

Write-Host "Cleaning up backend HTML templates..." -ForegroundColor Green

foreach ($template in $templates) {
    $filePath = Join-Path $backendHtmlPath $template
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $template" -ForegroundColor Yellow
        
        # Read the file content
        $content = Get-Content $filePath -Raw
        
        # Remove the <style> section (everything between <style> and </style>)
        $cleanContent = $content -replace '(?s)<style>.*?</style>', '  <!-- All styling moved to frontend CSS -->'
        
        # Update the title to use proper Handlebars syntax
        $cleanContent = $cleanContent -replace '<title>.*?</title>', '<title>{{Name}} - Resume</title>'
        
        # Add template class to body if not present
        $templateId = $template -replace '\.html$', ''
        if ($cleanContent -notmatch 'class="[^"]*' + $templateId) {
            $cleanContent = $cleanContent -replace '<body[^>]*>', "<body class=`"$templateId`">"
        }
        
        # Write the cleaned content back to the file
        Set-Content $filePath $cleanContent -Encoding UTF8
        
        Write-Host "  ✓ Cleaned $template" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Template not found: $template" -ForegroundColor Red
    }
}

Write-Host "`nBackend template cleanup completed!" -ForegroundColor Green
Write-Host "All templates now use frontend CSS for styling." -ForegroundColor Cyan