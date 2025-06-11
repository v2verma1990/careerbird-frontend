import React from "react";
import { ProfileStatus } from "@/contexts/resume/ResumeContext";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileStatusIndicatorProps {
  profileStatus: ProfileStatus | null;
}

const ProfileStatusIndicator: React.FC<ProfileStatusIndicatorProps> = ({ profileStatus }) => {
  const navigate = useNavigate();
  const completionPercentage = profileStatus?.completionPercentage || 0;
  
  // Determine the color based on completion percentage
  const getProgressColor = () => {
    if (completionPercentage === 100) return "bg-green-600";
    if (completionPercentage >= 70) return "bg-blue-600";
    if (completionPercentage >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get the status message
  const getStatusMessage = () => {
    if (!profileStatus?.hasResume) {
      return "First step: Upload your resume in the Account section";
    }
    if (!profileStatus?.hasBasicInfo) {
      return "Next: Add your job title and location";
    }
    if (!profileStatus?.hasDetailedInfo) {
      return "Almost there: Add your skills and professional bio";
    }
    if (completionPercentage === 100) {
      return "Your profile is complete! All features are ready to use.";
    }
    return "Continue completing your profile";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/account')}>
            <div className="relative w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              {!profileStatus?.hasResume ? (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600" />
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    completionPercentage === 100 
                      ? "bg-green-500" 
                      : completionPercentage > 0 
                        ? "bg-amber-500" 
                        : "bg-red-500"
                  }`}
                />
              </div>
            </div>
            <div className="w-20">
              <Progress 
                value={completionPercentage} 
                className={`h-1.5 ${getProgressColor()}`}
                aria-label="profile-completion"
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white p-4 shadow-lg border border-gray-200 max-w-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className={`h-2 ${getProgressColor()}`}
            />
            
            <div className="pt-1">
              <p className="text-xs font-medium text-gray-700 mb-1">Completion Steps:</p>
              <div className="space-y-1.5">
                <div className="flex items-center">
                  {profileStatus?.hasResume ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 mr-1.5 flex-shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-amber-500 mr-1.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${profileStatus?.hasResume ? 'text-green-700' : 'text-amber-700 font-medium'}`}>
                    Upload Resume
                  </span>
                </div>
                
                <div className="flex items-center">
                  {profileStatus?.hasBasicInfo ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 mr-1.5 flex-shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-300 mr-1.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${profileStatus?.hasBasicInfo ? 'text-green-700' : 'text-gray-600'}`}>
                    Add Job Title & Location
                  </span>
                </div>
                
                <div className="flex items-center">
                  {profileStatus?.hasDetailedInfo ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 mr-1.5 flex-shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-300 mr-1.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${profileStatus?.hasDetailedInfo ? 'text-green-700' : 'text-gray-600'}`}>
                    Add Skills & Bio
                  </span>
                </div>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant={profileStatus?.hasResume ? "outline" : "default"}
              className={`w-full text-xs mt-1 ${
                profileStatus?.hasResume 
                  ? "border-blue-200 text-blue-700 hover:bg-blue-50" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/account', { state: { returnTo: '/dashboard' } });
              }}
            >
              {profileStatus?.hasResume ? "Manage Profile" : "Upload Resume"}
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProfileStatusIndicator;