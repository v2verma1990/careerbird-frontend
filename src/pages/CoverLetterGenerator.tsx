
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import { 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Copy, 
  Download, 
  CheckCircle,
  Target,
  Award,
  Building,
  Briefcase,
  Edit3,
  Brain,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CoverLetterGenerator = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle || !company || !jobDescription) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide the job title, company name, and job description.",
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
      const featureKey = "cover_letter";
      const newCount = await incrementUsageCount(featureKey);
      const usageLimit = subscriptionStatus?.usageLimit || 3;
      
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

      const { data, error } = await api.coverLetters.generate({ 
        jobTitle, 
        company, 
        jobDescription 
      });
      
      if (error) {
        throw new Error(error);
      }

      if (data) {
        setCoverLetter(data.coverLetter || "");
        
        toast({
          title: "Cover letter generated",
          description: "Your cover letter has been created successfully.",
        });
      } else if (!IS_BACKEND_RUNNING) {
        const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background in [relevant experience] and passion for [industry/field], I believe I would be an excellent addition to your team.

After reviewing the job description, I was particularly excited about [specific aspect of the role]. My experience in [relevant skill/experience that matches the job] has prepared me well for this opportunity. During my time at [previous company], I successfully [achievement that relates to the job requirements].

What attracts me most to ${company} is [something specific about the company like its mission, culture, recent achievements, or products]. I admire how your organization [specific positive aspect], and I'm eager to contribute to your continued success.

My additional strengths include:
- [Relevant skill/qualification]
- [Relevant skill/qualification]
- [Relevant skill/qualification]

I'm confident that my skills and enthusiasm make me a strong candidate for this position. I would welcome the opportunity to discuss how my background and abilities would be beneficial to ${company}.

Thank you for considering my application. I look forward to the possibility of working with your team.

Sincerely,
[Your Name]`;
        
        setCoverLetter(mockCoverLetter);
        
        toast({
          title: "Cover letter generated (demo)",
          description: "Your cover letter has been created successfully.",
        });
      }
    } catch (error: any) {
      console.error("Cover letter generation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate cover letter. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Cover letter has been copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please select and copy the text manually.",
      });
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${jobTitle.replace(/\s+/g, '_')}_${company.replace(/\s+/g, '_')}_cover_letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Download started",
      description: "Your cover letter is being downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Upgrade Prompt */}
      {upgradePrompt && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <p className="text-yellow-800">{upgradePrompt}</p>
            <Button variant="outline" size="sm" onClick={() => setUpgradePrompt(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

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
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
                  <p className="text-gray-600">Create a professional cover letter tailored to your job application</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-orange-200 text-orange-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="border-amber-200 text-amber-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-orange-600" />
                Job Application Details
              </CardTitle>
              <p className="text-gray-600">Provide job details to generate a personalized cover letter</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle" className="text-base font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-600" />
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company" className="text-base font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-600" />
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      placeholder="e.g. Acme Corporation"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="jobDescription" className="text-base font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    Job Description *
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the complete job description here including responsibilities, requirements, and company information..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px] mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Cover Letter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Writing Tips:
                </h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Include specific company details and role requirements</li>
                  <li>• Highlight relevant experience and achievements</li>
                  <li>• Research company culture and values</li>
                  <li>• Keep it concise and professional</li>
                  <li>• Always customize for each application</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Your Cover Letter
                </CardTitle>
                {coverLetter && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {coverLetter ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                      {coverLetter}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-800 font-medium">Professional Format</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-green-800 font-medium">Tailored Content</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-purple-800 font-medium">ATS Friendly</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">Crafting Your Cover Letter</h3>
                        <p className="text-gray-600">Our AI is creating a personalized cover letter for you...</p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                          <span>Analyzing job requirements</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center mx-auto">
                        <Edit3 className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">Ready to Generate</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          Fill in the job details to create a compelling, personalized cover letter that stands out to employers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Use a Tailored Cover Letter?</h3>
              <p className="text-orange-100 max-w-2xl mx-auto">
                Personalized cover letters increase your interview chances by 40% and help you stand out from other candidates.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">40%</div>
                <p className="text-orange-100">Higher Interview Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">65%</div>
                <p className="text-orange-100">Better First Impression</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">78%</div>
                <p className="text-orange-100">Professional Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
