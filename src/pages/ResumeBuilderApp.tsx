import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from '@/components/ui/use-toast';
import TopNavigation from '@/components/TopNavigation';
import ResumeFileUploader from '@/components/ResumeFileUploader';
import api from '@/utils/resumeBuilderApi';
import { 
  Upload, 
  Download, 
  FileText, 
  Sparkles, 
  Eye, 
  Settings,
  CheckCircle,
  AlertCircle,
  Wand2
} from 'lucide-react';

const ResumeBuilderApp = () => {
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsTemplateLoading(true);
      try {
        const { data, error } = await api.getTemplates();
        if (error) {
          console.error('Error fetching templates:', error);
          toast({
            variant: "destructive",
            title: "Template Load Failed",
            description: "Failed to load resume templates. Please try again."
          });
        } else {
          setTemplates(data);
          if (data && data.length > 0) {
            setSelectedTemplate(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          variant: "destructive",
          title: "Template Load Failed",
          description: "Failed to load resume templates. Please try again."
        });
      } finally {
        setIsTemplateLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleFileSelect = (file: File | null) => {
    setResumeFile(file);
    setExtractedData(null);
    setGeneratedResume(null);
  };

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    toast({
      title: "Data Extracted!",
      description: "Resume data has been successfully extracted."
    });
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    console.log('Selected template:', template);
  };

  const handleGenerateResume = async () => {
    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Template Required",
        description: "Please select a template before generating your resume."
      });
      return;
    }

    if (!extractedData) {
      toast({
        variant: "destructive", 
        title: "Resume Data Required",
        description: "Please extract resume data first before generating."
      });
      return;
    }

    try {
      setIsGenerating(true);
      console.log('Generating resume with template:', selectedTemplate);
      
      const { data, error } = await api.buildResume({
        templateId: selectedTemplate.id,
        resumeData: extractedData,
        accessToken: user?.id || ''
      });

      if (error) {
        throw new Error(error);
      }

      setGeneratedResume(data.resumeHtml);
      toast({
        title: "Resume Generated!",
        description: "Your resume has been successfully generated."
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate resume. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadResume = () => {
    if (!generatedResume) {
      toast({
        variant: "destructive",
        title: "No Resume to Download",
        description: "Please generate a resume before downloading."
      });
      return;
    }

    const blob = new Blob([generatedResume], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-resume.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Resume Downloaded!",
      description: "Your resume has been successfully downloaded."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <TopNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Resume Builder</h1>
          <p className="text-gray-600">Upload your resume, select a template, and generate a professional resume.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: File Upload and Data Extraction */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResumeFileUploader onFileSelect={handleFileSelect} onDataExtracted={handleDataExtracted} setIsExtracting={setIsExtracting} />
                {extractedData && (
                  <Badge variant="outline" className="mt-4">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Data Extracted
                  </Badge>
                )}
                {isExtracting && (
                  <Badge variant="secondary" className="mt-4">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Extracting Data...
                  </Badge>
                )}
                {!resumeFile && (
                  <div className="mt-4 text-sm text-gray-500">
                    <AlertCircle className="w-4 h-4 inline mr-1 align-text-bottom" />
                    Please upload a resume file to begin.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Select Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isTemplateLoading ? (
                  <div className="text-center">Loading templates...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map(template => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                        onClick={() => handleTemplateSelect(template)}
                        className="justify-start text-sm"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Generate and Preview Resume */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Generate Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={handleGenerateResume} 
                  disabled={!extractedData || !selectedTemplate || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Resume
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={handleDownloadResume} 
                  disabled={!generatedResume}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-center"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </CardContent>
            </Card>

            {/* Resume Preview */}
            {showPreview && generatedResume && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div dangerouslySetInnerHTML={{ __html: generatedResume }} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
