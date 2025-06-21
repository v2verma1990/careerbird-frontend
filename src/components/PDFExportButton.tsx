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
  const { exportResume, exportResumeHighQuality, isExporting } = useResumeExport();

  const handleExport = async () => {
    try {
      onExportStart?.();
      
      if (highQuality) {
        await exportResumeHighQuality(resumeElementId, candidateName, resumeData, templateColor);
      } else {
        await exportResume(resumeElementId, candidateName, resumeData, templateColor);
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

// Export button with dropdown for multiple options
interface PDFExportDropdownProps {
  resumeElementId?: string;
  candidateName?: string;
  resumeData?: any;
  templateColor?: string;
  className?: string;
}

export const PDFExportDropdown: React.FC<PDFExportDropdownProps> = ({
  resumeElementId,
  candidateName,
  resumeData,
  templateColor,
  className
}) => {
  const { exportResume, exportResumeHighQuality, isExporting } = useResumeExport();

  return (
    <div className={cn("flex gap-2", className)}>
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        variant="default"
      >
        Download PDF
      </PDFExportButton>
      
      <PDFExportButton
        resumeElementId={resumeElementId}
        candidateName={candidateName}
        resumeData={resumeData}
        templateColor={templateColor}
        variant="outline"
        size="sm"
        highQuality={true}
      >
        High Quality
      </PDFExportButton>
    </div>
  );
};

export default PDFExportButton;