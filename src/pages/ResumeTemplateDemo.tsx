import React, { useState } from 'react';
import { useResumeColors } from '@/contexts/resume/ResumeColorContext';
import ResumeColorCustomizer from '@/components/resume/ResumeColorCustomizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import '@/styles/templates.css';

// Resume template types
const resumeTemplates = [
  { id: 'minimal', name: 'Minimal Template' },
  { id: 'modern-clean', name: 'Modern Clean Template' },
  { id: 'creative', name: 'Creative Template' },
  { id: 'professional', name: 'Professional Template' },
  { id: 'executive', name: 'Executive Template' },
  { id: 'tech', name: 'Tech Template' },
  { id: 'elegant', name: 'Elegant Template' },
  { id: 'academic', name: 'Academic Template' },
  { id: 'entry-level', name: 'Entry Level Template' },
  { id: 'chronological', name: 'Chronological Template' },
];

const ResumeTemplateDemo: React.FC = () => {
  const { colors, setColors } = useResumeColors();
  const [selectedTemplate, setSelectedTemplate] = useState(resumeTemplates[0]);
  
  // Function to render the resume template based on the selected template and colors
  const renderResumeTemplate = () => {
    switch (selectedTemplate.id) {
      case 'minimal':
        return (
          <div className="h-full p-6" style={{ backgroundColor: colors.primary, color: colors.text }}>
            <div className="text-center mb-6">
              <div className="text-2xl font-bold">JOHN DOE</div>
              <div className="text-sm text-gray-600">PROFESSIONAL TITLE</div>
            </div>
            <div className="flex justify-center space-x-4 mb-6 text-sm text-gray-600">
              <div>email@example.com</div>
              <div>•</div>
              <div>(123) 456-7890</div>
              <div>•</div>
              <div>Location</div>
            </div>
            <div className="mb-4">
              <div className="font-bold text-lg border-b pb-1 mb-2" style={{ borderColor: colors.accent, color: colors.text }}>EXPERIENCE</div>
              <div className="mb-3">
                <div className="flex justify-between">
                  <span className="font-bold">Company Name</span>
                  <span>2020 - Present</span>
                </div>
                <div className="font-semibold">Job Title</div>
                <div>Brief description of responsibilities and achievements. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.</div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between">
                  <span className="font-bold">Previous Company</span>
                  <span>2018 - 2020</span>
                </div>
                <div className="font-semibold">Job Title</div>
                <div>Brief description of responsibilities and achievements. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="font-bold text-lg border-b pb-1 mb-2" style={{ borderColor: colors.accent, color: colors.text }}>EDUCATION</div>
              <div>
                <div className="flex justify-between">
                  <span className="font-bold">University Name</span>
                  <span>2014 - 2018</span>
                </div>
                <div>Bachelor of Science, Computer Science</div>
                <div>GPA: 3.8/4.0</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg border-b pb-1 mb-2" style={{ borderColor: colors.accent, color: colors.text }}>SKILLS</div>
              <div className="flex flex-wrap">
                <div className="mr-2 mb-2 px-3 py-1 rounded" style={{ backgroundColor: colors.secondary, color: colors.text }}>JavaScript</div>
                <div className="mr-2 mb-2 px-3 py-1 rounded" style={{ backgroundColor: colors.secondary, color: colors.text }}>React</div>
                <div className="mr-2 mb-2 px-3 py-1 rounded" style={{ backgroundColor: colors.secondary, color: colors.text }}>Node.js</div>
                <div className="mr-2 mb-2 px-3 py-1 rounded" style={{ backgroundColor: colors.secondary, color: colors.text }}>TypeScript</div>
                <div className="mr-2 mb-2 px-3 py-1 rounded" style={{ backgroundColor: colors.secondary, color: colors.text }}>HTML/CSS</div>
              </div>
            </div>
          </div>
        );
        
      case 'professional':
        return (
          <div className="flex h-full">
            <div className="w-1/3 p-4" style={{ backgroundColor: colors.secondary, color: colors.text }}>
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  <span className="text-2xl text-gray-600">JD</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>CONTACT</div>
                <div className="mb-1">email@example.com</div>
                <div className="mb-1">(123) 456-7890</div>
                <div className="mb-1">linkedin.com/in/username</div>
                <div>City, State</div>
              </div>
              <div className="mb-4">
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>SKILLS</div>
                <div className="mb-1">Project Management</div>
                <div className="mb-1">Team Leadership</div>
                <div className="mb-1">Strategic Planning</div>
                <div className="mb-1">Business Development</div>
                <div>Financial Analysis</div>
              </div>
              <div>
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>LANGUAGES</div>
                <div className="mb-1">English (Native)</div>
                <div>Spanish (Fluent)</div>
              </div>
            </div>
            <div className="w-2/3 p-4" style={{ backgroundColor: colors.primary, color: colors.text }}>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold mb-1">JOHN DOE</div>
                <div className="text-lg">SENIOR BUSINESS MANAGER</div>
              </div>
              <div className="mb-4">
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>PROFESSIONAL SUMMARY</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.accent }}></div>
                <div>Experienced business manager with over 10 years of expertise in strategic planning, team leadership, and business development. Proven track record of increasing operational efficiency and driving revenue growth.</div>
              </div>
              <div className="mb-4">
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>EXPERIENCE</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.accent }}></div>
                <div className="mb-3">
                  <div className="font-bold">Senior Business Manager</div>
                  <div className="flex justify-between">
                    <span className="italic">ABC Corporation</span>
                    <span>2018 - Present</span>
                  </div>
                  <div className="mt-1">
                    <div>• Led cross-functional teams to achieve 30% revenue growth over 3 years</div>
                    <div>• Developed and implemented strategic business plans</div>
                    <div>• Managed client relationships resulting in 95% retention rate</div>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Business Development Manager</div>
                  <div className="flex justify-between">
                    <span className="italic">XYZ Company</span>
                    <span>2015 - 2018</span>
                  </div>
                  <div className="mt-1">
                    <div>• Identified and secured new business opportunities</div>
                    <div>• Increased sales by 25% through strategic partnerships</div>
                    <div>• Managed a team of 5 sales representatives</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-bold text-lg mb-2" style={{ color: colors.accent }}>EDUCATION</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.accent }}></div>
                <div>
                  <div className="font-bold">Master of Business Administration</div>
                  <div className="flex justify-between">
                    <span className="italic">University of Business</span>
                    <span>2013 - 2015</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'creative':
        return (
          <div className="h-full" style={{ backgroundColor: colors.primary, color: colors.text }}>
            <div className="h-1/4 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <div className="text-center text-white">
                <div className="text-3xl font-bold">JOHN DOE</div>
                <div className="text-lg">CREATIVE DIRECTOR</div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div>email@example.com</div>
                  <div>(123) 456-7890</div>
                </div>
                <div className="text-right">
                  <div>linkedin.com/in/username</div>
                  <div>portfolio.com</div>
                </div>
              </div>
              <div className="mb-6">
                <div className="font-bold text-xl mb-2" style={{ color: colors.accent }}>ABOUT ME</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.secondary }}></div>
                <div>Creative director with 8+ years of experience in branding, digital design, and creative strategy. Passionate about creating compelling visual narratives that connect brands with their audiences.</div>
              </div>
              <div className="mb-6">
                <div className="font-bold text-xl mb-2" style={{ color: colors.accent }}>EXPERIENCE</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.secondary }}></div>
                <div className="mb-3">
                  <div className="font-bold">Creative Director</div>
                  <div className="flex justify-between">
                    <span>Design Studio Inc.</span>
                    <span>2019 - Present</span>
                  </div>
                  <div className="mt-1">Led creative direction for major brands including Nike, Spotify, and Airbnb. Managed a team of 12 designers and developed award-winning campaigns.</div>
                </div>
                <div>
                  <div className="font-bold">Senior Designer</div>
                  <div className="flex justify-between">
                    <span>Creative Agency Co.</span>
                    <span>2016 - 2019</span>
                  </div>
                  <div className="mt-1">Designed brand identities, marketing materials, and digital experiences for clients across various industries.</div>
                </div>
              </div>
              <div>
                <div className="font-bold text-xl mb-2" style={{ color: colors.accent }}>SKILLS</div>
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: colors.secondary }}></div>
                <div className="flex flex-wrap">
                  <div className="mr-2 mb-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.secondary }}>Brand Strategy</div>
                  <div className="mr-2 mb-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.secondary }}>Art Direction</div>
                  <div className="mr-2 mb-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.secondary }}>UI/UX Design</div>
                  <div className="mr-2 mb-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.secondary }}>Adobe Creative Suite</div>
                  <div className="mr-2 mb-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.secondary }}>Team Leadership</div>
                </div>
              </div>
            </div>
          </div>
        );
        
      // Add more template cases as needed
      
      default:
        return (
          <div className="h-full p-6 flex flex-col items-center justify-center" style={{ backgroundColor: colors.primary, color: colors.text }}>
            <div className="text-2xl font-bold mb-4">Select a Template</div>
            <div className="text-center">Choose a resume template from the options above to preview it with your custom colors.</div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Resume Template Preview</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ResumeColorCustomizer 
              initialColors={colors}
              onChange={setColors}
            />
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-lg font-bold mb-4">Select Template</div>
                <div className="grid grid-cols-2 gap-2">
                  {resumeTemplates.map(template => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate.id === template.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Tabs defaultValue="preview">
              <TabsList className="w-full">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="w-full aspect-[210/297] border">
                      {renderResumeTemplate()}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-4 text-center">
                  <Button>
                    Use This Template
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="thumbnails" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resumeTemplates.map(template => (
                    <Card 
                      key={template.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="aspect-[3/4] border-b" style={{ backgroundColor: colors.primary }}>
                        <div className="h-1/6" style={{ backgroundColor: colors.accent }}></div>
                        <div className="p-2">
                          <div className="h-2 w-3/4 mb-1" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-2 w-1/2 mb-3" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-1 w-full mb-2" style={{ backgroundColor: colors.accent }}></div>
                          <div className="h-2 w-full mb-1" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-2 w-full mb-1" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-2 w-3/4 mb-3" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-1 w-full mb-2" style={{ backgroundColor: colors.accent }}></div>
                          <div className="h-2 w-full mb-1" style={{ backgroundColor: colors.secondary }}></div>
                          <div className="h-2 w-full mb-1" style={{ backgroundColor: colors.secondary }}></div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="font-medium text-sm truncate">{template.name}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateDemo;