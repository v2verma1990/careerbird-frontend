$templatesDir = "c:/Users/visha/Documents/glowup-resume-maker/public/resume-templates/html"
$templates = Get-ChildItem -Path $templatesDir -Filter "*.html"

foreach ($template in $templates) {
    Write-Host "Processing template: $($template.Name)"
    $content = Get-Content -Path $template.FullName -Raw
    
    # Replace title tag
    $content = $content -replace '<title>{{name}}([^<]*)</title>', '<title>{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}$1</title>'
    
    # Replace basic fields in header
    $content = $content -replace '{{name}}', '{{#if Name}}{{Name}}{{else}}{{name}}{{/if}}'
    $content = $content -replace '{{title}}', '{{#if Title}}{{Title}}{{else}}{{title}}{{/if}}'
    $content = $content -replace '{{email}}', '{{#if Email}}{{Email}}{{else}}{{email}}{{/if}}'
    $content = $content -replace '{{phone}}', '{{#if Phone}}{{Phone}}{{else}}{{phone}}{{/if}}'
    $content = $content -replace '{{location}}', '{{#if Location}}{{Location}}{{else}}{{location}}{{/if}}'
    
    # Replace linkedin and website with conditional checks
    $content = $content -replace '{{#if linkedin}}(.*?){{/if}}', '{{#if LinkedIn}}$1{{else}}{{#if linkedin}}$1{{/if}}{{/if}}'
    $content = $content -replace '{{#if website}}(.*?){{/if}}', '{{#if Website}}$1{{else}}{{#if website}}$1{{/if}}{{/if}}'
    
    # Replace summary section
    $content = $content -replace '{{#if summary}}([\s\S]*?){{/if}}', '{{#if Summary}}$1{{else}}{{#if summary}}$1{{/if}}{{/if}}'
    
    # Replace array checks for experience, education, skills, certifications, projects
    $content = $content -replace '{{#if experience}}([\s\S]*?){{/if}}', '{{#if Experience.length}}$1{{else}}{{#if experience.length}}$1{{/if}}{{/if}}'
    $content = $content -replace '{{#if education}}([\s\S]*?){{/if}}', '{{#if Education.length}}$1{{else}}{{#if education.length}}$1{{/if}}{{/if}}'
    $content = $content -replace '{{#if skills}}([\s\S]*?){{/if}}', '{{#if Skills.length}}$1{{else}}{{#if skills.length}}$1{{/if}}{{/if}}'
    $content = $content -replace '{{#if certifications}}([\s\S]*?){{/if}}', '{{#if Certifications.length}}$1{{else}}{{#if certifications.length}}$1{{/if}}{{/if}}'
    $content = $content -replace '{{#if projects}}([\s\S]*?){{/if}}', '{{#if Projects.length}}$1{{else}}{{#if projects.length}}$1{{/if}}{{/if}}'
    
    # Replace properties in each array item
    $content = $content -replace '{{this\.title}}', '{{#if this.Title}}{{this.Title}}{{else}}{{this.title}}{{/if}}'
    $content = $content -replace '{{this\.company}}', '{{#if this.Company}}{{this.Company}}{{else}}{{this.company}}{{/if}}'
    $content = $content -replace '{{this\.location}}', '{{#if this.Location}}{{this.Location}}{{else}}{{this.location}}{{/if}}'
    $content = $content -replace '{{this\.startDate}}', '{{#if this.StartDate}}{{this.StartDate}}{{else}}{{this.startDate}}{{/if}}'
    $content = $content -replace '{{this\.endDate}}', '{{#if this.EndDate}}{{this.EndDate}}{{else}}{{this.endDate}}{{/if}}'
    $content = $content -replace '{{this\.description}}', '{{#if this.Description}}{{this.Description}}{{else}}{{this.description}}{{/if}}'
    $content = $content -replace '{{this\.degree}}', '{{#if this.Degree}}{{this.Degree}}{{else}}{{this.degree}}{{/if}}'
    $content = $content -replace '{{this\.institution}}', '{{#if this.Institution}}{{this.Institution}}{{else}}{{this.institution}}{{/if}}'
    $content = $content -replace '{{this\.name}}', '{{#if this.Name}}{{this.Name}}{{else}}{{this.name}}{{/if}}'
    $content = $content -replace '{{this\.issuer}}', '{{#if this.Issuer}}{{this.Issuer}}{{else}}{{this.issuer}}{{/if}}'
    $content = $content -replace '{{this\.date}}', '{{#if this.Date}}{{this.Date}}{{else}}{{this.date}}{{/if}}'
    $content = $content -replace '{{this\.technologies}}', '{{#if this.Technologies}}{{this.Technologies}}{{else}}{{this.technologies}}{{/if}}'
    
    # Save the updated content
    Set-Content -Path $template.FullName -Value $content
    Write-Host "Updated template: $($template.Name)"
}

Write-Host "All templates have been updated!"