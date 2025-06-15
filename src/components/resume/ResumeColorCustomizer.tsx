import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Color themes
const colorThemes = [
  { name: 'Default Blue', primary: '#ffffff', secondary: '#eff6ff', accent: '#3b82f6', text: '#1e293b' },
  { name: 'Professional Green', primary: '#ffffff', secondary: '#ecfdf5', accent: '#10b981', text: '#1e293b' },
  { name: 'Creative Purple', primary: '#ffffff', secondary: '#faf5ff', accent: '#8b5cf6', text: '#1e293b' },
  { name: 'Bold Red', primary: '#ffffff', secondary: '#fef2f2', accent: '#ef4444', text: '#1e293b' },
  { name: 'Warm Orange', primary: '#ffffff', secondary: '#fff7ed', accent: '#f97316', text: '#1e293b' },
  { name: 'Calm Teal', primary: '#ffffff', secondary: '#f0fdfa', accent: '#14b8a6', text: '#1e293b' },
  { name: 'Elegant Pink', primary: '#ffffff', secondary: '#fdf2f8', accent: '#ec4899', text: '#1e293b' },
  { name: 'Classic Gray', primary: '#ffffff', secondary: '#f8fafc', accent: '#64748b', text: '#1e293b' },
  { name: 'Modern Dark', primary: '#1e293b', secondary: '#0f172a', accent: '#38bdf8', text: '#f8fafc' },
];

interface ResumeColorCustomizerProps {
  initialColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  onChange?: (colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  }) => void;
  showPreview?: boolean;
}

const ResumeColorCustomizer: React.FC<ResumeColorCustomizerProps> = ({
  initialColors = {
    primary: '#ffffff',
    secondary: '#eff6ff',
    accent: '#3b82f6',
    text: '#1e293b'
  },
  onChange,
  showPreview = true
}) => {
  const [colors, setColors] = useState(initialColors);
  
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent' | 'text', value: string) => {
    const newColors = { ...colors, [colorType]: value };
    setColors(newColors);
    if (onChange) {
      onChange(newColors);
    }
  };
  
  const applyTheme = (theme: typeof colorThemes[0]) => {
    const newColors = {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      text: theme.text
    };
    setColors(newColors);
    if (onChange) {
      onChange(newColors);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Colors</CardTitle>
        <CardDescription>Customize the colors of your resume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="themes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="themes">Color Themes</TabsTrigger>
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="themes" className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Select a color theme</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-80 overflow-auto p-1">
                  {colorThemes.map((theme) => (
                    <div
                      key={theme.name}
                      className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
                      onClick={() => {
                        applyTheme(theme);
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{theme.name}</div>
                        <div className="flex mt-1 space-x-1">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.primary }}
                          ></div>
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.secondary }}
                          ></div>
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.accent }}
                          ></div>
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.text }}
                          ></div>
                        </div>
                      </div>
                      {colors.primary === theme.primary &&
                        colors.secondary === theme.secondary &&
                        colors.accent === theme.accent &&
                        colors.text === theme.text && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="grid grid-cols-4 gap-2">
              {colorThemes.slice(0, 8).map((theme) => (
                <Button
                  key={theme.name}
                  variant="outline"
                  className={cn(
                    "h-auto p-1 flex flex-col items-center border-2",
                    colors.primary === theme.primary &&
                    colors.secondary === theme.secondary &&
                    colors.accent === theme.accent &&
                    colors.text === theme.text
                      ? "border-blue-500"
                      : "border-transparent"
                  )}
                  onClick={() => applyTheme(theme)}
                >
                  <div className="flex w-full h-6 rounded overflow-hidden mb-1">
                    <div className="w-1/4" style={{ backgroundColor: theme.primary }}></div>
                    <div className="w-1/4" style={{ backgroundColor: theme.secondary }}></div>
                    <div className="w-1/4" style={{ backgroundColor: theme.accent }}></div>
                    <div className="w-1/4" style={{ backgroundColor: theme.text }}></div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Background Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
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
                  value={colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
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
                  value={colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="text-color"
                  type="color"
                  value={colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {showPreview && (
          <div className="mt-4">
            <Label>Preview</Label>
            <div className="mt-2 border rounded-md overflow-hidden">
              <div 
                className="p-4"
                style={{ backgroundColor: colors.primary, color: colors.text }}
              >
                <div className="text-lg font-bold mb-2">Resume Preview</div>
                <div 
                  className="h-1 w-20 mb-4"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <div 
                  className="p-3 mb-4 text-sm rounded"
                  style={{ backgroundColor: colors.secondary }}
                >
                  This is how your resume colors will look
                </div>
                <div className="flex space-x-2">
                  <Button
                    style={{ backgroundColor: colors.accent, color: '#fff' }}
                    className="text-xs h-8"
                  >
                    Primary Button
                  </Button>
                  <Button
                    variant="outline"
                    style={{ borderColor: colors.accent, color: colors.accent }}
                    className="text-xs h-8"
                  >
                    Secondary Button
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={() => {
            if (onChange) {
              onChange(colors);
            }
          }}
        >
          Apply Colors
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeColorCustomizer;