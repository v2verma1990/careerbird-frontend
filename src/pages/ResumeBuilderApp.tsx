import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, ArrowRight, Star, Crown, Sparkles, Palette, ArrowLeft, Download, FileText, Upload, Edit, Check, Plus } from "lucide-react";
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
  const [dataSource, setDataSource] = useState<'manual' | 'extract' | 'default' | null>(null);
  const [sampleData, setSampleData] = useState<any>(null);
  const [useDefaultResume, setUseDefaultResume] = useState(false);
  const [hasDefaultResume, setHasDefaultResume] = useState(false);
  const [defaultResumeData, setDefaultResumeData] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showFileUploader, setShowFileUploader] = useState(false);
  
  // Initialize with dummy data that's always visible
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

  // Function to inject sample data into template HTML
  const getTemplateWithData = (templateId: string, data: any) => {
    if (!data) return `/resume-templates/html/${templateId}.html`;
    
    // Create a data URL with the template HTML that includes the sample data
    const templateUrl = `/resume-templates/html/${templateId}.html`;
    return templateUrl + `?data=${encodeURIComponent(JSON.stringify(data))}`;
  };

  const handleUseDefaultResume = () => {
    if (hasDefaultResume && defaultResumeData) {
      console.log("Using default resume data:", defaultResumeData);
      // Populate resume data with default resume
      setResumeData({
        personalInfo: {
          name: defaultResumeData.name || "John Smith",
          title: defaultResumeData.title || "Software Engineer",
          email: defaultResumeData.email || "john.smith@email.com",
          phone: defaultResumeData.phone || "(555) 123-4567",
          location: defaultResumeData.location || "New York, NY",
          linkedin: defaultResumeData.linkedin || "linkedin.com/in/johnsmith",
          website: defaultResumeData.website || ""
        },
        summary: defaultResumeData.summary || "Experienced software engineer with 5+ years of expertise in full-stack development.",
        experience: defaultResumeData.experience?.map((exp: any) => ({
          title: exp.title || "",
          company: exp.company || "",
          location: exp.location || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          responsibilities: exp.description ? [exp.description] : [""]
        })) || [],
        education: defaultResumeData.education?.map((edu: any) => ({
          degree: edu.degree || "",
          institution: edu.institution || "",
          location: edu.location || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          gpa: edu.gpa || ""
        })) || [],
        skills: defaultResumeData.skills || [],
        certifications: defaultResumeData.certifications || []
      });
      setDataSource('default');
      setExtractedData(defaultResumeData);
    }
  };

  const handleUploadResume = () => {
    console.log("Opening file uploader for resume extraction");
    setShowFileUploader(true);
    setDataSource('extract');
  };

  const handleFileExtracted = (extractedData: any) => {
    console.log("Data extracted from file:", extractedData);
    setExtractedData(extractedData);
    setShowFileUploader(false);
    // Update resume data with extracted data
    if (extractedData) {
      setResumeData({
        personalInfo: {
          name: extractedData.name || "John Doe",
          title: extractedData.title || "Professional",
          email: extractedData.email || "john@example.com",
          phone: extractedData.phone || "(555) 123-4567",
          location: extractedData.location || "City, State",
          linkedin: extractedData.linkedin || "",
          website: extractedData.website || ""
        },
        summary: extractedData.summary || "Professional summary",
        experience: extractedData.experience?.map((exp: any) => ({
          title: exp.title || "",
          company: exp.company || "",
          location: exp.location || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          responsibilities: exp.responsibilities || [exp.description || ""]
        })) || [],
        education: extractedData.education?.map((edu: any) => ({
          degree: edu.degree || "",
          institution: edu.institution || "",
          location: edu.location || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          gpa: edu.gpa || ""
        })) || [],
        skills: extractedData.skills || [],
        certifications: extractedData.certifications || []
      });
      setDataSource('extract');
    }
  };

  const handleManualEntry = () => {
    setDataSource('manual');
    setExtractedData(null);
  };

  const handleGenerateResume = () => {
    console.log("Generating basic resume...");
    // Logic to generate basic resume
  };

  const handleGenerateWithAI = () => {
    console.log("Generating resume with AI assistance...");
    // Logic to generate resume with AI
  };

  const handleGenerateFromBackend = async () => {
    console.log("Generating resume from .NET backend...");
    // Logic to send data to .NET backend and get generated resume
    try {
      // This would be the actual API call to your .NET backend
      // const response = await fetch('/api/generate-resume', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ resumeData, templateId: preselectedTemplate })
      // });
      // const result = await response.json();
      console.log("Resume generated from backend");
    } catch (error) {
      console.error("Error generating resume from backend:", error);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

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

  const handleBackToTemplateSelection = () => {
    navigate('/resume-builder');
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  const handleBackToDataSource = () => {
    setDataSource(null);
  };

  const handleUseSampleResume = () => {
    if (sampleData) {
      // Populate form with sample data
      setResumeData({
        personalInfo: {
          name: sampleData.name || "",
          title: sampleData.title || "",
          email: sampleData.email || "",
          phone: sampleData.phone || "",
          location: sampleData.location || "",
          linkedin: sampleData.linkedin || "",
          website: sampleData.website || ""
        },
        summary: sampleData.summary || "",
        experience: sampleData.experience?.map((exp: any) => ({
          title: exp.title || "",
          company: exp.company || "",
          location: exp.location || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          responsibilities: exp.description ? [exp.description] : [""]
        })) || [],
        education: sampleData.education?.map((edu: any) => ({
          degree: edu.degree || "",
          institution: edu.institution || "",
          location: edu.location || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          gpa: edu.description?.includes("GPA") ? edu.description.split("GPA: ")[1] : ""
        })) || [],
        skills: sampleData.skills || [],
        certifications: sampleData.certifications || []
      });
      setDataSource('default');
    }
  };

  // Load sample data
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        const response = await fetch('/resume-templates/sample-data.json');
        const data = await response.json();
        setSampleData(data);
      } catch (error) {
        console.error('Failed to load sample data:', error);
      }
    };
    loadSampleData();
  }, []);

  // Check if user has a default resume - simulate having one for testing
  useEffect(() => {
    const checkDefaultResume = async () => {
      try {
        // For testing, let's simulate that user has a default resume
        const hasDefault = true; // Change this to test different scenarios
        setHasDefaultResume(hasDefault);
        
        if (hasDefault) {
          // Load default resume data (this would come from user's profile)
          const defaultData = {
            name: "John Smith",
            title: "Software Engineer",
            email: "john.smith@email.com",
            phone: "(555) 123-4567",
            location: "New York, NY",
            summary: "Experienced software engineer with 5+ years of expertise in full-stack development.",
            experience: [
              {
                title: "Senior Software Engineer",
                company: "Tech Corp",
                location: "New York, NY",
                startDate: "2020",
                endDate: "Present",
                description: "Led development of scalable web applications"
              }
            ],
            education: [
              {
                degree: "Bachelor of Science in Computer Science",
                institution: "University of Technology",
                location: "New York, NY",
                startDate: "2015",
                endDate: "2019"
              }
            ],
            skills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
            certifications: [
              {
                name: "AWS Certified Developer",
                issuer: "Amazon Web Services",
                date: "2022"
              }
            ]
          };
          setDefaultResumeData(defaultData);
        }
      } catch (error) {
        console.error('Error checking default resume:', error);
      }
    };
    
    checkDefaultResume();
  }, []);

  // If template is preselected, show the builder interface
  if (preselectedTemplate) {
    // Show preview screen with PDF in iframe
    if (showPreview) {
      const previewData = extractedData || resumeData;
      
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Editor
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Resume Preview</h1>
                  <p className="text-sm text-gray-600">
                    Using {templates.find(t => t.id === preselectedTemplate)?.name || 'Selected'} template
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => console.log("Download PDF")} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => console.log("Download HTML")} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download HTML
                </Button>
              </div>
            </div>
          </div>
          
          {/* PDF Preview in iframe */}
          <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
              <iframe
                src={getTemplateWithData(preselectedTemplate, previewData)}
                className="w-full h-[800px] border-0"
                title="Resume Preview"
                onLoad={(e) => {
                  // Inject data into the iframe if data is available
                  if (previewData) {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (iframeDoc) {
                        // Post message to iframe with data
                        iframe.contentWindow?.postMessage({ type: 'POPULATE_RESUME_DATA', data: previewData }, '*');
                      }
                    } catch (error) {
                      console.log('Could not inject data into iframe:', error);
                    }
                  }
                }}
                onError={() => {
                  console.error(`Failed to load template: ${preselectedTemplate}.html`);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Main builder interface
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Resume Information</h1>
              </div>
              <div className="flex gap-4">
                <Button
                  variant={dataSource === 'default' ? 'default' : 'outline'}
                  onClick={handleUseDefaultResume}
                  className="flex items-center gap-2"
                  disabled={!hasDefaultResume}
                >
                  <FileText className="w-4 h-4" />
                  Use Default Resume
                </Button>
                
                <Button
                  variant={dataSource === 'extract' ? 'default' : 'outline'}
                  onClick={handleUploadResume}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload Component - only show when Upload Resume is clicked */}
          {showFileUploader && (
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <ResumeFileUploader
                    onFileSelected={(file) => {
                      if (file) {
                        console.log("File selected for extraction:", file.name);
                      }
                    }}
                    onDataExtracted={handleFileExtracted}
                    setIsExtracting={(extracting) => {
                      console.log("Extracting:", extracting);
                    }}
                    showDefaultResumeOption={false}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Default Resume Usage Indicator */}
          {dataSource === 'default' && defaultResumeData && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-800">Using your default resume</h3>
                    <p className="text-sm text-blue-600">Default resume data loaded successfully</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Data Indicator */}
          {dataSource === 'extract' && extractedData && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">Data extracted from uploaded resume</h3>
                    <p className="text-sm text-green-600">You can edit the information below before generating your resume</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume Data Tabs - Always Visible */}
          <div className="mb-8">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-6 bg-gray-100">
                <TabsTrigger value="personal" className="px-6">Personal</TabsTrigger>
                <TabsTrigger value="experience" className="px-6">Experience</TabsTrigger>
                <TabsTrigger value="education" className="px-6">Education</TabsTrigger>
                <TabsTrigger value="skills" className="px-6">Skills</TabsTrigger>
                <TabsTrigger value="additional" className="px-6">Additional</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.name} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, name: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.title} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, title: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="Software Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input 
                          type="email" 
                          value={resumeData.personalInfo.email} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, email: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.phone} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, phone: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.location} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, location: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="New York, NY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.linkedin || ''} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.website || ''} 
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, website: e.target.value }
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="www.johndoe.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Professional Summary</h3>
                    <div className="mb-6">
                      <textarea 
                        value={resumeData.summary}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          summary: e.target.value
                        }))}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Write a brief summary of your professional experience..."
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Work Experience</h3>
                      <Button 
                        onClick={() => setResumeData(prev => ({
                          ...prev,
                          experience: [...prev.experience, {
                            title: "",
                            company: "",
                            location: "",
                            startDate: "",
                            endDate: "",
                            responsibilities: [""]
                          }]
                        }))}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                              <input 
                                type="text" 
                                value={exp.title} 
                                onChange={(e) => {
                                  const updatedExperience = [...resumeData.experience];
                                  updatedExperience[index].title = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: updatedExperience }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Job Title"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                              <input 
                                type="text" 
                                value={exp.company} 
                                onChange={(e) => {
                                  const updatedExperience = [...resumeData.experience];
                                  updatedExperience[index].company = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: updatedExperience }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Company Name"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                            <textarea 
                              value={exp.responsibilities.join('\n')} 
                              onChange={(e) => {
                                const updatedExperience = [...resumeData.experience];
                                updatedExperience[index].responsibilities = e.target.value.split('\n');
                                setResumeData(prev => ({ ...prev, experience: updatedExperience }));
                              }}
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Education</h3>
                      <Button 
                        onClick={() => setResumeData(prev => ({
                          ...prev,
                          education: [...prev.education, {
                            degree: "",
                            institution: "",
                            location: "",
                            startDate: "",
                            endDate: "",
                            gpa: ""
                          }]
                        }))}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add Education
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                              <input 
                                type="text" 
                                value={edu.degree} 
                                onChange={(e) => {
                                  const updatedEducation = [...resumeData.education];
                                  updatedEducation[index].degree = e.target.value;
                                  setResumeData(prev => ({ ...prev, education: updatedEducation }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Bachelor of Science"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                              <input 
                                type="text" 
                                value={edu.institution} 
                                onChange={(e) => {
                                  const updatedEducation = [...resumeData.education];
                                  updatedEducation[index].institution = e.target.value;
                                  setResumeData(prev => ({ ...prev, education: updatedEducation }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="University Name"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                              <input 
                                type="text" 
                                value={edu.startDate} 
                                onChange={(e) => {
                                  const updatedEducation = [...resumeData.education];
                                  updatedEducation[index].startDate = e.target.value;
                                  setResumeData(prev => ({ ...prev, education: updatedEducation }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="2015"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <input 
                                type="text" 
                                value={edu.endDate} 
                                onChange={(e) => {
                                  const updatedEducation = [...resumeData.education];
                                  updatedEducation[index].endDate = e.target.value;
                                  setResumeData(prev => ({ ...prev, education: updatedEducation }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="2019"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                              <input 
                                type="text" 
                                value={edu.gpa || ''} 
                                onChange={(e) => {
                                  const updatedEducation = [...resumeData.education];
                                  updatedEducation[index].gpa = e.target.value;
                                  setResumeData(prev => ({ ...prev, education: updatedEducation }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="3.8/4.0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Skills</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {resumeData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">{skill}</Badge>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                        <textarea 
                          value={resumeData.skills.join(', ')}
                          onChange={(e) => {
                            const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
                            setResumeData(prev => ({ ...prev, skills }));
                          }}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="JavaScript, React, Node.js, Python..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="additional">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Certifications</h3>
                      <Button 
                        onClick={() => setResumeData(prev => ({
                          ...prev,
                          certifications: [...prev.certifications, {
                            name: "",
                            issuer: "",
                            date: ""
                          }]
                        }))}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add Certification
                      </Button>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      {resumeData.certifications.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                              <input 
                                type="text" 
                                value={cert.name} 
                                onChange={(e) => {
                                  const updatedCertifications = [...resumeData.certifications];
                                  updatedCertifications[index].name = e.target.value;
                                  setResumeData(prev => ({ ...prev, certifications: updatedCertifications }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="AWS Certified Developer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                              <input 
                                type="text" 
                                value={cert.issuer} 
                                onChange={(e) => {
                                  const updatedCertifications = [...resumeData.certifications];
                                  updatedCertifications[index].issuer = e.target.value;
                                  setResumeData(prev => ({ ...prev, certifications: updatedCertifications }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Amazon Web Services"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                              type="text" 
                              value={cert.date || ''} 
                              onChange={(e) => {
                                const updatedCertifications = [...resumeData.certifications];
                                updatedCertifications[index].date = e.target.value;
                                setResumeData(prev => ({ ...prev, certifications: updatedCertifications }));
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                              placeholder="2022"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Projects</h3>
                      <Button 
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add Project
                      </Button>
                    </div>
                    <p className="text-gray-500 text-sm">Add your notable projects here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Buttons at Bottom */}
          <div className="flex gap-4 pt-6">
            <Button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
            >
              <Eye className="w-4 h-4" />
              Generate Resume
            </Button>
            <Button 
              onClick={() => console.log("Generate Best AI Resume")}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
            >
              <Eye className="w-4 h-4" />
              Generate Best AI Resume
            </Button>
            <Button 
              onClick={() => console.log("Generate AI Enhanced Resume")}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
            >
              <Eye className="w-4 h-4" />
              Generate AI Enhanced Resume (100% ATS)
            </Button>
          </div>
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
        
        {/* Preview Panel with Sample Data */}
        <div className="flex-1 p-6">
          {selectedTemplate ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Template Preview</h1>
              <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto">
                <iframe
                  src={getTemplateWithData(selectedTemplate, sampleData)}
                  className="w-full h-[600px] border-0"
                  title="Template Preview"
                  onLoad={(e) => {
                    // Inject sample data into the preview iframe
                    if (sampleData) {
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        setTimeout(() => {
                          iframe.contentWindow?.postMessage({ 
                            type: 'POPULATE_RESUME_DATA', 
                            data: sampleData 
                          }, '*');
                        }, 500);
                      } catch (error) {
                        console.log('Could not inject sample data into preview:', error);
                      }
                    }
                  }}
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
              <p className="text-gray-600">Choose a template from the sidebar to see the preview with sample data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
