import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/resume/ResumeContext";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ResumeFileUploaderProps {
  onFileSelected: (file: File | null) => void;
  onUseDefaultResumeChange?: (useDefault: boolean) => void;
  onDataExtracted?: (data: any) => void;
  setIsExtracting?: (isExtracting: boolean) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  showDefaultResumeOption?: boolean;
}

const ResumeFileUploader = ({ 
  onFileSelected,
  onUseDefaultResumeChange,
  onDataExtracted,
  setIsExtracting,
  disabled = false,
  accept = ".pdf,.docx,.doc,.txt",
  maxSize = 5,
  showDefaultResumeOption = true
}: ResumeFileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { defaultResume } = useResume();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<Date | null>(null);
  const [useDefaultResume, setUseDefaultResume] = useState<boolean>(defaultResume !== null && (defaultResume.fileUrl !== undefined || defaultResume.blobPath !== undefined));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (fileExtension && !acceptedTypes.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload ${accept.replace(/\./g, '')} files only.`,
      });
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Please upload a file smaller than ${maxSize}MB.`,
      });
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");
    setUploadDate(new Date());
    onFileSelected(file);

    // Auto-extract data if callbacks are provided
    if (onDataExtracted && setIsExtracting) {
      try {
        setIsExtracting(true);
        
        // Simulate data extraction (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock extracted data
        const mockData = {
          name: "John Doe",
          email: "john.doe@email.com",
          phone: "(555) 123-4567",
          location: "New York, NY",
          title: "Software Engineer",
          summary: "Experienced software engineer with 5+ years of experience...",
          skills: ["JavaScript", "React", "Node.js", "Python"],
          experience: [
            {
              title: "Senior Software Engineer",
              company: "Tech Corp",
              location: "New York, NY",
              startDate: "2020-01",
              endDate: "Present",
              description: "Led development of web applications..."
            }
          ],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "University of Technology",
              location: "New York, NY",
              startDate: "2015-09",
              endDate: "2019-05",
              gpa: "3.8"
            }
          ]
        };
        
        onDataExtracted(mockData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: "Failed to extract data from the resume file.",
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFileSize(null);
    setUploadDate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelected(null);
  };
  
  const handleUseDefaultResumeChange = (checked: boolean) => {
    setUseDefaultResume(checked);
    if (onUseDefaultResumeChange) {
      onUseDefaultResumeChange(checked);
    }
    
    // If using default resume, clear the selected file
    if (checked) {
      setFileName(null);
      setFileSize(null);
      setUploadDate(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onFileSelected(null);
    }
  };
  
  // Automatically use default resume and notify parent component on mount
  useEffect(() => {
    if (defaultResume && (defaultResume.fileUrl || defaultResume.blobPath) && onUseDefaultResumeChange) {
      // Only use the default resume when it has valid data
      setUseDefaultResume(true);
      onUseDefaultResumeChange(true);
      
      // Debug the defaultResume object
      console.log("Valid Default Resume Object:", defaultResume);
      console.log("Default Resume File URL:", defaultResume.fileUrl);
      console.log("Default Resume Blob Path:", defaultResume.blobPath);
    } else if (defaultResume) {
      console.log("Invalid Default Resume Object:", defaultResume);
      setUseDefaultResume(false);
      if (onUseDefaultResumeChange) {
        onUseDefaultResumeChange(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultResume]);

  // Debug log when component renders
  console.log("ResumeFileUploader rendering with defaultResume:", defaultResume);
  console.log("defaultResume.fileUrl:", defaultResume?.fileUrl);
  console.log("defaultResume type:", typeof defaultResume);
  
  // Enhanced check for defaultResume validity
  useEffect(() => {
    if (defaultResume) {
      console.log("Checking defaultResume validity:", {
        hasFileUrl: !!defaultResume.fileUrl,
        hasBlobPath: !!defaultResume.blobPath,
        hasFileName: !!defaultResume.fileName,
        isValid: !!(defaultResume.fileUrl || defaultResume.blobPath)
      });
      
      // If defaultResume exists but fileUrl is missing, try to construct it
      if (!defaultResume.fileUrl && defaultResume.blobPath) {
        console.log("Attempting to construct fileUrl from blobPath:", defaultResume.blobPath);
        
        // Construct the URL based on the blobPath format
        // This handles both direct paths and storage paths
        if (defaultResume.blobPath.startsWith('http')) {
          // If it's already a full URL, use it directly
          defaultResume.fileUrl = defaultResume.blobPath;
        } else if (defaultResume.blobPath.includes('storage/')) {
          // If it's a Supabase storage path
          // Use the imported SUPABASE_URL constant
          const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
          defaultResume.fileUrl = storageUrl;
        } else {
          // Default case - use the API endpoint
          defaultResume.fileUrl = `/api/files/${defaultResume.blobPath}`;
        }
        
        console.log("Constructed fileUrl:", defaultResume.fileUrl);
      }
    }
  }, [defaultResume]);
  
  return (
    <div className="w-full">
      <label htmlFor="resume-file-upload" className="sr-only">Upload resume file</label>
      <input
        id="resume-file-upload"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled || useDefaultResume}
        aria-label="Upload resume file"
      />
      
      {/* Default Resume Info - Only shown when we have valid resume data */}
      {showDefaultResumeOption && defaultResume && (defaultResume.fileUrl || defaultResume.blobPath) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="w-full">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Using your default resume
                  </p>
                  <p className="text-xs text-blue-600">
                    {defaultResume.fileName || 'Your resume'} (Last updated: {defaultResume.uploadDate ? new Date(defaultResume.uploadDate).toLocaleDateString() : new Date().toLocaleDateString()})
                  </p>
                </div>
                <div className="flex space-x-1">
                  {/* Always show the buttons, but make them functional only if we have a valid URL */}
                  <button 
                    type="button"
                    onClick={() => {
                      // Try to open the resume in a new tab
                      if (!defaultResume || (!defaultResume.fileUrl && !defaultResume.blobPath)) {
                        console.error("Invalid resume data:", defaultResume);
                        toast({
                          variant: "destructive",
                          title: "Unable to view resume",
                          description: "No valid resume data found. Please upload a resume first."
                        });
                        return;
                      }
                      
                      // Log what we're trying to open
                      console.log("Trying to open resume:", defaultResume);
                      
                      // Try different possible URL sources
                      let url = null;
                      
                      // First try the fileUrl if it exists
                      if (defaultResume.fileUrl) {
                        url = defaultResume.fileUrl;
                        console.log("Using existing fileUrl:", url);
                      } 
                      // Then try to construct from blobPath
                      else if (defaultResume.blobPath) {
                        console.log("Constructing URL from blobPath:", defaultResume.blobPath);
                        
                        if (defaultResume.blobPath.startsWith('http')) {
                          // If it's already a full URL
                          url = defaultResume.blobPath;
                          console.log("Using blobPath as URL (starts with http):", url);
                        } else if (defaultResume.blobPath.includes('storage/')) {
                          // If it's a Supabase storage path
                          // Use the imported SUPABASE_URL constant
                          url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
                          console.log("Constructed storage URL:", url);
                        } else {
                          // Default API endpoint
                          url = `/api/files/${defaultResume.blobPath}`;
                          console.log("Using API endpoint URL:", url);
                        }
                      }
                      
                      console.log("Final URL to open:", url);
                      
                      if (url) {
                        window.open(url, '_blank');
                      } else {
                        console.error("No valid URL found for resume");
                        toast({
                          variant: "destructive",
                          title: "Unable to view resume",
                          description: "Could not generate a valid URL for your resume."
                        });
                      }
                    }}
                    className={`text-blue-600 hover:text-blue-800 px-2 py-1 text-sm rounded ${
                      disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={disabled}
                    title="View resume"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      // Try to download the resume
                      if (!defaultResume || (!defaultResume.fileUrl && !defaultResume.blobPath)) {
                        console.error("Invalid resume data:", defaultResume);
                        toast({
                          variant: "destructive",
                          title: "Unable to download resume",
                          description: "No valid resume data found. Please upload a resume first."
                        });
                        return;
                      }
                      
                      // Log what we're trying to download
                      console.log("Trying to download resume:", defaultResume);
                      
                      // Try different possible URL sources
                      let url = null;
                      
                      // First try the fileUrl if it exists
                      if (defaultResume.fileUrl) {
                        url = defaultResume.fileUrl;
                        console.log("Using existing fileUrl:", url);
                      } 
                      // Then try to construct from blobPath
                      else if (defaultResume.blobPath) {
                        console.log("Constructing URL from blobPath:", defaultResume.blobPath);
                        
                        if (defaultResume.blobPath.startsWith('http')) {
                          // If it's already a full URL
                          url = defaultResume.blobPath;
                          console.log("Using blobPath as URL (starts with http):", url);
                        } else if (defaultResume.blobPath.includes('storage/')) {
                          // If it's a Supabase storage path
                          // Use the imported SUPABASE_URL constant
                          url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
                          console.log("Constructed storage URL:", url);
                        } else {
                          // Default API endpoint
                          url = `/api/files/${defaultResume.blobPath}`;
                          console.log("Using API endpoint URL:", url);
                        }
                      }
                      
                      console.log("Final URL to download:", url);
                      
                      if (url) {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = defaultResume.fileName || 
                          (defaultResume.blobPath ? defaultResume.blobPath.split('/').pop() || 'resume.pdf' : 'resume.pdf');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        console.error("No valid URL found for resume");
                        toast({
                          variant: "destructive",
                          title: "Unable to download resume",
                          description: "Could not generate a valid URL for your resume."
                        });
                      }
                    }}
                    className={`text-blue-600 hover:text-blue-800 px-2 py-1 text-sm rounded ${
                      disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={disabled}
                    title="Download resume"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => handleUseDefaultResumeChange(false)}
                  disabled={disabled}
                >
                  Upload a different file instead
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Default Resume Checkbox - Only shown when we have valid resume data and no file is selected */}
      {showDefaultResumeOption && defaultResume && (defaultResume.fileUrl || defaultResume.blobPath) && !useDefaultResume && !fileName && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-default-resume" 
              checked={useDefaultResume}
              onCheckedChange={handleUseDefaultResumeChange}
              disabled={disabled}
            />
            <Label 
              htmlFor="use-default-resume" 
              className="text-sm text-gray-700 cursor-pointer"
            >
              Use my default resume instead
            </Label>
          </div>
        </div>
      )}
      
      {/* File Upload UI - Only shown when not using default resume */}
      {(!useDefaultResume || !defaultResume) && (
        <>
          {!fileName ? (
            <div 
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={disabled ? undefined : triggerFileInput}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept.replace(/\./g, '').toUpperCase()} up to {maxSize}MB
              </p>
            </div>
          ) : (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{fileName}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{fileSize}</span>
                      <span className="mx-1">•</span>
                      <span>Uploaded {uploadDate?.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={disabled}
                  title="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResumeFileUploader;