import { api } from "@/utils/apiClient";

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
 * Fetch backend CSS for a template and color.
 */
const fetchBackendCss = async (templateId: string, templateColor: string): Promise<string> => {
  const { data, error } = await api.template.getCss(templateId, templateColor);
  if (error) throw new Error(`Failed to fetch backend CSS: ${error}`);
  if (!data) throw new Error('No CSS data received from API');
  return data;
};

/**
 * Apply styles to the given document (for download or preview).
 * Always uses backend CSS as single source of truth.
 */
export const applyStylesToDocument = async (
  doc: Document,
  templateColor: string,
  templateId: string = 'navy-column-modern'
): Promise<void> => {
  try {
    const css = await fetchBackendCss(templateId, templateColor);

    // Remove any existing style elements with our identifier
    const existingStyles = doc.querySelectorAll('style[data-resume-styles]');
    existingStyles.forEach(style => style.remove());

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
export const applyStylesToCurrentDocument = async (
  templateColor: string,
  templateId: string = 'navy-column-modern'
): Promise<() => void> => {
  // Remove any existing style elements with our identifier
  const existingStyles = document.querySelectorAll('style[data-resume-styles]');
  existingStyles.forEach(style => style.remove());

  try {
    const css = await fetchBackendCss(templateId, templateColor);

    // Inject CSS into <head>
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-resume-styles', 'true');
    styleElement.textContent = css;
    if (document.head.firstChild) {
      document.head.insertBefore(styleElement, document.head.firstChild);
    } else {
      document.head.appendChild(styleElement);
    }

    // Return cleanup function
    return () => {
      styleElement.remove();
    };
  } catch (error) {
    console.error('applyStylesToCurrentDocument - Failed to fetch backend CSS:', error);
    throw new Error(`Failed to apply template styles: ${error.message}`);
  }
};