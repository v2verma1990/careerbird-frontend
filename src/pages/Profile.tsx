
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useResume } from '@/contexts/resume/ResumeContext';
import { useToast } from '@/hooks/use-toast';
import TopNavigation from '@/components/TopNavigation';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Edit3,
  Save,
  Camera,
  Crown,
  Shield,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Upload,
  Trash2,
  EyeOff
} from 'lucide-react';

// Add CSS for the highlight effect
const highlightStyle = `
  @keyframes highlight-pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  .highlight-section {
    animation: highlight-pulse 2s ease-out;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 0.375rem;
    transition: background-color 0.5s ease;
  }
`;

// Add the style to the document
const styleElement = document.createElement('style');
styleElement.textContent = highlightStyle;
document.head.appendChild(styleElement);
import { SUPABASE_URL, supabase } from '@/integrations/supabase/client';
import { formatFileSize, extractFileKey } from '@/lib/utils';

const Profile = () => {
  const { user, subscriptionStatus } = useAuth();
  const { defaultResume, updateResumeMetadata, refreshDefaultResume, uploadDefaultResume, clearDefaultResume, updateResumeVisibility, isLoading } = useResume();
  const { toast } = useToast();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  
  // Set initial tab based on location state or default to personal
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.openVisibilitySettings) {
      return "resume";
    }
    return "personal";
  });
  
  // Check if we should automatically scroll to visibility settings
  useEffect(() => {
    if (location.state && location.state.openVisibilitySettings) {
      // Focus on the resume tab
      setActiveTab("resume");
      
      // Scroll to visibility section after a short delay to ensure the tab has changed
      setTimeout(() => {
        const visibilitySection = document.getElementById('resume-visibility-section');
        if (visibilitySection) {
          visibilitySection.scrollIntoView({ behavior: 'smooth' });
          // Add a highlight effect
          visibilitySection.classList.add('highlight-section');
          setTimeout(() => {
            visibilitySection.classList.remove('highlight-section');
          }, 2000);
        }
      }, 300);
    }
  }, [location.state]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phoneNumber: '',
    location: '',
    jobTitle: '',
    professionalBio: '',
    currentCompany: '',
    yearsOfExperience: '',
    skills: [] as string[]
  });

  // Initialize form data from resume metadata
  useEffect(() => {
    if (defaultResume?.metadata) {
      setProfileData(prev => ({
        ...prev,
        phoneNumber: defaultResume.metadata.phoneNumber || prev.phoneNumber,
        location: defaultResume.metadata.location || prev.location,
        jobTitle: defaultResume.metadata.jobTitle || prev.jobTitle,
        professionalBio: defaultResume.metadata.professionalBio || prev.professionalBio,
        currentCompany: defaultResume.metadata.currentCompany || prev.currentCompany,
        yearsOfExperience: defaultResume.metadata.yearsOfExperience || prev.yearsOfExperience,
        skills: defaultResume.metadata.skills || prev.skills
      }));
    }
  }, [defaultResume]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsString = e.target.value;
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
    setProfileData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to update your profile.",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Extract only the resume metadata fields from profileData
      const metadataToUpdate = {
        phoneNumber: profileData.phoneNumber,
        location: profileData.location,
        jobTitle: profileData.jobTitle,
        professionalBio: profileData.professionalBio,
        currentCompany: profileData.currentCompany,
        yearsOfExperience: profileData.yearsOfExperience,
        skills: profileData.skills
      };
      
      const success = await updateResumeMetadata(metadataToUpdate);
      
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Failed to update your profile. Please try again.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDefaultResume();
      toast({
        title: "Profile refreshed",
        description: "Your profile information has been updated.",
      });
    } catch (err) {
      console.error("Refresh error:", err);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Failed to refresh your profile information.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(10);
    
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
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Failed to upload your resume. Please try again.",
        });
        setUploadProgress(0);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
      });
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
  
  const handleToggleVisibility = async () => {
    if (!defaultResume) return;
    
    setIsUpdatingVisibility(true);
    
    try {
      // Toggle the current visibility status
      const newVisibility = !(defaultResume.isVisibleToRecruiters || false);
      
      const success = await updateResumeVisibility(newVisibility);
      
      if (success) {
        toast({
          title: newVisibility ? "Resume is now visible to recruiters" : "Resume is now hidden from recruiters",
          description: newVisibility 
            ? "Recruiters can now find your resume when searching for candidates." 
            : "Your resume is now private and won't appear in recruiter searches.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Failed to update resume visibility. Please try again.",
        });
      }
    } catch (err) {
      console.error("Visibility toggle error:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUpdatingVisibility(false);
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
    console.log("Profile - Resume data for viewing:", defaultResume);
    
    let url = defaultResume.fileUrl;
    
    if (!url && defaultResume.blobPath) {
      if (defaultResume.blobPath.startsWith('http')) {
        url = defaultResume.blobPath;
      } else {
        // Use the supabase client to get a public URL
        try {
          // Extract the file key using our helper function
          const fileKey = extractFileKey(defaultResume.blobPath);
          console.log("Profile - Extracted file key:", fileKey);
          
          if (fileKey) {
            const { data } = supabase.storage.from('user-resumes').getPublicUrl(fileKey);
            url = data.publicUrl;
            console.log("Profile - Generated public URL:", url);
          } else {
            console.error("Profile - Could not extract file key from blob path:", defaultResume.blobPath);
            url = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${defaultResume.blobPath}`;
          }
        } catch (err) {
          console.error("Profile - Error generating public URL:", err);
          // Fallback to direct URL
          url = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${defaultResume.blobPath}`;
        }
      }
    } else if (defaultResume.blobPath) {
      url = `/api/files/${defaultResume.blobPath}`;
    }
    
    // If we still don't have a URL, try to construct one from the blob path
    if (!url && defaultResume.fileName) {
      // Try to construct a URL based on the user ID and file name
      // This is a fallback approach
      const userId = user?.id || '';
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
    console.log("Profile - Resume data for downloading:", defaultResume);
    
    let url = defaultResume.fileUrl;
    
    if (!url && defaultResume.blobPath) {
      if (defaultResume.blobPath.startsWith('http')) {
        url = defaultResume.blobPath;
      } else {
        // Use the supabase client to get a public URL
        try {
          // Extract the file key using our helper function
          const fileKey = extractFileKey(defaultResume.blobPath);
          console.log("Profile - Extracted file key for download:", fileKey);
          
          if (fileKey) {
            const { data } = supabase.storage.from('user-resumes').getPublicUrl(fileKey);
            url = data.publicUrl;
            console.log("Profile - Generated public URL for download:", url);
          } else {
            console.error("Profile - Could not extract file key from blob path for download:", defaultResume.blobPath);
            url = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${defaultResume.blobPath}`;
          }
        } catch (err) {
          console.error("Profile - Error generating public URL for download:", err);
          // Fallback to direct URL
          url = `${SUPABASE_URL}/storage/v1/object/public/user-resumes/${defaultResume.blobPath}`;
        }
      }
    } else if (defaultResume.blobPath) {
      url = `/api/files/${defaultResume.blobPath}`;
    }
    
    // If we still don't have a URL, try to construct one from the blob path
    if (!url && defaultResume.fileName) {
      // Try to construct a URL based on the user ID and file name
      // This is a fallback approach
      const userId = user?.id || '';
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <TopNavigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and professional details</p>
          </div>
          
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your profile information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <TopNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visibility Alert Banner - Only show for paid users with resume but visibility off */}
        {subscriptionStatus !== 'free' && defaultResume && !defaultResume.isVisibleToRecruiters && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Eye className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">Your resume is not visible to recruiters</h3>
                <div className="mt-1 text-sm text-amber-700">
                  <p>Make your resume visible to recruiters to increase your chances of being discovered for job opportunities.</p>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      const visibilitySection = document.getElementById('resume-visibility-section');
                      if (visibilitySection) {
                        setActiveTab("resume");
                        setTimeout(() => {
                          visibilitySection.scrollIntoView({ behavior: 'smooth' });
                          visibilitySection.classList.add('highlight-section');
                          setTimeout(() => {
                            visibilitySection.classList.remove('highlight-section');
                          }, 2000);
                        }, 300);
                      }
                    }}
                  >
                    Update Visibility Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and professional details</p>
        </div>

        {/* Profile Header */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-gray-100 p-0"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Profile picture upload will be available soon."
                    });
                  }}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{profileData.fullName || 'User'}</h2>
                <p className="text-blue-100 mb-2">{profileData.email}</p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 text-white border-0">
                    {subscriptionStatus?.type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {subscriptionStatus?.type?.charAt(0).toUpperCase() + subscriptionStatus?.type?.slice(1) || 'Free'} Plan
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="City, Country"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      value={profileData.jobTitle}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      name="currentCompany"
                      value={profileData.currentCompany}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      value={profileData.yearsOfExperience}
                      onChange={handleInputChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="e.g. 5 years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      name="skills"
                      value={profileData.skills.join(', ')}
                      onChange={handleSkillsChange}
                      disabled={!isEditing || isSaving}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      placeholder="e.g. JavaScript, React, Node.js"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Professional Bio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="professionalBio"
                  name="professionalBio"
                  value={profileData.professionalBio}
                  onChange={handleInputChange}
                  disabled={!isEditing || isSaving}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  placeholder="Brief description about yourself"
                  rows={4}
                />
              </CardContent>
            </Card>

            {isEditing && (
              <div className="mt-8 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="resume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Default Resume
                </CardTitle>
                <CardDescription>
                  {defaultResume ? "Manage your default resume" : "Upload your resume to use with all tools"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {defaultResume ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md border border-blue-200">
                          <FileText className="w-8 h-8 text-blue-600" />
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
                            <FileText className="w-5 h-5 text-blue-600" />
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
                
                <label htmlFor="resume-file-upload" className="sr-only">Upload resume file</label>
                <input
                  id="resume-file-upload"
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
                <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 w-full">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Your resume is ready to use with all CareerBird tools</span>
                  </div>
                  
                  {/* Visibility section with ID for scrolling */}
                  <div id="resume-visibility-section" className="w-full border-t border-gray-200 pt-3 p-3 rounded-md">
                    <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-blue-600" />
                      Recruiter Visibility Settings
                    </h4>
                    
                    {/* Only show visibility toggle for paid users */}
                    {subscriptionStatus !== 'free' && (
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center">
                            <div className={`h-3 w-3 rounded-full mr-2 ${defaultResume.isVisibleToRecruiters ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="font-medium">
                              {defaultResume.isVisibleToRecruiters ? "Your resume is visible to recruiters" : "Your resume is not visible to recruiters"}
                            </span>
                          </div>
                          <Button 
                            variant={defaultResume.isVisibleToRecruiters ? "default" : "outline"}
                            size="sm"
                            onClick={handleToggleVisibility}
                            disabled={isUpdatingVisibility}
                            className={defaultResume.isVisibleToRecruiters 
                              ? "bg-green-600 hover:bg-green-700 min-w-[160px]" 
                              : "border-blue-300 text-blue-700 hover:bg-blue-50 min-w-[160px]"}
                          >
                            {isUpdatingVisibility ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : defaultResume.isVisibleToRecruiters ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-2" />
                                Make Visible
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <div className={`p-3 rounded-md ${defaultResume.isVisibleToRecruiters ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'}`}>
                          {defaultResume.isVisibleToRecruiters ? (
                            <div className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-green-800 font-medium">Your resume is discoverable by recruiters</p>
                                <p className="text-xs text-green-700 mt-1">
                                  Recruiters can find your profile when searching for candidates with your skills and experience. 
                                  This increases your chances of being contacted for relevant job opportunities.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start">
                              <EyeOff className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-blue-800 font-medium">Your resume is currently private</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Make your resume visible to recruiters to be discovered for job opportunities. 
                                  When visible, recruiters can find your profile when searching for candidates with your skills.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Show upgrade prompt for free users */}
                    {subscriptionStatus === 'free' && (
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full mr-2 bg-amber-500"></div>
                            <span className="font-medium">Resume visibility requires Pro plan</span>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = '/Upgrade'}
                            className="border-amber-500 text-amber-600 hover:bg-amber-50 min-w-[160px]"
                          >
                            <Crown className="w-3 h-3 mr-2" />
                            Upgrade to Pro
                          </Button>
                        </div>
                        
                        <div className="p-3 rounded-md bg-amber-50 border border-amber-100">
                          <div className="flex items-start">
                            <Crown className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-amber-800 font-medium">Unlock recruiter visibility with Pro</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Upgrade to a Pro plan to make your resume visible to recruiters and get discovered for job opportunities.
                                Pro members receive 3x more job opportunities on average.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
