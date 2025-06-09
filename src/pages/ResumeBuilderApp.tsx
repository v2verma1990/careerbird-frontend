
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from '@/hooks/use-toast';
import TopNavigation from '@/components/TopNavigation';
import ResumeFileUploader from '@/components/ResumeFileUploader';
import { resumeBuilderApi } from '@/utils/resumeBuilderApi';
import { 
  Upload, 
  Download, 
  FileText, 
  Sparkles, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Wand2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ResumeBuilderApp = () => {
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
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
          // Set fallback templates
          const fallbackTemplates = [
            { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
            { id: 'modern-clean', name: 'Modern Clean', description: 'Contemporary professional look' },
            { id: 'professional', name: 'Professional', description: 'Traditional business style' }
          ];
          setTemplates(fallbackTemplates);
          setSelectedTemplate(fallbackTemplates[0]);
        } else if (data && data.length > 0) {
          setTemplates(data);
          setSelectedTemplate(data[0]);
          setCurrentTemplateIndex(0);
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
    if (!file) {
      setExtractedData(null);
      setGeneratedResume(null);
    }
  };

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    toast({
      title: "Data Extracted!",
      description: "Resume data has been successfully extracted."
    });
  };

  const handleTemplateSelect = (template: any, index: number) => {
    setSelectedTemplate(template);
    setCurrentTemplateIndex(index);
    console.log('Selected template:', template);
  };

  const handlePrevTemplate = () => {
    if (templates.length === 0) return;
    const newIndex = currentTemplateIndex > 0 ? currentTemplateIndex - 1 : templates.length - 1;
    setCurrentTemplateIndex(newIndex);
    setSelectedTemplate(templates[newIndex]);
  };

  const handleNextTemplate = () => {
    if (templates.length === 0) return;
    const newIndex = currentTemplateIndex < templates.length - 1 ? currentTemplateIndex + 1 : 0;
    setCurrentTemplateIndex(newIndex);
    setSelectedTemplate(templates[newIndex]);
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

  const canGenerateResume = selectedTemplate && extractedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Resume Builder</h1>
          <p className="text-gray-600">Upload your resume, select a template, and generate a professional resume.</p>
        </div>

        {/* Template Selection Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Choose Your Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isTemplateLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading templates...</p>
              </div>
            ) : (
              <div className="relative">
                {/* Template Preview */}
                <div className="flex items-center justify-center mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevTemplate}
                    className="mr-4"
                    disabled={templates.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="bg-white rounded-lg shadow-lg p-8 min-h-[400px] w-full max-w-md mx-4 border-2 border-gray-200 transition-all duration-300 hover:shadow-xl">
                    {selectedTemplate ? (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTemplate.name}</h3>
                        <p className="text-gray-600 mb-4">{selectedTemplate.description || 'Professional template'}</p>
                        
                        {/* Template Preview Mockup */}
                        <div className="bg-gray-50 rounded p-4 text-left text-xs space-y-2">
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          <div className="space-y-1 mt-3">
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                          </div>
                          <div className="mt-3">
                            <div className="h-2 bg-blue-300 rounded w-1/3 mb-1"></div>
                            <div className="h-1 bg-gray-200 rounded w-full"></div>
                            <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                        
                        <Badge className="mt-4 bg-blue-100 text-blue-700">
                          Template {currentTemplateIndex + 1} of {templates.length}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No template selected</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextTemplate}
                    className="ml-4"
                    disabled={templates.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Template Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {templates.map((template, index) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                      onClick={() => handleTemplateSelect(template, index)}
                      className={`h-auto p-3 text-xs ${
                        selectedTemplate?.id === template.id 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium truncate">{template.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: File Upload and Data Extraction */}
          <Card>
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
            </CardContent>
          </Card>

          {/* Right Column: Generate and Preview Resume */}
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
                  canGenerateResume 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                onClick={handleGenerateResume} 
                disabled={!canGenerateResume || isGenerating}
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

              {!canGenerateResume && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-amber-800 text-sm">
                    <div className="font-medium mb-1">Required to generate resume:</div>
                    <ul className="space-y-1">
                      {!selectedTemplate && (
                        <li className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Select a template above
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
        </div>

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
  );
};

export default ResumeBuilderApp;
