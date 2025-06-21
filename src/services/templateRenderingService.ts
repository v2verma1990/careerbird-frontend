/**
 * Centralized Template Rendering Service
 * Single source of truth for all template rendering operations
 * Ensures preview and PDF generation use identical rendering logic
 * 
 * ARCHITECTURE:
 * 1. Backend stores HTML templates in /html/ folder
 * 2. Backend generates CSS dynamically with color injection
 * 3. This service ensures SAME rendering for preview and PDF
 * 4. Color changes clear ALL caches to force fresh rendering
 * 5. No color persistence after operations complete
 */

import { api } from "@/utils/apiClient";
import { resumeBuilderApi } from "@/utils/resumeBuilderApi";

export interface TemplateRenderOptions {
  templateId: string;
  resumeData: any;
  color: string;
  forceRefresh?: boolean; // Force fresh fetch, ignore cache
}

export interface RenderedTemplate {
  html: string;
  css: string;
  fullHtml: string; // Complete HTML document with embedded CSS
  templateId: string;
  color: string;
  timestamp: number;
}

class TemplateRenderingService {
  private static instance: TemplateRenderingService;
  private renderCache = new Map<string, RenderedTemplate>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes only
  
  // Track active renders to prevent duplicate requests
  private activeRenders = new Map<string, Promise<RenderedTemplate>>();

  private constructor() {}

  public static getInstance(): TemplateRenderingService {
    if (!TemplateRenderingService.instance) {
      TemplateRenderingService.instance = new TemplateRenderingService();
    }
    return TemplateRenderingService.instance;
  }

  /**
   * Clear all caches - call this when color changes to force fresh rendering
   * This ensures preview and PDF use the SAME fresh data
   */
  public clearAllCaches(): void {
    console.log('TemplateRenderingService: Clearing all caches for fresh rendering');
    
    // Clear render cache
    this.renderCache.clear();
    
    // Clear active renders to allow new requests
    this.activeRenders.clear();
    
    // Clear browser-level caches
    this.clearBrowserCaches();
    
    // Clear DOM styles
    this.clearDOMStyles();
    
    // Clear inline styles that might persist (especially important for sidebar colors)
    this.clearInlineStyles();
    
    // AGGRESSIVE: Force clear all sidebar colors from DOM
    this.forceClearSidebarColors();
    
    // TARGETED: Clear only template-related CSS custom properties
    this.clearTemplateCustomProperties();
    
    console.log('TemplateRenderingService: All caches and styles cleared');
  }

  /**
   * Clear cache for specific template and color combination
   */
  public clearCacheForTemplate(templateId: string, color: string): void {
    const cacheKey = this.getCacheKey(templateId, color);
    console.log('TemplateRenderingService: Clearing cache for:', cacheKey);
    
    this.renderCache.delete(cacheKey);
    this.activeRenders.delete(cacheKey);
    this.clearDOMStyles();
    this.clearInlineStyles();
  }

  /**
   * Clear browser-level caches
   */
  private clearBrowserCaches(): void {
    // Clear localStorage template-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('template') || key.includes('resume') || key.includes('color'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage template-related data
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('template') || key.includes('resume') || key.includes('color'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Clear template styles from DOM
   */
  private clearDOMStyles(): void {
    // Remove all template-related style elements
    const styleElements = document.querySelectorAll('style[data-template-styles], style[data-template-id]');
    styleElements.forEach(element => element.remove());
  }

  /**
   * Generate cache key for template
   */
  private getCacheKey(templateId: string, color: string): string {
    return `${templateId}_${color}`;
  }

  /**
   * Check if cached template is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Fetch template CSS with color from backend using API client
   */
  private async fetchTemplateCss(templateId: string, color: string): Promise<string> {
    console.log('TemplateRenderingService: Fetching CSS for template:', templateId, 'color:', color);
    
    const { data, error } = await api.template.getCss(templateId, color);
    
    if (error) {
      throw new Error(`Failed to fetch template CSS: ${error}`);
    }
    
    if (!data) {
      throw new Error('No CSS data received from API');
    }
    
    console.log('TemplateRenderingService: Fetched CSS length:', data.length);
    console.log('TemplateRenderingService: CSS preview (first 500 chars):', data.substring(0, 500));
    
    // Verify CSS contains the requested color
    if (!data.includes(color)) {
      console.warn('TemplateRenderingService: CSS does not contain requested color:', color);
    } else {
      console.log('TemplateRenderingService: CSS contains requested color:', color);
    }
    
    return data;
  }

  /**
   * Fetch template HTML from backend using API client
   */
  private async fetchTemplateHtml(templateId: string): Promise<string> {
    console.log('TemplateRenderingService: Fetching HTML for template:', templateId);
    
    const { data, error } = await api.template.getHtml(templateId);
    
    if (error) {
      throw new Error(`Failed to fetch template HTML: ${error}`);
    }
    
    if (!data) {
      throw new Error('No HTML data received from API');
    }
    
    console.log('TemplateRenderingService: Fetched HTML length:', data.length);
    
    return data;
  }

  /**
   * Render complete resume with template and data
   * This is the SINGLE SOURCE OF TRUTH for both preview and PDF
   * NO CACHING - Always fresh renders to prevent color persistence
   */
  public async renderResume(options: TemplateRenderOptions): Promise<RenderedTemplate> {
    const { templateId, resumeData, color, forceRefresh = true } = options;
    
    const cacheKey = this.getCacheKey(templateId, color);
    
    console.log('TemplateRenderingService: Rendering resume (NO CACHING):', {
      templateId,
      color,
      forceRefresh: true,
      cacheKey,
      dataKeys: Object.keys(resumeData)
    });

    // ALWAYS FORCE REFRESH - NO CACHING FOR COLORS
    // Clear any existing cache for this template/color combination
    this.renderCache.delete(cacheKey);
    this.activeRenders.delete(cacheKey);

    // Always perform fresh render
    const result = await this.performRender(templateId, resumeData, color);
    
    console.log('TemplateRenderingService: Successfully rendered (fresh, no cache):', cacheKey);
    return result;
  }

  /**
   * Perform the actual rendering using resumeBuilderApi
   */
  private async performRender(templateId: string, resumeData: any, color: string): Promise<RenderedTemplate> {
    try {
      console.log('TemplateRenderingService: Performing fresh render for:', { templateId, color, templateIdType: typeof templateId, templateIdValue: templateId });
      
      // Validate templateId
      if (!templateId || templateId.trim() === '') {
        throw new Error(`Invalid templateId: "${templateId}". TemplateId cannot be null, undefined, or empty.`);
      }
      
      // Prepare resume data with color
      const resumeDataWithColor = {
        ...resumeData,
        Color: color,
        color: color
      };

      console.log('TemplateRenderingService: About to call buildResumeForTemplate with:', {
        templateId: templateId,
        color: color,
        resumeDataKeys: Object.keys(resumeDataWithColor)
      });

      // Use a custom API call that matches the original format expected by the template rendering endpoint
      const { data: result, error } = await api.resumeBuilder.buildResumeForTemplate({
        resumeData: JSON.stringify(resumeDataWithColor),
        templateId,
        color
      });

      if (error) {
        throw new Error(`Failed to render resume: ${error}`);
      }

      console.log('TemplateRenderingService: Resume builder response:', result);
      console.log('TemplateRenderingService: Response structure:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasSuccess: result?.success,
        hasData: result?.data,
        hasHtml: result?.data?.html,
        hasDirectHtml: result?.html,
        resultType: typeof result
      });

      // Handle different possible response structures from resumeBuilderApi
      let html: string;
      
      if (result?.success && result.data?.html) {
        // Structure: { success: true, data: { html: "..." } }
        console.log('TemplateRenderingService: Using success/data/html structure');
        html = result.data.html;
      } else if (result?.html) {
        // Structure: { html: "...", data: {} } (from resumeBuilderApi when response is not JSON)
        console.log('TemplateRenderingService: Using direct html structure');
        html = result.html;
      } else if (typeof result === 'string') {
        // Direct HTML string
        console.log('TemplateRenderingService: Using direct string result');
        html = result;
      } else if (result?.data && typeof result.data === 'string') {
        // Sometimes the HTML might be in result.data as a string
        console.log('TemplateRenderingService: Using result.data as string');
        html = result.data;
      } else {
        console.error('TemplateRenderingService: Unexpected response structure:', result);
        console.error('TemplateRenderingService: Full result object:', JSON.stringify(result, null, 2));
        throw new Error('Invalid response from resume builder - no HTML content found');
      }
      
      // Get CSS with color (fresh fetch using API client)
      const css = await this.fetchTemplateCss(templateId, color);
      
      // Create complete HTML document
      const fullHtml = this.createCompleteHtmlDocument(html, css, resumeData);
      
      // Log HTML structure for debugging
      console.log('TemplateRenderingService: HTML preview (first 500 chars):', html.substring(0, 500));
      console.log('TemplateRenderingService: HTML contains sidebar class:', html.includes('sidebar'));
      console.log('TemplateRenderingService: HTML contains class with sidebar:', /class="[^"]*sidebar[^"]*"/.test(html));
      
      return {
        html,
        css,
        fullHtml,
        templateId,
        color,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('TemplateRenderingService: Failed to perform render:', error);
      throw error;
    }
  }

  /**
   * Create complete HTML document with embedded styles
   */
  private createCompleteHtmlDocument(html: string, css: string, resumeData: any): string {
    const candidateName = resumeData?.PersonalInfo?.Name ||
      resumeData?.personalInfo?.name ||
      resumeData?.name ||
      resumeData?.Name ||
      'Resume';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${candidateName} - Resume</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f6fa;
      padding: 0.5in;
    }
    
    /* Template-specific styles */
    ${css}
    
    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  /**
   * Apply styles to DOM for preview - Uses frontend CSS with dynamic color
   */
  public applyStylesToDOM(css: string, templateId: string, color?: string): void {
    console.log('TemplateRenderingService: Applying frontend styles for:', templateId, 'color:', color);
    
    // STEP 1: Remove ALL existing template styles
    this.clearDOMStyles();
    
    // STEP 2: Clear any inline styles that might interfere with color changes
    this.clearInlineStyles();
    
    // STEP 3: Apply the CSS custom property for dynamic color
    if (color) {
      // Remove existing color style
      const existingColorStyle = document.querySelector('style[data-template-color]');
      if (existingColorStyle) {
        existingColorStyle.remove();
      }
      
      // Create new color style
      const colorStyleElement = document.createElement('style');
      colorStyleElement.setAttribute('data-template-color', 'true');
      colorStyleElement.textContent = `
        :root {
          --template-color: ${color} !important;
        }
      `;
      document.head.appendChild(colorStyleElement);
      
      console.log('TemplateRenderingService: Applied CSS custom property --template-color:', color);
    }
    
    // STEP 4: Ensure body has the correct template class
    if (!document.body.classList.contains(templateId)) {
      // Remove other template classes first
      document.body.classList.remove('navy-column-modern'); // Add other templates here as needed
      document.body.classList.add(templateId);
      console.log('TemplateRenderingService: Added template class to body:', templateId);
    }
    
    console.log('TemplateRenderingService: Successfully applied frontend styles');
    
    // STEP 5: Force immediate color application to sidebar elements
    if (color) {
      setTimeout(() => {
        const sidebarElements = document.querySelectorAll('.sidebar, [class*="sidebar"]');
        console.log('TemplateRenderingService: Found sidebar elements:', sidebarElements.length);
        
        sidebarElements.forEach((el, index) => {
          const element = el as HTMLElement;
          // Force the color with !important
          element.style.setProperty('background-color', color, 'important');
          element.style.setProperty('background', color, 'important');
          
          const computedStyle = window.getComputedStyle(element);
          console.log(`TemplateRenderingService: Sidebar ${index + 1} background:`, computedStyle.backgroundColor);
          console.log(`TemplateRenderingService: Sidebar ${index + 1} classes:`, element.className);
        });
      }, 100);
    }
  }

  /**
   * Clear inline styles that might interfere with color changes
   */
  private clearInlineStyles(): void {
    console.log('TemplateRenderingService: Clearing inline styles that might interfere with colors');
    
    // Find all elements with inline styles in resume preview
    const resumeContainer = document.querySelector('#resume-preview-container, .resume-preview-container, .resume-container');
    
    if (resumeContainer) {
      // Find all elements with inline background or color styles within the resume container
      const elementsWithInlineStyles = resumeContainer.querySelectorAll('[style*="background"], [style*="color"]');
      
      elementsWithInlineStyles.forEach((element: HTMLElement) => {
        console.log('TemplateRenderingService: Clearing inline styles from element:', element.className || element.tagName);
        
        // Remove background-related inline styles
        element.style.removeProperty('background');
        element.style.removeProperty('background-color');
        element.style.removeProperty('background-image');
        
        // Remove color-related inline styles
        element.style.removeProperty('color');
        
        // Remove print-specific properties that might persist
        element.style.removeProperty('-webkit-print-color-adjust');
        element.style.removeProperty('color-adjust');
        element.style.removeProperty('print-color-adjust');
        
        // If no more inline styles, remove the style attribute entirely
        if (!element.style.cssText.trim()) {
          element.removeAttribute('style');
        }
      });
      
      // Also specifically target sidebar elements that might have persistent inline styles
      const sidebarElements = resumeContainer.querySelectorAll('.sidebar, [class*="sidebar"]');
      sidebarElements.forEach((element: HTMLElement) => {
        console.log('TemplateRenderingService: Clearing sidebar inline styles from:', element.className || element.tagName);
        
        // Remove all background and color inline styles from sidebars
        element.style.removeProperty('background');
        element.style.removeProperty('background-color');
        element.style.removeProperty('background-image');
        element.style.removeProperty('color');
        element.style.removeProperty('-webkit-print-color-adjust');
        element.style.removeProperty('color-adjust');
        element.style.removeProperty('print-color-adjust');
        
        // If no more inline styles, remove the style attribute entirely
        if (!element.style.cssText.trim()) {
          element.removeAttribute('style');
        }
      });
    }
  }

  /**
   * Force clear all sidebar colors from DOM - specifically for fixing color persistence issues
   */
  public forceClearSidebarColors(): void {
    console.log('TemplateRenderingService: Force clearing all sidebar colors from DOM');
    
    // Find all possible sidebar elements with various selectors
    const sidebarSelectors = [
      '.sidebar',
      '[class*="sidebar"]',
      '.resume-sidebar',
      '[class*="resume-sidebar"]',
      '.left-column',
      '[class*="left-column"]',
      '.side-panel',
      '[class*="side-panel"]'
    ];
    
    sidebarSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element: HTMLElement) => {
        console.log(`TemplateRenderingService: Force clearing colors from ${selector}:`, element.className || element.tagName);
        
        // Remove all possible background and color properties
        const propertiesToClear = [
          'background',
          'background-color',
          'background-image',
          'background-gradient',
          'color',
          'border-color',
          '-webkit-print-color-adjust',
          'color-adjust',
          'print-color-adjust'
        ];
        
        propertiesToClear.forEach(prop => {
          element.style.removeProperty(prop);
        });
        
        // If no more inline styles, remove the style attribute entirely
        if (!element.style.cssText.trim()) {
          element.removeAttribute('style');
        }
      });
    });
    
    console.log('TemplateRenderingService: Completed force clearing sidebar colors');
  }

  /**
   * Clear CSS custom properties that might persist across renders
   */
  private clearCSSCustomProperties(): void {
    console.log('TemplateRenderingService: Clearing CSS custom properties');
    
    // Clear CSS custom properties from document root
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Get all CSS custom properties and clear template/color related ones
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (property.startsWith('--') && 
          (property.includes('color') || 
           property.includes('template') || 
           property.includes('sidebar') ||
           property.includes('background'))) {
        console.log('TemplateRenderingService: Clearing CSS custom property:', property);
        root.style.removeProperty(property);
      }
    }
    
    // Also clear from body element
    const body = document.body;
    if (body) {
      const bodyStyle = getComputedStyle(body);
      for (let i = 0; i < bodyStyle.length; i++) {
        const property = bodyStyle[i];
        if (property.startsWith('--') && 
            (property.includes('color') || 
             property.includes('template') || 
             property.includes('sidebar') ||
             property.includes('background'))) {
          console.log('TemplateRenderingService: Clearing CSS custom property from body:', property);
          body.style.removeProperty(property);
        }
      }
    }
  }

  /**
   * Clear only template-related CSS custom properties (more targeted)
   */
  private clearTemplateCustomProperties(): void {
    console.log('TemplateRenderingService: Clearing template-specific CSS custom properties');
    
    // Only clear properties that are specifically template-related
    const root = document.documentElement;
    const propertiesToCheck = [
      '--template-color',
      '--template-background',
      '--sidebar-color',
      '--sidebar-background',
      '--resume-color',
      '--resume-background'
    ];
    
    propertiesToCheck.forEach(property => {
      if (root.style.getPropertyValue(property)) {
        console.log('TemplateRenderingService: Clearing template CSS property:', property);
        root.style.removeProperty(property);
      }
    });
    
    // Also check body for template properties
    const body = document.body;
    if (body) {
      propertiesToCheck.forEach(property => {
        if (body.style.getPropertyValue(property)) {
          console.log('TemplateRenderingService: Clearing template CSS property from body:', property);
          body.style.removeProperty(property);
        }
      });
    }
  }

  /**
   * Targeted reset of DOM styles - only removes template-related styles
   */
  private nuclearResetDOMStyles(): void {
    console.log('TemplateRenderingService: Performing TARGETED RESET of template styles only');
    
    // Only remove template-related style elements, preserve page UI styles
    const templateStyles = document.querySelectorAll('head style[data-template-styles], head style[data-template-id]');
    templateStyles.forEach(style => {
      console.log('TemplateRenderingService: Removing template style element');
      style.remove();
    });
    
    // Only remove inline styles from elements INSIDE the resume container
    const resumeContainer = document.querySelector('#resume-preview-container, .resume-preview-container, .resume-container');
    if (resumeContainer) {
      const elementsWithStyles = resumeContainer.querySelectorAll('[style]');
      elementsWithStyles.forEach((element: HTMLElement) => {
        // Only remove color/background related inline styles, keep layout styles
        const style = element.style;
        const propertiesToRemove = [
          'background',
          'background-color',
          'background-image',
          'color',
          'border-color'
        ];
        
        propertiesToRemove.forEach(prop => {
          if (style.getPropertyValue(prop)) {
            console.log(`TemplateRenderingService: Removing ${prop} from element:`, element.tagName);
            style.removeProperty(prop);
          }
        });
        
        // If no styles left, remove the attribute
        if (!style.cssText.trim()) {
          element.removeAttribute('style');
        }
      });
    }
    
    // Only clear template-related CSS custom properties
    this.clearTemplateCustomProperties();
    
    // Force clear sidebar colors one more time
    this.forceClearSidebarColors();
    
    console.log('TemplateRenderingService: Targeted reset completed');
  }

  /**
   * Force apply sidebar color with !important to override any embedded styles
   */
  private forceApplySidebarColor(resumeContainer: Element, color: string): void {
    console.log('TemplateRenderingService: Force applying sidebar color:', color);
    
    // Find all possible sidebar elements (comprehensive list for all templates)
    const sidebarSelectors = [
      '.sidebar',
      '[class*="sidebar"]',
      '.left-column',
      '.right-column', 
      '[class*="column"]',
      '.navy-sidebar',
      '.template-sidebar',
      '[class*="navy"]',
      '.sidebar-section',
      '.sidebar-content',
      '.sidebar-header',
      '.sidebar-skills',
      '.sidebar-education',
      '.sidebar-contact',
      '[class*="sidebar-"]',
      '.resume-sidebar',
      '.template-left',
      '.template-right'
    ];
    
    sidebarSelectors.forEach(selector => {
      const elements = resumeContainer.querySelectorAll(selector);
      elements.forEach((element: HTMLElement) => {
        console.log(`TemplateRenderingService: Force applying color to ${selector}:`, element.className);
        
        // Apply color with !important using inline styles
        element.style.setProperty('background-color', color, 'important');
        element.style.setProperty('background', color, 'important');
        
        // Also apply to pseudo-elements by adding a style tag
        const styleId = `force-sidebar-color-${Date.now()}`;
        let forceStyleTag = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!forceStyleTag) {
          forceStyleTag = document.createElement('style');
          forceStyleTag.id = styleId;
          forceStyleTag.setAttribute('data-template-styles', 'true');
          document.head.appendChild(forceStyleTag);
        }
        
        // Create CSS rules with !important to override everything
        const forceCss = `
          ${selector} {
            background-color: ${color} !important;
            background: ${color} !important;
          }
          ${selector}::before,
          ${selector}::after {
            background-color: ${color} !important;
            background: ${color} !important;
          }
        `;
        
        forceStyleTag.textContent = (forceStyleTag.textContent || '') + forceCss;
      });
    });
    
    console.log('TemplateRenderingService: Completed force sidebar color application');
  }

  /**
   * Replace embedded colors in HTML content with new color
   */
  public replaceEmbeddedColors(html: string, newColor: string): string {
    console.log('TemplateRenderingService: Replacing embedded colors with:', newColor);
    
    // Common color patterns that might be embedded in HTML
    const colorPatterns = [
      /#[0-9a-fA-F]{6}/g,  // Hex colors like #315389
      /#[0-9a-fA-F]{3}/g,   // Short hex colors like #fff
      /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,  // RGB colors
      /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,  // RGBA colors
    ];
    
    let modifiedHtml = html;
    
    // Replace color patterns in style attributes and CSS
    colorPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        console.log('TemplateRenderingService: Found embedded colors:', matches);
        matches.forEach(match => {
          // Only replace if it's in a style context (background-color, background, color properties)
          if (html.includes(`background-color: ${match}`) || 
              html.includes(`background: ${match}`) ||
              html.includes(`color: ${match}`)) {
            console.log('TemplateRenderingService: Replacing embedded color:', match, 'with:', newColor);
            modifiedHtml = modifiedHtml.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newColor);
          }
        });
      }
    });
    
    return modifiedHtml;
  }

  /**
   * Get template CSS only (for preview styling)
   * DEPRECATED: Use renderResume() for complete rendering
   */
  public async getTemplateCss(templateId: string, color: string): Promise<string> {
    console.warn('getTemplateCss is deprecated. Use renderResume() for complete rendering.');
    
    const cacheKey = this.getCacheKey(templateId, color);
    const cached = this.renderCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('TemplateRenderingService: Using cached CSS from render cache:', cacheKey);
      return cached.css;
    }
    
    console.log('TemplateRenderingService: Fetching fresh CSS for:', cacheKey);
    return await this.fetchTemplateCss(templateId, color);
  }

  /**
   * Get rendered template for preview (always fresh - no color caching)
   */
  public async getRenderedTemplateForPreview(templateId: string, resumeData: any, color: string): Promise<RenderedTemplate> {
    return await this.renderResume({
      templateId,
      resumeData,
      color,
      forceRefresh: true // Always fresh - no color caching
    });
  }

  /**
   * Get rendered template for PDF download (force fresh)
   */
  public async getRenderedTemplateForPDF(templateId: string, resumeData: any, color: string): Promise<RenderedTemplate> {
    return await this.renderResume({
      templateId,
      resumeData,
      color,
      forceRefresh: true // Always fresh for PDF to ensure accuracy
    });
  }

  /**
   * Update color and get fresh render (clears cache first)
   */
  public async updateColorAndRender(templateId: string, resumeData: any, newColor: string): Promise<RenderedTemplate> {
    console.log('TemplateRenderingService: Updating color and rendering fresh:', templateId, newColor);
    
    // Clear cache for this template with ALL colors to prevent color persistence
    this.clearAllCachesForTemplate(templateId);
    
    // Render with new color
    return await this.renderResume({
      templateId,
      resumeData,
      color: newColor,
      forceRefresh: true
    });
  }

  /**
   * Clear all caches for a specific template (all colors)
   */
  private clearAllCachesForTemplate(templateId: string): void {
    console.log('TemplateRenderingService: Clearing all caches for template:', templateId);
    
    // Clear render cache for all colors of this template
    const keysToDelete = [];
    for (const [key] of this.renderCache) {
      if (key.startsWith(`${templateId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      console.log('TemplateRenderingService: Clearing render cache key:', key);
      this.renderCache.delete(key);
    });
    
    // Clear active renders for all colors of this template
    const activeKeysToDelete = [];
    for (const [key] of this.activeRenders) {
      if (key.startsWith(`${templateId}_`)) {
        activeKeysToDelete.push(key);
      }
    }
    activeKeysToDelete.forEach(key => {
      console.log('TemplateRenderingService: Clearing active render key:', key);
      this.activeRenders.delete(key);
    });
    
    // Clear DOM styles
    this.clearDOMStyles();
  }

  /**
   * Public method to clean up DOM styles (for component cleanup)
   */
  public cleanup(): void {
    console.log('TemplateRenderingService: Cleaning up DOM styles and inline styles');
    this.clearDOMStyles();
    this.clearInlineStyles();
  }
}

// Export singleton instance
export const templateRenderingService = TemplateRenderingService.getInstance();