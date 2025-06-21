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
import { Upload, FileText, Download, Eye, User, Briefcase, GraduationCap, Award, Code, Plus, X, Sparkles, Zap, FileCheck, ArrowLeft, ArrowRight, Edit, Palette, Camera, Image } from 'lucide-react';
import ResumeFileUploader from '@/components/ResumeFileUploader';
import { resumeBuilderApi } from '@/utils/resumeBuilderApi';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/utils/apiClient';
import { useResume } from "@/contexts/resume/ResumeContext";
import Handlebars from 'handlebars';
import TemplateColorPicker from "@/components/resume/TemplateColorPicker";
import styles from './ResumeBuilderApp.module.css';
import { getAllTemplates, type Template } from '@/config/resumeTemplates';

// Use centralized template configuration
const templates = getAllTemplates();

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
  Photo: "",
  Skills: [],
  Experience: [{
    Title: "",
    Company: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    Description: "",
    Projects: []
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
  }],
  Achievements: [],
  References: [{
    Name: "",
    Title: "",
    Contact: ""
  }]
};

const DEFAULT_TEMPLATE_ID = "default-template"; // Use your actual default template ID

// Templates that support profile photos
const PHOTO_SUPPORTED_TEMPLATES = [
  "navy-column-modern",
  "grey-classic-profile", 
  "blue-sidebar-profile",
  "green-sidebar-receptionist",
  "classic-profile-orange",
  "green-sidebar-customer-service",
  "creative-designer"
];

// Function to transform data to match template expectations (PascalCase)
const transformDataForTemplate = (data: any) => {
  if (!data) return data;
  
  console.log('Input data to transform:', data);
  
  const transformed = { ...data };
  
  // Transform main fields to PascalCase if they exist in camelCase
  const fieldMappings = {
    'name': 'Name',
    'title': 'Title', 
    'email': 'Email',
    'phone': 'Phone',
    'location': 'Location',
    'linkedin': 'LinkedIn',
    'website': 'Website',
    'summary': 'Summary',
    'photo': 'Photo',
    'skills': 'Skills',
    'experience': 'Experience',
    'education': 'Education',
    'certifications': 'Certifications',
    'projects': 'Projects',
    'achievements': 'Achievements',
    'references': 'References'
  };
  
  // Apply field mappings
  Object.entries(fieldMappings).forEach(([camelCase, pascalCase]) => {
    if (data[camelCase] !== undefined) {
      transformed[pascalCase] = data[camelCase];
      // Keep both for compatibility
      if (!transformed[camelCase]) {
        transformed[camelCase] = data[camelCase];
      }
    }
  });
  
  // Transform nested arrays (Experience, Education, etc.)
  if (transformed.Experience || transformed.experience) {
    const experiences = transformed.Experience || transformed.experience;
    console.log('Original experiences:', experiences);
    
    if (Array.isArray(experiences)) {
      transformed.Experience = experiences
        .map((exp: any) => {
          const transformedExp = {
            ...exp,
            Title: exp.Title || exp.title || exp.jobTitle || exp.position || '',
            Company: exp.Company || exp.company || exp.employer || exp.organization || '',
            Location: exp.Location || exp.location || exp.city || '',
            StartDate: exp.StartDate || exp.startDate || exp.start_date || exp.from || '',
            EndDate: exp.EndDate || exp.endDate || exp.end_date || exp.to || '',
            Description: exp.Description || exp.description || exp.responsibilities || exp.duties || '',
            Projects: Array.isArray(exp.Projects) ? exp.Projects.map((proj: any) => ({
              Name: proj.Name || proj.name || proj.title || '',
              Description: proj.Description || proj.description || proj.details || '',
              Technologies: proj.Technologies || proj.technologies || proj.tech || proj.tools || ''
            })) : (Array.isArray(exp.projects) ? exp.projects.map((proj: any) => ({
              Name: proj.Name || proj.name || proj.title || '',
              Description: proj.Description || proj.description || proj.details || '',
              Technologies: proj.Technologies || proj.technologies || proj.tech || proj.tools || ''
            })) : [])
          };
          console.log('Transformed experience:', transformedExp);
          return transformedExp;
        })
        .filter((exp: any) => {
          // Filter out empty experience entries
          const hasContent = exp.Title.trim() || exp.Company.trim() || exp.Description.trim();
          console.log('Experience has content:', hasContent, exp);
          return hasContent;
        });
    }
  }
  
  if (transformed.Education || transformed.education) {
    const education = transformed.Education || transformed.education;
    console.log('Original education:', education);
    
    if (Array.isArray(education)) {
      transformed.Education = education
        .map((edu: any) => {
          const transformedEdu = {
            ...edu,
            Degree: edu.Degree || edu.degree || edu.qualification || edu.program || '',
            Institution: edu.Institution || edu.institution || edu.school || edu.university || edu.college || '',
            Location: edu.Location || edu.location || edu.city || '',
            StartDate: edu.StartDate || edu.startDate || edu.start_date || edu.from || '',
            EndDate: edu.EndDate || edu.endDate || edu.end_date || edu.to || '',
            GPA: edu.GPA || edu.gpa || edu.grade || '',
            Description: edu.Description || edu.description || edu.details || ''
          };
          console.log('Transformed education:', transformedEdu);
          return transformedEdu;
        })
        .filter((edu: any) => {
          // Filter out empty education entries
          const hasContent = edu.Degree.trim() || edu.Institution.trim();
          console.log('Education has content:', hasContent, edu);
          return hasContent;
        });
    }
  }
  
  if (transformed.Certifications || transformed.certifications) {
    const certifications = transformed.Certifications || transformed.certifications;
    console.log('Original certifications:', certifications);
    
    if (Array.isArray(certifications)) {
      transformed.Certifications = certifications
        .map((cert: any) => {
          const transformedCert = {
            ...cert,
            Name: cert.Name || cert.name || cert.title || cert.certification || '',
            Issuer: cert.Issuer || cert.issuer || cert.organization || cert.authority || '',
            Date: cert.Date || cert.date || cert.issued || cert.year || ''
          };
          console.log('Transformed certification:', transformedCert);
          return transformedCert;
        })
        .filter((cert: any) => {
          // Filter out empty certification entries
          const hasContent = cert.Name.trim() || cert.Issuer.trim();
          console.log('Certification has content:', hasContent, cert);
          return hasContent;
        });
    }
  }
  
  if (transformed.Projects || transformed.projects) {
    const projects = transformed.Projects || transformed.projects;
    console.log('Original projects:', projects);
    
    if (Array.isArray(projects)) {
      transformed.Projects = projects
        .map((proj: any) => {
          const transformedProj = {
            ...proj,
            Name: proj.Name || proj.name || proj.title || proj.project || '',
            Description: proj.Description || proj.description || proj.details || proj.summary || '',
            Technologies: proj.Technologies || proj.technologies || proj.tech || proj.tools || proj.stack || '',
            Date: proj.Date || proj.date || proj.year || proj.period || ''
          };
          console.log('Transformed project:', transformedProj);
          return transformedProj;
        })
        .filter((proj: any) => {
          // Filter out empty project entries
          const hasContent = proj.Name.trim() || proj.Description.trim();
          console.log('Project has content:', hasContent, proj);
          return hasContent;
        });
    }
  }
  
  // Migrate standalone projects to experience projects (for backward compatibility)
  if (transformed.Projects && Array.isArray(transformed.Projects) && transformed.Projects.length > 0) {
    if (transformed.Experience && Array.isArray(transformed.Experience) && transformed.Experience.length > 0) {
      // Check if any experience already has projects
      const hasExistingProjects = transformed.Experience.some((exp: any) => 
        exp.Projects && Array.isArray(exp.Projects) && exp.Projects.length > 0
      );
      
      // If no experience has projects, add standalone projects to the first experience
      if (!hasExistingProjects) {
        console.log('Migrating standalone projects to first experience entry');
        transformed.Experience[0].Projects = [...transformed.Projects];
      }
    }
    // Keep standalone projects for backward compatibility but mark for potential removal
    console.log('Standalone projects will be maintained for backward compatibility');
  }
  
  // Handle achievements
  if (transformed.Achievements || transformed.achievements) {
    const achievements = transformed.Achievements || transformed.achievements;
    console.log('Original achievements:', achievements);
    
    if (Array.isArray(achievements)) {
      transformed.Achievements = achievements.filter((achievement: string) => achievement && achievement.trim().length > 0);
    } else if (typeof achievements === 'string') {
      // If achievements is a string, split it into an array
      transformed.Achievements = achievements.split('\n').map((achievement: string) => achievement.trim()).filter((achievement: string) => achievement.length > 0);
    }
  }
  
  // Handle references
  if (transformed.References || transformed.references) {
    const references = transformed.References || transformed.references;
    console.log('Original references:', references);
    
    if (Array.isArray(references)) {
      transformed.References = references
        .map((ref: any) => {
          const transformedRef = {
            ...ref,
            Name: ref.Name || ref.name || ref.fullName || ref.person || '',
            Title: ref.Title || ref.title || ref.position || ref.jobTitle || '',
            Contact: ref.Contact || ref.contact || ref.email || ref.phone || ref.contactInfo || ''
          };
          console.log('Transformed reference:', transformedRef);
          return transformedRef;
        })
        .filter((ref: any) => {
          // Filter out empty reference entries
          const hasContent = ref.Name.trim() || ref.Contact.trim();
          console.log('Reference has content:', hasContent, ref);
          return hasContent;
        });
    }
  }
  
  // Ensure Skills is an array
  if (transformed.Skills || transformed.skills) {
    const skills = transformed.Skills || transformed.skills;
    if (typeof skills === 'string') {
      // If skills is a string, split it into an array
      transformed.Skills = skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill.length > 0);
    } else if (Array.isArray(skills)) {
      transformed.Skills = skills;
    }
  }
  
  // Filter out empty objects from arrays and provide fallback data if needed
  if (transformed.Experience && Array.isArray(transformed.Experience)) {
    // First, filter out completely empty objects
    transformed.Experience = transformed.Experience.filter((exp: any) => {
      const hasData = exp.Title || exp.Company || exp.Description || 
                     exp.title || exp.company || exp.description ||
                     exp.jobTitle || exp.employer || exp.responsibilities;
      console.log('Experience item has data:', hasData, exp);
      return hasData;
    });
    
    // If no valid experience items, provide a sample one
    if (transformed.Experience.length === 0) {
      console.log('No valid experience found, providing sample data');
      transformed.Experience = [{
        Title: "Software Engineer",
        Company: "Tech Company",
        Location: "City, State",
        StartDate: "2020",
        EndDate: "Present",
        Description: "Developed and maintained software applications using modern technologies.",
        Projects: []
      }];
    }
  }
  
  if (transformed.Education && Array.isArray(transformed.Education)) {
    // First, filter out completely empty objects
    transformed.Education = transformed.Education.filter((edu: any) => {
      const hasData = edu.Degree || edu.Institution || 
                     edu.degree || edu.institution ||
                     edu.qualification || edu.school;
      console.log('Education item has data:', hasData, edu);
      return hasData;
    });
    
    // If no valid education items, provide a sample one
    if (transformed.Education.length === 0) {
      console.log('No valid education found, providing sample data');
      transformed.Education = [{
        Degree: "Bachelor's Degree",
        Institution: "University",
        Location: "City, State",
        StartDate: "2016",
        EndDate: "2020",
        GPA: ""
      }];
    }
  }
  
  if (transformed.Certifications && Array.isArray(transformed.Certifications)) {
    transformed.Certifications = transformed.Certifications.filter((cert: any) => 
      cert.Name || cert.Issuer || cert.name || cert.issuer
    );
  }
  
  if (transformed.Projects && Array.isArray(transformed.Projects)) {
    transformed.Projects = transformed.Projects.filter((proj: any) => 
      proj.Name || proj.Description || proj.name || proj.description
    );
  }
  
  // Add lowercase versions for template compatibility
  if (transformed.Achievements) {
    transformed.achievements = transformed.Achievements;
  }
  
  if (transformed.References) {
    // Convert References to lowercase format expected by templates
    transformed.references = transformed.References.map((ref: any) => ({
      name: ref.Name || ref.name || '',
      title: ref.Title || ref.title || '',
      contact: ref.Contact || ref.contact || ''
    }));
  }
  
  // Also add lowercase versions for other fields for template compatibility
  if (transformed.Skills) {
    transformed.skills = transformed.Skills;
  }
  
  if (transformed.Experience) {
    transformed.experience = transformed.Experience.map((exp: any) => ({
      title: exp.Title || exp.title || '',
      company: exp.Company || exp.company || '',
      location: exp.Location || exp.location || '',
      startDate: exp.StartDate || exp.startDate || '',
      endDate: exp.EndDate || exp.endDate || '',
      description: exp.Description || exp.description || ''
    }));
  }
  
  if (transformed.Education) {
    transformed.education = transformed.Education.map((edu: any) => ({
      degree: edu.Degree || edu.degree || '',
      institution: edu.Institution || edu.institution || '',
      location: edu.Location || edu.location || '',
      startDate: edu.StartDate || edu.startDate || '',
      endDate: edu.EndDate || edu.endDate || '',
      gpa: edu.GPA || edu.gpa || ''
    }));
  }
  
  if (transformed.Certifications) {
    transformed.certifications = transformed.Certifications.map((cert: any) => ({
      name: cert.Name || cert.name || '',
      issuer: cert.Issuer || cert.issuer || '',
      date: cert.Date || cert.date || ''
    }));
  }
  
  if (transformed.Projects) {
    transformed.projects = transformed.Projects.map((proj: any) => ({
      name: proj.Name || proj.name || '',
      description: proj.Description || proj.description || '',
      technologies: proj.Technologies || proj.technologies || ''
    }));
  }
  
  // Add basic lowercase fields
  transformed.name = transformed.Name || transformed.name || '';
  transformed.title = transformed.Title || transformed.title || '';
  transformed.email = transformed.Email || transformed.email || '';
  transformed.phone = transformed.Phone || transformed.phone || '';
  transformed.location = transformed.Location || transformed.location || '';
  transformed.linkedin = transformed.LinkedIn || transformed.linkedin || '';
  transformed.website = transformed.Website || transformed.website || '';
  transformed.summary = transformed.Summary || transformed.summary || '';
  transformed.photo = transformed.Photo || transformed.photo || '';
  
  console.log('Final transformed data:', transformed);
  return transformed;
};

// Helper functions for localStorage persistence
const RESUME_DATA_KEY = 'careerbird_resume_builder_data';
const RESUME_PHOTO_KEY = 'careerbird_resume_builder_photo';

const saveResumeDataToStorage = (data: any) => {
  try {
    localStorage.setItem(RESUME_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save resume data to localStorage:', error);
  }
};

const loadResumeDataFromStorage = () => {
  try {
    const saved = localStorage.getItem(RESUME_DATA_KEY);
    if (saved) {
      const parsedData = JSON.parse(saved);
      // Validate that the data has the expected structure
      if (parsedData && typeof parsedData === 'object') {
        return parsedData;
      }
    }
  } catch (error) {
    console.warn('Failed to load resume data from localStorage:', error);
  }
  return null;
};

const savePhotoToStorage = (photoUrl: string) => {
  try {
    localStorage.setItem(RESUME_PHOTO_KEY, photoUrl);
  } catch (error) {
    console.warn('Failed to save photo to localStorage:', error);
  }
};

const loadPhotoFromStorage = () => {
  try {
    return localStorage.getItem(RESUME_PHOTO_KEY) || '';
  } catch (error) {
    console.warn('Failed to load photo from localStorage:', error);
    return '';
  }
};

const ResumeBuilderApp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get('template') || '');
  const [currentStep, setCurrentStep] = useState(selectedTemplate ? 2 : 1);
  
  // Initialize resume data from localStorage if available, otherwise use initialData
  const [resumeData, setResumeData] = useState(() => {
    const savedData = loadResumeDataFromStorage();
    return savedData || initialData;
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [dataSource, setDataSource] = useState('manual'); // 'manual', 'upload', or 'default'
  // Template preview functionality removed - using backend HTML only
  const [hasDefaultResume, setHasDefaultResume] = useState(false);
  const { toast } = useToast();
  const { defaultResume, isLoading } = useResume();
  // Hook for storing template color choices, by template ID
  const [templateColors, setTemplateColors] = useState<{[templateId: string]: string}>({});
  const [lastUsedTemplateId, setLastUsedTemplateId] = useState(""); // Track last used template ID
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Initialize photo preview from localStorage if available
  const [photoPreview, setPhotoPreview] = useState(() => {
    return loadPhotoFromStorage();
  });
  
  const [photoLoading, setPhotoLoading] = useState(false); // Loading state for photo upload

  // Create a wrapper function for setResumeData that also saves to localStorage
  const updateResumeData = (newData: any) => {
    setResumeData(newData);
    saveResumeDataToStorage(newData);
  };

  // Auto-save resume data to localStorage whenever it changes
  useEffect(() => {
    // Only save if the data is not empty (has meaningful content)
    const hasContent = resumeData && (
      resumeData.Name?.trim() || 
      resumeData.Email?.trim() || 
      resumeData.Summary?.trim() ||
      (resumeData.Experience && resumeData.Experience.length > 0 && resumeData.Experience[0].Title?.trim()) ||
      (resumeData.Education && resumeData.Education.length > 0 && resumeData.Education[0].Degree?.trim())
    );
    
    if (hasContent) {
      saveResumeDataToStorage(resumeData);
    }
  }, [resumeData]);

  // Auto-save photo preview to localStorage whenever it changes
  useEffect(() => {
    if (photoPreview) {
      savePhotoToStorage(photoPreview);
    }
  }, [photoPreview]);

  // Initialize color from URL parameters
  useEffect(() => {
    const template = searchParams.get('template');
    const color = searchParams.get('color');
    
    if (template && color) {
      setTemplateColors(prev => ({
        ...prev,
        [template]: decodeURIComponent(color)
      }));
    }
  }, [searchParams]);

  // Note: Template preview functionality removed since we only use backend HTML templates

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setSearchParams({ template: templateId });
    
    // If this is a different template than the last one used, update the lastUsedTemplateId
    if (templateId !== lastUsedTemplateId) {
      setLastUsedTemplateId(templateId);
      
      // Find the template in the templates array
      const template = templates.find(t => t.id === templateId);
      if (template && template.availableColors && template.availableColors.length > 0) {
        // Set the default color for this template if it's not already set
        if (!templateColors[templateId]) {
          handleColorSelect(templateId, template.availableColors[0]);
        }
      }
    }
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

  // Default: use the first color available for each template, or #2196F3 (blue) as fallback.
  useEffect(() => {
    const map: {[templateId: string]: string} = {};
    templates.forEach(temp => {
      map[temp.id] = temp.availableColors?.[0] || "#2196F3";
    });
    setTemplateColors(map);
  }, []);

  // Handler for color selection
  const handleColorSelect = (templateId: string, color: string) => {
    console.log(`Color selected for template ${templateId}: ${color}`);
    setTemplateColors(prev => {
      const newColors = { ...prev, [templateId]: color };
      console.log('Updated template colors:', newColors);
      return newColors;
    });
    // Update the color in the URL search params for preview to pick up
    setSearchParams(prev => ({
      ...Object.fromEntries([...searchParams]),
      template: templateId,
      color: encodeURIComponent(color)
    }));
    // Do NOT auto-generate the resume here; generation should only happen on explicit user action
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
        Photo: data.Photo || data.photo || "",
        Skills: data.Skills || data.skills || [],
        Experience: (data.Experience || data.experience || []).map(exp => ({
          Title: exp.Title || exp.title || "",
          Company: exp.Company || exp.company || "",
          Location: exp.Location || exp.location || "",
          StartDate: exp.StartDate || exp.startDate || "",
          EndDate: exp.EndDate || exp.endDate || "",
          Description: exp.Description || exp.description || ""
        })),
        Education: (data.Education || data.education || []).map(edu => ({
          Degree: edu.Degree || edu.degree || "",
          Institution: edu.Institution || edu.institution || "",
          Location: edu.Location || edu.location || "",
          StartDate: edu.StartDate || edu.startDate || "",
          EndDate: edu.EndDate || edu.endDate || "",
          GPA: edu.GPA || edu.gpa || ""
        })),
        Certifications: (data.Certifications || data.certifications || []).map(cert => ({
          Name: cert.Name || cert.name || "",
          Issuer: cert.Issuer || cert.issuer || "",
          Date: cert.Date || cert.date || ""
        })),
        Projects: (data.Projects || data.projects || []).map(proj => ({
          Name: proj.Name || proj.name || "",
          Description: proj.Description || proj.description || "",
          Technologies: proj.Technologies || proj.technologies || "",
          Link: proj.Link || proj.link || ""
        })),
        Achievements: data.Achievements || data.achievements || [],
        References: (data.References || data.references || []).map(ref => ({
          Name: ref.Name || ref.name || "",
          Title: ref.Title || ref.title || "",
          Contact: ref.Contact || ref.contact || ""
        }))
      };

      updateResumeData(mappedData);
      setHasDefaultResume(true); // Only set to true on success
      console.log('Resume data after extraction:', mappedData);
      console.log('Experience count:', mappedData.Experience?.length || 0);
      console.log('Education count:', mappedData.Education?.length || 0);
      console.log('Skills count:', mappedData.Skills?.length || 0);
      console.log('Certifications count:', mappedData.Certifications?.length || 0);
      
      // Debug: Log the first experience item to see its structure
      if (mappedData.Experience && mappedData.Experience.length > 0) {
        console.log('First experience item structure:', mappedData.Experience[0]);
      }
      
      // Debug: Log the first education item to see its structure
      if (mappedData.Education && mappedData.Education.length > 0) {
        console.log('First education item structure:', mappedData.Education[0]);
      }
      
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
    updateResumeData(prev => ({
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

  // Photo handling functions
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoLoading(true);
      setPhotoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Create an image to ensure it's fully loaded
        const img = new window.Image();
        img.onload = () => {
          setPhotoPreview(result);
          setResumeData(prev => ({ ...prev, Photo: result }));
          setPhotoLoading(false);
        };
        img.onerror = () => {
          toast({
            title: "Image load failed",
            description: "Could not load the selected image.",
            variant: "destructive",
          });
          setPhotoLoading(false);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setResumeData(prev => ({ ...prev, Photo: "" }));
  };

  // Check if current template supports photos
  const currentTemplateSupportsPhoto = () => {
    return PHOTO_SUPPORTED_TEMPLATES.includes(selectedTemplate);
  };

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      // Get the selected color for the template
      const selectedColor = templateColors[selectedTemplate] || "#2196F3";
      
      // Transform resume data to match template expectations and add color
      console.log('=== DEBUGGING RESUME GENERATION ===');
      console.log('Original resume data before transformation:', JSON.stringify(resumeData, null, 2));
      
      // Check specific arrays
      console.log('Experience array:', resumeData.Experience);
      console.log('Education array:', resumeData.Education);
      
      const transformedData = transformDataForTemplate(resumeData);
      console.log('Transformed resume data:', JSON.stringify(transformedData, null, 2));
      
      // Ensure all arrays are properly formatted for Handlebars
      const resumeDataWithColor = {
        ...transformedData,
        Color: selectedColor,
        color: selectedColor
      };
      
      // Double-check that Experience array is properly formatted
      if (resumeDataWithColor.Experience && Array.isArray(resumeDataWithColor.Experience)) {
        console.log('Experience array before sending:', resumeDataWithColor.Experience.map(exp => ({
          Title: exp.Title,
          Company: exp.Company,
          Location: exp.Location,
          StartDate: exp.StartDate,
          EndDate: exp.EndDate,
          Description: exp.Description ? exp.Description.substring(0, 100) + '...' : 'No description'
        })));
      }
      
      // Double-check that Education array is properly formatted
      if (resumeDataWithColor.Education && Array.isArray(resumeDataWithColor.Education)) {
        console.log('Education array before sending:', resumeDataWithColor.Education.map(edu => ({
          Degree: edu.Degree,
          Institution: edu.Institution,
          Location: edu.Location,
          StartDate: edu.StartDate,
          EndDate: edu.EndDate
        })));
      }
      
      // Double-check that Achievements array is properly formatted
      if (resumeDataWithColor.Achievements) {
        console.log('Achievements array before sending:', resumeDataWithColor.Achievements);
      } else {
        console.log('No Achievements found in resume data');
      }
      
      // Double-check that References array is properly formatted
      if (resumeDataWithColor.References && Array.isArray(resumeDataWithColor.References)) {
        console.log('References array before sending:', resumeDataWithColor.References.map(ref => ({
          Name: ref.Name,
          Title: ref.Title,
          Contact: ref.Contact
        })));
      } else {
        console.log('No References found in resume data');
      }
      
      console.log(`Generating resume with template: ${selectedTemplate}, color: ${selectedColor}`);
      console.log('Final resume data being sent to backend:', resumeDataWithColor);
      
      // Test JSON parsing to make sure it's valid
      const jsonString = JSON.stringify(resumeDataWithColor);
      console.log('JSON string being sent (length):', jsonString.length);
      console.log('JSON string being sent:', jsonString);
      
      // Test if we can parse it back
      try {
        const parsed = JSON.parse(jsonString);
        console.log('JSON parsing test successful. Experience count:', parsed.Experience?.length);
        console.log('First experience item:', parsed.Experience?.[0]);
        
        // Detailed analysis of what's being sent
        console.log('=== DETAILED DATA ANALYSIS BEFORE API CALL ===');
        console.log('Experience array details:');
        if (parsed.Experience && Array.isArray(parsed.Experience)) {
          parsed.Experience.forEach((exp, index) => {
            console.log(`  Experience ${index}:`, {
              Title: exp.Title,
              Company: exp.Company,
              Description: exp.Description,
              StartDate: exp.StartDate,
              EndDate: exp.EndDate,
              isEmpty: !exp.Title && !exp.Company && !exp.Description
            });
          });
        } else {
          console.log('  No Experience array or not an array');
        }
        
        console.log('Education array details:');
        if (parsed.Education && Array.isArray(parsed.Education)) {
          parsed.Education.forEach((edu, index) => {
            console.log(`  Education ${index}:`, {
              Degree: edu.Degree,
              Institution: edu.Institution,
              StartDate: edu.StartDate,
              EndDate: edu.EndDate,
              isEmpty: !edu.Degree && !edu.Institution
            });
          });
        } else {
          console.log('  No Education array or not an array');
        }
        
        console.log('Achievements details:');
        if (parsed.Achievements) {
          console.log('  Achievements:', parsed.Achievements);
          console.log('  Achievements type:', typeof parsed.Achievements);
          console.log('  Achievements is array:', Array.isArray(parsed.Achievements));
          console.log('  Achievements length:', parsed.Achievements.length);
        } else {
          console.log('  No Achievements found');
        }
        
        console.log('References details:');
        if (parsed.References && Array.isArray(parsed.References)) {
          parsed.References.forEach((ref, index) => {
            console.log(`  Reference ${index}:`, {
              Name: ref.Name,
              Title: ref.Title,
              Contact: ref.Contact,
              isEmpty: !ref.Name && !ref.Title && !ref.Contact
            });
          });
        } else {
          console.log('  No References array or not an array');
        }
        
      } catch (e) {
        console.error('JSON parsing test failed:', e);
      }
      
      // Use apiClient instead of resumeBuilderApi for consistency
      console.log('=== MAKING API CALL TO BACKEND ===');
      console.log('API Call Parameters:');
      console.log('- resumeData (first 500 chars):', jsonString.substring(0, 500));
      console.log('- templateId:', selectedTemplate);
      console.log('- color:', selectedColor);
      
      console.log('=== BUILDING RESUME WITH USER DATA ===');
      console.log('JSON string being sent (first 1000 chars):', jsonString.substring(0, 1000));
      
      // Let's also try parsing the JSON to see what we're sending
      try {
        const parsedJson = JSON.parse(jsonString);
        console.log('Parsed JSON structure:');
        console.log('- Name:', parsedJson.Name || parsedJson.name);
        console.log('- Title:', parsedJson.Title || parsedJson.title);
        console.log('- Experience count:', Array.isArray(parsedJson.Experience) ? parsedJson.Experience.length : (Array.isArray(parsedJson.experience) ? parsedJson.experience.length : 0));
        console.log('- Education count:', Array.isArray(parsedJson.Education) ? parsedJson.Education.length : (Array.isArray(parsedJson.education) ? parsedJson.education.length : 0));
        if (parsedJson.Experience && parsedJson.Experience[0]) {
          console.log('- First Experience:', parsedJson.Experience[0]);
        }
        if (parsedJson.experience && parsedJson.experience[0]) {
          console.log('- First experience:', parsedJson.experience[0]);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
      
      const result = await resumeBuilderApi.buildResume({
        resumeData: jsonString,
        templateId: selectedTemplate, // Use selected template for now
        color: selectedColor
      });
      
      // For comparison, let's also try the new apiClient (commented out for now)
      /*
      const result = await apiClient.resumeBuilder.buildResume({
        resumeData: jsonString,
        templateId: selectedTemplate,
        color: selectedColor // Also pass as separate parameter for backward compatibility
      });
      */
      
      console.log('=== BACKEND RESPONSE RECEIVED ===');
      console.log('Response data keys:', Object.keys(result.data || {}));
      if (result.data?.html) {
        console.log('Response HTML length:', result.data.html.length);
        console.log('Response HTML preview (first 500 chars):', result.data.html.substring(0, 500));
      }

      console.log('Resume generation result:', result);
      console.log('Backend response type:', typeof result);
      
      // Get the actual data content for length calculation
      const dataContent = result?.data;
      let contentLength = 'N/A';
      if (typeof dataContent === 'string') {
        contentLength = dataContent.length.toString();
      } else if (dataContent && typeof dataContent === 'object' && dataContent.html) {
        contentLength = dataContent.html.length.toString();
      }
      console.log('Backend response length:', contentLength);
      
      // Check if the result contains our data
      if (typeof dataContent === 'string') {
        console.log('Checking if result contains experience data...');
        console.log('Contains "Cloud Architect":', dataContent.includes('Cloud Architect'));
        console.log('Contains "Cognizant":', dataContent.includes('Cognizant'));
        console.log('Contains empty employment entries:', dataContent.includes('employment-history-role">, <span'));
      } else if (dataContent && typeof dataContent === 'object' && dataContent.html) {
        console.log('Checking if HTML result contains experience data...');
        console.log('Contains "Cloud Architect":', dataContent.html.includes('Cloud Architect'));
        console.log('Contains "Cognizant":', dataContent.html.includes('Cognizant'));
        console.log('Contains empty employment entries:', dataContent.html.includes('employment-history-role">, <span'));
      }

      if (result.error) {
        toast({
          title: "Generation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.data?.html) {
        // Log the data being passed to preview
        console.log('=== NAVIGATING TO PREVIEW ===');
        console.log('Template:', selectedTemplate);
        console.log('Resume data being passed to preview:', resumeData);
        console.log('Resume data Experience array:', resumeData.Experience);
        console.log('Resume data Education array:', resumeData.Education);
        console.log('Backend HTML length:', result.data.html.length);
        console.log('Backend HTML preview (first 500 chars):', result.data.html.substring(0, 500));
        
        // Navigate to preview page with the generated HTML and data
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData)),
          html: encodeURIComponent(result.data.html), // Pass the HTML from the backend
          color: encodeURIComponent(selectedColor) // Pass the selected color
        });
        
        console.log('URL params being created:');
        console.log('- template:', selectedTemplate);
        console.log('- color:', selectedColor);
        console.log('- data (encoded):', encodeURIComponent(JSON.stringify(resumeData)));
        console.log('- html (encoded length):', encodeURIComponent(result.data.html).length);
        
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
      // Get the selected color for the template
      const selectedColor = templateColors[selectedTemplate] || "#2196F3";
      
      // Transform resume data to match template expectations and add color
      const transformedData = transformDataForTemplate(resumeData);
      const resumeDataWithColor = {
        ...transformedData,
        Color: selectedColor,
        color: selectedColor
      };
      
      console.log(`Generating AI-enhanced resume with template: ${selectedTemplate}, color: ${selectedColor}`);
      
      // TEMPORARY: Call AI-enhanced resume generation using old resumeBuilderApi
      const result = await resumeBuilderApi.buildResume({
        resumeData: JSON.stringify(resumeDataWithColor),
        templateId: selectedTemplate,
        color: selectedColor, // Pass color as separate parameter
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
        // Log the data being passed to preview
        console.log('=== NAVIGATING TO AI PREVIEW ===');
        console.log('Template:', selectedTemplate);
        console.log('Resume data being passed to AI preview:', resumeData);
        console.log('Resume data Experience array:', resumeData.Experience);
        console.log('Resume data Education array:', resumeData.Education);
        console.log('Backend AI HTML length:', result.data.html.length);
        console.log('Backend AI HTML preview (first 500 chars):', result.data.html.substring(0, 500));
        
        // Navigate to preview page with the generated HTML and data
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData)),
          html: encodeURIComponent(result.data.html), // Pass the HTML from the backend
          color: encodeURIComponent(selectedColor), // Pass the selected color
          aiEnhanced: 'true'
        });
        
        console.log('AI URL params being created:');
        console.log('- template:', selectedTemplate);
        console.log('- color:', selectedColor);
        console.log('- data (encoded):', encodeURIComponent(JSON.stringify(resumeData)));
        console.log('- html (encoded length):', encodeURIComponent(result.data.html).length);
        console.log('- aiEnhanced: true');
        
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
      // Get the selected color for the template
      const selectedColor = templateColors[selectedTemplate] || "#2196F3";
      
      // Transform resume data to match template expectations and add color
      const transformedData = transformDataForTemplate(resumeData);
      const resumeDataWithColor = {
        ...transformedData,
        Color: selectedColor,
        color: selectedColor
      };
      
      console.log(`Generating premium AI-enhanced resume with template: ${selectedTemplate}, color: ${selectedColor}`);
      
      // TEMPORARY: Call premium AI-enhanced resume generation using old resumeBuilderApi
      const result = await resumeBuilderApi.buildResume({
        resumeData: JSON.stringify(resumeDataWithColor),
        templateId: selectedTemplate,
        color: selectedColor,
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
        // Log the data being passed to preview
        console.log('=== NAVIGATING TO PREMIUM AI PREVIEW ===');
        console.log('Template:', selectedTemplate);
        console.log('Resume data being passed to premium AI preview:', resumeData);
        console.log('Resume data Experience array:', resumeData.Experience);
        console.log('Resume data Education array:', resumeData.Education);
        console.log('Backend Premium AI HTML length:', result.data.html.length);
        console.log('Backend Premium AI HTML preview (first 500 chars):', result.data.html.substring(0, 500));
        
        // Navigate to preview page with the generated HTML and data
        const params = new URLSearchParams({
          template: selectedTemplate,
          data: encodeURIComponent(JSON.stringify(resumeData)),
          html: encodeURIComponent(result.data.html), // Pass the HTML from the backend
          color: encodeURIComponent(selectedColor), // Pass the selected color
          aiEnhanced: 'true',
          premium: 'true'
        });
        
        console.log('Premium AI URL params being created:');
        console.log('- template:', selectedTemplate);
        console.log('- color:', selectedColor);
        console.log('- data (encoded):', encodeURIComponent(JSON.stringify(resumeData)));
        console.log('- html (encoded length):', encodeURIComponent(result.data.html).length);
        console.log('- aiEnhanced: true');
        console.log('- premium: true');
        
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
                        ? "ring-4 ring-blue-600 shadow-2xl selected-template-box"
                        : "hover:ring-2 hover:ring-blue-400 hover:shadow-xl unselected-template-box"
                      }
                      bg-white rounded-xl p-4
                      w-[345px] md:w-[350px] lg:w-[370px] xl:w-[390px]
                      min-h-[600px]
                    `}
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
                    {/* Color picker below template */}
                    <TemplateColorPicker
                      colors={template.availableColors}
                      selectedColor={templateColors[template.id] || template.availableColors?.[0] || "#2196F3"}
                      onColorSelect={(color) => handleColorSelect(template.id, color)}
                    />
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
                  {/* Debug info - remove in production */}
                  <div className="text-sm text-gray-500 mt-2">
                    Data Status: Personal ✓ | Experience ({resumeData.Experience?.length || 0}) | Education ({resumeData.Education?.length || 0}) | Skills ({resumeData.Skills?.length || 0}) | Projects ({resumeData.Projects?.length || 0}) | Certifications ({resumeData.Certifications?.length || 0})
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <details>
                      <summary className="cursor-pointer">Click to view detailed data</summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div><strong>Experience:</strong> {JSON.stringify(resumeData.Experience, null, 2)}</div>
                        <div className="mt-2"><strong>Education:</strong> {JSON.stringify(resumeData.Education, null, 2)}</div>
                      </div>
                    </details>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="personal">
                        Personal
                        {(resumeData.Name || resumeData.Email || resumeData.Phone) && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">✓</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="experience">
                        Experience
                        {resumeData.Experience && resumeData.Experience.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{resumeData.Experience.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="education">
                        Education
                        {resumeData.Education && resumeData.Education.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{resumeData.Education.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="skills">
                        Skills
                        {resumeData.Skills && resumeData.Skills.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{resumeData.Skills.length}</Badge>
                        )}
                      </TabsTrigger>

                      <TabsTrigger value="other">
                        Other
                        {((resumeData.Certifications && resumeData.Certifications.length > 0) || 
                          (resumeData.Achievements && resumeData.Achievements.length > 0) || 
                          (resumeData.References && resumeData.References.length > 0)) && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                            {(resumeData.Certifications?.length || 0) + (resumeData.Achievements?.length || 0) + (resumeData.References?.length || 0)}
                          </Badge>
                        )}
                      </TabsTrigger>
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
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            placeholder="Enter your website"
                            value={resumeData.Website}
                            onChange={(e) => setResumeData(prev => ({ ...prev, Website: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Photo Upload Section - Only show for supported templates */}
                      {currentTemplateSupportsPhoto() && (
                        <div className="space-y-2">
                          <Label>Profile Photo (Optional)</Label>
                          <div className="flex items-center space-x-4">
                            {photoLoading ? (
                              <div className="w-20 h-20 flex items-center justify-center">
                                <span className="text-xs text-gray-500">Loading...</span>
                              </div>
                            ) : photoPreview ? (
                              <div className="relative">
                                <img
                                  src={photoPreview}
                                  alt="Profile preview"
                                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  onClick={removePhoto}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Camera className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                                title="Upload your profile photo"
                                placeholder="Choose a profile photo"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('photo-upload')?.click()}
                                className="w-full"
                                disabled={photoLoading}
                              >
                                <Image className="h-4 w-4 mr-2" />
                                {photoPreview ? 'Change Photo' : 'Upload Photo'}
                              </Button>
                              <p className="text-xs text-gray-500 mt-1">
                                Recommended: Square image, max 5MB (JPG, PNG)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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
                          
                          {/* Projects section for this experience */}
                          <div className="mt-4 border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700">Projects (Optional)</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updatedExp = {
                                    ...exp,
                                    Projects: [...(exp.Projects || []), { Name: "", Description: "", Technologies: "" }]
                                  };
                                  updateArrayItem('Experience', index, updatedExp);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Project
                              </Button>
                            </div>
                            
                            {exp.Projects && exp.Projects.length > 0 && (
                              <div className="space-y-3">
                                {exp.Projects.map((project, projectIndex) => (
                                  <div key={projectIndex} className="bg-gray-50 rounded-md p-3 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <Label htmlFor={`exp-${index}-project-${projectIndex}-name`} className="text-xs">Project Name</Label>
                                        <Input
                                          id={`exp-${index}-project-${projectIndex}-name`}
                                          placeholder="Enter project name"
                                          value={project.Name}
                                          onChange={(e) => {
                                            const updatedProjects = [...exp.Projects];
                                            updatedProjects[projectIndex] = { ...project, Name: e.target.value };
                                            const updatedExp = { ...exp, Projects: updatedProjects };
                                            updateArrayItem('Experience', index, updatedExp);
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`exp-${index}-project-${projectIndex}-technologies`} className="text-xs">Technologies</Label>
                                        <Input
                                          id={`exp-${index}-project-${projectIndex}-technologies`}
                                          placeholder="Enter technologies used"
                                          value={project.Technologies}
                                          onChange={(e) => {
                                            const updatedProjects = [...exp.Projects];
                                            updatedProjects[projectIndex] = { ...project, Technologies: e.target.value };
                                            const updatedExp = { ...exp, Projects: updatedProjects };
                                            updateArrayItem('Experience', index, updatedExp);
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor={`exp-${index}-project-${projectIndex}-description`} className="text-xs">Project Description</Label>
                                      <Textarea
                                        id={`exp-${index}-project-${projectIndex}-description`}
                                        placeholder="Enter project description"
                                        value={project.Description}
                                        onChange={(e) => {
                                          const updatedProjects = [...exp.Projects];
                                          updatedProjects[projectIndex] = { ...project, Description: e.target.value };
                                          const updatedExp = { ...exp, Projects: updatedProjects };
                                          updateArrayItem('Experience', index, updatedExp);
                                        }}
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updatedProjects = exp.Projects.filter((_, i) => i !== projectIndex);
                                        const updatedExp = { ...exp, Projects: updatedProjects };
                                        updateArrayItem('Experience', index, updatedExp);
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Remove Project
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(!exp.Projects || exp.Projects.length === 0) && (
                              <p className="text-xs text-gray-500 italic">No projects added yet. Click "Add Project" to add projects for this experience.</p>
                            )}
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeArrayItem('Experience', index)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Experience
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
                          Description: "",
                          Projects: []
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
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Certifications</h3>
                        {resumeData.Certifications.map((cert, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`cert-${index}-name`}>Certification Name</Label>
                                <Input
                                  id={`cert-${index}-name`}
                                  placeholder="Enter certification name"
                                  value={cert.Name}
                                  onChange={(e) => updateArrayItem('Certifications', index, { ...cert, Name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`cert-${index}-issuer`}>Issuing Organization</Label>
                                <Input
                                  id={`cert-${index}-issuer`}
                                  placeholder="Enter issuing organization"
                                  value={cert.Issuer}
                                  onChange={(e) => updateArrayItem('Certifications', index, { ...cert, Issuer: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`cert-${index}-date`}>Date Obtained</Label>
                                <Input
                                  id={`cert-${index}-date`}
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

                        <Separator className="my-6" />

                        <h3 className="text-lg font-semibold">Achievements</h3>
                        {resumeData.Achievements.map((achievement, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <Label htmlFor={`achievement-${index}`}>Achievement</Label>
                                <Textarea
                                  id={`achievement-${index}`}
                                  placeholder="Enter your achievement or accomplishment"
                                  value={achievement}
                                  onChange={(e) => {
                                    const newAchievements = [...resumeData.Achievements];
                                    newAchievements[index] = e.target.value;
                                    setResumeData(prev => ({ ...prev, Achievements: newAchievements }));
                                  }}
                                  rows={2}
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newAchievements = resumeData.Achievements.filter((_, i) => i !== index);
                                  setResumeData(prev => ({ ...prev, Achievements: newAchievements }));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setResumeData(prev => ({ 
                              ...prev, 
                              Achievements: [...prev.Achievements, ""] 
                            }));
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>

                        <Separator className="my-6" />

                        <h3 className="text-lg font-semibold">References</h3>
                        {resumeData.References.map((reference, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`ref-${index}-name`}>Full Name</Label>
                                <Input
                                  id={`ref-${index}-name`}
                                  placeholder="Enter reference's full name"
                                  value={reference.Name}
                                  onChange={(e) => updateArrayItem('References', index, { ...reference, Name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`ref-${index}-title`}>Job Title</Label>
                                <Input
                                  id={`ref-${index}-title`}
                                  placeholder="Enter reference's job title"
                                  value={reference.Title}
                                  onChange={(e) => updateArrayItem('References', index, { ...reference, Title: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`ref-${index}-contact`}>Contact Information</Label>
                                <Input
                                  id={`ref-${index}-contact`}
                                  placeholder="Enter email or phone number"
                                  value={reference.Contact}
                                  onChange={(e) => updateArrayItem('References', index, { ...reference, Contact: e.target.value })}
                                />
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeArrayItem('References', index)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          onClick={() => addArrayItem('References', {
                            Name: "",
                            Title: "",
                            Contact: ""
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Reference
                        </Button>
                      </div>
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

            {/* Error message for default template usage */}
            {lastUsedTemplateId === DEFAULT_TEMPLATE_ID && (
              <div className="text-red-600 font-semibold mb-2">
                Resume generated using the default template. Template selection failed.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderApp;
