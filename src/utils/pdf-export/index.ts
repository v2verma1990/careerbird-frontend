import { exportResumeAsSimplePDF } from './simplePdfExport';
import { exportModernExecutiveAsPDF, ModernExecutivePDFOptions } from './modernExecutiveExport';
import { exportNavyColumnModernAsPDF, NavyColumnModernPDFOptions } from './navyColumnModernExport';

export interface PDFExportOptions {
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
  resumeData?: any;
}

/**
 * Main PDF export function that routes to the appropriate template-specific exporter
 */
export const exportResumeAsPDF = async (
  elementId: string,
  filename: string = 'resume',
  options: PDFExportOptions = {}
): Promise<void> => {
  const templateId = options.templateId || 'modern-executive';
  
  console.log('PDF Export Router - Template:', templateId, 'Options:', options);
  
  try {
    switch (templateId) {
      case 'modern-executive':
        // Use frontend-based PDF generation (same as navy-column-modern)
        await exportModernExecutiveAsPDF(elementId, filename, options as ModernExecutivePDFOptions);
        break;
        
      case 'navy-column-modern':
        await exportNavyColumnModernAsPDF(elementId, filename, options as NavyColumnModernPDFOptions);
        break;
        
      default:
        console.warn(`PDF Export - Unknown template: ${templateId}, falling back to simple PDF export`);
        await exportResumeAsSimplePDF(
          elementId, 
          filename, 
          templateId, 
          options.templateColor || '#22c55e',
          options.resumeData
        );
        break;
    }
  } catch (error) {
    console.error(`PDF Export failed for template ${templateId}:`, error);
    throw error;
  }
};

// Re-export individual exporters for direct use
export { exportModernExecutiveAsPDF, exportNavyColumnModernAsPDF };
export type { ModernExecutivePDFOptions, NavyColumnModernPDFOptions };