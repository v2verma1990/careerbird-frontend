
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
    console.log('ResumePreview - Template:', template);
    console.log('ResumePreview - Encoded data:', encodedData);
    console.log('ResumePreview - Encoded HTML:', encodedHtml ? 'Present (length: ' + encodedHtml.length + ')' : 'Not present');
    
    if (encodedData) {
      try {
        // Decode the URL-encoded data
        const decodedData = decodeURIComponent(encodedData);
        console.log('ResumePreview - Decoded data:', decodedData);
        
        // Parse the JSON data
        const parsedData = JSON.parse(decodedData);
        console.log('ResumePreview - Parsed data:', parsedData);
        
        setResumeData(parsedData);
        
        // If we have HTML from the backend, use it directly
        if (encodedHtml) {
          try {
            const decodedHtml = decodeURIComponent(encodedHtml);
            console.log('ResumePreview - Using HTML from backend (length: ' + decodedHtml.length + ')');
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

  const downloadAsHtml = () => {
    if (!resumeHtml) return;
    
    // Create a complete HTML document with proper DOCTYPE and meta tags
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resumeData?.Name || 'Resume'}</title>
</head>
<body>
${resumeHtml}
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
      title: "Success!",
      description: "Your resume has been downloaded as HTML.",
    });
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
            <Button variant="outline" onClick={downloadAsHtml} disabled={isLoading}>
              <Globe className="h-4 w-4 mr-2" />
              Download HTML
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
                  onClick={downloadAsHtml}
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
