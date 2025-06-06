
import { supabase } from "@/integrations/supabase/client";

// Base URL for API calls
const API_BASE_URL = "https://localhost:5001/api"; // Local development URL

// Check if backend is running
export const IS_BACKEND_RUNNING = false; // Set to false for demo mode

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
      credentials: "include"
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    console.log(`API ${method} ${endpoint}`, body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 401) {
      console.error("Unauthorized API call:", endpoint);
      return { data: null, error: `Request failed with status 401: Unauthorized access` };
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error) {
          try {
            const nestedError = JSON.parse(errorJson.error);
            if (nestedError?.detail) {
              errorMsg = nestedError.detail;
            }
          } catch {
            errorMsg = errorJson.error;
          }
        } else if (errorJson?.detail) {
          errorMsg = errorJson.detail;
        }
      } catch {
        errorMsg = await response.text();
      }

      return { data: null, error: errorMsg };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

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
        const session = JSON.parse(storedSession);
        if (!session?.currentSession?.user) return null;
        
        const user = session.currentSession.user;
        
        return {
          userId: user.id,
          email: user.email,
          accessToken: session.currentSession.access_token,
          userType: user.user_metadata?.user_type || "candidate",
          subscriptionType: "free"
        };
      } catch (e) {
        console.error("Error parsing stored session", e);
        return null;
      }
    },
    getProfile: () => apiCall<any>("GET", "/auth/profile"),
    logout: () => {
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
              subscriptionType: 'free'
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
      console.log(`Incrementing usage for feature: ${featureType}, userId: ${userId}`);
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
        const { data: { session } } = await supabase.auth.getSession();
        const formData = new FormData();
        formData.append('resumeFile', file);
        
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/resumebuilder/extract`, {
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
    buildResume: async (params: { resumeData: string, templateId: string }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/resumebuilder/build`, {
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
        
        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        console.error("Build resume error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to build resume" 
        };
      }
    }
  },
  resume: {
    analyze: (file: File, jobDescription: string, plan?: string) =>
      apiCall<any>("POST", "/resume/analyze", { file, jobDescription, plan }),
    optimize: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/optimize", { file, plan }),
    customize: (file: File, jobDescription?: string, jobDescriptionFile?: File, plan?: string) =>
      apiCall<any>("POST", "/resume/customize", { file, jobDescription, jobDescriptionFile, plan }),
    atsScan: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/ats-scan", { file, plan }),
    scanAts: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/ats-scan", { file, plan }),
    benchmark: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/benchmark", { file, plan }),
    salaryInsights: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/salary-insights", { file, plan })
  },
  jobs: {
    searchJobs: (query: string, location?: string, company?: string) =>
      apiCall<any>("GET", `/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}&company=${encodeURIComponent(company || '')}`),
    getJobDetails: (jobId: string) =>
      apiCall<any>("GET", `/jobs/${jobId}`),
    generateJobDescription: (params: { jobTitle: string, company: string, requirements: string }) =>
      apiCall<any>("POST", "/jobs/generate-description", params),
    optimizeJobDescription: (params: { description: string }) =>
      apiCall<any>("POST", "/jobs/optimize-description", params),
    findBestCandidates: (params: { description: string }) =>
      apiCall<any>("POST", "/jobs/find-candidates", params)
  },
  interviews: {
    generateQuestions: (jobTitle: string, company: string, jobDescription: string) =>
      apiCall<any>("POST", "/interviews/generate-questions", { jobTitle, company, jobDescription })
  },
  coverLetters: {
    generateCoverLetter: (jobTitle: string, company: string, jobDescription: string) =>
      apiCall<any>("POST", "/cover-letters/generate", { jobTitle, company, jobDescription }),
    generate: (params: { jobTitle: string, company: string, jobDescription: string }) =>
      apiCall<any>("POST", "/cover-letters/generate", params)
  },
  fileUtils: {
    extractTextFromFile: async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    exportToCSV: (data: any[], filename: string) => {
      const csvContent = "data:text/csv;charset=utf-8," + 
        data.map(row => Object.values(row).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export default api;
