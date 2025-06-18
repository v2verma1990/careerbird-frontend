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
          const formattedData = {
            name: parsedData.Name || parsedData.name || "",
            title: parsedData.Title || parsedData.title || "",
            email: parsedData.Email || parsedData.email || "",
            phone: parsedData.Phone || parsedData.phone || "",
            location: parsedData.Location || parsedData.location || "",
            linkedin: parsedData.LinkedIn || parsedData.linkedin || "",
            website: parsedData.Website || parsedData.website || "",
            summary: parsedData.Summary || parsedData.summary || "",
            skills: Array.isArray(parsedData.Skills) ? parsedData.Skills : 
                   (Array.isArray(parsedData.skills) ? parsedData.skills : []),
            experience: Array.isArray(parsedData.Experience) ? parsedData.Experience.map(exp => ({
                          title: exp.Title || exp.title || "",
                          company: exp.Company || exp.company || "",
                          location: exp.Location || exp.location || "",
                          startDate: exp.StartDate || exp.startDate || "",
                          endDate: exp.EndDate || exp.endDate || "",
                          description: exp.Description || exp.description || ""
                        })) : 
                       (Array.isArray(parsedData.experience) ? parsedData.experience.map(exp => ({
                          title: exp.Title || exp.title || "",
                          company: exp.Company || exp.company || "",
                          location: exp.Location || exp.location || "",
                          startDate: exp.StartDate || exp.startDate || "",
                          endDate: exp.EndDate || exp.endDate || "",
                          description: exp.Description || exp.description || ""
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
  }
};

// Export as default for backward compatibility
export default resumeBuilderApi;
