import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";

interface ScanResults {
  score?: number;
  atsScore?: number; // Added to handle both formats
  parsedFields?: Record<string, any>;
  parsedSections?: Record<string, any>; // Added to handle both formats
  feedback?: string[];
  parsingIssues?: string[]; // Added to handle both formats
  missingKeywords?: string[];
  optimizationTips?: string[]; // Added to handle both formats
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
      // Removed pre-scan incrementUsageCount call to prevent double-counting
      // Only increment usage after a successful scan (implement if needed)

      // Make API request to scan resume with ATS
      const { data, error } = await api.resume.scanResumeWithATS({
        resumeText
      });
      
      if (error) {
        throw new Error(error);
      }

      if (data) {
        // Normalize the response to match our component's expectations
        const normalizedResults: ScanResults = {
          score: data.score || data.atsScore,
          parsedFields: data.parsedFields || data.parsedSections,
          feedback: data.feedback || data.optimizationTips,
          missingKeywords: data.missingKeywords || [],
          parsingIssues: data.parsingIssues || []
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
                    <div className="text-5xl font-bold text-primary">{scanResults.score}%</div>
                    <p className="text-sm text-gray-500 mt-1">ATS Compatibility Score</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Feedback</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {scanResults.feedback ? (
                      scanResults.feedback.map((item: string, index: number) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))
                    ) : scanResults.parsingIssues ? (
                      scanResults.parsingIssues.map((item: string, index: number) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))
                    ) : (
                      <li className="text-sm">No feedback available</li>
                    )}
                  </ul>
                </div>

                {scanResults.optimizationTips && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Optimization Tips</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {scanResults.optimizationTips.map((item: string, index: number) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Parsed Information</h3>
                {(scanResults.parsedFields || scanResults.parsedSections) && (
                  <div className="space-y-3">
                    {Object.entries(scanResults.parsedFields || scanResults.parsedSections || {}).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="font-medium capitalize">{key}</div>
                        {Array.isArray(value) ? (
                          <ul className="list-disc pl-5">
                            {value.map((item, i) => (
                              <li key={i} className="text-sm">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm">{value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {scanResults.missingKeywords && scanResults.missingKeywords.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Suggested Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {scanResults.missingKeywords.map((keyword: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtsScanner;
