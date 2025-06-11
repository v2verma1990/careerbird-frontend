import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

const ProfileMetadataEditor: React.FC = () => {
  // Completely disabled component to prevent API calls and flickering
  console.log("ProfileMetadataEditor - Component disabled");

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Profile Information
        </CardTitle>
        <CardDescription>
          This feature is temporarily disabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 text-center text-gray-500">
          The profile editor feature has been temporarily disabled for maintenance.
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileMetadataEditor;