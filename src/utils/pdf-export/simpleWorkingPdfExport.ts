/**
 * SIMPLE WORKING PDF EXPORT - Uses the exact same approach as preview
 * This directly uses the already-styled DOM element, just like the preview does
 */

import { frontendTemplateService } from '../../services/frontendTemplateService';

/**
 * Export PDF using the exact same styled element as the preview
 * This ensures 100% consistency between preview and download
 */
export const exportPDFFromPreview = async (
  templateId: string,
  color: string,
  filename: string = 'resume.pdf'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Simple PDF Export - Using preview element directly');

    // Apply template styles to the current page (same as preview)
    frontendTemplateService.applyTemplateStyles(templateId, color);
    
    // Wait for styles to be applied
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find the actual preview element that's already styled correctly
    const previewElement = document.getElementById('resume-preview-container');
    
    if (!previewElement) {
      throw new Error('Preview element not found. Please ensure the resume is loaded first.');
    }

    console.log('Simple PDF Export - Found preview element, extracting content');
    
    // Get the HTML content from the preview element
    const styledHTML = previewElement.innerHTML;
    
    // Get all stylesheets from the current page (same as preview uses)
    let allPageCSS = '';
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          if (sheet.cssRules) {
            for (let j = 0; j < sheet.cssRules.length; j++) {
              allPageCSS += sheet.cssRules[j].cssText + '\n';
            }
          }
        } catch (e) {
          // Skip CORS-blocked stylesheets
          console.warn('Skipping stylesheet due to CORS:', e);
        }
      }
    } catch (e) {
      console.warn('Error extracting stylesheets:', e);
    }

    // Get the computed CSS variables from the current page
    const rootStyles = getComputedStyle(document.documentElement);
    const templateColor = rootStyles.getPropertyValue('--template-color').trim();
    const templateColorRgb = rootStyles.getPropertyValue('--template-color-rgb').trim();

    console.log('Simple PDF Export - Extracted styles, opening print dialog');
    console.log('Simple PDF Export - Template color:', templateColor);

    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups and try again.');
    }

    // Write the HTML to the new window with the exact same styling as preview
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8">
          <style>
            /* Base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* CSS Variables - exact same as preview */
            :root {
              --template-color: ${templateColor || color || '#315389'} !important;
              --template-color-rgb: ${templateColorRgb || frontendTemplateService.hexToRgb(color || '#315389')} !important;
            }
            
            /* Container styling - same as preview */
            #resume-preview-container {
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              position: relative;
              padding: 1rem;
            }
            
            #resume-preview-container * {
              box-sizing: border-box;
            }
            
            /* All page CSS - includes template styles */
            ${allPageCSS}
            
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
                padding: 0 !important;
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

    return { success: true };

  } catch (error) {
    console.error('Simple PDF Export - Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};