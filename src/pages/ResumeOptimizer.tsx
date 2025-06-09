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
  Star,
  AlertTriangle,
  Gauge,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading optimizer...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Authentication required. Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()} className="hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Resume Optimizer</h1>
                  <p className="text-slate-600">AI-powered optimization for maximum ATS compatibility</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                <Shield className="w-3 h-3 mr-1" />
                ATS Optimized
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">Upload Your Resume</CardTitle>
                  <p className="text-slate-600 text-sm">Get comprehensive AI optimization analysis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resumeText" className="text-base font-medium text-slate-700 mb-3 block">
                    Resume Document *
                  </Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  {resumeFile && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-green-800 truncate">{resumeFile.name}</p>
                          <p className="text-sm text-green-600">Ready for AI optimization</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:transform-none" 
                  disabled={isLoading || !resumeFile}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analyzing & Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Optimize My Resume
                    </>
                  )}
                </Button>
              </form>

              {/* Feature Overview */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  What You'll Get:
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: <BarChart3 className="w-4 h-4" />, text: "ATS compatibility scoring" },
                    { icon: <FileCheck className="w-4 h-4" />, text: "Grammar & formatting fixes" },
                    { icon: <Target className="w-4 h-4" />, text: "Keyword optimization" },
                    { icon: <TrendingUp className="w-4 h-4" />, text: "Professional improvements" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-700">
                      <div className="text-blue-600">{item.icon}</div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">Optimization Report</CardTitle>
                  <p className="text-slate-600 text-sm">Detailed analysis and recommendations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {optimizeReport && !isLoading ? (
                <div className="space-y-6">
                  {/* Score Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "ATS Score", value: optimizeReport.atsScore, color: "from-blue-500 to-blue-600" },
                      { label: "Match Rate", value: optimizeReport.matchRate, color: "from-cyan-500 to-cyan-600" },
                      { label: "Formatting", value: optimizeReport.formattingScore, color: "from-green-500 to-green-600" },
                      { label: "Readability", value: optimizeReport.readabilityScore, color: "from-purple-500 to-purple-600" },
                      { label: "Impact Score", value: optimizeReport.actionabilityAssessment, color: "from-orange-500 to-orange-600" }
                    ].filter(item => item.value !== undefined).map((score, idx) => (
                      <div key={idx} className={`bg-gradient-to-r ${score.color} rounded-xl p-4 text-white shadow-lg`}>
                        <div className="text-xs font-medium opacity-90">{score.label}</div>
                        <div className="text-2xl font-bold">{score.value ?? '--'}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Keyword Analysis Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-semibold text-lg mb-4 text-green-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Keyword Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="font-medium text-green-700 text-sm">✅ Found Keywords</span>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {optimizeReport.keywordAnalysis?.foundKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-red-700 text-sm">❌ Missing Keywords</span>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {optimizeReport.keywordAnalysis?.missingKeywords?.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                              {kw}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spelling & Grammar Issues Section */}
                  {optimizeReport.spellingGrammarIssues && optimizeReport.spellingGrammarIssues.length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
                      <h3 className="font-semibold text-lg mb-3 text-red-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Grammar & Spelling Issues
                      </h3>
                      <ul className="space-y-2">
                        {optimizeReport.spellingGrammarIssues.map((issue: string, idx: number) => (
                          <li key={idx} className="text-red-700 text-sm flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ATS Optimization Tips Section */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="font-semibold text-lg mb-3 text-yellow-800 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      ATS Optimization Tips
                    </h3>
                    <ul className="space-y-2">
                      {optimizeReport.atsTips?.map((tip: string, idx: number) => (
                        <li key={idx} className="text-yellow-700 text-sm flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          {tip}
                        </li>
                      )) || []}
                    </ul>
                  </div>

                  {/* Improvement Recommendations Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-3 text-blue-800 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Improvement Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {optimizeReport.improvements?.map((rec: string, idx: number) => (
                        <li key={idx} className="text-blue-700 text-sm flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      )) || []}
                    </ul>
                  </div>

                  {/* Executive Summary Section */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-lg mb-3 text-slate-800">Executive Summary</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{optimizeReport.summary}</p>
                  </div>

                  {/* Optimized Resume Content Section */}
                  {optimizeReport.optimizedContent && (
                    <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm">
                      <h3 className="font-semibold text-lg mb-4 text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Optimized Resume Content
                      </h3>
                      <Textarea
                        value={optimizeReport.optimizedContent}
                        readOnly
                        className="min-h-[200px] bg-slate-50 text-slate-800 border-slate-200 text-sm"
                      />
                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(optimizeReport.optimizedContent);
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Content
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
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
                </div>
              ) : !isLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gauge className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Ready for Analysis</h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Upload your resume to receive comprehensive AI-powered optimization recommendations and ATS compatibility analysis.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Analyzing Your Resume</h3>
                  <p className="text-slate-600 mb-6">Our AI is performing comprehensive optimization analysis...</p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>Checking ATS compatibility</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse animation-delay-200"></div>
                      <span>Analyzing keyword optimization</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animation-delay-400"></div>
                      <span>Generating improvement suggestions</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Disclaimer */}
        <Card className="mt-8 border-slate-200 bg-slate-50/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">AI-Generated Analysis Notice</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This optimization analysis is generated using advanced AI algorithms trained on extensive resume and job market data. 
                  While our system provides valuable insights and suggestions, we recommend reviewing all recommendations to ensure they 
                  align with your specific career goals and target positions. AI-generated content should be used as a comprehensive 
                  starting point for resume improvement, not as a final, unreviewed solution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeOptimizer;
