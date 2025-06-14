import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { api } from '@/utils/apiClient';
import { SUPABASE_URL, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractFileKey } from '@/lib/utils';

// Helper function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

// Helper function to convert object keys from snake_case to camelCase
const keysToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = keysToCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

export interface ResumeMetadata {
  userId?: string;
  jobTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: string;
  professionalBio?: string;
  location?: string;
  phoneNumber?: string;
  skills?: string[];
  lastUpdated?: Date | null;
}

export interface ProfileStatus {
  hasResume: boolean;
  hasBasicInfo: boolean;
  hasDetailedInfo: boolean;
  completionPercentage: number;
  lastUpdated?: Date;
  nextSteps?: string[];
}

export interface ResumeContextType {
  defaultResume: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    uploadDate?: Date | null;
    blobPath?: string;
    metadata?: ResumeMetadata;
    isVisibleToRecruiters?: boolean;
  } | null;
  profileStatus: ProfileStatus | null;
  isLoading: boolean;
  uploadDefaultResume: (file: File) => Promise<boolean>;
  clearDefaultResume: () => Promise<void>;
  refreshDefaultResume: () => Promise<void>;
  updateResumeMetadata: (metadata: Partial<ResumeMetadata>) => Promise<boolean>;
  updateResumeVisibility: (isVisible: boolean) => Promise<boolean>;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [defaultResume, setDefaultResume] = useState<ResumeContextType['defaultResume']>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log(`Loading resume data for user ${user.id}`);
      refreshDefaultResume();
    } else {
      setDefaultResume(null);
      setProfileStatus(null);
      setIsLoading(false);
    }
  }, [user]);

  // Add a ref to track if a refresh is in progress
  const isRefreshingRef = React.useRef(false);
  
  // Add a ref to track the last refresh time
  const lastRefreshTimeRef = React.useRef(0);
  
  // Debounce time in milliseconds (500ms is a good balance)
  const DEBOUNCE_TIME = 500;
  
  // Create a ref to store the current refresh promise
  const currentRefreshPromiseRef = React.useRef<Promise<void> | null>(null);
  
  // Function to refresh the default resume data
  const refreshDefaultResume = async () => {
    if (!user) return;
    
    // Get current time
    const now = Date.now();
    
    // Log the current state for debugging
    console.log("Current resume state before refresh:", {
      hasDefaultResume: !!defaultResume,
      fileName: defaultResume?.fileName,
      blobPath: defaultResume?.blobPath,
      fileUrl: defaultResume?.fileUrl,
      profileStatus: profileStatus ? JSON.stringify(profileStatus) : null
    });
    
    // Check if we've refreshed recently (within debounce time)
    if (now - lastRefreshTimeRef.current < DEBOUNCE_TIME) {
      console.log(`Skipping refresh - last refresh was ${now - lastRefreshTimeRef.current}ms ago`);
      
      // If there's a current refresh in progress, return that promise
      if (currentRefreshPromiseRef.current) {
        console.log("Returning existing refresh promise");
        return currentRefreshPromiseRef.current;
      }
      
      return;
    }
    
    // If already refreshing, return the current promise
    if (isRefreshingRef.current && currentRefreshPromiseRef.current) {
      console.log("Refresh already in progress, returning existing promise");
      return currentRefreshPromiseRef.current;
    }
    
    // Update last refresh time
    lastRefreshTimeRef.current = now;
    
    // Set a flag to track this specific refresh operation
    const refreshId = now;
    console.log(`Starting resume refresh operation ${refreshId}`);
    
    isRefreshingRef.current = true;
    setIsLoading(true);
    
    // Create a new promise for this refresh operation
    const refreshPromise = (async () => {
      try {
        console.log(`[${new Date().toISOString()}] Refreshing default resume data...`);
        const response = await api.profileMetadata.getDefaultResume();
        const { data, error, profileStatus: apiProfileStatus } = response;
        
        console.log("API response:", { 
          data: data ? JSON.stringify(data, null, 2) : null, 
          error, 
          profileStatus: apiProfileStatus ? JSON.stringify(apiProfileStatus, null, 2) : null 
        });
        
        if (error) {
          console.error("Error fetching default resume:", error);
          
          // Show a user-friendly error message
          toast({
            variant: "destructive",
            title: "Unable to load profile data",
            description: "Please try again later or contact support if the problem persists."
          });
          return;
        }
        
        // Handle profile status first
      if (apiProfileStatus) {
        console.log("Setting profile status from API:", apiProfileStatus);
        
        // Make sure we have the correct resume status
        // Convert data to camelCase if it exists
        const camelData = data ? keysToCamelCase(Array.isArray(data) ? data[0] : data) : null;
        
        // Enhanced check for resume existence - check both in apiProfileStatus and in the actual data
        const hasResume = apiProfileStatus.hasResume || 
                         (camelData && (
                           (!!camelData.fileName && !!camelData.blobPath) || 
                           !!camelData.fileUrl || 
                           (camelData.metadata && (
                             (!!camelData.metadata.fileName && !!camelData.metadata.blobPath) || 
                             !!camelData.metadata.fileUrl
                           ))
                         ));
        
        console.log("Resume existence check:", {
          apiProfileStatusHasResume: apiProfileStatus.hasResume,
          camelDataExists: !!camelData,
          fileName: camelData?.fileName || camelData?.metadata?.fileName,
          blobPath: camelData?.blobPath || camelData?.metadata?.blobPath,
          fileUrl: camelData?.fileUrl || camelData?.metadata?.fileUrl,
          hasResume
        });
        
        const updatedProfileStatus = {
          ...apiProfileStatus,
          hasResume,
          lastUpdated: apiProfileStatus.lastUpdated ? new Date(apiProfileStatus.lastUpdated) : undefined
        };
        
        console.log("Final profile status:", updatedProfileStatus);
        setProfileStatus(updatedProfileStatus);
      } else {
        // Fallback if no profile status is provided
        const camelData = data ? keysToCamelCase(Array.isArray(data) ? data[0] : data) : null;
        const hasResume = camelData && (
          (!!camelData.fileName && !!camelData.blobPath) || 
          !!camelData.fileUrl || 
          (camelData.metadata && (
            (!!camelData.metadata.fileName && !!camelData.metadata.blobPath) || 
            !!camelData.metadata.fileUrl
          ))
        );
        
        setProfileStatus({
          hasResume: hasResume || false,
          hasBasicInfo: false,
          hasDetailedInfo: false,
          completionPercentage: 0
        });
      }
      
      // Now handle the resume data
      if (data) {
        // Log the raw data for debugging
        console.log("Raw resume data from API:", JSON.stringify(data, null, 2));
        
        // Check if data is an array and use the first item if it is
        let resumeData = Array.isArray(data) ? data[0] : data;
        
        console.log("Resume data before processing:", JSON.stringify(resumeData, null, 2));
        
        // Convert snake_case keys to camelCase
        resumeData = keysToCamelCase(resumeData);
        
        console.log("Resume data after camelCase conversion:", JSON.stringify(resumeData, null, 2));
        
        // Extract the metadata object from the response
        // Handle both formats: direct properties or nested in metadata
        const metadataObj = resumeData.metadata || resumeData;
        
        // Log the properties we're looking for - check both camelCase and snake_case
        const fileUrl = resumeData.fileUrl || resumeData.file_url || metadataObj.fileUrl || metadataObj.file_url;
        const fileName = resumeData.fileName || resumeData.file_name || metadataObj.fileName || metadataObj.file_name;
        const fileSize = resumeData.fileSize || resumeData.file_size || metadataObj.fileSize || metadataObj.file_size;
        const uploadDate = resumeData.uploadDate || resumeData.upload_date || metadataObj.uploadDate || metadataObj.upload_date;
        const blobPath = resumeData.blobPath || resumeData.blob_path || metadataObj.blobPath || metadataObj.blob_path;
        
        console.log("Looking for resume properties:", {
          fileUrl,
          fileName,
          fileSize,
          uploadDate,
          blobPath
        });
        console.log("Metadata object:", JSON.stringify(metadataObj, null, 2));
        console.log("Resume data object:", JSON.stringify(resumeData, null, 2));
        
        // Extract metadata fields (now all in camelCase)
        const metadata = {
          jobTitle: metadataObj.jobTitle || '',
          currentCompany: metadataObj.currentCompany || '',
          yearsOfExperience: metadataObj.yearsOfExperience || '',
          professionalBio: metadataObj.professionalBio || '',
          location: metadataObj.location || '',
          phoneNumber: metadataObj.phoneNumber || '',
          skills: metadataObj.skills || [],
          lastUpdated: metadataObj.lastUpdated 
            ? new Date(metadataObj.lastUpdated) 
            : null
        };
        
        console.log("Extracted metadata:", JSON.stringify(metadata, null, 2));
        
        // Construct a proper fileUrl if it's missing but we have a blobPath
        let finalFileUrl = fileUrl;
        
        if (!finalFileUrl && blobPath) {
          console.log("No fileUrl found, constructing from blobPath:", blobPath);
          
          if (blobPath.startsWith('http')) {
            // If it's already a full URL
            finalFileUrl = blobPath;
          } else if (blobPath.includes('user-resumes')) {
            // Use the supabase client to get a public URL
            try {
              // Extract the file key using our helper function
              const fileKey = extractFileKey(blobPath);
              console.log("ResumeContext - Extracted file key:", fileKey);
              
              if (fileKey) {
                const { data } = supabase.storage.from('user-resumes').getPublicUrl(fileKey);
                finalFileUrl = data.publicUrl;
                console.log("ResumeContext - Generated public URL:", finalFileUrl);
              } else {
                console.error("ResumeContext - Could not extract file key from blob path:", blobPath);
                finalFileUrl = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${blobPath}`;
              }
            } catch (err) {
              console.error("ResumeContext - Error generating public URL:", err);
              // Fallback to direct URL
              finalFileUrl = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${blobPath}`;
            }
          } else {
            // Default API endpoint
            finalFileUrl = `/api/files/${blobPath}`;
          }
          
          console.log("Constructed fileUrl:", finalFileUrl);
        }
        
        // Create the resume object with the extracted properties
        const resumeObject = {
          fileUrl: finalFileUrl,
          fileName: fileName,
          fileSize: fileSize,
          uploadDate: uploadDate 
            ? new Date(uploadDate) 
            : null,
          blobPath: blobPath,
          metadata: metadata
        };
        
        console.log("Final resume object to be set:", resumeObject);
        
        // Enhanced validation to ensure we have valid data
        console.log("Validating resume object properties:", {
          fileUrl: resumeObject.fileUrl ? "present" : "missing",
          fileName: resumeObject.fileName ? "present" : "missing",
          blobPath: resumeObject.blobPath ? "present" : "missing"
        });
        
        // Check if we have at least one valid property before setting the state
        // More permissive check - if we have either a blobPath or a fileName, we'll consider it valid
        if (resumeObject.blobPath || resumeObject.fileName || resumeObject.fileUrl) {
          console.log("Resume object has valid properties, setting state");
          setDefaultResume(resumeObject);
          
          // Also update the profile status to reflect that we have a resume
          if (profileStatus && !profileStatus.hasResume) {
            console.log("Updating profile status to reflect resume existence");
            setProfileStatus({
              ...profileStatus,
              hasResume: true
            });
          }
        } else {
          console.error("No valid properties found in resume data");
          
          // Make a direct API call to check if the resume exists
          console.log("Making direct API call to verify resume existence");
          try {
            // Try to get the data directly from the API
            const verifyResponse = await api.profileMetadata.getDefaultResume();
            console.log("Verification API response:", verifyResponse);
            
            // If we got valid data from the verification call, use it
            if (verifyResponse.data && !verifyResponse.error) {
              console.log("Using data from verification API call");
              
              // Process the verification data
              const verifyData = Array.isArray(verifyResponse.data) 
                ? verifyResponse.data[0] 
                : verifyResponse.data;
                
              // Convert to camelCase
              const verifyCamelData = keysToCamelCase(verifyData);
              
              // Extract file properties - check both in the root and in metadata
              const verifyFileUrl = verifyCamelData.fileUrl || verifyCamelData.file_url || 
                                   (verifyCamelData.metadata && (verifyCamelData.metadata.fileUrl || verifyCamelData.metadata.file_url));
              const verifyFileName = verifyCamelData.fileName || verifyCamelData.file_name || 
                                    (verifyCamelData.metadata && (verifyCamelData.metadata.fileName || verifyCamelData.metadata.file_name));
              const verifyFileSize = verifyCamelData.fileSize || verifyCamelData.file_size || 
                                    (verifyCamelData.metadata && (verifyCamelData.metadata.fileSize || verifyCamelData.metadata.file_size));
              const verifyBlobPath = verifyCamelData.blobPath || verifyCamelData.blob_path || 
                                    (verifyCamelData.metadata && (verifyCamelData.metadata.blobPath || verifyCamelData.metadata.blob_path));
              
              // Construct a URL if we have a blob path but no URL
              let finalVerifyFileUrl = verifyFileUrl;
              if (!finalVerifyFileUrl && verifyBlobPath) {
                if (verifyBlobPath.startsWith('http')) {
                  finalVerifyFileUrl = verifyBlobPath;
                } else if (verifyBlobPath.includes('storage/')) {
                  finalVerifyFileUrl = `${SUPABASE_URL}/storage/v1/object/public/${verifyBlobPath}`;
                } else if (verifyBlobPath.includes('user-resumes/')) {
                  finalVerifyFileUrl = `${SUPABASE_URL}/storage/v1/object/public/${verifyBlobPath}`;
                } else {
                  finalVerifyFileUrl = `/api/files/${verifyBlobPath}`;
                }
              }
              
              // More permissive check - if we have either a blobPath or a fileName, we'll consider it valid
              if (verifyBlobPath || verifyFileName || finalVerifyFileUrl) {
                const verifyResumeObject = {
                  fileUrl: finalVerifyFileUrl,
                  fileName: verifyFileName,
                  fileSize: verifyFileSize,
                  uploadDate: verifyCamelData.uploadDate 
                    ? new Date(verifyCamelData.uploadDate) 
                    : new Date(),
                  blobPath: verifyBlobPath,
                  metadata: metadata
                };
                
                console.log("Setting resume from verification data:", verifyResumeObject);
                setDefaultResume(verifyResumeObject);
                
                // Also update the profile status to reflect that we have a resume
                if (profileStatus && !profileStatus.hasResume) {
                  console.log("Updating profile status to reflect resume existence from verification");
                  setProfileStatus({
                    ...profileStatus,
                    hasResume: true
                  });
                }
              }
            }
          } catch (verifyError) {
            console.error("Error during verification API call:", verifyError);
          }
        }
        
        // Force a profile status update if we have resume data but profile status says we don't
        if (profileStatus && !profileStatus.hasResume) {
          console.log("Forcing profile status update because we have resume data");
          const updatedStatus = {
            ...profileStatus,
            hasResume: true,
            completionPercentage: Math.max(profileStatus.completionPercentage || 0, 10) // Ensure at least 10% completion
          };
          setProfileStatus(updatedStatus);
        }
      } else {
        console.log("No resume data found");
        setDefaultResume(null);
      }
    } catch (error) {
      console.error("Exception fetching default resume:", error);
      
      // Show a user-friendly error message
      toast({
        variant: "destructive",
        title: "Unable to load profile data",
        description: "An unexpected error occurred. Please try again later."
      });
    } finally {
      setIsLoading(false);
      
      // Reset the refreshing flag
      isRefreshingRef.current = false;
      
      // Calculate elapsed time
      const elapsedTime = Date.now() - lastRefreshTimeRef.current;
      console.log(`Resume refresh completed in ${elapsedTime}ms`);
      
      // Log the current state for debugging
      console.log("Current resume state after refresh:", {
        hasResume: !!defaultResume,
        hasFileUrl: defaultResume?.fileUrl ? "yes" : "no",
        hasFileName: defaultResume?.fileName ? "yes" : "no",
        hasBlobPath: defaultResume?.blobPath ? "yes" : "no",
        fileName: defaultResume?.fileName,
        blobPath: defaultResume?.blobPath,
        fileUrl: defaultResume?.fileUrl,
        profileStatus: profileStatus ? {
          hasResume: profileStatus.hasResume,
          hasBasicInfo: profileStatus.hasBasicInfo,
          hasDetailedInfo: profileStatus.hasDetailedInfo,
          completionPercentage: profileStatus.completionPercentage,
          lastUpdated: profileStatus.lastUpdated
        } : "none"
      });
      
      // Clear the current promise reference after a short delay
      // This allows closely timed calls to still use the same promise
      setTimeout(() => {
        if (currentRefreshPromiseRef.current) {
          currentRefreshPromiseRef.current = null;
        }
      }, 100);
    }
  })();
  
  // Store the promise in the ref
  currentRefreshPromiseRef.current = refreshPromise;
  
  // Return the promise
  return refreshPromise;
  };
  
  // Helper function to calculate completion percentage if not provided by API
  const calculateCompletionPercentage = (data: any): number => {
    if (!data) return 0;
    
    // Create named fields for better debugging
    const fieldStatus = {
      hasResume: !!data.fileName && !!data.blobPath,
      hasJobTitle: !!(data.metadata?.jobTitle),
      hasCompany: !!(data.metadata?.currentCompany),
      hasExperience: !!(data.metadata?.yearsOfExperience),
      hasBio: !!(data.metadata?.professionalBio),
      hasLocation: !!(data.metadata?.location),
      hasPhone: !!(data.metadata?.phoneNumber),
      hasSkills: !!(data.metadata?.skills && data.metadata.skills.length > 0)
    };
    
    console.log("Profile completion field status:", fieldStatus);
    
    // Convert to array for calculation
    const fields = Object.values(fieldStatus);
    
    const filledFields = fields.filter(Boolean).length;
    const percentage = Math.round((filledFields / fields.length) * 100);
    
    console.log(`Profile completion: ${filledFields}/${fields.length} fields = ${percentage}%`);
    
    return percentage;
  };

  // Function to upload a new default resume
  const uploadDefaultResume = async (file: File): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to upload a resume."
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log("Uploading default resume:", file.name);
      const { data, error } = await api.profileMetadata.uploadDefaultResume(file);
      
      if (error) {
        console.error("Error uploading resume:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error
        });
        return false;
      }
      
      if (data) {
        console.log("Resume upload successful, data:", data);
        
        // Convert snake_case keys to camelCase
        const camelData = keysToCamelCase(data);
        console.log("Resume upload data after camelCase conversion:", camelData);
        
        // Update the default resume state
        const newResumeData = {
          fileUrl: camelData.fileUrl,
          fileName: camelData.fileName,
          fileSize: camelData.fileSize,
          uploadDate: camelData.uploadDate ? new Date(camelData.uploadDate) : new Date(),
          blobPath: camelData.blobPath,
          metadata: camelData.metadata ? {
            ...camelData.metadata,
            lastUpdated: camelData.metadata.lastUpdated ? new Date(camelData.metadata.lastUpdated) : new Date()
          } : undefined
        };
        
        setDefaultResume(newResumeData);
        
        // Update the profile status to reflect that we now have a resume
        const newProfileStatus = !profileStatus 
          ? {
              hasResume: true,
              hasBasicInfo: false,
              hasDetailedInfo: false,
              completionPercentage: 10 // Start with 10% for having a resume
            }
          : {
              ...profileStatus,
              hasResume: true,
              completionPercentage: Math.max(profileStatus.completionPercentage, 10) // Ensure at least 10% completion
            };
            
        setProfileStatus(newProfileStatus);
        
        // Update the last refresh time to prevent immediate refresh
        lastRefreshTimeRef.current = Date.now();
        
        // No need to refresh immediately since we've already updated the local state
        // This prevents duplicate API calls and improves performance
        
        // For paid users, automatically set visibility to true
        if (user.subscription && user.subscription.type !== 'free') {
          console.log("Paid user detected, automatically setting resume visibility to true");
          try {
            const visibilityResult = await api.profileMetadata.updateResumeVisibility(true);
            
            if (!visibilityResult.error) {
              // Update local state with visibility
              setDefaultResume(prev => prev ? {
                ...prev,
                isVisibleToRecruiters: true
              } : null);
              
              toast({
                title: "Resume Uploaded",
                description: "Your resume has been uploaded and is now visible to recruiters."
              });
            } else {
              console.error("Error setting initial visibility:", visibilityResult.error);
              toast({
                title: "Resume Uploaded",
                description: "Your resume has been uploaded successfully."
              });
            }
          } catch (err) {
            console.error("Error setting initial visibility:", err);
            toast({
              title: "Resume Uploaded",
              description: "Your resume has been uploaded successfully."
            });
          }
        } else {
          toast({
            title: "Resume Uploaded",
            description: "Your resume has been uploaded successfully."
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "An unexpected error occurred. Please try again."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear the default resume
  const clearDefaultResume = async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] ResumeContext - Calling deleteDefaultResume instead of clearDefaultResume`);
      const { error } = await api.profileMetadata.deleteDefaultResume();
      
      if (error) {
        console.error("Error clearing resume:", error);
        toast({
          variant: "destructive",
          title: "Operation Failed",
          description: error
        });
        return;
      }
      
      setDefaultResume(null);
      
      // Update the profile status to reflect that we no longer have a resume
      if (profileStatus) {
        const updatedStatus = {
          ...profileStatus,
          hasResume: false,
          completionPercentage: Math.max(0, profileStatus.completionPercentage - 10) // Reduce completion by 10%
        };
        setProfileStatus(updatedStatus);
      }
      
      toast({
        title: "Resume Removed",
        description: "Your default resume has been removed."
      });
    } catch (error) {
      console.error("Error clearing resume:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update resume metadata
  const updateResumeMetadata = async (metadata: Partial<ResumeMetadata>): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to update your profile."
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log("Updating resume metadata:", metadata);
      const { data, error } = await api.profileMetadata.updateResumeMetadata(metadata);
      
      if (error) {
        console.error("Error updating resume metadata:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error
        });
        return false;
      }
      
      if (data) {
        console.log("Resume metadata update successful, data:", data);
        
        // Update local state immediately for a responsive UI
        if (defaultResume && defaultResume.metadata) {
          const updatedResume = {
            ...defaultResume,
            metadata: {
              ...defaultResume.metadata,
              ...metadata,
              lastUpdated: new Date()
            }
          };
          setDefaultResume(updatedResume);
        }
        
        // Update the last refresh time to prevent immediate refresh
        lastRefreshTimeRef.current = Date.now();
        
        // No need to refresh immediately since we've already updated the local state
        // This prevents duplicate API calls and improves performance
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error updating resume metadata:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update resume visibility to recruiters
  const updateResumeVisibility = async (isVisible: boolean): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to update your resume visibility."
      });
      return false;
    }

    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "No Resume Found",
        description: "Please upload a resume first."
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log(`Updating resume visibility to: ${isVisible}`);
      const { data, error } = await api.profileMetadata.updateResumeVisibility(isVisible);
      
      if (error) {
        console.error("Error updating resume visibility:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error
        });
        return false;
      }
      
      if (data) {
        console.log("Resume visibility update successful, data:", data);
        
        // Update local state immediately for a responsive UI
        if (defaultResume) {
          const updatedResume = {
            ...defaultResume,
            isVisibleToRecruiters: isVisible
          };
          setDefaultResume(updatedResume);
        }
        
        // Update the last refresh time to prevent immediate refresh
        lastRefreshTimeRef.current = Date.now();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error updating resume visibility:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        defaultResume,
        profileStatus,
        isLoading,
        uploadDefaultResume,
        clearDefaultResume,
        refreshDefaultResume,
        updateResumeMetadata,
        updateResumeVisibility
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};