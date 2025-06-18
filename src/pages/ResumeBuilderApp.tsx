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
import TemplateColorPicker from "@/components/resume/TemplateColorPicker";
import styles from './ResumeBuilderApp.module.css';

// Template data for step 1
const templates = [
  {
    id: "navy-column-modern",
    name: "Navy Column Modern",
    description: "Professional layout with navy sidebar and clean white content area",
    thumbnail: "/lovable-uploads/111bb875-e937-4ebf-8470-bc9c0fd0e801.png",
    category: "professional",
    color: "navy",
    availableColors: ["#a4814c", "#18bc6b", "#2196F3", "#ff1e1e", "#000"],
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
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"],
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
    availableColors: ["#2196F3", "#ff1e1e", "#000", "#18bc6b", "#a4814c"],
    isPremium: true
  },
  {
    id: "tech-minimalist",
    name: "Tech Minimalist",
    description: "Clean, minimal design for tech professionals",
    thumbnail: "/resume-templates/thumbnails/tech.PNG",
    category: "tech",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#000", "#a4814c", "#ff1e1e"]
  },
  {
    id: "academic-scholar",
    name: "Academic Scholar",
    description: "Traditional format for researchers",
    thumbnail: "/resume-templates/thumbnails/academic.PNG",
    category: "academic",
    color: "gray",
    isRecommended: true,
    availableColors: ["#a4814c", "#2196F3", "#18bc6b", "#ff1e1e", "#000"]
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description: "Dynamic layout for entrepreneurs",
    thumbnail: "/resume-templates/thumbnails/professional.png",
    category: "professional",
    color: "orange",
    isPremium: true,
    availableColors: ["#ff1e1e", "#18bc6b", "#2196F3", "#000", "#a4814c"]
  },
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description: "Perfect for new graduates and entry-level positions",
    thumbnail: "/resume-templates/thumbnails/entry-level.PNG",
    category: "entry-level",
    color: "teal",
    isPopular: true,
    isRecommended: true,
    availableColors: ["#2196F3", "#18bc6b", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "grey-classic-profile",
    name: "Grey Classic Profile",
    description: "Elegant and clear template with sidebar and modern layout",
    thumbnail: "/lovable-uploads/2d518c3a-cd43-4fb4-b391-8729c98e1479.png",
    category: "classic",
    color: "gray",
    isRecommended: false,
    isNew: true,
    availableColors: ["#000", "#2196F3", "#18bc6b", "#ff1e1e", "#a4814c"]
  },
  {
    id: "blue-sidebar-profile",
    name: "Blue Sidebar Profile",
    description: "Elegant template with left sidebar and section dividers, matching classic professional format.",
    thumbnail: "/lovable-uploads/502adb7a-83b3-4ebe-a1c2-6450915f1ed0.png",
    category: "classic",
    color: "blue",
    isNew: true,
    availableColors: ["#2196F3", "#18bc6b", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "green-sidebar-receptionist",
    name: "Green Sidebar Receptionist",
    description: "Fresh and approachable sidebar template matching receptionist roles",
    thumbnail: "/lovable-uploads/e72aeeac-84f9-493e-85af-c1994a03dc55.png",
    category: "classic",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "classic-profile-orange",
    name: "Classic Profile Orange",
    description: "Elegant resume with orange name, clean sidebar and modern readable content.",
    thumbnail: "/lovable-uploads/aefc4f9a-f33d-406b-a191-f7aae767471d.png",
    category: "classic",
    color: "orange",
    isNew: true,
    availableColors: ["#a4814c", "#18bc6b", "#2196F3", "#ff1e1e", "#000"]
  },
  {
    id: "classic-law-bw",
    name: "Classic Law Black & White",
    description: "Traditional black & white legal resume with section dividers and simple typographic elegance.",
    thumbnail: "/lovable-uploads/411cd4d2-9f96-4fa4-abaf-60b6828225fb.png",
    category: "classic",
    color: "gray",
    isNew: true,
    availableColors: ["#000", "#a4814c", "#18bc6b", "#2196F3", "#ff1e1e"]
  },
  {
    id: "green-sidebar-customer-service",
    name: "Green Sidebar Customer Service",
    description: "Modern customer service resume with a green sidebar and clean layout",
    thumbnail: "/lovable-uploads/4fcd8e16-5fb8-46bf-876e-def35b427c45.png",
    category: "classic",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"]
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

const DEFAULT_TEMPLATE_ID = "default-template"; // Use your actual default template ID

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
    'skills': 'Skills',
    'experience': 'Experience',
    'education': 'Education',
    'certifications': 'Certifications',
    'projects': 'Projects'
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
            Description: exp.Description || exp.description || exp.responsibilities || exp.duties || ''
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
        Description: "Developed and maintained software applications using modern technologies."
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
  
  console.log('Final transformed data:', transformed);
  return transformed;
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
  // Hook for storing template color choices, by template ID
  const [templateColors, setTemplateColors] = useState<{[templateId: string]: string}>({});
  const [lastUsedTemplateId, setLastUsedTemplateId] = useState(""); // Track last used template ID

  // Load sample resume data for preview
  useEffect(() => {
    if (showPreview && !sampleResumeData) {
      fetch('/resume-templates/sample-data.json')
        .then(res => res.json())
        .then(data => setSampleResumeData(data))
        .catch(() => setSampleResumeData(null));
    }
  }, [showPreview, sampleResumeData]);

  // Fetch template HTML from backend API
  useEffect(() => {
    if (showPreview && previewTemplate) {
      const loadTemplate = async () => {
        try {
          console.log(`Fetching template from public folder: /resume-templates/html/${previewTemplate}.html`);
          // Fetch template HTML from public folder
          const response = await fetch(`/resume-templates/html/${previewTemplate}.html`);
          
          if (!response.ok) {
            console.error(`Failed to fetch template: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch template: ${response.status}`);
          }
          
          const html = await response.text();
          console.log(`Template HTML fetched successfully, length: ${html.length} bytes`);
          
          // Get the selected color for the template
          const selectedColor = templateColors[previewTemplate] || "#2196F3";
          console.log(`Using color for preview: ${selectedColor}`);
          
          // Use sample data for preview
          let dataForPreview = useSampleData && sampleResumeData ? { ...sampleResumeData } : { ...resumeData };
          
          console.log('Preview data before transformation:', dataForPreview);
          
          // Transform data to match template expectations
          dataForPreview = transformDataForTemplate(dataForPreview);
          
          console.log('Preview data after transformation:', dataForPreview);
          
          // Add the color to the preview data
          dataForPreview.Color = selectedColor;
          
          // Compile the template with Handlebars
          try {
            const compiled = Handlebars.compile(html)(dataForPreview);
            setTemplateHtml(compiled);
          } catch (compileError) {
            console.error('Error compiling template with Handlebars:', compileError);
            setTemplateHtml(`<p>Error compiling template: ${compileError.message}</p><pre>${html}</pre>`);
          }
        } catch (error) {
          console.error('Error loading template:', error);
          setTemplateHtml(`<p>Failed to load template from backend: ${error.message}</p>`);
        }
      };
      loadTemplate();
    }
  }, [showPreview, previewTemplate, resumeData, sampleResumeData, useSampleData, templateColors]);

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
        }))
      };

      setResumeData(mappedData);
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
        
      } catch (e) {
        console.error('JSON parsing test failed:', e);
      }
      
      // Use apiClient instead of resumeBuilderApi for consistency
      console.log('=== MAKING API CALL TO BACKEND ===');
      console.log('API Call Parameters:');
      console.log('- resumeData (first 500 chars):', jsonString.substring(0, 500));
      console.log('- templateId:', selectedTemplate);
      console.log('- color:', selectedColor);
      
      // Let's also try with a simple test data to see if the issue is with our data structure
      const testData = {
        Name: "Test Name",
        Title: "Test Title",
        Email: "test@example.com",
        Phone: "123-456-7890",
        Location: "Test City",
        Summary: "Test summary",
        Experience: [
          {
            Title: "Test Job Title",
            Company: "Test Company",
            Location: "Test Location",
            StartDate: "2020",
            EndDate: "2023",
            Description: "Test job description"
          }
        ],
        Education: [
          {
            Degree: "Test Degree",
            Institution: "Test University",
            Location: "Test City",
            StartDate: "2016",
            EndDate: "2020"
          }
        ],
        Skills: ["Test Skill 1", "Test Skill 2"],
        Color: selectedColor
      };
      
      const testJsonString = JSON.stringify(testData);
      console.log('=== TESTING WITH SIMPLE DATA ===');
      console.log('Test data:', testData);
      console.log('Test JSON string:', testJsonString);
      
      // TEMPORARY: Let's test with the old resumeBuilderApi to see if it works
      console.log('=== TESTING WITH OLD RESUME BUILDER API ===');
      console.log('Selected template:', selectedTemplate);
      console.log('Available templates:', templates.map(t => t.id));
      
      // Let's also try with a different template to see if it's template-specific
      const testTemplate = 'modern-executive'; // Try a different template
      console.log('Testing with template:', testTemplate);
      
      // Let's try with both the original data and simple test data
      console.log('=== TRYING WITH SIMPLE TEST DATA FIRST ===');
      const testResult = await resumeBuilderApi.buildResume({
        resumeData: testJsonString,
        templateId: selectedTemplate,
        color: selectedColor
      });
      
      if (testResult.data?.html) {
        console.log('TEST RESULT - HTML contains "Test Job Title":', testResult.data.html.includes('Test Job Title'));
        console.log('TEST RESULT - HTML contains "Test Company":', testResult.data.html.includes('Test Company'));
        console.log('TEST RESULT - HTML contains "Test Degree":', testResult.data.html.includes('Test Degree'));
      }
      
      console.log('=== NOW TRYING WITH ORIGINAL DATA ===');
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
          html: encodeURIComponent(result.data.html) // Pass the HTML from the backend
        });
        
        console.log('URL params being created:');
        console.log('- template:', selectedTemplate);
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
          aiEnhanced: 'true'
        });
        
        console.log('AI URL params being created:');
        console.log('- template:', selectedTemplate);
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
          aiEnhanced: 'true',
          premium: 'true'
        });
        
        console.log('Premium AI URL params being created:');
        console.log('- template:', selectedTemplate);
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
                      <TabsTrigger value="projects">
                        Projects
                        {resumeData.Projects && resumeData.Projects.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{resumeData.Projects.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="other">
                        Other
                        {resumeData.Certifications && resumeData.Certifications.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{resumeData.Certifications.length}</Badge>
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
