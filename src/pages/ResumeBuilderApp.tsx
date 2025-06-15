import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, ArrowRight, Star, Crown, Sparkles, Palette, ArrowLeft, Download, FileText, Upload, Edit, Check } from "lucide-react";
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
  const [showManualForm, setShowManualForm] = useState(false);
  
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

  const handleExtractFromDefault = () => {
    if (hasDefaultResume && defaultResumeData) {
      setExtractedData(defaultResumeData);
      setDataSource('default');
    }
  };

  const handleFileExtracted = (extractedData: any) => {
    console.log("Data extracted:", extractedData);
    setExtractedData(extractedData);
    setDataSource('extract');
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

  const handleUseDefaultResumeChange = (checked: boolean) => {
    setUseDefaultResume(checked);
    if (checked && defaultResumeData) {
      // Populate form with default resume data
      setResumeData({
        personalInfo: {
          name: defaultResumeData.name || "",
          title: defaultResumeData.title || "",
          email: defaultResumeData.email || "",
          phone: defaultResumeData.phone || "",
          location: defaultResumeData.location || "",
          linkedin: defaultResumeData.linkedin || "",
          website: defaultResumeData.website || ""
        },
        summary: defaultResumeData.summary || "",
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
    }
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

  // Check if user has a default resume
  useEffect(() => {
    const checkDefaultResume = async () => {
      try {
        // This would typically check the user's profile for default_resume_blob_name
        // For now, we'll simulate checking if user has a default resume
        const hasDefault = localStorage.getItem('hasDefaultResume') === 'true';
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
      const previewData = extractedData || (showManualForm ? resumeData : null) || resumeData;
      
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
        
        <div className="max-w-6xl mx-auto p-6">
          {/* Data Source Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">How would you like to create your resume?</h2>
            
            {/* Use Default Resume Checkbox */}
            {hasDefaultResume && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="use-default-resume" 
                    checked={useDefaultResume}
                    onCheckedChange={(checked) => {
                      setUseDefaultResume(checked as boolean);
                      if (checked) {
                        setDataSource('default');
                        setExtractedData(defaultResumeData);
                        setShowManualForm(false);
                      } else {
                        setDataSource(null);
                        setExtractedData(null);
                      }
                    }}
                  />
                  <div>
                    <label htmlFor="use-default-resume" className="text-sm font-medium text-blue-800 cursor-pointer">
                      Use my default resume
                    </label>
                    <p className="text-xs text-blue-600">
                      Use the resume you uploaded in your profile
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Source Buttons */}
            {!useDefaultResume && (
              <div className="flex gap-4">
                <Button
                  variant={dataSource === 'default' ? 'default' : 'outline'}
                  onClick={() => {
                    if (hasDefaultResume && defaultResumeData) {
                      setDataSource('default');
                      setExtractedData(defaultResumeData);
                      setShowManualForm(false);
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={!hasDefaultResume}
                >
                  <FileText className="w-4 h-4" />
                  Extract from Default Resume
                </Button>
                
                <Button
                  variant={dataSource === 'extract' ? 'default' : 'outline'}
                  onClick={() => {
                    // This will trigger the file upload
                    setDataSource('extract');
                    setShowManualForm(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Resume to Extract Data
                </Button>
                
                <Button
                  variant={dataSource === 'manual' ? 'default' : 'outline'}
                  onClick={() => {
                    setDataSource('manual');
                    setShowManualForm(true);
                    setExtractedData(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Manually Enter
                </Button>
              </div>
            )}

            {/* File Upload Component - only show when Extract is selected */}
            {dataSource === 'extract' && !useDefaultResume && (
              <div className="mt-4">
                <ResumeFileUploader
                  onFileSelected={(file) => {
                    if (file) {
                      console.log("File selected for extraction:", file.name);
                    }
                  }}
                  onDataExtracted={(extractedData) => {
                    console.log("Data extracted:", extractedData);
                    setExtractedData(extractedData);
                  }}
                  setIsExtracting={(extracting) => {
                    console.log("Extracting:", extracting);
                  }}
                  showDefaultResumeOption={false}
                />
              </div>
            )}
          </div>

          {/* Extracted Data Display */}
          {(extractedData || (dataSource === 'default' && defaultResumeData)) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {useDefaultResume ? 'Default Resume Data' : 'Extracted Resume Data'}
              </h3>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div><strong>Name:</strong> {(extractedData || defaultResumeData)?.name || 'N/A'}</div>
                        <div><strong>Title:</strong> {(extractedData || defaultResumeData)?.title || 'N/A'}</div>
                        <div><strong>Email:</strong> {(extractedData || defaultResumeData)?.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> {(extractedData || defaultResumeData)?.phone || 'N/A'}</div>
                        <div><strong>Location:</strong> {(extractedData || defaultResumeData)?.location || 'N/A'}</div>
                        <div><strong>LinkedIn:</strong> {(extractedData || defaultResumeData)?.linkedin || 'N/A'}</div>
                      </div>
                      {(extractedData || defaultResumeData)?.summary && (
                        <div className="mt-4">
                          <strong>Summary:</strong>
                          <p className="mt-2 text-gray-600">{(extractedData || defaultResumeData).summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="experience">
                  <Card>
                    <CardHeader>
                      <CardTitle>Work Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {extractedData?.experience && extractedData.experience.length > 0 ? (
                        <div className="space-y-4">
                          {extractedData.experience.map((exp: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-4">
                              <h4 className="font-semibold">{exp.title}</h4>
                              <p className="text-gray-600">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                              <p className="text-sm text-gray-500">{exp.description || (exp.responsibilities ? exp.responsibilities.join(", ") : "")}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No experience data found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education">
                  <Card>
                    <CardHeader>
                      <CardTitle>Education</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {extractedData?.education && extractedData.education.length > 0 ? (
                        <div className="space-y-3">
                          {extractedData.education.map((edu: any, index: number) => (
                            <div key={index} className="border-l-2 border-green-500 pl-4">
                              <h4 className="font-semibold">{edu.degree}</h4>
                              <p className="text-gray-600">{edu.institution} • {edu.startDate} - {edu.endDate}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No education data found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {extractedData?.skills && extractedData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {extractedData.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No skills data found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {extractedData?.certifications && extractedData.certifications.length > 0 ? (
                        <div className="space-y-2">
                          {extractedData.certifications.map((cert: any, index: number) => (
                            <div key={index} className="border-l-2 border-purple-500 pl-4">
                              <h4 className="font-semibold">{cert.name}</h4>
                              <p className="text-gray-600">{cert.issuer} • {cert.date}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No certifications data found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Manual Entry Form */}
          {showManualForm && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Enter Your Resume Information</h3>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600 text-center py-8">
                    Manual entry form would be implemented here with all resume fields
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons at Bottom */}
          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
              disabled={!extractedData && !showManualForm && !useDefaultResume}
            >
              <Eye className="w-4 h-4" />
              Generate Resume
            </Button>
            <Button 
              onClick={handleGenerateWithAI}
              className="flex items-center gap-2"
              disabled={!extractedData && !showManualForm && !useDefaultResume}
            >
              <Sparkles className="w-4 h-4" />
              AI Resume
            </Button>
            <Button 
              onClick={handleGenerateFromBackend}
              className="flex items-center gap-2"
              disabled={!extractedData && !showManualForm && !useDefaultResume}
            >
              <Crown className="w-4 h-4" />
              Generate from Backend
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowPreview(true)} 
              className="flex items-center gap-2"
              disabled={!extractedData && !showManualForm && !useDefaultResume}
            >
              <Eye className="w-4 h-4" />
              Preview
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
