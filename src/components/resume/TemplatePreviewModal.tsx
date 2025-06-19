import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Palette, Download, Eye } from "lucide-react";

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

interface TemplatePreviewModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string, selectedColor: string) => void;
  sampleData: any;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelectTemplate,
  sampleData
}) => {
  const [selectedColor, setSelectedColor] = useState('#3e88cf');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Color palette for customization
  const colorOptions = [
    { name: 'Blue', value: '#3e88cf', class: 'bg-blue-500' },
    { name: 'Navy', value: '#1e3a8a', class: 'bg-blue-900' },
    { name: 'Green', value: '#059669', class: 'bg-green-600' },
    { name: 'Teal', value: '#0d9488', class: 'bg-teal-600' },
    { name: 'Purple', value: '#7c3aed', class: 'bg-purple-600' },
    { name: 'Pink', value: '#db2777', class: 'bg-pink-600' },
    { name: 'Orange', value: '#ea580c', class: 'bg-orange-600' },
    { name: 'Red', value: '#dc2626', class: 'bg-red-600' },
    { name: 'Gray', value: '#4b5563', class: 'bg-gray-600' },
    { name: 'Black', value: '#1f2937', class: 'bg-gray-800' }
  ];

  // Function to compile Handlebars-like templates with sample data
  const compileTemplate = (html: string, data: any, color: string) => {
    if (!data || !html) return html;

    let compiledHtml = html;

    try {
      // Apply color customization by replacing the {{color}} placeholder
      compiledHtml = compiledHtml.replace(/\{\{color\}\}/g, color);
      compiledHtml = compiledHtml.replace(/\{\{Color\}\}/g, color);
      
      // Handle conditional color syntax: {{#if Color}}{{Color}}{{else}}#defaultcolor{{/if}}
      const colorConditionalRegex = /\{\{#if Color\}\}\{\{Color\}\}\{\{else\}\}([^}]+)\{\{\/if\}\}/g;
      compiledHtml = compiledHtml.replace(colorConditionalRegex, color);
      
      // Handle color with opacity: {{#if Color}}{{Color}}20{{else}}#defaultcolor{{/if}}
      const colorOpacityRegex = /\{\{#if Color\}\}\{\{Color\}\}(\d+)\{\{else\}\}([^}]+)\{\{\/if\}\}/g;
      compiledHtml = compiledHtml.replace(colorOpacityRegex, (match, opacity, defaultColor) => {
        return color + opacity;
      });
      
      // Also replace common default colors that might be hardcoded
      compiledHtml = compiledHtml.replace(/#3e88cf/g, color);
      compiledHtml = compiledHtml.replace(/#2477ab/g, color);
      compiledHtml = compiledHtml.replace(/#3293d3/g, color);
      compiledHtml = compiledHtml.replace(/#2867c6/g, color);
      compiledHtml = compiledHtml.replace(/#213046/g, color);
      compiledHtml = compiledHtml.replace(/#153559/g, color);
      compiledHtml = compiledHtml.replace(/#4a5db8/g, color);
      compiledHtml = compiledHtml.replace(/#6366f1/g, color);
      compiledHtml = compiledHtml.replace(/#1e40af/g, color);

      // Replace simple variables
      compiledHtml = compiledHtml
        .replace(/\{\{Name\}\}/g, data.Name || '')
        .replace(/\{\{Title\}\}/g, data.Title || '')
        .replace(/\{\{Email\}\}/g, data.Email || '')
        .replace(/\{\{Phone\}\}/g, data.Phone || '')
        .replace(/\{\{Location\}\}/g, data.Location || '')
        .replace(/\{\{LinkedIn\}\}/g, data.LinkedIn || '')
        .replace(/\{\{Website\}\}/g, data.Website || '')
        .replace(/\{\{Summary\}\}/g, data.Summary || '');

      // Handle experience section
      if (data.Experience && data.Experience.length > 0) {
        const experienceRegex = /\{\{#each experience\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(experienceRegex, (match, template) => {
          return data.Experience.map((exp: any) => {
            return template
              .replace(/\{\{title\}\}/g, exp.Title || '')
              .replace(/\{\{company\}\}/g, exp.Company || '')
              .replace(/\{\{location\}\}/g, exp.Location || '')
              .replace(/\{\{startDate\}\}/g, exp.StartDate || '')
              .replace(/\{\{endDate\}\}/g, exp.EndDate || '')
              .replace(/\{\{description\}\}/g, exp.Description ? 
                exp.Description.split('\n').map((line: string) => `<li>${line}</li>`).join('') : '');
          }).join('');
        });
      }

      // Handle education section
      if (data.Education && data.Education.length > 0) {
        const educationRegex = /\{\{#each education\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(educationRegex, (match, template) => {
          return data.Education.map((edu: any) => {
            return template
              .replace(/\{\{degree\}\}/g, edu.Degree || '')
              .replace(/\{\{institution\}\}/g, edu.Institution || '')
              .replace(/\{\{location\}\}/g, edu.Location || '')
              .replace(/\{\{startDate\}\}/g, edu.StartDate || '')
              .replace(/\{\{endDate\}\}/g, edu.EndDate || '');
          }).join('');
        });
      }

      // Handle skills section
      if (data.Skills && data.Skills.length > 0) {
        const skillsRegex = /\{\{#each skills\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(skillsRegex, (match, template) => {
          return data.Skills.map((skill: string) => {
            return template.replace(/\{\{this\}\}/g, skill);
          }).join('');
        });
      }

      // Handle certifications
      if (data.Certifications && data.Certifications.length > 0) {
        const certificationsRegex = /\{\{#each certifications\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(certificationsRegex, (match, template) => {
          return data.Certifications.map((cert: any) => {
            return template
              .replace(/\{\{name\}\}/g, cert.Name || '')
              .replace(/\{\{issuer\}\}/g, cert.Issuer || '')
              .replace(/\{\{date\}\}/g, cert.Date || '');
          }).join('');
        });
      }

      // Handle projects
      if (data.Projects && data.Projects.length > 0) {
        const projectsRegex = /\{\{#each projects\}\}([\s\S]*?)\{\{\/each\}\}/g;
        compiledHtml = compiledHtml.replace(projectsRegex, (match, template) => {
          return data.Projects.map((project: any) => {
            return template
              .replace(/\{\{name\}\}/g, project.Name || '')
              .replace(/\{\{date\}\}/g, project.Date || '')
              .replace(/\{\{description\}\}/g, project.Description || '');
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
        .replace(/\{\{[^}]*\}\}/g, '');

      return compiledHtml;
    } catch (error) {
      console.error('Error compiling template:', error);
      return html;
    }
  };

  // Load and compile template when modal opens or color changes
  useEffect(() => {
    if (isOpen && template && sampleData) {
      setIsLoading(true);
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/resume-templates/html/${template.id}.html`);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`);
          }
          const html = await response.text();
          const compiledHtml = compileTemplate(html, sampleData, selectedColor);
          setTemplateHtml(compiledHtml);
        } catch (error) {
          console.error('Failed to load template:', error);
          setTemplateHtml('<p class="text-center text-red-500">Failed to load template preview</p>');
        } finally {
          setIsLoading(false);
        }
      };
      loadTemplate();
    }
  }, [isOpen, template, sampleData, selectedColor]);

  const handleSelectTemplate = () => {
    onSelectTemplate(template.id, selectedColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex">
        {/* Left Panel - Controls */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Template Preview</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            {/* Template badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {template.isRecommended && (
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                  Recommended
                </span>
              )}
              {template.isPopular && (
                <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">
                  Popular
                </span>
              )}
              {template.isNew && (
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                  New
                </span>
              )}
              {template.isPremium && (
                <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                  Premium
                </span>
              )}
            </div>
          </div>

          {/* Color Customization */}
          <div className="p-6 flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Customize Colors</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Choose a color scheme for your resume template
              </p>
              <div className="grid grid-cols-5 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-10 h-10 rounded-lg transition-all duration-200 ${color.class} ${
                      selectedColor === color.value
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Selected: {colorOptions.find(c => c.value === selectedColor)?.name || 'Custom'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Color: {selectedColor}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-3">
              <Button
                onClick={handleSelectTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Use This Template
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Live Preview</span>
              </div>
              <div className="text-xs text-gray-500">
                Sample data is used for preview
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="bg-white rounded-lg shadow-lg p-8 flex items-center justify-center min-h-[600px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading template preview...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div 
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: templateHtml }}
                    style={{ 
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.6',
                      color: '#333'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;