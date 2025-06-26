import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { extractFileKey } from "@/lib/utils";
import { resumeBuilderApi } from "./resumeBuilderApi";

// Re-export the SUPABASE_URL for use in other files
export { SUPABASE_URL };

// Base URL for API calls
// Determine the appropriate API base URL based on the environment
const determineApiBaseUrl = () => {

  return "https://localhost:5001/api";// Lovable


  // const isProduction = import.meta.env.PROD;
  
  // const devBackendUrl = import.meta.env.VITE_API_URL;
  // if (isProduction) {
  //   console.log(`in production: ${import.meta.env.VITE_API_URL}`);
  //   return '/api';
  // } else if (devBackendUrl) {
  // return devBackendUrl;
  // } else {
  // return "http://localhost:5001/api";
  // }
};

// Set the API base URL
const API_BASE_URL = determineApiBaseUrl();
console.log(`Using API base URL: ${API_BASE_URL}`);

// Backend status detection
export let IS_BACKEND_RUNNING = true; // Default to true, will be updated dynamically

// Helper function to create an abort signal with timeout
const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  // Check if AbortSignal.timeout is available (newer browsers)
  if ('timeout' in AbortSignal && typeof (AbortSignal as any).timeout === 'function') {
    return (AbortSignal as any).timeout(timeoutMs);
  }
  
  // Fallback for browsers that don't support AbortSignal.timeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

// Function to check if the backend is running
export const checkBackendStatus = async (): Promise<boolean> => {
  try {
    // Use a health check endpoint or a simple endpoint that should always work
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout for health check
      signal: createTimeoutSignal(5000)
    });
    
    IS_BACKEND_RUNNING = response.ok;
    return IS_BACKEND_RUNNING;
  } catch (error) {
    console.warn("Backend health check failed:", error);
    IS_BACKEND_RUNNING = false;
    return false;

  }
}

// Try to check backend status on initialization
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    checkBackendStatus().then(isRunning => {
      console.log(`Backend status check: ${isRunning ? 'Running' : 'Not running'}`);
    });
  }, 1000); // Delay slightly to not block initial rendering
}

// Helper function to retry failed API calls
async function retryApiCall<T>(
  method: string,
  endpoint: string,
  body?: any,
  customHeaders: Record<string, string> = {},
  retries: number = 2,
  backoff: number = 300
): Promise<{ data: T | null; error: string | null }> {
  try {
    return await apiCall<T>(method, endpoint, body, customHeaders);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Retrying API call to ${endpoint} in ${backoff}ms. Retries left: ${retries}`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    return retryApiCall<T>(method, endpoint, body, customHeaders, retries - 1, backoff * 2);
  }
}

// Helper function for API calls
async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: any,
  customHeaders: Record<string, string> = {},
  shouldRetry: boolean = false
): Promise<{ data: T | null; error: string | null }> {
  // If shouldRetry is true, use the retry mechanism for critical endpoints
  if (shouldRetry) {
    return retryApiCall<T>(method, endpoint, body, customHeaders);
  }
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
      console.log(`Using auth token: ${session.access_token?.slice(0, 8)}...`);
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

    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      options.signal = controller.signal;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      clearTimeout(timeoutId); // Clear the timeout if the request completes
      
      if (response.status === 401) {
      console.error("Unauthorized API call:", endpoint);
      return { data: null, error: `Request failed with status 401: Unauthorized access` };
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      let errorDetails = '';
      
      try {
        // Try to get the response as JSON first
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await response.json();
          console.error("API error response (JSON):", errorJson);
          
          if (errorJson?.error) {
            try {
              const nestedError = JSON.parse(errorJson.error);
              if (nestedError?.detail) {
                errorMsg = nestedError.detail;
                errorDetails = JSON.stringify(nestedError);
              }
            } catch {
              errorMsg = errorJson.error;
              errorDetails = JSON.stringify(errorJson);
            }
          } else if (errorJson?.detail) {
            errorMsg = errorJson.detail;
            errorDetails = JSON.stringify(errorJson);
          } else if (errorJson?.message) {
            errorMsg = errorJson.message;
            errorDetails = JSON.stringify(errorJson);
          } else {
            errorDetails = JSON.stringify(errorJson);
          }
        } else {
          // If not JSON, get as text
          const errorText = await response.text();
          console.error("API error response (Text):", errorText);
          errorMsg = errorText || errorMsg;
          errorDetails = errorText;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        try {
          errorMsg = await response.text() || errorMsg;
        } catch {
          // If all else fails, just use the status code message
        }
      }
      
      console.error(`API Error (${response.status}):`, errorMsg, errorDetails ? `Details: ${errorDetails}` : '');
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
    } catch (fetchError) {
      // Handle any errors that occurred during the fetch operation
      clearTimeout(timeoutId);
      throw fetchError; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error("API call failed:", error);
    
    // Determine environment for better error messages
    let isPreviewEnv = false;
    let isLocalhost = false;
    if (typeof window !== 'undefined' && window.location) {
      isPreviewEnv = window.location.hostname.includes('lovable.app');
      isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    
    // Handle specific error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`Request to ${endpoint} timed out after 15 seconds`);
      return {
        data: null,
        error: "Request timed out. The server took too long to respond. Please try again later."
      };
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // Update the backend running status
      (window as any).IS_BACKEND_RUNNING = false;
      
      if (isPreviewEnv) {
        return {
          data: null,
          error: "Cannot connect to local backend. This may be because you're running in Lovable's preview environment which cannot access your local server. Try running the app locally in VS Code."
        };
      } else if (isLocalhost) {
        return {
          data: null,
          error: `Cannot connect to your local backend. Make sure your backend server is running and accessible at ${API_BASE_URL}.`
        };
      } else {
        return {
          data: null,
          error: "Cannot connect to backend. Please check your network connection and backend server status."
        };
      }
    }
    
    // Generic error handling
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred while communicating with the server" 
    };
  }
}

// Create API client with methods for different endpoints
export const api = {
  // Track in-flight requests to deduplicate
  _pendingRequests: {} as Record<string, Promise<any>>,
  
  profileMetadata: {
    // Get the user's default resume with request deduplication
    getDefaultResume: async () => {
      try {
        const requestKey = "GET_/ProfileMetadata";
        
        // Check if there's already a request in progress
        if (api._pendingRequests[requestKey]) {
          console.log(`[${new Date().toISOString()}] REUSING IN-FLIGHT REQUEST for GET /ProfileMetadata`);
          return await api._pendingRequests[requestKey];
        }
        
        console.log(`[${new Date().toISOString()}] API CALL: GET /ProfileMetadata`);
        
        // Create the request and store it
        const requestPromise = (async () => {
          // Use the REST API endpoint instead of direct Supabase query
          const { data, error } = await apiCall<any>("GET", "/ProfileMetadata");
          
          if (error) {
            console.error("Error from ProfileMetadata API:", error);
            return { data: null, error };
          }
          
          console.log("Raw ProfileMetadata response:", data);
          
          // Process the data
          if (!data || data.exists === false) {
            console.log("No profile metadata exists");
            return { 
              data: null, 
              error: null,
              profileStatus: data?.profileStatus || {
                hasResume: false,
                hasBasicInfo: false,
                hasDetailedInfo: false,
                completionPercentage: 0
              }
            };
          }
          
          // Clear the pending request after a short delay to allow for closely timed calls
          setTimeout(() => {
            delete api._pendingRequests[requestKey];
          }, 100);
          
          return { data, error };
        })();
        
        // Store the promise
        api._pendingRequests[requestKey] = requestPromise;
        
        // Get the result
        const result = await requestPromise;
        
        // Extract data from the result
        const { data } = result;
        
        // Handle array response
        const responseData = Array.isArray(data) ? data[0] : data;
        console.log("Profile metadata response content:", JSON.stringify(data));
        
        if (!responseData) {
          console.log("No profile metadata exists after processing");
          return { 
            data: null, 
            error: null,
            profileStatus: {
              hasResume: false,
              hasBasicInfo: false,
              hasDetailedInfo: false,
              completionPercentage: 0
            }
          };
        }
        
        // Extract the metadata from the response
        const metadataObj = responseData.metadata || responseData;
        
        // Check if we have resume file information - check both in the root and in metadata
        // First check if we have direct file properties in the response
        const fileName = responseData.fileName || responseData.file_name;
        const blobPath = responseData.blobPath || responseData.blob_path;
        const fileUrl = responseData.fileUrl || responseData.file_url;
        const fileSize = responseData.fileSize || responseData.file_size;
        const uploadDate = responseData.uploadDate || responseData.upload_date;
        
        // Then check if we have them in the metadata object
        const metadataFileName = metadataObj.fileName || metadataObj.file_name;
        const metadataBlobPath = metadataObj.blobPath || metadataObj.blob_path;
        const metadataFileUrl = metadataObj.fileUrl || metadataObj.file_url;
        const metadataFileSize = metadataObj.fileSize || metadataObj.file_size;
        const metadataUploadDate = metadataObj.uploadDate || metadataObj.upload_date;
        
        // Use the values from the root object if available, otherwise use the metadata values
        const finalFileName = fileName || metadataFileName;
        const finalBlobPath = blobPath || metadataBlobPath;
        const finalFileUrl = fileUrl || metadataFileUrl;
        const finalFileSize = fileSize || metadataFileSize;
        const finalUploadDate = uploadDate || metadataUploadDate;
        
        // Check if we have enough information to consider this a valid resume
        const hasResumeFile = finalFileName || finalBlobPath || finalFileUrl;
        
        console.log("Resume file check:", { 
          fileName: finalFileName, 
          blobPath: finalBlobPath,
          fileUrl: finalFileUrl,
          hasResumeFile
        });
        
        // Construct a proper fileUrl if it's missing but we have a blobPath
        let constructedFileUrl = finalFileUrl;
        
        if (!constructedFileUrl && finalBlobPath) {
          console.log("API Client: No fileUrl found, constructing from blobPath:", finalBlobPath);
          
          if (finalBlobPath.startsWith('http')) {
            // If it's already a full URL
            constructedFileUrl = finalBlobPath;
          } else if (finalBlobPath.includes('storage/')) {
            // Use the supabase client to get a public URL
            try {
              const { data } = supabase.storage.from('user-resumes').getPublicUrl(
                finalBlobPath.replace('storage/user-resumes/', '')
              );
              constructedFileUrl = data.publicUrl;
              console.log("API Client - Generated public URL from storage path:", constructedFileUrl);
            } catch (err) {
              console.error("API Client - Error generating public URL:", err);
              // Fallback to direct URL
              constructedFileUrl = `${SUPABASE_URL}/storage/v1/object/public/${finalBlobPath}`;
            }
          } else if (finalBlobPath.includes('user-resumes/')) {
            // Use the supabase client to get a public URL
            try {
              const { data } = supabase.storage.from('user-resumes').getPublicUrl(
                finalBlobPath.replace('user-resumes/', '')
              );
              constructedFileUrl = data.publicUrl;
              console.log("API Client - Generated public URL from user-resumes path:", constructedFileUrl);
            } catch (err) {
              console.error("API Client - Error generating public URL:", err);
              // Fallback to direct URL
              constructedFileUrl = `${SUPABASE_URL}/storage/v1/object/public/${finalBlobPath}`;
            }
          } else {
            // Default API endpoint
            constructedFileUrl = `/api/files/${finalBlobPath}`;
          }
          
          console.log("API Client: Constructed fileUrl:", constructedFileUrl);
        }
        
        // Transform the data to match the expected format
        const transformedData = {
          fileUrl: constructedFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          uploadDate: finalUploadDate,
          blobPath: finalBlobPath,
          isVisibleToRecruiters: responseData.isVisibleToRecruiters || responseData.is_visible_to_recruiters || false,
          metadata: {
            jobTitle: metadataObj.jobTitle || metadataObj.job_title || '',
            currentCompany: metadataObj.currentCompany || metadataObj.current_company || '',
            yearsOfExperience: metadataObj.yearsOfExperience || metadataObj.years_of_experience || '',
            professionalBio: metadataObj.professionalBio || metadataObj.professional_bio || '',
            location: metadataObj.location || '',
            phoneNumber: metadataObj.phoneNumber || metadataObj.phone_number || '',
            skills: metadataObj.skills || [],
            lastUpdated: metadataObj.lastUpdated || metadataObj.last_updated || new Date().toISOString()
          }
        };
        
        console.log("Transformed resume data:", transformedData);
        
        // Always return the transformed data if we have any resume file information
        return { 
          data: hasResumeFile ? transformedData : null, 
          error: null,
          profileStatus: responseData.profileStatus
        };
      } catch (error) {
        console.error("Error fetching default resume:", error);
        return { data: null, error: "Failed to fetch default resume" };
      }
    },
    
    // Upload a new default resume
    uploadDefaultResume: async (file: File) => {
      try {
        // Get the user ID properly by awaiting the Promise
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          return { data: null, error: "User not authenticated" };
        }
        
        // Create a fixed file path structure that NEVER changes for a user
        // This ensures we always replace the same file and don't create new ones
        // Extract file extension to preserve it for proper content-type detection
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const filePath = `${userId}_default_resume.${fileExtension || 'pdf'}`;
        
        console.log(`Using fixed file path: ${filePath}`);
        
        // First, check if there's an existing resume to delete
        const { data: profileData, error: getError } = await apiCall<any>("GET", "/ProfileMetadata");
        
        // If there's an existing file, delete it first
        if (profileData?.blobPath) {
          console.log(`Deleting existing file from path: ${profileData.blobPath}`);
          
          try {
            const { error: deleteError } = await supabase.storage
              .from('user-resumes')
              .remove([profileData.blobPath]);
              
            if (deleteError) {
              console.error("Error deleting existing file from storage:", deleteError);
              // Continue anyway, as we'll upload a new file
            } else {
              console.log("Existing file deleted successfully from storage");
            }
          } catch (storageError) {
            console.error("Exception deleting existing file from storage:", storageError);
            // Continue anyway, as we'll upload a new file
          }
        }
        
        // Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`Uploading file to path: ${filePath}`);
        
        // First try to delete the file if it exists (as a safety measure)
        try {
          await supabase.storage
            .from('user-resumes')
            .remove([filePath]);
          console.log("Cleaned up any existing file at the target path");
        } catch (error) {
          // Ignore errors here, as the file might not exist
        }
        
        // Now upload the new file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-resumes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          return { data: null, error: uploadError.message };
        }
        
        // Get the public URL for the file
        const { data: urlData } = await supabase.storage
          .from('user-resumes')
          .getPublicUrl(filePath);
        
        const fileUrl = urlData?.publicUrl;
        
        // Prepare the request payload
        const fileInfoPayload = {
          blobPath: filePath,
          fileName: file.name,
          fileSize: Math.floor(file.size), // Ensure fileSize is an integer
          fileUrl: fileUrl
        };
        
        console.log("Sending file info update request:", JSON.stringify(fileInfoPayload));
        
        // Update the file info using the API endpoint
        const { data: result, error: updateError } = await apiCall<any>("PATCH", "/ProfileMetadata/file-info", fileInfoPayload);
        
        if (updateError) {
          console.error("Error updating file info:", updateError);
          
          // If there was an error saving the metadata, delete the uploaded file
          try {
            await supabase.storage
              .from('user-resumes')
              .remove([filePath]);
            console.log("Cleaned up uploaded file after metadata update failure");
          } catch (cleanupError) {
            console.error("Error cleaning up file after failed metadata update:", cleanupError);
          }
          
          return { 
            data: null, 
            error: `Failed to update file metadata: ${updateError}. Please try again or contact support if the issue persists.` 
          };
        }
        
        // Make sure we have a valid fileUrl
        if (!fileUrl) {
          console.error("No fileUrl returned from Supabase");
          return { 
            data: null, 
            error: "Failed to get file URL. Please try again or contact support." 
          };
        }
        
        // Transform the data to match the expected format
        const transformedData = {
          fileUrl: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          blobPath: filePath,
          isVisibleToRecruiters: result.isVisibleToRecruiters || result.is_visible_to_recruiters || false,
          metadata: {
            jobTitle: result.jobTitle || "",
            currentCompany: result.currentCompany || "",
            yearsOfExperience: result.yearsOfExperience || "",
            professionalBio: result.professionalBio || "",
            location: result.location || "",
            phoneNumber: result.phoneNumber || "",
            skills: result.skills || [],
            lastUpdated: result.lastUpdated || new Date().toISOString()
          }
        };
        
        // Log the transformed data to help with debugging
        console.log("Resume data after upload:", JSON.stringify({
          fileUrl: transformedData.fileUrl,
          fileName: transformedData.fileName,
          blobPath: transformedData.blobPath
        }));
        
        return { data: transformedData, error: null };
      } catch (error) {
        console.error("Error uploading default resume:", error);
        return { data: null, error: "Failed to upload default resume" };
      }
    },
    
    // Delete the user's default resume
    deleteDefaultResume: async () => {
      try {
        // First get the current profile metadata to get the blob path
        const { data: profileData, error: getError } = await apiCall<any>("GET", "/ProfileMetadata");
        
        if (getError) {
          return { error: getError };
        }
        
        // Delete the file from storage
        if (profileData.blobPath) {
          console.log(`Deleting file from path: ${profileData.blobPath}`);
          
          try {
            const { data, error } = await supabase.storage
              .from('user-resumes')
              .remove([profileData.blobPath]);
              
            if (error) {
              console.error("Error deleting file from storage:", error);
            } else {
              console.log("File deleted successfully from storage");
            }
          } catch (storageError) {
            console.error("Exception deleting file from storage:", storageError);
          }
        }
        
        // Delete the metadata record using the API
        const { data, error: deleteError } = await apiCall<any>("DELETE", "/ProfileMetadata");
        
        if (deleteError) {
          return { error: deleteError };
        }
        
        return { error: null };
      } catch (error) {
        console.error("Error deleting default resume:", error);
        return { error: "Failed to delete default resume" };
      }
    },
    
    // Alias for deleteDefaultResume to maintain compatibility with existing code
    clearDefaultResume: async () => {
      console.log(`[${new Date().toISOString()}] API CALL: clearDefaultResume (delegating to deleteDefaultResume)`);
      return await api.profileMetadata.deleteDefaultResume();
    },
    
    // Update resume visibility to recruiters
    updateResumeVisibility: async (isVisible: boolean) => {
      try {
        console.log(`Updating resume visibility to: ${isVisible}`);
        
        // Use a specific endpoint for updating visibility
        const { data: result, error } = await apiCall<any>("PATCH", "/ProfileMetadata/visibility", {
          isVisibleToRecruiters: isVisible
        });
        
        if (error) {
          return { data: null, error };
        }
        
        console.log("Resume visibility update response:", JSON.stringify(result));
        
        // Handle array response
        const responseData = Array.isArray(result) ? result[0] : result;
        
        if (!responseData) {
          console.log("No data returned from visibility update");
          // If no response data, use the provided visibility
          return { 
            data: { 
              isVisibleToRecruiters: isVisible
            }, 
            error: null 
          };
        }
        
        // Transform the data to match the expected format
        const transformedData = {
          isVisibleToRecruiters: responseData.isVisibleToRecruiters || responseData.is_visible_to_recruiters || isVisible
        };
        
        return { data: transformedData, error: null };
      } catch (error) {
        console.error("Error updating resume visibility:", error);
        return { data: null, error: "Failed to update resume visibility" };
      }
    },
    
    // Update resume metadata
    updateResumeMetadata: async (metadata: Record<string, any>) => {
      try {
        // If no metadata fields are provided, just get the current metadata
        if (Object.keys(metadata).length === 0) {
          console.log("No metadata fields provided, getting current metadata");
          return await api.profileMetadata.getDefaultResume();
        }
        
        // Use the specific metadata update endpoint with PATCH method
        // This endpoint is designed to update just the metadata fields
        const { data: result, error } = await apiCall<any>("PATCH", "/ProfileMetadata/metadata", {
          // Include only the metadata fields being updated
          jobTitle: metadata.jobTitle,
          currentCompany: metadata.currentCompany,
          yearsOfExperience: metadata.yearsOfExperience,
          professionalBio: metadata.professionalBio,
          location: metadata.location,
          phoneNumber: metadata.phoneNumber,
          skills: metadata.skills
        });
        
        if (error) {
          return { data: null, error };
        }
        
        console.log("Profile metadata update response:", JSON.stringify(result));
        
        // Handle array response
        const responseData = Array.isArray(result) ? result[0] : result;
        
        if (!responseData) {
          console.log("No data returned from metadata update, using provided metadata");
          // If no response data, use the provided metadata
          return { 
            data: { 
              metadata: {
                ...metadata,
                lastUpdated: new Date().toISOString()
              }
            }, 
            error: null 
          };
        }
        
        // Extract the metadata object from the response
        const metadataObj = responseData.metadata || responseData;
        console.log("Metadata object from update:", JSON.stringify(metadataObj, null, 2));
        
        // Transform the data to match the expected format
        const transformedData = {
          metadata: {
            jobTitle: metadataObj.jobTitle || metadataObj.job_title || metadata.jobTitle || '',
            currentCompany: metadataObj.currentCompany || metadataObj.current_company || metadata.currentCompany || '',
            yearsOfExperience: metadataObj.yearsOfExperience || metadataObj.years_of_experience || metadata.yearsOfExperience || '',
            professionalBio: metadataObj.professionalBio || metadataObj.professional_bio || metadata.professionalBio || '',
            location: metadataObj.location || metadata.location || '',
            phoneNumber: metadataObj.phoneNumber || metadataObj.phone_number || metadata.phoneNumber || '',
            skills: metadataObj.skills || metadata.skills || [],
            lastUpdated: metadataObj.lastUpdated || metadataObj.last_updated || new Date().toISOString()
          }
        };
        
        return { data: transformedData, error: null };
      } catch (error) {
        console.error("Error updating resume metadata:", error);
        return { data: null, error: "Failed to update resume metadata" };
      }
    }
  },
  
  auth: {
    // ... keep existing code (auth methods)
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
    // ... keep existing code (subscription methods)
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
      // Use retry for important usage tracking
      return apiCall<any>("POST", "/usage/increment", {
        userId,
        featureType
      }, {}, true); // Enable retry for this critical endpoint
    },
    resetUsageCount: (userId: string, featureType: string) =>
      apiCall<any>("POST", "/usage/reset", { userId, featureType }),
    logActivity: (params: { actionType: string, description?: string }) =>
      apiCall<any>("POST", "/usage/log-activity", params),
    getFeatureUsage: (userId: string, featureType: string) =>
      apiCall<any>("GET", `/usage/${userId}/${featureType}`),
    getAllFeatureUsage: async (userId: string) => {
      // Add fallback data for when the backend is not available
      if (!IS_BACKEND_RUNNING) {
        console.warn("Backend appears to be offline, returning fallback usage data");
        return Promise.resolve({
          data: {
            // Provide default usage data that won't block the UI
            features: {},
            limits: {
              // Default limits that won't restrict users when backend is down
              resumeOptimize: { limit: 999, used: 0 },
              coverLetterGenerate: { limit: 999, used: 0 },
              jobDescriptionAnalyze: { limit: 999, used: 0 }
            }
          },
          error: null
        });
      }
      
      try {
        // Use retry mechanism for this important endpoint
        const result = await apiCall<any>("GET", `/usage/all/${userId}`, undefined, {}, true);
        
        // If we get a subscription error, provide fallback data instead of failing
        if (result.error && (
          result.error.includes('No subscription found') || 
          result.error.includes('subscription') ||
          result.error.includes('500')
        )) {
          console.warn("Subscription retrieval failed, using fallback usage data:", result.error);
          return {
            data: {
              // Provide generous default usage data when subscription lookup fails
              features: {},
              limits: {
                resumeOptimize: { limit: 10, used: 0 },
                coverLetterGenerate: { limit: 10, used: 0 },
                jobDescriptionAnalyze: { limit: 10, used: 0 }
              }
            },
            error: null
          };
        }
        
        return result;
      } catch (error) {
        console.warn("Usage API call failed, using fallback data:", error);
        return {
          data: {
            features: {},
            limits: {
              resumeOptimize: { limit: 10, used: 0 },
              coverLetterGenerate: { limit: 10, used: 0 },
              jobDescriptionAnalyze: { limit: 10, used: 0 }
            }
          },
          error: null
        };
      }
    }
  },
  resumeBuilder: {
    // Note: getTemplates method moved to resumeBuilderApi.ts to avoid duplication
    getTemplates: resumeBuilderApi.getTemplates,
    extractResumeData: async (file: File | null, useDefaultResume: boolean = false) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const formData = new FormData();
        
        if (!useDefaultResume && file) {
          formData.append('resumeFile', file);
        }
        
        // Add a flag to indicate whether to use the default resume
        formData.append('useDefaultResume', useDefaultResume.toString());
        
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
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
    // Note: buildResume method moved to resumeBuilderApi.ts to avoid duplication
    // Use resumeBuilderApi.buildResume() instead
    buildResume: resumeBuilderApi.buildResume,
    
    // Special method for template rendering that uses FormData like resumeBuilderApi
    // This matches the backend's expected format
    buildResumeForTemplate: async (params: { resumeData: string; templateId: string; color: string }): Promise<{ data: any | null; error: string | null }> => {
      console.log('API: Building resume for template with params:', { templateId: params.templateId, color: params.color });
      
      // Validate required parameters
      if (!params.templateId) {
        console.error('API: TemplateId is required but was not provided:', params.templateId);
        return { data: null, error: 'TemplateId is required' };
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Create FormData like resumeBuilderApi does
        const formData = new FormData();
        formData.append('templateId', params.templateId);
        formData.append('resumeData', params.resumeData);
        if (params.color) {
          formData.append('color', params.color);
        }
        
        console.log('API: Sending FormData to /resumebuilder/build with:', {
          templateId: params.templateId,
          color: params.color,
          resumeDataLength: params.resumeData.length
        });

        const headers: Record<string, string> = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`${API_BASE_URL}/resumebuilder/build`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API: Template build failed:', response.status, errorText);
          return { data: null, error: `Request failed with status ${response.status}: ${errorText}` };
        }

        const result = await response.json();
        console.log('API: Template build response:', result);
        return { data: result, error: null };
        
      } catch (error) {
        console.error('API: Template build error:', error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to build resume for template" 
        };
      }
    },
    downloadResume: async ({
      resumeText,
      format,
      accessToken
    }: {
      resumeText: string;
      format: string;
      accessToken?: string;
    }) => {      
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token;        
      const response = await fetch(`${API_BASE_URL}/resumebuilder/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ resumeText, format }),
        credentials: "include"
      });
      return response;
    },
    optimizeResumeForResumeBuilder: async (params: { resumeData: string; templateId: string; accessToken?: string; }) => {
      try {
        let accessToken = params.accessToken;
        if (!accessToken) {
          const { data: { session } } = await supabase.auth.getSession();
          accessToken = session?.access_token;
        }
        console.log(`Building resume with template ID: ${params.templateId}`);
        const response = await fetch(`${API_BASE_URL}/resumebuilder/optimize-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify(params),
          credentials: "include"
        });
        const data = await response.json();
        return { data, error: data.error || null };
      } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : String(error) };
      }
    },
    enhanceResumeForResumeBuilder: async (params: { resumeData: string; templateId: string; accessToken?: string; }) => {
      try {
        let accessToken = params.accessToken;
        if (!accessToken) {
          const { data: { session } } = await supabase.auth.getSession();
          accessToken = session?.access_token;
        }
        console.log(`Enhancing resume (100% ATS) with template ID: ${params.templateId}`);
        const response = await fetch(`${API_BASE_URL}/resumebuilder/enhance-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify(params),
          credentials: "include"
        });
        const data = await response.json();
        return { data, error: data.error || null };
      } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : String(error) };
      }
    }
  },
  resume: {
    // Default resume management
    getDefaultResume: async () => {
      console.log("Calling getDefaultResume API endpoint");
      
      // First try the resume-specific endpoint
      const result = await apiCall<any>("GET", "/resume/default");
      console.log("getDefaultResume API response:", result);
      
      // If that fails, fall back to the profile metadata endpoint
      if (!result.data || result.error) {
        console.log("Resume endpoint failed, falling back to profile metadata endpoint");
        const profileResult = await api.profileMetadata.getDefaultResume();
        console.log("Profile metadata fallback response:", profileResult);
        return profileResult;
      }
      
      return result;
    },
    
    checkDefaultResumeExists: async () => {
      console.log("Checking if default resume file exists");
      try {
        const result = await apiCall<any>("GET", "/resume/check-default");
        
        // If the API call fails, fall back to checking if we have a default resume in the client
        if (result.error || !result.data) {
          console.warn("Backend check for default resume failed, falling back to client-side check");
          const clientResult = await api.resume.getDefaultResume();
          
          // If we have client-side data with a fileUrl, consider it exists
          if (clientResult.data?.fileUrl) {
            return { 
              data: { exists: true, message: "Default resume found in client data" }, 
              error: null 
            };
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error checking if default resume exists:", error);
        return { data: null, error: "Failed to check if default resume exists" };
      }
    },
    
    uploadDefaultResume: async (file: File) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const formData = new FormData();
        formData.append('file', file);
        
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/resume/default`, {
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
        console.error("Default resume upload error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to upload default resume" 
        };
      }
    },
    
    deleteDefaultResume: () => apiCall<any>("DELETE", "/resume/default"),
    
    // Existing resume methods
    analyze: (file: File, jobDescription: string, plan?: string, useDefaultResume?: boolean) =>
      apiCall<any>("POST", "/resume/analyze", { file, jobDescription, plan, useDefaultResume }),
    
    optimize: async (file: File, plan?: string, useDefaultResume?: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      
      if (!useDefaultResume) {
        formData.append("File", file);
      } else {
        formData.append("useDefaultResume", "true");
      }
      
      if (plan) formData.append("plan", plan);
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      return fetch(`${API_BASE_URL}/resume/optimize`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include"
      }).then(async response => {
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data?.error || "Error optimizing resume" };
      });
    },
    
    customize: async (file: File | null, jobDescription?: string, jobDescriptionFile?: File | null, plan?: string, useDefaultResume: boolean = false) => {
      console.log("Resume customize API call with params:", {
        hasFile: !!file,
        hasJobDescription: !!jobDescription,
        hasJobDescriptionFile: !!jobDescriptionFile,
        plan,
        useDefaultResume
      });
      
      // Initialize defaultResumeResult variable outside the if block so it's accessible throughout the function
      let defaultResumeResult: { data: any | null; error: string | null } = { data: null, error: null };
      
      // If using default resume, first check if we can get the default resume
      if (useDefaultResume) {
        // Get the default resume to verify it exists
        defaultResumeResult = await api.resume.getDefaultResume();
        console.log("Checking default resume before customization:", defaultResumeResult);
        
        if (!defaultResumeResult.data || defaultResumeResult.error) {
          return { 
            data: null, 
            error: "No default resume found. Please upload a resume file or set a default resume." 
          };
        }
        
        // Also check if the default resume file exists on the server
        try {
          // Make a direct API call to check if the default resume file exists
          const checkResult = await apiCall<any>("GET", "/resume/check-default");
          console.log("Default resume file check result:", checkResult);
          
          if (checkResult.error || !checkResult.data || !checkResult.data.exists) {
            console.warn("Default resume check failed, but continuing with client-side file access attempt");
            // Log the specific error for debugging
            if (checkResult.error) {
              console.warn("Default resume check error:", checkResult.error);
            }
            if (!checkResult.data) {
              console.warn("Default resume check returned no data");
            } else if (!checkResult.data.exists) {
              console.warn("Default resume check indicates file does not exist");
            }
            
            // Instead of returning an error immediately, we'll continue and try to use the client-side file
            // This allows the process to continue even if the backend check fails
            // We'll rely on the fileUrl check below to verify if we can access the file
          }
          
          // If we have a fileUrl, try to download the file to verify it's accessible
          if (defaultResumeResult.data?.fileUrl) {
            try {
              console.log("Attempting to verify default resume file is accessible");
              const fileResponse = await fetch(defaultResumeResult.data.fileUrl, { method: 'HEAD' });
              
              if (!fileResponse.ok) {
                console.error("Default resume file is not accessible:", fileResponse.status);
                return {
                  data: null,
                  error: "Your default resume file could not be accessed. Please upload a new resume file."
                };
              }
              
              console.log("Default resume file is accessible");
            } catch (fileError) {
              console.error("Error accessing default resume file:", fileError);
              // Continue anyway, as the backend might still be able to access the file
            }
          }
        } catch (error) {
          console.error("Error checking default resume file:", error);
          // Continue anyway, as the backend might still be able to access the file
        }
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      
      // Add a flag to indicate whether to use the default resume
      // Make sure to use the exact field name expected by the backend
      formData.append("useDefaultResume", useDefaultResume.toString());
      
      // Also add it as "UseDefaultResume" with capital letters in case the backend is case-sensitive
      formData.append("UseDefaultResume", useDefaultResume.toString());
      
      console.log("Setting useDefaultResume in form data to:", useDefaultResume.toString());
      
      // Only append the file if not using default resume and file exists
      if (!useDefaultResume && file) {
        formData.append("File", file); // Backend expects 'File' (capital F)
        console.log("Appending file to form data:", file.name, file.size);
      } else if (useDefaultResume) {
        console.log("Using default resume, not appending file");
        
        // As a fallback, if we have the default resume data with a fileUrl,
        // try to download the file and include it directly
        if (defaultResumeResult.data?.fileUrl) {
          try {
            console.log("Attempting to download default resume file as fallback");
            // Use a more robust fetch with proper error handling and timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const fileResponse = await fetch(defaultResumeResult.data.fileUrl, {
              signal: controller.signal,
              cache: 'no-cache', // Avoid caching issues
              mode: 'cors',      // Explicitly set CORS mode
              credentials: 'include'
            });
            
            clearTimeout(timeoutId);
            
            if (fileResponse.ok) {
              const blob = await fileResponse.blob();
              const fileName = defaultResumeResult.data.fileName || "default-resume.pdf";
              const resumeFile = new File([blob], fileName, { type: blob.type || 'application/pdf' });
              
              console.log("Successfully downloaded default resume file, appending to form data");
              formData.append("File", resumeFile);
              
              // Still keep the useDefaultResume flag in case the backend can use either approach
              console.log("Adding downloaded file as fallback but keeping useDefaultResume flag");
            } else {
              console.error("Failed to download default resume file:", fileResponse.status, fileResponse.statusText);
              // Don't return error here, let the backend try to handle it with the useDefaultResume flag
            }
          } catch (downloadError) {
            console.error("Error downloading default resume file:", downloadError);
            // Continue with the useDefaultResume flag approach
          }
        }
      } else {
        console.log("WARNING: Neither file nor useDefaultResume is set!");
        return { 
          data: null, 
          error: "No resume provided. Please upload a resume file or use your default resume." 
        };
      }
      
      if (jobDescription) formData.append("JobDescription", jobDescription);
      if (jobDescriptionFile) formData.append("JobDescriptionFile", jobDescriptionFile);
      if (plan) formData.append("plan", plan);
      
      // Add user ID to form data to help backend identify the user
      if (session?.user?.id) {
        formData.append("userId", session.user.id);
        formData.append("UserId", session.user.id);
      }
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
        
        // Add user ID as a custom header to help the backend identify the user
        if (session.user?.id) {
          headers["X-User-ID"] = session.user.id;
        }
      }
      // Construct URL with query parameter for default resume
      const url = useDefaultResume 
        ? `${API_BASE_URL}/resume/customize?useDefaultResume=true` 
        : `${API_BASE_URL}/resume/customize`;
      
      console.log("Making API call to:", url);
      console.log("With headers:", headers);
      
      return fetch(url, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include"
      }).then(async response => {
        console.log("Resume customize API response status:", response.status);
        
        const contentType = response.headers.get("content-type");
        console.log("Response content type:", contentType);
        
        let data;
        let responseText;
        
        try {
          responseText = await response.text();
          console.log("Raw response text:", responseText);
          
          if (contentType && contentType.includes("application/json")) {
            data = JSON.parse(responseText);
            console.log("Parsed JSON response:", data);
          } else {
            data = { text: responseText };
            console.log("Non-JSON response, using as text");
          }
        } catch (error) {
          console.error("Error parsing response:", error);
          data = { parseError: true, text: responseText };
        }
        
        if (!response.ok) {
          console.error("API error response:", data);
          return { data: null, error: data?.error || "Error customizing resume" };
        }
        
        return { data, error: null };
      });
    },
    atsScan: async (file: File | null, plan?: string, useDefaultResume: boolean = false) => {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      
      if (!useDefaultResume && file) {
        formData.append("File", file);
      }
      
      // Add a flag to indicate whether to use the default resume
      formData.append('useDefaultResume', useDefaultResume.toString());
      
      if (plan) formData.append("plan", plan);
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      return fetch(`${API_BASE_URL}/resume/scan-ats`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include"
      }).then(async response => {
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data?.error || "Error scanning resume with ATS" };
      });
    },
    benchmark: (file: File, plan?: string) =>
      apiCall<any>("POST", "/resume/benchmark", { file, plan }),
    salaryInsights: async (formData: FormData, plan?: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        if (plan) {
          formData.append('plan', plan);
        }
        
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
        
        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        console.error("Salary insights error:", error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : "Failed to get salary insights" 
        };
      }
    }
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
  template: {
    getCss: async (templateId: string, color: string): Promise<{ data: string | null; error: string | null }> => {
      const endpoint = `/template/${templateId}/css?color=${encodeURIComponent(color)}&timestamp=${Date.now()}`;
      console.log('API: Fetching template CSS for:', templateId, 'color:', color);
      
      const result = await apiCall<string>("GET", endpoint, undefined, {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      
      if (result.data && !result.data.includes(color)) {
        console.warn('API: CSS does not contain requested color:', color);
      }
      
      return result;
    },
    
    getHtml: async (templateId: string): Promise<{ data: string | null; error: string | null }> => {
      const endpoint = `/template/${templateId}/html`;
      console.log('API: Fetching template HTML for:', templateId);
      
      return await apiCall<string>("GET", endpoint, undefined, {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
    }
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
