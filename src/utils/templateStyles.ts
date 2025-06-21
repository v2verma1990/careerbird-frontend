/**
 * Template Style Management Utility
 * Centralized management of template styles with dynamic color support
 */

export interface TemplateStyleConfig {
  templateName: string;
  color: string;
}

/**
 * Apply template-specific styles to a document
 * This replaces the backend CSS injection approach
 */
export const applyTemplateStyles = (
  document: Document,
  config: TemplateStyleConfig
): void => {
  // Remove any existing template styles
  const existingStyles = document.querySelectorAll('style[data-template-styles]');
  existingStyles.forEach(style => style.remove());

  // Create new style element
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-template-styles', config.templateName);
  
  // Set CSS custom property for dynamic color
  const cssContent = `
    :root {
      --template-color: ${config.color};
    }
    
    /* Ensure template class is applied */
    body:not(.${config.templateName}) {
      /* Add template class if missing */
    }
    
    /* Print color preservation */
    @media print {
      .${config.templateName} .sidebar,
      .${config.templateName} [style*="background: var(--template-color)"],
      .${config.templateName} [style*="background-color: var(--template-color)"] {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
  
  styleElement.textContent = cssContent;
  document.head.appendChild(styleElement);
  
  // Ensure body has the correct template class
  if (!document.body.classList.contains(config.templateName)) {
    document.body.classList.add(config.templateName);
  }
};

/**
 * Get the current template configuration from the document
 */
export const getCurrentTemplateConfig = (document: Document): TemplateStyleConfig | null => {
  const body = document.body;
  const templateClasses = ['navy-column-modern']; // Add more templates here
  
  for (const templateClass of templateClasses) {
    if (body.classList.contains(templateClass)) {
      // Try to get color from CSS custom property
      const computedStyle = getComputedStyle(document.documentElement);
      const color = computedStyle.getPropertyValue('--template-color').trim() || '#315389';
      
      return {
        templateName: templateClass,
        color: color
      };
    }
  }
  
  return null;
};

/**
 * Ensure template styles are loaded and applied
 * This should be called when rendering templates
 */
export const ensureTemplateStyles = (
  document: Document,
  templateName: string,
  color: string
): void => {
  const config: TemplateStyleConfig = {
    templateName,
    color
  };
  
  applyTemplateStyles(document, config);
};

/**
 * List of supported templates
 */
export const SUPPORTED_TEMPLATES = [
  'navy-column-modern'
  // Add more templates here as they are created
] as const;

export type SupportedTemplate = typeof SUPPORTED_TEMPLATES[number];

/**
 * Validate if a template name is supported
 */
export const isValidTemplate = (templateName: string): templateName is SupportedTemplate => {
  return SUPPORTED_TEMPLATES.includes(templateName as SupportedTemplate);
};