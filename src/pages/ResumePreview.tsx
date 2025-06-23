import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, FileText, Globe, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/apiClient';
import { PDFExportButton, PDFExportDropdown } from '@/components/PDFExportButton';
import { useResumeExport } from '@/hooks/use-pdf-export';
import { frontendTemplateService } from '@/services/frontendTemplateService';
import { useResumeColors } from '@/contexts/resume/ResumeColorContext';
// Import centralized styles
import '@/styles/templates.css';

const ResumePreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearAllColorCaches } = useResumeColors();
  
  // Centralized state
  const [renderedTemplate, setRenderedTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const template = searchParams.get('template') ;
  const encodedData = searchParams.get('data');
  const encodedHtml = searchParams.get('html');
  const selectedColor = searchParams.get('color') ? decodeURIComponent(searchParams.get('color')) : '#315389';

  // IMMEDIATELY apply color on component initialization to prevent any flash
  useLayoutEffect(() => {
    console.log('ResumePreview - IMMEDIATE color application on mount:', selectedColor);
    frontendTemplateService.applyTemplateStyles(template, selectedColor);
  }, [template, selectedColor]);

  const [previewKey, setPreviewKey] = useState(() => `${template}-${selectedColor}-${Date.now()}`);
  const { exportResume, exportResumeHighQuality, isExporting } = useResumeExport();
  
  console.log('ResumePreview: Initialized with:', { template, selectedColor, hasData: !!encodedData, hasHtml: !!encodedHtml });
  console.log('ResumePreview: URL search params:', Object.fromEntries(searchParams.entries()));
  console.log('ResumePreview: Raw color param:', searchParams.get('color'));
  console.log('ResumePreview: Decoded selectedColor:', selectedColor);

  /**
   * Refresh preview with latest template rendering
   */
  const refreshPreview = async () => {
    if (!resumeData) return;
    
    setIsRefreshing(true);
    try {
      console.log('ResumePreview: Refreshing preview with fresh rendering');
      
      // Apply styles immediately to prevent flash
      frontendTemplateService.applyTemplateStyles(template, selectedColor);
      
      // Get fresh render
      const rendered = await frontendTemplateService.renderResume(
        template,
        resumeData,
        selectedColor
      );
      
      setRenderedTemplate(rendered);
      
      console.log('ResumePreview: Successfully refreshed preview');
      
    } catch (error) {
      console.error('ResumePreview: Failed to refresh preview:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh preview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to regenerate template with correct color using frontend service
  const regenerateTemplateWithCorrectColor = async (resumeData: any, color: string) => {
    try {
      console.log('ResumePreview - Regenerating template with color:', color);
      setIsLoading(true);
      
      // Apply styles immediately to prevent flash
      frontendTemplateService.applyTemplateStyles(template, color);
      
      // Get fresh render
      const rendered = await frontendTemplateService.renderResume(
        template,
        resumeData,
        color
      );
      
      setRenderedTemplate(rendered);
      
      console.log('ResumePreview - Successfully regenerated template with correct color');
      
    } catch (error) {
      console.error('ResumePreview - Failed to regenerate template:', error);
      toast({
        title: "Error",
        description: "Failed to update resume color. Please try refreshing the preview.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== RESUME PREVIEW COMPONENT LOADED ===');
    console.log('ResumePreview - Template:', template);
    console.log('ResumePreview - Selected Color:', selectedColor);
    console.log('ResumePreview - Has data:', !!encodedData);
    
    // IMMEDIATELY apply the color to prevent showing default blue
    console.log('ResumePreview - Applying color IMMEDIATELY on component load:', selectedColor);
    frontendTemplateService.applyTemplateStyles(template, selectedColor);
    
    const initializePreview = async () => {
      if (!encodedData) {
        console.error('ResumePreview - No resume data found');
        toast({
          title: "Error",
          description: "No resume data found. Please go back and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Decode and parse resume data
        const decodedData = decodeURIComponent(encodedData);
        const parsedData = JSON.parse(decodedData);
        
        console.log('ResumePreview - Parsed resume data:', {
          name: parsedData.Name || parsedData.name,
          template,
          color: selectedColor
        });
        
        setResumeData(parsedData);
        
        // Apply styles immediately to prevent flash
        console.log('ResumePreview - Applying styles immediately to prevent flash with color:', selectedColor);
        frontendTemplateService.applyTemplateStyles(template, selectedColor);
        
        // Get fresh render
        console.log('ResumePreview - Getting fresh render');
        const rendered = await frontendTemplateService.renderResume(
          template,
          parsedData,
          selectedColor
        );
        
        setRenderedTemplate(rendered);
        
        console.log('ResumePreview - Successfully initialized with FRESH rendering using color:', selectedColor);
        
      } catch (error) {
        console.error('ResumePreview - Failed to initialize preview:', error);
        toast({
          title: "Preview Error",
          description: "Failed to load resume preview. Please try generating the resume again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePreview();

    // Cleanup function - Clean cleanup when component unmounts
    return () => {
      console.log('ResumePreview - Component unmounting, performing cleanup');
      frontendTemplateService.cleanup();
    };
  }, [encodedData, template, selectedColor, toast]);

  // Handle color changes - regenerate template when color changes
  useEffect(() => {
    // Update preview key for re-render
    setPreviewKey(`${template}-${selectedColor}-${Date.now()}`);
    
    // Only regenerate if we have data and this is a color change (not initial load)
    if (resumeData && renderedTemplate && selectedColor) {
      console.log('ResumePreview - Color changed, regenerating template with new color:', selectedColor);
      regenerateTemplateWithCorrectColor(resumeData, selectedColor);
    }
  }, [selectedColor]); // Only watch for color changes

  // Inject CSS directly into preview container after render
  useEffect(() => {
    if (renderedTemplate && template) {
      const previewContainer = document.getElementById('resume-preview-container');
      if (previewContainer) {
        // Remove any existing style tags
        const existingStyles = previewContainer.querySelectorAll('style[data-template-css]');
        existingStyles.forEach(style => style.remove());
        
        // Get the template CSS
        const templateCSS = frontendTemplateService.getTemplateCSS(template);
        
        if (templateCSS) {
          // Create and inject style tag
          const styleTag = document.createElement('style');
          styleTag.setAttribute('data-template-css', template);
          styleTag.textContent = `
            :root {
              --template-color: ${selectedColor} !important;
              --template-color-rgb: ${frontendTemplateService.hexToRgb(selectedColor)} !important;
            }
            ${templateCSS}
          `;
          
          previewContainer.appendChild(styleTag);
          console.log(`Injected CSS for ${template} into preview container`);
        }
      }
    }
  }, [renderedTemplate, template, selectedColor]);

  const downloadAsHTML = async () => {
    if (!renderedTemplate || !resumeData) return;

    try {
      setIsLoading(true);

      // Get candidate name for filename
      const candidateName = resumeData?.PersonalInfo?.Name ||
        resumeData?.personalInfo?.name ||
        resumeData?.name ||
        resumeData?.Name ||
        'resume';

      console.log('ResumePreview - Downloading HTML using centralized template');

      // Use the complete HTML from centralized rendering service
      const fullHtml = renderedTemplate.fullHtml;

      // Download logic
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName.toLowerCase().replace(/\s+/g, '_')}_resume_${template}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "HTML Downloaded Successfully",
        description: "Your resume has been saved as an HTML file with exact preview formatting.",
      });
    } catch (error) {
      console.error('HTML export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate HTML file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Centralized PDF download function - ensures exact same rendering as preview
  const downloadAsPdf = async () => {
    if (!resumeData) return;

    try {
      setIsLoading(true);

      // Get candidate name for filename
      const candidateName = resumeData?.PersonalInfo?.Name ||
        resumeData?.personalInfo?.name ||
        resumeData?.name ||
        resumeData?.Name ||
        'resume';

      console.log('ResumePreview - Downloading PDF using centralized rendering service');

      // Get fresh render for PDF to ensure accuracy
      const pdfRender = await frontendTemplateService.renderResume(
        template,
        resumeData,
        selectedColor
      );

      console.log('ResumePreview - Got fresh PDF render, sending to backend');

      // Send the complete HTML to backend for PDF generation
      const response = await api.resumeBuilder.downloadResume({
        resumeText: pdfRender.fullHtml,
        format: "pdf"
      });

      if (!response || !response.ok) {
        throw new Error(`Server responded with status: ${response?.status || 'unknown'}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Ensure styles are still applied after PDF download
      frontendTemplateService.applyTemplateStyles(template, selectedColor);

      toast({
        title: "PDF Downloaded Successfully",
        description: "Your resume has been saved as a PDF file with exact preview formatting.",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "PDF Download Failed",
        description: "Unable to generate PDF. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!encodedData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Resume Data Found</h1>
          <p className="text-gray-600 mb-4">Please go back to the resume builder and try again.</p>
          <Button onClick={() => navigate('/resume-builder-app')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resume Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/resume-builder-app')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Preview</h1>
              <p className="text-gray-600">Template: {template}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading resume preview...</p>
                    </div>
                  </div>
                ) : renderedTemplate ? (
                  <div className="space-y-4">
                    {/* Refresh Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={refreshPreview}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Preview'}
                      </Button>
                    </div>
                    
                    {/* Preview Container - Key forces re-render on color change */}
                    <div
                      key={previewKey}
                      id="resume-preview-container"
                      className={`resume-preview-container template-transition ${template}`}
                      dangerouslySetInnerHTML={{ __html: renderedTemplate.html }}
                    />
                  </div>
                ) : (
                  <div className="template-error">
                    <div>
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Failed to load resume preview</p>
                      <Button onClick={refreshPreview} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PDFExportButton
                  resumeElementId="resume-preview-container"
                  candidateName={resumeData?.PersonalInfo?.Name || resumeData?.personalInfo?.name || resumeData?.name || resumeData?.Name || 'resume'}
                  resumeData={resumeData}
                  templateColor={selectedColor}
                  templateId={template}
                  className="w-full"
                  disabled={isLoading || isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Generating...' : 'Download PDF'}
                </PDFExportButton>

                <PDFExportButton
                  resumeElementId="resume-preview-container"
                  candidateName={resumeData?.PersonalInfo?.Name || resumeData?.personalInfo?.name || resumeData?.name || resumeData?.Name || 'resume'}
                  resumeData={resumeData}
                  templateColor={selectedColor}
                  templateId={template}
                  variant="outline"
                  className="w-full"
                  highQuality={true}
                  disabled={isLoading || isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Generating...' : 'High Quality PDF'}
                </PDFExportButton>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={downloadAsHTML}
                  disabled={isLoading || !renderedTemplate}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Download as HTML
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Template Info</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Template: {template}
                  </p>
                  <p className="text-sm text-gray-600">
                    You can always go back and make changes to your resume.
                  </p>
                </div>

                {resumeData && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Resume Data</h4>
                    <p className="text-sm text-gray-600">
                      Name: {resumeData.Name || 'Not provided'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {resumeData.Email || 'Not provided'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;