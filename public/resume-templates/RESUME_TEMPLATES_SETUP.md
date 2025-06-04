# Resume Templates Setup Guide

This comprehensive guide explains how to set up and manage resume templates in the application. Following these steps will ensure the resume builder functionality works correctly without any hardcoded or default values.

## Required Files and Structure

For the resume templates to work properly, you need to have the following structure:

```
public/resume-templates/
├── templates.json           # Defines all available templates
├── html/                    # Contains HTML template files
│   ├── minimal.html
│   ├── modern-clean.html
│   └── ...
└── thumbnails/              # Contains thumbnail images for templates
    ├── minimal.png
    ├── modern-clean.png
    └── ...
```

## Step 1: Ensure templates.json is Properly Configured

The `templates.json` file defines all available templates. Make sure it contains entries for all templates you want to offer:

```json
{
  "templates": [
    {
      "id": "minimal",
      "name": "Minimal",
      "description": "A minimalist design focusing on content",
      "thumbnail": "/resume-templates/thumbnails/minimal.png",
      "category": "minimal"
    },
    {
      "id": "modern-clean",
      "name": "Modern Clean",
      "description": "A clean, modern design with a professional look",
      "thumbnail": "/resume-templates/thumbnails/modern-clean.png",
      "category": "professional"
    },
    // Add more templates as needed
  ]
}
```

## Step 2: Create HTML Templates

For each template defined in `templates.json`, create a corresponding HTML file in the `html/` directory. The filename must match the template ID (e.g., `minimal.html` for the "minimal" template).

All HTML templates have been created for you in the `public/resume-templates/html/` directory:
- minimal.html
- modern-clean.html
- creative.html
- professional.html
- executive.html
- tech.html
- elegant.html
- academic.html
- entry-level.html
- chronological.html

## Step 3: Create Thumbnail Images (REQUIRED)

**This is the critical step you need to complete.** For each template, you need to create a thumbnail image in the `thumbnails/` directory. The filename must match the template ID (e.g., `minimal.png` for the "minimal" template).

### Thumbnail Requirements:
- Size: 300x400 pixels (recommended)
- Format: PNG or JPG
- Filename: Must match the template ID exactly (e.g., `minimal.png`)

### How to Create Thumbnails:

#### Option 1: Use the Placeholder Generator
1. Open `public/resume-templates/thumbnails/placeholder-generator.html` in a web browser
2. Take screenshots of each placeholder
3. Save them with the correct filenames in the thumbnails directory

#### Option 2: Create Custom Thumbnails
1. Use any image editing software (Photoshop, GIMP, Paint, etc.)
2. Create a 300x400 pixel image for each template
3. Design it to represent the template's appearance
4. Save with the correct filename in the thumbnails directory

#### Option 3: Take Screenshots of Rendered Templates
1. Fill the resume builder with sample data
2. Generate previews using each template
3. Take screenshots of the previews
4. Crop and resize to 300x400 pixels
5. Save with the correct filename in the thumbnails directory

### Required Thumbnail Files:
1. minimal.png
2. modern-clean.png
3. creative.png
4. professional.png
5. executive.png
6. tech.png
7. elegant.png
8. academic.png
9. entry-level.png
10. chronological.png

## Step 4: Verify Setup

After completing the above steps:

1. Make sure all HTML template files exist in the `html/` directory
2. Make sure all thumbnail images exist in the `thumbnails/` directory
3. Verify that `templates.json` contains entries for all templates
4. Restart the application if it's running

## Troubleshooting

If templates don't appear in the Resume Builder:

1. Check server logs for errors
2. Verify that the HTML files exist and have the correct filenames
3. Verify that the thumbnail images exist and have the correct filenames
4. Make sure the template IDs in `templates.json` match the filenames of the HTML and thumbnail files
5. Check that the paths in `templates.json` are correct (should be `/resume-templates/thumbnails/[filename]`)

## Adding New Templates in the Future

To add a new template:

1. Create a new HTML template file in the `html/` directory
2. Create a thumbnail image in the `thumbnails/` directory
3. Add an entry to `templates.json`

### Example: Adding a "Modern Dark" Template

1. Create `html/modern-dark.html` with your template HTML and CSS
2. Create `thumbnails/modern-dark.png` as a 300x400 pixel thumbnail
3. Add to `templates.json`:
   ```json
   {
     "id": "modern-dark",
     "name": "Modern Dark",
     "description": "A sleek dark-themed modern resume",
     "thumbnail": "/resume-templates/thumbnails/modern-dark.png",
     "category": "professional"
   }
   ```

## Template Variables Reference

When creating new templates, you can use these variables:

### Basic Information:
- `{{name}}` - The user's full name
- `{{title}}` - The user's job title
- `{{email}}` - The user's email address
- `{{phone}}` - The user's phone number
- `{{location}}` - The user's location
- `{{linkedin}}` - The user's LinkedIn profile (optional)
- `{{website}}` - The user's website (optional)
- `{{summary}}` - A summary or objective statement

### Experience:
```
{{#each experience}}
  {{this.title}} - Job title
  {{this.company}} - Company name
  {{this.location}} - Job location
  {{this.startDate}} - Start date
  {{this.endDate}} - End date
  {{this.description}} - Job description
{{/each}}
```

### Education:
```
{{#each education}}
  {{this.degree}} - Degree name
  {{this.institution}} - School/university name
  {{this.location}} - School location
  {{this.startDate}} - Start date
  {{this.endDate}} - End date
  {{this.description}} - Additional details (optional)
{{/each}}
```

### Skills:
```
{{#each skills}}
  {{this}} - Individual skill
{{/each}}
```

### Certifications:
```
{{#each certifications}}
  {{this.name}} - Certification name
  {{this.issuer}} - Issuing organization
  {{this.date}} - Date obtained
{{/each}}
```

### Projects:
```
{{#each projects}}
  {{this.name}} - Project name
  {{this.date}} - Project date
  {{this.description}} - Project description
{{/each}}
```

## Important Notes

- The application will only display templates that have both an HTML file and a thumbnail image
- No default templates are used - only the templates you define will be available
- Template IDs must be unique and should use lowercase letters, numbers, and hyphens only
- The application uses Handlebars.js for template rendering