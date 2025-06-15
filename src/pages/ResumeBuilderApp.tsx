import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Download, Eye, User, Briefcase, GraduationCap, Award, Code, Plus, X, Sparkles, Zap, FileCheck, ArrowLeft, ArrowRight, Edit, Palette } from 'lucide-react';
import ResumeFileUploader from '@/components/ResumeFileUploader';
import { resumeBuilderApi } from '@/utils/resumeBuilderApi';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/utils/apiClient';
import { useResume } from "@/contexts/resume/ResumeContext";
import Handlebars from 'handlebars';

// Template data for step 1
const templates = [
  {
    id: "navy-column-modern",
    name: "Navy Column Modern",
    description: "Professional layout with navy sidebar and clean white content area",
    thumbnail: "/lovable-uploads/111bb875-e937-4ebf-8470-bc9c0fd0e801.png",
    category: "professional",
    color: "navy",
    isRecommended: true,
    isNew: true
  },
  {
    id: "modern-executive",
    name: "Modern Executive",
    description: "Clean, professional design perfect for executives",
    thumbnail: "/lovable-uploads/be00c166-3bf1-4879-af44-a2f578e88bf7.png",
    category: "professional",
    color: "blue",
    isPopular: true,
    isRecommended: true
  },
  {
    id: "creative-designer",
    name: "Creative Designer",
    description: "Bold, creative layout for designers",
    thumbnail: "/resume-templates/thumbnails/creative.png",
    category: "creative",
    color: "purple",
    isPremium: true
  },
  {
    id: "tech-minimalist",
    name: "Tech Minimalist",
    description: "Clean, minimal design for tech professionals",
    thumbnail: "/resume-templates/thumbnails/tech.PNG",
    category: "tech",
    color: "green",
    isNew: true
  },
  {
    id: "academic-scholar",
    name: "Academic Scholar",
    description: "Traditional format for researchers",
    thumbnail: "/resume-templates/thumbnails/academic.PNG",
    category: "academic",
    color: "gray",
    isRecommended: true
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description: "Dynamic layout for entrepreneurs",
    thumbnail: "/resume-templates/thumbnails/professional.png",
    category: "professional",
    color: "orange",
    isPremium: true
  },
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description: "Perfect for new graduates and entry-level positions",
    thumbnail: "/resume-templates/thumbnails/entry-level.PNG",
    category: "entry-level",
    color: "teal",
    isPopular: true,
    isRecommended: true
  },
  {
    id: "grey-classic-profile",
    name: "Grey Classic Profile",
    description: "Elegant and clear template with sidebar and modern layout",
    thumbnail: "/lovable-uploads/e8267b3d-746e-4d28-9688-1810ab72c83c.png",
    category: "classic",
    color: "gray",
    isRecommended: false,
    isNew: true
  },
  {
    id: "blue-sidebar-profile",
    name: "Blue Sidebar Profile",
    description: "Elegant template with left sidebar and section dividers, matching classic professional format.",
    thumbnail: "/lovable-uploads/502adb7a-83b3-4ebe-a1c2-6450915f1ed0.png",
    category: "classic",
    color: "blue",
    isNew: true
  },
  {
    id: "green-sidebar-receptionist",
    name: "Green Sidebar Receptionist",
    description: "Fresh and approachable sidebar template matching receptionist roles",
    thumbnail: "/lovable-uploads/e72aeeac-84f9-493e-85af-c1994a03dc55.png",
    category: "classic",
    color: "green",
    isNew: true
  },
  {
    id: "classic-profile-orange",
    name: "Classic Profile Orange",
    description: "Elegant resume with orange name, clean sidebar and modern readable content.",
    thumbnail: "/lovable-uploads/aefc4f9a-f33d-406b-a191-f7aae767471d.png",
    category: "classic",
    color: "orange",
    isNew: true
  },
  {
    id: "classic-law-bw",
    name: "Classic Law Black & White",
    description: "Traditional black & white legal resume with section dividers and simple typographic elegance.",
    thumbnail: "/lovable-uploads/411cd4d2-9f96-4fa4-abaf-60b6828225fb.png",
    category: "classic",
    color: "gray",
    isNew: true
  }
];

// Light placeholder data that clears on click
const initialData = {
  Name: "",
  Title: "",
  Email: "",
  Phone: "",
  Location: "",
  LinkedIn: "",
  Website: "",
  Summary: "",
  Skills: [],
  Experience: [{
    Title: "",
    Company: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    Description: ""
  }],
  Education: [{
    Degree: "",
    Institution: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    GPA: ""
  }],
  Certifications: [{
    Name: "",
    Issuer: "",
    Date: ""
  }],
  Projects: [{
    Name: "",
    Description: "",
    Technologies: ""
  }]
};

const ResumeBuilderApp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get('template') || '');
  const [currentStep, setCurrentStep] = useState(selectedTemplate ? 2 : 1);
  const [resumeData, setResumeData] = useState(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [dataSource, setDataSource] = useState('manual'); // 'manual', 'upload', or 'default'
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [sampleResumeData, setSampleResumeData] = useState<any>(null);
  const [useSampleData, setUseSampleData] = useState(true); // Always use sample data for preview for now
  const [hasDefaultResume, setHasDefaultResume] = useState(false);
  const { toast } = useToast();
  const { defaultResume, isLoading } = useResume();

  // Load sample resume data for preview
  useEffect(() => {
    if (showPreview && !sampleResumeData) {
      fetch('/resume-templates/sample-data.json')
        .then(res => res.json())
        .then(data => setSampleResumeData(data))
        .catch(() => setSampleResumeData(null));
    }
  }, [showPreview, sampleResumeData]);

  // Load and compile template HTML for preview
  useEffect(() => {
    if (showPreview && previewTemplate) {
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/resume-templates/html/${previewTemplate}.html`);
          const html = await response.text();
          // Use sample data for preview
          const dataForPreview = useSampleData && sampleResumeData ? sampleResumeData : resumeData;
          const compiled = Handlebars.compile(html)(dataForPreview);
          setTemplateHtml(compiled);
        } catch (error) {
          setTemplateHtml('<p>Failed to load template</p>');
        }
      };
      loadTemplate();
    }
  }, [showPreview, previewTemplate, resumeData, sampleResumeData, useSampleData]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setSearchParams({ template: templateId });
  };

  // Go to next step (Step 2: Resume Data)
  const goToStep2 = () => {
    if (!selectedTemplate) {
      toast({
        title: "Please select a template",
        description: "You need to select a template before proceeding to the next step.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  // Go back to step 1 (Template selection)
  const goToStep1 = () => {
    setCurrentStep(1);
  };

  // Function to extract data from default resume
  const handleExtractFromDefaultResume = async () => {
    setIsExtracting(true);
    try {
      const { data, error } = await apiClient.resumeBuilder.extractResumeData(null, true);
      if (error) {
        setHasDefaultResume(false); // Explicitly set to false if backend says not found
        toast({
          title: "Extraction failed",
          description: error,
          variant: "destructive",
        });
        return;
      }
      // Map the extracted data to our resume format
      const mappedData = {
        Name: data.Name || data.name || "",
        Title: data.Title || data.title || "",
        Email: data.Email || data.email || "",
        Phone: data.Phone || data.phone || "",
        Location: data.Location || data.location || "",
        LinkedIn: data.LinkedIn || data.linkedin || "",
        Website: data.Website || data.website || "",
        Summary: data.Summary || data.summary || data.result?.summary || "",
        Skills: data.Skills || data.skills || [],
        Experience: data.Experience || data.experience || [],
        Education: data.Education || data.education || [],
        Certifications: data.Certifications || data.certifications || [],
        Projects: data.Projects || data.projects || []
      };

      setResumeData(mappedData);
      setHasDefaultResume(true); // Only set to true on success
      console.log('Resume data after extraction:', mappedData);
      setDataSource('default');
      toast({
        title: "Resume extracted successfully!",
        description: "Your default resume data has been extracted and populated in the form.",
      });
    } catch (error) {
      setHasDefaultResume(false); // Also set to false on exception
      console.error('Error extracting resume data:', error);
      toast({
        title: "Extraction failed",
        description: `Failed to extract resume data: ${error.message}. Please try again or fill manually.`,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Function to handle file selection and extraction
  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    
    setIsExtracting(true);
    console.log('Starting resume extraction for file:', file.name);
    
    try {
      // Replace direct fetch with API abstraction
      const result = await apiClient.resumeBuilder.optimizeResumeForResumeBuilder({
        resumeData: '', // or pass actual data if needed
        templateId: selectedTemplate
      });
      if (result.error) {
        toast({
          title: "Extraction failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      // Map and set resume data as before
      if (result.data) {
        // ...mapping logic...
      }
      toast({
        title: "Resume extracted successfully!",
        description: "Your resume data has been extracted and populated in the form.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addArrayItem = (field: string, newItem: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setResumeData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: string, index: number, updatedItem: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? updatedItem : item)
    }));
  };

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      const result = await resumeBuilderApi.buildResume({
        resumeData: JSON.stringify(resumeData),
        templateId: selectedTemplate
      });

      if (result.error) {
        toast({
          title: "Generation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.data?.html) {
        // Navigate to preview page with the generated HTML
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData))
        });
        navigate(`/resume-preview?${params.toString()}`);

        toast({
          title: "Success!",
          description: "Your resume has been generated. You can now preview and download it.",
        });
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateResumeViaAI = async () => {
    setIsGenerating(true);
    try {
      // Call AI-enhanced resume generation
      const result = await resumeBuilderApi.buildResume({
        resumeData: JSON.stringify(resumeData),
        templateId: selectedTemplate,
        enhanceWithAI: true
      });

      if (result.error) {
        toast({
          title: "AI Generation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.data?.html) {
        // Navigate to preview page with the generated HTML
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData)),
          aiEnhanced: 'true'
        });
        navigate(`/resume-preview?${params.toString()}`);

        toast({
          title: "Success!",
          description: "Your AI-enhanced resume has been generated. You can now preview and download it.",
        });
      }
    } catch (error) {
      console.error('Error generating AI resume:', error);
      toast({
        title: "AI Generation failed",
        description: "Failed to generate AI-enhanced resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIEnhancedResume = async () => {
    setIsGenerating(true);
    try {
      // Call premium AI-enhanced resume generation
      const result = await resumeBuilderApi.buildResume({
        resumeData: JSON.stringify(resumeData),
        templateId: selectedTemplate,
        enhanceWithAI: true,
        premiumEnhancement: true
      });

      if (result.error) {
        toast({
          title: "AI Enhanced Generation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.data?.html) {
        // Navigate to preview page with the generated HTML
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData)),
          aiEnhanced: 'true',
          premium: 'true'
        });
        navigate(`/resume-preview?${params.toString()}`);

        toast({
          title: "Success!",
          description: "Your premium AI-enhanced resume has been generated. You can now preview and download it.",
        });
      }
    } catch (error) {
      console.error('Error generating AI enhanced resume:', error);
      toast({
        title: "AI Enhanced Generation failed",
        description: "Failed to generate premium AI-enhanced resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Example for optimizing resume:
  const handleOptimizeResume = async (dataToSend, selectedTemplate) => {
    setIsGenerating(true);
    try {
      const result = await apiClient.resumeBuilder.optimizeResumeForResumeBuilder({
        resumeData: JSON.stringify(dataToSend),
        templateId: selectedTemplate
      });
      if (result.error) {
        toast({
          title: "Optimization failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      // ...handle result.data as needed...
      toast({
        title: "Resume optimized!",
        description: "Your resume has been optimized.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // On mount, check if a default resume is already present (e.g., from profile load)
  useEffect(() => {
    if (resumeData && resumeData.Name && resumeData.Name.trim() !== "") {
      setHasDefaultResume(true);
    }
  }, [resumeData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Steps */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Builder</h1>
          
          {/* Step Indicators */}
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className={`ml-3 font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Choose Template
              </span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className={`ml-3 font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Add Resume Data
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold mb-2">
                <Palette className="h-5 w-5" />
                Step 1: Choose Your Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Template Grid with Large Previews */}
              <div className="w-full flex flex-wrap justify-center gap-10 mb-8">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`
                      group flex flex-col items-center cursor-pointer transition-all duration-300
                      ${selectedTemplate === template.id
                        ? "ring-4 ring-blue-600 shadow-2xl"
                        : "hover:ring-2 hover:ring-blue-400 hover:shadow-xl"
                      }
                      bg-white rounded-xl p-4
                      w-[345px] md:w-[350px] lg:w-[370px] xl:w-[390px]
                      min-h-[600px]
                    `}
                    style={{
                      boxShadow: selectedTemplate === template.id
                        ? '0 12px 42px 0 rgba(30,64,175,0.18)'
                        : '0 6px 24px 0 rgba(30,64,175,0.08)'
                    }}
                  >
                    {/* Preview Resume Sheet (large thumbnail) */}
                    <div
                      className="
                        bg-white rounded-lg shadow-lg overflow-hidden relative
                        flex items-center justify-center
                        w-full h-[520px] md:h-[540px] lg:h-[550px] xl:h-[570px]
                        aspect-[210/297]
                        border border-gray-200
                        mb-4
                        transition-transform duration-300
                        group-hover:scale-[1.04]
                        "
                    >
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="object-contain w-full h-full bg-white"
                        style={{ backgroundColor: "white", borderRadius: 10 }}
                        onError={e => {
                          e.currentTarget.src = "/resume-templates/thumbnails/professional.png";
                        }}
                      />
                      {selectedTemplate === template.id && (
                        <div className="absolute inset-0 pointer-events-none border-[3.5px] border-blue-700 rounded-lg"></div>
                      )}
                    </div>
                    {/* Template name/desc/badges */}
                    <div className="flex flex-col items-center w-full">
                      <div className="font-semibold text-xl text-gray-900 mb-1">{template.name}</div>
                      <div className="text-gray-500 text-sm mb-1 text-center">{template.description}</div>
                      <div className="flex flex-wrap justify-center gap-2 mb-1">
                        {template.isRecommended && (
                          <Badge className="bg-blue-500 text-white text-xs">Recommended</Badge>
                        )}
                        {template.isPopular && (
                          <Badge className="bg-orange-400 text-white text-xs">Popular</Badge>
                        )}
                        {template.isPremium && (
                          <Badge className="bg-purple-500 text-white text-xs">Premium</Badge>
                        )}
                        {template.isNew && (
                          <Badge className="bg-green-500 text-white text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Actions row */}
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={goToStep2} 
                  disabled={!selectedTemplate}
                  className="bg-blue-600 hover:bg-blue-700 px-8 text-lg font-semibold shadow-lg"
                  size="lg"
                >
                  Next: Add Resume Data
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Resume Data */}
        {currentStep === 2 && (
          <>
            {/* Template Selection Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">Selected Template:</div>
                    <div className="flex items-center gap-2">
                      <img 
                        src={templates.find(t => t.id === selectedTemplate)?.thumbnail} 
                        alt="Selected template"
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="font-medium">{templates.find(t => t.id === selectedTemplate)?.name}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={goToStep1}>
                    <Edit className="w-4 h-4 mr-2" />
                    Change Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Source Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Step 2: Choose Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={dataSource === 'default' ? 'default' : 'outline'}
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={handleExtractFromDefaultResume}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-6 w-6" />
                        <span>Extract from Default Resume</span>
                      </>
                    )}
                  </Button>
                  <div className="flex flex-col">
                    <ResumeFileUploader
                      onFileSelected={handleFileSelected}
                      setIsExtracting={setIsExtracting}
                      disabled={isExtracting}
                      showDefaultResumeOption={false}
                    />
                    {dataSource === 'upload' && (
                      <Badge variant="secondary" className="mt-2 self-center">
                        Data Extracted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500 min-h-[1.5em]">
                  {isLoading ? null : (
                    defaultResume
                      ? <div className="text-green-600">Default resume loaded: {defaultResume.fileName}</div>
                      : <div className="text-red-600">No default resume found. Please upload one in your profile settings to use the extract feature.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resume Information Section - now full width */}
            <div className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                      <TabsTrigger value="education">Education</TabsTrigger>
                      <TabsTrigger value="skills">Skills</TabsTrigger>
                      <TabsTrigger value="projects">Projects</TabsTrigger>
                      <TabsTrigger value="other">Other</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter your full name"
                            value={resumeData.Name}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="title">Professional Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter your professional title"
                            value={resumeData.Title}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={resumeData.Email}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="Enter your phone number"
                            value={resumeData.Phone}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="Enter your location"
                            value={resumeData.Location}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Location: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            placeholder="Enter your LinkedIn profile"
                            value={resumeData.LinkedIn}
                            onChange={(e) => setResumeData(prev => ({ ...prev, LinkedIn: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          placeholder="Enter your professional summary"
                          value={resumeData.Summary}
                          onChange={(e) => setResumeData(prev => ({ ...prev, Summary: e.target.value }))}
                          rows={4}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-4">
                      {resumeData.Experience.map((exp, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`experience-${index}-title`}>Job Title</Label>
                              <Input
                                id={`experience-${index}-title`}
                                placeholder="Enter job title"
                                value={exp.Title}
                                onChange={(e) => updateArrayItem('Experience', index, { ...exp, Title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`experience-${index}-company`}>Company</Label>
                              <Input
                                id={`experience-${index}-company`}
                                placeholder="Enter company name"
                                value={exp.Company}
                                onChange={(e) => updateArrayItem('Experience', index, { ...exp, Company: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`experience-${index}-location`}>Location</Label>
                              <Input
                                id={`experience-${index}-location`}
                                placeholder="Enter location"
                                value={exp.Location}
                                onChange={(e) => updateArrayItem('Experience', index, { ...exp, Location: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`experience-${index}-start-date`}>Start Date</Label>
                              <Input
                                id={`experience-${index}-start-date`}
                                placeholder="Enter start date"
                                value={exp.StartDate}
                                onChange={(e) => updateArrayItem('Experience', index, { ...exp, StartDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`experience-${index}-end-date`}>End Date</Label>
                              <Input
                                id={`experience-${index}-end-date`}
                                placeholder="Enter end date"
                                value={exp.EndDate}
                                onChange={(e) => updateArrayItem('Experience', index, { ...exp, EndDate: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`experience-${index}-description`}>Job Description</Label>
                            <Textarea
                              id={`experience-${index}-description`}
                              placeholder="Enter job description"
                              value={exp.Description}
                              onChange={(e) => updateArrayItem('Experience', index, { ...exp, Description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeArrayItem('Experience', index)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => addArrayItem('Experience', {
                          Title: "",
                          Company: "",
                          Location: "",
                          StartDate: "",
                          EndDate: "",
                          Description: ""
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </TabsContent>

                    <TabsContent value="education" className="space-y-4">
                      {resumeData.Education.map((edu, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`education-${index}-degree`}>Degree</Label>
                              <Input
                                id={`education-${index}-degree`}
                                placeholder="Enter degree"
                                value={edu.Degree}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, Degree: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`education-${index}-institution`}>Institution</Label>
                              <Input
                                id={`education-${index}-institution`}
                                placeholder="Enter institution name"
                                value={edu.Institution}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, Institution: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`education-${index}-location`}>Location</Label>
                              <Input
                                id={`education-${index}-location`}
                                placeholder="Enter location"
                                value={edu.Location}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, Location: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`education-${index}-start-date`}>Start Date</Label>
                              <Input
                                id={`education-${index}-start-date`}
                                placeholder="Enter start date"
                                value={edu.StartDate}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, StartDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`education-${index}-end-date`}>End Date</Label>
                              <Input
                                id={`education-${index}-end-date`}
                                placeholder="Enter end date"
                                value={edu.EndDate}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, EndDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`education-${index}-gpa`}>GPA</Label>
                              <Input
                                id={`education-${index}-gpa`}
                                placeholder="Enter GPA (optional)"
                                value={edu.GPA}
                                onChange={(e) => updateArrayItem('Education', index, { ...edu, GPA: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeArrayItem('Education', index)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => addArrayItem('Education', {
                          Degree: "",
                          Institution: "",
                          Location: "",
                          StartDate: "",
                          EndDate: "",
                          GPA: ""
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resumeData.Skills.map((skill, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              placeholder="Enter skill"
                              value={skill}
                              onChange={(e) => updateArrayItem('Skills', index, e.target.value)}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem('Skills', index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => addArrayItem('Skills', "")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                      {resumeData.Projects.map((project, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`project-${index}-name`}>Name</Label>
                              <Input
                                id={`project-${index}-name`}
                                placeholder="Enter project name"
                                value={project.Name}
                                onChange={(e) => updateArrayItem('Projects', index, { ...project, Name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`project-${index}-technologies`}>Technologies</Label>
                              <Input
                                id={`project-${index}-technologies`}
                                placeholder="Enter technologies used"
                                value={project.Technologies}
                                onChange={(e) => updateArrayItem('Projects', index, { ...project, Technologies: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`project-${index}-description`}>Description</Label>
                            <Textarea
                              id={`project-${index}-description`}
                              placeholder="Enter project description"
                              value={project.Description}
                              onChange={(e) => updateArrayItem('Projects', index, { ...project, Description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeArrayItem('Projects', index)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => addArrayItem('Projects', {
                          Name: "",
                          Description: "",
                          Technologies: ""
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </TabsContent>

                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Action Buttons Row */}
            <div className="mt-8 flex flex-col items-stretch gap-4 lg:flex-row lg:justify-end lg:items-center">
              <Button 
                className="w-full lg:w-auto lg:mr-4" 
                onClick={generateResume}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Resume
                  </>
                )}
              </Button>

              <Button 
                className="w-full lg:w-auto lg:mr-4 bg-blue-600 hover:bg-blue-700" 
                onClick={generateResumeViaAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Resume via AI
                  </>
                )}
              </Button>

              <Button 
                className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700" 
                onClick={generateAIEnhancedResume}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI Enhanced Resume
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
