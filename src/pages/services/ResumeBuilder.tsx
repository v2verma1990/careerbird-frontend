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

  const templates: Template[] = [
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
      id: "entry-graduate",
      name: "Fresh Graduate",
      description: "Perfect for new graduates",
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
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      navigate(`/resume-builder-app?template=${selectedTemplate}`);
    }
  };

  const handleSkipForNow = () => {
    navigate('/resume-builder-app');
  };

  // Show preview modal
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
              <iframe
                src={`/resume-templates/html/${previewTemplate}.html`}
                className="w-full h-[800px] border-0"
                title="Template Preview"
                onLoad={(e) => {
                  // Inject sample data into the iframe
                  if (sampleData) {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      console.log('Injecting sample data into iframe:', sampleData);
                      
                      // Wait a bit for the iframe to fully load
                      setTimeout(() => {
                        try {
                          // Try to access the iframe document
                          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                          if (iframeDoc) {
                            console.log('Iframe document accessible, populating data...');
                            
                            // Method 1: Try to post message to iframe
                            iframe.contentWindow?.postMessage({ 
                              type: 'POPULATE_RESUME_DATA', 
                              data: sampleData 
                            }, '*');
                            
                            // Method 2: Direct DOM manipulation as fallback
                            setTimeout(() => {
                              try {
                                // Replace common placeholders directly in the DOM
                                const content = iframeDoc.body.innerHTML;
                                let updatedContent = content
                                  .replace(/\{\{name\}\}/g, sampleData.name || 'John Doe')
                                  .replace(/\{\{title\}\}/g, sampleData.title || 'Professional Title')
                                  .replace(/\{\{email\}\}/g, sampleData.email || 'email@example.com')
                                  .replace(/\{\{phone\}\}/g, sampleData.phone || '(123) 456-7890')
                                  .replace(/\{\{location\}\}/g, sampleData.location || 'City, State')
                                  .replace(/\{\{linkedin\}\}/g, sampleData.linkedin || 'linkedin.com/in/profile')
                                  .replace(/\{\{website\}\}/g, sampleData.website || 'website.com')
                                  .replace(/\{\{summary\}\}/g, sampleData.summary || 'Professional summary...');
                                
                                // Handle experience section
                                if (sampleData.experience && sampleData.experience.length > 0) {
                                  const exp = sampleData.experience[0];
                                  updatedContent = updatedContent
                                    .replace(/\{\{experience\.title\}\}/g, exp.title || 'Job Title')
                                    .replace(/\{\{experience\.company\}\}/g, exp.company || 'Company Name')
                                    .replace(/\{\{experience\.location\}\}/g, exp.location || 'Location')
                                    .replace(/\{\{experience\.startDate\}\}/g, exp.startDate || 'Start Date')
                                    .replace(/\{\{experience\.endDate\}\}/g, exp.endDate || 'End Date')
                                    .replace(/\{\{experience\.description\}\}/g, exp.description || 'Job description...');
                                }
                                
                                // Handle education section
                                if (sampleData.education && sampleData.education.length > 0) {
                                  const edu = sampleData.education[0];
                                  updatedContent = updatedContent
                                    .replace(/\{\{education\.degree\}\}/g, edu.degree || 'Degree')
                                    .replace(/\{\{education\.institution\}\}/g, edu.institution || 'Institution')
                                    .replace(/\{\{education\.location\}\}/g, edu.location || 'Location')
                                    .replace(/\{\{education\.startDate\}\}/g, edu.startDate || 'Start Date')
                                    .replace(/\{\{education\.endDate\}\}/g, edu.endDate || 'End Date');
                                }
                                
                                // Handle skills
                                if (sampleData.skills && sampleData.skills.length > 0) {
                                  updatedContent = updatedContent
                                    .replace(/\{\{skills\}\}/g, sampleData.skills.join(', '));
                                }
                                
                                iframeDoc.body.innerHTML = updatedContent;
                                console.log('Successfully populated template with sample data');
                              } catch (domError) {
                                console.log('DOM manipulation failed:', domError);
                              }
                            }, 200);
                          } else {
                            console.log('Cannot access iframe document due to cross-origin restrictions');
                          }
                        } catch (accessError) {
                          console.log('Cannot access iframe content:', accessError);
                        }
                      }, 500);
                    } catch (error) {
                      console.log('Could not inject sample data into preview:', error);
                    }
                  }
                }}
                onError={() => {
                  console.error(`Failed to load template: ${previewTemplate}.html`);
                }}
              />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl group ${
                selectedTemplate === template.id
                  ? "ring-2 ring-blue-500 shadow-xl"
                  : "hover:shadow-lg"
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardContent className="p-0">
                {/* Template Preview */}
                <div className="relative overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/resume-templates/thumbnails/professional.png";
                    }}
                  />
                  
                  {/* Overlay with badges */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300">
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {template.isRecommended && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {template.isPopular && (
                        <Badge className="bg-orange-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {template.isPremium && (
                        <Badge className="bg-purple-500 text-white text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {template.isNew && (
                        <Badge className="bg-green-500 text-white text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedTemplate === template.id && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Preview Button - appears on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => handlePreview(template.id, e)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{template.name}</h3>
                  <p className="text-gray-600 text-sm">{template.description}</p>
                </div>
              </CardContent>
            </Card>
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
