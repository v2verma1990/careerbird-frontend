import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";

const ResumeBenchmarking = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
    if (!jobDescription) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a job description.",
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
      // Use correct feature key for usage tracking
      const featureKey = "resume_benchmarking";
      const newCount = await incrementUsageCount(featureKey);
      const usageLimit = subscriptionStatus?.usageLimit || 3;
      // Block if at limit
      if ((subscriptionStatus?.type === "free" || subscriptionStatus?.type === "basic") && newCount > usageLimit) {
        setUpgradePrompt(
          subscriptionStatus.type === "free"
            ? "You have reached your free usage limit. Please upgrade to access more features."
            : "You have reached your monthly usage limit. Upgrade to premium for unlimited access."
        );
        setIsLoading(false);
        return;
      }
      setUpgradePrompt(null);

      // Make API request to benchmark resume
      const { data, error } = await api.resume.benchmark({
        resumeText, 
        jobDescription
      });
      
      if (error) {
        throw new Error(error);
      }

      if (data) {
        console.log("Benchmark data received:", data);
        setResult(data);
        
        toast({
          title: "Resume benchmarking complete",
          description: "Your resume has been benchmarked against industry standards.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No data returned from the server. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Resume benchmarking error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to benchmark resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const prepareDataForExport = () => {
    if (!result) return [];
    
    const exportData = [
      { Category: "Overall Score", Value: result.overallScore },
      { Category: "Relevance Score", Value: result.categoryScores?.relevance || 0 },
      { Category: "Completeness Score", Value: result.categoryScores?.completeness || 0 },
      { Category: "Format Score", Value: result.categoryScores?.format || 0 },
      { Category: "Quality Score", Value: result.categoryScores?.quality || 0 },
    ];
    
    return exportData;
  };
  
  const handleExportCSV = () => {
    if (!result) return;
    
    const dataToExport = prepareDataForExport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `resume-benchmark-${timestamp}`;
    
    api.fileUtils.exportToCSV(dataToExport, filename);
    
    toast({
      title: "Export successful",
      description: `Data has been exported to ${filename}.csv`,
    });
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
        <h1 className="text-3xl font-bold">Resume Benchmarking</h1>
        <p className="text-gray-600 mt-2">
          Compare your resume against industry standards and get actionable insights
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
                  {/* <Textarea
                    id="resumeText"
                    placeholder="Paste your resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[200px]"
                  /> */}
                </div>
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Benchmarking..." : "Benchmark My Resume"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold">Overall Score</h2>
                  <div className="text-5xl font-bold text-primary mt-2">
                    {result.overallScore}%
                  </div>
                </div>
                
                {result.categoryScores && (
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {Object.entries(result.categoryScores).map(([key, value]: [string, any]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-medium capitalize">{key}</div>
                        <div className="text-2xl font-semibold">{value}%</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 text-right">
                  <Button variant="outline" onClick={handleExportCSV}>
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {result.industryBenchmark && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Industry Comparison</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.industryBenchmark}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="you"
                          name="Your Score"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          name="Industry Average"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="top"
                          name="Top Performers"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.suggestedImprovements && result.suggestedImprovements.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Suggested Improvements</h2>
                  <ul className="space-y-2 list-disc pl-5">
                    {result.suggestedImprovements.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBenchmarking;
