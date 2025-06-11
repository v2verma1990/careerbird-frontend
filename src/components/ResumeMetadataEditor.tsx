import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/resume/ResumeContext";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, User, Phone, Sparkles, Save, RefreshCw } from "lucide-react";

interface ResumeMetadataEditorProps {
  onSave?: () => void;
}

const ResumeMetadataEditor: React.FC<ResumeMetadataEditorProps> = ({ onSave }) => {
  const { toast } = useToast();
  const { defaultResume, updateResumeMetadata, isLoading } = useResume();
  
  const [jobTitle, setJobTitle] = useState<string>('');
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [yearsOfExperience, setYearsOfExperience] = useState<string>('');
  const [professionalBio, setProfessionalBio] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Load existing metadata when the component mounts or defaultResume changes
  useEffect(() => {
    if (defaultResume?.metadata) {
      setJobTitle(defaultResume.metadata.jobTitle || '');
      setCurrentCompany(defaultResume.metadata.currentCompany || '');
      setYearsOfExperience(defaultResume.metadata.yearsOfExperience || '');
      setProfessionalBio(defaultResume.metadata.professionalBio || '');
      setLocation(defaultResume.metadata.location || '');
      setPhoneNumber(defaultResume.metadata.phoneNumber || '');
      setSkills(defaultResume.metadata.skills ? defaultResume.metadata.skills.join(', ') : '');
    }
  }, [defaultResume]);
  
  const handleSave = async () => {
    if (!defaultResume) {
      toast({
        variant: "destructive",
        title: "No Resume Found",
        description: "Please upload a default resume first."
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const skillsArray = skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      const success = await updateResumeMetadata({
        jobTitle,
        currentCompany,
        yearsOfExperience,
        professionalBio,
        location,
        phoneNumber,
        skills: skillsArray
      });
      
      if (success) {
        toast({
          title: "Resume Information Updated",
          description: "Your resume information has been saved successfully."
        });
        
        if (onSave) {
          onSave();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="shadow-md border border-gray-200 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Resume Information
        </CardTitle>
        <CardDescription>
          Add professional details to enhance your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultResume ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentCompany" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  Current Company
                </Label>
                <Input
                  id="currentCompany"
                  placeholder="e.g. Acme Inc."
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience" className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Years of Experience
                </Label>
                <Input
                  id="yearsOfExperience"
                  placeholder="e.g. 5 years"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="e.g. (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Skills (comma separated)
                </Label>
                <Input
                  id="skills"
                  placeholder="e.g. JavaScript, React, Node.js"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professionalBio" className="flex items-center gap-1">
                <User className="h-4 w-4 text-blue-600" />
                Professional Bio
              </Label>
              <Textarea
                id="professionalBio"
                placeholder="Brief description of your professional background and expertise..."
                value={professionalBio}
                onChange={(e) => setProfessionalBio(e.target.value)}
                disabled={isLoading || isSaving}
                className="min-h-[100px]"
              />
            </div>
            
            {defaultResume.metadata?.lastUpdated && (
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(defaultResume.metadata.lastUpdated).toLocaleString()}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800">
              Please upload a default resume first before adding additional information.
            </p>
          </div>
        )}
      </CardContent>
      
      {defaultResume && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isLoading || isSaving || !defaultResume}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Resume Information
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ResumeMetadataEditor;