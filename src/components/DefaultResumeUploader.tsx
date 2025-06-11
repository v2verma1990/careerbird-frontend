import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const DefaultResumeUploader: React.FC = () => {
  // Completely disabled component to prevent API calls and flickering
  console.log("DefaultResumeUploader - Component disabled");

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Default Resume
        </CardTitle>
        <CardDescription>
          This feature is temporarily disabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 text-center text-gray-500">
          The resume upload feature has been temporarily disabled for maintenance.
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultResumeUploader;