/**
 * Frontend Template Service - Clean Architecture
 * Single source of truth using frontend CSS with dynamic colors
 * No backend API calls for CSS - everything handled in frontend
 */

export interface TemplateConfig {
  templateId: string;
  color: string;
}

export interface RenderedTemplate {
  html: string;
  css: string;
  fullHtml: string;
  templateId: string;
  color: string;
  timestamp: number;
}

class FrontendTemplateService {
  private static instance: FrontendTemplateService;
  
  private constructor() {}

  public static getInstance(): FrontendTemplateService {
    if (!FrontendTemplateService.instance) {
      FrontendTemplateService.instance = new FrontendTemplateService();
    }
    return FrontendTemplateService.instance;
  }

  /**
   * Apply template styles immediately without flash
   */
  public applyTemplateStyles(templateId: string, color: string): void {
    console.log('FrontendTemplateService: Applying styles for:', templateId, 'color:', color);
    
    // STEP 1: Set CSS custom property immediately with !important
    document.documentElement.style.setProperty('--template-color', color, 'important');
    
    // STEP 2: Ensure body has correct template class
    this.ensureTemplateClass(templateId);
    
    // STEP 3: Force immediate color application to prevent flash
    this.forceImmediateColorApplication(color);
    
    // STEP 4: Add a style tag to override any existing styles
    this.addColorOverrideStyle(color);
    
    // STEP 5: Debug - log the current CSS custom property value
    const computedColor = getComputedStyle(document.documentElement).getPropertyValue('--template-color');
    console.log('FrontendTemplateService: CSS custom property --template-color is now:', computedColor.trim());
    
    console.log('FrontendTemplateService: Styles applied successfully with color:', color);
  }

  /**
   * Ensure body has the correct template class
   */
  private ensureTemplateClass(templateId: string): void {
    const supportedTemplates = [
      'navy-column-modern',
      'modern-clean',
      'professional',
      'minimal',
      'creative',
      'executive',
      'tech',
      'elegant',
      'academic',
      'entry-level',
      'chronological',
      'academic-scholar',
      'creative-designer',
      'finance-expert',
      'marketing-pro',
      'startup-founder',
      'tech-minimalist',
      'modern-executive'
    ];
    
    // Remove all template classes
    supportedTemplates.forEach(template => {
      document.body.classList.remove(template);
    });
    
    // Add the current template class
    document.body.classList.add(templateId);
  }

  /**
   * Force immediate color application to prevent flash
   */
  private forceImmediateColorApplication(color: string): void {
    // Since backend no longer generates inline styles, 
    // the CSS custom property should be sufficient
    // This method is kept for any edge cases
    console.log('FrontendTemplateService: CSS custom property should handle color application');
  }

  /**
   * Add a style tag to set the color CSS custom property
   */
  private addColorOverrideStyle(color: string): void {
    // Remove any existing override style
    const existingOverride = document.querySelector('style[data-color-override]');
    if (existingOverride) {
      existingOverride.remove();
    }

    // Create new color style with CSS custom property and specific overrides
    const overrideStyle = document.createElement('style');
    overrideStyle.setAttribute('data-color-override', 'true');
    overrideStyle.textContent = `
      :root {
        --template-color: ${color} !important;
      }
      
      /* Force navy-column-modern sidebar color */
      .navy-column-modern .sidebar {
        background: ${color} !important;
        background-color: ${color} !important;
      }
      
      /* Force navy-column-modern content colors */
      .navy-column-modern .content h2,
      .navy-column-modern .section-label,
      .navy-column-modern .content .title {
        color: ${color} !important;
      }
      
      /* Force all template colors */
      .section-title,
      .item-title,
      h1, h2, h3, h4, h5, h6 {
        color: var(--template-color, ${color}) !important;
      }
    `;
    
    // Insert at the end of head for maximum priority
    document.head.appendChild(overrideStyle);
    
    console.log('FrontendTemplateService: Set CSS custom property --template-color to:', color);
  }

  /**
   * Render resume using frontend template with backend HTML
   */
  public async renderResume(templateId: string, resumeData: any, color: string): Promise<RenderedTemplate> {
    console.log('FrontendTemplateService: Rendering resume with frontend styles');
    
    try {
      // Get HTML from backend (data binding only)
      const { api } = await import('@/utils/apiClient');
      
      const { data: result, error } = await api.resumeBuilder.buildResumeForTemplate({
        resumeData: JSON.stringify({ ...resumeData, color }),
        templateId,
        color
      });

      if (error) {
        throw new Error(`Failed to render resume: ${error}`);
      }

      // Extract HTML from response
      let html: string;
      if (result?.success && result.data?.html) {
        html = result.data.html;
      } else if (result?.html) {
        html = result.html;
      } else if (typeof result === 'string') {
        html = result;
      } else {
        throw new Error('Invalid response format from backend');
      }

      // Create minimal CSS (just the color variable)
      const css = `
        :root {
          --template-color: ${color};
        }
      `;

      // Create full HTML with frontend CSS link
      const fullHtml = await this.createFullHtml(html, css, templateId);

      return {
        html,
        css,
        fullHtml,
        templateId,
        color,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('FrontendTemplateService: Failed to render resume:', error);
      throw error;
    }
  }

  /**
   * Create complete HTML document with frontend CSS
   */
  private async createFullHtml(bodyHtml: string, css: string, templateId: string): Promise<string> {
    const frontendCSS = await this.getFrontendCSS();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    /* Frontend CSS embedded for PDF generation */
    ${frontendCSS}
    ${css}
  </style>
</head>
<body class="${templateId}">
  ${bodyHtml}
</body>
</html>`;
  }

  /**
   * Get the frontend CSS content (for PDF generation)
   * This method loads the complete CSS from all-templates.css
   */
  private async getFrontendCSS(): Promise<string> {
    try {
      // In a real implementation, you would fetch the CSS file content
      // For now, we'll return a comprehensive CSS that includes all templates
      const response = await fetch('/src/styles/all-templates.css');
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn('Could not load all-templates.css, using fallback CSS');
    }
    
    // Fallback CSS with essential styles for all templates
    return `
      /* Base styles for all templates */
      :root {
        --template-color: #3498db;
      }
      
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background: white;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }
      
      * {
        box-sizing: border-box;
      }
      
      /* Common template styles */
      .resume-container {
        max-width: 8.5in;
        margin: 0 auto;
        background-color: white;
        padding: 40px;
        line-height: 1.6;
        color: #333;
      }
      
      .section-title {
        color: var(--template-color) !important;
        font-weight: 600;
        margin-bottom: 15px;
      }
      
      .item-title {
        font-weight: 600;
        margin-bottom: 5px;
      }
      
      /* Print styles */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          background: white !important;
        }
        
        .resume-container {
          box-shadow: none !important;
          max-width: none !important;
        }
      }
    `;
  }

  /**
   * Clear all template-related styles and classes
   */
  public cleanup(): void {
    // Remove CSS custom property
    document.documentElement.style.removeProperty('--template-color');
    
    // Remove color override style
    const existingOverride = document.querySelector('style[data-color-override]');
    if (existingOverride) {
      existingOverride.remove();
    }
    
    // Remove template classes
    const supportedTemplates = [
      'navy-column-modern',
      'modern-clean',
      'professional',
      'minimal',
      'creative',
      'executive',
      'tech',
      'elegant',
      'academic',
      'entry-level',
      'chronological',
      'academic-scholar',
      'creative-designer',
      'finance-expert',
      'marketing-pro',
      'startup-founder',
      'tech-minimalist',
      'modern-executive'
    ];
    supportedTemplates.forEach(template => {
      document.body.classList.remove(template);
    });
  }
}

export const frontendTemplateService = FrontendTemplateService.getInstance();