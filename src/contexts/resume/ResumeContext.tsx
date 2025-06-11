import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { api } from '@/utils/apiClient';
import { SUPABASE_URL } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  } | null;
  profileStatus: ProfileStatus | null;
  isLoading: boolean;
  uploadDefaultResume: (file: File) => Promise<boolean>;
  clearDefaultResume: () => Promise<void>;
  refreshDefaultResume: () => Promise<void>;
  updateResumeMetadata: (metadata: Partial<ResumeMetadata>) => Promise<boolean>;
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

  // Add a ref to track if we've already loaded data for this user
  const hasLoadedForUserRef = React.useRef<string | null>(null);
  
  // Fetch the user's default resume when the component mounts or user changes
  useEffect(() => {
    if (user) {
      // Only load data if we haven't loaded it for this user yet
      if (hasLoadedForUserRef.current !== user.id) {
        console.log(`Loading resume data for user ${user.id} (first time)`);
        hasLoadedForUserRef.current = user.id;
        refreshDefaultResume();
      } else {
        console.log(`Already loaded resume data for user ${user.id}, skipping`);
      }
    } else {
      hasLoadedForUserRef.current = null;
      setDefaultResume(null);
      setProfileStatus(null);
      setIsLoading(false);
    }
  }, [user]);

  // Add a ref to track if a refresh is in progress
  const isRefreshingRef = React.useRef(false);
  
  // Function to refresh the default resume data
  const refreshDefaultResume = async () => {
    if (!user) return;
    
    // Skip if already refreshing to prevent duplicate API calls
    if (isRefreshingRef.current) {
      console.log("Skipping resume refresh - already in progress");
      return;
    }
    
    isRefreshingRef.current = true;
    setIsLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] Refreshing default resume data...`);
      const response = await api.profileMetadata.getDefaultResume();
      const { data, error, profileStatus: apiProfileStatus } = response;
      
      console.log("API response:", { data, error, profileStatus: apiProfileStatus });
      
      if (error) {
        console.error("Error fetching default resume:", error);
        setDefaultResume(null);
        setProfileStatus(null);
        
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
        const hasResume = apiProfileStatus.hasResume || (camelData && (!!camelData.fileName || !!camelData.blobPath));
        
        const updatedProfileStatus = {
          ...apiProfileStatus,
          hasResume,
          lastUpdated: apiProfileStatus.lastUpdated ? new Date(apiProfileStatus.lastUpdated) : undefined
        };
        
        console.log("Final profile status:", updatedProfileStatus);
        setProfileStatus(updatedProfileStatus);
      } else {
        // Fallback if no profile status is provided
        setProfileStatus({
          hasResume: data ? true : false,
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
        const metadataObj = resumeData.metadata || resumeData;
        
        // Log the properties we're looking for
        console.log("Looking for resume properties:", {
          fileUrl: metadataObj.fileUrl || metadataObj.file_url,
          fileName: metadataObj.fileName || metadataObj.file_name,
          fileSize: metadataObj.fileSize || metadataObj.file_size,
          uploadDate: metadataObj.uploadDate || metadataObj.upload_date,
          blobPath: metadataObj.blobPath || metadataObj.blob_path
        });
        console.log("Metadata object:", JSON.stringify(metadataObj, null, 2));
        
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
        let fileUrl = metadataObj.fileUrl;
        const blobPath = metadataObj.blobPath;
        
        if (!fileUrl && blobPath) {
          console.log("No fileUrl found, constructing from blobPath:", blobPath);
          
          if (blobPath.startsWith('http')) {
            // If it's already a full URL
            fileUrl = blobPath;
          } else if (blobPath.includes('storage/')) {
            // If it's a Supabase storage path
            // Use the imported SUPABASE_URL constant
            fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${blobPath}`;
          } else {
            // Default API endpoint
            fileUrl = `/api/files/${blobPath}`;
          }
          
          console.log("Constructed fileUrl:", fileUrl);
        }
        
        // Create the resume object with proper property checks (now all in camelCase)
        const resumeObject = {
          fileUrl: fileUrl,
          fileName: metadataObj.fileName,
          fileSize: metadataObj.fileSize,
          uploadDate: metadataObj.uploadDate 
            ? new Date(metadataObj.uploadDate) 
            : null,
          blobPath: blobPath,
          metadata: metadata
        };
        
        console.log("Final resume object to be set:", resumeObject);
        
        // Ensure we have at least one valid property before setting the state
        if (resumeObject.fileUrl || resumeObject.blobPath) {
          setDefaultResume(resumeObject);
        } else {
          console.error("No valid URL properties found in resume data");
          setDefaultResume(null);
        }
        
        // Force a profile status update if we have resume data but profile status says we don't
        if (profileStatus && !profileStatus.hasResume) {
          console.log("Forcing profile status update because we have resume data");
          setProfileStatus(prevStatus => ({
            ...prevStatus,
            hasResume: true,
            completionPercentage: Math.max(prevStatus?.completionPercentage || 0, 10) // Ensure at least 10% completion
          }));
        }
      } else {
        console.log("No resume data found");
        setDefaultResume(null);
      }
    } catch (error) {
      console.error("Exception fetching default resume:", error);
      setDefaultResume(null);
      setProfileStatus(null);
      
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
      console.log("Resume refresh completed");
    }
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
        setDefaultResume({
          fileUrl: camelData.fileUrl,
          fileName: camelData.fileName,
          fileSize: camelData.fileSize,
          uploadDate: camelData.uploadDate ? new Date(camelData.uploadDate) : new Date(),
          blobPath: camelData.blobPath,
          metadata: camelData.metadata ? {
            ...camelData.metadata,
            lastUpdated: camelData.metadata.lastUpdated ? new Date(camelData.metadata.lastUpdated) : new Date()
          } : undefined
        });
        
        // Update the profile status to reflect that we now have a resume
        setProfileStatus(prevStatus => {
          if (!prevStatus) {
            return {
              hasResume: true,
              hasBasicInfo: false,
              hasDetailedInfo: false,
              completionPercentage: 10 // Start with 10% for having a resume
            };
          }
          
          return {
            ...prevStatus,
            hasResume: true,
            completionPercentage: Math.max(prevStatus.completionPercentage, 10) // Ensure at least 10% completion
          };
        });
        
        toast({
          title: "Resume Uploaded",
          description: "Your resume has been uploaded successfully."
        });
        
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
      setProfileStatus(prevStatus => {
        if (!prevStatus) return null;
        
        return {
          ...prevStatus,
          hasResume: false,
          completionPercentage: Math.max(0, prevStatus.completionPercentage - 10) // Reduce completion by 10%
        };
      });
      
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
        
        // Instead of calling refreshDefaultResume, manually update the state
        if (defaultResume && defaultResume.metadata) {
          setDefaultResume({
            ...defaultResume,
            metadata: {
              ...defaultResume.metadata,
              ...metadata,
              lastUpdated: new Date()
            }
          });
        }
        
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

  return (
    <ResumeContext.Provider
      value={{
        defaultResume,
        profileStatus,
        isLoading,
        uploadDefaultResume,
        clearDefaultResume,
        refreshDefaultResume,
        updateResumeMetadata
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};