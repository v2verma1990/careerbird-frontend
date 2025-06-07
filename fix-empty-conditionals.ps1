$templatesDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$templates = Get-ChildItem -Path $templatesDir -Filter "*.html"

foreach ($template in $templates) {
    Write-Host "Processing template: $($template.Name)"
    $content = Get-Content -Path $template.FullName -Raw
    
    # Fix empty conditionals for common fields
    $fieldsToFix = @(
        "Name", "Title", "Email", "Phone", "Location", 
        "LinkedIn", "Website", "Summary"
    )
    
    foreach ($field in $fieldsToFix) {
        $lowerField = $field.ToLower()
        
        # Fix empty conditionals like {{#if Field}}{{else}}{{/if}}
        $content = $content -replace "{{#if $field}}{{else}}{{/if}}", "{{#if $field}}{{$field}}{{else}}{{$lowerField}}{{/if}}"
        $content = $content -replace "{{#if $lowerField}}{{else}}{{/if}}", "{{#if $lowerField}}{{$lowerField}}{{else}}{{$lowerField}}{{/if}}"
    }
    
    # Fix complex LinkedIn and Website conditionals
    $content = $content -replace "{{#if LinkedIn}}<span>{{LinkedIn}}</span>{{else}}{{#if linkedin}}<span>{{linkedin}}</span>{{else}}{{#if linkedin}}<span>{{LinkedIn}}</span>{{else}}{{#if linkedin}}<span>{{linkedin}}</span>{{/if}}{{/if}}{{/if}}", "{{#if LinkedIn}}<span>{{LinkedIn}}</span>{{else}}{{#if linkedin}}<span>{{linkedin}}</span>{{/if}}{{/if}}"
    
    $content = $content -replace "{{#if Website}}<span>{{Website}}</span>{{else}}{{#if website}}<span>{{website}}</span>{{else}}{{#if website}}<span>{{Website}}</span>{{else}}{{#if website}}<span>{{website}}</span>{{/if}}{{/if}}{{/if}}", "{{#if Website}}<span>{{Website}}</span>{{else}}{{#if website}}<span>{{website}}</span>{{/if}}{{/if}}"
    
    # Save the updated content
    Set-Content -Path $template.FullName -Value $content
    Write-Host "Fixed empty conditionals in: $($template.Name)"
}

Write-Host "All empty conditionals have been fixed!"