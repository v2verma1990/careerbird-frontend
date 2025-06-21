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
    
    console.log('FrontendTemplateService: Styles applied successfully with color:', color);
  }

  /**
   * Ensure body has the correct template class
   */
  private ensureTemplateClass(templateId: string): void {
    const supportedTemplates = ['navy-column-modern']; // Add more as needed
    
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

    // Create new color style with CSS custom property
    const overrideStyle = document.createElement('style');
    overrideStyle.setAttribute('data-color-override', 'true');
    overrideStyle.textContent = `
      :root {
        --template-color: ${color} !important;
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
      const fullHtml = this.createFullHtml(html, css, templateId);

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
  private createFullHtml(bodyHtml: string, css: string, templateId: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    /* Frontend CSS would be embedded here for PDF generation */
    ${this.getFrontendCSS()}
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
   * In a real implementation, this would read from the CSS file
   */
  private getFrontendCSS(): string {
    // This is a simplified version - in production, you'd read from templates.css
    return `
      /* Base styles */
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background: #f5f6fa;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }
      
      /* Navy Column Modern Template */
      .navy-column-modern .resume-container {
        max-width: 7.3in;
        width: 100%;
        margin: 0.5in auto;
        background: #fff;
        border-radius: 18px;
        display: flex;
        box-shadow: 0 2px 28px rgba(30,40,90,.13), 0 0.5px 3px rgba(30,64,175,.09);
        overflow: hidden;
        box-sizing: border-box;
      }
      
      .navy-column-modern .sidebar {
        background: var(--template-color, #315389) !important;
        color: #fff !important;
        width: 250px;
        min-height: 100%;
        padding: 36px 24px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        box-sizing: border-box;
        flex-shrink: 0;
        overflow: visible;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .navy-column-modern .content h2 {
        color: var(--template-color, #315389) !important;
      }
      
      .navy-column-modern .section-label {
        color: var(--template-color, #315389) !important;
      }
      
      .navy-column-modern .content .title {
        color: var(--template-color, #315389) !important;
      }
      
      /* Add more styles as needed */
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
    const supportedTemplates = ['navy-column-modern'];
    supportedTemplates.forEach(template => {
      document.body.classList.remove(template);
    });
  }
}

export const frontendTemplateService = FrontendTemplateService.getInstance();