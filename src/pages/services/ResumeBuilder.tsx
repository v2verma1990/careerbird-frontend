import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Eye, ArrowRight, Star, Crown, Sparkles, Palette, X } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  color: string;
  isPremium?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isRecommended?: boolean;
}

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>("");
  const [sampleData, setSampleData] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState<string>("");

  // Load sample data
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        const response = await fetch('/resume-templates/sample-data.json');
        const data = await response.json();
        setSampleData(data);
        console.log('Sample data loaded:', data);
      } catch (error) {
        console.error('Failed to load sample data:', error);
      }
    };
    loadSampleData();
  }, []);

  // Function to compile Handlebars-like templates with sample data
  const compileTemplate = (html: string, data: any) => {
    if (!data || !html) return html;

    let compiledHtml = html;

    try {
      // Replace simple variables like {{name}}, {{title}}, etc.
      compiledHtml = compiledHtml
        .replace(/\{\{name\}\}/g, data.name || '')
        .replace(/\{\{title\}\}/g, data.title || '')
        .replace(/\{\{email\}\}/g, data.email || '')
        .replace(/\{\{phone\}\}/g, data.phone || '')
        .replace(/\{\{location\}\}/g, data.location || '')
        .replace(/\{\{linkedin\}\}/g, data.linkedin || '')
        .replace(/\{\{website\}\}/g, data.website || '')
        .replace(/\{\{summary\}\}/g, data.summary || '');

      // Handle experience section with #each
      if (data.experience && data.experience.length > 0) {
        // Replace experience loop
        const experienceRegex = /\{\{#each experience\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(experienceRegex, (match, template) => {
          return data.experience.map((exp: any) => {
            return template
              .replace(/\{\{title\}\}/g, exp.title || '')
              .replace(/\{\{company\}\}/g, exp.company || '')
              .replace(/\{\{location\}\}/g, exp.location || '')
              .replace(/\{\{startDate\}\}/g, exp.startDate || '')
              .replace(/\{\{endDate\}\}/g, exp.endDate || '')
              .replace(/\{\{description\}\}/g, exp.description || '');
          }).join('');
        });

        // Replace individual experience fields for first experience
        const firstExp = data.experience[0];
        compiledHtml = compiledHtml
          .replace(/\{\{experience\.title\}\}/g, firstExp.title || '')
          .replace(/\{\{experience\.company\}\}/g, firstExp.company || '')
          .replace(/\{\{experience\.location\}\}/g, firstExp.location || '')
          .replace(/\{\{experience\.startDate\}\}/g, firstExp.startDate || '')
          .replace(/\{\{experience\.endDate\}\}/g, firstExp.endDate || '')
          .replace(/\{\{experience\.description\}\}/g, firstExp.description || '');
      }

      // Handle education section
      if (data.education && data.education.length > 0) {
        const educationRegex = /\{\{#each education\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(educationRegex, (match, template) => {
          return data.education.map((edu: any) => {
            return template
              .replace(/\{\{degree\}\}/g, edu.degree || '')
              .replace(/\{\{institution\}\}/g, edu.institution || '')
              .replace(/\{\{location\}\}/g, edu.location || '')
              .replace(/\{\{startDate\}\}/g, edu.startDate || '')
              .replace(/\{\{endDate\}\}/g, edu.endDate || '')
              .replace(/\{\{description\}\}/g, edu.description || '');
          }).join('');
        });

        // Replace individual education fields for first education
        const firstEdu = data.education[0];
        compiledHtml = compiledHtml
          .replace(/\{\{education\.degree\}\}/g, firstEdu.degree || '')
          .replace(/\{\{education\.institution\}\}/g, firstEdu.institution || '')
          .replace(/\{\{education\.location\}\}/g, firstEdu.location || '')
          .replace(/\{\{education\.startDate\}\}/g, firstEdu.startDate || '')
          .replace(/\{\{education\.endDate\}\}/g, firstEdu.endDate || '');
      }

      // Handle skills section
      if (data.skills && data.skills.length > 0) {
        const skillsRegex = /\{\{#each skills\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(skillsRegex, (match, template) => {
          return data.skills.map((skill: string) => {
            return template.replace(/\{\{this\}\}/g, skill).replace(/\{\{\.}\}/g, skill);
          }).join('');
        });

        // Replace skills as comma-separated list
        compiledHtml = compiledHtml.replace(/\{\{skills\}\}/g, data.skills.join(', '));
      }

      // Handle certifications
      if (data.certifications && data.certifications.length > 0) {
        const certificationsRegex = /\{\{#each certifications\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(certificationsRegex, (match, template) => {
          return data.certifications.map((cert: any) => {
            return template
              .replace(/\{\{name\}\}/g, cert.name || '')
              .replace(/\{\{issuer\}\}/g, cert.issuer || '')
              .replace(/\{\{date\}\}/g, cert.date || '');
          }).join('');
        });
      }

      // Handle projects
      if (data.projects && data.projects.length > 0) {
        const projectsRegex = /\{\{#each projects\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(projectsRegex, (match, template) => {
          return data.projects.map((project: any) => {
            return template
              .replace(/\{\{name\}\}/g, project.name || '')
              .replace(/\{\{date\}\}/g, project.date || '')
              .replace(/\{\{description\}\}/g, project.description || '');
          }).join('');
        });
      }

      // Clean up any remaining Handlebars expressions
      compiledHtml = compiledHtml
        .replace(/\{\{#if[^}]*\}\}/g, '')
        .replace(/\{\{\/if\}\}/g, '')
        .replace(/\{\{#unless[^}]*\}\}/g, '')
        .replace(/\{\{\/unless\}\}/g, '')
        .replace(/\{\{#each[^}]*\}\}/g, '')
        .replace(/\{\{\/each\}\}/g, '')
        .replace(/\{\{[^}]*\}\}/g, ''); // Remove any remaining placeholders

      console.log('Template compiled successfully');
      return compiledHtml;
    } catch (error) {
      console.error('Error compiling template:', error);
      return html;
    }
  };

  // Load and compile template HTML when preview is opened
  useEffect(() => {
    if (showPreview && previewTemplate && sampleData) {
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/resume-templates/html/${previewTemplate}.html`);
          const html = await response.text();
          const compiledHtml = compileTemplate(html, sampleData);
          setTemplateHtml(compiledHtml);
          console.log('Template loaded and compiled');
        } catch (error) {
          console.error('Failed to load template:', error);
          setTemplateHtml('<p>Failed to load template</p>');
        }
      };
      loadTemplate();
    }
  }, [showPreview, previewTemplate, sampleData]);

  const templates: Template[] = [
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
      id: "marketing-pro",
      name: "Marketing Pro",
      description: "Vibrant design for marketing professionals",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative",
      color: "pink"
    },
    {
      id: "finance-expert",
      name: "Finance Expert",
      description: "Conservative design for finance professionals",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional",
      color: "navy"
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
      id: "elegant",
      name: "Elegant",
      description: "Sophisticated design for experienced professionals",
      thumbnail: "/resume-templates/thumbnails/elegant.PNG",
      category: "professional",
      color: "brown"
    },
    {
      id: "grey-classic-profile",
      name: "Grey Classic Profile",
      description: "Elegant and clear template with sidebar and modern layout",
      thumbnail: "/lovable-uploads/2d518c3a-cd43-4fb4-b391-8729c98e1479.png",
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
      isNew: true,
      isRecommended: false
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

  const colorFilters = [
    { id: "all", name: "All Colors", color: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" },
    { id: "blue", name: "Blue", color: "bg-blue-500" },
    { id: "green", name: "Green", color: "bg-green-500" },
    { id: "purple", name: "Purple", color: "bg-purple-500" },
    { id: "orange", name: "Orange", color: "bg-orange-500" },
    { id: "pink", name: "Pink", color: "bg-pink-500" },
    { id: "teal", name: "Teal", color: "bg-teal-500" },
    { id: "navy", name: "Navy", color: "bg-blue-900" },
    { id: "gray", name: "Gray", color: "bg-gray-500" },
    { id: "brown", name: "Brown", color: "bg-amber-700" }
  ];

  const getFilteredTemplates = () => {
    let filtered = templates;

    // Filter by category/type
    if (activeFilter === "recommended") {
      filtered = filtered.filter(t => t.isRecommended);
    } else if (activeFilter === "new") {
      filtered = filtered.filter(t => t.isNew);
    }

    // Filter by color
    if (selectedColor !== "all") {
      filtered = filtered.filter(t => t.color === selectedColor);
    }

    return filtered;
  };

  const filteredTemplates = getFilteredTemplates();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handlePreview = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(templateId);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewTemplate("");
    setTemplateHtml("");
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      navigate(`/resume-builder-app?template=${selectedTemplate}`);
    }
  };

  const handleSkipForNow = () => {
    navigate('/resume-builder-app');
  };

  // Show preview modal with compiled template
  if (showPreview && previewTemplate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold">Template Preview</h2>
              <p className="text-sm text-gray-600">
                {templates.find(t => t.id === previewTemplate)?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedTemplate(previewTemplate);
                  handleClosePreview();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Use This Template
              </Button>
              <Button variant="outline" onClick={handleClosePreview}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {templateHtml ? (
                <div 
                  className="w-full p-4"
                  dangerouslySetInnerHTML={{ __html: templateHtml }}
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.6',
                    color: '#333'
                  }}
                />
              ) : (
                <div className="w-full h-[800px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading template preview...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose a template for your CV
          </h1>
          <p className="text-lg text-gray-600">
            You can always change your mind and try a different template later
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveFilter("recommended")}
              className={`pb-3 px-1 text-lg font-medium transition-colors ${
                activeFilter === "recommended"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setActiveFilter("new")}
              className={`pb-3 px-1 text-lg font-medium transition-colors ${
                activeFilter === "new"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              New
            </button>
            <button
              onClick={() => setActiveFilter("all")}
              className={`pb-3 px-1 text-lg font-medium transition-colors ${
                activeFilter === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Color Filters */}
        <div className="flex justify-center items-center gap-3 mb-12">
          <Palette className="w-5 h-5 text-gray-400" />
          {colorFilters.map((colorFilter) => (
            <button
              key={colorFilter.id}
              onClick={() => setSelectedColor(colorFilter.id)}
              className={`w-8 h-8 rounded-full transition-all duration-200 ${
                colorFilter.color
              } ${
                selectedColor === colorFilter.id
                  ? "ring-3 ring-gray-400 ring-offset-2 scale-110"
                  : "hover:scale-105"
              }`}
              title={colorFilter.name}
            />
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`group relative p-0 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer
                ${selectedTemplate === template.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}
              `}
              onClick={() => handleTemplateSelect(template.id)}
              style={{
                minHeight: 440,
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Badge Row */}
              <div className="absolute top-4 left-4 z-10 flex space-x-2">
                {template.isRecommended && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white font-medium shadow-sm">Recommended</span>
                )}
                {template.isPopular && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-orange-400 text-white font-medium shadow-sm">Popular</span>
                )}
                {template.isPremium && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500 text-white font-medium shadow-sm">Premium</span>
                )}
                {template.isNew && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500 text-white font-medium shadow-sm">New</span>
                )}
              </div>
              {/* Resume Preview Thumbnail */}
              <div className="p-0 pt-8 pb-0 flex-1 flex flex-col justify-start">
                <div className="rounded-t-xl overflow-hidden relative aspect-[210/297] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center shadow-sm
                  transition-all duration-150
                ">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="object-contain w-full h-full"
                    style={{ maxHeight: 330, background: "white" }}
                    onError={e => {
                      e.currentTarget.src = "/resume-templates/thumbnails/professional.png";
                    }}
                  />
                  {/* Selection ring overlay */}
                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 border-4 border-blue-400 pointer-events-none rounded-lg" />
                  )}
                </div>
              </div>
              {/* Card Info */}
              <div className="px-6 py-4">
                <div className="font-semibold text-[1.07rem] text-gray-900 mb-1 tracking-tight leading-tight">{template.name}</div>
                <div className="text-gray-500 text-sm font-light">{template.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleSkipForNow}
            className="px-8"
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleContinue} 
            size="lg" 
            disabled={!selectedTemplate}
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            Choose this template
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
