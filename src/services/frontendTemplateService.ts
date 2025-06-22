/**
 * Frontend Template Service - Clean Architecture
 * Single source of truth using frontend CSS with dynamic colors
 * No backend API calls for CSS - everything handled in frontend
 */

// CSS imports removed - using centralized templates.css instead
// All template styles are now included in the main templates.css file

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

  // Supported templates that use frontend CSS (styles are in templates.css)
  private supportedTemplates = [
    'navy-column-modern',
    'modern-executive',
    'startup-founder',
    'modern-clean',
    'professional',
    'minimal',
    'creative',
    'executive',
    'tech',
    'elegant'
  ];

  // Template CSS mapping - contains the CSS for each template
  private templateCssMap: Record<string, string> = {};

  private constructor() {
    this.initializeTemplateCssMap();
  }

  /**
   * Initialize the template CSS mapping with base styles and template-specific styles
   */
  private initializeTemplateCssMap(): void {
    // Base CSS that applies to all templates
    const baseCss = `
      /* Reset and base styles for all templates */
      .resume-container {
        max-width: 8.5in;
        margin: 0 auto;
        background-color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        padding: 40px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
      }

      /* Preview container styles */
      .resume-preview-container {
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        padding: 1rem;
        background-color: white;
        overflow: auto;
      }

      .resume-preview {
        width: 100%;
        min-height: 800px;
        border: none;
        background-color: white;
      }

      /* Template sections */
      .template-section {
        margin-bottom: 30px;
      }

      .template-section:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 18px;
        margin-bottom: 15px;
        font-weight: 600;
        padding-bottom: 5px;
        display: inline-block;
      }

      /* Experience and Education items */
      .experience-item,
      .education-item {
        margin-bottom: 25px;
      }

      .experience-item:last-child,
      .education-item:last-child {
        margin-bottom: 0;
      }

      .item-title {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 5px;
      }

      .item-subtitle {
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 5px;
      }

      .item-meta {
        font-size: 13px;
        color: #666;
        margin-bottom: 10px;
      }

      .item-description {
        font-size: 14px;
        line-height: 1.5;
      }

      /* Skills section */
      .skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .skill-item {
        background-color: #f1f1f1;
        color: #34495e;
        padding: 5px 12px;
        border-radius: 3px;
        font-size: 13px;
        font-weight: 500;
      }

      /* Personal info section */
      .personal-info {
        text-align: center;
        margin-bottom: 30px;
      }

      .personal-name {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .personal-title {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 15px;
      }

      .contact-info {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
        font-size: 14px;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* Photo styles */
      .profile-photo {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        margin: 0 auto 20px;
        display: block;
        border: 3px solid #ddd;
      }

      /* Print styles */
      @media print {
        .resume-container {
          box-shadow: none;
          padding: 0;
          max-width: none;
        }
        
        .resume-preview-container {
          border: none;
          padding: 0;
        }
        
        .no-print {
          display: none !important;
        }
        
        /* Ensure colors print correctly */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    // Template-specific CSS
    this.templateCssMap = {
      'navy-column-modern': baseCss + this.getNavyColumnModernCss(),
      'modern-executive': baseCss + this.getModernExecutiveCss(),
      'startup-founder': baseCss + this.getStartupFounderCss(),
      'modern-clean': baseCss + this.getModernCleanCss(),
      'professional': baseCss + this.getProfessionalCss(),
      'minimal': baseCss + this.getMinimalCss(),
      'creative': baseCss + this.getCreativeCss(),
      'executive': baseCss + this.getExecutiveCss(),
      'tech': baseCss + this.getTechCss(),
      'elegant': baseCss + this.getElegantCss()
    };
  }

  /**
   * Get Navy Column Modern template CSS
   */
  private getNavyColumnModernCss(): string {
    return `
      /* ===== NAVY COLUMN MODERN TEMPLATE ===== */
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

      /* Force sidebar color override for any inline styles */
      .navy-column-modern .sidebar[style*="background"] {
        background: var(--template-color, #315389) !important;
      }

      .navy-column-modern .photo {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 20px;
        border: 3px solid #f1f3fa;
        background: #fff;
      }

      .navy-column-modern .photo-placeholder {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        margin-bottom: 20px;
        border: 3px solid #f1f3fa;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: #315389;
      }

      .navy-column-modern .sidebar-section {
        margin-bottom: 36px;
        width: 100%;
      }

      .navy-column-modern .sidebar-section-title {
        font-size: 17px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 10px;
        color: #e6eaf5;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 4px;
      }

      .navy-column-modern .sidebar-details {
        font-size: 14px;
        line-height: 1.7;
        word-break: break-word;
        color: #fff;
      }

      .navy-column-modern .sidebar-details a {
        color: #d0e6fd;
        text-decoration: none;
        font-size: 14px;
        word-break: break-all;
      }

      .navy-column-modern .sidebar-skills-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .navy-column-modern .sidebar-skills-list li {
        font-size: 13.5px;
        font-weight: 400;
        color: #e6eaf5;
        margin-bottom: 7px;
        border-left: 4px solid rgba(255, 255, 255, 0.4);
        padding-left: 7px;
      }

      .navy-column-modern .content {
        flex: 1;
        padding: 48px 44px 46px 44px;
        color: #272d3a;
        background: #fff;
        min-height: 1040px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .navy-column-modern .content h1 {
        font-size: 2.04rem;
        font-weight: 700;
        color: #21355e;
        letter-spacing: 0.5px;
        margin: 0 0 2px 0;
        line-height: 1.1;
      }

      .navy-column-modern .content h2 {
        font-size: 1.29rem;
        font-weight: 700;
        margin: 32px 0 13px 0;
        color: var(--template-color, #315389) !important;
        border-bottom: 2px solid #f1f3fa;
        padding-bottom: 2px;
      }

      .navy-column-modern .content .title {
        font-size: 1.13rem;
        color: var(--template-color, #315389) !important;
        font-weight: 500;
        margin-bottom: 22px;
      }

      .navy-column-modern .profile-section,
      .navy-column-modern .employment-section,
      .navy-column-modern .education-section {
        margin-bottom: 22px;
      }

      .navy-column-modern .section-label {
        font-weight: 700;
        color: var(--template-color, #315389) !important;
        font-size: 1.08em;
        margin-bottom: 8px;
      }

      .navy-column-modern .profile-summary {
        font-size: 1.01rem;
        color: #232c47;
        margin-bottom: 7px;
        line-height: 1.6;
      }

      .navy-column-modern .employment-history-role {
        font-weight: bold;
        font-size: 1.07rem;
        color: #193461;
        margin-bottom: 2px;
      }

      .navy-column-modern .employment-history-company {
        font-weight: 400;
        color: #293e60;
      }

      .navy-column-modern .employment-history-dates {
        font-size: 0.94rem;
        color: #749ed9;
        margin-bottom: 2px;
        font-weight: 400;
      }

      .navy-column-modern .employment-history-list {
        margin: 0 0 6px 0;
        padding: 0 0 0 18px;
        font-size: 1.01rem;
        color: #242e45;
      }

      .navy-column-modern .education-degree {
        font-weight: 700;
        font-size: 1.05rem;
        color: #22396e;
      }

      .navy-column-modern .education-institution {
        font-size: 1.01rem;
        margin-bottom: 2px;
        color: #385886;
      }

      .navy-column-modern .education-dates {
        font-size: 0.98rem;
        color: #738dab;
        margin-bottom: 4px;
      }

      /* Force immediate application of colors */
      .navy-column-modern .sidebar,
      .navy-column-modern .sidebar[style] {
        background: var(--template-color) !important;
        background-color: var(--template-color) !important;
      }

      .navy-column-modern .content h2,
      .navy-column-modern .content h2[style],
      .navy-column-modern .section-label,
      .navy-column-modern .section-label[style],
      .navy-column-modern .content .title,
      .navy-column-modern .content .title[style] {
        color: var(--template-color) !important;
      }

      /* Print optimizations for navy-column-modern */
      @media print {
        .navy-column-modern .resume-container {
          box-shadow: none;
          border-radius: 0;
          margin: 0;
        }
        
        .navy-column-modern .sidebar {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  /**
   * Get Modern Executive template CSS
   */
  private getModernExecutiveCss(): string {
    return `
      /* ===== MODERN EXECUTIVE TEMPLATE ===== */
      .modern-executive * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .modern-executive body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
      }

      .modern-executive .container {
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
        min-height: 11in;
      }

      .modern-executive .header {
        background: linear-gradient(135deg, var(--template-color, #22c55e), rgba(var(--template-color-rgb, 34, 197, 94), 0.87));
        color: white;
        padding: 2.5rem 2rem;
        text-align: center;
        margin-bottom: 2rem;
        border-radius: 8px;
      }

      .modern-executive .header h1 {
        font-size: 2.8rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        letter-spacing: 1px;
      }

      .modern-executive .header .title {
        font-size: 1.3rem;
        opacity: 0.9;
        margin-bottom: 1.5rem;
        font-weight: 300;
      }

      .modern-executive .contact-info {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        font-size: 0.95rem;
      }

      .modern-executive .contact-info span {
        opacity: 0.95;
      }

      .modern-executive .section {
        margin-bottom: 2.5rem;
      }

      .modern-executive .section-title {
        font-size: 1.5rem;
        color: var(--template-color, #22c55e);
        border-bottom: 3px solid var(--template-color, #22c55e);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .modern-executive .summary {
        font-size: 1rem;
        line-height: 1.8;
        text-align: justify;
        color: #374151;
        padding: 0.5rem 0;
      }

      .modern-executive .experience-item,
      .modern-executive .education-item {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .modern-executive .experience-item:last-child,
      .modern-executive .education-item:last-child {
        border-bottom: none;
      }

      .modern-executive .experience-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .modern-executive .job-title {
        font-weight: bold;
        font-size: 1.2rem;
        color: var(--template-color, #22c55e);
        margin-bottom: 0.3rem;
      }

      .modern-executive .company {
        font-weight: 600;
        color: #374151;
        font-size: 1rem;
      }

      .modern-executive .date-location {
        color: #6b7280;
        font-style: italic;
        text-align: right;
        font-size: 0.9rem;
      }

      .modern-executive .description {
        margin-top: 1rem;
        line-height: 1.7;
        color: #374151;
      }

      .modern-executive .description ul {
        margin-left: 1.5rem;
        margin-top: 0.5rem;
      }

      .modern-executive .description li {
        margin-bottom: 0.5rem;
      }

      .modern-executive .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.7rem;
      }

      .modern-executive .skill-tag {
        background: rgba(var(--template-color-rgb, 34, 197, 94), 0.2);
        color: var(--template-color, #22c55e);
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        border: 1px solid rgba(var(--template-color-rgb, 34, 197, 94), 0.53);
      }

      .modern-executive .certifications ul {
        list-style: none;
        padding: 0;
      }

      .modern-executive .certifications li {
        background: #f8fafc;
        padding: 0.8rem 1rem;
        margin-bottom: 0.5rem;
        border-left: 4px solid var(--template-color, #22c55e);
        border-radius: 4px;
      }

      /* Print optimizations for modern-executive */
      @media print {
        .modern-executive .container {
          max-width: none;
          padding: 0;
        }
        
        .modern-executive .header {
          border-radius: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .modern-executive * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  /**
   * Placeholder methods for other templates - implement as needed
   */
  private getStartupFounderCss(): string { return '/* Startup Founder template styles */'; }
  private getModernCleanCss(): string { return '/* Modern Clean template styles */'; }
  private getProfessionalCss(): string { return '/* Professional template styles */'; }
  private getMinimalCss(): string { return '/* Minimal template styles */'; }
  private getCreativeCss(): string { return '/* Creative template styles */'; }
  private getExecutiveCss(): string { return '/* Executive template styles */'; }
  private getTechCss(): string { return '/* Tech template styles */'; }
  private getElegantCss(): string { return '/* Elegant template styles */'; }

  public static getInstance(): FrontendTemplateService {
    if (!FrontendTemplateService.instance) {
      FrontendTemplateService.instance = new FrontendTemplateService();
    }
    return FrontendTemplateService.instance;
  }

  /**
   * Apply template styles: set color variable and body class
   */
  public applyTemplateStyles(templateId: string, color: string): void {
    document.documentElement.style.setProperty('--template-color', color, 'important');
    document.documentElement.style.setProperty('--template-color-rgb', this.hexToRgb(color), 'important');
    this.ensureTemplateClass(templateId);
    this.cleanupOverrideStyles();
  }

  /**
   * Ensure only the correct template class is on <body>
   */
  private ensureTemplateClass(templateId: string): void {
    this.supportedTemplates.forEach(tid => document.body.classList.remove(tid));
    document.body.classList.add(templateId);
  }

  /**
   * Remove any old color override style tags (legacy support)
   */
  private cleanupOverrideStyles(): void {
    const existing = document.querySelector('style[data-color-override]');
    if (existing) existing.remove();
  }

  /**
   * Render resume using frontend template with backend HTML
   */
  public async renderResume(templateId: string, resumeData: any, color: string): Promise<RenderedTemplate> {
    console.log('FrontendTemplateService: Rendering template:', templateId, 'with color:', color);
    
    if (!this.supportedTemplates.includes(templateId)) {
      throw new Error(`Template ${templateId} is not supported by frontend service. Supported: ${this.supportedTemplates.join(', ')}`);
    }
    // Fetch HTML from backend (data binding only)
    const { api } = await import('@/utils/apiClient');
    const { data: result, error } = await api.resumeBuilder.buildResumeForTemplate({
      resumeData: JSON.stringify({ ...resumeData, color }),
      templateId,
      color
    });

    if (error) throw new Error(`Failed to render resume: ${error}`);

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

    // Minimal CSS for color variable
    const css = `
      :root {
        --template-color: ${color};
      }
    `;

    // Full HTML with embedded CSS
    const fullHtml = this.createFullHtml(html, css, templateId);
    console.log('Full HTML:', fullHtml);

    return {
      html,
      css,
      fullHtml,
      templateId,
      color,
      timestamp: Date.now()
    };
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
    ${this.getFrontendCSS(templateId)}
    ${css}
  </style>
</head>
<body class="${templateId}">
  ${bodyHtml}
</body>
</html>`;
  }

  /**
   * Get the frontend CSS content for a template
   */
  private getFrontendCSS(templateId: string): string {
    console.log('Injected CSS:', this.templateCssMap[templateId]);
    return this.templateCssMap[templateId] || '';
  }

  /**
   * Cleanup all template-related styles and classes
   */
  public cleanup(): void {
    document.documentElement.style.removeProperty('--template-color');
    this.cleanupOverrideStyles();
    this.supportedTemplates.forEach(tid => document.body.classList.remove(tid));
    // Optionally remove forced inline styles if needed
  }

  private hexToRgb(hex: string): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(',');
  }
}

export const frontendTemplateService = FrontendTemplateService.getInstance();