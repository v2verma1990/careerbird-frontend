import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { frontendTemplateService } from '../../services/frontendTemplateService';
import { logActivity } from '../exportUtils';

export interface ModernExecutivePDFOptions {
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
 * Export modern-executive resume as PDF
 */
export const exportModernExecutiveAsPDF = async (
  elementId: string, 
  filename: string = 'resume',
  options: ModernExecutivePDFOptions = {}
): Promise<void> => {
  try {
    // Default options optimized for modern-executive template (same as navy-column-modern)
    const defaultOptions: Required<ModernExecutivePDFOptions> = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5,
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      includeBackground: true,
      optimizeForPrint: true,
      templateColor: '#2196F3',
      templateId: 'modern-executive'
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
      // Apply frontend CSS for modern-executive template
      if (config.templateColor && config.templateId) {
        console.log('Modern Executive PDF Export - Applying styles:', config.templateId, config.templateColor);
        frontendTemplateService.applyTemplateStyles(config.templateId, config.templateColor);
      }

      // Prepare element for PDF export
      await prepareModernExecutiveForPDF(element, config);

      // Wait for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force a layout recalculation to ensure proper positioning
      element.style.display = 'none';
      element.offsetHeight; // Trigger reflow
      element.style.display = '';
      
      // Wait a bit more for the layout to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Calculate dimensions for single-column layout
      const actualWidth = 794; // A4 width at 96 DPI
      
      // Get more accurate height by checking all possible height values
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
      allElements.forEach((el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
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
      
      console.log('Modern Executive PDF - Dimensions:', { 
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
          optimizeModernExecutiveClonedDoc(clonedDoc, config);
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

      console.log('Modern Executive PDF - Canvas dimensions:', {
        canvasWidth,
        canvasHeight,
        scaledWidth,
        scaledHeight,
        estimatedPages: Math.ceil(scaledHeight / contentHeight)
      });

      // Handle multi-page content
      await handleModernExecutiveMultiPage(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);

      // Save the PDF
      pdf.save(`${filename}.pdf`);

      // Log activity
      await logActivity('resume_pdf_export', `Exported modern-executive resume as PDF: ${filename}`);

      hideLoadingToast(loadingToast);
      showSuccessToast('PDF exported successfully!');

    } catch (error) {
      hideLoadingToast(loadingToast);
      throw error;
    } finally {
      // Restore element after PDF export
      await restoreModernExecutiveAfterPDF(element);
    }

  } catch (error) {
    console.error('Modern Executive PDF export failed:', error);
    showErrorToast('Failed to export PDF. Please try again.');
    throw error;
  }
};

/**
 * Prepare modern-executive element for PDF export
 */
const prepareModernExecutiveForPDF = async (element: HTMLElement, config: Required<ModernExecutivePDFOptions>): Promise<void> => {
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

  // Handle modern-executive container (single-column layout)
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
    container.style.padding = '40px 40px 60px 40px'; // Extra bottom padding to prevent cutting
    container.style.boxSizing = 'border-box';
  }

  // Ensure all sections are visible
  const sections = element.querySelectorAll('.section');
  sections.forEach((section: HTMLElement, index: number) => {
    section.style.display = 'block';
    section.style.visibility = 'visible';
    section.style.opacity = '1';
    section.style.overflow = 'visible';
    section.style.pageBreakInside = 'avoid';
    section.style.marginBottom = '2.5rem';
    section.style.clear = 'both';
    
    // Add extra spacing between sections to prevent overlapping
    if (index > 0) {
      section.style.marginTop = '2rem';
    }
  });

  // Special handling for skills sections
  const skillsLists = element.querySelectorAll('.skills-list');
  skillsLists.forEach((skillsList: HTMLElement) => {
    skillsList.style.display = 'flex';
    skillsList.style.flexWrap = 'wrap';
    skillsList.style.gap = '0.7rem';
    skillsList.style.marginBottom = '2rem';
    skillsList.style.overflow = 'visible';
    skillsList.style.pageBreakInside = 'avoid';
  });

  // Special handling for skill tags
  const skillTags = element.querySelectorAll('.skill-tag');
  skillTags.forEach((tag: HTMLElement) => {
    tag.style.display = 'inline-block';
    tag.style.margin = '0.2rem 0.2rem 0.5rem 0';
    tag.style.whiteSpace = 'nowrap';
    tag.style.pageBreakInside = 'avoid';
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
 * Optimize cloned document for modern-executive PDF
 */
const optimizeModernExecutiveClonedDoc = (clonedDoc: Document, config: Required<ModernExecutivePDFOptions>): void => {
  console.log('Optimizing cloned document for modern-executive');
  
  const sections = Array.from(clonedDoc.querySelectorAll('.section'));
  console.log('Found sections:', sections.length);
  
  sections.forEach((section, index) => {
    console.log(`Section ${index + 1}:`, {
      className: section.className,
      textContent: section.textContent?.substring(0, 100),
      innerHTML: section.innerHTML.substring(0, 200),
      offsetHeight: (section as HTMLElement).offsetHeight,
      scrollHeight: (section as HTMLElement).scrollHeight,
      style: (section as HTMLElement).style.cssText
    });
  });
  
  console.log('Cloned document structure:', {
    body: clonedDoc.body?.tagName,
    bodyClasses: clonedDoc.body?.className,
    firstChild: clonedDoc.body?.firstElementChild?.tagName,
    firstChildClasses: clonedDoc.body?.firstElementChild?.className,
    totalElements: clonedDoc.querySelectorAll('*').length
  });

  // Get the centralized CSS from the frontendTemplateService
  const templateCss = frontendTemplateService.getTemplateCSS('modern-executive');
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
      margin-bottom: 2.5rem !important;
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
      margin-bottom: 2rem !important;
      padding-bottom: 1.5rem !important;
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
      margin-bottom: 4rem !important;
      padding-bottom: 2rem !important;
    }
    
    /* Ensure all section content is visible */
    .section * {
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
    }
    
    /* Fix for specific section types */
    .experience-item, .education-item, .skills-list, .certifications, 
    .summary, .header, .contact-info {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    
    /* Specific fixes for list items */
    ul, ol, li {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Ensure text content is visible */
    p, span, div, h1, h2, h3, h4, h5, h6 {
      visibility: visible !important;
      opacity: 1 !important;
      color: inherit !important;
    }
    
    /* Skills section specific fixes */
    .skills-list {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.7rem !important;
      margin-bottom: 2rem !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Skill tags */
    .skill-tag {
      background: rgba(${colorRgb}, 0.2) !important;
      color: ${config.templateColor} !important;
      padding: 0.4rem 1rem !important;
      border-radius: 20px !important;
      font-size: 0.9rem !important;
      font-weight: 500 !important;
      border: 1px solid rgba(${colorRgb}, 0.53) !important;
      display: inline-block !important;
      margin: 0.2rem 0.2rem 0.5rem 0 !important;
      white-space: nowrap !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Core competency section */
    .core-competency, .competencies {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 2rem !important;
      overflow: visible !important;
    }
    
    /* Prevent overlapping between sections */
    .section + .section {
      margin-top: 2rem !important;
      clear: both !important;
    }
  `;
  
  clonedDoc.head.appendChild(rootStyle);

  // Apply template color to dynamic elements
  const colorElements = clonedDoc.querySelectorAll('.section-title, .company, .skill-tag, h1');
  colorElements.forEach((el: HTMLElement) => {
    if (el.classList.contains('skill-tag')) {
      el.style.backgroundColor = config.templateColor;
      el.style.color = 'white';
    } else {
      el.style.color = config.templateColor;
    }
  });
};

/**
 * Handle multi-page content for modern-executive
 */
const handleModernExecutiveMultiPage = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<ModernExecutivePDFOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const scaledHeight = (canvas.height / config.scale) * (scaledWidth / (canvas.width / config.scale));
  
  console.log('Modern Executive PDF - Multi-page handling:', {
    scaledHeight,
    contentHeight,
    canvasHeight: canvas.height,
    canvasWidth: canvas.width,
    scale: config.scale,
    scaledWidth
  });

  // If content fits in one page, add it directly
  if (scaledHeight <= contentHeight) {
    const imgData = canvas.toDataURL('image/jpeg', config.quality);
    pdf.addImage(
      imgData,
      'JPEG',
      config.margin.left,
      config.margin.top,
      scaledWidth,
      scaledHeight
    );
    return;
  }

  // Multi-page handling with proper page breaks
  const totalPages = Math.ceil(scaledHeight / contentHeight);
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    // Calculate the Y position in the scaled content
    const yOffsetInScaled = page * contentHeight;
    const remainingHeightInScaled = Math.min(contentHeight, scaledHeight - yOffsetInScaled);
    
    // Convert scaled coordinates back to canvas coordinates
    const yOffsetInCanvas = (yOffsetInScaled / scaledHeight) * canvas.height;
    const heightInCanvas = (remainingHeightInScaled / scaledHeight) * canvas.height;
    
    // Create a temporary canvas for this page
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    
    // Set canvas size to match the source area
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(heightInCanvas);
    
    // Fill with white background
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    
    // Draw the portion of the original canvas for this page
    pageCtx.drawImage(
      canvas,
      0, yOffsetInCanvas, canvas.width, heightInCanvas,
      0, 0, canvas.width, heightInCanvas
    );
    
    console.log(`Modern Executive PDF - Page ${page + 1}/${totalPages}:`, {
      yOffsetInScaled,
      remainingHeightInScaled,
      yOffsetInCanvas,
      heightInCanvas,
      pageCanvasHeight: pageCanvas.height
    });
    
    // Convert to image and add to PDF
    const imgData = pageCanvas.toDataURL('image/jpeg', config.quality);
    pdf.addImage(
      imgData,
      'JPEG',
      config.margin.left,
      config.margin.top,
      scaledWidth,
      remainingHeightInScaled
    );
  }
};

/**
 * Restore element after PDF export
 */
const restoreModernExecutiveAfterPDF = async (element: HTMLElement): Promise<void> => {
  const originalStyle = element.getAttribute('data-original-style');
  if (originalStyle) {
    element.style.cssText = originalStyle;
    element.removeAttribute('data-original-style');
  }
};

// Toast functions - using console for now, can be replaced with actual toast system
const showLoadingToast = (message: string) => {
  console.log('Loading:', message);
  // You can replace this with your actual toast system
  return { id: Date.now() };
};

const hideLoadingToast = (toast: any) => {
  console.log('Hide loading toast');
  // You can replace this with your actual toast system
};

const showSuccessToast = (message: string) => {
  console.log('Success:', message);
  // You can replace this with your actual toast system
};

const showErrorToast = (message: string) => {
  console.log('Error:', message);
  // You can replace this with your actual toast system
};