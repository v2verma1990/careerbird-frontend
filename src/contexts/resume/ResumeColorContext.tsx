import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the color theme type
export interface ResumeColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

// Default color theme
const defaultColorTheme: ResumeColorTheme = {
  primary: '#ffffff',
  secondary: '#eff6ff',
  accent: '#3b82f6',
  text: '#1e293b'
};

// Context type
interface ResumeColorContextType {
  colors: ResumeColorTheme;
  setColors: (colors: ResumeColorTheme) => void;
  resetColors: () => void;
}

// Create the context
const ResumeColorContext = createContext<ResumeColorContextType | undefined>(undefined);

// Provider props
interface ResumeColorProviderProps {
  children: ReactNode;
  initialColors?: ResumeColorTheme;
}

// Provider component
export const ResumeColorProvider: React.FC<ResumeColorProviderProps> = ({
  children,
  initialColors = defaultColorTheme
}) => {
  const [colors, setColorsState] = useState<ResumeColorTheme>(initialColors);

  const setColors = (newColors: ResumeColorTheme) => {
    setColorsState(newColors);
    // Optionally save to localStorage for persistence
    localStorage.setItem('resumeColors', JSON.stringify(newColors));
  };

  const resetColors = () => {
    setColorsState(defaultColorTheme);
    localStorage.removeItem('resumeColors');
  };

  return (
    <ResumeColorContext.Provider value={{ colors, setColors, resetColors }}>
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

// Hook to initialize colors from localStorage if available
export const useInitResumeColors = (): ResumeColorTheme => {
  try {
    const savedColors = localStorage.getItem('resumeColors');
    if (savedColors) {
      return JSON.parse(savedColors);
    }
  } catch (error) {
    console.error('Error loading saved resume colors:', error);
  }
  return defaultColorTheme;
};