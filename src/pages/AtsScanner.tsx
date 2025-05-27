import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";

interface ScanResults {
  atsScore?: number;
  atsTips?: string[];
}

const AtsScanner = () => {
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
    setResumeText("[PDF text will be extracted here]");
    // TODO: Integrate PDF text extraction or backend upload
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "Missing resume file",
        description: "Please upload your resume as a PDF file.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to use this feature.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Use API client for ATS scan
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const { data, error } = await api.resume.scanAts({
              file: resumeFile
            });

      if (error) {
        throw new Error(error);
      }

      if (data) {
        const normalizedResults: ScanResults = {
          atsScore: data.score || data.atsScore,          
          atsTips: data.atsTips || [],
          
        };

        setScanResults(normalizedResults);

        toast({
          title: "ATS scan complete",
          description: "Your resume has been scanned through our ATS simulator.",
        });

        console.log("ATS scan results:", normalizedResults);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No data returned from the server. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("ATS scan error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to scan resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto my-8 px-4">
      {upgradePrompt && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          {upgradePrompt}
          <Button className="ml-4" variant="outline" onClick={() => setUpgradePrompt(null)}>Dismiss</Button>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">ATS Resume Scanner</h1>
        <p className="text-gray-600 mt-2">
          Scan your resume through an Applicant Tracking System (ATS) simulator
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resumeText">Your Resume</Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Scanning..." : "Scan My Resume"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {scanResults && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">ATS Scan Results</h2>
                <div className="mb-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary">{scanResults.atsScore}%</div>
                    <p className="text-sm text-gray-500 mt-1">ATS Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Tips for Improvement</h2>
                {scanResults.atsTips && scanResults.atsTips.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {scanResults.atsTips.map((tip, index) => (
                      <li key={index} className="text-gray-700">{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No specific tips available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtsScanner;
