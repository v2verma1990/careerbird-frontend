import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { templateRenderingService } from '@/services/templateRenderingService';

// Centralized Template Color Management System
export interface TemplateColorState {
  [templateId: string]: string;
}

// Context type
interface ResumeColorContextType {
  templateColors: TemplateColorState;
  selectedTemplate: string;
  setSelectedTemplate: (templateId: string) => void;
  setTemplateColor: (templateId: string, color: string) => void;
  getTemplateColor: (templateId: string) => string;
  clearAllColorCaches: () => void;
  resetAllColors: () => void;
}

// Create the context
const ResumeColorContext = createContext<ResumeColorContextType | undefined>(undefined);

// Provider props
interface ResumeColorProviderProps {
  children: ReactNode;
}

// Default colors for templates
const DEFAULT_TEMPLATE_COLORS: TemplateColorState = {
  'navy-column-modern': '#315389',
  'modern-executive': '#2196F3',
  'classic-professional': '#000000',
  'creative-modern': '#18bc6b',
  'minimal-clean': '#a4814c'
};

// Provider component
export const ResumeColorProvider: React.FC<ResumeColorProviderProps> = ({ children }) => {
  const [templateColors, setTemplateColorsState] = useState<TemplateColorState>(() => {
    // Initialize from localStorage if available
    try {
      const saved = localStorage.getItem('templateColors');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_TEMPLATE_COLORS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading saved template colors:', error);
    }
    return DEFAULT_TEMPLATE_COLORS;
  });

  const [selectedTemplate, setSelectedTemplateState] = useState<string>(() => {
    try {
      return localStorage.getItem('selectedTemplate') || 'navy-column-modern';
    } catch (error) {
      console.error('Error loading selected template:', error);
      return 'navy-column-modern';
    }
  });

  const setSelectedTemplate = useCallback((templateId: string) => {
    console.log('ResumeColorContext: Setting selected template:', templateId);
    setSelectedTemplateState(templateId);
    localStorage.setItem('selectedTemplate', templateId);
  }, []);

  const setTemplateColor = useCallback((templateId: string, color: string) => {
    console.log('ResumeColorContext: Setting color for template', templateId, ':', color);
    
    // Clear all caches when color changes to force fresh rendering
    templateRenderingService.clearAllCaches();
    
    setTemplateColorsState(prev => {
      const newColors = { ...prev, [templateId]: color };
      
      // Save to localStorage
      localStorage.setItem('templateColors', JSON.stringify(newColors));
      
      console.log('ResumeColorContext: Updated template colors:', newColors);
      return newColors;
    });
  }, []);

  const getTemplateColor = useCallback((templateId: string): string => {
    return templateColors[templateId] || DEFAULT_TEMPLATE_COLORS[templateId] || '#315389';
  }, [templateColors]);

  const clearAllColorCaches = useCallback(() => {
    console.log('ResumeColorContext: Clearing all color caches');
    templateRenderingService.clearAllCaches();
  }, []);

  const resetAllColors = useCallback(() => {
    console.log('ResumeColorContext: Resetting all colors to defaults');
    setTemplateColorsState(DEFAULT_TEMPLATE_COLORS);
    localStorage.removeItem('templateColors');
    templateRenderingService.clearAllCaches();
  }, []);

  const contextValue: ResumeColorContextType = {
    templateColors,
    selectedTemplate,
    setSelectedTemplate,
    setTemplateColor,
    getTemplateColor,
    clearAllColorCaches,
    resetAllColors
  };

  return (
    <ResumeColorContext.Provider value={contextValue}>
      {children}
    </ResumeColorContext.Provider>
  );
};

// Custom hook to use the resume color context
export const useResumeColors = (): ResumeColorContextType => {
  const context = useContext(ResumeColorContext);
  if (context === undefined) {
    throw new Error('useResumeColors must be used within a ResumeColorProvider');
  }
  return context;
};