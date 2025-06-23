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
    'elegant',
    'creative-designer',
    'tech-minimalist',
    'academic-scholar',
    'fresh-graduate',
    'grey-classic-profile',
    'blue-sidebar-profile',
    'green-sidebar-receptionist',
    'classic-profile-orange',
    'classic-law-bw',
    'green-sidebar-customer-service'
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
      'elegant': baseCss + this.getElegantCss(),
      'creative-designer': baseCss + this.getCreativeDesignerCss(),
      'tech-minimalist': baseCss + this.getTechMinimalistCss(),
      'academic-scholar': baseCss + this.getAcademicScholarCss(),
      'fresh-graduate': baseCss + this.getFreshGraduateCss(),
      'grey-classic-profile': baseCss + this.getGreyClassicProfileCss(),
      'blue-sidebar-profile': baseCss + this.getBlueSidebarProfileCss(),
      'green-sidebar-receptionist': baseCss + this.getGreenSidebarReceptionistCss(),
      'classic-profile-orange': baseCss + this.getClassicProfileOrangeCss(),
      'classic-law-bw': baseCss + this.getClassicLawBwCss(),
      'green-sidebar-customer-service': baseCss + this.getGreenSidebarCustomerServiceCss()
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
        page-break-inside: auto;
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
        margin-bottom: 32px;
        page-break-inside: avoid;
        break-inside: avoid;
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
        orphans: 3;
        widows: 3;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .navy-column-modern .employment-history-role {
        font-weight: bold;
        font-size: 1.07rem;
        color: #193461;
        margin-bottom: 2px;
        page-break-after: avoid;
        break-after: avoid;
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
        orphans: 3;
        widows: 3;
      }

      .navy-column-modern .education-degree {
        font-weight: 700;
        font-size: 1.05rem;
        color: #22396e;
        page-break-after: avoid;
        break-after: avoid;
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
          max-width: none;
          width: 100%;
          min-height: auto;
          page-break-inside: avoid;
        }
        
        .navy-column-modern .sidebar {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-inside: avoid;
        }
        
        .navy-column-modern .content {
          page-break-inside: auto;
          min-height: auto;
        }
        
        /* Prevent page breaks inside important sections */
        .navy-column-modern .sidebar-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .navy-column-modern .employment-section,
        .navy-column-modern .education-section,
        .navy-column-modern .profile-section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 15px;
        }
        
        /* Allow page breaks between major sections */
        .navy-column-modern .content h2 {
          page-break-before: auto;
          page-break-after: avoid;
          break-before: auto;
          break-after: avoid;
        }
        
        /* Prevent orphaned lines */
        .navy-column-modern .employment-history-list,
        .navy-column-modern .profile-summary {
          orphans: 3;
          widows: 3;
        }
        
        /* Ensure proper spacing for print */
        .navy-column-modern .employment-history-role,
        .navy-column-modern .education-degree {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Force exact color printing */
        .navy-column-modern * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
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
  private getStartupFounderCss(): string {
    return `
      /* ===== STARTUP FOUNDER TEMPLATE ===== */
      .startup-founder .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        background: #fff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        display: flex;
        flex-direction: column;
      }
      
      /* Header section with bold design */
      .startup-founder .header {
        background: var(--template-color, #2563eb);
        color: white;
        padding: 3rem 2rem;
        text-align: center;
        position: relative;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0;
      }
      
      .startup-founder .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--template-color, #2563eb) 0%, rgba(37, 99, 235, 0.8) 100%);
        z-index: 1;
      }
      
      .startup-founder .header > * {
        position: relative;
        z-index: 2;
      }
      
      .startup-founder .name {
        font-size: 2.5rem;
        font-weight: 800;
        color: white;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .startup-founder .title {
        font-size: 1.3rem;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
        margin-bottom: 1.5rem;
        font-style: italic;
      }
      
      .startup-founder .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 1rem;
      }
      
      .startup-founder .contact-item {
        padding: 0.25rem;
        font-weight: 500;
      }
      
      .startup-founder .contact-item a {
        color: rgba(255, 255, 255, 0.95);
        text-decoration: none;
      }
      
      /* Main content area */
      .startup-founder .section {
        padding: 2rem;
        margin-bottom: 1rem;
        border-left: 4px solid var(--template-color, #2563eb);
        background: linear-gradient(to right, rgba(37, 99, 235, 0.02) 0%, transparent 100%);
      }
      
      .startup-founder .section-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--template-color, #2563eb);
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        padding-bottom: 0.5rem;
      }
      
      .startup-founder .section-title::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: var(--template-color, #2563eb);
      }
      
      /* Vision Statement / Summary */
      .startup-founder .summary {
        font-size: 1.1rem;
        line-height: 1.7;
        color: #374151;
        font-weight: 500;
        font-style: italic;
        padding: 1rem;
        background: rgba(37, 99, 235, 0.05);
        border-radius: 8px;
        border-left: 4px solid var(--template-color, #2563eb);
      }
      
      /* Experience items */
      .startup-founder .experience-item,
      .startup-founder .education-item {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-left: 4px solid var(--template-color, #2563eb);
      }
      
      .startup-founder .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .startup-founder .item-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      
      .startup-founder .item-company {
        font-size: 1rem;
        font-weight: 600;
        color: var(--template-color, #2563eb);
      }
      
      .startup-founder .item-meta {
        font-size: 0.9rem;
        color: #6b7280;
        text-align: right;
        font-weight: 500;
        line-height: 1.4;
      }
      
      .startup-founder .item-description {
        font-size: 1rem;
        line-height: 1.6;
        color: #374151;
      }
      
      /* Projects grid */
      .startup-founder .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .startup-founder .project-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-top: 4px solid var(--template-color, #2563eb);
        transition: transform 0.2s ease;
      }
      
      .startup-founder .project-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }
      
      .startup-founder .project-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      .startup-founder .project-tech {
        font-size: 0.85rem;
        color: var(--template-color, #2563eb);
        font-weight: 600;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .startup-founder .project-description {
        font-size: 0.95rem;
        line-height: 1.5;
        color: #374151;
      }
      
      /* Skills section */
      .startup-founder .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      
      .startup-founder .skill-tag {
        background: var(--template-color, #2563eb);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Print styles */
      @media print {
        .startup-founder .container {
          margin: 0;
          max-width: none;
        }
        .startup-founder .section,
        .startup-founder .experience-item,
        .startup-founder .education-item,
        .startup-founder .project-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .startup-founder .section {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .startup-founder .experience-item,
        .startup-founder .education-item,
        .startup-founder .project-card {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .startup-founder .header {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        /* Ensure colors print correctly */
        .startup-founder .header,
        .startup-founder .skill-tag {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .startup-founder .header {
          padding: 2rem 1rem;
        }
        
        .startup-founder .name {
          font-size: 2rem;
        }
        
        .startup-founder .section {
          padding: 1.5rem;
        }
        
        .startup-founder .item-header {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .startup-founder .item-meta {
          text-align: left;
        }
        
        .startup-founder .projects-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
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
    console.log(`Applying template styles for ${templateId} with color ${color}`);
    document.documentElement.style.setProperty('--template-color', color, 'important');
    document.documentElement.style.setProperty('--template-color-rgb', this.hexToRgb(color), 'important');
    this.ensureTemplateClass(templateId);
    this.cleanupOverrideStyles();
    
    // Verify the styles were applied
    const appliedColor = getComputedStyle(document.documentElement).getPropertyValue('--template-color');
    console.log(`Template color applied: ${appliedColor}, Body classes: ${document.body.className}`);
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

    // Convert hex color to RGB for CSS variables
    const colorRgb = this.hexToRgb(color);
    
    // Minimal CSS for color variables
    const css = `
      :root {
        --template-color: ${color};
        --template-color-rgb: ${colorRgb};
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
    const css = this.templateCssMap[templateId] || '';
    console.log(`Getting CSS for template ${templateId}:`, css ? 'Found' : 'Not found');
    if (css && templateId === 'creative-designer') {
      console.log('Creative Designer CSS preview:', css.substring(0, 500) + '...');
    }
    return css;
  }

  /**
   * Public method to get template CSS for PDF export
   */
  public getTemplateCSS(templateId: string): string {
    return this.getFrontendCSS(templateId);
  }

  /**
   * Get Creative Designer template CSS
   */
  private getCreativeDesignerCss(): string {
    return `
      /* ===== CREATIVE DESIGNER TEMPLATE ===== */
      .creative-designer * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .creative-designer body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.5;
        color: #2d3748;
        background: #fff;
      }
      
      .creative-designer .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .creative-designer .sidebar {
        background: linear-gradient(135deg, var(--template-color, #7c3aed), #a855f7);
        color: white;
        padding: 2rem;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .creative-designer .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .creative-designer .profile-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .creative-designer .profile-image {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        object-fit: cover;
      }
      
      .creative-designer .name {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: white;
      }
      
      .creative-designer .title {
        font-size: 1.1rem;
        opacity: 0.9;
        margin-bottom: 1.5rem;
        color: white;
      }
      
      .creative-designer .contact-item {
        margin-bottom: 0.8rem;
        font-size: 0.9rem;
        color: white;
      }
      
      .creative-designer .sidebar-section {
        margin-bottom: 2rem;
      }
      
      .creative-designer .sidebar-title {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: white;
      }
      
      .creative-designer .skill-item {
        background: rgba(255,255,255,0.2);
        padding: 0.4rem 0.8rem;
        margin: 0.3rem 0;
        border-radius: 20px;
        display: inline-block;
        font-size: 0.85rem;
        margin-right: 0.5rem;
        color: white;
      }
      
      .creative-designer .section {
        margin-bottom: 2.5rem;
      }
      
      .creative-designer .section-title {
        font-size: 1.8rem;
        color: var(--template-color, #7c3aed);
        margin-bottom: 0.5rem;
        position: relative;
        font-weight: bold;
      }
      
      .creative-designer .section-underline {
        width: 50px;
        height: 3px;
        background: var(--template-color, #7c3aed);
        margin-bottom: 1.5rem;
      }
      
      .creative-designer .summary-text {
        font-size: 1rem;
        line-height: 1.7;
        color: #2d3748;
        text-align: justify;
      }
      
      .creative-designer .experience-item,
      .creative-designer .education-item,
      .creative-designer .project-item {
        margin-bottom: 2rem;
        position: relative;
        padding-left: 2rem;
      }
      
      .creative-designer .experience-item:before,
      .creative-designer .education-item:before,
      .creative-designer .project-item:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.3rem;
        width: 10px;
        height: 10px;
        background: var(--template-color, #7c3aed);
        border-radius: 50%;
      }
      
      .creative-designer .item-header {
        margin-bottom: 0.8rem;
      }
      
      .creative-designer .item-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: #2d3748;
        margin-bottom: 0.3rem;
      }
      
      .creative-designer .item-subtitle {
        font-weight: 600;
        color: var(--template-color, #7c3aed);
        margin-bottom: 0.3rem;
      }
      
      .creative-designer .item-meta {
        color: #666;
        font-style: italic;
        font-size: 0.9rem;
      }
      
      .creative-designer .item-description {
        line-height: 1.6;
        color: #2d3748;
        margin-top: 0.5rem;
      }
      
      .creative-designer .item-description ul {
        margin-left: 1.5rem;
        margin-top: 0.5rem;
      }
      
      .creative-designer .item-description li {
        margin-bottom: 0.3rem;
      }
      
      /* Print optimizations */
      @media print {
        .creative-designer .container {
          box-shadow: none;
          margin: 0;
          max-width: none;
          width: 100%;
        }
        
        .creative-designer .sidebar {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  /**
   * Get Tech Minimalist template CSS
   */
  private getTechMinimalistCss(): string {
    return `
      /* ===== TECH MINIMALIST TEMPLATE ===== */
      
      /* Base styles for terminal theme */
      .tech-minimalist * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .tech-minimalist body {
        font-family: 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
        line-height: 1.6;
        color: #e0e0e0;
        background: #1a1a1a;
      }
      
      .tech-minimalist .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        padding: 2rem;
        background: #1a1a1a;
        color: #e0e0e0;
        font-family: 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.6;
      }
      
      /* Terminal header styling */
      .tech-minimalist .terminal-header {
        background: #2d2d2d;
        padding: 0.8rem 1rem;
        border-radius: 6px 6px 0 0;
        border-left: 4px solid var(--template-color, #00ff41);
        margin-bottom: 0;
        font-weight: bold;
      }
      
      .tech-minimalist .terminal-header .prompt {
        color: var(--template-color, #00ff41);
        font-weight: bold;
      }
      
      /* Terminal content */
      .tech-minimalist .terminal-content {
        background: #2d2d2d;
        padding: 1rem;
        border-radius: 0 0 6px 6px;
        margin-bottom: 2rem;
      }
      
      .tech-minimalist .terminal-line {
        margin-bottom: 0.5rem;
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      
      .tech-minimalist .terminal-line .prompt {
        color: var(--template-color, #00ff41);
        font-weight: bold;
        margin-right: 0.5rem;
        min-width: 80px;
      }
      
      .tech-minimalist .name-display {
        color: #ffffff;
        font-weight: bold;
        font-size: 1.2rem;
      }
      
      .tech-minimalist .title-display {
        color: #ffd700;
        font-weight: 600;
      }
      
      .tech-minimalist .contact-display {
        color: #87ceeb;
      }
      
      /* Section styling */
      .tech-minimalist .section {
        margin-bottom: 2.5rem;
      }
      
      .tech-minimalist .section-header {
        color: var(--template-color, #00ff41);
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--template-color, #00ff41);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      /* Code block styling */
      .tech-minimalist .code-block {
        background: #2d2d2d;
        padding: 1rem;
        border-radius: 6px;
        border-left: 4px solid var(--template-color, #00ff41);
        margin-bottom: 1rem;
        font-family: 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
        line-height: 1.6;
        color: #e0e0e0;
      }
      
      /* Experience items */
      .tech-minimalist .experience-item {
        background: #2d2d2d;
        padding: 1.5rem;
        border-radius: 6px;
        border-left: 4px solid var(--template-color, #00ff41);
        margin-bottom: 1.5rem;
      }
      
      .tech-minimalist .function-signature {
        color: #ff6b6b;
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 1rem;
      }
      
      .tech-minimalist .item-meta {
        margin-bottom: 1rem;
      }
      
      .tech-minimalist .comment {
        color: #6a9955;
        font-style: italic;
      }
      
      .tech-minimalist .experience-item > div:not(.function-signature):not(.item-meta):last-child {
        color: #ff6b6b;
        font-weight: bold;
        margin-top: 1rem;
      }
      
      /* Education items */
      .tech-minimalist .education-item {
        background: #2d2d2d;
        padding: 1rem;
        border-radius: 6px;
        border-left: 4px solid var(--template-color, #00ff41);
        margin-bottom: 1rem;
      }
      
      .tech-minimalist .education-item .item-title {
        color: #ffd700;
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }
      
      .tech-minimalist .education-item .item-meta {
        color: #87ceeb;
        font-size: 0.9rem;
      }
      
      /* Certification items */
      .tech-minimalist .certification-item {
        background: #2d2d2d;
        padding: 1rem;
        border-radius: 6px;
        border-left: 4px solid var(--template-color, #00ff41);
        margin-bottom: 1rem;
      }
      
      .tech-minimalist .certification-item .item-title {
        color: #ffd700;
        font-weight: bold;
        margin-bottom: 0.3rem;
      }
      
      .tech-minimalist .certification-item .item-meta {
        color: #87ceeb;
        font-size: 0.9rem;
      }
      
      /* Code syntax highlighting */
      .tech-minimalist .keyword {
        color: #569cd6;
        font-weight: bold;
      }
      
      .tech-minimalist .variable {
        color: #9cdcfe;
      }
      
      .tech-minimalist .string {
        color: #ce9178;
      }
      
      /* Print optimizations */
      @media print {
        @page {
          size: A4;
          margin: 0.4in;
        }
        
        /* Global print settings */
        html, body {
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Force specific elements to avoid breaking */
        .tech-minimalist .terminal-header,
        .tech-minimalist .terminal-content,
        .tech-minimalist .terminal-line,
        .tech-minimalist .code-block,
        .tech-minimalist .experience-item,
        .tech-minimalist .education-item,
        .tech-minimalist .certification-item,
        .tech-minimalist .section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .tech-minimalist .container {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none;
          margin: 0;
          max-width: none;
          width: 100%;
          padding: 0.3rem;
          page-break-inside: auto;
          break-inside: auto;
        }
        
        .tech-minimalist body {
          background: #ffffff !important;
          color: #000000 !important;
          font-size: 11px;
          line-height: 1.3;
        }
        
        /* Terminal styling for print - Keep header and content together */
        .tech-minimalist .terminal-header {
          background: #f8f8f8 !important;
          color: #000000 !important;
          border-left-color: var(--template-color, #00ff41) !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-bottom: 0 !important;
        }
        
        .tech-minimalist .terminal-content {
          background: #f8f8f8 !important;
          color: #000000 !important;
          border-left-color: var(--template-color, #00ff41) !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: avoid !important;
          break-before: avoid !important;
          margin-top: 0 !important;
        }
        
        /* Keep terminal header + content as one unit */
        .tech-minimalist .terminal-header + .tech-minimalist .terminal-content {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Personal info section - keep everything together */
        .tech-minimalist .container > *:first-child,
        .tech-minimalist .container > *:nth-child(2) {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* First section should not break */
        .tech-minimalist .section:first-of-type {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Ensure minimum content on first page */
        .tech-minimalist .container > *:first-child {
          min-height: 200px;
        }
        
        /* Terminal lines should stay together */
        .tech-minimalist .terminal-line {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: block !important;
        }
        
        /* Prevent any breaking in the first 3 elements */
        .tech-minimalist .container > *:nth-child(-n+3) {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Create a first page wrapper effect */
        .tech-minimalist .container > *:first-child,
        .tech-minimalist .container > *:first-child + *,
        .tech-minimalist .container > *:first-child + * + * {
          display: block !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Reduce spacing to fit more content on first page */
        .tech-minimalist .terminal-header {
          padding: 0.5rem 0.8rem !important;
          margin-bottom: 0 !important;
        }
        
        .tech-minimalist .terminal-content {
          padding: 0.8rem !important;
          margin-bottom: 1rem !important;
        }
        
        .tech-minimalist .section {
          margin-bottom: 1rem !important;
        }
        
        .tech-minimalist .section-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.3rem !important;
          font-size: 0.95rem !important;
        }
        
        .tech-minimalist .code-block {
          background: #f8f8f8 !important;
          color: #000000 !important;
          border-left-color: var(--template-color, #00ff41) !important;
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 0.5rem;
        }
        
        /* Section breaks */
        .tech-minimalist .section {
          page-break-inside: auto;
          break-inside: auto;
          margin-bottom: 1.5rem !important;
          padding-bottom: 0.5rem;
        }
        
        .tech-minimalist .section-header {
          color: var(--template-color, #00ff41) !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-before: auto;
          break-before: auto;
          margin-bottom: 0.8rem !important;
          margin-top: 0.5rem !important;
          font-size: 1rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid var(--template-color, #00ff41) !important;
        }
        
        /* Keep section header with its first content item */
        .tech-minimalist .section-header + .experience-item,
        .tech-minimalist .section-header + .education-item,
        .tech-minimalist .section-header + .code-block {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Experience items */
        .tech-minimalist .experience-item {
          background: #f8f8f8 !important;
          color: #000000 !important;
          border-left-color: var(--template-color, #00ff41) !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: auto;
          break-before: auto;
          margin-bottom: 1.2rem !important;
          padding: 0.8rem;
          min-height: 80px;
          display: block !important;
        }
        
        /* Ensure experience items have proper spacing and don't break */
        .tech-minimalist .experience-item:first-of-type {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Add buffer space around experience items */
        .tech-minimalist .experience-item::before {
          content: '';
          display: block;
          height: 5px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .tech-minimalist .experience-item::after {
          content: '';
          display: block;
          height: 5px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .tech-minimalist .function-signature {
          color: #000000 !important;
          font-weight: bold !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.5rem !important;
          font-size: 0.95rem;
          display: block !important;
        }
        
        /* Keep function signature with its content */
        .tech-minimalist .function-signature + div,
        .tech-minimalist .function-signature + .item-meta {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Education and certification items */
        .tech-minimalist .education-item,
        .tech-minimalist .certification-item {
          background: #f8f8f8 !important;
          color: #000000 !important;
          border-left-color: var(--template-color, #00ff41) !important;
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 0.8rem;
          padding: 0.6rem;
        }
        
        .tech-minimalist .education-item .item-title,
        .tech-minimalist .certification-item .item-title {
          color: #000000 !important;
          font-weight: bold !important;
          page-break-after: avoid;
          break-after: avoid;
          font-size: 0.9rem;
        }
        
        /* Terminal elements */
        .tech-minimalist .terminal-header .prompt,
        .tech-minimalist .terminal-line .prompt {
          color: var(--template-color, #00ff41) !important;
        }
        
        .tech-minimalist .terminal-line {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.3rem !important;
          display: block !important;
        }
        
        /* Ensure terminal content blocks stay together */
        .tech-minimalist .terminal-content {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 1rem !important;
        }
        
        /* Keep related terminal lines together */
        .tech-minimalist .terminal-line + .tech-minimalist .terminal-line {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        .tech-minimalist .name-display {
          color: #000000 !important;
          font-weight: bold !important;
          font-size: 1.1rem;
        }
        
        .tech-minimalist .title-display {
          color: #666666 !important;
          font-size: 0.9rem;
        }
        
        .tech-minimalist .contact-display {
          color: #333333 !important;
          font-size: 0.8rem;
        }
        
        .tech-minimalist .comment {
          color: #666666 !important;
          font-size: 0.8rem;
        }
        
        .tech-minimalist .item-meta {
          color: #666666 !important;
          font-size: 0.8rem;
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Code syntax highlighting for print */
        .tech-minimalist .keyword {
          color: #0066cc !important;
          font-weight: bold;
        }
        
        .tech-minimalist .variable {
          color: #333333 !important;
        }
        
        .tech-minimalist .string {
          color: #008800 !important;
        }
        
        /* Prevent orphans and widows */
        .tech-minimalist p,
        .tech-minimalist div {
          orphans: 2;
          widows: 2;
        }
        
        /* Ensure colors print correctly */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Force page breaks before major sections if needed */
        .tech-minimalist .section:nth-child(n+3) {
          page-break-before: auto;
        }
        
        /* Avoid breaking terminal blocks */
        .tech-minimalist .terminal-header + .tech-minimalist .terminal-content {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Special handling for tech-minimalist template */
        .tech-minimalist {
          font-size: 11px !important;
        }
        
        /* Compact layout for better page fitting */
        .tech-minimalist .container {
          padding: 0.2rem !important;
        }
        
        /* Ensure the entire personal info section stays together */
        .tech-minimalist .container > div:first-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
          min-height: 120px;
          max-height: 250px;
        }
        
        /* Keep first few elements together on first page */
        .tech-minimalist .container > *:nth-child(-n+2) {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Allow natural page breaks after the first major section */
        .tech-minimalist .section:nth-of-type(2) {
          page-break-before: auto;
          break-before: auto;
        }
        
        /* Prevent very short pages */
        .tech-minimalist .section:not(:first-of-type) {
          min-height: 100px;
        }
        
        /* Ensure adequate spacing between major sections */
        .tech-minimalist .section + .section {
          margin-top: 1rem !important;
          padding-top: 0.5rem;
        }
        
        /* --- PDF PAGE BREAK & FIT MORE CONTENT: Reduce font size and spacing for print (REINFORCED) --- */
        @media print {
          .tech-minimalist .container,
          .tech-minimalist .experience-item,
          .tech-minimalist .project-item,
          .tech-minimalist .education-item,
          .tech-minimalist .section-header,
          .tech-minimalist .function-signature,
          .tech-minimalist .item-meta,
          .tech-minimalist .code-block {
            font-size: 10px !important;
            line-height: 1.1 !important;
          }
          .tech-minimalist .container {
            padding: 0.02in !important;
          }
          .tech-minimalist .experience-item,
          .tech-minimalist .project-item,
          .tech-minimalist .education-item {
            padding: 0.1rem !important;
            margin-bottom: 0.1rem !important;
          }
          .tech-minimalist .section-header {
            margin-bottom: 0.1rem !important;
            padding-bottom: 0.05rem !important;
          }
          .tech-minimalist .function-signature {
            margin-bottom: 0.1rem !important;
          }
          .tech-minimalist .item-meta {
            margin-bottom: 0.05rem !important;
          }
          .tech-minimalist .code-block {
            padding: 0.1rem !important;
            margin-bottom: 0.1rem !important;
          }
        }
    `;
  }

  /**
   * Get Academic Scholar template CSS
   */
  private getAcademicScholarCss(): string {
    return `
      /* ===== ACADEMIC SCHOLAR TEMPLATE ===== */
      .academic-scholar .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        background: #fff;
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        display: flex;
        flex-direction: column;
      }
      
      /* Top color bar header */
      .academic-scholar .header {
        background: var(--template-color, #2c5aa0);
        color: white;
        padding: 2rem;
        text-align: center;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0;
      }
      
      .academic-scholar .name {
        font-size: 2.2rem;
        font-weight: bold;
        color: white;
        margin-bottom: 0.5rem;
        font-family: 'Times New Roman', serif;
      }
      
      .academic-scholar .title {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.9);
        font-style: italic;
        margin-bottom: 0.5rem;
      }
      
      .academic-scholar .contact-info {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 1rem;
      }
      
      .academic-scholar .contact-info a {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
      }
      
      /* Main content area */
      .academic-scholar .content {
        padding: 2rem;
        flex: 1;
        background: #fff;
      }
      
      .academic-scholar .section {
        margin-bottom: 2rem;
      }
      
      .academic-scholar .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #2c5aa0);
        margin-bottom: 1rem;
        text-transform: uppercase;
        border-bottom: 2px solid var(--template-color, #2c5aa0);
        padding-bottom: 0.25rem;
        letter-spacing: 0.5px;
      }
      
      .academic-scholar .section-content {
        font-size: 1rem;
        line-height: 1.6;
        color: #333;
      }
      
      .academic-scholar .experience-item,
      .academic-scholar .education-item {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
      }
      
      .academic-scholar .experience-item:last-child,
      .academic-scholar .education-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      
      .academic-scholar .item-title {
        font-size: 1.1rem;
        font-weight: bold;
        color: #333;
        margin-bottom: 0.3rem;
      }
      
      .academic-scholar .item-subtitle {
        font-size: 1rem;
        color: var(--template-color, #2c5aa0);
        font-weight: 600;
        margin-bottom: 0.3rem;
      }
      
      .academic-scholar .item-meta {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
        margin-bottom: 0.5rem;
      }
      
      .academic-scholar .item-description {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #444;
      }
      
      .academic-scholar .item-description ul {
        margin-left: 1.5rem;
        margin-top: 0.5rem;
      }
      
      .academic-scholar .item-description li {
        margin-bottom: 0.3rem;
      }
      
      /* Skills section */
      .academic-scholar .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      
      .academic-scholar .skill-item {
        background: var(--template-color, #2c5aa0);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Print optimizations */
      @media print {
        .academic-scholar .container {
          margin: 0;
          max-width: none;
          width: 100%;
        }
        
        .academic-scholar .header {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .academic-scholar .skill-item {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  /**
   * Get Fresh Graduate template CSS
   */
  private getFreshGraduateCss(): string {
    return `
      /* ===== FRESH GRADUATE TEMPLATE ===== */
      .fresh-graduate .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        background: #fff;
        display: flex;
        flex-direction: column;
      }
      
      .fresh-graduate .header {
        background: linear-gradient(135deg, var(--template-color, #2196F3), #64b5f6);
        color: white;
        padding: 2rem;
        text-align: center;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .fresh-graduate .name {
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
      
      .fresh-graduate .title {
        font-size: 1.2rem;
        opacity: 0.9;
      }
      
      .fresh-graduate .content {
        padding: 2rem;
        flex: 1;
      }
      
      .fresh-graduate .section {
        margin-bottom: 2rem;
      }
      
      .fresh-graduate .section-title {
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--template-color, #2196F3);
        margin-bottom: 1rem;
        position: relative;
      }
      
      .fresh-graduate .section-title::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 50px;
        height: 3px;
        background: var(--template-color, #2196F3);
      }
    `;
  }

  /**
   * Get Grey Classic Profile template CSS
   */
  private getGreyClassicProfileCss(): string {
    return `
      /* ===== GREY CLASSIC PROFILE TEMPLATE ===== */
      .grey-classic-profile .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .grey-classic-profile .sidebar {
        background: #f8f9fa;
        padding: 2rem;
        border-right: 1px solid #e9ecef;
      }
      
      .grey-classic-profile .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .grey-classic-profile .profile-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .grey-classic-profile .section {
        margin-bottom: 2rem;
      }
      
      .grey-classic-profile .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #666);
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    `;
  }

  /**
   * Get Blue Sidebar Profile template CSS
   */
  private getBlueSidebarProfileCss(): string {
    return `
      /* ===== BLUE SIDEBAR PROFILE TEMPLATE ===== */
      .blue-sidebar-profile .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .blue-sidebar-profile .sidebar {
        background: var(--template-color, #2196F3);
        color: white;
        padding: 2rem;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .blue-sidebar-profile .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .blue-sidebar-profile .profile-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .blue-sidebar-profile .section {
        margin-bottom: 2rem;
      }
      
      .blue-sidebar-profile .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #2196F3);
        margin-bottom: 1rem;
        border-bottom: 2px solid var(--template-color, #2196F3);
        padding-bottom: 0.5rem;
      }
    `;
  }

  /**
   * Get Green Sidebar Receptionist template CSS
   */
  private getGreenSidebarReceptionistCss(): string {
    return `
      /* ===== GREEN SIDEBAR RECEPTIONIST TEMPLATE ===== */
      .green-sidebar-receptionist .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .green-sidebar-receptionist .sidebar {
        background: var(--template-color, #18bc6b);
        color: white;
        padding: 2rem;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .green-sidebar-receptionist .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .green-sidebar-receptionist .profile-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .green-sidebar-receptionist .section {
        margin-bottom: 2rem;
      }
      
      .green-sidebar-receptionist .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #18bc6b);
        margin-bottom: 1rem;
        border-bottom: 2px solid var(--template-color, #18bc6b);
        padding-bottom: 0.5rem;
      }
    `;
  }

  /**
   * Get Classic Profile Orange template CSS
   */
  private getClassicProfileOrangeCss(): string {
    return `
      /* ===== CLASSIC PROFILE ORANGE TEMPLATE ===== */
      .classic-profile-orange .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .classic-profile-orange .sidebar {
        background: #f8f9fa;
        padding: 2rem;
        border-right: 1px solid #e9ecef;
      }
      
      .classic-profile-orange .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .classic-profile-orange .name {
        color: var(--template-color, #ff9800);
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 1rem;
      }
      
      .classic-profile-orange .section {
        margin-bottom: 2rem;
      }
      
      .classic-profile-orange .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #ff9800);
        margin-bottom: 1rem;
        border-bottom: 2px solid var(--template-color, #ff9800);
        padding-bottom: 0.5rem;
      }
    `;
  }

  /**
   * Get Classic Law BW template CSS
   */
  private getClassicLawBwCss(): string {
    return `
      /* ===== CLASSIC LAW BW TEMPLATE ===== */
      .classic-law-bw .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        padding: 2rem;
        background: #fff;
        font-family: 'Times New Roman', serif;
      }
      
      .classic-law-bw .header {
        text-align: center;
        border-bottom: 3px solid var(--template-color, #000);
        padding-bottom: 1rem;
        margin-bottom: 2rem;
      }
      
      .classic-law-bw .name {
        font-size: 2.2rem;
        font-weight: bold;
        color: var(--template-color, #000);
        margin-bottom: 0.5rem;
      }
      
      .classic-law-bw .section {
        margin-bottom: 2rem;
      }
      
      .classic-law-bw .section-title {
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--template-color, #000);
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        border-bottom: 1px solid var(--template-color, #000);
        padding-bottom: 0.25rem;
      }
    `;
  }

  /**
   * Get Green Sidebar Customer Service template CSS
   */
  private getGreenSidebarCustomerServiceCss(): string {
    return `
      /* ===== GREEN SIDEBAR CUSTOMER SERVICE TEMPLATE ===== */
      .green-sidebar-customer-service .container {
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0;
        background: #fff;
      }
      
      .green-sidebar-customer-service .sidebar {
        background: var(--template-color, #18bc6b);
        color: white;
        padding: 2rem;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .green-sidebar-customer-service .main-content {
        padding: 2rem;
        background: #fff;
      }
      
      .green-sidebar-customer-service .profile-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .green-sidebar-customer-service .section {
        margin-bottom: 2rem;
      }
      
      .green-sidebar-customer-service .section-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--template-color, #18bc6b);
        margin-bottom: 1rem;
        border-bottom: 2px solid var(--template-color, #18bc6b);
        padding-bottom: 0.5rem;
      }
    `;
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

  /**
   * Helper function to convert hex color to RGB format
   * @param hex - Hex color string (with or without #)
   * @returns RGB values as comma-separated string (e.g., "255,0,0")
   */
  public hexToRgb(hex: string): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(',');
  }
}

export const frontendTemplateService = FrontendTemplateService.getInstance();