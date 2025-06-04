
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import PDFViewer from "@/components/PDFViewer";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Copy, 
  CheckCircle, 
  Zap,
  Target,
  Award,
  TrendingUp,
  Users,
  BarChart3,
  FileCheck,
  Brain
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      setJobDescription("");
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

      const { data, error } = await api.resume.customize({
        file: resumeFile!,
        jobDescription: jdInputType === "text" ? jobDescription : undefined,
        jobDescriptionFile: jdInputType === "file" ? jobDescriptionFile! : undefined,
      });

      if (error) {
        let errorMsg = "Failed to customize resume. Please try again.";

        try {
          const parsedError = typeof error === "string" ? JSON.parse(error) : error;

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

  if (loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Resume Customizer</h1>
                  <p className="text-gray-600">Tailor your resume to match specific job requirements</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <BarChart3 className="w-3 h-3 mr-1" />
                Match Analytics
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-purple-600" />
                Upload & Configure
              </CardTitle>
              <p className="text-gray-600">Upload your resume and job requirements for AI customization</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resumeFile" className="text-base font-medium">
                    Your Resume *
                  </Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  {resumeFile && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{resumeFile.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="jdInputType" className="text-base font-medium">
                    Job Description Input Method
                  </Label>
                  <div className="flex gap-4 mt-3 p-1 bg-gray-100 rounded-lg">
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="jdInputType"
                        value="text"
                        checked={jdInputType === "text"}
                        onChange={() => setJdInputType("text")}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <div className={`p-3 text-center rounded-lg cursor-pointer transition-all ${
                        jdInputType === "text" 
                          ? "bg-white shadow-md text-purple-700 border-2 border-purple-200" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}>
                        <FileText className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Paste Text</span>
                      </div>
                    </label>
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="jdInputType"
                        value="file"
                        checked={jdInputType === "file"}
                        onChange={() => setJdInputType("file")}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <div className={`p-3 text-center rounded-lg cursor-pointer transition-all ${
                        jdInputType === "file" 
                          ? "bg-white shadow-md text-purple-700 border-2 border-purple-200" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}>
                        <Download className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Upload File</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                {jdInputType === "text" ? (
                  <div>
                    <Label htmlFor="jobDescription" className="text-base font-medium">
                      Job Description *
                    </Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px] mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="jobDescriptionFile" className="text-base font-medium">
                      Job Description File *
                    </Label>
                    <Input
                      id="jobDescriptionFile"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleJDFileSelected}
                      disabled={isLoading}
                      className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {jobDescriptionFile && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-800">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{jobDescriptionFile.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Customizing Your Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Customize My Resume
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Customization Tips:
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Upload high-quality PDF resume for best results</li>
                  <li>• Include complete job description with requirements</li>
                  <li>• Review match score and implement suggestions</li>
                  <li>• Use keywords from the job posting</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="w-6 h-6 text-green-600" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Jobscan-style report rendering */}
              {jobscanReport && !isLoading ? (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-4 text-blue-900">Resume Match Analysis</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm font-medium opacity-90">Match Rate</div>
                        <div className="text-2xl font-bold">{jobscanReport.matchRate ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm font-medium opacity-90">ATS Score</div>
                        <div className="text-2xl font-bold">{jobscanReport.atsScore ?? '--'}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-lg mb-2 text-green-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Skills Match Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-green-700">✅ Matched Skills:</span>
                        <ul className="list-disc ml-4 text-green-600 text-sm mt-1">
                          {jobscanReport.skillsMatch?.matchedSkills?.map((skill: string, idx: number) => (
                            <li key={idx}>{skill}</li>
                          )) || []}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">❌ Missing Skills:</span>
                        <ul className="list-disc ml-4 text-red-600 text-sm mt-1">
                          {jobscanReport.skillsMatch?.missingSkills?.map((skill: string, idx: number) => (
                            <li key={idx}>{skill}</li>
                          )) || []}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Keyword Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-green-700">Found Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {jobscanReport.keywordAnalysis?.foundKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-green-300 text-green-700">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Missing Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {jobscanReport.keywordAnalysis?.missingKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-red-300 text-red-700">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-semibold text-lg mb-2 text-yellow-800 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Recommendations
                    </h3>
                    <ul className="list-disc ml-4 space-y-1">
                      {jobscanReport.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx} className="text-yellow-700 text-sm">{rec}</li>
                      )) || []}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">Executive Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{jobscanReport.summary}</p>
                  </div>

                  {jobscanReport.sectionFeedback && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-lg mb-2 text-purple-800">Section Feedback</h3>
                      <div className="space-y-2">
                        {Object.entries(jobscanReport.sectionFeedback).map(([section, feedback]: [string, string]) => (
                          <div key={section} className="text-sm">
                            <span className="font-medium text-purple-900">{section}:</span>
                            <span className="text-purple-700 ml-1">{feedback}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : !isLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Upload your resume and job description to get detailed match analysis and customization recommendations.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Resume</h3>
                  <p className="text-gray-600">Our AI is customizing your resume for maximum impact...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span>Processing match analysis</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Customize Your Resume?</h3>
              <p className="text-purple-100 max-w-2xl mx-auto">
                Tailored resumes receive 2.5x more interviews and pass ATS systems 40% more often.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">2.5x</div>
                <p className="text-purple-100">More Interviews</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">40%</div>
                <p className="text-purple-100">Better ATS Success</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">75%</div>
                <p className="text-purple-100">Match Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeCustomizer;
