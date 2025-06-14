import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/resume/ResumeContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import { SUPABASE_URL, supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  FileIcon,
  RefreshCw,
  Users,
  Info,
  Crown
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatFileSize, extractFileKey } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DefaultResumeUploader: React.FC = () => {
  const location = useLocation();
  
  // Determine which page we're on
  const isAccountPage = location.pathname.includes('/account');
  
  // Show full version only on account page, simplified version elsewhere
  // This ensures resume-customizer, resume-optimizer, etc. all get the simplified version
  const showFullVersion = isAccountPage;
  const { toast } = useToast();
  const { defaultResume, uploadDefaultResume, refreshDefaultResume, clearDefaultResume, updateResumeVisibility, isLoading } = useResume();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [useDefaultResume, setUseDefaultResume] = useState<boolean>(!!defaultResume);
  const [isVisibleToRecruiters, setIsVisibleToRecruiters] = useState<boolean>(defaultResume?.isVisibleToRecruiters || false);

  // Reset progress when file changes
  useEffect(() => {
    if (file) {
      setUploadProgress(0);
    }
  }, [file]);

  // Update visibility state when defaultResume changes
  useEffect(() => {
    if (defaultResume) {
      setIsVisibleToRecruiters(defaultResume.isVisibleToRecruiters || false);
    }
  }, [defaultResume]);

  // Simulate upload progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploading && uploadProgress < 90) {
      interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [uploading, uploadProgress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = ['.pdf', '.docx', '.doc', '.txt'].map(type => 
      type.replace('.', '').toLowerCase()
    );
    
    if (fileExtension && !acceptedTypes.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload PDF, DOCX, DOC, or TXT files only.",
      });
      return;
    }

    // Check file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
      });
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    try {
      const success = await uploadDefaultResume(file);
      if (success) {
        setUploadProgress(100);
        
        // After successful upload, set visibility based on subscription status
        // For paid users, automatically make resume visible and inform them
        if (user && user.subscription && user.subscription.type !== 'free') {
          await updateResumeVisibility(true);
          toast({
            title: "Resume uploaded successfully",
            description: "Your resume is now visible to recruiters and ready to use with all tools.",
          });
        } else {
          toast({
            title: "Resume uploaded successfully",
            description: "Your resume is ready to use with all CareerBird tools.",
          });
        }
        
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Explicitly refresh context/UI after upload
        await refreshDefaultResume();
      } else {
        setError("Failed to upload resume. Please try again.");
        setUploadProgress(0);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!defaultResume) return;
    
    try {
      await clearDefaultResume();
      toast({
        title: "Resume deleted",
        description: "Your default resume has been removed.",
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete your resume. Please try again.",
      });
    }
  };

  const handleView = async () => {
    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "Unable to view resume",
        description: "No resume data found.",
      });
      return;
    }
    if (defaultResume.blobPath) {
      try {
        // Log the original blobPath for debugging
        console.log("[Supabase] Original blobPath:", defaultResume.blobPath);
        // Extract the file key using the utility function
        const fileKey = extractFileKey(defaultResume.blobPath);
        console.log("[Supabase] Extracted file key:", fileKey);
        if (fileKey) {
          // Get file extension to determine content type
          const fileExtension = fileKey.split('.').pop()?.toLowerCase();
          let contentType = 'application/octet-stream';
          if (fileExtension === 'pdf') {
            contentType = 'application/pdf';
          } else if (fileExtension === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (fileExtension === 'doc') {
            contentType = 'application/msword';
          } else if (fileExtension === 'txt') {
            contentType = 'text/plain';
          }
          console.log("[Supabase] Using content type:", contentType);
          // Only use signed URL for private bucket
          const { data, error } = await supabase.storage
            .from('user-resumes')
            .createSignedUrl(fileKey, 60);
          if (error) {
            console.error("Error creating signed URL for view:", error);
            throw error;
          }
          const url = data.signedUrl;
          console.log("Generated signed URL for view:", url);
          window.open(url, '_blank');
        } else {
          throw new Error("Could not extract a valid file key from the blob path");
        }
      } catch (err) {
        console.error("Error generating URL for view:", err);
        toast({
          variant: "destructive",
          title: "Unable to view resume",
          description: "Could not generate a valid URL for your resume.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Unable to view resume",
        description: "No file path found for your resume.",
      });
    }
  };

  const handleDownload = async () => {
    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "Unable to download resume",
        description: "No resume data found.",
      });
      return;
    }
    
    if (defaultResume.blobPath) {
      try {
        // Log the original blobPath for debugging
        console.log("[Supabase] Original blobPath:", defaultResume.blobPath);
        
        // Extract the file key using the utility function
        const fileKey = extractFileKey(defaultResume.blobPath);
        console.log("[Supabase] Extracted file key:", fileKey);
        
        if (fileKey) {
          // Get file extension to determine content type
          const fileExtension = fileKey.split('.').pop()?.toLowerCase();
          let contentType = 'application/octet-stream'; // Default content type
          
          // Set appropriate content type based on file extension
          if (fileExtension === 'pdf') {
            contentType = 'application/pdf';
          } else if (fileExtension === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (fileExtension === 'doc') {
            contentType = 'application/msword';
          } else if (fileExtension === 'txt') {
            contentType = 'text/plain';
          }
          
          console.log("[Supabase] Using content type:", contentType);
          
          // Use createSignedUrl with the extracted file key and appropriate options
          const { data, error } = await supabase.storage
            .from('user-resumes')
            .createSignedUrl(fileKey, 60, {
              download: defaultResume.fileName || `resume.${fileExtension || 'pdf'}`
            });
            
          if (error) {
            console.error("Error creating signed URL for download:", error);
            throw error;
          }
          
          const url = data.signedUrl;
          console.log("Generated signed URL for download:", url);
          
          // Create a hidden anchor element to trigger the download
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = defaultResume.fileName || `resume.${fileExtension || 'pdf'}`;
          
          // Add content type information to help the browser
          if (contentType) {
            a.type = contentType;
          }
          
          // Append to body, click, and remove
          document.body.appendChild(a);
          a.click();
          
          // Small delay before removing to ensure download starts
          setTimeout(() => {
            document.body.removeChild(a);
          }, 100);
        } else {
          throw new Error("Could not extract a valid file key from the blob path");
        }
      } catch (err) {
        console.error("Error generating URL for download:", err);
        toast({
          variant: "destructive",
          title: "Unable to download resume",
          description: "Could not generate a valid URL for your resume.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Unable to download resume",
        description: "No file path found for your resume.",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshDefaultResume();
      toast({
        title: "Resume refreshed",
        description: "Your resume information has been updated.",
      });
    } catch (err) {
      console.error("Refresh error:", err);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Failed to refresh your resume information.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Default Resume
          </CardTitle>
          <CardDescription>
            Loading your resume information...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle checkbox change for using default resume
  const handleCheckboxChange = (checked: boolean) => {
    setUseDefaultResume(checked);
  };
  
  // Handle visibility checkbox change
  const handleVisibilityChange = async (checked: boolean) => {
    if (!defaultResume) return;
    
    setIsVisibleToRecruiters(checked);
    
    try {
      const success = await updateResumeVisibility(checked);
      
      if (success) {
        toast({
          title: checked ? "Resume is now visible to recruiters" : "Resume is now hidden from recruiters",
          description: checked 
            ? "Recruiters can now find you based on your resume when searching for candidates." 
            : "Your resume is no longer visible to recruiters.",
        });
      } else {
        // Revert the UI state if the API call failed
        setIsVisibleToRecruiters(!checked);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Failed to update resume visibility. Please try again.",
        });
      }
    } catch (err) {
      console.error("Visibility update error:", err);
      // Revert the UI state if there was an error
      setIsVisibleToRecruiters(!checked);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Default Resume
        </CardTitle>
        <CardDescription>
          {showFullVersion 
            ? (defaultResume ? "Manage your default resume" : "Upload your resume to use with all tools")
            : "Choose whether to use your default resume"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Simplified version with checkbox */}
        {!showFullVersion && (
          <div className="space-y-4">
            {defaultResume ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-default-resume" 
                    checked={useDefaultResume}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label 
                    htmlFor="use-default-resume" 
                    className="font-medium cursor-pointer"
                  >
                    Use my default resume
                  </Label>
                </div>
                {useDefaultResume && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-white rounded-md border border-blue-200">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-blue-900 truncate text-sm">{defaultResume.fileName}</h3>
                        <p className="text-xs text-blue-700">
                          Uploaded: {defaultResume.uploadDate ? new Date(defaultResume.uploadDate).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!useDefaultResume && (
                  <div>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                      <p className="text-gray-600 text-sm mb-1">Upload a different resume</p>
                      <p className="text-gray-500 text-xs">PDF, DOCX, DOC, TXT (Max 5MB)</p>
                    </div>
                    {file && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900 truncate max-w-[200px] text-sm">{file.name}</span>
                            <span className="text-xs text-blue-700">({formatFileSize(file.size)})</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-gray-500"
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {uploading && (
                          <div className="mt-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-blue-700 mt-1">Uploading: {uploadProgress}%</p>
                          </div>
                        )}
                        {!uploading && (
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={handleUpload}
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              Upload Resume
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  You don't have a default resume yet. Please upload one.
                </p>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                  <p className="text-gray-600 text-sm mb-1">Upload your resume</p>
                  <p className="text-gray-500 text-xs">PDF, DOCX, DOC, TXT (Max 5MB)</p>
                </div>
                {file && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900 truncate max-w-[200px] text-sm">{file.name}</span>
                        <span className="text-xs text-blue-700">({formatFileSize(file.size)})</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-gray-500"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {uploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-blue-700 mt-1">Uploading: {uploadProgress}%</p>
                      </div>
                    )}
                    {!uploading && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleUpload}
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                  title="Upload resume file"
                  aria-label="Upload resume file"
                />
              </div>
            )}
          </div>
        )}
        {showFullVersion && (
          <>
            {defaultResume ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-md border border-blue-200">
                      <FileIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-blue-900 truncate">{defaultResume.fileName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-700 mt-1">
                        <span className="flex items-center gap-1">
                          <span>Size: {defaultResume.fileSize ? formatFileSize(defaultResume.fileSize) : 'Unknown'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>Uploaded: {defaultResume.uploadDate ? new Date(defaultResume.uploadDate).toLocaleDateString() : 'Unknown'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg" id="resume-visibility-section">
                  <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-700" />
                    Resume Visibility Settings
                  </h3>
                  
                  {user && user.subscription && user.subscription.type !== 'free' ? (
                    <div className="space-y-4">
                      <div className={`p-3 rounded-md ${isVisibleToRecruiters ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                        <div className="flex items-start">
                          {isVisibleToRecruiters ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                          ) : (
                            <Eye className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm font-medium ${isVisibleToRecruiters ? 'text-green-800' : 'text-amber-800'}`}>
                              {isVisibleToRecruiters 
                                ? "Your resume is discoverable by recruiters" 
                                : "Your resume is currently private"}
                            </p>
                            <p className={`text-xs mt-1 ${isVisibleToRecruiters ? 'text-green-700' : 'text-amber-700'}`}>
                              {isVisibleToRecruiters 
                                ? "Recruiters can find your profile when searching for candidates with your skills and experience. This increases your chances of being contacted for relevant job opportunities." 
                                : "Your resume is not visible to recruiters. Enable visibility to be discovered for job opportunities."}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="resume-visibility" 
                            checked={isVisibleToRecruiters}
                            onCheckedChange={handleVisibilityChange}
                          />
                          <Label 
                            htmlFor="resume-visibility" 
                            className="font-medium cursor-pointer text-blue-900"
                          >
                            Make my resume visible to recruiters
                          </Label>
                        </div>
                        
                        <Button
                          variant={isVisibleToRecruiters ? "default" : "outline"}
                          size="sm"
                          className={isVisibleToRecruiters ? "bg-green-600 hover:bg-green-700" : "border-blue-300 text-blue-700"}
                          onClick={() => handleVisibilityChange(!isVisibleToRecruiters)}
                        >
                          {isVisibleToRecruiters ? "Visible to Recruiters" : "Make Visible"}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                        <p className="flex items-center">
                          <Info className="h-3 w-3 mr-1 text-gray-500" />
                          When enabled, recruiters can find you when searching for candidates. Your resume will be processed by AI to match you with relevant job opportunities.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                        <div className="flex items-start">
                          <Crown className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Unlock recruiter visibility with Pro</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Upgrade to a Pro plan to make your resume visible to recruiters and get discovered for job opportunities.
                              Pro members receive 3x more job opportunities on average.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 w-full"
                        onClick={() => window.location.href = '/upgrade'}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    onClick={handleView}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Replace
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
                {/* Always show upload button if a file is selected, even after Replace */}
                {file && (
                  <div className="mt-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900 truncate max-w-[200px] text-sm">{file.name}</span>
                        <span className="text-xs text-blue-700">({formatFileSize(file.size)})</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {uploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-blue-700 mt-1">Uploading: {uploadProgress}%</p>
                      </div>
                    )}
                    {!uploading && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleUpload}
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                  title="Upload resume file"
                  aria-label="Upload resume file"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  You don't have a default resume yet. Please upload one.
                </p>
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-1">Drag and drop your resume here or click to browse</p>
                    <p className="text-gray-500 text-sm">Supported formats: PDF, DOCX, DOC, TXT (Max 5MB)</p>
                  </div>
                  
                  {/* Visibility notice */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Resume Visibility</h3>
                        {user && user.subscription && user.subscription.type !== 'free' ? (
                          <p className="mt-1 text-xs text-blue-700">
                            Your resume will be automatically made visible to recruiters after upload, 
                            helping you get discovered for job opportunities. You can change this setting anytime.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-blue-700">
                            Upgrade to a Pro plan to make your resume visible to recruiters and get discovered for job opportunities.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {file && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900 truncate max-w-[200px] text-sm">{file.name}</span>
                        <span className="text-xs text-blue-700">({formatFileSize(file.size)})</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Visibility notice based on subscription */}
                    {user && user.subscription && user.subscription.type !== 'free' && (
                      <div className="mt-2 mb-2 flex items-center text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>Your resume will be automatically made visible to recruiters after upload</span>
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-blue-700 mt-1">Uploading: {uploadProgress}%</p>
                      </div>
                    )}
                    {!uploading && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleUpload}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                  title="Upload resume file"
                  aria-label="Upload resume file"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
      {defaultResume && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Your resume is ready to use with all CareerBird tools</span>
            </div>
            
            {/* Visibility status indicator */}
            {user && user.subscription && user.subscription.type !== 'free' ? (
              <div className="flex items-center gap-2 text-sm mt-1">
                <div className={`h-2 w-2 rounded-full ${defaultResume.isVisibleToRecruiters ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className={defaultResume.isVisibleToRecruiters ? 'text-green-700' : 'text-amber-700'}>
                  {defaultResume.isVisibleToRecruiters 
                    ? "Your resume is visible to recruiters" 
                    : "Your resume is not visible to recruiters"}
                </span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    // Toggle visibility directly from here
                    if (defaultResume.isVisibleToRecruiters) {
                      // If already visible, show confirmation before hiding
                      if (confirm("Are you sure you want to hide your resume from recruiters? This may reduce your chances of being discovered for job opportunities.")) {
                        updateResumeVisibility(false);
                      }
                    } else {
                      // If not visible, make it visible
                      updateResumeVisibility(true);
                    }
                  }}
                >
                  {defaultResume.isVisibleToRecruiters ? "Hide" : "Make visible"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm mt-1 text-amber-700">
                <Crown className="w-3 h-3" />
                <span>Upgrade to Pro to make your resume visible to recruiters</span>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DefaultResumeUploader;
