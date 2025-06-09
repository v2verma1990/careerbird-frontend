
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
import { resumeBuilderApi } from '@/utils/resumeBuilderApi';
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
        const { data, error } = await resumeBuilderApi.getTemplates();
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
      
      const { data, error } = await resumeBuilderApi.buildResume({
        templateId: selectedTemplate.id,
        resumeData: JSON.stringify(extractedData)
      });

      if (error) {
        throw new Error(error);
      }

      setGeneratedResume(data.html || data.resumeHtml);
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

      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Template Selection */}
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Resume Templates
            </h2>
            
            {isTemplateLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading templates...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full justify-start text-left h-auto p-4 ${
                      selectedTemplate?.id === template.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {template.description || 'Professional template'}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {!selectedTemplate && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Select a template to proceed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Resume Builder</h1>
              <p className="text-gray-600">Upload your resume, select a template, and generate a professional resume.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: File Upload and Data Extraction */}
              <div>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Upload & Extract Resume Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResumeFileUploader 
                      onFileSelected={handleFileSelect}
                      onDataExtracted={handleDataExtracted} 
                      setIsExtracting={setIsExtracting}
                    />
                    
                    <div className="mt-4 flex gap-2">
                      {extractedData && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Data Extracted Successfully
                        </Badge>
                      )}
                      {isExtracting && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                          Extracting Data...
                        </Badge>
                      )}
                    </div>

                    {!resumeFile && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Upload a resume file to begin data extraction</span>
                        </div>
                      </div>
                    )}

                    {resumeFile && !extractedData && !isExtracting && (
                      <Button 
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          // This would trigger the extraction process
                          console.log('Extract data from:', resumeFile.name);
                        }}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Extract Resume Data
                      </Button>
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
                      className={`w-full ${
                        extractedData && selectedTemplate 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                      onClick={handleGenerateResume} 
                      disabled={!extractedData || !selectedTemplate || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Resume...
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
                      className={`w-full ${
                        generatedResume 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
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
                      disabled={!generatedResume}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>

                    {(!extractedData || !selectedTemplate) && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-amber-800 text-sm">
                          <div className="font-medium mb-1">Required to generate resume:</div>
                          <ul className="space-y-1">
                            {!selectedTemplate && (
                              <li className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Select a template from the sidebar
                              </li>
                            )}
                            {!extractedData && (
                              <li className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Upload and extract resume data
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
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
                      <div 
                        className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: generatedResume }} 
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
