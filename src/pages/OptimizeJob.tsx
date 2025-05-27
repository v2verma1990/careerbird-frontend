import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileUp } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import api from "@/utils/apiClient";

interface OptimizedJobDescription {
  originalContent: string;
  optimizedContent: string;
  insights: string[];
}

const OptimizeJob = () => {
  const { userType } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [optimizedDescription, setOptimizedDescription] = useState<OptimizedJobDescription | null>(null);
  
  const optimizeJobDescription = async () => {
    if (!jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Missing job description",
        description: "Please enter a job description to optimize."
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get the current user from session
      const userSession = api.auth.getCurrentUser();
      if (!userSession || !userSession.userId) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please login to use this feature."
        });
        setIsProcessing(false);
        return;
      }
      
      // Fix: Update API call to match the new method signature
      const { data, error } = await api.jobs.optimizeJobDescription({
        jobDescription
      });
      
      if (error || !data) {
        throw new Error(error || "Failed to optimize job description");
      }
      
      setOptimizedDescription({
        originalContent: data.originalContent || jobDescription,
        optimizedContent: data.optimizedContent,
        insights: data.insights || []
      });
      
      setOptimized(true);
      
      toast({
        title: "Job Description Optimized",
        description: "Your job description has been optimized to attract better candidates."
      });
    } catch (error) {
      console.error("Error optimizing job description:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to optimize job description. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCopy = () => {
    if (optimizedDescription) {
      navigator.clipboard.writeText(optimizedDescription.optimizedContent);
      toast({
        title: "Job description copied",
        description: "Optimized job description has been copied to clipboard."
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <span className="text-2xl font-bold text-blue-600">ResumeAI</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Optimize Job Description</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Original Job Description</h2>
            <label htmlFor="original-job-description" className="sr-only">
              Original Job Description
            </label>
            <textarea 
              id="original-job-description"
              className="w-full h-64 border border-gray-300 rounded-md p-3"
              placeholder="Paste your job description here..."
              title="Original Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
            
            <div className="mt-4">
              <Button
                onClick={optimizeJobDescription}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Optimizing..." : "Optimize Job Description"}
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            {optimizedDescription ? (
              <>
                <label htmlFor="optimized-job-description" className="sr-only">
                  Optimized Job Description
                </label>
                <textarea 
                  id="optimized-job-description"
                  className="w-full h-64 border border-gray-300 rounded-md p-3"
                  placeholder="Optimized job description will appear here..."
                  title="Optimized Job Description"
                  value={optimizedDescription.optimizedContent}
                  readOnly
                ></textarea>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setOptimized(false)}>
                    Reset
                  </Button>
                  <Button variant="outline" className="ml-2" onClick={handleCopy}>
                    Copy to Clipboard
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <h3 className="text-sm font-semibold text-blue-800">Optimization Insights</h3>
                  <ul className="mt-2 text-sm text-blue-700 list-disc pl-5">
                    {optimizedDescription.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Optimizing your job description...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">
                      Your optimized job description will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OptimizeJob;
