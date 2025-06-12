import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/resume/ResumeContext";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  FileIcon,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";

const DefaultResumeUploader: React.FC = () => {
  const { toast } = useToast();
  const { defaultResume, uploadDefaultResume, refreshDefaultResume, clearDefaultResume, isLoading } = useResume();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset progress when file changes
  useEffect(() => {
    if (file) {
      setUploadProgress(0);
    }
  }, [file]);

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
        toast({
          title: "Resume uploaded successfully",
          description: "Your default resume has been updated.",
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  const handleView = () => {
    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "Unable to view resume",
        description: "No resume data found.",
      });
      return;
    }
    
    // Log the resume data for debugging
    console.log("Resume data for viewing:", defaultResume);
    
    let url = defaultResume.fileUrl;
    
    if (!url && defaultResume.blobPath) {
      if (defaultResume.blobPath.startsWith('http')) {
        url = defaultResume.blobPath;
      } else if (defaultResume.blobPath.includes('storage/')) {
        url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
      } else if (defaultResume.blobPath.includes('user-resumes/')) {
        // If it's a Supabase storage path but missing the storage prefix
        url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
      } else {
        url = `/api/files/${defaultResume.blobPath}`;
      }
    }
    
    // If we still don't have a URL, try to construct one from the blob path
    if (!url && defaultResume.fileName) {
      // Try to construct a URL based on the user ID and file name
      // This is a fallback approach
      const userId = defaultResume.metadata?.userId || '';
      if (userId) {
        const blobPath = `user-resumes/${userId}_default_resume.pdf`;
        url = `${SUPABASE_URL}/storage/v1/object/public/${blobPath}`;
        console.log("Constructed fallback URL from user ID:", url);
      }
    }
    
    if (url) {
      console.log("Opening resume URL:", url);
      window.open(url, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "Unable to view resume",
        description: "Could not generate a valid URL for your resume.",
      });
    }
  };

  const handleDownload = () => {
    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "Unable to download resume",
        description: "No resume data found.",
      });
      return;
    }
    
    // Log the resume data for debugging
    console.log("Resume data for downloading:", defaultResume);
    
    let url = defaultResume.fileUrl;
    
    if (!url && defaultResume.blobPath) {
      if (defaultResume.blobPath.startsWith('http')) {
        url = defaultResume.blobPath;
      } else if (defaultResume.blobPath.includes('storage/')) {
        url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
      } else if (defaultResume.blobPath.includes('user-resumes/')) {
        // If it's a Supabase storage path but missing the storage prefix
        url = `${SUPABASE_URL}/storage/v1/object/public/${defaultResume.blobPath}`;
      } else {
        url = `/api/files/${defaultResume.blobPath}`;
      }
    }
    
    // If we still don't have a URL, try to construct one from the blob path
    if (!url && defaultResume.fileName) {
      // Try to construct a URL based on the user ID and file name
      // This is a fallback approach
      const userId = defaultResume.metadata?.userId || '';
      if (userId) {
        const blobPath = `user-resumes/${userId}_default_resume.pdf`;
        url = `${SUPABASE_URL}/storage/v1/object/public/${blobPath}`;
        console.log("Constructed fallback URL from user ID:", url);
      }
    }
    
    if (url) {
      console.log("Downloading resume from URL:", url);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultResume.fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      toast({
        variant: "destructive",
        title: "Unable to download resume",
        description: "Could not generate a valid URL for your resume.",
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

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Default Resume
        </CardTitle>
        <CardDescription>
          {defaultResume ? "Manage your default resume" : "Upload your resume to use with all tools"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

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
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-1">Drag and drop your resume here or click to browse</p>
              <p className="text-gray-500 text-sm">Supported formats: PDF, DOCX, DOC, TXT (Max 5MB)</p>
            </div>
            
            {file && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900 truncate max-w-[200px]">{file.name}</span>
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
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          aria-label="Upload resume file"
          title="Upload resume file"
        />
      </CardContent>
      
      {defaultResume && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Your resume is ready to use with all CareerBird tools</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DefaultResumeUploader;