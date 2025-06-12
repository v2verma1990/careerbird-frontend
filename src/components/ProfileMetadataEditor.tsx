import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/resume/ResumeContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import { 
  User, 
  Save, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Briefcase,
  MapPin,
  Phone,
  Clock,
  FileText
} from "lucide-react";

const ProfileMetadataEditor: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { defaultResume, updateResumeMetadata, refreshDefaultResume, isLoading } = useResume();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: '',
    currentCompany: '',
    yearsOfExperience: '',
    professionalBio: '',
    location: '',
    phoneNumber: '',
    skills: [] as string[]
  });

  // Initialize form data from resume metadata
  useEffect(() => {
    if (defaultResume?.metadata) {
      setFormData({
        jobTitle: defaultResume.metadata.jobTitle || '',
        currentCompany: defaultResume.metadata.currentCompany || '',
        yearsOfExperience: defaultResume.metadata.yearsOfExperience || '',
        professionalBio: defaultResume.metadata.professionalBio || '',
        location: defaultResume.metadata.location || '',
        phoneNumber: defaultResume.metadata.phoneNumber || '',
        skills: defaultResume.metadata.skills || []
      });
    }
  }, [defaultResume]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsString = e.target.value;
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({
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
    setError(null);

    try {
      const success = await updateResumeMetadata(formData);
      
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved successfully.",
        });
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
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
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Loading your profile information...
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

  if (!defaultResume) {
    return (
      <Card className="shadow-md border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Upload your resume first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">Resume Required</p>
              <p className="text-amber-700 text-sm mt-1">
                Please upload your resume first before completing your profile information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Profile Information
            </CardTitle>
            <CardDescription>
              {isEditing ? "Edit your professional details" : "Manage your professional information"}
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-gray-500" />
              Job Title
            </Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              placeholder="e.g. Software Engineer"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentCompany" className="flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-gray-500" />
              Current Company
            </Label>
            <Input
              id="currentCompany"
              name="currentCompany"
              value={formData.currentCompany}
              onChange={handleInputChange}
              placeholder="e.g. Acme Corporation"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience" className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500" />
              Years of Experience
            </Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              placeholder="e.g. 5 years"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g. New York, NY"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-1">
              <Phone className="w-4 h-4 text-gray-500" />
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="e.g. (555) 123-4567"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skills" className="flex items-center gap-1">
              <FileText className="w-4 h-4 text-gray-500" />
              Skills (comma separated)
            </Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills.join(', ')}
              onChange={handleSkillsChange}
              placeholder="e.g. JavaScript, React, Node.js"
              disabled={!isEditing || isSaving}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="professionalBio" className="flex items-center gap-1">
            <User className="w-4 h-4 text-gray-500" />
            Professional Bio
          </Label>
          <Textarea
            id="professionalBio"
            name="professionalBio"
            value={formData.professionalBio}
            onChange={handleInputChange}
            placeholder="Brief description about your professional background and expertise"
            disabled={!isEditing || isSaving}
            className={!isEditing ? "bg-gray-50 min-h-[100px]" : "min-h-[100px]"}
            rows={4}
          />
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
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

        {!isEditing && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
      
      {!isEditing && defaultResume.metadata && Object.values(formData).some(val => 
        Array.isArray(val) ? val.length > 0 : val
      ) && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Your profile information is up to date</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProfileMetadataEditor;