import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Download, Eye, User, Briefcase, GraduationCap, Award, Code, Plus, X, Sparkles, Zap, FileCheck } from 'lucide-react';
import ResumeFileUploader from '@/components/ResumeFileUploader';
import { resumeBuilderApi } from '@/utils/resumeBuilderApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useResume } from '@/contexts/resume/ResumeContext';

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
  const [searchParams] = useSearchParams();
  const selectedTemplate = searchParams.get('template') || 'modern-executive';
  const [resumeData, setResumeData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [dataSource, setDataSource] = useState('manual'); // 'manual', 'upload', or 'default'
  const [defaultResumeData, setDefaultResumeData] = useState(null);
  const { toast } = useToast();

  // Fetch default resume data from backend API with better error handling
  const fetchDefaultResumeData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return null;
      }

      console.log('Fetching default resume data...');
      
      const response = await fetch('https://localhost:5001/api/resume/default', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Default resume API response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No default resume found (404)');
          return null;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch default resume: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Default resume data fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching default resume:', error);
      // If it's a network error, try to get the data from Supabase directly
      try {
        console.log('Trying to fetch from Supabase directly...');
        const { data: resumeData, error: resumeError } = await supabase
          .from('resume_metadata')
          .select('*')
          .eq('user_id', session?.user?.id)
          .eq('is_default', true)
          .single();

        if (resumeError) {
          console.log('Supabase query error:', resumeError);
          return null;
        }

        console.log('Found default resume in Supabase:', resumeData);
        return resumeData;
      } catch (supabaseError) {
        console.error('Supabase fallback also failed:', supabaseError);
        return null;
      }
    }
  };

  // Load default resume data on component mount
  useEffect(() => {
    const loadDefaultResume = async () => {
      const data = await fetchDefaultResumeData();
      setDefaultResumeData(data);
      console.log('Default resume data set:', data);
    };
    loadDefaultResume();
  }, []);

  // Function to extract data from default resume
  const handleExtractFromDefaultResume = async () => {
    console.log('handleExtractFromDefaultResume called, defaultResumeData:', defaultResumeData);
    
    if (!defaultResumeData) {
      console.log('No default resume data found, trying to fetch again...');
      const freshData = await fetchDefaultResumeData();
      if (!freshData) {
        toast({
          title: "No default resume found",
          description: "Please upload a default resume first in your profile settings.",
          variant: "destructive",
        });
        return;
      }
      setDefaultResumeData(freshData);
    }

    setIsExtracting(true);
    console.log('Starting resume extraction from default resume:', defaultResumeData);
    
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to extract resume data",
          variant: "destructive",
        });
        return;
      }

      console.log('Downloading file from backend...');
      
      // Fetch the file from the download endpoint
      const fileResponse = await fetch('https://localhost:5001/api/resume/default/download', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      console.log('File download response status:', fileResponse.status);

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error('Download error:', errorText);
        throw new Error(`Failed to download file: ${fileResponse.status} - ${errorText}`);
      }

      const blob = await fileResponse.blob();
      console.log('File downloaded successfully, blob size:', blob.size);
      
      const file = new File([blob], defaultResumeData.fileName || 'default-resume.pdf', { type: blob.type });

      // Call the backend API for resume optimization/extraction
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plan', 'free');
      
      console.log('Calling .NET backend for resume extraction...');
      
      const extractResponse = await fetch('https://localhost:5001/api/resume/optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log('Extract response status:', extractResponse.status);

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('Backend API error:', errorText);
        throw new Error(`Backend error: ${extractResponse.status} - ${errorText}`);
      }

      const result = await extractResponse.json();
      console.log('Backend response received:', result);

      // Extract and format the data from the backend response
      if (result && result.optimizedContent) {
        let extractedData;
        try {
          extractedData = typeof result.optimizedContent === 'string' 
            ? JSON.parse(result.optimizedContent) 
            : result.optimizedContent;
        } catch (parseError) {
          console.error('Error parsing optimized content:', parseError);
          extractedData = {
            Summary: result.summary || "Extracted from default resume",
          };
        }

        // Map the extracted data to our resume format
        const mappedData = {
          Name: extractedData.Name || extractedData.name || "",
          Title: extractedData.Title || extractedData.title || "",
          Email: extractedData.Email || extractedData.email || "",
          Phone: extractedData.Phone || extractedData.phone || "",
          Location: extractedData.Location || extractedData.location || "",
          LinkedIn: extractedData.LinkedIn || extractedData.linkedin || "",
          Website: extractedData.Website || extractedData.website || "",
          Summary: extractedData.Summary || extractedData.summary || result.summary || "",
          Skills: extractedData.Skills || extractedData.skills || [],
          Experience: extractedData.Experience || extractedData.experience || [],
          Education: extractedData.Education || extractedData.education || [],
          Certifications: extractedData.Certifications || extractedData.certifications || [],
          Projects: extractedData.Projects || extractedData.projects || []
        };

        console.log('Mapped extracted data:', mappedData);
        setResumeData(mappedData);
        setDataSource('default');
        
        toast({
          title: "Resume extracted successfully!",
          description: "Your default resume data has been extracted and populated in the form.",
        });
      } else {
        console.warn('No optimized content in response, using fallback data');
        const fallbackData = {
          ...resumeData,
          Summary: result.summary || "Data extracted from your default resume",
        };
        setResumeData(fallbackData);
        setDataSource('default');
        
        toast({
          title: "Partial extraction completed",
          description: "Some data was extracted. Please review and complete the form.",
        });
      }
    } catch (error) {
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
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to extract resume data",
          variant: "destructive",
        });
        return;
      }

      // Call the actual .NET backend API for resume optimization/extraction
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plan', 'free'); // or get from user subscription
      
      console.log('Calling .NET backend for resume extraction...');
      
      const response = await fetch('https://localhost:5001/api/resume/optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error:', errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Backend response received:', result);

      // Extract and format the data from the backend response
      if (result && result.optimizedContent) {
        // Parse the optimized content if it's a string
        let extractedData;
        try {
          extractedData = typeof result.optimizedContent === 'string' 
            ? JSON.parse(result.optimizedContent) 
            : result.optimizedContent;
        } catch (parseError) {
          console.error('Error parsing optimized content:', parseError);
          // If parsing fails, try to extract from other fields
          extractedData = {
            Summary: result.summary || "Extracted from resume",
            // You may need to adjust this based on your backend response structure
          };
        }

        // Map the extracted data to our resume format
        const mappedData = {
          Name: extractedData.Name || extractedData.name || "",
          Title: extractedData.Title || extractedData.title || "",
          Email: extractedData.Email || extractedData.email || "",
          Phone: extractedData.Phone || extractedData.phone || "",
          Location: extractedData.Location || extractedData.location || "",
          LinkedIn: extractedData.LinkedIn || extractedData.linkedin || "",
          Website: extractedData.Website || extractedData.website || "",
          Summary: extractedData.Summary || extractedData.summary || result.summary || "",
          Skills: extractedData.Skills || extractedData.skills || [],
          Experience: extractedData.Experience || extractedData.experience || [],
          Education: extractedData.Education || extractedData.education || [],
          Certifications: extractedData.Certifications || extractedData.certifications || [],
          Projects: extractedData.Projects || extractedData.projects || []
        };

        console.log('Mapped extracted data:', mappedData);
        setResumeData(mappedData);
        setDataSource('upload');
        
        toast({
          title: "Resume extracted successfully!",
          description: "Your resume data has been extracted and populated in the form.",
        });
      } else {
        console.warn('No optimized content in response, using fallback data');
        // Fallback: use any available data from the response
        const fallbackData = {
          ...resumeData,
          Summary: result.summary || "Data extracted from your resume",
        };
        setResumeData(fallbackData);
        setDataSource('upload');
        
        toast({
          title: "Partial extraction completed",
          description: "Some data was extracted. Please review and complete the form.",
        });
      }
    } catch (error) {
      console.error('Error extracting resume data:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract resume data. Please try again or fill manually.",
        variant: "destructive",
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
    setIsLoading(true);
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
        const blob = new Blob([result.data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume-${selectedTemplate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Success!",
          description: "Your resume has been generated and downloaded.",
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
      setIsLoading(false);
    }
  };

  const generateResumeViaAI = async () => {
    setIsLoading(true);
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
        const blob = new Blob([result.data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-resume-${selectedTemplate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Success!",
          description: "Your AI-enhanced resume has been generated and downloaded.",
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
      setIsLoading(false);
    }
  };

  const generateAIEnhancedResume = async () => {
    setIsLoading(true);
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
        const blob = new Blob([result.data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-enhanced-resume-${selectedTemplate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Success!",
          description: "Your premium AI-enhanced resume has been generated and downloaded.",
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
          <p className="text-gray-600">Create a professional resume with our easy-to-use builder</p>
        </div>

        {/* Data Source Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Choose Data Source
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
            <div className="mt-2 text-sm text-gray-500">
              {defaultResumeData ? (
                <p>✓ Default resume found: {defaultResumeData.fileName || 'Resume file'}</p>
              ) : (
                <p>No default resume found. Please upload one in your profile settings to use the extract feature.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Resume Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
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

                  <TabsContent value="other" className="space-y-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium">Certifications</h4>
                      {resumeData.Certifications.map((cert, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`certification-${index}-name`}>Name</Label>
                              <Input
                                id={`certification-${index}-name`}
                                placeholder="Enter certification name"
                                value={cert.Name}
                                onChange={(e) => updateArrayItem('Certifications', index, { ...cert, Name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`certification-${index}-issuer`}>Issuer</Label>
                              <Input
                                id={`certification-${index}-issuer`}
                                placeholder="Enter issuing organization"
                                value={cert.Issuer}
                                onChange={(e) => updateArrayItem('Certifications', index, { ...cert, Issuer: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`certification-${index}-date`}>Date</Label>
                              <Input
                                id={`certification-${index}-date`}
                                placeholder="Enter date obtained"
                                value={cert.Date}
                                onChange={(e) => updateArrayItem('Certifications', index, { ...cert, Date: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeArrayItem('Certifications', index)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => addArrayItem('Certifications', {
                          Name: "",
                          Issuer: "",
                          Date: ""
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Projects</h4>
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
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{resumeData.Name || "Your Name"}</h3>
                    <p className="text-gray-600">{resumeData.Title || "Your Title"}</p>
                    <p className="text-sm text-gray-500">{resumeData.Email || "your.email@example.com"} • {resumeData.Phone || "(555) 000-0000"}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-gray-600">{resumeData.Summary || "Your professional summary will appear here..."}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {resumeData.Skills.filter(skill => skill.trim()).slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {resumeData.Skills.filter(skill => skill.trim()).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{resumeData.Skills.filter(skill => skill.trim()).length - 5} more
                        </Badge>
                      )}
                      {resumeData.Skills.filter(skill => skill.trim()).length === 0 && (
                        <p className="text-sm text-gray-400">Add skills to see them here...</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Three Generation Buttons */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={generateResume}
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={generateResumeViaAI}
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                      className="w-full bg-purple-600 hover:bg-purple-700" 
                      onClick={generateAIEnhancedResume}
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
