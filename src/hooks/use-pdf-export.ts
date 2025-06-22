import { useState, useCallback } from 'react';
import { exportResumeAsPDF, exportResumeViaAPI, PDFExportOptions } from '../utils/exportUtils';
import { useToast } from './use-toast';

export interface UsePDFExportOptions extends PDFExportOptions {
  fallbackToAPI?: boolean;
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
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your resume...",
        variant: "default"
      });

      // Try frontend PDF generation first
      await exportResumeAsPDF(elementId, filename, options);

      toast({
        title: "Success!",
        description: "Your resume has been downloaded successfully.",
        variant: "default"
      });

    } catch (frontendError) {
      console.warn('Frontend PDF export failed:', frontendError);

      // Fallback to API if enabled and data is provided
      if (options.fallbackToAPI && options.apiResumeData) {
        try {
          toast({
            title: "Trying alternative method",
            description: "Generating PDF using server...",
            variant: "default"
          });

          await exportResumeViaAPI(options.apiResumeData, 'pdf', filename);

          toast({
            title: "Success!",
            description: "Your resume has been downloaded successfully.",
            variant: "default"
          });

        } catch (apiError) {
          console.error('API PDF export also failed:', apiError);
          
          toast({
            title: "Export Failed",
            description: "Unable to generate PDF. Please try again or contact support.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Export Failed",
          description: "Unable to generate PDF. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, toast]);

  const exportWithCustomOptions = useCallback(async (
    elementId: string,
    filename: string,
    customOptions: UsePDFExportOptions
  ) => {
    const defaultOptions: UsePDFExportOptions = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5, // Optimized for better multi-page handling
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      includeBackground: true,
      optimizeForPrint: true,
      fallbackToAPI: true
    };

    const mergedOptions = { ...defaultOptions, ...customOptions };
    await exportPDF(elementId, filename, mergedOptions);
  }, [exportPDF]);

  return {
    exportPDF,
    exportWithCustomOptions,
    isExporting
  };
};

// Specialized hook for resume export with predefined settings
export const useResumeExport = () => {
  const { exportPDF, isExporting } = usePDFExport();

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
    
    const options: UsePDFExportOptions = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.92,
      scale: 1.5, // Optimized for multi-page content
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      includeBackground: true,
      optimizeForPrint: true,
      fallbackToAPI: true,
      apiResumeData: resumeData,
      templateColor: finalColor,
      templateId: templateId || 'navy-column-modern'
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
    
    const options: UsePDFExportOptions = {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.95,
      scale: 2, // Higher quality for high-quality export
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      includeBackground: true,
      optimizeForPrint: true,
      fallbackToAPI: true,
      apiResumeData: resumeData,
      templateColor: finalColor,
      templateId: templateId || 'navy-column-modern'
    };

    await exportPDF(resumeElementId, filename, options);
  }, [exportPDF]);

  return {
    exportResume,
    exportResumeHighQuality,
    isExporting
  };
};