import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import api from "@/utils/apiClient";
import { resumeBuilderApi } from "@/utils/resumeBuilderApi";
import { Loader2, Check, X } from "lucide-react";
import "@/styles/ResumeBuilder.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

interface OptimizationReport {
  atsScore: number;
  improvements?: string[];
  sectionFeedback?: Record<string, string>;
}

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    description?: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string;
    date?: string; // Make date optional since it's not in the backend model
  }[];
}

const defaultResumeData: ResumeData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: [
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    }
  ],
  education: [
    {
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    }
  ],
  skills: [],
  certifications: [],
  projects: []
};

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [extractingData, setExtractingData] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<{section: string, original: string, suggested: string} | null>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<{section: string, original: string, suggested: string}[]>([]);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const { data, error } = await resumeBuilderApi.getTemplates();
        if (error) {
          toast({
            title: "Error",
            description: `Failed to load templates: ${error}`,
            variant: "destructive",
          });
          return;
        }
        setTemplates(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setActiveTab("upload");
  };

  const handleFileSelected = (file: File) => {
    setResumeFile(file);
  };

  const handleExtractData = async () => {
    if (!resumeFile) {
      toast({
        title: "Error",
        description: "Please upload a resume file first",
        variant: "destructive",
      });
      return;
    }

    try {
      setExtractingData(true);
      
      toast({
        title: "Extracting data",
        description: "Extracting data from your resume...",
      });
      
      // Create form data for the API request
      const formData = new FormData();
      formData.append('resumeFile', resumeFile);
      
      // Use the .NET backend API endpoint with explicit port
      const response = await fetch('https://localhost:5001/api/resumebuilder/extract-data', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Failed to extract data: ${response.statusText}`);
        } catch (e) {
          throw new Error(`Failed to extract data: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      // If we have valid data, update the state
      if (data) {
        setResumeData({
          name: data.name || "",
          title: data.title || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          linkedin: data.linkedin || "",
          website: data.website || "",
          summary: data.summary || "",
          experience: data.experience?.length ? data.experience : [
            {
              title: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              description: ""
            }
          ],
          education: data.education?.length ? data.education : [
            {
              degree: "",
              institution: "",
              location: "",
              startDate: "",
              endDate: "",
              description: ""
            }
          ],
          skills: data.skills || [],
          certifications: data.certifications || [],
          projects: data.projects || []
        });
        
        toast({
          title: "Success",
          description: "Resume data extracted successfully",
        });
        
        setActiveTab("edit");
      } else {
        // Fallback to default data if the API doesn't return expected format
        setResumeData(defaultResumeData);
        setActiveTab("edit");
        
        toast({
          title: "Warning",
          description: "Could not extract all data. Please fill in the missing information.",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error extracting resume data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract data from resume",
        variant: "destructive",
      });
      
      // Still move to edit tab with empty form
      setResumeData(defaultResumeData);
      setActiveTab("edit");
    } finally {
      setExtractingData(false);
    }
  };

  const handleManualEntry = () => {
    setActiveTab("edit");
  };

  const handleAddExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: ""
        }
      ]
    });
  };

  const handleRemoveExperience = (index: number) => {
    const newExperience = [...resumeData.experience];
    newExperience.splice(index, 1);
    setResumeData({
      ...resumeData,
      experience: newExperience
    });
  };

  const handleAddEducation = () => {
    setResumeData({
      ...resumeData,
      education: [
        ...resumeData.education,
        {
          degree: "",
          institution: "",
          location: "",
          startDate: "",
          endDate: "",
          description: ""
        }
      ]
    });
  };

  const handleRemoveEducation = (index: number) => {
    const newEducation = [...resumeData.education];
    newEducation.splice(index, 1);
    setResumeData({
      ...resumeData,
      education: newEducation
    });
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill !== "");
    setResumeData({
      ...resumeData,
      skills: skillsArray
    });
  };
  
  const handleAddProject = () => {
    setResumeData({
      ...resumeData,
      projects: [
        ...resumeData.projects,
        {
          name: "",
          description: "",
          technologies: "",
          date: ""
        }
      ]
    });
  };
  
  const handleRemoveProject = (index: number) => {
    const newProjects = [...resumeData.projects];
    newProjects.splice(index, 1);
    setResumeData({
      ...resumeData,
      projects: newProjects
    });
  };
  
  const handleAddCertification = () => {
    setResumeData({
      ...resumeData,
      certifications: [
        ...resumeData.certifications,
        {
          name: "",
          issuer: "",
          date: ""
        }
      ]
    });
  };
  
  const handleRemoveCertification = (index: number) => {
    const newCertifications = [...resumeData.certifications];
    newCertifications.splice(index, 1);
    setResumeData({
      ...resumeData,
      certifications: newCertifications
    });
  };

  const handleGenerateResume = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Log the resume data being sent to the API
      console.log("Sending resume data to API:", resumeData);
      console.log("Experience items:", resumeData.experience);
      console.log("Education items:", resumeData.education);
      console.log("Skills:", resumeData.skills);
      
      // Debug: Check if the resumeData is actually populated
      const hasContent = Object.entries(resumeData).some(([key, value]) => {
        if (key === 'name' && value) return true;
        if (Array.isArray(value) && value.length > 0) return true;
        return false;
      });
      
      console.log("Resume data has content:", hasContent);
      
      // Validate required fields
      if (!resumeData.name || !resumeData.email || !resumeData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in at least your name, email, and phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Create a properly formatted data object to send to the API
      // Instead of using the spread operator which might preserve nested array structures
      
      // First, log the current structure of resumeData to see if there are any issues
      console.log("Current resumeData structure:", {
        experienceType: typeof resumeData.experience,
        experienceIsArray: Array.isArray(resumeData.experience),
        experienceLength: resumeData.experience?.length,
        experienceFirstItem: resumeData.experience?.[0],
        educationType: typeof resumeData.education,
        educationIsArray: Array.isArray(resumeData.education),
        educationLength: resumeData.education?.length,
        educationFirstItem: resumeData.education?.[0],
        skillsType: typeof resumeData.skills,
        skillsIsArray: Array.isArray(resumeData.skills),
        skillsLength: resumeData.skills?.length,
        skillsItems: resumeData.skills
      });
      
      // Create a clean data object with proper structure
      // Format the data for the API - using PascalCase for C# backend compatibility
      // Make sure to create new arrays to avoid reference issues
      const dataToSend = {
        // Basic information - using PascalCase for C# backend
        Name: resumeData.name || "",
        Title: resumeData.title || "",
        Email: resumeData.email || "",
        Phone: resumeData.phone || "",
        Location: resumeData.location || "",
        LinkedIn: resumeData.linkedin || "",
        Website: resumeData.website || "",
        Summary: resumeData.summary || "",
        
        // Ensure Experience is an array of objects with PascalCase properties
        // Create a new array with only valid entries
        Experience: (() => {
          const validExperiences = [];
          if (Array.isArray(resumeData.experience)) {
            for (const exp of resumeData.experience) {
              if (exp && typeof exp === 'object' && (exp.title || exp.company)) {
                validExperiences.push({
                  Title: exp.title || "",
                  Company: exp.company || "",
                  Location: exp.location || "",
                  StartDate: exp.startDate || "",
                  EndDate: exp.endDate || "",
                  Description: exp.description || ""
                });
              }
            }
          }
          return validExperiences;
        })(),
        
        // Ensure Education is an array of objects with PascalCase properties
        // Create a new array with only valid entries
        Education: (() => {
          const validEducation = [];
          if (Array.isArray(resumeData.education)) {
            for (const edu of resumeData.education) {
              if (edu && typeof edu === 'object' && (edu.degree || edu.institution)) {
                validEducation.push({
                  Degree: edu.degree || "",
                  Institution: edu.institution || "",
                  Location: edu.location || "",
                  StartDate: edu.startDate || "",
                  EndDate: edu.endDate || "",
                  Description: edu.description || ""
                });
              }
            }
          }
          return validEducation;
        })(),
        
        // Ensure Skills is an array of strings
        // Create a new array with only valid entries
        Skills: (() => {
          const validSkills = [];
          if (Array.isArray(resumeData.skills)) {
            for (const skill of resumeData.skills) {
              if (skill && typeof skill === 'string' && skill.trim() !== "") {
                validSkills.push(skill.trim());
              }
            }
          }
          return validSkills;
        })(),
        
        // Ensure Certifications is an array of objects with PascalCase properties
        // Create a new array with only valid entries
        Certifications: (() => {
          const validCertifications = [];
          if (Array.isArray(resumeData.certifications)) {
            for (const cert of resumeData.certifications) {
              if (cert && typeof cert === 'object') {
                validCertifications.push({
                  Name: cert.name || "",
                  Issuer: cert.issuer || "",
                  Date: cert.date || ""
                });
              }
            }
          }
          return validCertifications;
        })(),
        
        // Ensure Projects is an array of objects with PascalCase properties
        // Create a new array with only valid entries
        Projects: (() => {
          const validProjects = [];
          if (Array.isArray(resumeData.projects)) {
            for (const proj of resumeData.projects) {
              if (proj && typeof proj === 'object') {
                validProjects.push({
                  Name: proj.name || "",
                  Description: proj.description || "",
                  Technologies: proj.technologies || proj.date || "" // Fallback to date if technologies not available
                });
              }
            }
          }
          return validProjects;
        })()
      };
      
      // Ensure at least one field has data to prevent empty data detection
      const hasData = 
        dataToSend.Name || 
        dataToSend.Email || 
        dataToSend.Phone || 
        dataToSend.Summary || 
        dataToSend.Skills.length > 0 || 
        dataToSend.Experience.length > 0 || 
        dataToSend.Education.length > 0;
      
      console.log("Data has content:", hasData);
      
      // Debug: Check each field to see what's populated
      console.log("Data field check:", {
        name: !!dataToSend.Name,
        email: !!dataToSend.Email,
        phone: !!dataToSend.Phone,
        summary: !!dataToSend.Summary,
        experienceLength: dataToSend.Experience?.length || 0,
        educationLength: dataToSend.Education?.length || 0,
        skillsLength: dataToSend.Skills?.length || 0,
        templateId: selectedTemplate
      });
      
      // Validate template ID
      if (!selectedTemplate) {
        console.error("No template selected");
        toast({
          title: "Error",
          description: "Please select a template before generating your resume.",
          variant: "destructive",
        });
        return;
      }
      
      if (!hasData) {
        toast({
          title: "Error",
          description: "Please fill in at least some basic resume information before generating.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Sending formatted data to API:", dataToSend);
      
      // Check if the data has content - make sure to check each field properly
      const formattedDataHasContent = 
        (dataToSend.Name && dataToSend.Name.trim() !== "") || 
        (dataToSend.Email && dataToSend.Email.trim() !== "") || 
        (dataToSend.Phone && dataToSend.Phone.trim() !== "") || 
        (dataToSend.Summary && dataToSend.Summary.trim() !== "") || 
        (Array.isArray(dataToSend.Skills) && dataToSend.Skills.length > 0) || 
        (Array.isArray(dataToSend.Experience) && dataToSend.Experience.length > 0) || 
        (Array.isArray(dataToSend.Education) && dataToSend.Education.length > 0);
      
      console.log("Data has content check:", formattedDataHasContent);
      
      // Call the API to generate the resume
      try {
        console.log("Calling API with data:", {
          templateId: selectedTemplate,
          dataToSend: dataToSend
        });
        
        // Use the new API client
        // Convert the data to a flat structure to avoid nested arrays
        const flattenedData = {
          ...dataToSend,
          // Ensure these are proper arrays, not nested arrays
          Skills: Array.isArray(dataToSend.Skills) ? dataToSend.Skills : [],
          Experience: Array.isArray(dataToSend.Experience) ? dataToSend.Experience : [],
          Education: Array.isArray(dataToSend.Education) ? dataToSend.Education : [],
          Certifications: Array.isArray(dataToSend.Certifications) ? dataToSend.Certifications : [],
          Projects: Array.isArray(dataToSend.Projects) ? dataToSend.Projects : []
        };
        
        console.log("Sending flattened data to API:", flattenedData);
        
        const result = await resumeBuilderApi.buildResume({
          resumeData: JSON.stringify(flattenedData),
          templateId: selectedTemplate
        });
        
        console.log("API response:", result);
        
        // Check if result is undefined or null
        if (!result) {
          throw new Error("API returned undefined or null response");
        }
        
        // Destructure with default values to prevent errors
        const { data = null, error = null } = result || {};

        if (error) {
          console.error("API returned error:", error);
          toast({
            title: "Error",
            description: `Failed to generate resume: ${error}`,
            variant: "destructive",
          });
          return;
        }
        
        if (!data) {
          console.error("API returned no data");
          toast({
            title: "Error",
            description: "Failed to generate resume: No data returned from API",
            variant: "destructive",
          });
          return;
        }
        
        console.log("API returned data:", {
          hasHtml: !!data.html,
          htmlLength: data.html ? data.html.length : 0,
          hasData: !!data.data,
          dataKeys: data.data ? Object.keys(data.data) : []
        });

        if (data && data.html) {
          console.log("Resume data received from API:", data.data);
          console.log("HTML received from API (first 200 chars):", data.html.substring(0, 200));
        
          // Check if we received the "No resume data available" message
          if (data.html.includes("No resume data available")) {
            toast({
              title: "Warning",
              description: "No resume data was provided or the data was empty. Please fill in your resume details.",
              variant: "warning",
            });
            
            // Log the current state of resumeData for debugging
            console.log("Current resumeData before API call:", resumeData);
            
            // Don't update the state, keep the current form data
            setActiveTab("edit");
            return;
          }
        
          // Create a debug element to show the data
          const debugInfo = {
            responseData: data,
            isEmpty: isEmptyResumeData(data.data),
            containsHardcodedName: data.html.includes("Vishal Verma"),
            dataStructure: data.data
          };
          
          // Add debug info to the page (will be hidden in production)
          const debugElement = document.createElement('div');
          debugElement.id = 'resume-debug-info';
          debugElement.style.display = 'none';
          debugElement.textContent = JSON.stringify(debugInfo, null, 2);
          document.body.appendChild(debugElement);
          
          // Check if the data is complete
          const receivedData = data.data || {};
        
          // Log the structure of the received data
          console.log("Received data structure:", {
            dataType: typeof receivedData,
            experienceType: typeof receivedData.experience,
            experienceIsArray: Array.isArray(receivedData.experience),
            experienceLength: receivedData.experience?.length,
            experienceFirstItem: receivedData.experience?.[0],
            educationType: typeof receivedData.education,
            educationIsArray: Array.isArray(receivedData.education),
            educationLength: receivedData.education?.length,
            educationFirstItem: receivedData.education?.[0],
            skillsType: typeof receivedData.skills,
            skillsIsArray: Array.isArray(receivedData.skills),
            skillsLength: receivedData.skills?.length,
            skillsItems: receivedData.skills
          });
        
        // Create a clean version of the received data
        const cleanReceivedData = {
          name: receivedData.name || "",
          title: receivedData.title || "",
          email: receivedData.email || "",
          phone: receivedData.phone || "",
          location: receivedData.location || "",
          linkedin: receivedData.linkedin || "",
          website: receivedData.website || "",
          summary: receivedData.summary || "",
          experience: Array.isArray(receivedData.experience) ? receivedData.experience : [],
          education: Array.isArray(receivedData.education) ? receivedData.education : [],
          skills: Array.isArray(receivedData.skills) ? receivedData.skills : [],
          certifications: Array.isArray(receivedData.certifications) ? receivedData.certifications : [],
          projects: Array.isArray(receivedData.projects) ? receivedData.projects : []
        };
        let isDataComplete = true;
        let missingFields = [];
        
        // Check for required fields
        if (!cleanReceivedData.name || cleanReceivedData.name === "") {
          isDataComplete = false;
          missingFields.push("Name");
        }
        if (!cleanReceivedData.experience || cleanReceivedData.experience.length === 0 || 
            (cleanReceivedData.experience.length > 0 && (!cleanReceivedData.experience[0]?.title || cleanReceivedData.experience[0]?.title === ""))) {
          isDataComplete = false;
          missingFields.push("Experience");
        }
        if (!cleanReceivedData.education || cleanReceivedData.education.length === 0 || 
            (cleanReceivedData.education.length > 0 && (!cleanReceivedData.education[0]?.degree || cleanReceivedData.education[0]?.degree === ""))) {
          isDataComplete = false;
          missingFields.push("Education");
        }
        if (!cleanReceivedData.skills || cleanReceivedData.skills.length === 0) {
          isDataComplete = false;
          missingFields.push("Skills");
        }
        
        if (!isDataComplete) {
          toast({
            title: "Warning",
            description: `Some information could not be extracted from your resume: ${missingFields.join(", ")}. You can manually add this information in the form.`,
            variant: "warning",
          });
          
          // Update the form with the extracted data
          setResumeData(prevData => {
            // Create a merged object that preserves arrays from both objects
            const merged = { ...prevData };
            
            // Copy basic fields
            if (cleanReceivedData.name) merged.name = cleanReceivedData.name;
            if (cleanReceivedData.title) merged.title = cleanReceivedData.title;
            if (cleanReceivedData.email) merged.email = cleanReceivedData.email;
            if (cleanReceivedData.phone) merged.phone = cleanReceivedData.phone;
            if (cleanReceivedData.location) merged.location = cleanReceivedData.location;
            if (cleanReceivedData.linkedin) merged.linkedin = cleanReceivedData.linkedin;
            if (cleanReceivedData.website) merged.website = cleanReceivedData.website;
            if (cleanReceivedData.summary) merged.summary = cleanReceivedData.summary;
            
            // Merge arrays properly
            if (cleanReceivedData.experience && cleanReceivedData.experience.length > 0) {
              merged.experience = [...cleanReceivedData.experience];
            }
            
            if (cleanReceivedData.education && cleanReceivedData.education.length > 0) {
              merged.education = [...cleanReceivedData.education];
            }
            
            if (cleanReceivedData.skills && cleanReceivedData.skills.length > 0) {
              merged.skills = [...cleanReceivedData.skills];
            }
            
            if (cleanReceivedData.certifications && cleanReceivedData.certifications.length > 0) {
              merged.certifications = [...cleanReceivedData.certifications];
            }
            
            if (cleanReceivedData.projects && cleanReceivedData.projects.length > 0) {
              merged.projects = [...cleanReceivedData.projects];
            }
            
            return merged;
          });
        }
        
        // Check if the HTML contains the "No resume data available" message
        if (data.html.includes("No resume data available")) {
          toast({
            title: "Warning",
            description: "No resume data available. Please fill in your resume details.",
            variant: "destructive",
          });
          return;
        }
        
        // Check if the HTML contains hardcoded values
        if (data.html.includes("Vishal Verma") && isEmptyResumeData(data.data)) {
          toast({
            title: "Warning",
            description: "The resume contains hardcoded values. Please fill in your resume details.",
            variant: "destructive",
          });
          
          // Log the specific structure for debugging
          console.log("Detected hardcoded values with empty data structure:", JSON.stringify(data.data, null, 2));
          
          // Create a debug element with the specific issue
          const debugElement = document.createElement('div');
          debugElement.id = 'resume-hardcoded-debug';
          debugElement.style.display = 'none';
          debugElement.textContent = JSON.stringify({
            issue: "Hardcoded values detected",
            html: data.html.substring(0, 500),
            data: data.data
          }, null, 2);
          document.body.appendChild(debugElement);
          
          return;
        }
        
          setResumeHtml(data.html);
          setActiveTab("preview");
          
          toast({
            title: "Success",
            description: "Resume generated successfully!",
            variant: "default",
          });
        } else {
          throw new Error("Invalid response from server: missing HTML content");
        }
      } catch (innerError) {
        console.error("Error processing API response:", innerError);
        throw innerError;
      }
    } catch (error) {
      console.error("Error generating resume:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? 
          `Failed to generate resume: ${error.message}` : 
          "Failed to generate resume",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOptimizeResume = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    try {
      setOptimizing(true);
      
      toast({
        title: "Optimizing Resume",
        description: "Using AI to optimize your resume and suggest improvements...",
      });
      
      // Call the API to optimize the resume
      const { data, error } = await resumeBuilderApi.optimizeResume({
        resumeData: JSON.stringify(resumeData),
        templateId: selectedTemplate
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to optimize resume: ${error}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.html) {
        console.log("Optimized resume data:", data.data);
        console.log("Optimization report:", data.optimizationReport);
        
        // Store the optimization report
        setOptimizationReport(data.optimizationReport);
        
        // Process suggestions for user approval
        const suggestions: {section: string, original: string, suggested: string}[] = [];
        
        // Process section feedback
        if (data.optimizationReport.sectionFeedback) {
          const sectionFeedback = data.optimizationReport.sectionFeedback;
          
          // Process summary suggestion
          if (sectionFeedback["Summary"] || sectionFeedback["Professional Summary"]) {
            const suggestedSummary = sectionFeedback["Summary"] || sectionFeedback["Professional Summary"];
            if (suggestedSummary && resumeData.summary) {
              suggestions.push({
                section: "summary",
                original: resumeData.summary,
                suggested: suggestedSummary
              });
            }
          }
          
          // Process experience suggestions
          if (sectionFeedback["Experience"] || sectionFeedback["Work Experience"]) {
            const suggestedExperience = sectionFeedback["Experience"] || sectionFeedback["Work Experience"];
            if (suggestedExperience && resumeData.experience.length > 0) {
              suggestions.push({
                section: "experience",
                original: resumeData.experience[0].description,
                suggested: suggestedExperience
              });
            }
          }
          
          // Process skills suggestions
          if (sectionFeedback["Skills"]) {
            const suggestedSkills = sectionFeedback["Skills"];
            if (suggestedSkills) {
              suggestions.push({
                section: "skills",
                original: resumeData.skills.join(", "),
                suggested: suggestedSkills
              });
            }
          }
          
          // Process education suggestions
          if (sectionFeedback["Education"]) {
            const suggestedEducation = sectionFeedback["Education"];
            if (suggestedEducation && resumeData.education.length > 0) {
              suggestions.push({
                section: "education",
                original: resumeData.education[0].description || "",
                suggested: suggestedEducation
              });
            }
          }
        }
        
        if (suggestions.length > 0) {
          // Store the suggestions for processing
          setPendingSuggestions(suggestions);
          
          // Show the first suggestion
          setCurrentSuggestion(suggestions[0]);
          setShowSuggestionDialog(true);
          
          toast({
            title: "AI Suggestions Ready",
            description: "Review and approve AI suggestions to improve your resume.",
            variant: "default",
          });
        } else {
          // If no suggestions, just update with the optimized data
          setResumeData(data.data);
          
          // Check if the HTML contains the "No resume data available" message
          if (data.html.includes("No resume data available")) {
            toast({
              title: "Warning",
              description: "No resume data available. Please fill in your resume details.",
              variant: "destructive",
            });
            return;
          }
          
          // Check if the HTML contains hardcoded values
          if (data.html.includes("Vishal Verma") && isEmptyResumeData(data.data)) {
            toast({
              title: "Warning",
              description: "The resume contains hardcoded values. Please fill in your resume details.",
              variant: "destructive",
            });
            return;
          }
          
          setResumeHtml(data.html);
          setActiveTab("preview");
          
          toast({
            title: "Success",
            description: "Resume optimized successfully! AI has suggested improvements to your resume.",
            variant: "default",
          });
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Error optimizing resume:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to optimize resume",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };
  
  const handleAcceptSuggestion = () => {
    if (!currentSuggestion) return;
    
    // Update the resume data based on the section
    const updatedResumeData = { ...resumeData };
    
    switch (currentSuggestion.section) {
      case "summary":
        updatedResumeData.summary = currentSuggestion.suggested;
        break;
      case "experience":
        if (updatedResumeData.experience.length > 0) {
          updatedResumeData.experience[0].description = currentSuggestion.suggested;
        }
        break;
      case "skills":
        // Parse the suggested skills
        const skillsArray = currentSuggestion.suggested
          .split(/,|•/)
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
        
        // Add new skills without duplicates
        const existingSkills = new Set(updatedResumeData.skills);
        skillsArray.forEach(skill => {
          if (!existingSkills.has(skill)) {
            updatedResumeData.skills.push(skill);
          }
        });
        break;
      case "education":
        if (updatedResumeData.education.length > 0) {
          updatedResumeData.education[0].description = currentSuggestion.suggested;
        }
        break;
    }
    
    // Update the resume data
    setResumeData(updatedResumeData);
    
    // Move to the next suggestion or finish
    processNextSuggestion();
  };
  
  const handleRejectSuggestion = () => {
    // Skip this suggestion and move to the next one
    processNextSuggestion();
  };
  
  const processNextSuggestion = () => {
    // Remove the current suggestion from the pending list
    const updatedSuggestions = [...pendingSuggestions];
    updatedSuggestions.shift();
    setPendingSuggestions(updatedSuggestions);
    
    if (updatedSuggestions.length > 0) {
      // Show the next suggestion
      setCurrentSuggestion(updatedSuggestions[0]);
    } else {
      // No more suggestions, close the dialog and regenerate the resume
      setShowSuggestionDialog(false);
      setCurrentSuggestion(null);
      
      // Regenerate the resume with the updated data
      handleGenerateResume();
    }
  };

  const handleDownloadPdf = () => {
    if (!resumeHtml) {
      toast({
        title: "Error",
        description: "Please generate a resume first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a new window with the resume HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Pop-up blocked. Please allow pop-ups for this site.",
          variant: "destructive",
        });
        return;
      }

      // Write the HTML to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${resumeData.name} - Resume</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                @page {
                  size: letter;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${resumeHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      toast({
        title: "Success",
        description: "Preparing PDF for download...",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Resume Builder</h1>
      <p className="text-gray-600 mb-8">Create professional resumes with our templates and AI-powered suggestions.</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">1. Choose Template</TabsTrigger>
          <TabsTrigger value="upload">2. Upload Resume</TabsTrigger>
          <TabsTrigger value="edit">3. Edit Content</TabsTrigger>
          <TabsTrigger value="preview">4. Preview & Download</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Select a Template</h2>
            <p className="text-gray-600 mb-6">Choose from our collection of professional resume templates.</p>
            
            {loadingTemplates ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-600 mb-4">No templates available. Please check back later.</p>
                <Button onClick={() => setActiveTab("upload")}>
                  Continue with Manual Entry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all ${selectedTemplate === template.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="aspect-[8.5/11] bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={template.thumbnail || '/placeholder-template.png'} 
                          alt={template.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button 
                        variant={selectedTemplate === template.id ? "default" : "outline"} 
                        className="w-full"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        {selectedTemplate === template.id ? "Selected" : "Select Template"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setActiveTab("upload")} 
                disabled={!selectedTemplate || loadingTemplates}
              >
                Next: Upload Resume
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Your Resume</h2>
            <p className="text-gray-600 mb-6">Upload your existing resume or start from scratch.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Resume</CardTitle>
                  <CardDescription>Upload your existing resume to extract information automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeFileUploader onFileSelected={handleFileSelected} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("templates")}>Back</Button>
                  <Button 
                    onClick={handleExtractData} 
                    disabled={!resumeFile || extractingData}
                  >
                    {extractingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract Data & Continue"
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Start from Scratch</CardTitle>
                  <CardDescription>Create a new resume by entering your information manually.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">No resume? No problem!</p>
                      <p className="text-gray-500">Start with a blank template and fill in your details.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("templates")}>Back</Button>
                  <Button onClick={handleManualEntry}>Continue to Editor</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Resume Content</h2>
            <p className="text-gray-600 mb-6">Fill in your details to create your resume.</p>
            
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-medium mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={resumeData.name} 
                      onChange={(e) => setResumeData({...resumeData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input 
                      id="title" 
                      value={resumeData.title} 
                      onChange={(e) => setResumeData({...resumeData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={resumeData.email} 
                      onChange={(e) => setResumeData({...resumeData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={resumeData.phone} 
                      onChange={(e) => setResumeData({...resumeData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={resumeData.location} 
                      onChange={(e) => setResumeData({...resumeData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                    <Input 
                      id="linkedin" 
                      value={resumeData.linkedin} 
                      onChange={(e) => setResumeData({...resumeData, linkedin: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea 
                      id="summary" 
                      value={resumeData.summary} 
                      onChange={(e) => setResumeData({...resumeData, summary: e.target.value})}
                      className="h-24"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Experience */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Work Experience</h3>
                  <Button variant="outline" size="sm" onClick={handleAddExperience}>
                    Add Experience
                  </Button>
                </div>
                
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Experience {index + 1}</h4>
                      {resumeData.experience.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveExperience(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`job-title-${index}`}>Job Title</Label>
                        <Input 
                          id={`job-title-${index}`} 
                          value={exp.title} 
                          onChange={(e) => {
                            const newExperience = [...resumeData.experience];
                            newExperience[index].title = e.target.value;
                            setResumeData({...resumeData, experience: newExperience});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`company-${index}`}>Company</Label>
                        <Input 
                          id={`company-${index}`} 
                          value={exp.company} 
                          onChange={(e) => {
                            const newExperience = [...resumeData.experience];
                            newExperience[index].company = e.target.value;
                            setResumeData({...resumeData, experience: newExperience});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`job-location-${index}`}>Location</Label>
                        <Input 
                          id={`job-location-${index}`} 
                          value={exp.location} 
                          onChange={(e) => {
                            const newExperience = [...resumeData.experience];
                            newExperience[index].location = e.target.value;
                            setResumeData({...resumeData, experience: newExperience});
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`start-date-${index}`}>Start Date</Label>
                          <Input 
                            id={`start-date-${index}`} 
                            placeholder="MM/YYYY" 
                            value={exp.startDate} 
                            onChange={(e) => {
                              const newExperience = [...resumeData.experience];
                              newExperience[index].startDate = e.target.value;
                              setResumeData({...resumeData, experience: newExperience});
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`end-date-${index}`}>End Date</Label>
                          <Input 
                            id={`end-date-${index}`} 
                            placeholder="MM/YYYY or Present" 
                            value={exp.endDate} 
                            onChange={(e) => {
                              const newExperience = [...resumeData.experience];
                              newExperience[index].endDate = e.target.value;
                              setResumeData({...resumeData, experience: newExperience});
                            }}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`job-description-${index}`}>Description</Label>
                        <Textarea 
                          id={`job-description-${index}`} 
                          value={exp.description} 
                          onChange={(e) => {
                            const newExperience = [...resumeData.experience];
                            newExperience[index].description = e.target.value;
                            setResumeData({...resumeData, experience: newExperience});
                          }}
                          className="h-24"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Education */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Education</h3>
                  <Button variant="outline" size="sm" onClick={handleAddEducation}>
                    Add Education
                  </Button>
                </div>
                
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Education {index + 1}</h4>
                      {resumeData.education.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveEducation(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`degree-${index}`}>Degree</Label>
                        <Input 
                          id={`degree-${index}`} 
                          value={edu.degree} 
                          onChange={(e) => {
                            const newEducation = [...resumeData.education];
                            newEducation[index].degree = e.target.value;
                            setResumeData({...resumeData, education: newEducation});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`institution-${index}`}>Institution</Label>
                        <Input 
                          id={`institution-${index}`} 
                          value={edu.institution} 
                          onChange={(e) => {
                            const newEducation = [...resumeData.education];
                            newEducation[index].institution = e.target.value;
                            setResumeData({...resumeData, education: newEducation});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edu-location-${index}`}>Location</Label>
                        <Input 
                          id={`edu-location-${index}`} 
                          value={edu.location} 
                          onChange={(e) => {
                            const newEducation = [...resumeData.education];
                            newEducation[index].location = e.target.value;
                            setResumeData({...resumeData, education: newEducation});
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`edu-start-date-${index}`}>Start Date</Label>
                          <Input 
                            id={`edu-start-date-${index}`} 
                            placeholder="MM/YYYY" 
                            value={edu.startDate} 
                            onChange={(e) => {
                              const newEducation = [...resumeData.education];
                              newEducation[index].startDate = e.target.value;
                              setResumeData({...resumeData, education: newEducation});
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edu-end-date-${index}`}>End Date</Label>
                          <Input 
                            id={`edu-end-date-${index}`} 
                            placeholder="MM/YYYY" 
                            value={edu.endDate} 
                            onChange={(e) => {
                              const newEducation = [...resumeData.education];
                              newEducation[index].endDate = e.target.value;
                              setResumeData({...resumeData, education: newEducation});
                            }}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`edu-description-${index}`}>Description (optional)</Label>
                        <Textarea 
                          id={`edu-description-${index}`} 
                          value={edu.description || ""} 
                          onChange={(e) => {
                            const newEducation = [...resumeData.education];
                            newEducation[index].description = e.target.value;
                            setResumeData({...resumeData, education: newEducation});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Skills */}
              <div>
                <h3 className="text-xl font-medium mb-4">Skills</h3>
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea 
                    id="skills" 
                    value={resumeData.skills.join(", ")} 
                    onChange={handleSkillsChange}
                    placeholder="JavaScript, React, Node.js, Python, SQL, Git"
                    className="h-24"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Certifications */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Certifications</h3>
                  <Button variant="outline" size="sm" onClick={handleAddCertification}>
                    Add Certification
                  </Button>
                </div>
                
                {resumeData.certifications.map((cert, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Certification {index + 1}</h4>
                      {resumeData.certifications.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveCertification(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`cert-name-${index}`}>Name</Label>
                        <Input 
                          id={`cert-name-${index}`} 
                          value={cert.name} 
                          onChange={(e) => {
                            const newCertifications = [...resumeData.certifications];
                            newCertifications[index] = {
                              ...newCertifications[index],
                              name: e.target.value
                            };
                            setResumeData({...resumeData, certifications: newCertifications});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cert-issuer-${index}`}>Issuer</Label>
                        <Input 
                          id={`cert-issuer-${index}`} 
                          value={cert.issuer} 
                          onChange={(e) => {
                            const newCertifications = [...resumeData.certifications];
                            newCertifications[index] = {
                              ...newCertifications[index],
                              issuer: e.target.value
                            };
                            setResumeData({...resumeData, certifications: newCertifications});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cert-date-${index}`}>Date</Label>
                        <Input 
                          id={`cert-date-${index}`} 
                          value={cert.date} 
                          onChange={(e) => {
                            const newCertifications = [...resumeData.certifications];
                            newCertifications[index] = {
                              ...newCertifications[index],
                              date: e.target.value
                            };
                            setResumeData({...resumeData, certifications: newCertifications});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Projects */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Projects</h3>
                  <Button variant="outline" size="sm" onClick={handleAddProject}>
                    Add Project
                  </Button>
                </div>
                
                {(resumeData.projects || []).map((proj, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Project {index + 1}</h4>
                      {(resumeData.projects || []).length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveProject(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`proj-name-${index}`}>Name</Label>
                        <Input 
                          id={`proj-name-${index}`} 
                          value={proj.name || ""} 
                          onChange={(e) => {
                            const newProjects = [...(resumeData.projects || [])];
                            newProjects[index] = {
                              ...newProjects[index],
                              name: e.target.value
                            };
                            setResumeData({...resumeData, projects: newProjects});
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`proj-technologies-${index}`}>Technologies</Label>
                        <Input 
                          id={`proj-technologies-${index}`} 
                          value={proj.technologies || ""} 
                          onChange={(e) => {
                            const newProjects = [...(resumeData.projects || [])];
                            newProjects[index] = {
                              ...newProjects[index],
                              technologies: e.target.value
                            };
                            setResumeData({...resumeData, projects: newProjects});
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`proj-description-${index}`}>Description</Label>
                        <Textarea 
                          id={`proj-description-${index}`} 
                          value={proj.description || ""} 
                          onChange={(e) => {
                            const newProjects = [...(resumeData.projects || [])];
                            newProjects[index] = {
                              ...newProjects[index],
                              description: e.target.value
                            };
                            setResumeData({...resumeData, projects: newProjects});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setActiveTab("upload")}>Back</Button>
                <Button onClick={handleGenerateResume} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Resume"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Preview & Download</h2>
            <p className="text-gray-600 mb-6">Preview your resume and download it as a PDF.</p>
            
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-3/4">
                <div className="resume-preview-container">
                  {resumeHtml ? (
                    <iframe
                      className="resume-preview"
                      srcDoc={resumeHtml}
                      title="Resume Preview"
                      onLoad={(e) => {
                        // Log the iframe content for debugging
                        console.log("iframe loaded");
                        try {
                          const iframe = e.target as HTMLIFrameElement;
                          if (iframe.contentWindow) {
                            console.log("iframe content sections:", {
                              experience: iframe.contentWindow.document.querySelectorAll('.experience-item').length,
                              education: iframe.contentWindow.document.querySelectorAll('.education-item').length,
                              skills: iframe.contentWindow.document.querySelectorAll('.skill-item').length
                            });
                          }
                        } catch (err) {
                          console.error("Error inspecting iframe:", err);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-96">
                      <p className="text-gray-500">Generate your resume to see a preview</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="lg:w-1/4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Download Options</CardTitle>
                    <CardDescription>Download your resume in different formats.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" onClick={handleDownloadPdf} disabled={!resumeHtml}>
                      Download PDF
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab("edit")}>
                      Edit Resume
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full mt-2" 
                      onClick={handleOptimizeResume} 
                      disabled={!resumeHtml || optimizing}
                    >
                      {optimizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        "AI Optimize Resume"
                      )}
                    </Button>
                  </CardContent>
                </Card>
                
                {optimizationReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Optimization Report</CardTitle>
                      <CardDescription>Suggestions to improve your resume</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm">ATS Score</h3>
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-md">
                          {optimizationReport.atsScore || 0}%
                        </div>
                      </div>
                      
                      {optimizationReport.improvements && optimizationReport.improvements.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-medium text-sm">Suggested Improvements</h3>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {optimizationReport.improvements.map((improvement, index) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {optimizationReport.sectionFeedback && Object.keys(optimizationReport.sectionFeedback).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-medium text-sm">Section Feedback</h3>
                          <div className="space-y-2">
                            {Object.entries(optimizationReport.sectionFeedback).map(([section, feedback]) => (
                              <div key={section} className="border rounded-md p-2">
                                <h4 className="font-medium text-xs">{section}</h4>
                                <p className="text-xs">{feedback}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* AI Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Suggestion for {currentSuggestion?.section}</DialogTitle>
            <DialogDescription>
              Review the AI-generated suggestion and decide whether to apply it to your resume.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Original Content</h3>
              <div className="border rounded-md p-3 bg-gray-50 text-sm whitespace-pre-wrap">
                {currentSuggestion?.original || "No content"}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">AI Suggestion</h3>
              <div className="border rounded-md p-3 bg-blue-50 text-sm whitespace-pre-wrap">
                {currentSuggestion?.suggested || "No suggestion"}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleRejectSuggestion} className="gap-2">
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleAcceptSuggestion} className="gap-2">
              <Check className="h-4 w-4" />
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to check if a field is empty
const isEmptyField = (field: any): boolean => {
  if (field === null || field === undefined) return true;
  
  if (Array.isArray(field)) {
    if (field.length === 0) return true;
    
    // Check if all items in the array are empty
    return field.every(item => isEmptyField(item));
  }
  
  if (typeof field === 'object') {
    // Check if it's an empty object
    if (Object.keys(field).length === 0) return true;
    
    // Check if all values in the object are empty
    return Object.values(field).every(value => isEmptyField(value));
  }
  
  if (typeof field === 'string') {
    return field.trim() === '';
  }
  
  return false;
};

// Helper function to check if resume data is empty
const isEmptyResumeData = (data: any): boolean => {
  if (!data) return true;
  
  // Check if all fields are empty
  const fields = ['name', 'title', 'email', 'phone', 'location', 'summary', 
                 'experience', 'education', 'skills', 'certifications', 'projects'];
  
  // Special check for the specific nested array structure we're seeing
  if (data.name && Array.isArray(data.name) && data.name.length === 0 &&
      data.experience && Array.isArray(data.experience) && data.experience.length > 0 &&
      Array.isArray(data.experience[0]) && data.experience[0].length > 0 &&
      Array.isArray(data.experience[0][0]) && data.experience[0][0].length === 0) {
    console.log("Detected specific nested empty array structure");
    return true;
  }
  
  return fields.every(field => {
    if (!data[field]) return true;
    return isEmptyField(data[field]);
  });
};

export default ResumeBuilder;