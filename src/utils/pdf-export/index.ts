import { exportResumeAsSimplePDF } from './simplePdfExport';
import { exportModernExecutiveAsPDF, ModernExecutivePDFOptions } from './modernExecutiveExport';
import { exportNavyColumnModernAsPDF, NavyColumnModernPDFOptions } from './navyColumnModernExport';
import { exportGenericTemplateAsPDF, GenericTemplatePDFOptions } from './genericTemplateExport';

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
        
      case 'creative-designer':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'creative-designer',
          templateColor: options.templateColor || '#7c3aed'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'tech-minimalist':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'tech-minimalist',
          templateColor: options.templateColor || '#18bc6b'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'academic-scholar':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'academic-scholar',
          templateColor: options.templateColor || '#666666'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'startup-founder':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'startup-founder',
          templateColor: options.templateColor || '#ff9800'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'fresh-graduate':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'fresh-graduate',
          templateColor: options.templateColor || '#2196F3'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'grey-classic-profile':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'grey-classic-profile',
          templateColor: options.templateColor || '#666666'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'blue-sidebar-profile':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'blue-sidebar-profile',
          templateColor: options.templateColor || '#2196F3'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'green-sidebar-receptionist':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'green-sidebar-receptionist',
          templateColor: options.templateColor || '#18bc6b'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'classic-profile-orange':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'classic-profile-orange',
          templateColor: options.templateColor || '#ff9800'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'classic-law-bw':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'classic-law-bw',
          templateColor: options.templateColor || '#000000'
        } as GenericTemplatePDFOptions);
        break;
        
      case 'green-sidebar-customer-service':
        await exportGenericTemplateAsPDF(elementId, filename, {
          ...options,
          templateId: 'green-sidebar-customer-service',
          templateColor: options.templateColor || '#18bc6b'
        } as GenericTemplatePDFOptions);
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
export { exportModernExecutiveAsPDF, exportNavyColumnModernAsPDF, exportGenericTemplateAsPDF };
export type { ModernExecutivePDFOptions, NavyColumnModernPDFOptions, GenericTemplatePDFOptions };