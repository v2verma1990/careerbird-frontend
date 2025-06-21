/**
 * Resume Styles Utilities - Backend Integration
 * This file provides utilities to apply backend-generated CSS as the single source of truth
 * All CSS generation is handled by the backend TemplateService
 */

/**
 * Generate a darker shade of the given color for borders
 */
export const getDarkerShade = (color: string): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken by reducing each component by 20%
  const darkerR = Math.max(0, Math.floor(r * 0.8));
  const darkerG = Math.max(0, Math.floor(g * 0.8));
  const darkerB = Math.max(0, Math.floor(b * 0.8));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
};



/**
 * Apply styles to a document (for PDF export)
 * Uses centralized backend template service as SINGLE SOURCE OF TRUTH
 */
export const applyStylesToDocument = async (doc: Document, templateColor: string, templateId: string = 'navy-column-modern'): Promise<void> => {
  // Remove any existing style elements with our identifier
  const existingStyles = doc.querySelectorAll('style[data-resume-styles]');
  existingStyles.forEach(style => style.remove());
  
  try {
    // Import template service dynamically to avoid circular dependencies
    const { templateService } = await import('../services/templateService');
    console.log('applyStylesToDocument - Fetching CSS from backend with color:', templateColor);
    const css = await templateService.getTemplateCss(templateId, templateColor);
    
    // Create and inject the unified styles
    const styleElement = doc.createElement('style');
    styleElement.setAttribute('data-resume-styles', 'true');
    styleElement.textContent = css;
    
    // Insert at the beginning of head for maximum priority
    if (doc.head.firstChild) {
      doc.head.insertBefore(styleElement, doc.head.firstChild);
    } else {
      doc.head.appendChild(styleElement);
    }
    
    console.log('applyStylesToDocument - Successfully applied backend CSS');
  } catch (error) {
    console.error('applyStylesToDocument - Failed to fetch backend CSS:', error);
    throw new Error(`Failed to apply template styles: ${error.message}`);
  }
};

/**
 * Apply styles to the current document (for preview)
 * Uses centralized backend template service as SINGLE SOURCE OF TRUTH
 */
export const applyStylesToCurrentDocument = async (templateColor: string, templateId: string = 'navy-column-modern'): Promise<() => void> => {
  // Remove any existing style elements with our identifier
  const existingStyles = document.querySelectorAll('style[data-resume-styles]');
  existingStyles.forEach(style => style.remove());
  
  try {
    // Import template service dynamically to avoid circular dependencies
    const { templateService } = await import('../services/templateService');
    console.log('applyStylesToCurrentDocument - Fetching CSS from backend with color:', templateColor);
    const css = await templateService.getTemplateCss(templateId, templateColor);
    
    // Create and inject the unified styles
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-resume-styles', 'true');
    styleElement.textContent = css;
    
    // Insert at the beginning of head for maximum priority
    if (document.head.firstChild) {
      document.head.insertBefore(styleElement, document.head.firstChild);
    } else {
      document.head.appendChild(styleElement);
    }
    
    console.log('applyStylesToCurrentDocument - Successfully applied backend CSS');
    
    // Return cleanup function
    return () => {
      const styleToRemove = document.querySelector('style[data-resume-styles]');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  } catch (error) {
    console.error('applyStylesToCurrentDocument - Failed to fetch backend CSS:', error);
    throw new Error(`Failed to apply template styles: ${error.message}`);
  }
};