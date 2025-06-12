import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useResume } from "@/contexts/resume/ResumeContext";
import api from "@/utils/apiClient";
// No longer using ResumeFileUploader
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
  Star,
  Upload,
  AlertTriangle
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
  const [loadingResume, setLoadingResume] = useState(true);
  const [customizeReport, setCustomizeReport] = useState<any>(null);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();
  const { defaultResume } = useResume();
  const [useDefaultResume, setUseDefaultResume] = useState(false);

  const handleFileSelected = async (file: File | null) => {
    // If a file is selected, uncheck the "use default resume" option
    if (file) {
      setUseDefaultResume(false);
      setResumeText("[PDF text will be extracted here]");
    } else {
      setResumeText("");
    }
    setResumeFile(file);
  };
  
  // Now handling the checkbox state directly in the component

  const handleJobDescriptionFileSelected = async (file: File | null) => {
    if (file) {
      setJobDescriptionFile(file);
    }
  };

  // Initialize useDefaultResume when defaultResume changes
  useEffect(() => {
    // Add a small delay to ensure the loading state is visible
    // This prevents the UI from flashing between states
    const timer = setTimeout(() => {
      if (defaultResume) {
        console.log("Default resume found, setting useDefaultResume to true");
        setUseDefaultResume(true);
      } else {
        console.log("No default resume found");
      }
      setLoadingResume(false);
    }, 500); // 500ms delay
    
    return () => clearTimeout(timer);
  }, [defaultResume]);

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
    if (!resumeFile && !useDefaultResume) {
      toast({
        variant: "destructive",
        title: "Missing resume file",
        description: "Please upload your resume or use your default resume.",
      });
      return;
    }
    
    if (useDefaultResume && !defaultResume) {
      toast({
        variant: "destructive",
        title: "Default Resume Not Found",
        description: "Your default resume could not be found. Please upload a resume file.",
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
      
      // If using default resume, pass null as the file and true for useDefaultResume
      const { data, error } = await api.resume.customize(
        useDefaultResume ? null : resumeFile,
        jobDescription,
        jobDescriptionFile,
        subscriptionStatus?.type,
        useDefaultResume
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
                  
                  {loadingResume ? (
                    // Show loading state while checking for default resume
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Checking for default resume...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {defaultResume && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox 
                            id="use-default-resume" 
                            checked={useDefaultResume}
                            onCheckedChange={(checked) => setUseDefaultResume(!!checked)}
                            disabled={isLoading}
                          />
                          <Label 
                            htmlFor="use-default-resume" 
                            className="font-medium cursor-pointer"
                          >
                            Use my default resume
                          </Label>
                        </div>
                      )}
                      
                      {/* Show default resume info when checkbox is checked */}
                      {defaultResume && useDefaultResume && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-800">Using your default resume</p>
                              <p className="text-sm text-blue-600">{defaultResume.fileName}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show warning if no default resume, but only after loading is complete */}
                      {(!loadingResume && !defaultResume && !resumeFile) && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <p className="text-amber-800">You don't have a default resume yet. Please upload one.</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Always show file upload option unless using default resume */}
                      {(!defaultResume || !useDefaultResume) && (
                        <div>
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('resume-file-input')?.click()}
                          >
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                            <p className="text-gray-600 text-sm mb-1">
                              {defaultResume ? "Upload a different resume" : "Upload your resume"}
                            </p>
                            <p className="text-gray-500 text-xs">PDF, DOCX, DOC, TXT (Max 5MB)</p>
                            <input
                              id="resume-file-input"
                              type="file"
                              onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                              accept=".pdf,.docx,.doc,.txt"
                              className="hidden"
                              disabled={isLoading}
                              title="Upload your resume file"
                              placeholder="Upload your resume file"
                            />
                          </div>
                          
                          {resumeFile && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
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
                      )}
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
                    <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer mt-2"
                    onClick={() => document.getElementById('job-description-file-input')?.click()}
                    >
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                    <p className="text-gray-600 text-sm">Upload job description file</p>
                    <input
                      id="job-description-file-input"
                      type="file"
                      onChange={(e) => handleJobDescriptionFileSelected(e.target.files?.[0] as File)}
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      disabled={isLoading}
                      title="Upload job description file"
                      placeholder="Upload job description file"
                      aria-label="Upload job description file"
                    />
                    </div>
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
                        <div className="text-xl font-bold">{customizeReport.matchRate ?? '--'}%</div>
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

                  {/* Skills Match Section - always render */}
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h3 className="font-semibold text-lg mb-2 text-indigo-800 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Skills Match
                    </h3>
                    {customizeReport.skillsMatch ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-green-700">Matched Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Array.isArray(customizeReport.skillsMatch.matchedSkills) && customizeReport.skillsMatch.matchedSkills.length > 0 ? (
                              customizeReport.skillsMatch.matchedSkills.map((skill: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs border-green-300 text-green-700">{skill}</Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 ml-2">None</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-red-700">Missing Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Array.isArray(customizeReport.skillsMatch.missingSkills) && customizeReport.skillsMatch.missingSkills.length > 0 ? (
                              customizeReport.skillsMatch.missingSkills.map((skill: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs border-red-300 text-red-700">{skill}</Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 ml-2">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No skills match data available.</div>
                    )}
                  </div>

                  {/* Download Button always visible below Customized Resume Content */}
                  <div className="flex gap-2 mt-8 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { jsPDF } = await import('jspdf');
                        const doc = new jsPDF();
                        let y = 10;
                        if (customizeReport) {
                          doc.setFontSize(16);
                          doc.text('Resume Customization Report', 10, y);
                          y += 10;
                          doc.setFontSize(12);
                          doc.text(`ATS Score: ${customizeReport.atsScore ?? '--'}%`, 10, y);
                          y += 8;
                          doc.text(`Match Score: ${customizeReport.matchRate ?? '--'}%`, 10, y);
                          y += 10;
                          if (Array.isArray(customizeReport.improvements) && customizeReport.improvements.length > 0) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Key Improvements:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            customizeReport.improvements.forEach((imp) => {
                              doc.text(`• ${imp}`, 12, y);
                              y += 6;
                            });
                            y += 2;
                          }
                          if (customizeReport.summary) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Executive Summary:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            doc.text(doc.splitTextToSize(customizeReport.summary, 180), 12, y);
                            y += 12;
                          }
                          if (customizeReport.skillsMatch) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Matched Skills:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            doc.text((customizeReport.skillsMatch.matchedSkills || []).join(', ') || 'None', 12, y);
                            y += 7;
                            doc.setFont(undefined, 'bold');
                            doc.text('Missing Skills:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            doc.text((customizeReport.skillsMatch.missingSkills || []).join(', ') || 'None', 12, y);
                            y += 10;
                          }
                          if (Array.isArray(customizeReport.atsTips) && customizeReport.atsTips.length > 0) {
                            doc.setFont(undefined, 'bold');
                            doc.text('ATS Tips:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            customizeReport.atsTips.forEach((tip) => {
                              doc.text(`• ${tip}`, 12, y);
                              y += 6;
                            });
                            y += 2;
                          }
                          if (Array.isArray(customizeReport.recommendations) && customizeReport.recommendations.length > 0) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Recommendations:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            customizeReport.recommendations.forEach((rec) => {
                              doc.text(`• ${rec}`, 12, y);
                              y += 6;
                            });
                            y += 2;
                          }
                          if (Array.isArray(customizeReport.resumeHighlights) && customizeReport.resumeHighlights.length > 0) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Resume Highlights:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            customizeReport.resumeHighlights.forEach((h) => {
                              doc.text(`• ${h.text || h}`, 12, y);
                              y += 6;
                            });
                            y += 2;
                          }
                          if (customizeReport.sectionFeedback && Object.keys(customizeReport.sectionFeedback).length > 0) {
                            doc.setFont(undefined, 'bold');
                            doc.text('Section Feedback:', 10, y);
                            doc.setFont(undefined, 'normal');
                            y += 7;
                            Object.entries(customizeReport.sectionFeedback).forEach(([section, feedback]) => {
                              doc.text(`• ${section}: ${feedback}`, 12, y);
                              y += 6;
                            });
                          }
                        } else {
                          doc.text('No customization report available.', 10, y);
                        }
                        doc.save('resume_customization_report.pdf');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </Button>
                  </div>

                  {/* ATS Tips Section */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-semibold text-lg mb-2 text-yellow-800 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      ATS Tips
                    </h3>
                    {Array.isArray(customizeReport.atsTips) && customizeReport.atsTips.length > 0 ? (
                      <ul className="list-disc ml-4 space-y-1">
                        {customizeReport.atsTips.map((tip: string, idx: number) => (
                          <li key={idx} className="text-yellow-700 text-sm">{tip}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 text-sm">No ATS tips available.</div>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <h3 className="font-semibold text-lg mb-2 text-cyan-800 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Recommendations
                    </h3>
                    {Array.isArray(customizeReport.recommendations) && customizeReport.recommendations.length > 0 ? (
                      <ul className="list-disc ml-4 space-y-1">
                        {customizeReport.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-cyan-700 text-sm">{rec}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 text-sm">No recommendations available.</div>
                    )}
                  </div>

                  {/* Resume Highlights Section */}
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <h3 className="font-semibold text-lg mb-2 text-emerald-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Resume Highlights
                    </h3>
                    {Array.isArray(customizeReport.resumeHighlights) && customizeReport.resumeHighlights.length > 0 ? (
                      <ul className="list-disc ml-4 space-y-1">
                        {customizeReport.resumeHighlights.map((highlight: any, idx: number) => (
                          <li key={idx} className="text-emerald-700 text-sm">{highlight.text || highlight}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 text-sm">No highlights found.</div>
                    )}
                  </div>

                  {/* Section Feedback Section */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-semibold text-lg mb-2 text-purple-800">Section Feedback</h3>
                    {customizeReport.sectionFeedback && Object.keys(customizeReport.sectionFeedback).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(customizeReport.sectionFeedback).map(([section, feedback]: [string, string]) => (
                          <div key={section} className="text-sm">
                            <span className="font-medium text-purple-900">{section}:</span>
                            <span className="text-purple-700 ml-1">{feedback}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No section-specific feedback.</div>
                    )}
                  </div>
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
