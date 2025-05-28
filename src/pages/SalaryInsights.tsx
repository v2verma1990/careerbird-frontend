import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import ResumeFileUploader from "@/components/ResumeFileUploader";

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
    // Usage limit check
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
      // Prepare data for API
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

      const { data, error } = await api.resume.salaryinsights(payload);
      if (error) throw new Error(error);

      if (data) {
        setSalaryReport(data);
        toast({
          title: "Salary insights ready",
          description: "See below for your personalized salary and market trends report.",
        });
        // Increment usage count after successful call
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
      <div className="flex justify-center items-center h-64">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span> Loading...
      </div>
    );
  }
  if (!user || !subscriptionStatus) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        You are not logged in. Please log in again.
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Salary Insights & Market Trends</h1>
        <p className="text-gray-600 mt-2">
          Get personalized salary ranges, market trends, and career advice for your profile.
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Usage this month: {featureUsage.usageCount} / {featureUsage.usageLimit > 0 ? featureUsage.usageLimit : "∞"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. Technology"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    placeholder="e.g. 5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="educationLevel">Education Level</Label>
                  <Input
                    id="educationLevel"
                    placeholder="e.g. Bachelor's, Master's, etc."
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="resumeFile">Your Resume (optional)</Label>
                  <ResumeFileUploader onFileSelected={handleFileSelected} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading|| loadingUsage}>
                  {isLoading ? "Getting Insights..." : "Get Salary Insights"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {salaryReport && (
          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Your Salary Insights</h2>
                <div className="mb-2">
                  <span className="font-semibold">Average Estimated Salary Range: </span>
                  <span>{salaryReport.salaryRange ?? "--"}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Industry Average Salary: </span>
                  <span>{salaryReport.industryAverageSalary ?? "--"}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Top 10% Salary: </span>
                  <span>{salaryReport.top10PercentSalary ?? "--"}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Market Trends: </span>
                  <span>{salaryReport.marketTrends ?? "--"}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Career Advice: </span>
                  <span>{salaryReport.advice ?? "--"}</span>
                </div>
                {salaryReport.ai_summary && (
                  <div className="mb-2">
                    <span className="font-semibold">AI Summary: </span>
                    <span>{salaryReport.ai_summary}</span>
                  </div>
                )}
                {/* <pre className="mt-4 bg-gray-100 rounded p-2 text-xs">{JSON.stringify(salaryReport, null, 2)}</pre> */}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryInsights;
