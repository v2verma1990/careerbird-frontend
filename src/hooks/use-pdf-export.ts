import { useState, useCallback } from 'react';
import { exportResumeAsPDF, PDFExportOptions } from '../utils/exportUtils';
import { exportResumeAsFallbackPDF } from '../utils/pdf-export';
import { useToast } from './use-toast';

/**
 * ENTERPRISE PDF EXPORT HOOK OPTIONS
 * Simplified for backend-only generation
 */
export interface UsePDFExportOptions extends PDFExportOptions {
  // DEPRECATED: These options are no longer needed in enterprise mode
  /** @deprecated Backend-only mode doesn't need API fallback */
  fallbackToAPI?: boolean;
  /** @deprecated Use resumeData instead */
  apiResumeData?: any;
}

export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportPDF = useCallback(async (
    elementId: string,
    filename: string = 'resume',
    options: UsePDFExportOptions = {}
  ) => {
    if (isExporting) {
      toast({
        title: "Export in progress",
        description: "Please wait for the current export to complete.",
        variant: "default"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Show loading toast for backend PDF generation
      toast({
        title: "Preparing PDF Export",
        description: "Generating PDF from backend server...",
        variant: "default"
      });

      // Try PDF generation
      await exportResumeAsPDF(elementId, filename, options);

      toast({
        title: "Success!",
        description: "Your PDF has been downloaded successfully from the backend server.",
        variant: "default"
      });

    } catch (frontendError) {
      console.error('PDF export failed:', frontendError);
      
      // Check if it's a usage limit error
      const errorMessage = frontendError instanceof Error ? frontendError.message : String(frontendError);
      const isUsageLimitError = errorMessage.includes('Usage limit reached');
      
      // Check if it's a fallback suggestion error
      const isFallbackSuggestion = errorMessage.includes('Please try the "Download PDF (Fallback)" option');
      
      toast({
        title: "Export Failed",
        description: isUsageLimitError 
          ? "You have reached your PDF export limit. Please upgrade your plan or try again later."
          : isFallbackSuggestion
          ? "Backend PDF generation failed. Please try the 'Generate PDF on Machine' button for an alternative download method."
          : "Unable to generate PDF. Please try the 'Generate PDF on Machine' button or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, toast]);

  const exportFallbackPDF = useCallback(async (
    elementId: string,
    filename: string = 'resume',
    options: UsePDFExportOptions = {}
  ) => {
    if (isExporting) {
      toast({
        title: "Export in progress",
        description: "Please wait for the current export to complete.",
        variant: "default"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Show loading toast for machine generation
      toast({
        title: "Preparing PDF Generation",
        description: "A print dialog will open shortly. Please save as PDF from the dialog.",
        variant: "default"
      });

      // Use fallback PDF generation
      await exportResumeAsFallbackPDF(elementId, filename, options);

      toast({
        title: "Print Dialog Opened!",
        description: "Please save as PDF from the print dialog that opened.",
        variant: "default"
      });

    } catch (fallbackError) {
      console.error('Fallback PDF export failed:', fallbackError);
      
      toast({
        title: "PDF Generation Failed",
        description: "Unable to open print dialog for PDF generation. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, toast]);

  const exportWithCustomOptions = useCallback(async (
    elementId: string,
    filename: string,
    customOptions: UsePDFExportOptions
  ) => {
    // ENTERPRISE MODE: Only essential options needed
    const defaultOptions: UsePDFExportOptions = {
      templateId: 'modern-executive',
      templateColor: '#315389'
      // Backend handles all formatting automatically
    };

    const mergedOptions = { ...defaultOptions, ...customOptions };
    
    // Warn about deprecated options
    if (customOptions.fallbackToAPI !== undefined || customOptions.apiResumeData) {
      console.warn('ENTERPRISE PDF Export - Deprecated options detected:', {
        fallbackToAPI: customOptions.fallbackToAPI,
        apiResumeData: customOptions.apiResumeData
      });
      console.warn('ENTERPRISE PDF Export - Use resumeData instead of apiResumeData');
    }
    
    await exportPDF(elementId, filename, mergedOptions);
  }, [exportPDF]);

  return {
    exportPDF,
    exportFallbackPDF,
    exportWithCustomOptions,
    isExporting
  };
};

// Specialized hook for resume export with predefined settings
export const useResumeExport = () => {
  const { exportPDF, exportFallbackPDF, isExporting } = usePDFExport();

  const exportResume = useCallback(async (
    resumeElementId: string = 'resume-preview',
    candidateName: string = 'resume',
    resumeData?: any,
    templateColor?: string,
    templateId?: string
  ) => {
    const filename = candidateName.toLowerCase().replace(/\s+/g, '_');
    
    // Ensure we have a valid color
    const finalColor = templateColor && templateColor !== 'undefined' && templateColor.trim() !== '' 
      ? templateColor 
      : '#315389';
    
    console.log('useResumeExport - Received template color:', templateColor);
    console.log('useResumeExport - Using final color:', finalColor);
    
    // ENTERPRISE MODE: Simplified options for backend-only generation
    const options: UsePDFExportOptions = {
      templateId: templateId || 'navy-column-modern',
      templateColor: finalColor,
      resumeData: resumeData
      // Backend handles all formatting, margins, quality automatically
    };
    
    console.log('useResumeExport - Final options with color:', options.templateColor);

    await exportPDF(resumeElementId, filename, options);
  }, [exportPDF]);

  const exportResumeHighQuality = useCallback(async (
    resumeElementId: string = 'resume-preview',
    candidateName: string = 'resume',
    resumeData?: any,
    templateColor?: string,
    templateId?: string
  ) => {
    const filename = `${candidateName.toLowerCase().replace(/\s+/g, '_')}_hq`;
    
    // Ensure we have a valid color
    const finalColor = templateColor && templateColor !== 'undefined' && templateColor.trim() !== '' 
      ? templateColor 
      : '#315389';
    
    // ENTERPRISE MODE: High-quality is default in backend generation
    const options: UsePDFExportOptions = {
      templateId: templateId || 'navy-column-modern',
      templateColor: finalColor,
      resumeData: resumeData
      // Backend automatically generates highest quality PDFs
    };

    await exportPDF(resumeElementId, filename, options);
  }, [exportPDF]);

  const exportResumeFallback = useCallback(async (
    resumeElementId: string = 'resume-preview',
    candidateName: string = 'resume',
    resumeData?: any,
    templateColor?: string,
    templateId?: string
  ) => {
    const filename = `${candidateName.toLowerCase().replace(/\s+/g, '_')}_fallback`;
    
    // Ensure we have a valid color
    const finalColor = templateColor && templateColor !== 'undefined' && templateColor.trim() !== '' 
      ? templateColor 
      : '#315389';
    
    console.log('useResumeExport - Fallback export with template color:', templateColor);
    console.log('useResumeExport - Using final color for fallback:', finalColor);
    
    // FALLBACK MODE: Simplified options for frontend-based generation
    const options: UsePDFExportOptions = {
      templateId: templateId || 'navy-column-modern',
      templateColor: finalColor,
      resumeData: resumeData
    };
    
    console.log('useResumeExport - Fallback options with color:', options.templateColor);

    await exportFallbackPDF(resumeElementId, filename, options);
  }, [exportFallbackPDF]);

  return {
    exportResume,
    exportResumeHighQuality,
    exportResumeFallback,
    isExporting
  };
};