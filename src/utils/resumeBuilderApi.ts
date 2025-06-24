import { supabase } from "@/integrations/supabase/client";


// Base URL for API calls
const determineApiBaseUrl = () => {

 // return "https://localhost:5001/api";// Lovable


  const isProduction = import.meta.env.PROD;
  
  const devBackendUrl = import.meta.env.VITE_API_URL;
  if (isProduction) {
    console.log(`in production: ${import.meta.env.VITE_API_URL}`);
    return '/api';
  } else if (devBackendUrl) {
  return devBackendUrl;
  } else {
  return "http://localhost:5001/api";
  }
};

// Set the API base URL
const API_BASE_URL = determineApiBaseUrl();
//const API_BASE_URL = "/api"; // Use relative URL for API calls to work in all environments

/**
 * Simple API client for resume builder operations
 */
export const resumeBuilderApi = {
  /**
   * Get available resume templates
   */
  getTemplates: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/resumebuilder/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: errorText };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Build a resume from data or file
   */
  buildResume: async (params: { 
    file?: File, 
    resumeData?: string, 
    templateId: string,
    color?: string, // Add color parameter
    enhanceWithAI?: boolean,
    premiumEnhancement?: boolean 
  }) => {
    try {
      // Validate required parameters
      if (!params.templateId) {
        return { data: null, error: "Missing required parameter: templateId" };
      }
      
      if (!params.file && !params.resumeData) {
        return { data: null, error: "Missing required parameter: file or resumeData" };
      }
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create form data
      const formData = new FormData();
      
      // Add template ID
      formData.append('templateId', params.templateId);
      
      // Add color parameter if provided
      if (params.color) {
        formData.append('color', params.color);
        console.log(`Adding color parameter to form data: ${params.color}`);
      }
      
      // Add AI enhancement flags
      if (params.enhanceWithAI) {
        formData.append('enhanceWithAI', 'true');
      }
      
      if (params.premiumEnhancement) {
        formData.append('premiumEnhancement', 'true');
      }
      
      // Add file if provided
      if (params.file) {
        formData.append('resumeFile', params.file);
      }
      
      // Add resume data if provided
      if (params.resumeData) {
        try {
          const parsedData = JSON.parse(params.resumeData);
          
          // Convert to lowercase field names for template compatibility
          const name = parsedData.Name || parsedData.name || "";
          
          // Generate initials from name for photo placeholder
          const generateInitials = (fullName: string, email?: string, title?: string): string => {
            // Try to get initials from full name first
            if (fullName && fullName.trim()) {
              const names = fullName.trim().split(/\s+/).filter(n => n.length > 0);
              if (names.length > 0) {
                if (names.length === 1) {
                  return names[0].substring(0, 2).toUpperCase();
                }
                return names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
              }
            }
            
            // Fallback to email if available
            if (email && email.includes('@')) {
              const emailPart = email.split('@')[0];
              if (emailPart.length >= 2) {
                return emailPart.substring(0, 2).toUpperCase();
              }
            }
            
            // Fallback to title if available
            if (title && title.trim()) {
              const titleWords = title.trim().split(/\s+/).filter(w => w.length > 0);
              if (titleWords.length > 0) {
                return titleWords[0].substring(0, 2).toUpperCase();
              }
            }
            
            // Final fallback
            return "??";
          };
          
          const email = parsedData.Email || parsedData.email || "";
          const title = parsedData.Title || parsedData.title || "";
          
          const formattedData = {
            name: name,
            initials: generateInitials(name, email, title),
            title: title,
            email: email,
            phone: parsedData.Phone || parsedData.phone || "",
            location: parsedData.Location || parsedData.location || "",
            linkedin: parsedData.LinkedIn || parsedData.linkedin || "",
            website: parsedData.Website || parsedData.website || "",
            summary: parsedData.Summary || parsedData.summary || "",
            photo: parsedData.Photo || parsedData.photo || "",
            skills: Array.isArray(parsedData.Skills) ? parsedData.Skills : 
                   (Array.isArray(parsedData.skills) ? parsedData.skills : []),
            experience: Array.isArray(parsedData.Experience) ? parsedData.Experience.map(exp => ({
                          title: exp.Title || exp.title || "",
                          company: exp.Company || exp.company || "",
                          location: exp.Location || exp.location || "",
                          startDate: exp.StartDate || exp.startDate || "",
                          endDate: exp.EndDate || exp.endDate || "",
                          description: exp.Description || exp.description || "",
                          projects: Array.isArray(exp.Projects) ? exp.Projects.map(proj => ({
                            name: proj.Name || proj.name || "",
                            description: proj.Description || proj.description || "",
                            technologies: proj.Technologies || proj.technologies || ""
                          })) : (Array.isArray(exp.projects) ? exp.projects.map(proj => ({
                            name: proj.Name || proj.name || "",
                            description: proj.Description || proj.description || "",
                            technologies: proj.Technologies || proj.technologies || ""
                          })) : [])
                        })) : 
                       (Array.isArray(parsedData.experience) ? parsedData.experience.map(exp => ({
                          title: exp.Title || exp.title || "",
                          company: exp.Company || exp.company || "",
                          location: exp.Location || exp.location || "",
                          startDate: exp.StartDate || exp.startDate || "",
                          endDate: exp.EndDate || exp.endDate || "",
                          description: exp.Description || exp.description || "",
                          projects: Array.isArray(exp.Projects) ? exp.Projects.map(proj => ({
                            name: proj.Name || proj.name || "",
                            description: proj.Description || proj.description || "",
                            technologies: proj.Technologies || proj.technologies || ""
                          })) : (Array.isArray(exp.projects) ? exp.projects.map(proj => ({
                            name: proj.Name || proj.name || "",
                            description: proj.Description || proj.description || "",
                            technologies: proj.Technologies || proj.technologies || ""
                          })) : [])
                        })) : []),
            education: Array.isArray(parsedData.Education) ? parsedData.Education.map(edu => ({
                         degree: edu.Degree || edu.degree || "",
                         institution: edu.Institution || edu.institution || "",
                         location: edu.Location || edu.location || "",
                         startDate: edu.StartDate || edu.startDate || "",
                         endDate: edu.EndDate || edu.endDate || "",
                         gpa: edu.GPA || edu.gpa || ""
                       })) : 
                      (Array.isArray(parsedData.education) ? parsedData.education.map(edu => ({
                         degree: edu.Degree || edu.degree || "",
                         institution: edu.Institution || edu.institution || "",
                         location: edu.Location || edu.location || "",
                         startDate: edu.StartDate || edu.startDate || "",
                         endDate: edu.EndDate || edu.endDate || "",
                         gpa: edu.GPA || edu.gpa || ""
                       })) : []),
            certifications: Array.isArray(parsedData.Certifications) ? parsedData.Certifications.map(cert => ({
                              name: cert.Name || cert.name || "",
                              issuer: cert.Issuer || cert.issuer || "",
                              date: cert.Date || cert.date || ""
                            })) : 
                           (Array.isArray(parsedData.certifications) ? parsedData.certifications.map(cert => ({
                              name: cert.Name || cert.name || "",
                              issuer: cert.Issuer || cert.issuer || "",
                              date: cert.Date || cert.date || ""
                            })) : []),
            projects: Array.isArray(parsedData.Projects) ? parsedData.Projects.map(proj => ({
                        name: proj.Name || proj.name || "",
                        description: proj.Description || proj.description || "",
                        technologies: proj.Technologies || proj.technologies || ""
                      })) : 
                     (Array.isArray(parsedData.projects) ? parsedData.projects.map(proj => ({
                        name: proj.Name || proj.name || "",
                        description: proj.Description || proj.description || "",
                        technologies: proj.Technologies || proj.technologies || ""
                      })) : []),
            achievements: Array.isArray(parsedData.Achievements) ? parsedData.Achievements : 
                         (Array.isArray(parsedData.achievements) ? parsedData.achievements : []),
            references: Array.isArray(parsedData.References) ? parsedData.References.map(ref => ({
                          name: ref.Name || ref.name || "",
                          title: ref.Title || ref.title || "",
                          contact: ref.Contact || ref.contact || ""
                        })) : 
                       (Array.isArray(parsedData.references) ? parsedData.references.map(ref => ({
                          name: ref.Name || ref.name || "",
                          title: ref.Title || ref.title || "",
                          contact: ref.Contact || ref.contact || ""
                        })) : []),
            color: parsedData.Color || parsedData.color || ""
          };
          
          console.log('=== OLD RESUME BUILDER API DATA TRANSFORMATION ===');
          console.log('Original parsed data:', parsedData);
          console.log('Formatted data:', formattedData);
          //console.log('Formatted Experience:', formattedData.Experience);
          //console.log('Formatted Education:', formattedData.Education);
          console.log('Final JSON being sent:', JSON.stringify(formattedData, null, 2));
          
          formData.append('resumeData', JSON.stringify(formattedData));
        } catch (error) {
          // If parsing fails, use the original data
          formData.append('resumeData', params.resumeData);
        }
      }
      
      // Set headers
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      // Make the request
      const response = await fetch(`${API_BASE_URL}/resumebuilder/build`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: "include"
      });
      
      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: errorText };
      }
      
      // Get response text
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const responseData = JSON.parse(responseText);
        return { data: responseData, error: null };
      } catch (error) {
        // If not JSON, return as HTML
        return { data: { html: responseText, data: {} }, error: null };
      }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Optimize a resume
   */
  optimizeResume: async (params: { resumeData: string, templateId: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/resumebuilder/optimize`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: errorText };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Generate PDF from complete HTML + CSS 
   * Calls backend /resumebuilder/generate-pdf endpoint
   */
  generatePDF: async (params: { 
    html: string, 
    css: string, 
    filename: string,
    templateId: string,
    color: string 
  }) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Set headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      // Make the request using dynamic API base URL
      const response = await fetch(`${API_BASE_URL}/resumebuilder/generate-pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: errorText || `HTTP ${response.status}` };
      }
      
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Generate PDF directly from resume data (TWO-STEP PROCESS)
   * 1. First build the resume to get HTML/CSS
   * 2. Then generate PDF from the HTML/CSS
   */
  generatePDFFromData: async function(params: { 
    resumeData: any, 
    templateId: string,
    color: string,
    filename: string 
  }) {
    try {
      console.log('generatePDFFromData - Starting two-step process');
      
      // Step 1: Build the resume to get HTML/CSS
      const buildResult = await this.buildResume({
        resumeData: typeof params.resumeData === 'string' ? params.resumeData : JSON.stringify(params.resumeData),
        templateId: params.templateId,
        color: params.color
      });
      
      if (buildResult.error) {
        return { data: null, error: `Failed to build resume: ${buildResult.error}` };
      }
      
      if (!buildResult.data) {
        return { data: null, error: 'No data received from resume build' };
      }
      
      // Extract HTML and CSS from the build result
      let html = '';
      let css = '';
      
      if (typeof buildResult.data === 'string') {
        // If the response is HTML string, extract CSS from it
        html = buildResult.data;
        
        // Extract CSS from <style> tags in the HTML
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        const cssMatches = [];
        let match;
        
        while ((match = styleRegex.exec(html)) !== null) {
          cssMatches.push(match[1]);
        }
        
        css = cssMatches.join('\n');
        
        console.log('generatePDFFromData - Extracted CSS from HTML:', {
          htmlLength: html.length,
          cssLength: css.length,
          cssPreview: css.substring(0, 200) + '...'
        });
        
        // If no CSS was found in style tags, the HTML might have embedded styles
        if (!css.trim()) {
          console.log('generatePDFFromData - No CSS found in <style> tags, HTML might have inline styles');
          // In this case, we'll send the HTML as-is and let the backend handle it
        }
      } else if (buildResult.data.html) {
        // If the response has html property
        html = buildResult.data.html;
        css = buildResult.data.css || '';
      } else {
        return { data: null, error: 'Invalid response format from resume build' };
      }
      
      console.log('generatePDFFromData - Got HTML/CSS, generating PDF');
      
      // Step 2: Generate PDF from HTML/CSS
      const pdfResult = await this.generatePDF({
        html: html,
        css: css,
        filename: params.filename,
        templateId: params.templateId,
        color: params.color
      });
      
      return pdfResult;
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

// Export as default for backward compatibility
export default resumeBuilderApi;
