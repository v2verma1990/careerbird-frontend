
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
import { Loader2, Download, Eye, Plus, Trash2, Upload } from "lucide-react";
import api from "@/utils/apiClient";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
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
        // Use fallback templates if API fails
        setTemplates(fallbackTemplates);
      } else {
        setTemplates(result.data || fallbackTemplates);
      }
    } catch (error) {
      setTemplates(fallbackTemplates);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fallbackTemplates: Template[] = [
    {
      id: "modern-clean",
      name: "Modern Clean",
      description: "A clean, modern design with a professional look",
      thumbnail: "/resume-templates/thumbnails/modern-clean.png",
      category: "professional"
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "A minimalist design focusing on content",
      thumbnail: "/resume-templates/thumbnails/minimal.png",
      category: "minimal"
    },
    {
      id: "creative",
      name: "Creative",
      description: "A creative design for design and creative professionals",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative"
    },
    {
      id: "professional",
      name: "Professional",
      description: "A traditional professional resume layout",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional"
    },
    {
      id: "executive",
      name: "Executive",
      description: "An executive-level resume design",
      thumbnail: "/resume-templates/thumbnails/executive.png",
      category: "professional"
    },
    {
      id: "tech",
      name: "Tech",
      description: "A modern design for tech professionals",
      thumbnail: "/resume-templates/thumbnails/tech.png",
      category: "professional"
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "An elegant design with a touch of sophistication",
      thumbnail: "/resume-templates/thumbnails/elegant.png",
      category: "professional"
    },
    {
      id: "academic",
      name: "Academic",
      description: "A design suited for academic and research positions",
      thumbnail: "/resume-templates/thumbnails/academic.png",
      category: "specialized"
    },
    {
      id: "entry-level",
      name: "Entry Level",
      description: "Perfect for recent graduates and entry-level positions",
      thumbnail: "/resume-templates/thumbnails/entry-level.png",
      category: "simple"
    },
    {
      id: "chronological",
      name: "Chronological",
      description: "A traditional chronological resume layout",
      thumbnail: "/resume-templates/thumbnails/chronological.png",
      category: "simple"
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
      setLoading(true);
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
        setResumeData(result.data);
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
      setLoading(false);
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
      const result = await api.resumeBuilder.buildResume({
        resumeData: JSON.stringify(resumeData),
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

      if (result.data?.html) {
        setPreviewHtml(result.data.html);
        setShowPreview(true);
        toast({
          title: "Success",
          description: "Resume generated successfully!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate resume",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = () => {
    if (!previewHtml) return;

    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.name || 'resume'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showPreview && previewHtml) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Resume Preview</h1>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Editor
              </Button>
              <Button onClick={downloadResume}>
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[800px] border-0"
              title="Resume Preview"
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
          <h1 className="text-4xl font-bold mb-4">Resume Builder</h1>
          <p className="text-xl text-gray-600">Create a professional resume with our easy-to-use builder</p>
        </div>

        {templatesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Template Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-32 object-cover rounded mb-2"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280'%3ETemplate%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <Badge variant="secondary" className="mt-2">
                          {template.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Information</CardTitle>
                  <div className="flex gap-4">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('resume-upload')?.click()}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Existing Resume
                    </Button>
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
                          placeholder="Brief professional summary..."
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
                              onClick={() => removeSkill(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
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
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Generate Resume
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
