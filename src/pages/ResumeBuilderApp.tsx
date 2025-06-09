
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/utils/apiClient';
import TopNavigation from '@/components/TopNavigation';
import { 
  Upload, 
  Download, 
  Eye, 
  FileText, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  Crown,
  Target,
  Zap,
  Palette,
  Search,
  Filter
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  premium: boolean;
  popular: boolean;
}

const ResumeBuilderApp = () => {
  const { user, subscriptionStatus } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Mock templates data
  const templates: Template[] = [
    { id: '1', name: 'Modern Executive', category: 'executive', description: 'Perfect for senior positions', thumbnail: '/placeholder.svg', premium: false, popular: true },
    { id: '2', name: 'Tech Professional', category: 'technology', description: 'Designed for tech roles', thumbnail: '/placeholder.svg', premium: false, popular: false },
    { id: '3', name: 'Creative Designer', category: 'creative', description: 'Showcase your creativity', thumbnail: '/placeholder.svg', premium: true, popular: false },
    { id: '4', name: 'Academic Scholar', category: 'academic', description: 'For research and academia', thumbnail: '/placeholder.svg', premium: true, popular: false },
    { id: '5', name: 'Startup Founder', category: 'startup', description: 'Entrepreneurial focused', thumbnail: '/placeholder.svg', premium: false, popular: true },
    { id: '6', name: 'Finance Expert', category: 'finance', description: 'Professional finance template', thumbnail: '/placeholder.svg', premium: true, popular: false }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'executive', name: 'Executive', count: templates.filter(t => t.category === 'executive').length },
    { id: 'technology', name: 'Technology', count: templates.filter(t => t.category === 'technology').length },
    { id: 'creative', name: 'Creative', count: templates.filter(t => t.category === 'creative').length },
    { id: 'academic', name: 'Academic', count: templates.filter(t => t.category === 'academic').length },
    { id: 'startup', name: 'Startup', count: templates.filter(t => t.category === 'startup').length },
    { id: 'finance', name: 'Finance', count: templates.filter(t => t.category === 'finance').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      toast({
        title: "File uploaded successfully",
        description: "Ready to extract resume data",
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleExtractResume = async () => {
    if (!resumeFile) {
      toast({
        title: "No file selected",
        description: "Please upload a resume first",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    try {
      const response = await api.resumeBuilder.extractResumeData(resumeFile);
      if (response.error) {
        throw new Error(response.error);
      }
      setExtractedData(response.data);
      toast({
        title: "Resume extracted successfully",
        description: "Your resume data has been processed",
      });
    } catch (error) {
      console.error('Error extracting resume:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract resume data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!selectedTemplate) {
      toast({
        title: "No template selected",
        description: "Please select a template first",
        variant: "destructive"
      });
      return;
    }

    if (!extractedData) {
      toast({
        title: "No resume data",
        description: "Please extract resume data first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Transform data to include both formats for template compatibility
      const transformedData = {
        ...extractedData,
        Name: extractedData.name || extractedData.Name || '',
        Email: extractedData.email || extractedData.Email || '',
        Phone: extractedData.phone || extractedData.Phone || '',
        Address: extractedData.address || extractedData.Address || '',
        Summary: extractedData.summary || extractedData.Summary || '',
        Experience: extractedData.experience || extractedData.Experience || [],
        Education: extractedData.education || extractedData.Education || [],
        Skills: extractedData.skills || extractedData.Skills || [],
        name: extractedData.name || extractedData.Name || '',
        email: extractedData.email || extractedData.Email || '',
        phone: extractedData.phone || extractedData.Phone || '',
        address: extractedData.address || extractedData.Address || '',
        summary: extractedData.summary || extractedData.Summary || '',
        experience: extractedData.experience || extractedData.Experience || [],
        education: extractedData.education || extractedData.Education || [],
        skills: extractedData.skills || extractedData.Skills || []
      };

      const response = await api.resumeBuilder.generateResume(transformedData, selectedTemplate.id);
      if (response.error) {
        throw new Error(response.error);
      }
      
      setPreviewHtml(response.data.html);
      toast({
        title: "Resume generated successfully",
        description: `Your resume has been created using the ${selectedTemplate.name} template`,
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (template.premium && subscriptionStatus?.type === 'free') {
      toast({
        title: "Premium Template",
        description: "This template requires a premium subscription",
        variant: "destructive"
      });
      return;
    }
    setSelectedTemplate(template);
    toast({
      title: "Template selected",
      description: `${template.name} template is now active`,
    });
  };

  const canGenerateResume = selectedTemplate && extractedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <TopNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Resume Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your existing resume with professional templates and AI optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Template Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  Choose Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Categories</Label>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Template Info */}
                {selectedTemplate && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700">Selected Template</Label>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-blue-900">{selectedTemplate.name}</h3>
                        {selectedTemplate.premium && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Template Selection Alert */}
            {!selectedTemplate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a template from the sidebar to continue with resume generation.
                </AlertDescription>
              </Alert>
            )}

            {/* Templates Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Professional Templates ({filteredTemplates.length})
                  </span>
                  <Badge variant="outline">
                    {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map(template => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedTemplate?.id === template.id 
                          ? 'ring-2 ring-blue-500 shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                          <img 
                            src={template.thumbnail} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                          {template.premium && (
                            <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {template.popular && (
                            <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
                              Popular
                            </Badge>
                          )}
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.premium && subscriptionStatus?.type === 'free' && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Upgrade Required
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload and Extraction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload & Extract Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="resume-upload" className="text-lg font-medium text-gray-700 cursor-pointer">
                      Upload your existing resume
                    </Label>
                    <p className="text-gray-500">PDF files only, max 10MB</p>
                    <Input
                      id="resume-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => document.getElementById('resume-upload')?.click()}
                      variant="outline"
                      className="mt-4"
                    >
                      Choose File
                    </Button>
                  </div>
                </div>

                {resumeFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{resumeFile.name}</p>
                        <p className="text-sm text-green-700">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        onClick={handleExtractResume}
                        disabled={isExtracting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isExtracting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Extract Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {extractedData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Resume data extracted successfully</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your resume information is ready for template generation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Generate Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleGenerateResume}
                    disabled={!canGenerateResume || isGenerating}
                    className={`flex-1 h-12 text-base font-medium ${
                      canGenerateResume 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Resume...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Resume
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    disabled={!previewHtml}
                    className={`${!previewHtml ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  
                  <Button 
                    variant="outline"
                    disabled={!previewHtml}
                    className={`${!previewHtml ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                {!canGenerateResume && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      To generate a resume, please: 
                      {!selectedTemplate && " select a template"}
                      {!selectedTemplate && !extractedData && " and"}
                      {!extractedData && " upload and extract your resume data"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            {previewHtml && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[800px] border-0"
                      title="Resume Preview"
                    />
                  </div>
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
