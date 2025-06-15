
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, FileText, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResumePreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeHtml, setResumeHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const template = searchParams.get('template') || 'modern-executive';
  const resumeData = searchParams.get('data');

  useEffect(() => {
    if (resumeData) {
      // In a real implementation, you would call your resume builder API here
      // For now, we'll simulate loading and automatically display the resume
      setIsLoading(true);
      setTimeout(() => {
        setResumeHtml(`
          <div style="max-width: 8.5in; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>Resume Preview</h1>
            <p>Your resume will be generated here using the ${template} template.</p>
            <p>Resume data: ${decodeURIComponent(resumeData)}</p>
          </div>
        `);
        setIsLoading(false);
      }, 1000);
    }
  }, [resumeData, template]);

  const downloadAsHtml = () => {
    if (!resumeHtml) return;
    
    const blob = new Blob([resumeHtml], { type: 'text/html' });
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

  const downloadAsPdf = () => {
    // This would integrate with a PDF generation service
    toast({
      title: "PDF Download",
      description: "PDF download functionality will be implemented soon.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Preview</h1>
              <p className="text-gray-600">Template: {template}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadAsHtml}>
              <Globe className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button onClick={downloadAsPdf}>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
