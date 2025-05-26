import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";

const ResumeOptimizer = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [optimizedResume, setOptimizedResume] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [featureUsage, setFeatureUsage] = useState<{ usageCount: number; usageLimit: number }>({ usageCount: 0, usageLimit: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [optimizeReport, setOptimizeReport] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
    setResumeText("[PDF text will be extracted here]");
    // TODO: Integrate PDF text extraction or backend upload
  };

  useEffect(() => {
    if (!user) return;
    setLoadingUsage(true);
    api.usage.getFeatureUsage(user.id, "resume_optimization").then(({ data, error }) => {
      if (error || !data) {
        setFeatureUsage({ usageCount: 0, usageLimit: 0 });
      } else {
        setFeatureUsage({ usageCount: data.usageCount, usageLimit: data.usageLimit });
      }
      setLoadingUsage(false);
    });
  }, [user]);

  // OpenAI-powered suggestions (section-by-section or overall)
  const fetchOpenAISuggestions = async () => {
    if (!optimizeReport) return;
    setSuggestionLoading(true);
    setShowSuggestions(true);
    try {
      // Call backend endpoint for advanced suggestions (assume /resume/advanced-suggestions exists)
      const response = await fetch(`/api/resume/advanced-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: optimizeReport.optimizedContent || '',
          sectionFeedback: optimizeReport.sectionFeedback || {},
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
      // Send request and handle Jobscan-style JSON response
      const { data, error } = await api.resume.optimize({
        file: resumeFile
      });
      if (error) throw new Error(error);
      let newCount = 0;
      try {
        newCount = await incrementUsageCount("resume_optimization");
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
        setOptimizeReport(data);
        setOptimizedResume(data.optimizedContent || "");
        setImprovements(data.improvements || []);
        toast({
          title: "Resume optimization complete",
          description: "Your Jobscan-style optimization report is ready.",
        });
      } else {
        throw new Error("No data returned from the server. Please try again.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to optimize resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold">Resume Optimizer</h1>
        <p className="text-gray-600 mt-2">Get AI-powered suggestions to improve your resume and boost your chances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resumeText">Your Resume</Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  {/* <Textarea ... /> */}
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
                  {isLoading ? "Optimizing..." : "Optimize My Resume"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Jobscan-style optimization report rendering */}
              {optimizeReport && !isLoading ? (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2 text-blue-900">ATS-Optimized Resume Report</h2>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-blue-100 rounded p-4 min-w-[180px] shadow">
                        <div className="text-lg font-semibold">ATS Score</div>
                        <div className="text-3xl font-bold text-blue-700">{optimizeReport.atsScore ?? '--'}%</div>
                      </div>
                      <div className="bg-green-100 rounded p-4 min-w-[180px] shadow">
                        <div className="text-lg font-semibold">Formatting Score</div>
                        <div className="text-3xl font-bold text-green-700">{optimizeReport.formattingScore ?? '--'}%</div>
                      </div>
                      <div className="bg-purple-100 rounded p-4 min-w-[180px] shadow">
                        <div className="text-lg font-semibold">Readability Score</div>
                        <div className="text-3xl font-bold text-purple-700">{optimizeReport.readabilityScore ?? '--'}%</div>
                      </div>
                      <div className="bg-purple-100 rounded p-4 min-w-[180px] shadow">
                        <div className="text-lg font-semibold">Actionability Assessment</div>
                        <div className="text-3xl font-bold text-purple-700">{optimizeReport.actionabilityAssessment ?? '--'}%</div>
                      </div>
                      <div className="bg-yellow-100 rounded p-4 min-w-[180px] shadow">
                        <div className="text-lg font-semibold">ATS Tips</div>
                        <ul className="list-disc ml-4 text-yellow-700">
                          {optimizeReport.atsTips?.map((tip: string, idx: number) => (
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
                          {optimizeReport.keywordAnalysis?.foundKeywords?.map((kw: string, idx: number) => (
                            <li key={idx}>{kw}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold">Missing:</span>
                        <ul className="list-disc ml-4 text-red-700">
                          {optimizeReport.keywordAnalysis?.missingKeywords?.map((kw: string, idx: number) => (
                            <li key={idx}>{kw}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {optimizeReport.spellingGrammarIssues && optimizeReport.spellingGrammarIssues.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1 text-blue-800">Spelling & Grammar Issues</h3>
                      <ul className="list-disc ml-4 text-red-600">
                        {optimizeReport.spellingGrammarIssues.map((issue: string, idx: number) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1 text-blue-800">Improvements</h3>
                    <ul className="list-disc ml-4">
                      {optimizeReport.improvements?.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1 text-blue-800">Summary</h3>
                    <div className="bg-gray-100 rounded p-3 text-gray-700">{optimizeReport.summary}</div>
                  </div>

                  {optimizeReport.sectionFeedback && Object.keys(optimizeReport.sectionFeedback).length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1 text-blue-800">Section Feedback</h3>
                      <ul className="list-disc ml-4">
                        {Object.entries(optimizeReport.sectionFeedback).map(([section, feedback]: [string, string]) => (
                          <li key={section}><span className="font-semibold">{section}:</span> {feedback}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optimizeReport.resumeHighlights && optimizeReport.resumeHighlights.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1 text-blue-800">Resume Highlights</h3>
                      <ul className="list-disc ml-4">
                        {optimizeReport.resumeHighlights.map((hl: any, idx: number) => (
                          <li key={idx}><span className="font-semibold">{hl.text}</span> <span className="text-gray-500">({hl.reason})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optimizeReport.additionalInsights && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1 text-blue-800">Additional Insights</h3>
                      <div className="bg-gray-100 rounded p-3 text-gray-700">{optimizeReport.additionalInsights}</div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1 text-blue-800">Optimized Resume Content</h3>
                    <Textarea
                      value={optimizeReport.optimizedContent || ""}
                      readOnly
                      className="min-h-[200px] bg-gray-50 text-gray-800"
                    />
                  </div>
                </div>
              ) : !isLoading && (
                <div className="text-gray-400 text-center">Your optimized resume report will appear here after processing.</div>
              )}
            </CardContent>
          </Card>

          {improvements && improvements.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Improvements Made</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizer;
