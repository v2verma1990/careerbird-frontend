import { exportResumeAsSimplePDF } from './simplePdfExport';
import { exportResumeAsBackendPDF } from './backendPdfExport';
import { exportResumeAsEnterprisePDF, validateResumeData, sanitizeResumeData } from './enterprisePdfExport';
import { exportResumeAsWorkingPDF } from './workingPdfExport';
import { exportPDFFromPreview } from './simpleWorkingPdfExport';
import { exportModernExecutiveAsPDF, ModernExecutivePDFOptions } from './modernExecutiveExport';
import { exportNavyColumnModernAsPDF, NavyColumnModernPDFOptions } from './navyColumnModernExport';
import { exportGenericTemplateAsPDF, GenericTemplatePDFOptions } from './genericTemplateExport';
import { enterprisePdfService } from '../../services/enterprisePdfService';

/**
 * ENTERPRISE PDF EXPORT OPTIONS
 * Simplified for backend-only generation - only essential options needed
 */
export interface PDFExportOptions {
  /** Template ID to use for PDF generation */
  templateId?: string;
  /** Color theme for the template (hex format: #RRGGBB) */
  templateColor?: string;
  /** Resume data object (if not provided, will extract from DOM element) */
  resumeData?: any;
}

/**
 * LEGACY PDF EXPORT OPTIONS
 * @deprecated Use PDFExportOptions instead. These frontend-specific options are no longer needed.
 * Kept for backward compatibility but ignored in enterprise mode.
 */
export interface LegacyPDFExportOptions extends PDFExportOptions {
  /** @deprecated Backend handles format automatically based on template */
  format?: 'a4' | 'letter';
  /** @deprecated Backend handles orientation automatically based on template */
  orientation?: 'portrait' | 'landscape';
  /** @deprecated Frontend html2canvas concept, not applicable to backend generation */
  quality?: number;
  /** @deprecated Frontend html2canvas concept, not applicable to backend generation */
  scale?: number;
  /** @deprecated Backend handles margins automatically based on template design */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** @deprecated Frontend html2canvas concept, not applicable to backend generation */
  includeBackground?: boolean;
  /** @deprecated Frontend html2canvas concept, not applicable to backend generation */
  optimizeForPrint?: boolean;
}

/**
 * ENTERPRISE-GRADE PDF EXPORT FUNCTION
 * 100% BACKEND-ONLY GENERATION - Ensures identical preview and PDF
 * NO FRONTEND FALLBACK to guarantee consistency
 */
export const exportResumeAsPDF = async (
  elementId: string,
  filename: string = 'resume',
  options: PDFExportOptions = {}
): Promise<void> => {
  const templateId = options.templateId || 'modern-executive';
  const templateColor = options.templateColor || getDefaultTemplateColor(templateId);
  
  console.log('ENTERPRISE PDF Export - Template:', templateId, 'Color:', templateColor);
  console.log('ENTERPRISE PDF Export - BACKEND-ONLY MODE: Ensuring 100% identical preview and PDF');
  
  // Log any deprecated options being used
  const legacyOptions = options as LegacyPDFExportOptions;
  if (legacyOptions.format || legacyOptions.quality || legacyOptions.scale || legacyOptions.margin) {
    console.warn('ENTERPRISE PDF Export - Deprecated options detected and will be ignored:', {
      format: legacyOptions.format,
      quality: legacyOptions.quality,
      scale: legacyOptions.scale,
      margin: legacyOptions.margin,
      includeBackground: legacyOptions.includeBackground,
      optimizeForPrint: legacyOptions.optimizeForPrint
    });
    console.warn('ENTERPRISE PDF Export - Backend handles all formatting automatically for consistency');
  }
  
  // Validate template configuration
  if (!enterprisePdfService.validateTemplate(templateId, templateColor)) {
    throw new Error(`Invalid template configuration: ${templateId} with color ${templateColor}`);
  }
  
  try {
    // Use Enterprise PDF Service for guaranteed consistency
    await enterprisePdfService.generateAndDownloadPDF({
      templateId,
      templateColor,
      filename,
      resumeData: options.resumeData,
      elementId: options.resumeData ? undefined : elementId // Only extract from DOM if no data provided
    });
    
    console.log('ENTERPRISE PDF Export - Success! Text-based PDF generated and downloaded');
    
  } catch (error) {
    console.error('ENTERPRISE PDF Export - Failed:', error);
    
    // Check if it's the backend PDF endpoint not implemented error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Backend PDF endpoint not implemented') || 
        errorMessage.includes('PDF generation failed: Backend PDF endpoint not implemented') ||
        errorMessage.includes('404') || 
        errorMessage.includes('Not Found') || 
        errorMessage.includes('generate-pdf')) {
      
      // Throw a specific error that suggests using the machine generation option
      throw new Error('Backend PDF generation failed. Please try the "Generate PDF on Machine" option for an alternative download method.');
    }
    
    // For other errors, throw the original formatted error
    throw error;
  }
};

/**
 * FALLBACK PDF EXPORT FUNCTION
 * Uses frontend-based PDF generation when backend is not available
 * This is a separate option for users when primary download fails
 */
export const exportResumeAsFallbackPDF = async (
  elementId: string,
  filename: string = 'resume',
  options: PDFExportOptions = {}
): Promise<void> => {
  const templateId = options.templateId || 'modern-executive';
  const templateColor = options.templateColor || getDefaultTemplateColor(templateId);
  
  console.log('FALLBACK PDF Export - Template:', templateId, 'Color:', templateColor);
  console.log('FALLBACK PDF Export - Using frontend-based generation');
  
  try {
    // Use simple approach that directly uses the preview element (same styling)
    const result = await exportPDFFromPreview(
      templateId,
      templateColor,
      filename
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Fallback PDF export failed');
    }
    
    console.log('FALLBACK PDF Export - Success! Frontend-based PDF generated and downloaded');
    
  } catch (error) {
    console.error('FALLBACK PDF Export - Failed:', error);
    throw new Error(`Fallback PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get default color for each template
 */
const getDefaultTemplateColor = (templateId: string): string => {
  const colorMap: Record<string, string> = {
    'modern-executive': '#315389',
    'navy-column-modern': '#315389',
    'creative-designer': '#7c3aed',
    'tech-minimalist': '#18bc6b',
    'academic-scholar': '#666666',
    'startup-founder': '#ff9800',
    'fresh-graduate': '#2196F3',
    'grey-classic-profile': '#666666',
    'blue-sidebar-profile': '#2196F3',
    'green-sidebar-receptionist': '#18bc6b',
    'classic-profile-orange': '#ff9800',
    'classic-law-bw': '#000000',
    'green-sidebar-customer-service': '#18bc6b'
  };
  
  return colorMap[templateId] || '#315389';
};

/**
 * DEPRECATED: Frontend PDF generation functions
 * These are kept for backward compatibility but should not be used in enterprise mode
 * They produce image-based PDFs that differ from the preview
 */

// Re-export individual exporters for direct use
export { 
  exportModernExecutiveAsPDF, 
  exportNavyColumnModernAsPDF, 
  exportGenericTemplateAsPDF,
  exportResumeAsEnterprisePDF,
  exportResumeAsBackendPDF,
  exportResumeAsWorkingPDF,
  validateResumeData,
  sanitizeResumeData
};
export type { ModernExecutivePDFOptions, NavyColumnModernPDFOptions, GenericTemplatePDFOptions };