import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Eye, Plus, Trash2, Upload, FileText } from "lucide-react";
import api from "@/utils/apiClient";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/ResumeBuilderApp.css";

const API_BASE_URL = "http://localhost:5001/api"; // Match the URL used in apiClient.ts

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  color: string;
}

interface ExperienceItem {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EducationItem {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}

interface ProjectItem {
  name: string;
  description: string;
  technologies: string;
}

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
}

const ResumeBuilderApp = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: []
  });
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const result = await api.resumeBuilder.getTemplates();
      if (result.error) {
        setTemplates(beautifulTemplates);
      } else {
        // Create a map of template IDs to avoid duplicates
        const templateMap = new Map();
        
        // Add hardcoded templates first
        beautifulTemplates.forEach(template => {
          templateMap.set(template.id, template);
        });
        
        // Add API templates, overriding any duplicates
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach(template => {
            if (template.id && !templateMap.has(template.id)) {
              templateMap.set(template.id, template);
            }
          });
        }
        
        // Convert map back to array
        setTemplates(Array.from(templateMap.values()));
      }
    } catch (error) {
      setTemplates(beautifulTemplates);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const beautifulTemplates: Template[] = [
    {
      id: "modern-executive",
      name: "Modern Executive",
      description: "Clean, professional design perfect for executives and senior roles",
      thumbnail: "/resume-templates/thumbnails/executive.PNG",
      category: "professional",
      color: "#1e3a8a"
    },
    {
      id: "creative-designer",
      name: "Creative Designer",
      description: "Bold, creative layout ideal for designers and creative professionals",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative",
      color: "#7c3aed"
    },
    {
      id: "creative-designer-simple",
      name: "Creative Designer Simple",
      description: "Simplified creative layout for designers and artists",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative",
      color: "#7c3aed"
    },
    {
      id: "tech-minimalist",
      name: "Tech Minimalist",
      description: "Clean, minimal design focusing on skills and experience",
      thumbnail: "/resume-templates/thumbnails/tech.PNG",
      category: "tech",
      color: "#059669"
    },
    {
      id: "startup-founder",
      name: "Startup Founder",
      description: "Dynamic layout for entrepreneurs and startup professionals",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional",
      color: "#dc2626"
    },
    {
      id: "academic-scholar",
      name: "Academic Scholar",
      description: "Traditional academic format for researchers and professors",
      thumbnail: "/resume-templates/thumbnails/academic.PNG",
      category: "academic",
      color: "#1f2937"
    },
    {
      id: "marketing-pro",
      name: "Marketing Pro",
      description: "Vibrant design perfect for marketing and sales professionals",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative",
      color: "#ea580c"
    },
    {
      id: "finance-expert",
      name: "Finance Expert",
      description: "Conservative, trustworthy design for finance professionals",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional",
      color: "#0f172a"
    },
    {
      id: "modern-clean",
      name: "Modern Clean",
      description: "Clean, modern design with a professional look",
      thumbnail: "/resume-templates/thumbnails/modern-clean.png",
      category: "professional",
      color: "#0369a1"
    },
    {
      id: "entry-graduate",
      name: "Fresh Graduate",
      description: "Perfect for new graduates and entry-level professionals",
      thumbnail: "/resume-templates/thumbnails/entry-level.PNG",
      category: "entry-level",
      color: "#16a34a"
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "Elegant, sophisticated design for experienced professionals",
      thumbnail: "/resume-templates/thumbnails/elegant.PNG",
      category: "professional",
      color: "#7c2d12"
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Clean, minimal design focusing on content",
      thumbnail: "/resume-templates/thumbnails/minimal.png",
      category: "tech",
      color: "#4338ca"
    },
    {
      id: "product-manager",
      name: "Product Manager",
      description: "Strategic design for product managers and project leads",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional",
      color: "#0891b2"
    }
  ];

  const handleInputChange = (field: keyof ResumeData, value: string) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: ""
      }]
    }));
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        gpa: ""
      }]
    }));
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: "",
        issuer: "",
        date: ""
      }]
    }));
  };

  const updateCertification = (index: number, field: keyof CertificationItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: "",
        description: "",
        technologies: ""
      }]
    }));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) => 
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const removeProject = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setExtracting(true);
      const result = await api.resumeBuilder.extractResumeData(file);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      if (result.data) {
        setResumeData({
          name: result.data.name || "",
          title: result.data.title || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          location: result.data.location || "",
          linkedin: result.data.linkedin || "",
          website: result.data.website || "",
          summary: result.data.summary || "",
          skills: result.data.skills || [],
          experience: result.data.experience || [],
          education: result.data.education || [],
          certifications: result.data.certifications || [],
          projects: result.data.projects || []
        });
        toast({
          title: "Success",
          description: "Resume data extracted successfully!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract resume data",
        variant: "destructive"
      });
    } finally {
      setExtracting(false);
    }
  };

  const generateResume = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log(`Generating resume with template: ${selectedTemplate}`);
      console.log("Resume data being sent:", resumeData);
      
      // Make sure we're sending valid data in the format the backend expects
      const dataToSend = {
        // Personal information
        name: resumeData.name || "",
        title: resumeData.title || "",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        location: resumeData.location || "",
        linkedIn: resumeData.linkedin || "", // Note: backend expects 'linkedIn' with capital 'I'
        website: resumeData.website || "",
        summary: resumeData.summary || "",
        
        // Arrays
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        certifications: resumeData.certifications || [],
        projects: resumeData.projects || []
      };
      
      const result = await api.resumeBuilder.buildResume({
        resumeData: JSON.stringify(dataToSend),
        templateId: selectedTemplate
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        console.error("Resume generation error:", result.error);
        return;
      }

      if (result.data) {
        console.log("Resume data received:", result.data);
        
        // Just use the HTML directly from the backend
        let htmlContent = result.data.html || "";
        
        console.log(`Resume HTML received, length: ${htmlContent.length} characters`);
        console.log("First 200 characters of HTML:", htmlContent.substring(0, 200));
        
        // Just use the HTML directly from the backend without any modifications
        setPreviewHtml(htmlContent);
        setShowPreview(true);
        toast({
          title: "Success",
          description: "Resume generated successfully!"
        });
      } else {
        console.error("No HTML content received in the response");
        toast({
          title: "Warning",
          description: "Resume was generated but no content was received",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error("Resume generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate resume",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // New: Generate Best AI Resume
  const generateBestAIResume = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      // Call the optimize_resume_service API (or similar)
      const dataToSend = {
        name: resumeData.name || "",
        title: resumeData.title || "",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        location: resumeData.location || "",
        linkedIn: resumeData.linkedin || "",
        website: resumeData.website || "",
        summary: resumeData.summary || "",
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        certifications: resumeData.certifications || [],
        projects: resumeData.projects || []
      };
      // Use the optimize endpoint (assume api.resumeBuilder.optimizeResume exists)
      const result = await api.resumeBuilder.optimizeResumeForResumeBuilder({
        resumeData: JSON.stringify(dataToSend),
        templateId: selectedTemplate
      });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      if (result.data && result.data.optimized) {
        // Use the optimized HTML for preview
        setPreviewHtml(result.data.optimized);
        setShowPreview(true);
        toast({
          title: "Success",
          description: "Best AI Resume generated successfully!"
        });
      } else {
        toast({
          title: "Warning",
          description: "No optimized resume content received",
          variant: "warning"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate best AI resume",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async (format: 'docx' | 'pdf' | 'html' = 'docx') => {
    if (!previewHtml) return;

    try {
      // For HTML format, handle directly in the browser
      if (format === 'html') {
        const blob = new Blob([previewHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.name || 'resume'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Resume downloaded as HTML"
        });
        return;
      }
      
        // const result = await api.resumeBuilder.buildResume({
  //       resumeData: JSON.stringify(dataToSend),
  //       templateId: selectedTemplate
  //     });

      // For DOCX and PDF, use the .NET backend API
      setDownloadLoading(format);
      try {
        // Use the .NET backend endpoint
        const { data: { session } } = await supabase.auth.getSession();
        const response = await api.resumeBuilder.downloadResume({
          resumeText: previewHtml,
          format: format,
          accessToken: session?.access_token || ''
        });
        console.log(response);
        // const response = await fetch(`${API_BASE_URL}/resumebuilder/download`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        //   },
        //   body: JSON.stringify({
        //     resumeText: previewHtml,
        //     format: format
        //   }),
        //   credentials: 'include'
        // });

        if (response.ok) {
          // Get the blob from the response
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          // Create a link and trigger the download
          const a = document.createElement('a');
          a.href = url;
          a.download = `${resumeData.name || 'resume'}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "Success",
            description: `Resume downloaded as ${format.toUpperCase()}`
          });
          return;
        } else {
          throw new Error(`API returned status: ${response.status}`);
        }
      } catch (apiError) {
        console.error("API download attempt failed:", apiError);
        // Only fallback to HTML if backend fails
        const blob = new Blob([previewHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.name || 'resume'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "HTML Downloaded",
          description: `The resume was downloaded as HTML because the ${format.toUpperCase()} conversion service is currently unavailable. You can open this HTML file in Word or Google Docs and save it as ${format.toUpperCase()} manually.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Error",
        description: `Failed to download resume`,
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(null);
    }
  };

  if (showPreview && previewHtml) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Resume Preview</h1>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <FileText className="w-4 h-4 mr-2" />
                Back to Editor
              </Button>
              <div className="flex gap-2">
                {/* <Button 
                  onClick={() => downloadResume('docx')} 
                  variant="default"
                  disabled={downloadLoading !== null}
                >
                  {downloadLoading === 'docx' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download DOCX
                </Button> */}
                <Button 
                  onClick={() => downloadResume('pdf')} 
                  variant="outline"
                  disabled={downloadLoading !== null}
                >
                  {downloadLoading === 'pdf' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button 
                  onClick={() => downloadResume('html')} 
                  variant="outline"
                  disabled={downloadLoading !== null}
                >
                  {downloadLoading === 'html' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download HTML
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[800px] border-0"
              title="Resume Preview"
              onLoad={(e) => {
                // Ensure iframe content is properly sized
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentDocument) {
                  const iframeBody = iframe.contentDocument.body;
                  if (iframeBody) {
                    // Force styles to be applied
                    iframeBody.style.margin = '0';
                    iframeBody.style.padding = '0';
                    iframeBody.style.height = '100%';
                    iframeBody.style.width = '100%';
                    
                    // Log for debugging
                    console.log('Resume preview iframe loaded successfully');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Professional Resume Builder</h1>
          <p className="text-xl text-gray-600">Create stunning resumes with our AI-powered builder and beautiful templates</p>
        </div>

        {templatesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Template Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Choose Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div 
                          className="w-full h-24 rounded mb-2 flex items-center justify-center text-white font-semibold text-sm template-color"
                          style={{ "--template-color": template.color || '#6b7280' } as React.CSSProperties}
                        >
                          {template.name}
                        </div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Resume Information
                    </CardTitle>
                    <div className="flex gap-2">
                      <Label htmlFor="resume-upload" className="sr-only">
                        Upload Resume File
                      </Label>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                        aria-label="Upload Resume File"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('resume-upload')?.click()}
                        disabled={extracting}
                        size="sm"
                      >
                        {extracting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Extract from Resume
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                      <TabsTrigger value="education">Education</TabsTrigger>
                      <TabsTrigger value="skills">Skills</TabsTrigger>
                      <TabsTrigger value="additional">Additional</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={resumeData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="title">Job Title *</Label>
                          <Input
                            id="title"
                            value={resumeData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Software Developer"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={resumeData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={resumeData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/johndoe"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={resumeData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="johndoe.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          value={resumeData.summary}
                          onChange={(e) => handleInputChange('summary', e.target.value)}
                          placeholder="Brief professional summary highlighting your key achievements and skills..."
                          rows={4}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Work Experience</h3>
                        <Button onClick={addExperience} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      {resumeData.experience.map((exp, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-semibold">Experience {index + 1}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeExperience(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Job Title</Label>
                                <Input
                                  value={exp.title}
                                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                  placeholder="Software Developer"
                                />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input
                                  value={exp.company}
                                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                  placeholder="Company Name"
                                />
                              </div>
                              <div>
                                <Label>Location</Label>
                                <Input
                                  value={exp.location}
                                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                  placeholder="City, State"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label>Start Date</Label>
                                  <Input
                                    value={exp.startDate}
                                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                    placeholder="Jan 2020"
                                  />
                                </div>
                                <div>
                                  <Label>End Date</Label>
                                  <Input
                                    value={exp.endDate}
                                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                    placeholder="Present"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label>Description</Label>
                              <Textarea
                                value={exp.description}
                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                placeholder="Describe your responsibilities and achievements..."
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="education" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Education</h3>
                        <Button onClick={addEducation} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                      {resumeData.education.map((edu, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-semibold">Education {index + 1}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeEducation(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Degree</Label>
                                <Input
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                  placeholder="Bachelor of Science"
                                />
                              </div>
                              <div>
                                <Label>Institution</Label>
                                <Input
                                  value={edu.institution}
                                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                  placeholder="University Name"
                                />
                              </div>
                              <div>
                                <Label>Location</Label>
                                <Input
                                  value={edu.location}
                                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                  placeholder="City, State"
                                />
                              </div>
                              <div>
                                <Label>GPA (Optional)</Label>
                                <Input
                                  value={edu.gpa || ''}
                                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                  placeholder="3.8"
                                />
                              </div>
                              <div>
                                <Label>Start Date</Label>
                                <Input
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                                  placeholder="2016"
                                />
                              </div>
                              <div>
                                <Label>End Date</Label>
                                <Input
                                  value={edu.endDate}
                                  onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                                  placeholder="2020"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4">
                      <div>
                        <Label htmlFor="new-skill">Add Skills</Label>
                        <div className="flex gap-2">
                          <Input
                            id="new-skill"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Enter a skill"
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          />
                          <Button onClick={addSkill}>Add</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-2">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                              aria-label={`Remove ${skill} skill`}
                              title={`Remove ${skill}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="additional" className="space-y-6">
                      {/* Certifications */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Certifications</h3>
                          <Button onClick={addCertification} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Certification
                          </Button>
                        </div>
                        {resumeData.certifications.map((cert, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold">Certification {index + 1}</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCertification(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={cert.name}
                                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                    placeholder="Certification Name"
                                  />
                                </div>
                                <div>
                                  <Label>Issuer</Label>
                                  <Input
                                    value={cert.issuer}
                                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                                    placeholder="Issuing Organization"
                                  />
                                </div>
                                <div>
                                  <Label>Date</Label>
                                  <Input
                                    value={cert.date}
                                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                                    placeholder="Month Year"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Separator />

                      {/* Projects */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Projects</h3>
                          <Button onClick={addProject} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project
                          </Button>
                        </div>
                        {resumeData.projects.map((project, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold">Project {index + 1}</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeProject(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Project Name</Label>
                                  <Input
                                    value={project.name}
                                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                                    placeholder="Project Name"
                                  />
                                </div>
                                <div>
                                  <Label>Technologies</Label>
                                  <Input
                                    value={project.technologies}
                                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                                    placeholder="React, Node.js, MongoDB"
                                  />
                                </div>
                              </div>
                              <div className="mt-4">
                                <Label>Description</Label>
                                <Textarea
                                  value={project.description}
                                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                                  placeholder="Describe your project..."
                                  rows={3}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={generateResume}
                      disabled={loading || !selectedTemplate}
                      className="flex-1"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Generate Resume
                    </Button>
                    {/* New: Best AI Resume Button */}
                    <Button
                      onClick={generateBestAIResume}
                      disabled={loading || !selectedTemplate}
                      className="flex-1"
                      size="lg"
                      variant="secondary"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Generate Best AI Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
