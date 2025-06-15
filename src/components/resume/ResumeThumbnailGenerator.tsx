import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

// Define template types
interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  layout: 'single-column' | 'two-column' | 'modern' | 'creative' | 'minimal';
}

// Resume template data
const resumeTemplates: TemplateInfo[] = [
  {
    id: 'minimal',
    name: 'Minimal Template',
    description: 'A minimalist design focusing on content',
    primaryColor: '#ffffff',
    secondaryColor: '#f5f5f5',
    accentColor: '#2563eb',
    fontFamily: 'Inter, sans-serif',
    layout: 'minimal'
  },
  {
    id: 'modern-clean',
    name: 'Modern Clean Template',
    description: 'A clean, modern design with a professional look',
    primaryColor: '#ffffff',
    secondaryColor: '#f0f9ff',
    accentColor: '#0284c7',
    fontFamily: 'Roboto, sans-serif',
    layout: 'single-column'
  },
  {
    id: 'creative',
    name: 'Creative Template',
    description: 'A creative design for design and creative professionals',
    primaryColor: '#ffffff',
    secondaryColor: '#fdf4ff',
    accentColor: '#d946ef',
    fontFamily: 'Poppins, sans-serif',
    layout: 'creative'
  },
  {
    id: 'professional',
    name: 'Professional Template',
    description: 'A traditional professional resume layout',
    primaryColor: '#ffffff',
    secondaryColor: '#f0fdf4',
    accentColor: '#16a34a',
    fontFamily: 'Source Sans Pro, sans-serif',
    layout: 'two-column'
  },
  {
    id: 'executive',
    name: 'Executive Template',
    description: 'An executive-level resume design',
    primaryColor: '#ffffff',
    secondaryColor: '#f1f5f9',
    accentColor: '#334155',
    fontFamily: 'Merriweather, serif',
    layout: 'two-column'
  },
  {
    id: 'tech',
    name: 'Tech Template',
    description: 'A modern design for tech professionals',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    accentColor: '#38bdf8',
    fontFamily: 'JetBrains Mono, monospace',
    layout: 'modern'
  },
  {
    id: 'elegant',
    name: 'Elegant Template',
    description: 'An elegant design with a touch of sophistication',
    primaryColor: '#ffffff',
    secondaryColor: '#faf5ff',
    accentColor: '#8b5cf6',
    fontFamily: 'Playfair Display, serif',
    layout: 'single-column'
  },
  {
    id: 'academic',
    name: 'Academic Template',
    description: 'A design suited for academic and research positions',
    primaryColor: '#ffffff',
    secondaryColor: '#f8fafc',
    accentColor: '#475569',
    fontFamily: 'Lora, serif',
    layout: 'single-column'
  },
  {
    id: 'entry-level',
    name: 'Entry Level Template',
    description: 'Perfect for recent graduates and entry-level positions',
    primaryColor: '#ffffff',
    secondaryColor: '#ecfdf5',
    accentColor: '#10b981',
    fontFamily: 'Open Sans, sans-serif',
    layout: 'minimal'
  },
  {
    id: 'chronological',
    name: 'Chronological Template',
    description: 'A traditional chronological resume layout',
    primaryColor: '#ffffff',
    secondaryColor: '#eff6ff',
    accentColor: '#3b82f6',
    fontFamily: 'Nunito, sans-serif',
    layout: 'single-column'
  }
];

// Color themes
const colorThemes = [
  { name: 'Blue', primary: '#ffffff', secondary: '#eff6ff', accent: '#3b82f6' },
  { name: 'Green', primary: '#ffffff', secondary: '#ecfdf5', accent: '#10b981' },
  { name: 'Purple', primary: '#ffffff', secondary: '#faf5ff', accent: '#8b5cf6' },
  { name: 'Red', primary: '#ffffff', secondary: '#fef2f2', accent: '#ef4444' },
  { name: 'Orange', primary: '#ffffff', secondary: '#fff7ed', accent: '#f97316' },
  { name: 'Teal', primary: '#ffffff', secondary: '#f0fdfa', accent: '#14b8a6' },
  { name: 'Pink', primary: '#ffffff', secondary: '#fdf2f8', accent: '#ec4899' },
  { name: 'Gray', primary: '#ffffff', secondary: '#f8fafc', accent: '#64748b' },
  { name: 'Dark', primary: '#1e293b', secondary: '#0f172a', accent: '#38bdf8' },
];

const ResumeThumbnailGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo>(resumeTemplates[0]);
  const [customColors, setCustomColors] = useState({
    primary: resumeTemplates[0].primaryColor,
    secondary: resumeTemplates[0].secondaryColor,
    accent: resumeTemplates[0].accentColor,
  });
  const [fontSize, setFontSize] = useState(100);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [showGrid, setShowGrid] = useState(false);
  
  const thumbnailRef = useRef<HTMLDivElement>(null);
  
  // Update download filename when template changes
  useEffect(() => {
    setDownloadFilename(selectedTemplate.id);
  }, [selectedTemplate]);
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = resumeTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setCustomColors({
        primary: template.primaryColor,
        secondary: template.secondaryColor,
        accent: template.accentColor,
      });
    }
  };
  
  // Apply color theme
  const applyColorTheme = (themeName: string) => {
    const theme = colorThemes.find(t => t.name === themeName);
    if (theme) {
      setCustomColors({
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
      });
    }
  };
  
  // Generate and download thumbnail
  const generateThumbnail = async () => {
    if (!thumbnailRef.current) return;
    
    try {
      const canvas = await html2canvas(thumbnailRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
        logging: false,
      });
      
      const image = canvas.toDataURL(`image/${downloadFormat}`, 1.0);
      const link = document.createElement('a');
      link.download = `${downloadFilename}.${downloadFormat}`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  };
  
  // Generate thumbnails for all templates
  const generateAllThumbnails = async () => {
    for (const template of resumeTemplates) {
      // Set current template
      setSelectedTemplate(template);
      setCustomColors({
        primary: template.primaryColor,
        secondary: template.secondaryColor,
        accent: template.accentColor,
      });
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate thumbnail
      if (!thumbnailRef.current) continue;
      
      try {
        const canvas = await html2canvas(thumbnailRef.current, {
          scale: 2,
          backgroundColor: null,
          logging: false,
        });
        
        const image = canvas.toDataURL(`image/${downloadFormat}`, 1.0);
        const link = document.createElement('a');
        link.download = `${template.id}.${downloadFormat}`;
        link.href = image;
        link.click();
        
        // Wait between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating thumbnail for ${template.id}:`, error);
      }
    }
  };
  
  // Render different layouts based on template type
  const renderResumeLayout = () => {
    switch (selectedTemplate.layout) {
      case 'two-column':
        return (
          <div className="flex h-full">
            <div className="w-1/3 p-2" style={{ backgroundColor: customColors.secondary }}>
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  <span className="text-xl text-gray-600">JD</span>
                </div>
              </div>
              <div className="mb-3 text-center" style={{ color: customColors.accent }}>
                <div className="font-bold">CONTACT</div>
                <div className="h-0.5 w-12 mx-auto my-1" style={{ backgroundColor: customColors.accent }}></div>
              </div>
              <div className="text-xs mb-3">
                <div>email@example.com</div>
                <div>(123) 456-7890</div>
                <div>linkedin.com/in/username</div>
              </div>
              <div className="mb-3 text-center" style={{ color: customColors.accent }}>
                <div className="font-bold">SKILLS</div>
                <div className="h-0.5 w-12 mx-auto my-1" style={{ backgroundColor: customColors.accent }}></div>
              </div>
              <div className="text-xs">
                <div>Skill 1</div>
                <div>Skill 2</div>
                <div>Skill 3</div>
              </div>
            </div>
            <div className="w-2/3 p-2">
              <div className="text-center mb-3">
                <div className="text-lg font-bold">JOHN DOE</div>
                <div className="text-xs">PROFESSIONAL TITLE</div>
              </div>
              <div className="mb-2" style={{ color: customColors.accent }}>
                <div className="font-bold text-sm">EXPERIENCE</div>
                <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.accent }}></div>
              </div>
              <div className="mb-2 text-xs">
                <div className="font-bold">Company Name</div>
                <div className="flex justify-between">
                  <span>Job Title</span>
                  <span>2020 - Present</span>
                </div>
                <div>Brief description of responsibilities and achievements.</div>
              </div>
              <div className="mb-2 text-xs">
                <div className="font-bold">Previous Company</div>
                <div className="flex justify-between">
                  <span>Job Title</span>
                  <span>2018 - 2020</span>
                </div>
                <div>Brief description of responsibilities and achievements.</div>
              </div>
            </div>
          </div>
        );
        
      case 'creative':
        return (
          <div className="h-full" style={{ backgroundColor: customColors.primary }}>
            <div className="h-1/4 flex items-center justify-center" style={{ backgroundColor: customColors.accent }}>
              <div className="text-center text-white">
                <div className="text-lg font-bold">JOHN DOE</div>
                <div className="text-xs">CREATIVE PROFESSIONAL</div>
              </div>
            </div>
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs">
                  <div>email@example.com</div>
                  <div>(123) 456-7890</div>
                </div>
                <div className="text-xs text-right">
                  <div>linkedin.com/in/username</div>
                  <div>portfolio.com</div>
                </div>
              </div>
              <div className="mb-2">
                <div className="font-bold text-sm" style={{ color: customColors.accent }}>EXPERIENCE</div>
                <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.secondary }}></div>
              </div>
              <div className="mb-2 text-xs">
                <div className="font-bold">Creative Agency</div>
                <div className="flex justify-between">
                  <span>Senior Designer</span>
                  <span>2020 - Present</span>
                </div>
                <div>Brief description of creative projects and achievements.</div>
              </div>
              <div className="mb-2">
                <div className="font-bold text-sm" style={{ color: customColors.accent }}>SKILLS</div>
                <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.secondary }}></div>
              </div>
              <div className="flex flex-wrap text-xs">
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: customColors.secondary }}>Skill 1</div>
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: customColors.secondary }}>Skill 2</div>
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: customColors.secondary }}>Skill 3</div>
              </div>
            </div>
          </div>
        );
        
      case 'modern':
        return (
          <div className="h-full" style={{ backgroundColor: customColors.primary, color: '#fff' }}>
            <div className="p-2">
              <div className="text-center mb-3">
                <div className="text-lg font-bold">JOHN DOE</div>
                <div className="text-xs" style={{ color: customColors.accent }}>TECH PROFESSIONAL</div>
              </div>
              <div className="flex justify-center space-x-2 mb-3 text-xs">
                <div>email@example.com</div>
                <div>•</div>
                <div>(123) 456-7890</div>
              </div>
              <div className="mb-2">
                <div className="font-bold text-sm" style={{ color: customColors.accent }}>EXPERIENCE</div>
                <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.secondary }}></div>
              </div>
              <div className="mb-2 text-xs">
                <div className="font-bold">Tech Company</div>
                <div className="flex justify-between">
                  <span>Software Engineer</span>
                  <span>2020 - Present</span>
                </div>
                <div>Brief description of technical projects and achievements.</div>
              </div>
              <div className="mb-2">
                <div className="font-bold text-sm" style={{ color: customColors.accent }}>SKILLS</div>
                <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.secondary }}></div>
              </div>
              <div className="flex flex-wrap text-xs">
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-sm" style={{ backgroundColor: customColors.secondary, color: customColors.accent }}>JavaScript</div>
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-sm" style={{ backgroundColor: customColors.secondary, color: customColors.accent }}>React</div>
                <div className="mr-2 mb-1 px-2 py-0.5 rounded-sm" style={{ backgroundColor: customColors.secondary, color: customColors.accent }}>Node.js</div>
              </div>
            </div>
          </div>
        );
        
      case 'minimal':
        return (
          <div className="h-full p-2" style={{ backgroundColor: customColors.primary }}>
            <div className="text-center mb-4">
              <div className="text-lg font-bold">JOHN DOE</div>
              <div className="text-xs text-gray-600">PROFESSIONAL TITLE</div>
            </div>
            <div className="flex justify-center space-x-3 mb-4 text-xs text-gray-600">
              <div>email@example.com</div>
              <div>•</div>
              <div>(123) 456-7890</div>
              <div>•</div>
              <div>Location</div>
            </div>
            <div className="mb-3">
              <div className="font-bold text-sm border-b pb-1 mb-1" style={{ borderColor: customColors.accent, color: 'black' }}>EXPERIENCE</div>
              <div className="mb-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">Company Name</span>
                  <span>2020 - Present</span>
                </div>
                <div className="font-semibold">Job Title</div>
                <div>Brief description of responsibilities and achievements.</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="font-bold text-sm border-b pb-1 mb-1" style={{ borderColor: customColors.accent, color: 'black' }}>EDUCATION</div>
              <div className="text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">University Name</span>
                  <span>2014 - 2018</span>
                </div>
                <div>Degree, Major</div>
              </div>
            </div>
          </div>
        );
        
      // Default single-column layout
      default:
        return (
          <div className="h-full p-2" style={{ backgroundColor: customColors.primary }}>
            <div className="text-center mb-3">
              <div className="text-lg font-bold">JOHN DOE</div>
              <div className="text-xs">PROFESSIONAL TITLE</div>
              <div className="h-0.5 w-16 mx-auto my-1" style={{ backgroundColor: customColors.accent }}></div>
            </div>
            <div className="flex justify-center space-x-2 mb-3 text-xs">
              <div>email@example.com</div>
              <div>•</div>
              <div>(123) 456-7890</div>
              <div>•</div>
              <div>Location</div>
            </div>
            <div className="mb-2">
              <div className="font-bold text-sm" style={{ color: customColors.accent }}>EXPERIENCE</div>
              <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.accent }}></div>
            </div>
            <div className="mb-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Company Name</span>
                <span>2020 - Present</span>
              </div>
              <div className="font-semibold">Job Title</div>
              <div>Brief description of responsibilities and achievements.</div>
            </div>
            <div className="mb-2">
              <div className="font-bold text-sm" style={{ color: customColors.accent }}>EDUCATION</div>
              <div className="h-0.5 w-full my-1" style={{ backgroundColor: customColors.accent }}></div>
            </div>
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="font-bold">University Name</span>
                <span>2014 - 2018</span>
              </div>
              <div>Degree, Major</div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Resume Template Thumbnail Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>Customize the appearance of your resume template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-select">Select Template</Label>
                <Select 
                  value={selectedTemplate.id} 
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs defaultValue="themes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="themes">Color Themes</TabsTrigger>
                  <TabsTrigger value="custom">Custom Colors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="themes" className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {colorThemes.map(theme => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        className="h-auto p-2 flex flex-col items-center"
                        onClick={() => applyColorTheme(theme.name)}
                      >
                        <div className="flex w-full h-6 rounded overflow-hidden mb-1">
                          <div className="w-1/3" style={{ backgroundColor: theme.primary }}></div>
                          <div className="w-1/3" style={{ backgroundColor: theme.secondary }}></div>
                          <div className="w-1/3" style={{ backgroundColor: theme.accent }}></div>
                        </div>
                        <span className="text-xs">{theme.name}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({...customColors, primary: e.target.value})}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({...customColors, primary: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({...customColors, secondary: e.target.value})}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({...customColors, secondary: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({...customColors, accent: e.target.value})}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({...customColors, accent: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label htmlFor="font-size">Font Size ({fontSize}%)</Label>
                <Slider
                  id="font-size"
                  min={70}
                  max={130}
                  step={5}
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  className="my-2"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-grid"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
                <Label htmlFor="show-grid">Show Grid</Label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Download Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={downloadFilename}
                  onChange={(e) => setDownloadFilename(e.target.value)}
                  placeholder="Enter filename"
                />
              </div>
              
              <div>
                <Label htmlFor="format-select">Format</Label>
                <Select 
                  value={downloadFormat} 
                  onValueChange={setDownloadFormat}
                >
                  <SelectTrigger id="format-select">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" onClick={generateThumbnail}>
                Download Thumbnail
              </Button>
              <Button variant="outline" className="w-full" onClick={generateAllThumbnails}>
                Generate All Thumbnails
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{selectedTemplate.name}</CardTitle>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div 
                className={`relative border ${showGrid ? 'bg-grid-pattern' : ''}`}
                style={{ width: '300px', height: '400px' }}
              >
                <div
                  ref={thumbnailRef}
                  className="w-full h-full overflow-hidden"
                  style={{ 
                    fontFamily: selectedTemplate.fontFamily,
                    fontSize: `${fontSize}%`,
                  }}
                >
                  {renderResumeLayout()}
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {selectedTemplate.id}.{downloadFormat}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">All Templates</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {resumeTemplates.map(template => (
                <div 
                  key={template.id}
                  className="border rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateChange(template.id)}
                >
                  <div 
                    className="w-full aspect-[3/4]"
                    style={{ 
                      backgroundColor: template.primaryColor,
                      fontFamily: template.fontFamily,
                      fontSize: '70%',
                    }}
                  >
                    {selectedTemplate.id === template.id ? (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : null}
                    
                    {template.layout === 'two-column' && (
                      <div className="flex h-full">
                        <div className="w-1/3" style={{ backgroundColor: template.secondaryColor }}></div>
                        <div className="w-2/3 p-2">
                          <div className="text-center mb-2">
                            <div className="font-bold">JOHN DOE</div>
                            <div className="text-[0.6rem]">PROFESSIONAL TITLE</div>
                          </div>
                          <div className="h-0.5 w-full mb-1" style={{ backgroundColor: template.accentColor }}></div>
                          <div className="text-[0.6rem]">
                            <div>Company Name</div>
                            <div>Job Title</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {template.layout === 'creative' && (
                      <div className="h-full">
                        <div className="h-1/4" style={{ backgroundColor: template.accentColor }}></div>
                        <div className="p-2">
                          <div className="text-[0.6rem] mb-1">
                            <div>email@example.com</div>
                            <div>(123) 456-7890</div>
                          </div>
                          <div className="h-0.5 w-full mb-1" style={{ backgroundColor: template.secondaryColor }}></div>
                          <div className="text-[0.6rem]">
                            <div>Creative Agency</div>
                            <div>Senior Designer</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {template.layout === 'modern' && (
                      <div className="h-full p-2" style={{ color: '#fff' }}>
                        <div className="text-center mb-2">
                          <div className="font-bold">JOHN DOE</div>
                          <div className="text-[0.6rem]" style={{ color: template.accentColor }}>TECH PROFESSIONAL</div>
                        </div>
                        <div className="h-0.5 w-full mb-1" style={{ backgroundColor: template.secondaryColor }}></div>
                        <div className="text-[0.6rem]">
                          <div>Tech Company</div>
                          <div>Software Engineer</div>
                        </div>
                      </div>
                    )}
                    
                    {template.layout === 'minimal' && (
                      <div className="h-full p-2">
                        <div className="text-center mb-2">
                          <div className="font-bold">JOHN DOE</div>
                          <div className="text-[0.6rem] text-gray-600">PROFESSIONAL TITLE</div>
                        </div>
                        <div className="border-b mb-1" style={{ borderColor: template.accentColor }}></div>
                        <div className="text-[0.6rem]">
                          <div>Company Name</div>
                          <div>Job Title</div>
                        </div>
                      </div>
                    )}
                    
                    {template.layout === 'single-column' && (
                      <div className="h-full p-2">
                        <div className="text-center mb-2">
                          <div className="font-bold">JOHN DOE</div>
                          <div className="text-[0.6rem]">PROFESSIONAL TITLE</div>
                          <div className="h-0.5 w-8 mx-auto my-1" style={{ backgroundColor: template.accentColor }}></div>
                        </div>
                        <div className="font-bold text-[0.6rem]" style={{ color: template.accentColor }}>EXPERIENCE</div>
                        <div className="h-0.5 w-full mb-1" style={{ backgroundColor: template.accentColor }}></div>
                        <div className="text-[0.6rem]">
                          <div>Company Name</div>
                          <div>Job Title</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <div className="font-medium text-sm truncate">{template.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeThumbnailGenerator;