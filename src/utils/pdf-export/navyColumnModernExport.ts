import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { frontendTemplateService } from '../../services/frontendTemplateService';
import { logActivity } from '../exportUtils';

export interface NavyColumnModernPDFOptions {
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
 * Export navy-column-modern resume as PDF
 */
export const exportNavyColumnModernAsPDF = async (
  elementId: string, 
  filename: string = 'resume',
  options: NavyColumnModernPDFOptions = {}
): Promise<void> => {
  try {
    // Default options optimized for navy-column-modern template
    const defaultOptions: Required<NavyColumnModernPDFOptions> = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5,
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      includeBackground: true,
      optimizeForPrint: true,
      templateColor: '#315389',
      templateId: 'navy-column-modern'
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
      // Apply frontend CSS for navy-column-modern template
      if (config.templateColor && config.templateId) {
        console.log('Navy Column Modern PDF Export - Applying styles:', config.templateId, config.templateColor);
        frontendTemplateService.applyTemplateStyles(config.templateId, config.templateColor);
      }

      // Prepare element for PDF export
      await prepareNavyColumnModernForPDF(element, config);

      // Wait for layout to stabilize and CSS to be fully applied
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Apply additional page break optimizations
      await optimizeNavyColumnModernPageBreaks(element);
      
      // Calculate dimensions for two-column layout
      const actualWidth = 794; // A4 width at 96 DPI
      const actualHeight = Math.max(element.scrollHeight, 1123); // A4 height minimum
      
      console.log('Navy Column Modern PDF - Dimensions:', { actualWidth, actualHeight });
      
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
          optimizeNavyColumnModernClonedDoc(clonedDoc, config);
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

      console.log('Navy Column Modern PDF - Canvas dimensions:', {
        canvasWidth,
        canvasHeight,
        scaledWidth,
        scaledHeight,
        estimatedPages: Math.ceil(scaledHeight / contentHeight)
      });

      // Handle multi-page content
      await handleNavyColumnModernMultiPage(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);

      // Save the PDF
      pdf.save(`${filename}.pdf`);

      // Log activity
      await logActivity('resume_pdf_export', `Exported navy-column-modern resume as PDF: ${filename}`);

      hideLoadingToast(loadingToast);
      showSuccessToast('PDF exported successfully!');

    } catch (error) {
      hideLoadingToast(loadingToast);
      throw error;
    } finally {
      // Restore element after PDF export
      await restoreNavyColumnModernAfterPDF(element);
    }

  } catch (error) {
    console.error('Navy Column Modern PDF export failed:', error);
    showErrorToast('Failed to export PDF. Please try again.');
    throw error;
  }
};

/**
 * Prepare navy-column-modern element for PDF export
 */
const prepareNavyColumnModernForPDF = async (element: HTMLElement, config: Required<NavyColumnModernPDFOptions>): Promise<void> => {
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

  // Handle resume container for two-column layout
  const resumeContainer = element.querySelector('.resume-container') as HTMLElement;
  if (resumeContainer) {
    resumeContainer.style.width = '794px';
    resumeContainer.style.maxWidth = 'none';
    resumeContainer.style.minHeight = '1000px';
    resumeContainer.style.height = 'auto';
    resumeContainer.style.boxShadow = 'none';
    resumeContainer.style.borderRadius = '0';
    resumeContainer.style.margin = '0';
    resumeContainer.style.backgroundColor = '#ffffff';
    resumeContainer.style.display = 'flex';
    resumeContainer.style.padding = '0';
    
    // Configure sidebar
    const sidebar = resumeContainer.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.style.width = '250px';
      sidebar.style.minWidth = '250px';
      sidebar.style.maxWidth = '250px';
      sidebar.style.minHeight = '1000px';
      sidebar.style.flexShrink = '0';
      sidebar.style.display = 'flex';
      sidebar.style.flexDirection = 'column';
      sidebar.style.padding = '36px 24px';
      sidebar.style.boxSizing = 'border-box';
    }
    
    // Configure content area
    const content = resumeContainer.querySelector('.content') as HTMLElement;
    if (content) {
      content.style.flex = '1';
      content.style.width = 'calc(794px - 250px)';
      content.style.maxWidth = 'calc(794px - 250px)';
      content.style.minHeight = '1000px';
      content.style.padding = '48px 44px 46px 44px';
      content.style.boxSizing = 'border-box';
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      
      // Add page break optimization for content sections
      const sections = content.querySelectorAll('.employment-section, .education-section, .profile-section');
      sections.forEach((section: Element) => {
        const htmlSection = section as HTMLElement;
        htmlSection.style.pageBreakInside = 'avoid';
        htmlSection.style.breakInside = 'avoid';
        
        // Don't apply inline margin/padding styles - let CSS handle spacing
        // The CSS rules in optimizeNavyColumnModernClonedDoc will handle proper spacing
      });
      
      // Optimize text elements to prevent orphans/widows
      const textElements = content.querySelectorAll('p, .employment-history-list, .profile-summary');
      textElements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.orphans = '3';
        htmlElement.style.widows = '3';
      });
    }
  }
};

/**
 * Optimize page breaks for navy-column-modern template
 */
const optimizeNavyColumnModernPageBreaks = async (element: HTMLElement): Promise<void> => {
  const content = element.querySelector('.content') as HTMLElement;
  if (!content) return;
  
  // Calculate approximate page height (A4 at 96 DPI minus margins)
  const pageHeight = 1123 - 60; // ~1063px usable height
  const currentHeight = content.scrollHeight;
  
  if (currentHeight <= pageHeight) return; // Single page, no optimization needed
  
  // Find all major sections that could be page break candidates
  const sections = content.querySelectorAll('.employment-section, .education-section, .profile-section');
  const sectionPositions: Array<{element: HTMLElement, top: number, height: number}> = [];
  
  sections.forEach((section: Element) => {
    const htmlSection = section as HTMLElement;
    const rect = htmlSection.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const relativeTop = rect.top - contentRect.top;
    
    sectionPositions.push({
      element: htmlSection,
      top: relativeTop,
      height: rect.height
    });
  });
  
  // Add strategic spacing before sections that would be cut
  sectionPositions.forEach((section, index) => {
    const pageNumber = Math.floor(section.top / pageHeight);
    const positionInPage = section.top % pageHeight;
    
    // If section starts near the bottom of a page and would be cut
    if (positionInPage > pageHeight * 0.8 && section.height > pageHeight * 0.3) {
      // Add margin to push it to next page
      const marginNeeded = pageHeight - positionInPage + 20;
      section.element.style.marginTop = `${marginNeeded}px`;
    }
  });
  
  // Wait for layout to adjust
  await new Promise(resolve => setTimeout(resolve, 200));
};

/**
 * Optimize cloned document for navy-column-modern PDF
 */
const optimizeNavyColumnModernClonedDoc = (clonedDoc: Document, config: Required<NavyColumnModernPDFOptions>): void => {
  console.log('Optimizing cloned document for navy-column-modern');

  // Generate darker shade for borders
  const getDarkerShade = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const darkerR = Math.max(0, Math.floor(r * 0.8));
    const darkerG = Math.max(0, Math.floor(g * 0.8));
    const darkerB = Math.max(0, Math.floor(b * 0.8));
    
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
  };

  const borderColor = getDarkerShade(config.templateColor);

  // Add navy-column-modern specific PDF styles
  const pdfStyles = clonedDoc.createElement('style');
  pdfStyles.textContent = `
    .resume-container {
      display: flex !important;
      width: 794px !important;
      max-width: 794px !important;
      min-height: 1123px !important;
      position: relative !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      padding-right: 4px !important;
    }
    
    .sidebar {
      background: ${config.templateColor} !important;
      background-color: ${config.templateColor} !important;
      color: #fff !important;
      border-right: none !important;
      box-shadow: inset -4px 0 0 0 ${borderColor} !important;
      position: relative !important;
      z-index: 1 !important;
      width: 280px !important;
      min-width: 280px !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .content {
      flex: 1 !important;
      min-width: 0 !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
    }
    
    /* Remove problematic pseudo-elements */
    .sidebar::after,
    .sidebar::before {
      display: none !important;
      content: none !important;
    }
    
    /* Ensure sidebar doesn't create page breaks */
    .sidebar {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Remove spacing between profile and employment sections for PDF */
    .content .profile-section {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }

    .content .profile-summary {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }

    .content .employment-section:first-of-type {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  `;
  
  clonedDoc.head.appendChild(pdfStyles);

  // Apply template color to sidebar elements
  const sidebar = clonedDoc.querySelector('.sidebar') as HTMLElement;
  if (sidebar) {
    sidebar.style.setProperty('background', config.templateColor, 'important');
    sidebar.style.setProperty('background-color', config.templateColor, 'important');
    sidebar.style.setProperty('color', '#fff', 'important');
    (sidebar.style as any).webkitPrintColorAdjust = 'exact';
    (sidebar.style as any).colorAdjust = 'exact';
    sidebar.style.printColorAdjust = 'exact';
  }
};

/**
 * Handle multi-page content for navy-column-modern with intelligent page breaks
 */
const handleNavyColumnModernMultiPage = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<NavyColumnModernPDFOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const scaledHeight = (canvas.height / config.scale) * (scaledWidth / (canvas.width / config.scale));
  
  // If content fits on one page, use simple approach
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
  
  // For multi-page content, use intelligent breaking
  const totalPages = Math.ceil(scaledHeight / contentHeight);
  const pageBreakBuffer = 20; // 20mm buffer to avoid cutting text
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    let yOffset = page * contentHeight;
    let remainingHeight = Math.min(contentHeight, scaledHeight - yOffset);
    
    // For pages after the first, add a small overlap to prevent text cutting
    if (page > 0) {
      yOffset -= pageBreakBuffer;
      remainingHeight += pageBreakBuffer;
    }
    
    // For pages before the last, reduce height to prevent text cutting
    if (page < totalPages - 1) {
      remainingHeight -= pageBreakBuffer;
    }
    
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    
    const sourceY = Math.max(0, (yOffset / scaledHeight) * canvas.height);
    const sourceHeight = Math.min(
      canvas.height - sourceY,
      (remainingHeight / scaledHeight) * canvas.height
    );
    
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    // Fill with white background
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, canvas.width, sourceHeight);
    
    pageCtx.drawImage(
      canvas,
      0, sourceY, canvas.width, sourceHeight,
      0, 0, canvas.width, sourceHeight
    );
    
    const imgData = pageCanvas.toDataURL('image/jpeg', config.quality);
    pdf.addImage(
      imgData,
      'JPEG',
      config.margin.left,
      config.margin.top,
      scaledWidth,
      (sourceHeight / canvas.height) * scaledHeight
    );
  }
};

/**
 * Restore element after PDF export
 */
const restoreNavyColumnModernAfterPDF = async (element: HTMLElement): Promise<void> => {
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