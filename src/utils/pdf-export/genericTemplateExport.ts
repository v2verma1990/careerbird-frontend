import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { frontendTemplateService } from '../../services/frontendTemplateService';
import { logActivity } from '../exportUtils';

// Toast functions for user feedback
const showLoadingToast = (message: string) => {
  const toast = document.createElement('div');
  toast.id = 'loading-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2196F3;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  return toast;
};

const hideLoadingToast = (toast: HTMLElement) => {
  if (toast && toast.parentNode) {
    toast.parentNode.removeChild(toast);
  }
};

const showSuccessToast = (message: string) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
};

const showErrorToast = (message: string) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
};

export interface GenericTemplatePDFOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  includeBackground?: boolean;
  optimizeForPrint?: boolean;
  templateColor?: string;
  templateId?: string;
}

/**
 * Generic PDF export function for all template types
 */
export const exportGenericTemplateAsPDF = async (
  elementId: string, 
  filename: string = 'resume',
  options: GenericTemplatePDFOptions = {}
): Promise<void> => {
  try {
    // Default options optimized for generic templates
    const defaultOptions: Required<GenericTemplatePDFOptions> = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5,
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      includeBackground: true,
      optimizeForPrint: true,
      templateColor: '#2196F3',
      templateId: 'generic'
    };

    const config = { ...defaultOptions, ...options };
    
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Show loading indicator
    const loadingToast = showLoadingToast('Generating PDF...');

    try {
      // Apply frontend CSS for the template
      if (config.templateColor && config.templateId) {
        console.log(`${config.templateId} PDF Export - Applying styles:`, config.templateId, config.templateColor);
        frontendTemplateService.applyTemplateStyles(config.templateId, config.templateColor);
      }

      // Prepare element for PDF export
      await prepareGenericTemplateForPDF(element, config);

      // Wait for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force a layout recalculation to ensure proper positioning
      element.style.display = 'none';
      element.offsetHeight; // Trigger reflow
      element.style.display = '';
      
      // Wait a bit more for the layout to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Calculate dimensions
      const actualWidth = 794; // A4 width at 96 DPI
      
      // Get accurate height measurements
      const elementRect = element.getBoundingClientRect();
      const scrollHeight = element.scrollHeight;
      const offsetHeight = element.offsetHeight;
      const clientHeight = element.clientHeight;
      
      // Check container height as well
      const container = element.querySelector('.container') as HTMLElement;
      let containerHeight = 0;
      if (container) {
        containerHeight = Math.max(
          container.scrollHeight,
          container.offsetHeight,
          container.getBoundingClientRect().height
        );
      }
      
      // Check for any elements that might extend beyond the container
      const allElements = element.querySelectorAll('*');
      let maxElementBottom = 0;
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeBottom = rect.bottom - elementRect.top;
        if (relativeBottom > maxElementBottom) {
          maxElementBottom = relativeBottom;
        }
      });
      
      // Use the maximum of all height measurements, with a minimum of A4 height
      const actualHeight = Math.max(
        scrollHeight,
        offsetHeight,
        clientHeight,
        elementRect.height,
        containerHeight,
        maxElementBottom,
        1123 // A4 height minimum
      );
      
      console.log(`${config.templateId} PDF - Dimensions:`, { 
        actualWidth, 
        actualHeight,
        scrollHeight,
        offsetHeight,
        clientHeight,
        elementRectHeight: elementRect.height,
        containerHeight,
        maxElementBottom
      });
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: config.scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: actualWidth,
        height: actualHeight,
        windowWidth: actualWidth,
        windowHeight: actualHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        imageTimeout: 30000,
        onclone: (clonedDoc) => {
          optimizeGenericTemplateClonedDoc(clonedDoc, config);
        }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: config.format
      });

      // Calculate PDF dimensions
      const pageWidth = config.format === 'a4' ? 210 : 216;
      const pageHeight = config.format === 'a4' ? 297 : 279;
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const contentWidth = pageWidth - config.margin.left - config.margin.right;
      const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
      
      const widthRatio = contentWidth / (canvasWidth / config.scale);
      const scaledWidth = contentWidth;
      const scaledHeight = (canvasHeight / config.scale) * widthRatio;

      console.log(`${config.templateId} PDF - Canvas dimensions:`, {
        canvasWidth,
        canvasHeight,
        scaledWidth,
        scaledHeight,
        estimatedPages: Math.ceil(scaledHeight / contentHeight)
      });

      // Handle multi-page content
      await handleGenericTemplateMultiPage(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);

      // Save the PDF
      pdf.save(`${filename}.pdf`);

      // Log activity
      await logActivity('resume_pdf_export', `Exported ${config.templateId} resume as PDF: ${filename}`);

      if (loadingToast) {
        hideLoadingToast(loadingToast);
      }
      
      try {
        showSuccessToast('PDF exported successfully!');
      } catch (e) {
        console.log('PDF exported successfully!');
      }

    } catch (error) {
      if (loadingToast) {
        hideLoadingToast(loadingToast);
      }
      throw error;
    } finally {
      // Restore element after PDF export
      await restoreGenericTemplateAfterPDF(element);
    }

  } catch (error) {
    console.error(`${options.templateId || 'Generic'} PDF export failed:`, error);
    try {
      showErrorToast('Failed to export PDF. Please try again.');
    } catch (e) {
      console.error('Failed to export PDF. Please try again.');
    }
    throw error;
  }
};

/**
 * Prepare generic template element for PDF export
 */
const prepareGenericTemplateForPDF = async (element: HTMLElement, config: Required<GenericTemplatePDFOptions>): Promise<void> => {
  // Store original styles
  element.setAttribute('data-original-style', element.style.cssText);

  // Apply PDF-optimized styles
  element.style.position = 'relative';
  element.style.transform = 'none';
  element.style.boxShadow = 'none';
  element.style.overflow = 'visible';
  element.style.width = '794px';
  element.style.maxWidth = 'none';
  element.style.height = 'auto';
  element.style.minHeight = 'auto';

  // Handle container (works for both single-column and two-column layouts)
  const container = element.querySelector('.container') as HTMLElement;
  if (container) {
    container.style.width = '794px';
    container.style.maxWidth = 'none';
    container.style.minHeight = '1000px';
    container.style.height = 'auto';
    container.style.boxShadow = 'none';
    container.style.borderRadius = '0';
    container.style.margin = '0';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px 40px 60px 40px';
    container.style.boxSizing = 'border-box';
  }

  // Handle sidebar layouts
  const sidebar = element.querySelector('.sidebar') as HTMLElement;
  if (sidebar) {
    sidebar.style.minHeight = '1000px';
    sidebar.style.flexShrink = '0';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.boxSizing = 'border-box';
  }
  
  // Handle main content area
  const mainContent = element.querySelector('.main-content, .content') as HTMLElement;
  if (mainContent) {
    mainContent.style.flex = '1';
    mainContent.style.minHeight = '1000px';
    mainContent.style.boxSizing = 'border-box';
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
  }

  // Ensure all sections are visible
  const sections = element.querySelectorAll('.section');
  sections.forEach((section: Element, index: number) => {
    const htmlSection = section as HTMLElement;
    htmlSection.style.display = 'block';
    htmlSection.style.visibility = 'visible';
    htmlSection.style.opacity = '1';
    htmlSection.style.overflow = 'visible';
    htmlSection.style.pageBreakInside = 'avoid';
    htmlSection.style.marginBottom = '2rem';
    htmlSection.style.clear = 'both';
    
    // Add extra spacing between sections to prevent overlapping
    if (index > 0) {
      htmlSection.style.marginTop = '1.5rem';
    }
  });

  // Special handling for skills sections
  const skillsLists = element.querySelectorAll('.skills-list, .skills-container');
  skillsLists.forEach((skillsList: Element) => {
    const htmlSkillsList = skillsList as HTMLElement;
    htmlSkillsList.style.display = 'flex';
    htmlSkillsList.style.flexWrap = 'wrap';
    htmlSkillsList.style.gap = '0.5rem';
    htmlSkillsList.style.marginBottom = '1.5rem';
    htmlSkillsList.style.overflow = 'visible';
    htmlSkillsList.style.pageBreakInside = 'avoid';
  });

  // Special handling for skill tags
  const skillTags = element.querySelectorAll('.skill-tag, .skill-item');
  skillTags.forEach((tag: Element) => {
    const htmlTag = tag as HTMLElement;
    htmlTag.style.display = 'inline-block';
    htmlTag.style.margin = '0.2rem 0.2rem 0.5rem 0';
    htmlTag.style.whiteSpace = 'nowrap';
    htmlTag.style.pageBreakInside = 'avoid';
  });
};

/**
 * Helper function to convert hex color to RGB
 */
const hexToRgb = (hex: string): string => {
  const cleanHex = hex.replace('#', '');
  const expandedHex = cleanHex.length === 3 
    ? cleanHex.split('').map(x => x + x).join('')
    : cleanHex;
  
  const num = parseInt(expandedHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(',');
};

/**
 * Optimize cloned document for generic template PDF
 */
const optimizeGenericTemplateClonedDoc = (clonedDoc: Document, config: Required<GenericTemplatePDFOptions>): void => {
  console.log(`Optimizing cloned document for ${config.templateId}`);

  // Get the centralized CSS from the frontendTemplateService
  const templateCss = frontendTemplateService.getTemplateCSS(config.templateId);
  console.log('Template CSS loaded:', templateCss ? 'Yes' : 'No');

  // Set CSS variables and apply centralized template CSS
  const colorRgb = hexToRgb(config.templateColor);
  const rootStyle = clonedDoc.createElement('style');
  rootStyle.textContent = `
    /* CSS Variables */
    :root {
      --template-color: ${config.templateColor} !important;
      --template-color-rgb: ${colorRgb} !important;
    }
    
    /* Centralized Template CSS */
    ${templateCss || ''}
    
    /* PDF-specific optimizations */
    .container {
      width: 100% !important;
      max-width: none !important;
      padding: 40px 40px 60px 40px !important;
      margin: 0 !important;
      min-height: 100% !important;
    }
    
    /* Add extra spacing at the end to prevent cutting */
    .container::after {
      content: "" !important;
      display: block !important;
      height: 40px !important;
      width: 100% !important;
    }
    
    /* Ensure all content is visible */
    * {
      overflow: visible !important;
      page-break-inside: avoid !important;
    }
    
    /* Force visibility of all sections */
    .section {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin-bottom: 2rem !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Prevent page breaks within experience and education items */
    .experience-item, .education-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 1.5rem !important;
      padding-bottom: 1rem !important;
    }
    
    /* Ensure proper spacing for better page breaks */
    .section-title {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    
    /* Prevent orphaned lines */
    p, li, div {
      orphans: 3 !important;
      widows: 3 !important;
    }
    
    /* Ensure last section has proper bottom spacing */
    .section:last-child {
      margin-bottom: 3rem !important;
      padding-bottom: 2rem !important;
    }
    
    /* Ensure all section content is visible */
    .section * {
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
    }
    
    /* Sidebar specific optimizations */
    .sidebar {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Force color printing for backgrounds */
    .sidebar, .header, [style*="background"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  `;
  
  clonedDoc.head.appendChild(rootStyle);

  // Apply template color to elements that need it
  const colorElements = clonedDoc.querySelectorAll('.sidebar, .header, .section-title, .name');
  colorElements.forEach((element: Element) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.classList.contains('sidebar') || htmlElement.classList.contains('header')) {
      htmlElement.style.setProperty('background', config.templateColor, 'important');
      htmlElement.style.setProperty('background-color', config.templateColor, 'important');
      htmlElement.style.setProperty('color', '#fff', 'important');
      (htmlElement.style as any).webkitPrintColorAdjust = 'exact';
      (htmlElement.style as any).colorAdjust = 'exact';
      htmlElement.style.printColorAdjust = 'exact';
    } else {
      htmlElement.style.setProperty('color', config.templateColor, 'important');
    }
  });
};

/**
 * Handle multi-page content for generic templates
 */
const handleGenericTemplateMultiPage = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<GenericTemplatePDFOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const canvasHeight = canvas.height;
  const scaledHeight = (canvasHeight / config.scale) * (scaledWidth / (canvas.width / config.scale));

  if (scaledHeight <= contentHeight) {
    // Single page
    const imgData = canvas.toDataURL('image/png', config.quality);
    pdf.addImage(
      imgData, 
      'PNG', 
      config.margin.left, 
      config.margin.top, 
      scaledWidth, 
      scaledHeight
    );
  } else {
    // Multi-page with intelligent page breaking
    if (config.templateId === 'tech-minimalist') {
      await handleTechMinimalistSmartPaging(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);
    } else {
      // Default multi-page handling for other templates
      const totalPages = Math.ceil(scaledHeight / contentHeight);
      console.log(`${config.templateId} PDF - Creating ${totalPages} pages`);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        const sourceY = (page * contentHeight) * (canvas.height / scaledHeight);
        const sourceHeight = Math.min(
          contentHeight * (canvas.height / scaledHeight),
          canvas.height - sourceY
        );

        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d')!;
        
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        // Fill with white background
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        
        // Draw the portion of the original canvas
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, pageCanvas.width, pageCanvas.height
        );

        const pageImgData = pageCanvas.toDataURL('image/png', config.quality);
        const pageScaledHeight = (sourceHeight / config.scale) * (scaledWidth / (canvas.width / config.scale));
        
        pdf.addImage(
          pageImgData, 
          'PNG', 
          config.margin.left, 
          config.margin.top, 
          scaledWidth, 
          pageScaledHeight
        );
      }
    }
  }
};

/**
 * Smart paging for tech-minimalist template that respects content boundaries
 */
const handleTechMinimalistSmartPaging = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<GenericTemplatePDFOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const canvasHeight = canvas.height;
  const scaledHeight = (canvasHeight / config.scale) * (scaledWidth / (canvas.width / config.scale));

  // Get the original element to analyze content structure
  const element = document.querySelector('.tech-minimalist .container') as HTMLElement;
  if (!element) {
    console.warn('Tech-minimalist container not found, falling back to default paging');
    return handleDefaultMultiPage(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);
  }

  // Find all experience items and their positions
  const experienceItems = element.querySelectorAll('.experience-item');
  const sectionHeaders = element.querySelectorAll('.section-header');
  const allBreakableElements = [...Array.from(experienceItems), ...Array.from(sectionHeaders)];
  
  // Calculate element positions relative to the container
  const elementPositions: Array<{element: Element, top: number, bottom: number, height: number}> = [];
  const containerRect = element.getBoundingClientRect();
  
  allBreakableElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const relativeTop = rect.top - containerRect.top;
    const relativeBottom = rect.bottom - containerRect.top;
    elementPositions.push({
      element: el,
      top: relativeTop,
      bottom: relativeBottom,
      height: rect.height
    });
  });

  // Sort by position
  elementPositions.sort((a, b) => a.top - b.top);

  // Calculate optimal page breaks
  const pageBreaks = calculateOptimalPageBreaks(elementPositions, scaledHeight, contentHeight);
  
  console.log(`Tech-minimalist PDF - Smart paging: ${pageBreaks.length} pages with breaks at:`, pageBreaks);

  // Create pages based on calculated breaks
  for (let i = 0; i < pageBreaks.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const startY = i === 0 ? 0 : pageBreaks[i - 1];
    const endY = pageBreaks[i];
    const pageContentHeight = endY - startY;

    // Convert to canvas coordinates
    const canvasStartY = (startY / scaledHeight) * canvasHeight;
    const canvasPageHeight = (pageContentHeight / scaledHeight) * canvasHeight;

    // Create page canvas
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(canvasPageHeight, canvasHeight - canvasStartY);
    
    // Fill with white background
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    
    // Draw the content for this page
    pageCtx.drawImage(
      canvas,
      0, canvasStartY, canvas.width, pageCanvas.height,
      0, 0, pageCanvas.width, pageCanvas.height
    );

    const pageImgData = pageCanvas.toDataURL('image/png', config.quality);
    const pageScaledHeight = (pageCanvas.height / config.scale) * (scaledWidth / (canvas.width / config.scale));
    
    pdf.addImage(
      pageImgData, 
      'PNG', 
      config.margin.left, 
      config.margin.top, 
      scaledWidth, 
      pageScaledHeight
    );
  }
};

/**
 * Calculate optimal page breaks to avoid cutting content
 */
const calculateOptimalPageBreaks = (
  elementPositions: Array<{element: Element, top: number, bottom: number, height: number}>,
  totalHeight: number,
  pageHeight: number
): number[] => {
  const breaks: number[] = [];
  let currentPageStart = 0;
  let currentPageEnd = pageHeight;

  while (currentPageEnd < totalHeight) {
    // Find the best break point near the current page end
    let bestBreakPoint = currentPageEnd;
    let minOverlap = Infinity;

    // Look for elements that would be cut by the current page break
    for (const pos of elementPositions) {
      // Skip elements that are completely before the current page
      if (pos.bottom <= currentPageStart) continue;
      
      // Skip elements that are completely after the current page
      if (pos.top >= currentPageEnd + pageHeight * 0.2) break;

      // Check if this element would be cut by the current page break
      if (pos.top < currentPageEnd && pos.bottom > currentPageEnd) {
        // This element would be cut - consider breaking before it
        const breakBefore = pos.top;
        const breakAfter = pos.bottom;
        
        // Prefer breaking before the element if it's not too far back
        const distanceBefore = currentPageEnd - breakBefore;
        const distanceAfter = breakAfter - currentPageEnd;
        
        if (distanceBefore <= pageHeight * 0.3 && distanceBefore < minOverlap) {
          bestBreakPoint = breakBefore;
          minOverlap = distanceBefore;
        } else if (distanceAfter <= pageHeight * 0.2 && distanceAfter < minOverlap) {
          bestBreakPoint = breakAfter;
          minOverlap = distanceAfter;
        }
      }
    }

    // Ensure we don't create pages that are too short
    if (bestBreakPoint - currentPageStart < pageHeight * 0.4) {
      bestBreakPoint = currentPageEnd;
    }

    breaks.push(bestBreakPoint);
    currentPageStart = bestBreakPoint;
    currentPageEnd = currentPageStart + pageHeight;
  }

  // Add the final page if there's remaining content
  if (currentPageStart < totalHeight) {
    breaks.push(totalHeight);
  }

  return breaks;
};

/**
 * Default multi-page handling fallback
 */
const handleDefaultMultiPage = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<GenericTemplatePDFOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const canvasHeight = canvas.height;
  const scaledHeight = (canvasHeight / config.scale) * (scaledWidth / (canvas.width / config.scale));
  
  const totalPages = Math.ceil(scaledHeight / contentHeight);
  console.log(`${config.templateId} PDF - Creating ${totalPages} pages (default method)`);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    const sourceY = (page * contentHeight) * (canvas.height / scaledHeight);
    const sourceHeight = Math.min(
      contentHeight * (canvas.height / scaledHeight),
      canvas.height - sourceY
    );

    // Create a temporary canvas for this page
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    // Fill with white background
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    
    // Draw the portion of the original canvas
    pageCtx.drawImage(
      canvas,
      0, sourceY, canvas.width, sourceHeight,
      0, 0, pageCanvas.width, pageCanvas.height
    );

    const pageImgData = pageCanvas.toDataURL('image/png', config.quality);
    const pageScaledHeight = (sourceHeight / config.scale) * (scaledWidth / (canvas.width / config.scale));
    
    pdf.addImage(
      pageImgData, 
      'PNG', 
      config.margin.left, 
      config.margin.top, 
      scaledWidth, 
      pageScaledHeight
    );
  }
};

/**
 * Restore generic template element after PDF export
 */
const restoreGenericTemplateAfterPDF = async (element: HTMLElement): Promise<void> => {
  const originalStyle = element.getAttribute('data-original-style');
  if (originalStyle) {
    element.style.cssText = originalStyle;
    element.removeAttribute('data-original-style');
  } else {
    // Reset to default if no original style was stored
    element.style.cssText = '';
  }
  
  // Wait a moment for the DOM to settle
  await new Promise(resolve => setTimeout(resolve, 100));
};