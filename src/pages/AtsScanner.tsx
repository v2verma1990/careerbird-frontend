
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import { 
  Bot, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Target,
  Zap,
  Star,
  Award,
  ArrowLeft,
  Download,
  Eye
} from "lucide-react";

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
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return XCircle;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ATS Resume Scanner</h1>
                  <p className="text-gray-600">AI-powered applicant tracking system analysis</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {upgradePrompt && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl shadow-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <span className="text-yellow-800 font-medium">{upgradePrompt}</span>
              <Button className="ml-auto" variant="outline" onClick={() => setUpgradePrompt(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                Upload Your Resume
              </CardTitle>
              <p className="text-gray-600">
                Upload your resume to get detailed ATS compatibility analysis
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resumeFile" className="text-base font-medium">
                    Resume File (PDF)
                  </Label>
                  <div className="mt-2">
                    <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                  </div>
                  {resumeFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          {resumeFile.name} uploaded successfully
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading || !resumeFile}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5 mr-3" />
                      Scan My Resume
                    </>
                  )}
                </Button>
              </form>

              {/* Features Info */}
              <div className="mt-8 space-y-3">
                <h4 className="font-semibold text-gray-900">What you'll get:</h4>
                <div className="space-y-2">
                  {[
                    "ATS compatibility score",
                    "Keyword optimization suggestions",
                    "Formatting recommendations",
                    "Industry-specific insights"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {scanResults ? (
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Award className="w-6 h-6 text-yellow-600" />
                    ATS Compatibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                      <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${getScoreColor(scanResults.atsScore || 0)}`}>
                            {scanResults.atsScore}%
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {getScoreLabel(scanResults.atsScore || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Progress 
                      value={scanResults.atsScore || 0} 
                      className="h-3 bg-gray-200"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Your resume's compatibility with ATS systems
                    </p>
                  </div>

                  <div className="flex justify-center space-x-4 mt-6">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations Card */}
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Optimization Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResults.atsTips && scanResults.atsTips.length > 0 ? (
                    <div className="space-y-4">
                      {scanResults.atsTips.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed">{tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No specific recommendations available.</p>
                      <p className="text-gray-400 text-sm mt-1">Your resume looks good overall!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Placeholder when no results */
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Analyzing Your Resume</h3>
                      <p className="text-gray-600">Our AI is scanning your resume for ATS compatibility...</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Processing keywords</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Analyze</h3>
                      <p className="text-gray-600 max-w-md">
                        Upload your resume to get detailed ATS compatibility analysis and optimization recommendations.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Section */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why ATS Scanning Matters</h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Over 90% of large companies use Applicant Tracking Systems to filter resumes. 
                Make sure yours gets seen by optimizing for ATS compatibility.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AtsScanner;
