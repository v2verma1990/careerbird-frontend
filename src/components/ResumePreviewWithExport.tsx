import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { PDFExportButton, PDFExportDropdown } from './PDFExportButton';
import { Eye, Download, Settings } from 'lucide-react';

interface ResumePreviewWithExportProps {
  resumeData: any;
  templateHtml: string;
  candidateName?: string;
  onPreviewModeChange?: (isPreviewMode: boolean) => void;
}

export const ResumePreviewWithExport: React.FC<ResumePreviewWithExportProps> = ({
  resumeData,
  templateHtml,
  candidateName = 'Resume',
  onPreviewModeChange
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);

  // Prepare the resume for PDF export by ensuring proper styling
  useEffect(() => {
    if (previewRef.current) {
      // Add PDF-friendly styles
      const style = document.createElement('style');
      style.textContent = `
        #resume-preview-container {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-shadow: ${isPreviewMode ? 'none' : '0 0 10px rgba(0,0,0,0.1)'};
          position: relative;
        }
        
        #resume-preview-container * {
          box-sizing: border-box;
        }
        
        /* Ensure two-column layouts work properly */
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
        
        /* Print-friendly styles */
        @media print {
          #resume-preview-container {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('resume-preview-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      style.id = 'resume-preview-styles';
      document.head.appendChild(style);
      
      return () => {
        const styleToRemove = document.getElementById('resume-preview-styles');
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, [isPreviewMode]);

  const togglePreviewMode = () => {
    const newPreviewMode = !isPreviewMode;
    setIsPreviewMode(newPreviewMode);
    onPreviewModeChange?.(newPreviewMode);
  };

  return (
    <div className="w-full">
      {/* Control Panel */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resume Preview</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreviewMode}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
              </Button>
              
              <PDFExportDropdown
                resumeElementId="resume-preview-container"
                candidateName={candidateName}
                resumeData={resumeData}
              />
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <PDFExportButton
              resumeElementId="resume-preview-container"
              candidateName={candidateName}
              resumeData={resumeData}
              variant="default"
              size="sm"
            />
            
            <PDFExportButton
              resumeElementId="resume-preview-container"
              candidateName={candidateName}
              resumeData={resumeData}
              variant="outline"
              size="sm"
              highQuality={true}
            >
              <Download className="h-4 w-4 mr-2" />
              High Quality PDF
            </PDFExportButton>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
            >
              <Settings className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            The PDF will be generated exactly as shown in the preview below.<br/>
            <strong>For best results and perfect formatting, use your browser's <u>Print to PDF</u> feature:</strong><br/>
            <span>
              <ol className="list-decimal ml-4">
                <li>Click the <b>Print</b> button above or press <b>Ctrl+P</b> (Windows) / <b>Cmd+P</b> (Mac).</li>
                <li>Select <b>Save as PDF</b> as the printer.</li>
                <li>Adjust margins and layout as needed.</li>
                <li>Click <b>Save</b> to download your perfectly formatted PDF.</li>
              </ol>
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Resume Preview */}
      <div 
        className={`transition-all duration-300 ${
          isPreviewMode 
            ? 'fixed inset-0 z-50 bg-gray-100 overflow-auto p-4' 
            : 'relative'
        }`}
      >
        {isPreviewMode && (
          <div className="fixed top-4 right-4 z-60">
            <Button
              variant="secondary"
              onClick={togglePreviewMode}
            >
              Exit Preview
            </Button>
          </div>
        )}
        
        <div
          ref={previewRef}
          id="resume-preview-container"
          className={`bg-white ${
            isPreviewMode 
              ? 'mx-auto shadow-lg' 
              : 'border border-gray-200 rounded-lg overflow-hidden'
          }`}
          dangerouslySetInnerHTML={{ __html: templateHtml }}
        />
      </div>
    </div>
  );
};

export default ResumePreviewWithExport;