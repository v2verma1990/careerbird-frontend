import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, FileText, Globe, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/apiClient';
import { PDFExportButton, PDFExportDropdown } from '@/components/PDFExportButton';
import { useResumeExport } from '@/hooks/use-pdf-export';
import { templateService } from '@/services/templateService';

const ResumePreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeHtml, setResumeHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { exportResume, exportResumeHighQuality, isExporting } = useResumeExport();
  
  const template = searchParams.get('template') || 'modern-executive';
  const encodedData = searchParams.get('data');
  const encodedHtml = searchParams.get('html');
  const selectedColor = searchParams.get('color') ? decodeURIComponent(searchParams.get('color')!) : '#315389';

  // Apply centralized styles for navy-column-modern template
  const applyTemplateStyles = async () => {
    if (template === 'navy-column-modern') {
      try {
        console.log('ResumePreview - Fetching centralized CSS with color:', selectedColor);
        const css = await templateService.getTemplateCss(template, selectedColor);
        
        // Remove any existing template styles
        const existingStyles = document.querySelectorAll('style[data-template-styles]');
        existingStyles.forEach(style => style.remove());
        
        // Create and inject the unified styles
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-template-styles', 'true');
        styleElement.textContent = css;
        
        // Insert at the beginning of head for maximum priority
        if (document.head.firstChild) {
          document.head.insertBefore(styleElement, document.head.firstChild);
        } else {
          document.head.appendChild(styleElement);
        }
        
        console.log('ResumePreview - Applied centralized CSS successfully');
      } catch (error) {
        console.error('ResumePreview - Failed to fetch template CSS:', error);
      }
    }
  };

  // Function to regenerate HTML with correct color
  const regenerateHtmlWithCorrectColor = async (resumeData: any, color: string) => {
    try {
      console.log('ResumePreview - Regenerating HTML with color:', color);
      setIsLoading(true);
      
      // Call the backend to generate new HTML with correct color
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:5001/api'}/resume-builder/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: JSON.stringify(resumeData),
          templateId: template,
          color: color
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.html) {
        console.log('ResumePreview - Successfully regenerated HTML with correct color');
        setResumeHtml(result.data.html);
        await applyTemplateStyles();
      } else {
        throw new Error('Failed to regenerate HTML');
      }
    } catch (error) {
      console.error('ResumePreview - Failed to regenerate HTML:', error);
      toast({
        title: "Error",
        description: "Failed to update resume color. Using original version.",
        variant: "destructive"
      });
      // Fallback to original HTML
      if (encodedHtml) {
        const decodedHtml = decodeURIComponent(encodedHtml);
        setResumeHtml(decodedHtml);
        await applyTemplateStyles();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== RESUME PREVIEW COMPONENT LOADED ===');
    console.log('ResumePreview - Template:', template);
    console.log('ResumePreview - Selected Color:', selectedColor);
    console.log('ResumePreview - Encoded data:', encodedData);
    console.log('ResumePreview - Encoded HTML:', encodedHtml ? 'Present (length: ' + encodedHtml.length + ')' : 'Not present');
    
    const initializePreview = async () => {
      if (encodedData) {
      try {
        // Decode the URL-encoded data
        const decodedData = decodeURIComponent(encodedData);
        console.log('ResumePreview - Decoded data (first 1000 chars):', decodedData.substring(0, 1000));
        
        // Parse the JSON data
        const parsedData = JSON.parse(decodedData);
        console.log('=== PARSED RESUME DATA IN PREVIEW ===');
        console.log('ResumePreview - Full parsed data:', parsedData);
        
        setResumeData(parsedData);
        
        // If we have HTML from the backend, check if color matches
        if (encodedHtml) {
          try {
            const decodedHtml = decodeURIComponent(encodedHtml);
            console.log('=== BACKEND HTML ANALYSIS ===');
            console.log('ResumePreview - HTML from backend (length: ' + decodedHtml.length + ')');
            console.log('ResumePreview - Current selected color:', selectedColor);
            
            // Check if the HTML contains the current selected color
            const htmlContainsCurrentColor = decodedHtml.includes(selectedColor);
            console.log('ResumePreview - HTML contains current color:', htmlContainsCurrentColor);
            
            // Also check for common color variations (with/without #, rgb format, etc.)
            const colorVariations = [
              selectedColor,
              selectedColor.replace('#', ''),
              selectedColor.toLowerCase(),
              selectedColor.toUpperCase()
            ];
            
            const hasAnyColorVariation = colorVariations.some(variation => decodedHtml.includes(variation));
            console.log('ResumePreview - HTML contains any color variation:', hasAnyColorVariation);
            
            // If color doesn't match and it's not the default color, regenerate HTML
            if (!hasAnyColorVariation && selectedColor !== '#315389') {
              console.log('ResumePreview - Color mismatch detected! Regenerating HTML with correct color...');
              await regenerateHtmlWithCorrectColor(parsedData, selectedColor);
            } else {
              console.log('ResumePreview - Color matches or is default, using existing HTML');
              setResumeHtml(decodedHtml);
              // Apply template styles after HTML is set
              applyTemplateStyles();
              setIsLoading(false);
            }
          } catch (htmlError) {
            console.error('ResumePreview - Error decoding HTML from backend:', htmlError);
            toast({
              title: "Error",
              description: "Failed to load resume preview. Please try generating again.",
              variant: "destructive"
            });
            setIsLoading(false);
          }
        } else {
          // No HTML from backend - this shouldn't happen in normal flow
          console.error('ResumePreview - No HTML provided from backend');
          toast({
            title: "Error",
            description: "Resume preview not available. Please try generating the resume again.",
            variant: "destructive"
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('ResumePreview - Error parsing resume data:', error);
        toast({
          title: "Error",
          description: "Failed to load resume data. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    } else {
      console.error('ResumePreview - No resume data found');
      toast({
        title: "Error",
        description: "No resume data found. Please go back and try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
    };

    // Call the async function
    initializePreview();

    // Cleanup function to remove template styles when component unmounts
    return () => {
      const styleToRemove = document.querySelector('style[data-template-styles]');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [encodedData, encodedHtml, template, toast, selectedColor]);

  const downloadAsHTML = async () => {
    if (!resumeData || !template || !resumeHtml) return;
    
    try {
      setIsLoading(true);
      toast({
        title: "Generating HTML Document",
        description: "Creating a perfectly formatted HTML version of your resume...",
      });
      
      // Get candidate name for filename
      const candidateName = resumeData?.PersonalInfo?.Name || 
                           resumeData?.personalInfo?.name || 
                           resumeData?.name || 
                           resumeData?.Name ||
                           'resume';
      
      // Get centralized CSS
      const css = await templateService.getTemplateCss(template, selectedColor);
      
      // Create a complete HTML document that preserves exact preview formatting
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${candidateName} - Resume</title>
  <style>
    /* CENTRALIZED STYLES - SINGLE SOURCE OF TRUTH */
    ${css}
    
    /* Additional HTML export specific styles */
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f5f6fa;
      padding: 0.5in;
      margin: 0;
    }
  </style>
</head>
<body class="${template}">
${resumeHtml}

<div style="margin-top: 2em; padding: 1em; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666; text-align: center;">
  <p><strong>📄 Resume Generated Successfully</strong></p>
  <p>This HTML file preserves the exact formatting from your preview. You can:</p>
  <ul style="list-style: none; padding: 0; margin: 0.5em 0;">
    <li>• Open in any web browser for viewing</li>
    <li>• Print directly from your browser (Ctrl+P / Cmd+P)</li>
    <li>• Import into word processors that support HTML</li>
    <li>• Share via email or cloud storage</li>
  </ul>
  <p style="margin-top: 0.5em;"><em>Template: ${template} | Generated: ${new Date().toLocaleDateString()}</em></p>
</div>
</body>
</html>`;
      
      // Create and download the HTML file
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
        description: "Your resume has been saved as an HTML file that preserves all formatting.",
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

  // New frontend-based PDF download function
  const downloadAsPdf = async () => {
    if (!resumeData || !resumeHtml) {
      toast({
        title: "Error",
        description: "Resume data not available. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get candidate name for filename
      const candidateName = resumeData?.PersonalInfo?.Name || 
                           resumeData?.personalInfo?.name || 
                           resumeData?.name || 
                           resumeData?.Name ||
                           'resume';

      // Use the new frontend PDF export with selected color
      console.log('PDF Export - Passing color to export function:', selectedColor);
      await exportResume('resume-preview-container', candidateName, resumeData, selectedColor);
      
    } catch (error) {
      console.error('Frontend PDF export failed, trying fallback:', error);
      
      // Fallback to the old API method if frontend fails
      try {
        setIsLoading(true);
        toast({
          title: "Generating PDF",
          description: "Creating your resume PDF using fallback method...",
        });
        
        const response = await api.resumeBuilder.downloadResume({
          resumeText: resumeHtml,
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
        link.download = `resume-${template}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Downloaded Successfully",
          description: "Your resume has been saved as a PDF file.",
        });
      } catch (fallbackError) {
        console.error('Fallback PDF export also failed:', fallbackError);
        toast({
          title: "PDF Download Failed",
          description: "Unable to generate PDF. Please try again or contact support.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
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
                ) : (
                  <div
                    id="resume-preview-container"
                    className="resume-preview-container"
                    style={{
                      width: isPreviewMode ? '210mm' : 'auto',
                      minHeight: isPreviewMode ? '297mm' : '800px'
                    }}
                    dangerouslySetInnerHTML={{ __html: resumeHtml }}
                  />
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
                  disabled={isLoading}
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