$templatesDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$templates = Get-ChildItem -Path $templatesDir -Filter "*.html"

foreach ($template in $templates) {
    Write-Host "Processing template: $($template.Name)"
    $content = Get-Content -Path $template.FullName -Raw
    
    # Fix nested conditional checks for common fields
    $fieldsToFix = @(
        "Name", "Title", "Email", "Phone", "Location", 
        "LinkedIn", "Website", "Summary", "Experience", 
        "Education", "Skills", "Certifications", "Projects"
    )
    
    foreach ($field in $fieldsToFix) {
        $lowerField = $field.ToLower()
        
        # Fix double nested conditionals like {{#if Field}}{{#if Field}}...{{else}}...{{/if}}{{else}}...{{/if}}
        $pattern = "{{#if $field}}{{#if $field}}(.*?){{else}}(.*?){{/if}}{{else}}{{#if $field}}(.*?){{else}}(.*?){{/if}}{{/if}}"
        $replacement = "{{#if $field}}$1{{else}}$4{{/if}}"
        $content = $content -replace $pattern, $replacement
        
        # Fix for lowercase version too
        $pattern = "{{#if $lowerField}}{{#if $lowerField}}(.*?){{else}}(.*?){{/if}}{{else}}{{#if $lowerField}}(.*?){{else}}(.*?){{/if}}{{/if}}"
        $replacement = "{{#if $lowerField}}$1{{else}}$4{{/if}}"
        $content = $content -replace $pattern, $replacement
        
        # Fix any remaining double conditionals
        $pattern = "{{#if $field}}{{#if $field}}"
        $replacement = "{{#if $field}}"
        $content = $content -replace $pattern, $replacement
        
        $pattern = "{{#if $lowerField}}{{#if $lowerField}}"
        $replacement = "{{#if $lowerField}}"
        $content = $content -replace $pattern, $replacement
    }
    
    # Fix complex nested LinkedIn and Website conditionals
    $content = $content -replace "{{#if LinkedIn}}{{LinkedIn}}{{else}}{{#if linkedin}}{{linkedin}}{{else}}{{#if linkedin}}{{LinkedIn}}{{else}}{{#if linkedin}}{{linkedin}}{{/if}}{{/if}}{{/if}}", "{{#if LinkedIn}}{{LinkedIn}}{{else}}{{#if linkedin}}{{linkedin}}{{/if}}{{/if}}"
    
    $content = $content -replace "{{#if Website}}([^}]+){{else}}{{#if website}}([^}]+){{else}}{{#if website}}([^}]+){{else}}{{#if website}}([^}]+){{/if}}{{/if}}{{/if}}", "{{#if Website}}$1{{else}}{{#if website}}$2{{/if}}{{/if}}"
    
    # Save the updated content
    Set-Content -Path $template.FullName -Value $content
    Write-Host "Fixed nested conditionals in: $($template.Name)"
}

Write-Host "All nested conditionals have been fixed!"