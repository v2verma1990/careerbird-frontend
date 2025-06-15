import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, ArrowRight, Star, Crown, Sparkles, Palette, ArrowLeft, Download, FileText, Upload } from "lucide-react";
import ResumeFileUploader from "@/components/ResumeFileUploader";

interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date?: string;
  }[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

const ResumeBuilderApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get template from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const preselectedTemplate = searchParams.get('template');
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>(preselectedTemplate || '');
  const [showPreview, setShowPreview] = useState(false);
  const [dataSource, setDataSource] = useState<'manual' | 'extract' | null>(null);
  const [useDefaultResume, setUseDefaultResume] = useState(false);
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: "John Doe",
      title: "Senior Software Engineer",
      email: "john.doe@example.com",
      phone: "(123) 456-7890",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/johndoe",
      website: "johndoe.com"
    },
    summary: "Experienced software engineer with 8+ years of expertise in developing scalable web applications using React, Node.js, and AWS. Proven track record of leading teams to deliver high-quality products on time and within budget.",
    experience: [
      {
        title: "Senior Software Engineer",
        company: "Tech Solutions Inc.",
        location: "San Francisco, CA",
        startDate: "Jan 2020",
        endDate: "Present",
        responsibilities: [
          "Led a team of 5 developers to build a new e-commerce platform that increased sales by 35%",
          "Implemented CI/CD pipelines that reduced deployment time by 70%",
          "Refactored legacy codebase, improving application performance by 40%"
        ]
      },
      {
        title: "Software Engineer",
        company: "WebDev Innovations",
        location: "San Jose, CA",
        startDate: "Mar 2017",
        endDate: "Dec 2019",
        responsibilities: [
          "Developed responsive web applications using React and Redux",
          "Collaborated with UX designers to implement user-friendly interfaces",
          "Wrote unit and integration tests to ensure code quality"
        ]
      }
    ],
    education: [
      {
        degree: "Master of Science in Computer Science",
        institution: "Stanford University",
        location: "Stanford, CA",
        startDate: "2015",
        endDate: "2017",
        gpa: "3.8/4.0"
      },
      {
        degree: "Bachelor of Science in Computer Engineering",
        institution: "University of California, Berkeley",
        location: "Berkeley, CA",
        startDate: "2011",
        endDate: "2015",
        gpa: "3.7/4.0"
      }
    ],
    skills: [
      "JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker", "Kubernetes", 
      "GraphQL", "MongoDB", "PostgreSQL", "CI/CD", "Agile Methodologies"
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2021"
      },
      {
        name: "Certified Scrum Master",
        issuer: "Scrum Alliance",
        date: "2019"
      }
    ]
  });
  
  const templates: Template[] = [
    {
      id: "modern-executive",
      name: "Modern Executive",
      description: "Clean, professional design perfect for executives",
      thumbnail: "/resume-templates/thumbnails/modern-executive.png"
    },
    {
      id: "creative-designer",
      name: "Creative Designer",
      description: "Bold, creative layout for designers",
      thumbnail: "/resume-templates/thumbnails/creative-designer.png"
    },
    {
      id: "tech-minimalist",
      name: "Tech Minimalist",
      description: "Clean, minimal design for tech professionals",
      thumbnail: "/resume-templates/thumbnails/tech-minimalist.png"
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleUpdateResumeData = (field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleAddExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          responsibilities: [""]
        }
      ]
    }));
  };

  const handleUpdateExperience = (index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updatedExperience = [...prev.experience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value
      };
      return {
        ...prev,
        experience: updatedExperience
      };
    });
  };

  const handleAddEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          location: "",
          startDate: "",
          endDate: "",
          gpa: ""
        }
      ]
    }));
  };

  const handleUpdateEducation = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      const updatedEducation = [...prev.education];
      updatedEducation[index] = {
        ...updatedEducation[index],
        [field]: value
      };
      return {
        ...prev,
        education: updatedEducation
      };
    });
  };

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleAddCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: "",
          issuer: "",
          date: ""
        }
      ]
    }));
  };

  const handleUpdateCertification = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      const updatedCertifications = [...prev.certifications];
      updatedCertifications[index] = {
        ...updatedCertifications[index],
        [field]: value
      };
      return {
        ...prev,
        certifications: updatedCertifications
      };
    });
  };

  const handleExportPDF = () => {
    // Logic to export as PDF
    console.log("Exporting as PDF...");
  };

  const handleExportWord = () => {
    // Logic to export as Word
    console.log("Exporting as Word...");
  };

  const handleGenerateResume = () => {
    console.log("Generating resume with current data...");
    // Logic to generate resume with current form data
  };

  const handleGenerateWithAI = () => {
    console.log("Generating resume with AI assistance...");
    // Logic to generate resume with AI
  };

  const handleBackToTemplateSelection = () => {
    navigate('/resume-builder');
  };

  const handleExtractResume = () => {
    setDataSource('extract');
  };

  const handleEnterManually = () => {
    setDataSource('manual');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  const handleBackToDataSource = () => {
    setDataSource(null);
  };

  // If template is preselected, show the builder interface
  if (preselectedTemplate) {
    // Show preview screen with actual HTML template
    if (showPreview) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Form
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Resume Preview</h1>
                  <p className="text-sm text-gray-600">
                    Using {templates.find(t => t.id === preselectedTemplate)?.name || 'Selected'} template
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportWord} className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Export as Word
                </Button>
                <Button onClick={handleExportPDF} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </div>
          
          {/* Template Preview using actual HTML */}
          <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
              <iframe
                src={`/resume-templates/html/${preselectedTemplate}.html`}
                className="w-full h-[800px] border-0"
                title="Resume Preview"
                onError={() => {
                  console.error(`Failed to load template: ${preselectedTemplate}.html`);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show data source selection if no source selected
    if (!dataSource) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/resume-builder')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Template
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Resume Builder</h1>
                  <p className="text-sm text-gray-600">
                    Using {templates.find(t => t.id === preselectedTemplate)?.name || 'Selected'} template
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Source Selection */}
          <div className="max-w-2xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">How would you like to create your resume?</h2>
              <p className="text-gray-600">Choose your preferred method to get started</p>
            </div>
            
            <div className="space-y-4">
              {/* Default Resume Option */}
              <ResumeFileUploader
                onFileSelected={() => {}}
                onUseDefaultResumeChange={(checked) => {
                  setUseDefaultResume(checked);
                  if (checked) {
                    setDataSource('extract');
                  }
                }}
                showDefaultResumeOption={true}
              />
              
              {/* Extract Resume Option */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExtractResume}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Extract from Resume</h3>
                      <p className="text-gray-600">Upload your existing resume and we'll extract the information</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              {/* Enter Manually Option */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleEnterManually}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Enter Manually</h3>
                      <p className="text-gray-600">Start from scratch and fill in your information step by step</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // Show extract resume interface
    if (dataSource === 'extract') {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackToDataSource}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Extract Resume Data</h1>
                  <p className="text-sm text-gray-600">Upload your resume to extract information</p>
                </div>
              </div>
              <Button 
                onClick={handlePreview} 
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>
          
          {/* File Upload Section */}
          <div className="max-w-2xl mx-auto p-6">
            <ResumeFileUploader
              onFileSelected={(file) => {
                if (file) {
                  console.log("File selected for extraction:", file.name);
                  // Here you would implement the extraction logic
                }
              }}
              onDataExtracted={(data) => {
                console.log("Data extracted:", data);
                // Update resumeData with extracted data
                setResumeData(prev => ({ ...prev, ...data }));
              }}
              setIsExtracting={(extracting) => {
                console.log("Extracting:", extracting);
              }}
              showDefaultResumeOption={false}
            />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Once your resume is uploaded and processed, you can review and edit the extracted information.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setDataSource('manual')}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Enter Information Manually Instead
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show form screen (manual entry)
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBackToDataSource}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Resume Builder</h1>
                <p className="text-sm text-gray-600">
                  Using {templates.find(t => t.id === preselectedTemplate)?.name || 'Selected'} template
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateResume}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Resume
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGenerateWithAI}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
              <Button 
                onClick={handlePreview} 
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>
        </div>
        
        {/* Form Section */}
        <div className="max-w-4xl mx-auto p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.name}
                    onChange={(e) => handleUpdatePersonalInfo("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.title}
                    onChange={(e) => handleUpdatePersonalInfo("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.email}
                    onChange={(e) => handleUpdatePersonalInfo("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => handleUpdatePersonalInfo("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.location}
                    onChange={(e) => handleUpdatePersonalInfo("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn (optional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.linkedin}
                    onChange={(e) => handleUpdatePersonalInfo("linkedin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website (optional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resumeData.personalInfo.website}
                    onChange={(e) => handleUpdatePersonalInfo("website", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Professional Summary</label>
                <textarea
                  className="w-full p-2 border rounded h-32"
                  value={resumeData.summary}
                  onChange={(e) => handleUpdateResumeData("summary", e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <Button onClick={handleAddExperience}>Add Experience</Button>
              </div>
              
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Experience {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Title</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={exp.title}
                        onChange={(e) => handleUpdateExperience(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(index, "company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={exp.location}
                        onChange={(e) => handleUpdateExperience(index, "location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={exp.endDate}
                        onChange={(e) => handleUpdateExperience(index, "endDate", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Responsibilities</label>
                    {exp.responsibilities.map((resp, respIndex) => (
                      <div key={respIndex} className="flex gap-2">
                        <input
                          type="text"
                          className="w-full p-2 border rounded"
                          value={resp}
                          onChange={(e) => {
                            const newResponsibilities = [...exp.responsibilities];
                            newResponsibilities[respIndex] = e.target.value;
                            handleUpdateExperience(index, "responsibilities", newResponsibilities);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newResponsibilities = exp.responsibilities.filter((_, i) => i !== respIndex);
                            handleUpdateExperience(index, "responsibilities", newResponsibilities);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newResponsibilities = [...exp.responsibilities, ""];
                        handleUpdateExperience(index, "responsibilities", newResponsibilities);
                      }}
                    >
                      Add Responsibility
                    </Button>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setResumeData(prev => ({
                        ...prev,
                        experience: prev.experience.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    Remove Experience
                  </Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="education" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Education</h2>
                <Button onClick={handleAddEducation}>Add Education</Button>
              </div>
              
              {resumeData.education.map((edu, index) => (
                <div key={index} className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Education {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Degree</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Institution</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(index, "institution", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.location}
                        onChange={(e) => handleUpdateEducation(index, "location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.startDate}
                        onChange={(e) => handleUpdateEducation(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.endDate}
                        onChange={(e) => handleUpdateEducation(index, "endDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">GPA (optional)</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={edu.gpa}
                        onChange={(e) => handleUpdateEducation(index, "gpa", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setResumeData(prev => ({
                        ...prev,
                        education: prev.education.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    Remove Education
                  </Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="skills" className="space-y-4">
              <h2 className="text-xl font-semibold">Skills</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    placeholder="Add a skill..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      handleAddSkill(input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="px-3 py-1 cursor-pointer"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="certifications" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Certifications</h2>
                <Button onClick={handleAddCertification}>Add Certification</Button>
              </div>
              
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Certification {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={cert.name}
                        onChange={(e) => handleUpdateCertification(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Issuer</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={cert.issuer}
                        onChange={(e) => handleUpdateCertification(index, "issuer", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date (optional)</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={cert.date}
                        onChange={(e) => handleUpdateCertification(index, "date", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setResumeData(prev => ({
                        ...prev,
                        certifications: prev.certifications.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    Remove Certification
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Template selection interface (when no template is preselected)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Template Selection Panel */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Choose a Template</h2>
            <div className="space-y-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardContent className="p-3">
                    <img 
                      src={template.thumbnail} 
                      alt={template.name} 
                      className="w-full h-40 object-cover mb-2"
                    />
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    {selectedTemplate === template.id && (
                      <Button 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/resume-builder-app?template=${template.id}`);
                        }}
                      >
                        Use This Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* Preview Panel */}
        <div className="flex-1 p-6">
          {selectedTemplate ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Template Preview</h1>
              <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto">
                <iframe
                  src={`/resume-templates/html/${selectedTemplate}.html`}
                  className="w-full h-[600px] border-0"
                  title="Template Preview"
                />
              </div>
              <Button 
                className="mt-4"
                onClick={() => navigate(`/resume-builder-app?template=${selectedTemplate}`)}
              >
                Use This Template
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Select a Resume Template</h1>
              <p className="text-gray-600">Choose a template from the sidebar to see the preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
