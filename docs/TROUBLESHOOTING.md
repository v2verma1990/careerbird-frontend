# Troubleshooting Guide

## 🚨 Common Issues and Solutions

## 🎨 Color-Related Issues

### Issue: Colors Not Updating in Preview

#### Symptoms
- Color picker changes but preview stays the same
- Old colors showing despite new selection

#### Diagnosis
```typescript
// Check if cache clearing is working
const { clearAllColorCaches } = useResumeColors();
console.log('Clearing caches manually...');
clearAllColorCaches();
```

#### Solutions

1. **Manual Cache Clear**
```typescript
// Force clear all caches
const { clearAllColorCaches } = useResumeColors();
clearAllColorCaches();

// Force fresh render
const rendered = await templateRenderingService.renderResume({
  templateId,
  resumeData,
  color: newColor,
  forceRefresh: true
});
```

2. **Check Color Context Setup**
```typescript
// Ensure ResumeColorProvider is wrapping your app
// App.tsx
<ResumeColorProvider>
  <YourApp />
</ResumeColorProvider>
```

3. **Verify Template Support**
```typescript
// Check if template supports dynamic CSS
const supportedTemplates = ['navy-column-modern', 'modern-executive'];
if (!supportedTemplates.includes(templateId)) {
  console.warn(`Template ${templateId} does not support dynamic CSS generation`);
}
```

### Issue: Colors Persisting After PDF Download

#### Symptoms
- Colors remain in cache after PDF download
- Next preview shows old colors

#### Solution
```typescript
// Ensure cleanup after PDF download
const downloadAsPdf = async () => {
  try {
    // ... PDF generation logic ...
    
    // Download PDF
    const response = await api.resumeBuilder.downloadResume({...});
    
    // ... download logic ...
    
  } finally {
    // CRITICAL: Clear all caches after PDF download
    clearAllColorCaches();
    console.log('Caches cleared after PDF download');
  }
};
```

### Issue: Preview and PDF Colors Don't Match

#### Symptoms
- Preview shows one color
- PDF shows different color

#### Diagnosis
```typescript
// Compare render results
const preview = await templateRenderingService.getRenderedTemplateForPreview(
  templateId, resumeData, color
);

const pdf = await templateRenderingService.getRenderedTemplateForPDF(
  templateId, resumeData, color
);

console.log('Preview CSS contains color:', preview.css.includes(color));
console.log('PDF CSS contains color:', pdf.css.includes(color));
```

#### Solutions

1. **Force Fresh Render for Both**
```typescript
// Clear cache first
clearAllColorCaches();

// Get fresh renders
const preview = await templateRenderingService.renderResume({
  templateId, resumeData, color, forceRefresh: true
});

const pdf = await templateRenderingService.renderResume({
  templateId, resumeData, color, forceRefresh: true
});
```

2. **Check Backend CSS Generation**
```csharp
// Backend: Ensure CSS contains the color
private string GenerateNavyColumnModernCss(string templateColor)
{
    // Verify color is being injected
    Console.WriteLine($"Generating CSS with color: {templateColor}");
    
    return $@"
    .sidebar {{
      background: {templateColor} !important;
    }}";
}
```

## 🖼️ Template-Related Issues

### Issue: Template Not Found Error

#### Symptoms
- Error: "Template 'template-name' not found"
- Preview fails to load

#### Diagnosis
```typescript
// Check template support
const checkTemplateSupport = async (templateId: string) => {
  try {
    const css = await templateRenderingService.getTemplateCss(templateId, '#000000');
    console.log('Template CSS generation: ✅ Supported');
  } catch (error) {
    console.log('Template CSS generation: ❌ Not supported');
    console.error(error);
  }
};
```

#### Solutions

1. **Use Supported Template**
```typescript
// Fallback to supported template
const supportedTemplates = ['navy-column-modern', 'modern-executive'];
const templateToUse = supportedTemplates.includes(templateId) 
  ? templateId 
  : 'navy-column-modern';
```

2. **Add Template Support (Backend)**
```csharp
// Add to TemplateService.cs
case "your-template-id":
    return GenerateYourTemplateCss(templateColor);
```

### Issue: Template HTML Missing

#### Symptoms
- Empty preview
- HTML generation fails

#### Diagnosis
```typescript
// Check if HTML file exists
const response = await fetch(`/api/template/${templateId}/html`);
if (!response.ok) {
  console.error(`HTML template not found: ${templateId}`);
}
```

#### Solution
```typescript
// Verify HTML file exists in backend
// backend/ResumeAI.API/html/{templateId}.html
```

## 🔄 Rendering Issues

### Issue: Preview Not Loading

#### Symptoms
- Infinite loading spinner
- No preview content

#### Diagnosis
```typescript
// Check rendering service
const debugRender = async () => {
  try {
    console.log('Starting render debug...');
    
    const rendered = await templateRenderingService.getRenderedTemplateForPreview(
      templateId, resumeData, color
    );
    
    console.log('Render successful:', {
      hasHtml: !!rendered.html,
      hasCss: !!rendered.css,
      htmlLength: rendered.html.length,
      cssLength: rendered.css.length
    });
    
  } catch (error) {
    console.error('Render failed:', error);
  }
};
```

#### Solutions

1. **Check Resume Data**
```typescript
// Ensure resume data is valid
if (!resumeData || Object.keys(resumeData).length === 0) {
  console.error('Resume data is empty or invalid');
  return;
}
```

2. **Check Network Connectivity**
```typescript
// Test backend connectivity
const testBackend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    console.log('Backend status:', response.status);
  } catch (error) {
    console.error('Backend unreachable:', error);
  }
};
```

3. **Clear All Caches and Retry**
```typescript
// Nuclear option - clear everything
const resetEverything = async () => {
  // Clear service caches
  templateRenderingService.clearAllCaches();
  
  // Clear browser storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reload page
  window.location.reload();
};
```

### Issue: Slow Rendering Performance

#### Symptoms
- Long loading times
- UI freezing during render

#### Diagnosis
```typescript
// Measure render performance
const measureRenderTime = async () => {
  const startTime = performance.now();
  
  const rendered = await templateRenderingService.getRenderedTemplateForPreview(
    templateId, resumeData, color
  );
  
  const endTime = performance.now();
  console.log(`Render time: ${endTime - startTime}ms`);
  
  return rendered;
};
```

#### Solutions

1. **Check Cache Hit Rate**
```typescript
// Monitor cache usage
const cacheKey = `${templateId}_${color}`;
console.log('Cache key:', cacheKey);
console.log('Cache size:', templateRenderingService.getCacheSize());
```

2. **Optimize Resume Data**
```typescript
// Reduce data size
const optimizeResumeData = (data) => {
  // Remove unnecessary fields
  const optimized = { ...data };
  delete optimized.largeUnusedField;
  
  // Truncate long descriptions
  if (optimized.Summary && optimized.Summary.length > 1000) {
    optimized.Summary = optimized.Summary.substring(0, 1000) + '...';
  }
  
  return optimized;
};
```

## 📱 UI/UX Issues

### Issue: Color Picker Not Responding

#### Symptoms
- Clicking colors doesn't change preview
- No visual feedback

#### Diagnosis
```typescript
// Check color picker integration
const debugColorPicker = (templateId: string, newColor: string) => {
  console.log('Color picker clicked:', { templateId, newColor });
  
  const { setTemplateColor, getTemplateColor } = useResumeColors();
  
  console.log('Current color:', getTemplateColor(templateId));
  setTemplateColor(templateId, newColor);
  console.log('New color:', getTemplateColor(templateId));
};
```

#### Solutions

1. **Check Template Color Configuration**
```typescript
// Verify template has available colors
const template = RESUME_TEMPLATES.find(t => t.id === templateId);
if (!template?.availableColors) {
  console.error('Template has no available colors defined');
}
```

2. **Ensure Proper Event Handling**
```typescript
// Color picker component
const ColorPicker = ({ templateId }) => {
  const { setTemplateColor, getTemplateColor } = useResumeColors();
  
  const handleColorClick = (color) => {
    console.log('Setting color:', color);
    setTemplateColor(templateId, color);
  };
  
  return (
    <div>
      {availableColors.map(color => (
        <button
          key={color}
          onClick={() => handleColorClick(color)}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
```

### Issue: Refresh Button Not Working

#### Symptoms
- Refresh button doesn't update preview
- No loading state

#### Solution
```typescript
// Proper refresh implementation
const refreshPreview = async () => {
  if (!resumeData) return;
  
  setIsRefreshing(true);
  try {
    // Clear all caches first
    clearAllColorCaches();
    
    // Force fresh render
    const rendered = await templateRenderingService.getRenderedTemplateForPreview(
      template,
      resumeData,
      selectedColor
    );
    
    setRenderedTemplate(rendered);
    templateRenderingService.applyStylesToDOM(rendered.css, template);
    
  } catch (error) {
    console.error('Refresh failed:', error);
    toast({
      title: "Refresh Failed",
      description: "Failed to refresh preview. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsRefreshing(false);
  }
};
```

## 🔧 Development Issues

### Issue: Hot Reload Breaking State

#### Symptoms
- Colors reset during development
- Cache state lost on file changes

#### Solution
```typescript
// Persist state during development
const useDevPersistence = () => {
  useEffect(() => {
    // Save state before hot reload
    const handleBeforeUnload = () => {
      const state = {
        templateColors: templateColors,
        selectedTemplate: selectedTemplate
      };
      sessionStorage.setItem('devState', JSON.stringify(state));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Restore state after hot reload
    const savedState = sessionStorage.getItem('devState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Restore state...
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};
```

### Issue: TypeScript Errors

#### Common TypeScript Issues

1. **Missing Type Definitions**
```typescript
// Add proper types
interface RenderedTemplate {
  html: string;
  css: string;
  fullHtml: string;
  templateId: string;
  color: string;
  timestamp: number;
}
```

2. **Context Type Issues**
```typescript
// Proper context typing
const useResumeColors = (): ResumeColorContextType => {
  const context = useContext(ResumeColorContext);
  if (context === undefined) {
    throw new Error('useResumeColors must be used within a ResumeColorProvider');
  }
  return context;
};
```

## 🌐 Network Issues

### Issue: API Timeouts

#### Symptoms
- Requests taking too long
- Timeout errors

#### Solutions

1. **Increase Timeout**
```typescript
// Increase fetch timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

2. **Retry Logic**
```typescript
// Add retry mechanism
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Issue: CORS Errors

#### Symptoms
- Cross-origin request blocked
- Network errors in browser console

#### Solution
```typescript
// Check API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
console.log('API Base URL:', API_BASE_URL);

// Ensure backend CORS is configured
// Backend: Program.cs or Startup.cs
app.UseCors(builder => 
  builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader()
);
```

## 🧪 Testing Issues

### Issue: Tests Failing After Migration

#### Common Test Fixes

1. **Mock Template Service**
```typescript
// Mock the new service
jest.mock('@/services/templateRenderingService', () => ({
  templateRenderingService: {
    getRenderedTemplateForPreview: jest.fn(),
    getRenderedTemplateForPDF: jest.fn(),
    clearAllCaches: jest.fn(),
    applyStylesToDOM: jest.fn()
  }
}));
```

2. **Mock Color Context**
```typescript
// Mock color context
const mockUseResumeColors = {
  setTemplateColor: jest.fn(),
  getTemplateColor: jest.fn(() => '#315389'),
  clearAllColorCaches: jest.fn()
};

jest.mock('@/contexts/resume/ResumeColorContext', () => ({
  useResumeColors: () => mockUseResumeColors
}));
```

## 📊 Monitoring and Debugging

### Debug Logging

```typescript
// Enable debug logging
const DEBUG = import.meta.env.DEV;

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Use throughout the application
debugLog('Template rendering started', { templateId, color });
```

### Performance Monitoring

```typescript
// Monitor render performance
const performanceMonitor = {
  startTimer: (name: string) => {
    performance.mark(`${name}-start`);
  },
  
  endTimer: (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name} took ${measure.duration}ms`);
  }
};

// Usage
performanceMonitor.startTimer('template-render');
await templateRenderingService.getRenderedTemplateForPreview(...);
performanceMonitor.endTimer('template-render');
```

## 🆘 Getting Help

### When to Contact Support

1. **Backend Template Issues**: CSS generation not working for supported templates
2. **Performance Issues**: Render times > 5 seconds consistently
3. **Data Loss**: Resume data or colors being lost unexpectedly
4. **Browser Compatibility**: Issues in specific browsers

### Information to Provide

```typescript
// Collect debug information
const collectDebugInfo = () => {
  return {
    // Environment
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    
    // Application state
    templateId: selectedTemplate,
    color: getTemplateColor(selectedTemplate),
    hasResumeData: !!resumeData,
    
    // Cache state
    cacheSize: templateRenderingService.getCacheSize?.() || 'unknown',
    
    // Error details
    lastError: lastError?.message,
    stackTrace: lastError?.stack
  };
};
```

### Self-Help Checklist

Before contacting support:

- [ ] Clear browser cache and cookies
- [ ] Try in incognito/private mode
- [ ] Test with different template
- [ ] Check browser console for errors
- [ ] Verify internet connection
- [ ] Try manual cache clear
- [ ] Check if issue persists across page reloads