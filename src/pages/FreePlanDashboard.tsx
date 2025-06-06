import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import ResumeFileUploader from "@/components/ResumeFileUploader";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/apiClient";

const FreePlanDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, subscriptionStatus, incrementUsageCount } = useAuth();
  const { toast } = useToast();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [hasViewedResults, setHasViewedResults] = useState(false);
  const [atsUsage, setAtsUsage] = useState<{ usageCount: number; usageLimit: number } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  
  // Calculate remaining days in subscription if user has a subscription that's ending
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const usageRemaining = atsUsage ? atsUsage.usageLimit - atsUsage.usageCount : 0;
  const hasReachedLimit = atsUsage ? usageRemaining <= 0 && subscriptionStatus.type === 'free' : false;
  
  // Redirection is now handled by CandidateProtectedRoute
  
  // Fetch current usage from the backend when component mounts
  useEffect(() => {
    const fetchUsageData = async () => {
      if (user?.id) {
        try {
          // Call the backend API to get current feature usage for ats_scan
          const { data, error } = await api.usage.getFeatureUsage(user.id, "ats_scan");
          if (data && !error) {
            setAtsUsage({ usageCount: data.usageCount, usageLimit: data.usageLimit });
          }
        } catch (err) {
          console.error("Error fetching usage data:", err);
        } finally {
          setUsageLoading(false);
        }
      } else {
        setUsageLoading(false);
      }
    };
    fetchUsageData();
  }, [user]);
  
  const handleFileSelected = (file: File) => {
    setResumeFile(file);
    setAtsScore(null);
    setHasViewedResults(false);
    setIsLoading(false); // Ensure button is enabled for new upload
  };
  
  const analyzeResume = async () => {
    if (!resumeFile || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a resume first.",
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      // Removed pre-scan incrementUsageCount call to prevent double-counting

      setIsLoading(true);
      
      // Call API to scan resume - pass file directly
      const { data, error } = await api.resume.scanAts(resumeFile);
      
      if (error) {
        throw new Error(error);
      }
      
      if (data && data.score) {
        setAtsScore(data.score);
        setHasViewedResults(true);
        
        toast({
          title: "Analysis complete",
          description: "Your resume has been analyzed. View your ATS score!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to analyze resume. Please try again.",
        });
      }
      
      setIsAnalyzing(false);
    } catch (error: any) {
      console.error("Resume analysis error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to analyze resume. Please try again.",
      });
      setIsAnalyzing(false);
    }
  };

  const displayResults = async () => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a resume first.",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call API to scan resume - pass file directly
      const { data, error } = await api.resume.scanAts(resumeFile);
      console.log("ATS scan response:", data, error);
      
      if (error) {
        throw new Error(error);
      }
      
      // Verify data format and extract score
      if (data && typeof data.atsScore === 'number') {
        setAtsScore(data.atsScore);
        
        // Only increment usage after a successful scan
        try {
          const featureType = "ats_scan";
          const { data: usageData, error: usageError } = await api.usage.incrementUsage(user.id, featureType);
          if (usageData && !usageError) {
            setAtsUsage({ usageCount: usageData.newCount, usageLimit: usageData.usageLimit });
          }
          
          // Check if user has reached usage limit after increment
          // Only block if newCount > usageLimit (not >=)
          if (usageData && usageData.newCount > usageData.usageLimit && subscriptionStatus.type === "free") {
            toast({
              variant: "destructive",
              title: "Usage limit reached",
              description: "You've used all your free scans. Please upgrade to continue.",
            });
            setIsLoading(false);
            navigate('/upgrade', { replace: true });
            return;
          }
          
          setHasViewedResults(true);
          
          toast({
            title: "Analysis complete",
            description: "Your resume has been analyzed. View your ATS score!",
          });
        } catch (incrementError: any) {
          console.error("Error incrementing usage count:", incrementError);
          setHasViewedResults(true);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Your results are displayed but we couldn't update your usage count. You may see incorrect remaining scans.",
          });
        }
      } else {
        throw new Error("Failed to get ATS score - Invalid data format");
      }
      
      setIsLoading(false);
      
    } catch (error: any) {
      console.error("Display results error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to display results. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Loading state for subscription and user data
  const subscriptionLoading = !user || !subscriptionStatus;

  if (subscriptionLoading || isLoading) {
    return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span> Loading dashboard...</div>;
  }

  if (!user || !subscriptionStatus) {
    return <div className="flex justify-center items-center h-64 text-red-500">You are not logged in. Please log in again.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Free Plan Dashboard</h1>
          <p className="text-gray-600">{user?.email ? `Hello, ${user.email}!` : "Hello!"} Start optimizing your job search with our ATS scanner.</p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-4">
            <Badge className="px-3 py-1 bg-gray-500">Free Plan</Badge>
            <Button variant="outline" onClick={() => navigate('/upgrade')}>Upgrade</Button>
          </div>
          
          {/* Show message if user has a subscription that's ending */}
          {subscriptionStatus.endDate && subscriptionStatus.cancelled && (
            <p className="text-sm text-gray-500">
              {getRemainingDays() > 0 
                ? `Your ${subscriptionStatus.type} plan will end in ${getRemainingDays()} days` 
                : "Your subscription ends today"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resume upload and analysis card */}
        <Card className="overflow-hidden border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>Get quick feedback on how well your resume performs with ATS systems</CardDescription>
          </CardHeader>
          
          <CardContent>
            <ResumeFileUploader 
              onFileSelected={handleFileSelected} 
              disabled={isAnalyzing || isLoading}
            />
          </CardContent>
          
          <CardFooter className="flex flex-col items-center">
            {!hasViewedResults ? (
              <Button 
                onClick={displayResults} 
                disabled={!resumeFile || isAnalyzing || isLoading || (atsUsage && atsUsage.usageCount >= atsUsage.usageLimit && subscriptionStatus.type === 'free')}
                className="w-full max-w-xs"
              >
                {isLoading ? "Processing..." : "Display ATS Score"}
              </Button>
            ) : (
              <Button
                onClick={displayResults}
                disabled={true} // Always disabled after scan until new file is uploaded
                className="w-full max-w-xs"
              >
                Scan Again (Upload New File)
              </Button>
            )}
            
            {hasReachedLimit && (
              <p className="text-sm text-red-500 mt-2">
                You've reached your free limit. Please upgrade your plan to continue.
              </p>
            )}
          </CardFooter>
        </Card>

        {/* ATS Score display card */}
        <Card className="overflow-hidden border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle>Your ATS Score</CardTitle>
            <CardDescription>How well your resume performs with Applicant Tracking Systems</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-8">
            {atsScore !== null && hasViewedResults ? (
              <div className="text-center">
                <div className="relative inline-flex">
                  <div className="w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 border-8 border-blue-500">
                    <span className="text-5xl font-bold text-blue-700">{atsScore}%</span>
                  </div>
                  <Star className="absolute top-0 right-0 h-10 w-10 text-yellow-500" />
                </div>
                
                <p className="mt-6 text-lg">
                  {atsScore >= 80 
                    ? "Excellent! Your resume is well-optimized for ATS systems."
                    : atsScore >= 60
                    ? "Good work! With a few tweaks, your resume could perform even better."
                    : "Your resume needs improvement to perform well with ATS systems."}
                </p>
                
                {/* Remove the "Optimize Your Resume" button in free plan */}
                <div className="mt-8">
                  <Button 
                    onClick={() => navigate('/upgrade')}
                    className="w-full"
                  >
                    Upgrade to Optimize Your Resume
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-48 h-48 rounded-full flex items-center justify-center bg-gray-100 border-8 border-gray-200 mx-auto">
                  <span className="text-3xl font-bold text-gray-400">No data</span>
                </div>
                <p className="mt-6 text-gray-500">
                  {resumeFile ? "Click 'Display ATS Score' to see your results" : "Upload your resume and click 'Display ATS Score' to see your score"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade options - Only show Basic and Premium plans */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Upgrade to Access Premium Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <Card className="overflow-hidden border border-gray-200 transition-shadow hover:shadow-md">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle>Basic Plan</CardTitle>
              <CardDescription>For active job seekers</CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>10 Resume scans per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Advanced ATS feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Resume optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Cover letter generation</span>
                </li>
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => navigate('/upgrade')}
              >
                Upgrade to Basic
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="overflow-hidden border-2 border-blue-500 transition-shadow hover:shadow-lg">
            <div className="bg-blue-500 text-white text-center py-1 text-xs font-bold">
              MOST POPULAR
            </div>
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle>Premium Plan</CardTitle>
              <CardDescription>For serious professionals</CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">$19.99</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Unlimited resume scans</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Premium ATS feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>AI Resume customization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Interview preparation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => navigate('/upgrade')}
              >
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Need more information? Check out our <a href="#" className="text-blue-600 hover:underline">feature comparison</a> or <a href="#" className="text-blue-600 hover:underline">contact support</a>.
        </p>
      </div>
    </div>
  );
};

export default FreePlanDashboard;
