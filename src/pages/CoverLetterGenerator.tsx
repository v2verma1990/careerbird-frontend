import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";

const CoverLetterGenerator = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      // Use correct feature key for usage tracking
      const featureKey = "cover_letter";
      const newCount = await incrementUsageCount(featureKey);
      const usageLimit = subscriptionStatus?.usageLimit || 3;
      
      // Block if at limit
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

      // Make API request to generate cover letter
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
        // Mock data generation
        const mockCoverLetter = `
Dear Hiring Manager,

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
[Your Name]
`;
        
        setCoverLetter(mockCoverLetter);
        
        toast({
          title: "Cover letter generated (mock)",
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

  return (
    <div className="container mx-auto my-8 px-4">
      {upgradePrompt && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          {upgradePrompt}
          <Button className="ml-4" variant="outline" onClick={() => setUpgradePrompt(null)}>Dismiss</Button>
        </div>
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
        <p className="text-gray-600 mt-2">
          Create a professional cover letter tailored to your job application
        </p>
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
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Acme Corporation"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Cover Letter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <Label htmlFor="coverLetter">Your Cover Letter</Label>
              <Textarea
                id="coverLetter"
                placeholder="Your generated cover letter will appear here..."
                value={coverLetter}
                readOnly
                className="min-h-[500px]"
              />
            </div>
            {coverLetter && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter);
                    toast({
                      title: "Copied!",
                      description: "Cover letter copied to clipboard.",
                    });
                  }}
                  className="w-full"
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
