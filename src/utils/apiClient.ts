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

    // if (!response.ok) {
    //   // Try to parse error as JSON and extract detail
    //   let errorMsg = `Request failed with status ${response.status}`;
    //   try {
    //     const errorJson = await response.json();
    //     if (errorJson && errorJson.detail) {
    //       errorMsg = errorJson.detail;
    //     }
    //   } catch {
    //     // fallback to text if not JSON
    //     const errorText = await response.text();
    //     errorMsg = errorText;
    //   }
    //   return { data: null, error: errorMsg };
    // }
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
  resume: {
    analyze: (params: { resumeText: string, jobDescription: string }) => 
      apiCall<any>("POST", "/resume/analyze", params),
    customize: async (params: { file: File, jobDescription?: string, jobDescriptionFile?: File }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const formData = new FormData();
        formData.append('file', params.file);
        if (params.jobDescriptionFile) {
          formData.append('jobDescriptionFile', params.jobDescriptionFile);
        } else if (params.jobDescription !== undefined) {
          formData.append('jobDescription', params.jobDescription);
        }
        const response = await fetch(`${API_BASE_URL}/resume/customize`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: "include"
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          return { data: json, error: null };
        }
        return { data: null, error: 'Unexpected response type' };
      } catch (error) {
        return { data: null, error: 'Failed to connect to server' };
      }
    },
    benchmark: (params: { resumeText: string, jobDescription: string }) => 
      apiCall<any>("POST", "/resume/benchmark", params),
    
    optimize: async (params: { file: File }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const formData = new FormData();
        formData.append('file', params.file);
        const response = await fetch(`${API_BASE_URL}/resume/optimize`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: "include"
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        // Expect JSON Jobscan-style optimization report
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          return { data: json, error: null };
        }
        return { data: null, error: 'Unexpected response type' };
      } catch (error) {
        return { data: null, error: 'Failed to connect to server' };
      }
    },
    salaryinsights: async (form: {
  jobTitle: string;
  location: string;
  industry: string;
  yearsExperience: number | string;
  educationLevel?: string;
  resume?: File | null;
}) => {
  
  

  try {
    const { data: { session } } = await supabase.auth.getSession();
        let headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const formData = new FormData();
        formData.append("JobTitle", form.jobTitle);
        formData.append("Location", form.location);
        formData.append("Industry", form.industry);
        formData.append("YearsExperience", form.yearsExperience.toString());
        if (form.educationLevel) formData.append("EducationLevel", form.educationLevel);
        if (form.resume) formData.append("Resume", form.resume);
      const response = await fetch(`${API_BASE_URL}/resume/salary-insights`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: "include"
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        // Expect JSON Jobscan-style optimization report
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          return { data: json, error: null };
        }
        return { data: null, error: 'Unexpected response type' };
      } catch (error) {
        return { data: null, error: 'Failed to connect to server' };
      }
    },
    scanAts: async (params: { file: File }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const formData = new FormData();
        formData.append('file', params.file);
        const response = await fetch(`${API_BASE_URL}/resume/scan-ats`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: "include"
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { data: null, error: errorText };
        }
        // Expect JSON Jobscan-style optimization report
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          return { data: json, error: null };
        }
        return { data: null, error: 'Unexpected response type' };
      } catch (error) {
        return { data: null, error: 'Failed to connect to server' };
      }
    }
  },
  jobs: {
    findBestCandidates: (params: { jobDescription: string, candidateCount: number }) => 
      apiCall<any>("POST", "/jobs/best-candidates", params),
    optimizeJobDescription: (params: { jobDescription: string }) => 
      apiCall<any>("POST", "/jobs/optimize", params)
  },
  interviews: {
    generateQuestions: (params: { resumeText: string, jobDescription: string }) => 
      apiCall<any>("POST", "/interviews/generate-questions", params)
  },
  coverLetters: {
    generate: (params: { jobTitle: string, company: string, jobDescription: string }) => 
      apiCall<any>("POST", "/cover-letters/generate", params)
  },
  fileUtils: {
    exportToCSV: (data: any[], filename: string) => {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

// Helper function to get the current user ID from storage
function getStoredUserId(): string {
  const user = api.auth.getCurrentUser();
  return user?.userId || '';
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get headers
  const headers = Object.keys(data[0]).join(',');
  
  // Convert each row to CSV
  const rows = data.map(row => {
    return Object.values(row).map(value => {
      // Handle strings with commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

// Export utility function to log user activity
export const logActivity = async (actionType: string, description?: string) => {
  const userId = api.auth.getCurrentUser()?.userId;
  if (!userId) return { data: null, error: "Not authenticated" };
  
  return api.usage.logActivity({ actionType, description });
};

// Export API client as default
export default api;

function getAccessToken() {
  const storedSession = localStorage.getItem("supabase-auth");
  if (!storedSession) return null;
  
  try {
    // Parse the user session from Supabase-auth storage
    const session = JSON.parse(storedSession);
    if (!session?.currentSession?.access_token) return null;
    
    return session.currentSession.access_token;
  } catch (e) {
    console.error("Error parsing stored session", e);
    return null;
  }
}

// Helper to download a blob as a file
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

// Add or update in your apiClient.ts

