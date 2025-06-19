import api from './apiClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Download a text file to the user's device
 * @param content The text content to download
 * @param filename The name of the file to download
 */
export const downloadTextFile = (content: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Export data to a CSV file
 * @param data The data to export
 * @param filename The name of the file to download (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create and download CSV file
  const csvContent = csvRows.join('\n');
  const element = document.createElement("a");
  const file = new Blob([csvContent], {type: 'text/csv'});
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Log user activity to the backend
 * @param actionType Type of action being logged
 * @param description Optional description of the activity
 */
export const logActivity = async (actionType: string, description?: string) => {
  try {
    await api.usage.logActivity({
      actionType,
      description
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

/**
 * Compatibility function for older code using Supabase directly
 * @param actionType Type of action being logged
 * @param description Optional description of the activity
 */
export const logActivity2 = async (actionType: string, description?: string) => {
  try {
    // Get user ID from current session
    const currentUser = api.auth.getCurrentUser();
    if (currentUser?.userId) {
      await api.usage.logActivity({
        actionType, 
        description
      });
    } else {
      console.warn("Cannot log activity: No user is logged in");
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

/**
 * Export resume as PDF using frontend rendering
 * This ensures consistency between preview and downloaded PDF
 * @param elementId The ID of the DOM element to convert to PDF
 * @param filename The name of the PDF file (without extension)
 * @param options Configuration options for PDF generation
 */
export interface PDFExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0.1 to 1.0
  scale?: number; // Scale factor for rendering
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  includeBackground?: boolean;
  optimizeForPrint?: boolean;
}

export const exportResumeAsPDF = async (
  elementId: string, 
  filename: string = 'resume',
  options: PDFExportOptions = {}
): Promise<void> => {
  try {
    // Default options optimized for multi-page content
    const defaultOptions: Required<PDFExportOptions> = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5, // Reduced scale for better performance and quality balance
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      includeBackground: true,
      optimizeForPrint: true
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
      // Prepare element for PDF export
      await prepareElementForPDF(element, config);

      // Wait for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get actual dimensions after preparation
      const elementRect = element.getBoundingClientRect();
      const actualWidth = Math.max(element.scrollWidth, elementRect.width, 794); // Ensure minimum A4 width
      const actualHeight = Math.max(element.scrollHeight, elementRect.height);
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: config.scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: config.includeBackground ? '#ffffff' : null,
        logging: false,
        width: actualWidth,
        height: actualHeight,
        windowWidth: actualWidth,
        windowHeight: actualHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Optimize cloned document for PDF
          optimizeClonedDocumentForPDF(clonedDoc, config);
        }
      });

      // Calculate PDF dimensions
      const pageWidth = config.format === 'a4' ? 210 : 216; // mm
      const pageHeight = config.format === 'a4' ? 297 : 279; // mm
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate content area dimensions (excluding margins)
      const contentWidth = pageWidth - config.margin.left - config.margin.right;
      const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
      
      // Calculate scaling to fit page width (maintain aspect ratio)
      const widthRatio = contentWidth / (canvasWidth / config.scale);
      const scaledWidth = contentWidth;
      const scaledHeight = (canvasHeight / config.scale) * widthRatio;

      // Create PDF
      const pdf = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: config.format
      });

      // Debug information
      console.log('PDF Generation Debug Info:', {
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight,
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        contentHeight: pageHeight - config.margin.top - config.margin.bottom,
        estimatedPages: Math.ceil(scaledHeight / (pageHeight - config.margin.top - config.margin.bottom))
      });

      // Handle multi-page content properly
      await handleMultiPageContent(pdf, canvas, config, pageWidth, pageHeight, scaledWidth, scaledHeight);

      // Save the PDF
      pdf.save(`${filename}.pdf`);

      // Log activity
      await logActivity('resume_pdf_export', `Exported resume as PDF: ${filename}`);

      hideLoadingToast(loadingToast);
      showSuccessToast('PDF exported successfully!');

    } catch (error) {
      hideLoadingToast(loadingToast);
      throw error;
    } finally {
      // Restore element after PDF export
      await restoreElementAfterPDF(element);
    }

  } catch (error) {
    console.error('PDF export failed:', error);
    showErrorToast('Failed to export PDF. Please try again.');
    throw error;
  }
};

/**
 * Prepare DOM element for optimal PDF rendering
 */
const prepareElementForPDF = async (element: HTMLElement, config: Required<PDFExportOptions>): Promise<void> => {
  // Store original styles
  element.setAttribute('data-original-style', element.style.cssText);

  // Apply PDF-optimized styles
  const pdfStyles = {
    position: 'relative',
    transform: 'none',
    boxShadow: 'none',
    borderRadius: config.optimizeForPrint ? '0' : undefined,
    overflow: 'visible',
    maxWidth: 'none',
    width: 'auto',
    height: 'auto',
    minHeight: 'auto'
  };

  Object.assign(element.style, pdfStyles);

  // Handle resume container specifically
  const resumeContainer = element.querySelector('.resume-container') as HTMLElement;
  if (resumeContainer) {
    // Set a fixed width that matches A4 proportions for consistent rendering
    resumeContainer.style.width = '794px'; // A4 width at 96 DPI
    resumeContainer.style.maxWidth = 'none';
    resumeContainer.style.minHeight = 'auto';
    resumeContainer.style.height = 'auto';
    resumeContainer.style.boxShadow = 'none';
    resumeContainer.style.borderRadius = '0';
    resumeContainer.style.margin = '0';
    resumeContainer.style.padding = '20px';
    resumeContainer.style.backgroundColor = '#ffffff';
  }

  // Handle any flex containers that might compress content
  const flexContainers = element.querySelectorAll('[style*="display: flex"], .flex, .d-flex');
  flexContainers.forEach((container: HTMLElement) => {
    container.style.display = 'block';
    container.style.height = 'auto';
  });

  // Ensure proper spacing for sections
  const sections = element.querySelectorAll('section, .section, .resume-section');
  sections.forEach((section: HTMLElement) => {
    section.style.pageBreakInside = 'avoid';
    section.style.marginBottom = '20px';
  });

  // Ensure all images are loaded
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve(true);
      } else {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      }
    });
  });

  await Promise.all(imagePromises);

  // Wait for any CSS transitions to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Optimize cloned document for PDF rendering
 */
const optimizeClonedDocumentForPDF = (clonedDoc: Document, config: Required<PDFExportOptions>): void => {
  // Remove problematic elements
  const elementsToRemove = clonedDoc.querySelectorAll('script, noscript, iframe, embed, object');
  elementsToRemove.forEach(el => el.remove());

  // Fix font rendering and layout for PDF
  const style = clonedDoc.createElement('style');
  style.textContent = `
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
    
    .resume-container {
      box-shadow: none !important;
      border-radius: 0 !important;
      transform: none !important;
      width: 794px !important;
      max-width: none !important;
      min-height: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 20px !important;
      background: white !important;
      overflow: visible !important;
    }
    
    /* Ensure proper spacing and avoid compression */
    section, .section, .resume-section {
      margin-bottom: 20px !important;
      page-break-inside: avoid;
    }
    
    /* Fix flexbox layouts that might compress content */
    .flex, .d-flex, [style*="display: flex"] {
      display: block !important;
      height: auto !important;
    }
    
    /* Ensure proper rendering of two-column layouts */
    .sidebar, .content {
      page-break-inside: avoid;
      display: block !important;
      height: auto !important;
      min-height: auto !important;
    }
    
    .sidebar {
      float: left !important;
      width: 30% !important;
      margin-right: 3% !important;
    }
    
    .content {
      float: right !important;
      width: 67% !important;
    }
    
    /* Ensure text doesn't get compressed */
    p, div, span, h1, h2, h3, h4, h5, h6 {
      line-height: 1.4 !important;
      margin-bottom: 8px !important;
    }
    
    /* Fix any absolute positioning that might cause issues */
    [style*="position: absolute"], [style*="position: fixed"] {
      position: relative !important;
    }
    
    /* Ensure proper image sizing */
    img {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Creative Designer template overrides */
    .container {
      display: flex !important;
      flex-direction: row !important;
      width: 794px !important;
      max-width: none !important;
      min-height: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      overflow: visible !important;
    }
    .sidebar {
      width: 240px !important;
      min-width: 200px !important;
      max-width: 260px !important;
      flex-shrink: 0 !important;
      float: left !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }
    .main-content {
      flex: 1 1 0% !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      float: right !important;
      box-sizing: border-box !important;
    }
  `;
  clonedDoc.head.appendChild(style);
};

/**
 * Handle multi-page content by splitting into multiple pages
 */
const handleMultiPageContent = async (
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  config: Required<PDFExportOptions>,
  pageWidth: number,
  pageHeight: number,
  scaledWidth: number,
  scaledHeight: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const canvasHeight = canvas.height;
  const canvasWidth = canvas.width;
  const scale = config.scale;
  
  // Calculate how much canvas height fits in one page
  const canvasHeightPerPage = (contentHeight / scaledHeight) * canvasHeight;
  
  let yPosition = 0;
  let pageNumber = 0;

  while (yPosition < canvasHeight) {
    // Add new page (first page is already created by jsPDF)
    if (pageNumber > 0) {
      pdf.addPage();
    }

    // Calculate the source area for this page
    const sourceY = yPosition;
    const remainingHeight = canvasHeight - yPosition;
    const sourceHeight = Math.min(canvasHeightPerPage, remainingHeight);
    
    // Create a temporary canvas for this page slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvasWidth;
    pageCanvas.height = sourceHeight;
    
    const pageCtx = pageCanvas.getContext('2d');
    if (pageCtx) {
      // Draw the slice of the original canvas onto the page canvas
      pageCtx.drawImage(
        canvas,
        0, sourceY,           // Source position
        canvasWidth, sourceHeight,  // Source dimensions
        0, 0,                // Destination position
        canvasWidth, sourceHeight   // Destination dimensions
      );

      // Convert page canvas to image
      const pageImgData = pageCanvas.toDataURL('image/jpeg', config.quality);
      
      // Calculate the height for this page slice in PDF units
      const pageSliceHeight = (sourceHeight / canvasHeight) * scaledHeight;
      
      // Add the image to the PDF
      pdf.addImage(
        pageImgData, 
        'JPEG', 
        config.margin.left,     // X position
        config.margin.top,      // Y position
        scaledWidth,            // Width
        pageSliceHeight         // Height
      );
    }

    // Move to next page position
    yPosition += sourceHeight;
    pageNumber++;
  }
};

/**
 * Restore element to original state after PDF export
 */
const restoreElementAfterPDF = async (element: HTMLElement): Promise<void> => {
  const originalStyle = element.getAttribute('data-original-style');
  if (originalStyle) {
    element.style.cssText = originalStyle;
    element.removeAttribute('data-original-style');
  }
};

// Toast notification helpers - simplified for internal use
const showLoadingToast = (message: string): string => {
  console.log(`Loading: ${message}`);
  return 'loading-toast-id';
};

const hideLoadingToast = (toastId: string): void => {
  console.log(`Hide loading toast: ${toastId}`);
};

const showSuccessToast = (message: string): void => {
  console.log(`Success: ${message}`);
};

const showErrorToast = (message: string): void => {
  console.error(`Error: ${message}`);
};

/**
 * Export resume using backend API (fallback method)
 * @param resumeData The resume data to export
 * @param format The export format ('pdf' | 'docx')
 * @param filename The filename for the export
 */
export const exportResumeViaAPI = async (
  resumeData: any,
  format: 'pdf' | 'docx' = 'pdf',
  filename: string = 'resume'
): Promise<void> => {
  try {
    const response = await api.resumeBuilder.downloadResume({
      resumeText: JSON.stringify(resumeData),
      format
    });

    if (response.ok) {
      // Get the blob data from the response
      const blob = await response.blob();

      // Download the file
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `${filename}.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);

      await logActivity('resume_export_api', `Exported resume via API: ${filename}.${format}`);
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to export resume via API: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('API export failed:', error);
    throw error;
  }
};
