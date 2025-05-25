import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import PDFViewer from "@/components/PDFViewer";
import { Input } from "@/components/ui/input"; // If you have a custom Input component

const ResumeCustomizer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [customizedResume, setCustomizedResume] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [featureUsage, setFeatureUsage] = useState<{ usageCount: number; usageLimit: number }>({ usageCount: 0, usageLimit: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobscanReport, setJobscanReport] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();
  const [jdInputType, setJdInputType] = useState<"text" | "file">("text");
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
    setCustomizedResume("");
    setImprovements([]);
    setPdfUrl(null);
    setJobscanReport(null);
  };

  const handleJDFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJobDescriptionFile(e.target.files[0]);
      setJobDescription(""); // Clear text if file is chosen
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoadingUsage(true);
    api.usage.getFeatureUsage(user.id, "resume_customization").then(({ data, error }) => {
      if (error || !data) {
        setFeatureUsage({ usageCount: 0, usageLimit: 0 });
      } else {
        setFeatureUsage({ usageCount: data.usageCount, usageLimit: data.usageLimit });
      }
      setLoadingUsage(false);
    });
  }, [user]);

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

  if (jdInputType === "text" && !jobDescription) {
    toast({
      variant: "destructive",
      title: "Missing information",
      description: "Please provide a job description.",
    });
    return;
  }

  if (jdInputType === "file" && !jobDescriptionFile) {
    toast({
      variant: "destructive",
      title: "Missing information",
      description: "Please upload a job description file.",
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

    // Use API client for resume customization
    const { data, error } = await api.resume.customize({
      file: resumeFile!,
      jobDescription: jdInputType === "text" ? jobDescription : undefined,
      jobDescriptionFile: jdInputType === "file" ? jobDescriptionFile! : undefined,
    });

    if (error) {
      let errorMsg = "Failed to customize resume. Please try again.";

      try {
        // Parse first-level JSON error
        const parsedError = typeof error === "string" ? JSON.parse(error) : error;

        // Check if error contains nested details
        if (parsedError?.error) {
          try {
            const nestedError = JSON.parse(parsedError.error);
            errorMsg = nestedError?.detail || parsedError.error;
          } catch {
            errorMsg = parsedError.error;
          }
        } else if (parsedError?.detail) {
          errorMsg = parsedError.detail;
        } else if (typeof parsedError === "string") {
          errorMsg = parsedError;
        }
      } catch {
        errorMsg = error;
      }

      throw new Error(errorMsg);
    }

    let newCount = 0;
    try {
      newCount = await incrementUsageCount("resume_customization");
    } catch (error) {
      console.log("Error tracking usage, continuing anyway");
    }

    if (subscriptionStatus?.type === "free" && newCount > featureUsage.usageLimit) {
      toast({
        variant: "destructive",
        title: "Usage limit reached",
        description: "Please upgrade your subscription to continue using this feature.",
      });
      setIsLoading(false);
      return;
    }

    if (data) {
      setJobscanReport(data);
      setCustomizedResume("");
      setImprovements([]);
      setPdfUrl(null);
      toast({
        title: "Resume customization complete",
        description: "Your Jobscan-style report is ready.",
      });
    } else {
      throw new Error("No data returned from the server. Please try again.");
    }
  } catch (error: any) {
    // Improved error handling
    let errorMsg = error?.message || "Failed to customize resume. Please try again.";

    if (error?.response?.data?.detail) {
      errorMsg = error.response.data.detail;
    } else if (error?.detail) {
      errorMsg = error.detail;
    }

    toast({
      variant: "destructive",
      title: "Error",
      description: errorMsg,
    });
  } finally {
    setIsLoading(false);
  }
};

  // OpenAI-powered suggestions (section-by-section or overall)
  const fetchOpenAISuggestions = async () => {
    if (!jobscanReport) return;
    setSuggestionLoading(true);
    setShowSuggestions(true);
    try {
      // Call backend endpoint for advanced suggestions (assume /resume/advanced-suggestions exists)
      const response = await fetch(`/api/resume/advanced-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: jobscanReport.optimizedContent || '',
          jobDescription: jobDescription,
          sectionFeedback: jobscanReport.sectionFeedback || {},
        })
      });
      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (e: any) {
      setSuggestions([e.message || 'Failed to get suggestions.']);
    } finally {
      setSuggestionLoading(false);
    }
  };

  if (loadingUsage) {
    return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span> Loading...</div>;
  }
  if (!user || !subscriptionStatus) {
    return <div className="flex justify-center items-center h-64 text-red-500">You are not logged in. Please log in again.</div>;
  }

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Resume Customizer</h1>
        <p className="text-gray-600 mt-2">
          Tailor your resume to match specific job requirements
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resumeFile">Your Resume</Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="jdInputType">Job Description Input</Label>
                  <div className="flex gap-4 mt-2">
                    <label>
                      <input
                        type="radio"
                        name="jdInputType"
                        value="text"
                        checked={jdInputType === "text"}
                        onChange={() => setJdInputType("text")}
                        disabled={isLoading}
                      />{" "}
                      Paste Text
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="jdInputType"
                        value="file"
                        checked={jdInputType === "file"}
                        onChange={() => setJdInputType("file")}
                        disabled={isLoading}
                      />{" "}
                      Upload File
                    </label>
                  </div>
                </div>
                {jdInputType === "text" ? (
                  <div>
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px]"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="jobDescriptionFile">Job Description File</Label>
                    <Input
                      id="jobDescriptionFile"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleJDFileSelected}
                      disabled={isLoading}
                    />
                    {jobDescriptionFile && (
                      <div className="text-sm text-gray-600 mt-1">
                        Selected: {jobDescriptionFile.name}
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Customizing..." : "Customize My Resume"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {/* Jobscan-style report rendering */}
            {jobscanReport && !isLoading ? (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2 text-blue-900">Jobscan-Style Resume Report</h2>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-blue-100 rounded p-4 min-w-[180px] shadow">
                      <div className="text-lg font-semibold">Match Rate</div>
                      <div className="text-3xl font-bold text-blue-700">{jobscanReport.matchRate ?? '--'}%</div>
                    </div>
                    <div className="bg-purple-100 rounded p-4 min-w-[180px] shadow">
                      <div className="text-lg font-semibold">ATS Score</div>
                      <div className="text-3xl font-bold text-purple-700">{jobscanReport.atsScore ?? '--'}%</div>
                    </div>
                    <div className="bg-green-100 rounded p-4 min-w-[180px] shadow">
                      <div className="text-lg font-semibold">Skills Match</div>
                      <div className="text-green-700 font-bold">Matched: {jobscanReport.skillsMatch?.matchedSkills?.length ?? 0}</div>
                      <div className="text-red-700">Missing: {jobscanReport.skillsMatch?.missingSkills?.length ?? 0}</div>
                    </div>
                    <div className="bg-yellow-100 rounded p-4 min-w-[180px] shadow">
                      <div className="text-lg font-semibold">ATS Tips</div>
                      <ul className="list-disc ml-4 text-yellow-700">
                        {jobscanReport.atsTips?.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1 text-blue-800">Keyword Analysis</h3>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="font-semibold">Found:</span>
                      <ul className="list-disc ml-4 text-green-700">
                        {jobscanReport.keywordAnalysis?.foundKeywords?.map((kw: string, idx: number) => (
                          <li key={idx}>{kw}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold">Missing:</span>
                      <ul className="list-disc ml-4 text-red-700">
                        {jobscanReport.keywordAnalysis?.missingKeywords?.map((kw: string, idx: number) => (
                          <li key={idx}>{kw}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1 text-blue-800">Recommendations</h3>
                  <ul className="list-disc ml-4">
                    {jobscanReport.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1 text-blue-800">Summary</h3>
                  <div className="bg-gray-100 rounded p-3 text-gray-700">{jobscanReport.summary}</div>
                </div>
                {jobscanReport.sectionFeedback && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1 text-blue-800">Section Feedback</h3>
                    <ul className="list-disc ml-4">
                      {Object.entries(jobscanReport.sectionFeedback).map(([section, feedback]: [string, string]) => (
                        <li key={section}><span className="font-semibold">{section}:</span> {feedback}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {jobscanReport.resumeHighlights && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1 text-blue-800">Resume Highlights</h3>
                    <ul className="list-disc ml-4">
                      {jobscanReport.resumeHighlights.map((hl: any, idx: number) => (
                        <li key={idx}><span className="font-semibold">{hl.text}</span> <span className="text-gray-500">({hl.reason})</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mb-4 flex items-center gap-4">
                  <Button onClick={fetchOpenAISuggestions} disabled={suggestionLoading} type="button" className="bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold px-4 py-2 rounded shadow">
                    {suggestionLoading ? 'Loading Suggestions...' : 'Get Advanced Suggestions'}
                  </Button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="bg-white border rounded p-4 shadow w-full">
                      <h4 className="font-semibold text-blue-700 mb-2">AI-Powered Suggestions</h4>
                      <ul className="list-disc ml-4">
                        {suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : !isLoading && (
              <div className="text-gray-400 text-center">Your customized resume report will appear here after processing.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeCustomizer;
