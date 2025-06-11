import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ProfileCompletionStepsProps {
  profileStatus?: any;
  showActionButton?: boolean;
  className?: string;
}

const ProfileCompletionSteps: React.FC<ProfileCompletionStepsProps> = ({ 
  profileStatus, 
  showActionButton, 
  className 
}) => {
  // Completely disabled component to prevent API calls and flickering
  console.log("ProfileCompletionSteps - Component disabled");

  return (
    <Card className={className || "shadow-md border-0 bg-white"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Profile Completion
        </CardTitle>
        <CardDescription>
          This feature is temporarily disabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 text-center text-gray-500">
          The profile completion tracking feature has been temporarily disabled for maintenance.
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionSteps;