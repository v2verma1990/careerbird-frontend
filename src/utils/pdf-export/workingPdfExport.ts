/**
 * WORKING PDF EXPORT - Uses only confirmed working endpoints
 * This approach uses the /resumebuilder/build endpoint which we know works
 */

import { resumeBuilderApi } from '../resumeBuilderApi';
import { frontendTemplateService } from '../../services/frontendTemplateService';

/**
 * Export PDF using only the working build endpoint
 * This will get the HTML and then we can either:
 * 1. Show user the HTML to print as PDF manually
 * 2. Use a different PDF generation approach
 * 3. Wait for backend PDF endpoint to be implemented
 */
export const exportResumeAsWorkingPDF = async (
  elementId: string,
  filename: string,
  templateId: string,
  color: string,
  resumeData?: any
): Promise<void> => {
  try {
    console.log('Working PDF Export - Using confirmed working endpoints only');
    console.log('Working PDF Export - Starting:', { elementId, filename, templateId, color });

    // Extract resume data if not provided
    let finalResumeData = resumeData;
    if (!finalResumeData) {
      finalResumeData = extractResumeDataFromDOM(elementId);
    }

    if (!finalResumeData) {
      throw new Error('No resume data available for PDF generation');
    }

    console.log('Working PDF Export - Using /resumebuilder/build endpoint');
    console.log('Working PDF Export - Resume data preview:', {
      hasAchievements: finalResumeData.achievements ? finalResumeData.achievements.length : 'No achievements property',
      achievementsData: finalResumeData.achievements
    });
    
    // Use the working build endpoint to get HTML
    const buildResult = await resumeBuilderApi.buildResume({
      resumeData: typeof finalResumeData === 'string' ? finalResumeData : JSON.stringify(finalResumeData),
      templateId: templateId,
      color: color
    });

    if (buildResult.error) {
      throw new Error(`Failed to build resume: ${buildResult.error}`);
    }

    if (!buildResult.data) {
      throw new Error('No data received from resume build');
    }

    // Extract HTML from the build result
    let html = '';
    if (typeof buildResult.data === 'string') {
      html = buildResult.data;
    } else if (buildResult.data.html) {
      html = buildResult.data.html;
    } else {
      throw new Error('Invalid response format from resume build');
    }

    console.log('Working PDF Export - Got HTML from backend, opening print dialog');
    console.log('Working PDF Export - HTML preview (first 500 chars):', html.substring(0, 500));
    console.log('Working PDF Export - Checking for achievements section:', html.includes('achievement') ? 'FOUND' : 'NOT FOUND');
    console.log('Working PDF Export - Checking for profile section:', html.includes('profile') ? 'FOUND' : 'NOT FOUND');
    console.log('Working PDF Export - Checking for employment section:', html.includes('employment') ? 'FOUND' : 'NOT FOUND');

    // TEMPORARY SOLUTION: Open print dialog for user to save as PDF
    // This ensures they get the exact same content as the preview
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups and try again.');
    }

    // Apply template styles to the current page FIRST (same as preview)
    frontendTemplateService.applyTemplateStyles(templateId, color);
    
    // Wait for styles to be applied
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find the actual preview element that's already styled correctly
    const previewElement = document.getElementById('resume-preview-container');
    let styledHTML = html;
    let inlineStyles = '';
    
    if (previewElement) {
      // Use the actual styled HTML from the preview
      styledHTML = previewElement.innerHTML;
      
      // Extract all computed styles from the preview element and its children
      const extractComputedStyles = (element: Element, selector: string = ''): string => {
        let styles = '';
        const computedStyle = window.getComputedStyle(element);
        
        // Get all computed CSS properties
        const cssText = Array.from(computedStyle).map(prop => 
          `${prop}: ${computedStyle.getPropertyValue(prop)}`
        ).join('; ');
        
        if (cssText) {
          const elementSelector = selector || element.tagName.toLowerCase() + 
            (element.className ? '.' + element.className.split(' ').join('.') : '') +
            (element.id ? '#' + element.id : '');
          styles += `${elementSelector} { ${cssText} }\n`;
        }
        
        // Recursively get styles for children
        Array.from(element.children).forEach((child, index) => {
          const childSelector = `${selector} > ${child.tagName.toLowerCase()}:nth-child(${index + 1})`;
          styles += extractComputedStyles(child, childSelector);
        });
        
        return styles;
      };
      
      inlineStyles = extractComputedStyles(previewElement, '#resume-preview-container');
      console.log('Working PDF Export - Extracted computed styles from preview element');
    } else {
      console.log('Working PDF Export - Preview element not found, using backend HTML');
    }

    // Write the HTML to the new window with EXACT same styling as preview
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8">
          <style>
            /* Base styles - same as preview */
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* CSS Variables for dynamic colors - EXACT same as preview */
            :root {
              --template-color: ${color || '#315389'} !important;
              --template-color-rgb: ${frontendTemplateService.hexToRgb(color || '#315389')} !important;
            }
            
            /* Container styling - same as preview */
            #resume-preview-container {
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              position: relative;
            }
            
            #resume-preview-container * {
              box-sizing: border-box;
            }
            
            /* Ensure two-column layouts work properly - same as preview */
            #resume-preview-container .resume-container {
              display: flex !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            
            #resume-preview-container .sidebar {
              flex-shrink: 0 !important;
              width: 30% !important;
              display: block !important;
            }
            
            #resume-preview-container .content {
              flex: 1 !important;
              width: 70% !important;
              display: block !important;
            }
            
            /* Computed styles from preview element - EXACT same as preview */
            ${inlineStyles}
            
            /* Print specific overrides */
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              @page { 
                margin: 0.5in;
                size: A4;
              }
              #resume-preview-container {
                box-shadow: none !important;
                margin: 0 !important;
              }
            }
          </style>
        </head>
        <body class="${templateId}">
          <div id="resume-preview-container" class="resume-preview-container template-transition ${templateId}">
            ${styledHTML}
          </div>
          <script>
            window.onload = function() {
              // Small delay to ensure styles are applied
              setTimeout(function() {
                window.print();
                // Close window after printing (optional)
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();

    console.log('Working PDF Export - Print dialog opened. User can save as PDF.');
    
    // Show instructions to user
    alert(`
      PDF Generation Instructions:
      
      1. A print dialog has opened
      2. Select "Save as PDF" as the destination
      3. Choose your filename: ${filename}.pdf
      4. Click "Save"
      
      This ensures your PDF is identical to the preview!
    `);

  } catch (error) {
    console.error('Working PDF Export - Error:', error);
    throw error;
  }
};

/**
 * Extract resume data from DOM element
 */
const extractResumeDataFromDOM = (elementId: string): any => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID '${elementId}' not found`);
  }

  console.log('Working PDF Export - Extracting data from DOM element:', elementId);

  const extractedData: any = {};

  try {
    // Extract basic information
    const nameElement = element.querySelector('[data-field="name"], .name, .candidate-name, h1') as HTMLElement;
    if (nameElement) {
      extractedData.name = nameElement.textContent?.trim() || '';
    }

    const titleElement = element.querySelector('[data-field="title"], .title, .job-title, .position') as HTMLElement;
    if (titleElement) {
      extractedData.title = titleElement.textContent?.trim() || '';
    }

    const emailElement = element.querySelector('[data-field="email"], .email, [href^="mailto:"]') as HTMLElement;
    if (emailElement) {
      extractedData.email = emailElement.textContent?.trim() || emailElement.getAttribute('href')?.replace('mailto:', '') || '';
    }

    const phoneElement = element.querySelector('[data-field="phone"], .phone, [href^="tel:"]') as HTMLElement;
    if (phoneElement) {
      extractedData.phone = phoneElement.textContent?.trim() || phoneElement.getAttribute('href')?.replace('tel:', '') || '';
    }

    const locationElement = element.querySelector('[data-field="location"], .location, .address') as HTMLElement;
    if (locationElement) {
      extractedData.location = locationElement.textContent?.trim() || '';
    }

    const summaryElement = element.querySelector('[data-field="summary"], .summary, .profile, .about') as HTMLElement;
    if (summaryElement) {
      extractedData.summary = summaryElement.textContent?.trim() || '';
    }

    // Generate initials if name is available
    if (extractedData.name) {
      const names = extractedData.name.trim().split(/\s+/).filter(n => n.length > 0);
      if (names.length > 0) {
        if (names.length === 1) {
          extractedData.initials = names[0].substring(0, 2).toUpperCase();
        } else {
          extractedData.initials = names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        }
      }
    }

    console.log('Working PDF Export - Extracted data:', extractedData);
    return extractedData;

  } catch (error) {
    console.error('Working PDF Export - Data extraction failed:', error);
    throw new Error(`Failed to extract resume data from DOM: ${error}`);
  }
};