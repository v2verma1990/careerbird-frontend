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
          
          // Convert to PascalCase if needed
          const formattedData = {
            Name: parsedData.Name || parsedData.name || "",
            Title: parsedData.Title || parsedData.title || "",
            Email: parsedData.Email || parsedData.email || "",
            Phone: parsedData.Phone || parsedData.phone || "",
            Location: parsedData.Location || parsedData.location || "",
            LinkedIn: parsedData.LinkedIn || parsedData.linkedin || "",
            Website: parsedData.Website || parsedData.website || "",
            Summary: parsedData.Summary || parsedData.summary || "",
            Skills: Array.isArray(parsedData.Skills) ? parsedData.Skills : 
                   (Array.isArray(parsedData.skills) ? parsedData.skills : []),
            Experience: Array.isArray(parsedData.Experience) ? parsedData.Experience : 
                       (Array.isArray(parsedData.experience) ? parsedData.experience.map(exp => ({
                          Title: exp.Title || exp.title || "",
                          Company: exp.Company || exp.company || "",
                          Location: exp.Location || exp.location || "",
                          StartDate: exp.StartDate || exp.startDate || "",
                          EndDate: exp.EndDate || exp.endDate || "",
                          Description: exp.Description || exp.description || ""
                        })) : []),
            Education: Array.isArray(parsedData.Education) ? parsedData.Education : 
                      (Array.isArray(parsedData.education) ? parsedData.education.map(edu => ({
                         Degree: edu.Degree || edu.degree || "",
                         Institution: edu.Institution || edu.institution || "",
                         Location: edu.Location || edu.location || "",
                         StartDate: edu.StartDate || edu.startDate || "",
                         EndDate: edu.EndDate || edu.endDate || "",
                         GPA: edu.GPA || edu.gpa || ""
                       })) : []),
            Certifications: Array.isArray(parsedData.Certifications) ? parsedData.Certifications : 
                           (Array.isArray(parsedData.certifications) ? parsedData.certifications.map(cert => ({
                              Name: cert.Name || cert.name || "",
                              Issuer: cert.Issuer || cert.issuer || "",
                              Date: cert.Date || cert.date || ""
                            })) : []),
            Projects: Array.isArray(parsedData.Projects) ? parsedData.Projects : 
                     (Array.isArray(parsedData.projects) ? parsedData.projects.map(proj => ({
                        Name: proj.Name || proj.name || "",
                        Description: proj.Description || proj.description || "",
                        Technologies: proj.Technologies || proj.technologies || ""
                      })) : [])
          };
          
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
  }
};

// Export as default for backward compatibility
export default resumeBuilderApi;
