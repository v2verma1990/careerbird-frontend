# PowerShell script to add certifications and projects sections to all templates

$templateDir = "c:/Users/visha/Documents/careerbird-frontend/backend/ResumeAI.API/html"
$templates = Get-ChildItem -Path $templateDir -Filter "*.html"

Write-Host "Found $($templates.Count) templates to update..."

$certificationsSection = @"
      {{#if certifications}}
      <div class="certifications-section">
        <h2>Certifications</h2>
        {{#each certifications}}
          <div class="certification-name">{{name}}</div>
          <div class="certification-issuer">{{issuer}}</div>
          {{#if date}}
            <div class="certification-date">{{date}}</div>
          {{/if}}
        {{/each}}
      </div>
      {{/if}}
"@

$projectsSection = @"
      {{#if projects}}
      <div class="projects-section">
        <h2>Projects</h2>
        {{#each projects}}
          <div class="project-name">{{name}}</div>
          {{#if description}}
            <div class="project-description">{{description}}</div>
          {{/if}}
          {{#if technologies}}
            <div class="project-technologies">Technologies: {{technologies}}</div>
          {{/if}}
        {{/each}}
      </div>
      {{/if}}
"@

foreach ($template in $templates) {
    Write-Host "Processing: $($template.Name)"
    
    $content = Get-Content -Path $template.FullName -Raw
    $originalContent = $content
    
    # Check if certifications section already exists
    if ($content -notmatch "certifications-section" -and $content -notmatch "{{#if certifications}}") {
        # Find a good place to insert certifications (usually after education, before references)
        if ($content -match "(?s)(<div[^>]*education[^>]*>.*?</div>)") {
            $content = $content -replace "(?s)(<div[^>]*education[^>]*>.*?</div>)", "`$1$certificationsSection"
            Write-Host "  Added certifications section"
        }
    }
    
    # Check if projects section already exists
    if ($content -notmatch "projects-section" -and $content -notmatch "{{#if projects}}") {
        # Find a good place to insert projects (usually after certifications or education, before references)
        if ($content -match "(?s)(certifications-section.*?</div>\s*{{/if}})") {
            $content = $content -replace "(?s)(certifications-section.*?</div>\s*{{/if}})", "`$1$projectsSection"
            Write-Host "  Added projects section after certifications"
        } elseif ($content -match "(?s)(<div[^>]*education[^>]*>.*?</div>)") {
            $content = $content -replace "(?s)(<div[^>]*education[^>]*>.*?</div>)", "`$1$projectsSection"
            Write-Host "  Added projects section after education"
        }
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $template.FullName -Value $content -NoNewline
        Write-Host "  Updated: $($template.Name)"
    } else {
        Write-Host "  No changes: $($template.Name)"
    }
}

Write-Host "Section addition complete!"