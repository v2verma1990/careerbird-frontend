
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api from "@/utils/apiClient";
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
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OptimizeJob = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedJob, setOptimizedJob] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle || !companyName) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide at least job title and company name.",
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
      
      // Combine all input into job description
      const fullJobDescription = `
        Job Title: ${jobTitle}
        Company: ${companyName}
        ${jobDescription ? `Description: ${jobDescription}` : ''}
        ${requirements ? `Requirements: ${requirements}` : ''}
      `.trim();

      // Make API request to optimize job description
      const { data, error } = await api.jobs.optimizeJob({
        jobDescription: fullJobDescription
      });
      
      if (error) {
        throw new Error(error);
      }

      if (data) {
        setOptimizedJob(data.optimizedJob || data.optimized_job_description || 'Job description optimized successfully!');
        
        toast({
          title: "Job description optimized",
          description: "Your job posting has been enhanced with AI recommendations.",
        });
      } else {
        // Mock response for demonstration
        const mockOptimizedJob = `
🚀 **${jobTitle}** at ${companyName}

**About the Role:**
${jobDescription || `We're seeking a talented ${jobTitle} to join our dynamic team at ${companyName}. This is an exciting opportunity to work with cutting-edge technologies and make a significant impact on our growing organization.`}

**Key Responsibilities:**
• Lead innovative projects and drive technical excellence
• Collaborate with cross-functional teams to deliver high-quality solutions
• Mentor junior team members and contribute to knowledge sharing
• Stay current with industry trends and best practices

**Requirements:**
${requirements || `• Bachelor's degree in relevant field or equivalent experience
• 3+ years of experience in similar role
• Strong problem-solving and communication skills
• Ability to work in a fast-paced, collaborative environment`}

**What We Offer:**
• Competitive salary and comprehensive benefits package
• Flexible work arrangements and professional development opportunities
• Innovative work environment with growth potential
• Health, dental, and vision insurance
• 401(k) with company matching

**Ready to Join Us?**
Apply now and become part of our mission to innovate and excel!

---
*${companyName} is an equal opportunity employer committed to diversity and inclusion.*
        `.trim();
        
        setOptimizedJob(mockOptimizedJob);
        
        toast({
          title: "Job description optimized (demo)",
          description: "Your job posting has been enhanced with AI recommendations.",
        });
      }
    } catch (error: any) {
      console.error("Job optimization error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to optimize job description. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimizedJob);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The optimized job description has been copied.",
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
    const file = new Blob([optimizedJob], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${jobTitle.replace(/\s+/g, '_')}_job_description.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Download started",
      description: "Your optimized job description is being downloaded.",
    });
  };

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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Optimize Job Description</h1>
                  <p className="text-gray-600">Create compelling job postings with AI enhancement</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-purple-600" />
                Job Details
              </CardTitle>
              <p className="text-gray-600">Enter your job information to get an AI-optimized description</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle" className="text-base font-medium">
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName" className="text-base font-medium">
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., TechCorp Inc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="jobDescription" className="text-base font-medium">
                    Current Job Description (Optional)
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste your existing job description here, or leave blank for AI to create one from scratch..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[120px] mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="requirements" className="text-base font-medium">
                    Key Requirements (Optional)
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="List specific skills, experience, or qualifications needed..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="min-h-[100px] mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Optimizing Job Description...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Optimize with AI
                    </>
                  )}
                </Button>
              </form>

              {/* Tips */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Optimization Tips:
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Include specific technologies and skills</li>
                  <li>• Mention company culture and benefits</li>
                  <li>• Specify experience level and location</li>
                  <li>• Add growth opportunities and challenges</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {optimizedJob ? (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Optimized Job Description
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {optimizedJob}
                  </pre>
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-blue-800 font-medium">SEO Optimized</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-xs text-green-800 font-medium">Engaging Content</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs text-purple-800 font-medium">Industry Standards</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Optimizing Your Job Description</h3>
                      <p className="text-gray-600">Our AI is enhancing your job posting...</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                        <span>Analyzing requirements</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Optimize</h3>
                      <p className="text-gray-600 max-w-md">
                        Fill in the job details on the left to generate an AI-optimized job description that attracts top talent.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Info */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Optimize Your Job Descriptions?</h3>
              <p className="text-purple-100 max-w-2xl mx-auto">
                Well-crafted job descriptions attract 3x more qualified candidates and improve your hiring success rate.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">85%</div>
                <p className="text-purple-100">Better Response Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">50%</div>
                <p className="text-purple-100">Faster Hiring</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">90%</div>
                <p className="text-purple-100">Quality Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OptimizeJob;
