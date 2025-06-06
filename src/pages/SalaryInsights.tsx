
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import { 
  DollarSign, 
  TrendingUp, 
  ArrowLeft, 
  BarChart3, 
  Target,
  Award,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  FileText,
  Sparkles,
  Brain,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SalaryInsights = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [educationLevel, setEducationLevel] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [featureUsage, setFeatureUsage] = useState<{ usageCount: number; usageLimit: number }>({ usageCount: 0, usageLimit: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [salaryReport, setSalaryReport] = useState<any>(null);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleFileSelected = async (file: File) => {
    setResumeFile(file);
  };

  useEffect(() => {
    if (!user) return;
    setLoadingUsage(true);
    api.usage.getFeatureUsage(user.id, "salary_insights").then(({ data, error }) => {
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
    if (!jobTitle || !location || !industry || yearsExperience === "") {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields.",
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
    
    if (featureUsage.usageLimit > 0 && featureUsage.usageCount >= featureUsage.usageLimit) {
      toast({
        variant: "destructive",
        title: "Monthly limit reached",
        description: "You have reached your monthly usage limit. Upgrade for unlimited access.",
      });
      return;
    }
    try {
      setIsLoading(true);
      const payload: {
        jobTitle: string;
        location: string;
        industry: string;
        yearsExperience: string | number;
        educationLevel?: string;
        resume?: File;
      } = {
        jobTitle,
        location,
        industry,
        yearsExperience,
      };
      if (educationLevel) payload.educationLevel = educationLevel;
      if (resumeFile) payload.resume = resumeFile;

      const { data, error } = await api.resume.salaryInsights(payload);
      if (error) throw new Error(error);

      if (data) {
        setSalaryReport(data);
        toast({
          title: "Salary insights ready",
          description: "See below for your personalized salary and market trends report.",
        });
        setFeatureUsage((prev) => ({
          ...prev,
          usageCount: prev.usageCount + 1,
        }));
      } else {
        throw new Error("No data returned from the server. Please try again.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get salary insights. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Salary Insights & Market Trends</h1>
                  <p className="text-gray-600">Get personalized salary ranges, market trends, and career advice for your profile</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Market Data
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Usage Info */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200">
            <span className="text-sm text-gray-600">
              Usage this month: <span className="font-semibold text-green-600">{featureUsage.usageCount}</span> / {featureUsage.usageLimit > 0 ? featureUsage.usageLimit : "∞"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-green-600" />
                Your Profile Information
              </CardTitle>
              <p className="text-gray-600">Provide your details to get accurate salary insights and market analysis</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle" className="text-base font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-green-600" />
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      disabled={isLoading}
                      className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={isLoading}
                      className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry" className="text-base font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      Industry *
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g. Technology"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      disabled={isLoading}
                      className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="yearsExperience" className="text-base font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      Years of Experience *
                    </Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      min={0}
                      placeholder="e.g. 5"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      disabled={isLoading}
                      className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="educationLevel" className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    Education Level (Optional)
                  </Label>
                  <Input
                    id="educationLevel"
                    placeholder="e.g. Bachelor's, Master's, PhD"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    disabled={isLoading}
                    className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resumeFile" className="text-base font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Your Resume (Optional)
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
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading || loadingUsage}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Getting Insights...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Get Salary Insights
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Pro Tips:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Be specific with job title and location for accuracy</li>
                  <li>• Include your resume for personalized recommendations</li>
                  <li>• Consider market trends when negotiating salary</li>
                  <li>• Update insights regularly as market conditions change</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {salaryReport ? (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Your Salary Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Salary Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                      <div className="text-sm font-medium opacity-90">Your Range</div>
                      <div className="text-lg font-bold">{salaryReport.salaryRange ?? "--"}</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                      <div className="text-sm font-medium opacity-90">Industry Avg</div>
                      <div className="text-lg font-bold">{salaryReport.industryAverageSalary ?? "--"}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                      <div className="text-sm font-medium opacity-90">Top 10%</div>
                      <div className="text-lg font-bold">{salaryReport.top10PercentSalary ?? "--"}</div>
                    </div>
                  </div>

                  {/* Market Trends */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Market Trends
                    </h3>
                    <p className="text-blue-700 text-sm leading-relaxed">{salaryReport.marketTrends ?? "Market trend data not available."}</p>
                  </div>

                  {/* Career Advice */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-lg mb-2 text-green-800 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Career Advice
                    </h3>
                    <p className="text-green-700 text-sm leading-relaxed">{salaryReport.advice ?? "Personalized career advice not available."}</p>
                  </div>

                  {/* AI Summary */}
                  {salaryReport.ai_summary && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-lg mb-2 text-purple-800 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI Summary
                      </h3>
                      <p className="text-purple-700 text-sm leading-relaxed">{salaryReport.ai_summary}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Analyzing Market Data</h3>
                      <p className="text-gray-600">Our AI is gathering salary insights for your profile...</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span>Processing market trends</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Ready for Analysis</h3>
                      <p className="text-gray-600 max-w-md">
                        Fill in your profile details to receive personalized salary insights, market trends, and career advice.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Info */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Use Salary Insights?</h3>
              <p className="text-green-100 max-w-2xl mx-auto">
                Armed with accurate salary data, professionals negotiate 23% higher salaries and make better career decisions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">23%</div>
                <p className="text-green-100">Higher Negotiated Salary</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">67%</div>
                <p className="text-green-100">Better Career Decisions</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">92%</div>
                <p className="text-green-100">Market Awareness</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalaryInsights;
