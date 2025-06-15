
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Eye, ArrowRight, Star, Crown, Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  isPremium?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
}

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const templates: Template[] = [
    {
      id: "modern-executive",
      name: "Modern Executive",
      description: "Clean, professional design perfect for executives",
      thumbnail: "/lovable-uploads/be00c166-3bf1-4879-af44-a2f578e88bf7.png",
      category: "professional",
      isPopular: true
    },
    {
      id: "creative-designer",
      name: "Creative Designer",
      description: "Bold, creative layout for designers",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative",
      isPremium: true
    },
    {
      id: "tech-minimalist",
      name: "Tech Minimalist",
      description: "Clean, minimal design for tech professionals",
      thumbnail: "/resume-templates/thumbnails/tech.PNG",
      category: "tech",
      isNew: true
    },
    {
      id: "academic-scholar",
      name: "Academic Scholar",
      description: "Traditional format for researchers",
      thumbnail: "/resume-templates/thumbnails/academic.PNG",
      category: "academic"
    },
    {
      id: "startup-founder",
      name: "Startup Founder",
      description: "Dynamic layout for entrepreneurs",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional",
      isPremium: true
    },
    {
      id: "marketing-pro",
      name: "Marketing Pro",
      description: "Vibrant design for marketing professionals",
      thumbnail: "/resume-templates/thumbnails/creative.png",
      category: "creative"
    },
    {
      id: "finance-expert",
      name: "Finance Expert",
      description: "Conservative design for finance professionals",
      thumbnail: "/resume-templates/thumbnails/professional.png",
      category: "professional"
    },
    {
      id: "entry-graduate",
      name: "Fresh Graduate",
      description: "Perfect for new graduates",
      thumbnail: "/resume-templates/thumbnails/entry-level.PNG",
      category: "entry-level",
      isPopular: true
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "Sophisticated design for experienced professionals",
      thumbnail: "/resume-templates/thumbnails/elegant.PNG",
      category: "professional"
    }
  ];

  const categories = [
    { id: "all", name: "All Templates", count: templates.length },
    { id: "professional", name: "Professional", count: templates.filter(t => t.category === "professional").length },
    { id: "creative", name: "Creative", count: templates.filter(t => t.category === "creative").length },
    { id: "tech", name: "Tech", count: templates.filter(t => t.category === "tech").length },
    { id: "academic", name: "Academic", count: templates.filter(t => t.category === "academic").length },
    { id: "entry-level", name: "Entry Level", count: templates.filter(t => t.category === "entry-level").length }
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates.filter(template => template.category === activeCategory);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      navigate(`/resume-builder-app?template=${selectedTemplate}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Resume Template
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pick from our collection of professional resume templates designed to get you hired
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="text-sm"
              >
                {category.name}
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedTemplate === template.id
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardContent className="p-0">
                {/* Template Preview */}
                <div className="relative">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/resume-templates/thumbnails/professional.png";
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
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

                  {/* Preview Button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 rounded-t-lg">
                    <Button variant="secondary" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>

                  {/* Selection Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        {selectedTemplate && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Template selected: <span className="font-semibold">
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </span>
              </div>
              <Button onClick={handleContinue} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Continue with Template
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Templates?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">ATS-Optimized</h3>
              <p className="text-gray-600">All templates are designed to pass Applicant Tracking Systems</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Professional Design</h3>
              <p className="text-gray-600">Created by professional designers to make you stand out</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy to Customize</h3>
              <p className="text-gray-600">Simple drag-and-drop interface to personalize your resume</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
