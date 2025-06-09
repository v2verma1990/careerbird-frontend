import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";
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
  Shield,
  BarChart3,
  FileCheck,
  Brain,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
    setResumeText("[PDF text will be extracted here]");
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
      const { data, error } = await api.resume.optimize(resumeFile);
      if (error) throw new Error(error);

      if (data) {
        setOptimizeReport(data);
        setOptimizedResume(data.optimizedContent || "");
        setImprovements(data.improvements || []);
        toast({
          title: "Resume optimization complete",
          description: "Your optimization report is ready.",
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Resume Optimizer</h1>
                  <p className="text-gray-600">Get AI-powered suggestions to improve your resume and boost your chances</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                <Star className="w-3 h-3 mr-1" />
                ATS Optimized
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-blue-600" />
                Upload Resume
              </CardTitle>
              <p className="text-gray-600">Upload your resume for comprehensive AI optimization analysis</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resumeText" className="text-base font-medium">
                    Your Resume *
                  </Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  {resumeFile && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{resumeFile.name}</p>
                          <p className="text-sm text-green-600">Ready for optimization</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Optimizing Your Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Optimize My Resume
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Optimization Features:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• ATS compatibility scoring and fixes</li>
                  <li>• Grammar and spelling corrections</li>
                  <li>• Keyword optimization suggestions</li>
                  <li>• Professional formatting improvements</li>
                  <li>• Section-by-section feedback</li>
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
                Optimization Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Optimization report rendering */}
              {optimizeReport && !isLoading ? (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-blue-900">ATS-Optimized Resume Report</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {typeof optimizeReport.matchRate === 'number' && (
                        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-white shadow-lg">
                          <div className="text-xs font-medium opacity-90">Match Rate</div>
                          <div className="text-xl font-bold">{optimizeReport.matchRate ?? '--'}%</div>
                        </div>
                      )}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">ATS Score</div>
                        <div className="text-xl font-bold">{optimizeReport.atsScore ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">Formatting</div>
                        <div className="text-xl font-bold">{optimizeReport.formattingScore ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">Readability</div>
                        <div className="text-xl font-bold">{optimizeReport.readabilityScore ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">Impact</div>
                        <div className="text-xl font-bold">{optimizeReport.actionabilityAssessment ?? '--'}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-lg mb-3 text-green-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Keyword Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-green-700">✅ Found Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {optimizeReport.keywordAnalysis?.foundKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-green-300 text-green-700">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">❌ Missing Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {optimizeReport.keywordAnalysis?.missingKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-red-300 text-red-700">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                    </div>
                  </div>

                  {optimizeReport.spellingGrammarIssues && optimizeReport.spellingGrammarIssues.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="font-semibold text-lg mb-2 text-red-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Spelling & Grammar Issues
                      </h3>
                      <ul className="list-disc ml-4 space-y-1">
                        {optimizeReport.spellingGrammarIssues.map((issue: string, idx: number) => (
                          <li key={idx} className="text-red-600 text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-semibold text-lg mb-2 text-yellow-800 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      ATS Tips
                    </h3>
                    <ul className="list-disc ml-4 space-y-1">
                      {optimizeReport.atsTips?.map((tip: string, idx: number) => (
                        <li key={idx} className="text-yellow-700 text-sm">{tip}</li>
                      )) || []}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Improvement Recommendations
                    </h3>
                    <ul className="list-disc ml-4 space-y-1">
                      {optimizeReport.improvements?.map((rec: string, idx: number) => (
                        <li key={idx} className="text-blue-700 text-sm">{rec}</li>
                      )) || []}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">Executive Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{optimizeReport.summary}</p>
                  </div>

                  {optimizeReport.sectionFeedback && Object.keys(optimizeReport.sectionFeedback).length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-lg mb-2 text-purple-800">Section Feedback</h3>
                      <div className="space-y-2">
                        {Object.entries(optimizeReport.sectionFeedback).map(([section, feedback]: [string, string]) => (
                          <div key={section} className="text-sm">
                            <span className="font-medium text-purple-900">{section}:</span>
                            <span className="text-purple-700 ml-1">{feedback}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {optimizeReport.optimizedContent && (
                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h3 className="font-semibold text-lg mb-2 text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Optimized Resume Content
                      </h3>
                      <Textarea
                        value={optimizeReport.optimizedContent}
                        readOnly
                        className="min-h-[200px] bg-gray-50 text-gray-800 border-gray-200"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(optimizeReport.optimizedContent);
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([optimizeReport.optimizedContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'optimized_resume.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Skills Match Section - always render, robust to any structure */}
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h3 className="font-semibold text-lg mb-2 text-indigo-800 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Skills Match
                    </h3>
                    {optimizeReport.skillsMatch && Object.keys(optimizeReport.skillsMatch).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(optimizeReport.skillsMatch).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <span className="font-medium text-blue-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Array.isArray(value) && value.length > 0 ? (
                                value.map((item: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs border-blue-300 text-blue-700">{item}</Badge>
                                ))
                              ) : (
                                <span className="text-gray-500 ml-2">None</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No skills match data available.</div>
                    )}
                  </div>
                </div>
              ) : !isLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Optimization</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Upload your resume to receive comprehensive AI-powered optimization suggestions and ATS compatibility analysis.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimizing Your Resume</h3>
                  <p className="text-gray-600">Our AI is analyzing and improving your resume...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Analyzing ATS compatibility</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Optimize Your Resume?</h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Optimized resumes pass ATS systems 3x more often and capture recruiter attention 60% faster.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">3x</div>
                <p className="text-blue-100">Better ATS Pass Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">60%</div>
                <p className="text-blue-100">Faster Recognition</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">85%</div>
                <p className="text-blue-100">Quality Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeOptimizer;