$templatesDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$templates = Get-ChildItem -Path $templatesDir -Filter "*.html"

foreach ($template in $templates) {
    Write-Host "Processing template: $($template.Name)"
    $content = Get-Content -Path $template.FullName -Raw
    
    # Fix title tag
    $content = $content -replace '<title>{{#if Name}}{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}{{else}}{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}{{/if}}([^<]*)</title>', '<title>{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}$1</title>'
    
    # Fix any other duplicate conditional checks
    $content = $content -replace '{{#if Name}}{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}{{else}}{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}{{/if}}', '{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}'
    
    # Save the updated content
    Set-Content -Path $template.FullName -Value $content
    Write-Host "Fixed title tag in: $($template.Name)"
}

Write-Host "All title tags have been fixed!"