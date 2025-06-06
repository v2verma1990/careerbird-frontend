import { supabase } from "@/integrations/supabase/client";

// Base URL for API calls
const API_BASE_URL = "https://localhost:5001/api"; // Local development URL

// Flag to check if backend is running - we'll attempt to detect this dynamically
export const IS_BACKEND_RUNNING = true; // Default to true, but will check if needed

// Helper function for API call availability check
export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("Backend check failed, assuming backend is not available:", error);
    return false;
  }
}

// Helper function for API calls
async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: any,
  customHeaders: Record<string, string> = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Get the current session from Supabase for the auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Prepare headers with authentication token from Supabase session
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders
    };
    
    // Add authorization header if session exists
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
      console.log(`Using auth token: ${session.access_token.substring(0, 20)}...`);
    } else {
      console.warn("No auth token available for API call to:", endpoint);
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: "include" // Include cookies in requests
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    console.log(`API ${method} ${endpoint}`, body); // Log API calls

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Handle 401 Unauthorized responses specifically
    if (response.status === 401) {
      console.error("Unauthorized API call:", endpoint);
      return { data: null, error: `Request failed with status 401: Unauthorized access` };
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();

        // Extract deeply nested error messages
        if (errorJson?.error) {
          try {
            const nestedError = JSON.parse(errorJson.error);
            if (nestedError?.detail) {
              errorMsg = nestedError.detail; // Extract actual error message from Python
            }
          } catch {
            errorMsg = errorJson.error; // Fallback if nested parsing fails
          }
        } else if (errorJson?.detail) {
          errorMsg = errorJson.detail;
        }
      } catch {
        errorMsg = await response.text(); // Handle plain text responses
      }

      return { data: null, error: errorMsg };
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return { data: null, error: null };
    }

    // Parse response correctly based on content type
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { data, error: null };
  } catch (error) {
    console.error("API call failed:", error);
    
    // Check if it's a network error (common in Lovable preview environment)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        data: null, 
        error: "Cannot connect to local backend. This may be because you're running in Lovable's preview environment which cannot access your local server. Try running the app locally in VS Code." 
      };
    }
    
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
  }

}

// Create API client with methods for different endpoints
export const api = {
  auth: {
    getCurrentUser: () => {
      const storedSession = localStorage.getItem("supabase-auth");
      if (!storedSession) return null;
      
      try {
        // Parse the user session from Supabase-auth storage
        const session = JSON.parse(storedSession);
        if (!session?.currentSession?.user) return null;
        
        const user = session.currentSession.user;
        
        return {
          userId: user.id,
          email: user.email,
          accessToken: session.currentSession.access_token,
          userType: user.user_metadata?.user_type || "candidate",
          subscriptionType: "free" // Default, will be updated from profile
        };
      } catch (e) {
        console.error("Error parsing stored session", e);
        return null;
      }
    },
    getProfile: () => apiCall<any>("GET", "/auth/profile"),
    logout: () => {
      // This now uses Supabase for logout - no backend call needed
      return supabase.auth.signOut();
    },
    login: async (email: string, password: string, userType?: string) => {
      try {
        console.log(`Signing in user: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error("Supabase login error:", error);
          return { data: null, error: error.message };
        }
        
        console.log("Supabase login successful, user:", data.user?.id);
        
        // Skip backend call in preview environment or if backend is not available
        const isPreviewEnv = window.location.hostname.includes('lovable.app');
        if (isPreviewEnv) {
          console.log("Preview environment detected, skipping backend authentication");
          return { 
            data: {
              userId: data.user?.id,
              email: data.user?.email,
              accessToken: data.session?.access_token,
              profile: { 
                userType: data.user?.user_metadata?.user_type || userType || 'candidate',
                subscriptionType: 'free'
              }
            }, 
            error: null 
          };
        }
        
        // After successful Supabase login, authenticate with our backend
        if (data.session?.access_token) {
          const response = await apiCall<any>("POST", "/auth/login", {
            email,
            userType: userType || data.user?.user_metadata?.user_type || 'candidate'
          }, {
            "Authorization": `Bearer ${data.session.access_token}`
          });
          
          if (response.error) {
            console.error("Backend auth error after Supabase login:", response.error);
          }
          
          // Even if backend auth fails, continue with Supabase auth data
          return { 
            data: {
              userId: data.user?.id,
              email: data.user?.email,
              accessToken: data.session?.access_token,
              profile: { 
                userType: data.user?.user_metadata?.user_type || userType || 'candidate',
                subscriptionType: 'free' // Default, will be updated from profile
              }
            }, 
            error: response.error 
          };
        }
        
        return { 
          data: {
            userId: data.user?.id,
            email: data.user?.email,
            accessToken: data.session?.access_token,
            profile: { 
              userType: data.user?.user_metadata?.user_type || userType || 'candidate',
              subscriptionType: 'free' // Default, will be updated from profile
            }
          }, 
          error: null 
        };
      } catch (error) {
        console.error("Login error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Login failed" 
        };
      }
    },
    signup: async (email: string, password: string, userType?: string) => {
      try {
        console.log(`Signing up user: ${email} as ${userType}`);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: userType || 'candidate'
            }
          }
        });
        
        if (error) {
          console.error("Supabase signup error:", error);
          return { data: null, error: error.message };
        }
        
        console.log("Supabase signup successful, user:", data.user?.id);
        
        // Skip backend call in preview environment
        const isPreviewEnv = window.location.hostname.includes('lovable.app');
        if (isPreviewEnv) {
          console.log("Preview environment detected, skipping backend registration");
          return { 
            data: {
              userId: data.user?.id,
              email: data.user?.email
            }, 
            error: null 
          };
        }
        
        // After successful Supabase signup, register with our backend
        if (data.user?.id) {
          const response = await apiCall<any>("POST", "/auth/signup", {
            email,
            userType: userType || 'candidate',
            userId: data.user.id
          }, data.session?.access_token ? {
            "Authorization": `Bearer ${data.session.access_token}`
          } : {});
          
          if (response.error) {
            console.warn("Backend registration warning after Supabase signup:", response.error);
            // Non-blocking error - we continue with Supabase auth data
          }
        }
        
        return { 
          data: {
            userId: data.user?.id,
            email: data.user?.email
          }, 
          error: null 
        };
      } catch (error) {
        console.error("Signup error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Signup failed" 
        };
      }
    }
  },
  subscription: {
    getUserSubscription: () => {
      console.log("Fetching current user subscription");
      return apiCall<any>("GET", `/subscription/current`)
        .then(result => {
          console.log("User subscription data:", result);
          return result;
        })
        .catch(error => {
          console.error("Error fetching user subscription:", error);
          return { data: null, error: error.message || "Failed to fetch subscription" };
        });
    },
    upgradeSubscription: (subscriptionType: string) => {
      console.log(`Calling API to upgrade subscription to ${subscriptionType}`);
      return apiCall<any>("POST", "/subscription/upgrade", { subscriptionType })
        .then(result => {
          console.log(`Subscription upgrade API result:`, result);
          return result;
        })
        .catch(error => {
          console.error(`Error in subscription upgrade API:`, error);
          return { data: null, error: error.message || "API call failed" };
        });
    },
    cancelSubscription: () => {
      console.log("Calling API to cancel subscription");
      return apiCall<any>("POST", "/subscription/cancel")
        .then(result => {
          console.log("Subscription cancellation API result:", result);
          return result;
        })
        .catch(error => {
          console.error("Error in subscription cancellation API:", error);
          return { data: null, error: error.message || "API call failed" };
        });
    }
  },
  usage: {
    incrementUsage: (userId: string, featureType: string) => {
      if (!userId) {
        console.error("No user ID available for usage tracking");
        return { data: null, error: "User not authenticated" };
      }
      // Log what we're sending to the API
      console.log(`Incrementing usage for feature: ${featureType}, userId: ${userId}`);
      // Send both userId and featureType in the request body
      return apiCall<any>("POST", "/usage/increment", {
        userId,
        featureType
      });
    },
    resetUsageCount: (userId: string, featureType: string) =>
      apiCall<any>("POST", "/usage/reset", { userId, featureType }),
    logActivity: (params: { actionType: string, description?: string }) =>
      apiCall<any>("POST", "/usage/log-activity", params),
    getFeatureUsage: (userId: string, featureType: string) =>
      apiCall<any>("GET", `/usage/${userId}/${featureType}`),
    getAllFeatureUsage: (userId: string) =>
      apiCall<any>("GET", `/usage/all/${userId}`)
  },
  resumeBuilder: {
    getTemplates: () => apiCall<any>("GET", "/resumebuilder/templates"),
    extractResumeData: async (file: File) => {
      try {
        // Get the auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Prepare headers
        let headers: Record<string, string> = {};
        
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        // Prepare form data
        const formData = new FormData();
        formData.append('resume', file);
        
        // Make the API request
        const response = await fetch(`${API_BASE_URL}/resumebuilder/extract-data`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        
        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        console.error("Extract resume data error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to extract resume data" 
        };
      }
    },
    buildResume: async (params: { file?: File, resumeData?: string, templateId: string }) => {
      try {
        // Log the parameters
        console.log("API Client - buildResume called with params:", {
          hasFile: !!params.file,
          hasResumeData: !!params.resumeData,
          templateId: params.templateId
        });
        
        // Validate required parameters
        if (!params.templateId) {
          console.error("API Client - Missing required parameter: templateId");
          return { data: null, error: "Missing required parameter: templateId" };
        }
        
        if (!params.file && !params.resumeData) {
          console.error("API Client - Missing required parameter: file or resumeData");
          return { data: null, error: "Missing required parameter: file or resumeData" };
        }
        
        // Get the auth session
        let session;
        try {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        } catch (authError) {
          console.error("API Client - Auth error:", authError);
          return { 
            data: null, 
            error: "Authentication error: " + (authError instanceof Error ? authError.message : String(authError))
          };
        }
        
        // Prepare headers
        let headers: Record<string, string> = {
          // Don't set Content-Type for FormData, browser will set it with boundary
          // "Content-Type": "multipart/form-data"
        };
        
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        // Prepare form data
        const formData = new FormData();
        
        // Add file if provided
        if (params.file) {
          formData.append('resumeFile', params.file);
        }
        
        // Add resume data if provided
        if (params.resumeData) {
          try {
            // Parse the JSON to validate it
            const parsedData = JSON.parse(params.resumeData);
            
            // Always convert to PascalCase to ensure consistency
            console.log("API Client - Original data:", parsedData);
            
            // Create a properly formatted object with PascalCase keys
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
                           Description: edu.Description || edu.description || ""
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
            
            console.log("API Client - Formatted data:", formattedData);
            formData.append('resumeData', JSON.stringify(formattedData));
          } catch (jsonError) {
            console.error("API Client - JSON parse error:", jsonError);
            // Use the original data if parsing fails
            formData.append('resumeData', params.resumeData);
          }
        }
        
        // Add template ID
        formData.append('templateId', params.templateId);
        
        // Make the API request
        try {
          console.log("API Client - Making request to:", `${API_BASE_URL}/resumebuilder/build`);
          
          // Log the FormData contents
          console.log("API Client - FormData contents:");
          for (const pair of formData.entries()) {
            if (typeof pair[1] === 'string') {
              console.log(`${pair[0]}: ${pair[1].length > 100 ? pair[1].substring(0, 100) + '...' : pair[1]}`);
            } else {
              console.log(`${pair[0]}: [${typeof pair[1]}]`);
            }
          }
          
          // Log the headers
          console.log("API Client - Request headers:", headers);
          
          // For local development, we need to handle self-signed certificates
          const fetchOptions: RequestInit = {
            method: 'POST',
            headers,
            body: formData,
            credentials: "include"
          };
          
          // Add a warning about self-signed certificates
          console.log("API Client - Note: If you're using a self-signed certificate, you may need to accept it in your browser first");
          
          const response = await fetch(`${API_BASE_URL}/resumebuilder/build`, fetchOptions);
          
          console.log("API Client - Response status:", response.status);
          console.log("API Client - Response headers:", Object.fromEntries([...response.headers.entries()]));
          
          // Always get the response text first for debugging
          const responseText = await response.text();
          console.log("API Client - Response body:", responseText.substring(0, 500));
          
          // Handle error responses
          if (!response.ok) {
            console.error("API Client - Error response:", responseText);
            return { data: null, error: responseText };
          }
          
          // Parse the response text back to JSON
          try {
            const responseData = JSON.parse(responseText);
            console.log("API Client - Parsed response data:", responseData);
            
            // Handle empty data response
            if (responseData.html && responseData.html.includes("No resume data available")) {
              console.warn("API Client - Backend returned 'No resume data available' message");
              return { 
                data: {
                  html: responseData.html,
                  data: {
                    name: "",
                    title: "",
                    email: "",
                    phone: "",
                    location: "",
                    linkedin: "",
                    website: "",
                    summary: "",
                    experience: [],
                    education: [],
                    skills: [],
                    certifications: [],
                    projects: []
                  }
                }, 
                error: null 
              };
            }
            
            return { data: responseData, error: null };
          } catch (parseError) {
            console.error("API Client - Error parsing response JSON:", parseError);
            // If we can't parse as JSON, return the raw text
            return { data: { html: responseText, data: {} }, error: null };
          }
        } catch (fetchError) {
          console.error("API Client - Fetch error:", fetchError);
          return { 
            data: null, 
            error: "Network error: " + (fetchError instanceof Error ? fetchError.message : String(fetchError))
          };
        }
      } catch (error) {
        // Catch any other errors
        console.error("API Client - Unexpected error:", error);
        return { 
          data: null, 
          error: "Unexpected error: " + (error instanceof Error ? error.message : String(error))
        };
      }
    },
    optimizeResume: async (params: { resumeData: string, templateId: string }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/resumebuilder/optimize`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            resumeData: params.resumeData,
            templateId: params.templateId
          }),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return { data, error: null };
        } else {
          const text = await response.text();
          return { data: { html: text }, error: null };
        }
      } catch (error) {
        console.error("Optimize resume error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to optimize resume" 
        };
      }
    }
  },
  resume: {
    analyze: async (file: File, jobDescription: string, plan: string = "free") => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_description', jobDescription);
      formData.append('plan', plan);

      const response = await fetch('http://localhost:8080/api/candidate/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      return response.json();
    },
    optimize: async (file: File, plan: string = "free") => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('plan', plan);

      const response = await fetch('http://localhost:8080/api/candidate/optimize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      return response.json();
    },
    customize: async (file: File, jobDescription?: string, jobDescriptionFile?: File, plan: string = "free") => {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) formData.append('job_description', jobDescription);
      if (jobDescriptionFile) formData.append('job_description_file', jobDescriptionFile);
      formData.append('plan', plan);

      const response = await fetch('http://localhost:8080/api/candidate/customize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Customization failed');
      }

      return response.json();
    },
    atsScan: async (file: File, plan: string = "free") => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('plan', plan);

      const response = await fetch('http://localhost:8080/api/candidate/ats_scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('ATS scan failed');
      }

      return response.json();
    },
    benchmark: async (file: File, jobDescription: string, plan: string = "free") => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_description', jobDescription);
      formData.append('plan', plan);

      const response = await fetch('http://localhost:8080/api/candidate/benchmark', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Benchmarking failed');
      }

      return response.json();
    },
    salaryInsights: async (params: {
      job_title: string;
      location: string;
      industry: string;
      years_experience: number;
      education_level?: string;
      resume?: File;
      plan?: string;
    }) => {
      const formData = new FormData();
      formData.append('job_title', params.job_title);
      formData.append('location', params.location);
      formData.append('industry', params.industry);
      formData.append('years_experience', params.years_experience.toString());
      if (params.education_level) formData.append('education_level', params.education_level);
      if (params.resume) formData.append('resume', params.resume);
      formData.append('plan', params.plan || 'free');

      const response = await fetch('http://localhost:8080/api/candidate/salary_insights', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Salary insights failed');
      }

      return response.json();
    }
  },
  jobs: {
    searchJobs: (query: string, location?: string, company?: string) =>
      apiCall<any>("GET", `/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}&company=${encodeURIComponent(company || '')}`),
    getJobDetails: (jobId: string) =>
      apiCall<any>("GET", `/jobs/${jobId}`),
    generateJobDescription: (params: { title: string, company: string, description: string }) =>
      apiCall<any>("POST", "/jobs/generate-description", params),
    optimizeJobDescription: (params: { description: string }) =>
      apiCall<any>("POST", "/jobs/optimize-description", params)
  },
  interviews: {
    generateQuestions: async (jobTitle: string, jobDescription: string, resumeFile?: File, plan: string = "free") => {
      try {
        // First extract resume text if file is provided
        let resumeText = "";
        if (resumeFile) {
          const extractedData = await api.fileUtils.extractTextFromFile(resumeFile);
          resumeText = extractedData || "";
        }

        const formData = new FormData();
        formData.append('job_title', jobTitle);
        formData.append('job_description', jobDescription);
        formData.append('resume_text', resumeText);
        formData.append('plan', plan);

        console.log("Sending interview questions request with:", {
          job_title: jobTitle,
          job_description: jobDescription,
          resume_text: resumeText.substring(0, 100) + "...",
          plan
        });

        const response = await fetch('http://localhost:8080/api/candidate/generate_interview_questions', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Interview questions API error:", errorText);
          throw new Error(`Interview questions generation failed: ${errorText}`);
        }

        const result = await response.json();
        console.log("Interview questions result:", result);
        return result;
      } catch (error) {
        console.error("Interview questions error:", error);
        throw error;
      }
    }
  },
  coverLetters: {
    generateCoverLetter: async (jobTitle: string, company: string, jobDescription: string) => {
      const formData = new FormData();
      formData.append('job_title', jobTitle);
      formData.append('company', company);
      formData.append('job_description', jobDescription);

      const response = await fetch('http://localhost:8080/api/candidate/generate_cover_letter', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Cover letter generation failed');
      }

      return response.json();
    }
  },
  fileUtils: {
    extractTextFromFile: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8080/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Text extraction failed');
        }

        const result = await response.json();
        return result.text || '';
      } catch (error) {
        console.error('Error extracting text from file:', error);
        return '';
      }
    }
  }
};

export default api;
