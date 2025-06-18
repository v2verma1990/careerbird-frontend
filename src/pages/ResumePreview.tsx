
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, FileText, Globe, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/apiClient';

const ResumePreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeHtml, setResumeHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  
  const template = searchParams.get('template') || 'modern-executive';
  const encodedData = searchParams.get('data');
  const encodedHtml = searchParams.get('html');

  useEffect(() => {
    console.log('=== RESUME PREVIEW COMPONENT LOADED ===');
    console.log('ResumePreview - Template:', template);
    console.log('ResumePreview - Encoded data:', encodedData);
    console.log('ResumePreview - Encoded HTML:', encodedHtml ? 'Present (length: ' + encodedHtml.length + ')' : 'Not present');
    
    if (encodedData) {
      try {
        // Decode the URL-encoded data
        const decodedData = decodeURIComponent(encodedData);
        console.log('ResumePreview - Decoded data (first 1000 chars):', decodedData.substring(0, 1000));
        
        // Parse the JSON data
        const parsedData = JSON.parse(decodedData);
        console.log('=== PARSED RESUME DATA IN PREVIEW ===');
        console.log('ResumePreview - Full parsed data:', parsedData);
        console.log('ResumePreview - Experience array:', parsedData.Experience);
        console.log('ResumePreview - Education array:', parsedData.Education);
        console.log('ResumePreview - Skills array:', parsedData.Skills);
        console.log('ResumePreview - Experience length:', parsedData.Experience?.length || 0);
        console.log('ResumePreview - Education length:', parsedData.Education?.length || 0);
        
        // Check if arrays have actual content
        if (parsedData.Experience && parsedData.Experience.length > 0) {
          console.log('ResumePreview - First experience item:', parsedData.Experience[0]);
          parsedData.Experience.forEach((exp, index) => {
            console.log(`Experience ${index}:`, {
              Title: exp.Title,
              Company: exp.Company,
              Description: exp.Description,
              hasContent: !!(exp.Title || exp.Company || exp.Description)
            });
          });
        }
        
        if (parsedData.Education && parsedData.Education.length > 0) {
          console.log('ResumePreview - First education item:', parsedData.Education[0]);
          parsedData.Education.forEach((edu, index) => {
            console.log(`Education ${index}:`, {
              Degree: edu.Degree,
              Institution: edu.Institution,
              hasContent: !!(edu.Degree || edu.Institution)
            });
          });
        }
        
        setResumeData(parsedData);
        
        // If we have HTML from the backend, use it directly
        if (encodedHtml) {
          try {
            const decodedHtml = decodeURIComponent(encodedHtml);
            console.log('=== BACKEND HTML ANALYSIS ===');
            console.log('ResumePreview - Using HTML from backend (length: ' + decodedHtml.length + ')');
            console.log('ResumePreview - HTML preview (first 1000 chars):', decodedHtml.substring(0, 1000));
            
            // Check if HTML contains experience and education sections
            const hasExperienceSection = decodedHtml.includes('Experience') || decodedHtml.includes('Employment');
            const hasEducationSection = decodedHtml.includes('Education');
            const hasExperienceData = decodedHtml.includes('employment-history-role') || decodedHtml.includes('experience');
            const hasEducationData = decodedHtml.includes('education-degree') || decodedHtml.includes('education');
            
            console.log('HTML Content Analysis:');
            console.log('- Has Experience Section:', hasExperienceSection);
            console.log('- Has Education Section:', hasEducationSection);
            console.log('- Has Experience Data:', hasExperienceData);
            console.log('- Has Education Data:', hasEducationData);
            
            // Look for specific patterns that might indicate empty sections
            const emptyExperiencePattern = /employment-history-role">\s*,\s*<span/;
            const hasEmptyExperience = emptyExperiencePattern.test(decodedHtml);
            console.log('- Has Empty Experience Pattern:', hasEmptyExperience);
            
            // Let's examine the actual experience section in the HTML
            const experienceMatch = decodedHtml.match(/<div class="employment-section">[\s\S]*?<\/div>/);
            if (experienceMatch) {
              console.log('Experience section HTML:', experienceMatch[0]);
            }
            
            // Look for the actual experience entries
            const experienceEntries = decodedHtml.match(/employment-history-role">[^<]*</g);
            console.log('Experience entries found:', experienceEntries);
            
            // Check education section too
            const educationMatch = decodedHtml.match(/<div class="education-section">[\s\S]*?<\/div>/);
            if (educationMatch) {
              console.log('Education section HTML:', educationMatch[0]);
            }
            
            // Look for education entries
            const educationEntries = decodedHtml.match(/education-degree">[^<]*</g);
            console.log('Education entries found:', educationEntries);
            
            // Let's also check if the HTML contains the actual data values
            console.log('=== CHECKING FOR ACTUAL DATA IN HTML ===');
            console.log('HTML contains "Cloud Architect":', decodedHtml.includes('Cloud Architect'));
            console.log('HTML contains "Cognizant":', decodedHtml.includes('Cognizant'));
            console.log('HTML contains "MBA":', decodedHtml.includes('MBA'));
            console.log('HTML contains "Amity University":', decodedHtml.includes('Amity University'));
            
            // Let's see the full HTML around the employment section
            const employmentSectionStart = decodedHtml.indexOf('<div class="employment-section">');
            const employmentSectionEnd = decodedHtml.indexOf('</div>', employmentSectionStart + 200);
            if (employmentSectionStart !== -1 && employmentSectionEnd !== -1) {
              const employmentSection = decodedHtml.substring(employmentSectionStart, employmentSectionEnd + 6);
              console.log('Full employment section HTML:', employmentSection);
            }
            
            setResumeHtml(decodedHtml);
            setIsLoading(false);
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
  }, [encodedData, encodedHtml, template, toast]);

  const downloadAsWord = async () => {
    if (!resumeData || !template) return;
    
    try {
      setIsLoading(true);
      toast({
        title: "Generating Word Document",
        description: "Please wait while we generate your Word document. This may take a few moments...",
      });
      
      // Try to download as Word document first
      try {
        const response = await api.resumeBuilder.downloadResume({
          resumeText: resumeHtml,
          format: "docx"
        });
        
        if (response.ok) {
          // Check if the response is actually a Word document
          const contentType = response.headers.get('content-type');
          if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || contentType.includes('application/octet-stream'))) {
            // Get the Word document blob from the response
            const blob = await response.blob();
            
            // Create a download link for the Word document
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resume-${template}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({
              title: "Success!",
              description: "Your resume has been downloaded as Word document.",
            });
            return;
          } else {
            console.warn('Response is not a Word document, content-type:', contentType);
            throw new Error('Invalid Word document response');
          }
        } else {
          throw new Error(`Word generation failed with status: ${response.status}`);
        }
      } catch (wordError) {
        console.warn('Word generation failed, falling back to HTML:', wordError);
      }
      
      // Fallback to HTML if Word generation fails
      toast({
        title: "Word Format Not Supported",
        description: "Word format doesn't support this template's advanced formatting. Downloading as HTML instead - you can open this in any word processor.",
        variant: "default"
      });
      
      // Create a complete HTML document with proper DOCTYPE and meta tags
      // Add some basic styling that's more compatible with Word if opened there
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resumeData?.Name || 'Resume'}</title>
  <style>
    /* Additional styles for better Word compatibility */
    body { 
      font-family: 'Times New Roman', serif; 
      line-height: 1.4; 
      margin: 1in; 
      color: #000; 
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
${resumeHtml}
<div style="margin-top: 2em; padding-top: 1em; border-top: 1px solid #ccc; font-size: 0.8em; color: #666;">
  <p><strong>Note:</strong> This resume was downloaded as HTML because Word format doesn't support the advanced formatting of this template. You can open this file in any web browser or word processor that supports HTML.</p>
</div>
</body>
</html>`;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${template}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded as HTML",
        description: "Your resume has been downloaded as HTML since Word format is not supported for this template.",
      });
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsPdf = async () => {
    if (!resumeData || !template) return;
    
    try {
      setIsLoading(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      });
      
      // Use the API client to download the resume as PDF
      const response = await api.resumeBuilder.downloadResume({
        resumeText: resumeHtml,
        format: "pdf"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }
      
      // Get the PDF blob from the response
      const blob = await response.blob();
      
      // Create a download link for the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${template}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your resume has been downloaded as PDF.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "PDF Download Failed",
        description: error instanceof Error ? error.message : "Failed to download PDF. Please try again.",
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
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadAsWord} disabled={isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              Download Word
            </Button>
            <Button onClick={downloadAsPdf} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  <div className="h-[800px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating your resume...</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="bg-white border rounded-lg p-4 min-h-[800px]"
                    dangerouslySetInnerHTML={{ __html: resumeHtml }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={downloadAsPdf}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={downloadAsWord}
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download as Word
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
