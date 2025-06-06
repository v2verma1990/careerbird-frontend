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
  Wand2, 
  ArrowLeft, 
  Download, 
  Copy, 
  CheckCircle, 
  Zap,
  Target,
  Award,
  TrendingUp,
  FileEdit,
  Brain,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ResumeCustomizer = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [customizedResume, setCustomizedResume] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [featureUsage, setFeatureUsage] = useState<{ usageCount: number; usageLimit: number }>({ usageCount: 0, usageLimit: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [customizeReport, setCustomizeReport] = useState<any>(null);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
    setResumeText("[PDF text will be extracted here]");
  };

  const handleJobDescriptionFileSelected = async (file: File) => {
    setJobDescriptionFile(file);
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
      const { data, error } = await api.resume.customize(
        resumeFile,
        jobDescription,
        jobDescriptionFile,
        subscriptionStatus?.type
      );
      if (error) throw new Error(error);

      if (data) {
        setCustomizeReport(data);
        setCustomizedResume(data.customizedContent || "");
        setImprovements(data.improvements || []);
        toast({
          title: "Resume customization complete",
          description: "Your customized resume is ready.",
        });
      } else {
        throw new Error("No data returned from the server. Please try again.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to customize resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                  <FileEdit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Resume Customizer</h1>
                  <p className="text-gray-600">Tailor your resume to specific job descriptions for a competitive edge</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                <Star className="w-3 h-3 mr-1" />
                ATS Ready
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
                Customize Your Resume
              </CardTitle>
              <p className="text-gray-600">Upload your resume and a job description to tailor your resume</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resumeFile" className="text-base font-medium">
                    Your Resume *
                  </Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  {resumeFile && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{resumeFile.name}</p>
                          <p className="text-sm text-green-600">Ready for customization</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="jobDescription" className="text-base font-medium">
                    Job Description
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[150px] mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="jobDescriptionFile" className="text-base font-medium">
                    Or Upload Job Description File
                  </Label>
                  <ResumeFileUploader onFileSelected={handleJobDescriptionFileSelected} disabled={isLoading} />
                  {jobDescriptionFile && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{jobDescriptionFile.name}</p>
                          <p className="text-sm text-green-600">Job description file uploaded</p>
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
                      Customizing Your Resume...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-3" />
                      Customize My Resume
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Customization Features:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Targeted keyword optimization</li>
                  <li>• Skills and experience alignment</li>
                  <li>• Tailored summary and objective</li>
                  <li>• Improved ATS compatibility</li>
                  <li>• Enhanced readability and impact</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Customization Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Customization report rendering */}
              {customizeReport && !isLoading ? (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-blue-900">Customized Resume Report</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">ATS Score</div>
                        <div className="text-xl font-bold">{customizeReport.atsScore ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">Match Score</div>
                        <div className="text-xl font-bold">{customizeReport.matchScore ?? '--'}%</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-xs font-medium opacity-90">Impact Score</div>
                        <div className="text-xl font-bold">{customizeReport.impactScore ?? '--'}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Key Improvements
                    </h3>
                    <ul className="list-disc ml-4 space-y-1">
                      {customizeReport.improvements?.map((rec: string, idx: number) => (
                        <li key={idx} className="text-blue-700 text-sm">{rec}</li>
                      )) || []}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">Executive Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{customizeReport.summary}</p>
                  </div>

                  {customizeReport.customizedContent && (
                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h3 className="font-semibold text-lg mb-2 text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Customized Resume Content
                      </h3>
                      <Textarea
                        value={customizeReport.customizedContent}
                        readOnly
                        className="min-h-[200px] bg-gray-50 text-gray-800 border-gray-200"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(customizeReport.customizedContent);
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
                            const blob = new Blob([customizeReport.customizedContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'customized_resume.txt';
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
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileEdit className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Customization</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Upload your resume and a job description to receive a tailored resume that matches the job requirements.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Customizing Your Resume</h3>
                  <p className="text-gray-600">Our AI is tailoring your resume to match the job description...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Analyzing job requirements</span>
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
              <Wand2 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Customize Your Resume?</h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Customized resumes increase your chances of getting an interview by 40% and demonstrate your fit for the role.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">40%</div>
                <p className="text-blue-100">Increased Interview Chance</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">75%</div>
                <p className="text-blue-100">Better Role Alignment</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">90%</div>
                <p className="text-blue-100">ATS Compatibility</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeCustomizer;
