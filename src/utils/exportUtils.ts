import api from './apiClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { applyStylesToDocument } from './resumeStyles';

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
  templateColor?: string; // Selected color for the template
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
      optimizeForPrint: true,
      templateColor: '#315389' // Default navy color
    };

    const config = { ...defaultOptions, ...options };
    
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      showErrorToast(`Export failed: Could not find resume preview in the page. Please make sure the preview is visible before exporting.`);
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Show loading indicator
    const loadingToast = showLoadingToast('Generating PDF...');

    try {
      // Apply backend CSS as single source of truth BEFORE PDF generation
      if (config.templateColor) {
        try {
          console.log('PDF Export - Applying backend CSS with color:', config.templateColor);
          await applyStylesToDocument(document, config.templateColor, 'navy-column-modern');
          console.log('PDF Export - Backend CSS applied successfully');
        } catch (cssError) {
          console.error('PDF Export - Failed to apply backend CSS:', cssError);
          // Continue with export but log the error
        }
      }

      // Prepare element for PDF export
      await prepareElementForPDF(element, config);

      // Wait for layout to stabilize after CSS application
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get actual dimensions after preparation
      const elementRect = element.getBoundingClientRect();
      const actualWidth = Math.max(element.scrollWidth, elementRect.width, 794); // Ensure minimum A4 width
      const actualHeight = Math.max(element.scrollHeight, elementRect.height);
      
      // Check if this is navy-column-modern template for special handling
      const isNavyTemplate = isNavyColumnModernTemplate(element);
      
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
        // Increase image timeout for complex layouts with many images
        imageTimeout: isNavyTemplate ? 30000 : 15000,
        onclone: (clonedDoc) => {
          // Optimize cloned document for PDF
          optimizeClonedDocumentForPDF(clonedDoc, config);
          
          // Additional optimization for navy-column-modern
          if (isNavyTemplate) {
            optimizeNavyColumnModernForPDF(clonedDoc, config.templateColor);
          }
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
        isNavyTemplate: isNavyTemplate,
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
      await handleMultiPageContent(pdf, canvas, config, pageWidth, pageHeight, scaledWidth);

      // Save the PDF
      pdf.save(`${filename}.pdf`);

      // Log activity
      await logActivity('resume_pdf_export', `Exported resume as PDF: ${filename}`);

      hideLoadingToast(loadingToast);
      showSuccessToast('PDF exported successfully!');

    } catch (error) {
      hideLoadingToast(loadingToast);
      // Prevent fallback to API if the error is due to missing preview element
      if (error.message && error.message.includes("not found")) {
        showErrorToast('Resume export failed: Resume preview is not visible. Please open the preview and try again.');
        return;
      }
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
 * Detect if this is a navy-column-modern template
 */
const isNavyColumnModernTemplate = (element: HTMLElement): boolean => {
  const resumeContainer = element.querySelector('.resume-container');
  const sidebar = resumeContainer?.querySelector('.sidebar');
  const content = resumeContainer?.querySelector('.content');
  
  return !!(resumeContainer && sidebar && content);
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
    resumeContainer.style.backgroundColor = '#ffffff';
    
    // Check if this is a navy-column-modern template (has sidebar)
    const sidebar = resumeContainer.querySelector('.sidebar') as HTMLElement;
    const content = resumeContainer.querySelector('.content') as HTMLElement;
    
    if (sidebar && content) {
      // This is a two-column layout (navy-column-modern)
      resumeContainer.style.display = 'flex';
      resumeContainer.style.padding = '0';
      
      // Configure sidebar
      sidebar.style.width = '250px';
      sidebar.style.minWidth = '250px';
      sidebar.style.maxWidth = '250px';
      sidebar.style.minHeight = '1000px';
      sidebar.style.flexShrink = '0';
      sidebar.style.display = 'flex';
      sidebar.style.flexDirection = 'column';
      sidebar.style.padding = '36px 24px';
      sidebar.style.boxSizing = 'border-box';
      
      // Configure content area
      content.style.flex = '1';
      content.style.width = 'calc(794px - 250px)';
      content.style.maxWidth = 'calc(794px - 250px)';
      content.style.minHeight = '1000px';
      content.style.padding = '48px 44px 46px 44px';
      content.style.boxSizing = 'border-box';
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
    } else {
      // Single column layout
      resumeContainer.style.padding = '20px';
    }
  }

  // Handle any flex containers that might compress content
  // But preserve flex for navy-column-modern template's main container
  const flexContainers = element.querySelectorAll('[style*="display: flex"], .flex, .d-flex');
  flexContainers.forEach((container: HTMLElement) => {
    // Don't change display for resume-container if it has sidebar (navy-column-modern)
    if (container.classList.contains('resume-container') && container.querySelector('.sidebar')) {
      // Keep flex for two-column layout
      container.style.display = 'flex';
    } else {
      container.style.display = 'block';
    }
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
 * Generate a darker shade of the given color for borders
 */
const getDarkerShade = (color: string): string => {
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
 * Additional optimization specifically for navy-column-modern template
 */
const optimizeNavyColumnModernForPDF = (clonedDoc: Document, templateColor: string = '#315389'): void => {
  const resumeContainer = clonedDoc.querySelector('.resume-container') as HTMLElement;
  const sidebar = clonedDoc.querySelector('.sidebar') as HTMLElement;
  const content = clonedDoc.querySelector('.content') as HTMLElement;
  
  // Generate darker shade for border
  const borderColor = getDarkerShade(templateColor);
  
  console.log('PDF Export - Using template color:', templateColor);
  console.log('PDF Export - Using border color:', borderColor);
  console.log('PDF Export - Found sidebar element:', !!sidebar);
  console.log('PDF Export - Found resume container:', !!resumeContainer);
  
  // Try alternative selectors if primary ones fail
  const allSidebars = clonedDoc.querySelectorAll('.sidebar, [class*="sidebar"]');
  console.log('PDF Export - Found sidebar elements:', allSidebars.length);
  
  // Apply color to all potential sidebar elements
  allSidebars.forEach((sidebarEl: HTMLElement, index) => {
    console.log(`PDF Export - Applying color to sidebar ${index + 1}`);
    sidebarEl.style.setProperty('background', templateColor, 'important');
    sidebarEl.style.setProperty('background-color', templateColor, 'important');
    sidebarEl.style.setProperty('color', '#fff', 'important');
    (sidebarEl.style as any).webkitPrintColorAdjust = 'exact';
    (sidebarEl.style as any).colorAdjust = 'exact';
    sidebarEl.style.printColorAdjust = 'exact';
  });
  
  // Backend CSS is applied before PDF generation in the main export function
  // This onclone function now only handles DOM optimizations
  console.log('PDF Export - Optimizing cloned document for navy-column-modern template');
  
  // Add PDF-specific optimizations
  const pdfOptimizationStyles = clonedDoc.createElement('style');
  pdfOptimizationStyles.setAttribute('data-pdf-optimizations', 'true');
  pdfOptimizationStyles.textContent = `
    /* Remove problematic pseudo-elements for PDF */
    .sidebar::after,
    .sidebar::before,
    div.sidebar::after,
    div.sidebar::before {
      display: none !important;
      content: none !important;
    }
    
    /* Ensure sidebar doesn't create page breaks */
    .sidebar {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: visible !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Ensure resume container doesn't overflow */
    .resume-container {
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  `;
  
  clonedDoc.head.appendChild(pdfOptimizationStyles);
  
  // Verify the CSS was applied
  const appliedStyles = clonedDoc.querySelector('style[data-resume-styles]');
  console.log('PDF Export - Centralized CSS applied:', !!appliedStyles);
  if (appliedStyles) {
    console.log('PDF Export - CSS contains color:', appliedStyles.textContent?.includes(templateColor));
  }
  
  // BRUTE FORCE: Find and replace any elements with default blue colors
  const defaultBlueColors = ['#315389', 'rgb(49, 83, 137)', 'rgb(49,83,137)'];
  const allElements = clonedDoc.querySelectorAll('*');
  
  allElements.forEach((element: HTMLElement) => {
    if (element.style) {
      // Check if element has default blue background in inline styles
      const inlineBackground = element.style.backgroundColor || element.style.background || '';
      const hasDefaultBlue = defaultBlueColors.some(color => 
        inlineBackground.includes(color)
      );
      
      // Also check class names that might indicate sidebar
      const isSidebarElement = (typeof element.className === 'string' && element.className.includes('sidebar')) || 
                              (element.classList && element.classList.contains('sidebar'));
      
      if (hasDefaultBlue || isSidebarElement) {
        console.log('PDF Export - Replacing background on element:', element.className || element.tagName);
        element.style.setProperty('background', templateColor, 'important');
        element.style.setProperty('background-color', templateColor, 'important');
        element.style.setProperty('color', '#ffffff', 'important');
        (element.style as any).webkitPrintColorAdjust = 'exact';
        (element.style as any).colorAdjust = 'exact';
        element.style.printColorAdjust = 'exact';
      }
    }
  });
  
  // Ensure proper container layout and dimensions
  if (resumeContainer) {
    resumeContainer.style.display = 'flex !important';
    resumeContainer.style.width = '794px !important';
    resumeContainer.style.maxWidth = '794px !important';
    resumeContainer.style.minHeight = '1123px !important'; // A4 height
    resumeContainer.style.position = 'relative !important';
    resumeContainer.style.overflow = 'visible !important';
    resumeContainer.style.boxSizing = 'border-box !important';
    // Add padding to prevent border cutoff
    resumeContainer.style.paddingRight = '4px !important';
  }
  
  // Optimize sidebar with proper border handling
  if (sidebar) {
    // Apply background color with maximum specificity
    sidebar.style.setProperty('background', templateColor, 'important');
    sidebar.style.setProperty('background-color', templateColor, 'important');
    sidebar.style.setProperty('color', '#fff', 'important');
    
    // Use box-shadow instead of border to prevent cutoff issues
    sidebar.style.borderRight = 'none !important';
    sidebar.style.boxShadow = `inset -4px 0 0 0 ${borderColor} !important`;
    sidebar.style.position = 'relative !important';
    sidebar.style.zIndex = '1 !important';
    sidebar.style.width = '280px !important';
    sidebar.style.minWidth = '280px !important';
    sidebar.style.flexShrink = '0 !important';
    sidebar.style.boxSizing = 'border-box !important';
    sidebar.style.overflow = 'visible !important';
    
    // Ensure color preservation
    (sidebar.style as any).webkitPrintColorAdjust = 'exact';
    (sidebar.style as any).colorAdjust = 'exact';
    sidebar.style.printColorAdjust = 'exact';
    
    // Force remove any existing background classes or styles that might override
    sidebar.removeAttribute('class');
    sidebar.className = 'sidebar';
    
    // Apply inline styles to override any CSS
    sidebar.setAttribute('style', 
      `background: ${templateColor} !important; ` +
      `background-color: ${templateColor} !important; ` +
      `color: #fff !important; ` +
      `border-right: none !important; ` +
      `box-shadow: inset -4px 0 0 0 ${borderColor} !important; ` +
      `position: relative !important; ` +
      `z-index: 1 !important; ` +
      `width: 280px !important; ` +
      `min-width: 280px !important; ` +
      `flex-shrink: 0 !important; ` +
      `box-sizing: border-box !important; ` +
      `overflow: visible !important; ` +
      `-webkit-print-color-adjust: exact !important; ` +
      `color-adjust: exact !important; ` +
      `print-color-adjust: exact !important;`
    );
    
    // Centralized CSS is already applied above - no need for additional CSS injection
  }
  
  // Optimize content area
  if (content) {
    content.style.flex = '1 !important';
    content.style.minWidth = '0 !important';
    content.style.padding = '20px !important';
    content.style.boxSizing = 'border-box !important';
    content.style.overflow = 'visible !important';
    content.style.pageBreakInside = 'avoid !important';
    
    // Ensure proper text wrapping and spacing
    content.style.wordWrap = 'break-word !important';
    content.style.overflowWrap = 'break-word !important';
  }
  
  // Fix page break issues for better content distribution
  const sections = clonedDoc.querySelectorAll('.content > div, .content > section');
  sections.forEach((section: HTMLElement, index) => {
    if (section.style) {
      section.style.pageBreakInside = 'avoid !important';
      section.style.breakInside = 'avoid !important';
      
      // Add spacing between sections
      if (index > 0) {
        section.style.marginTop = '15px !important';
      }
    }
  });
  
  // Fix any color issues in sidebar elements
  const sidebarElements = clonedDoc.querySelectorAll('.sidebar *');
  sidebarElements.forEach((el: HTMLElement) => {
    if (el.style) {
      (el.style as any).webkitPrintColorAdjust = 'exact';
      (el.style as any).colorAdjust = 'exact';
      el.style.printColorAdjust = 'exact';
      
      // Ensure text is visible
      if (el.tagName.toLowerCase() === 'h1' || 
          el.tagName.toLowerCase() === 'h2' || 
          el.tagName.toLowerCase() === 'h3' ||
          el.classList.contains('text-white') ||
          el.classList.contains('sidebar-text')) {
        el.style.color = '#ffffff !important';
      }
    }
  });
  
  // Add specific styles for better PDF rendering
  const pdfStyles = clonedDoc.createElement('style');
  pdfStyles.textContent = `
    @media print {
      .resume-container {
        width: 794px !important;
        max-width: 794px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      
      .sidebar,
      div.sidebar,
      .resume-container .sidebar,
      .resume-container div.sidebar {
        background: ${templateColor} !important;
        background-color: ${templateColor} !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Ensure all sidebar elements are white */
      .sidebar *,
      .sidebar h1,
      .sidebar h2, 
      .sidebar h3,
      .sidebar p,
      .sidebar div,
      .sidebar span {
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .content {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      .content > div,
      .content > section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
    
    /* Ensure proper layout for HTML export */
    .resume-container {
      display: flex !important;
      width: 794px !important;
      max-width: 794px !important;
      min-height: 1123px !important;
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box !important;
    }
    
    .sidebar,
    div.sidebar,
    .resume-container .sidebar,
    .resume-container div.sidebar {
      width: 280px !important;
      min-width: 280px !important;
      flex-shrink: 0 !important;
      background: ${templateColor} !important;
      background-color: ${templateColor} !important;
      color: #ffffff !important;
      position: relative !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Ensure all sidebar text is white */
    .sidebar *,
    .sidebar h1,
    .sidebar h2,
    .sidebar h3,
    .sidebar p,
    .sidebar div,
    .sidebar span,
    .sidebar li {
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .sidebar::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 4px;
      background: ${borderColor} !important;
      z-index: 2;
    }
    
    .content {
      flex: 1 !important;
      min-width: 0 !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      background: white !important;
    }
  `;
  clonedDoc.head.appendChild(pdfStyles);
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
    /* --- TECH MINIMALIST TEMPLATE OVERRIDES --- */
    .container {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
      background: #fff !important;
      color: #1a202c !important;
      max-width: 8.5in !important;
      min-height: 11in !important;
      padding: 1in !important;
    }
    .terminal-header {
      background: #2d3748 !important;
      color: #68d391 !important;
      font-family: monospace !important;
    }
    .terminal-content {
      background: #1a202c !important;
      color: #e2e8f0 !important;
      font-family: monospace !important;
    }
    .name-display {
      color: #fbb6ce !important;
    }
    .title-display {
      color: #90cdf4 !important;
    }
    .contact-display {
      color: #faf089 !important;
    }
    .section-header {
      color: #059669 !important;
      background: #f7fafc !important;
      font-family: monospace !important;
    }
    .code-block {
      background: #f7fafc !important;
      font-family: monospace !important;
    }
    .function-signature {
      color: #805ad5 !important;
    }
    .comment {
      color: #718096 !important;
    }
    .variable {
      color: #d69e2e !important;
    }
    .string {
      color: #38a169 !important;
    }
    .keyword {
      color: #3182ce !important;
    }
    .experience-item, .education-item, .project-item {
      background: #f8f9fa !important;
      border-left: 4px solid #e2e8f0 !important;
    }
    .item-title {
      color: #2d3748 !important;
    }
    .item-meta {
      color: #718096 !important;
    }
    .skills-grid {
      background: none !important;
    }
    .skill-category {
      background: #edf2f7 !important;
      border-left: 3px solid #059669 !important;
    }
    .skill-list {
      color: #4a5568 !important;
    }
    /* Prevent page breaks inside important blocks for tech-minimalist */
    .section, .experience-item, .education-item, .project-item, .certification-item, .reference-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-decoration-break: clone !important;
      background: #fff !important;
      padding-bottom: 48px !important;
      margin-bottom: 48px !important;
    }
    /* Add extra white background to all pages */
    body, .container {
      background: #fff !important;
    }
    /* Add a visible gap between items to reduce cut-off */
    .experience-item, .education-item, .project-item, .certification-item, .reference-item {
      border-bottom: 12px solid #fff !important;
    }
    @media print {
      .container {
        max-width: none !important;
        padding: 0.5in !important;
      }
    }
    /* --- END TECH MINIMALIST OVERRIDES --- */
    
    /* --- NAVY COLUMN MODERN TEMPLATE OVERRIDES --- */
    .resume-container {
      display: flex !important;
      max-width: 794px !important;
      width: 794px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }
    
    .sidebar {
      width: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
      min-height: 1000px !important;
      padding: 36px 24px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      /* Ensure the sidebar background and border are preserved */
      background: #315389 !important;
      color: #fff !important;
      border-right: 2px solid #2a4a73 !important;
    }
    
    .content {
      flex: 1 !important;
      padding: 48px 44px 46px 44px !important;
      color: #272d3a !important;
      background: #fff !important;
      min-height: 1000px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      width: calc(794px - 250px) !important;
      max-width: calc(794px - 250px) !important;
    }
    
    /* Ensure proper spacing and layout for navy-column-modern */
    .sidebar-section {
      margin-bottom: 36px !important;
      width: 100% !important;
    }
    
    .sidebar-section-title {
      font-size: 17px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 1.2px !important;
      margin-bottom: 10px !important;
      color: #e6eaf5 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
      padding-bottom: 4px !important;
    }
    
    .sidebar-details {
      font-size: 14px !important;
      line-height: 1.7 !important;
      word-break: break-word !important;
      color: #fff !important;
    }
    
    .sidebar-skills-list {
      list-style: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    
    .sidebar-skills-list li {
      font-size: 13.5px !important;
      font-weight: 400 !important;
      color: #e6eaf5 !important;
      margin-bottom: 7px !important;
      border-left: 4px solid rgba(255, 255, 255, 0.4) !important;
      padding-left: 7px !important;
    }
    
    .photo, .photo-placeholder {
      width: 72px !important;
      height: 72px !important;
      border-radius: 50% !important;
      margin-bottom: 20px !important;
      border: 3px solid #f1f3fa !important;
      background: #fff !important;
      flex-shrink: 0 !important;
    }
    
    .photo-placeholder {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 24px !important;
      font-weight: bold !important;
      color: #315389 !important;
    }
    
    /* Content area styling for navy-column-modern */
    .content h1 {
      font-size: 2.04rem !important;
      font-weight: 700 !important;
      color: #21355e !important;
      letter-spacing: 0.5px !important;
      margin: 0 0 2px 0 !important;
      line-height: 1.1 !important;
    }
    
    .content h2 {
      font-size: 1.29rem !important;
      font-weight: 700 !important;
      margin: 32px 0 13px 0 !important;
      color: #315389 !important;
      border-bottom: 2px solid #f1f3fa !important;
      padding-bottom: 2px !important;
    }
    
    .content .title {
      font-size: 1.13rem !important;
      color: #315389 !important;
      font-weight: 500 !important;
      margin-bottom: 22px !important;
    }
    
    .employment-history-role {
      font-weight: bold !important;
      font-size: 1.07rem !important;
      color: #193461 !important;
      margin-bottom: 2px !important;
    }
    
    .employment-history-company {
      font-weight: 400 !important;
      color: #293e60 !important;
    }
    
    .employment-history-dates {
      font-size: 0.94rem !important;
      color: #749ed9 !important;
      margin-bottom: 2px !important;
      font-weight: 400 !important;
    }
    
    .education-degree {
      font-weight: 700 !important;
      font-size: 1.05rem !important;
      color: #22396e !important;
    }
    
    .education-institution {
      font-size: 1.01rem !important;
      margin-bottom: 2px !important;
      color: #385886 !important;
    }
    
    .education-dates {
      font-size: 0.98rem !important;
      color: #738dab !important;
      margin-bottom: 4px !important;
    }
    
    /* Prevent page breaks in critical sections for navy-column-modern */
    .sidebar, .content {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .employment-section, .education-section, .profile-section {
      margin-bottom: 22px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Ensure proper print colors for navy template */
    .sidebar, .sidebar * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* --- END NAVY COLUMN MODERN OVERRIDES --- */
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
  scaledWidth: number
): Promise<void> => {
  const contentHeight = pageHeight - config.margin.top - config.margin.bottom;
  const canvasHeight = canvas.height;
  const canvasWidth = canvas.width;
  const scale = config.scale;
  const contentWidth = pageWidth - config.margin.left - config.margin.right;
  const scaledHeight = (canvasHeight / config.scale) * (contentWidth / (canvasWidth / config.scale));

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
