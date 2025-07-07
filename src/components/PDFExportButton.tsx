import React from 'react';
import { Button } from './ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useResumeExport } from '../hooks/use-pdf-export';
import { cn } from '../lib/utils';

interface PDFExportButtonProps {
  resumeElementId?: string;
  candidateName?: string;
  resumeData?: any;
  templateColor?: string;
  templateId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  highQuality?: boolean;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  resumeElementId = 'resume-preview',
  candidateName = 'resume',
  resumeData,
  templateColor,
  templateId,
  variant = 'default',
  size = 'default',
  className,
  children,
  highQuality = false,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const { exportResume, exportResumeHighQuality, exportResumeFallback, isExporting } = useResumeExport();

  const handleExport = async () => {
    try {
      onExportStart?.();
      
      if (highQuality) {
        await exportResumeHighQuality(resumeElementId, candidateName, resumeData, templateColor, templateId);
      } else {
        await exportResume(resumeElementId, candidateName, resumeData, templateColor, templateId);
      }
      
      onExportComplete?.();
    } catch (error) {
      onExportError?.(error as Error);
    }
  };

  const isDisabled = disabled || isExporting;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleExport}
      disabled={isDisabled}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {children || (isExporting ? 'Generating PDF...' : 'Download PDF')}
    </Button>
  );
};

// Specialized components for different use cases
export const ResumeDownloadButton: React.FC<Omit<PDFExportButtonProps, 'children'>> = (props) => (
  <PDFExportButton {...props}>
    <FileText className="h-4 w-4 mr-2" />
    Download Resume
  </PDFExportButton>
);

export const QuickExportButton: React.FC<Omit<PDFExportButtonProps, 'children' | 'variant' | 'size'>> = (props) => (
  <PDFExportButton {...props} variant="outline" size="sm">
    Export PDF
  </PDFExportButton>
);

export const HighQualityExportButton: React.FC<Omit<PDFExportButtonProps, 'children' | 'highQuality'>> = (props) => (
  <PDFExportButton {...props} highQuality={true}>
    <Download className="h-4 w-4 mr-2" />
    Download High Quality PDF
  </PDFExportButton>
);

// Generate PDF on Machine Button (Print Dialog Approach)
interface GeneratePDFOnMachineButtonProps extends Omit<PDFExportButtonProps, 'highQuality'> {}

export const GeneratePDFOnMachineButton: React.FC<GeneratePDFOnMachineButtonProps> = ({
  resumeElementId = 'resume-preview',
  candidateName = 'resume',
  resumeData,
  templateColor,
  templateId,
  variant = 'outline',
  size = 'default',
  className,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const { exportResumeFallback, isExporting } = useResumeExport();

  const handleMachineGeneration = async () => {
    try {
      onExportStart?.();
      await exportResumeFallback(resumeElementId, candidateName, resumeData, templateColor, templateId);
      onExportComplete?.();
    } catch (error) {
      onExportError?.(error as Error);
    }
  };

  const isDisabled = disabled || isExporting;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleMachineGeneration}
      disabled={isDisabled}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isExporting ? 'Generating PDF...' : 'Generate PDF on Machine'}
    </Button>
  );
};

// Export button with dropdown for multiple options
interface PDFExportDropdownProps {
  resumeElementId?: string;
  candidateName?: string;
  resumeData?: any;
  templateColor?: string;
  templateId?: string;
  className?: string;
}

export const PDFExportDropdown: React.FC<PDFExportDropdownProps> = ({
  resumeElementId,
  candidateName,
  resumeData,
  templateColor,
  templateId,
  className
}) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Primary Backend Download */}
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="default"
      >
        Download PDF
      </PDFExportButton>
      
      {/* High Quality Backend Download */}
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="outline"
        size="sm"
        highQuality={true}
      >
        Download High Quality PDF
      </PDFExportButton>
      
      {/* Machine Generation (Print Dialog) */}
      <GeneratePDFOnMachineButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="outline"
        size="sm"
      />
    </div>
  );
};

// Comprehensive PDF Export Component with Primary and Fallback options
interface ComprehensivePDFExportProps {
  resumeElementId?: string;
  candidateName?: string;
  resumeData?: any;
  templateColor?: string;
  templateId?: string;
  className?: string;
}

export const ComprehensivePDFExport: React.FC<ComprehensivePDFExportProps> = ({
  resumeElementId,
  candidateName,
  resumeData,
  templateColor,
  templateId,
  className
}) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Primary Backend Download */}
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="default"
        size="default"
      >
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </PDFExportButton>
      
      {/* High Quality Backend Download */}
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="outline"
        size="sm"
        highQuality={true}
      >
        <Download className="h-4 w-4 mr-2" />
        Download High Quality PDF
      </PDFExportButton>
      
      {/* Machine Generation (Print Dialog) */}
      <GeneratePDFOnMachineButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        templateId={templateId}
        variant="outline"
        size="sm"
      />
      
      {/* Help text */}
      <p className="text-xs text-gray-500 mt-1">
        Backend downloads are recommended. Use "Generate PDF on Machine" if backend downloads fail.
      </p>
    </div>
  );
};

export default PDFExportButton;