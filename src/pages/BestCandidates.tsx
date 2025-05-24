import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import { Loader } from "lucide-react";

// Create a LoadingSpinner component that accepts className
const LoadingSpinner = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <Loader className={`animate-spin ${className}`} size={size} />
);

const BestCandidates = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [candidateCount, setCandidateCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, subscriptionStatus, incrementUsageCount } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a job description.",
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
      
      // Increment usage count for this feature
      const newCount = await incrementUsageCount("best_candidates");
      const usageLimit = subscriptionStatus?.usageLimit || 5;
      
      // Check if user has reached usage limit
      if (subscriptionStatus?.type === "free" && newCount > usageLimit) {
        toast({
          variant: "destructive",
          title: "Usage limit reached",
          description: "Please upgrade your subscription to continue using this feature.",
        });
        return;
      }

      // Make API request to find best candidates
      const { data, error } = await api.jobs.findBestCandidates({
        jobDescription,
        candidateCount
      });
      
      if (error) {
        throw new Error(error);
      }

      if (IS_BACKEND_RUNNING && data) {
        setCandidates(data.candidates || []);
        
        toast({
          title: "Candidate search complete",
          description: `Found ${data.candidates?.length || 0} matching candidates.`,
        });
      } else {
        // Only use mock data if backend is not available
        // This should be removed once backend is fully implemented
        const mockCandidates = Array.from({ length: candidateCount }, (_, i) => ({
          id: `cand-${i+1}`,
          name: `Candidate ${i+1}`,
          matchScore: Math.floor(Math.random() * 30) + 70,
          skills: [
            "JavaScript", "React", "Node.js", "TypeScript", 
            "MongoDB", "AWS", "Docker", "Git"
          ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
          experience: `${Math.floor(Math.random() * 8) + 2} years`,
          education: ["Bachelor's in Computer Science", "Master's in Information Technology"][Math.floor(Math.random() * 2)],
          location: ["Remote", "New York", "San Francisco", "Austin", "Seattle"][Math.floor(Math.random() * 5)],
          availability: ["Immediate", "2 weeks", "1 month"][Math.floor(Math.random() * 3)],
          contactDetails: {
            email: `candidate${i+1}@example.com`,
            phone: `555-${Math.floor(1000 + Math.random() * 9000)}`
          }
        }));
        
        setCandidates(mockCandidates);
        
        toast({
          title: "Candidate search complete (mock)",
          description: `Found ${mockCandidates.length} matching candidates.`,
        });
      }
    } catch (error: any) {
      console.error("Candidate search error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to find candidates. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!candidates.length) return;
    
    const dataToExport = candidates.map(candidate => ({
      Name: candidate.name,
      "Match Score": `${candidate.matchScore}%`,
      Skills: candidate.skills.join(", "),
      Experience: candidate.experience,
      Education: candidate.education,
      Location: candidate.location,
      Availability: candidate.availability,
      Email: candidate.contactDetails.email,
      Phone: candidate.contactDetails.phone
    }));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `best-candidates-${timestamp}`;
    
    api.fileUtils.exportToCSV(dataToExport, filename);
    
    toast({
      title: "Export successful",
      description: `Data has been exported to ${filename}.csv`,
    });
  };

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Find Best Candidates</h1>
        <p className="text-gray-600 mt-2">
          Find the most qualified candidates for your job opening
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <div>
                <Label htmlFor="candidateCount">Number of Candidates to Find</Label>
                <Input
                  id="candidateCount"
                  type="number"
                  min={1}
                  max={20}
                  value={candidateCount}
                  onChange={(e) => setCandidateCount(parseInt(e.target.value) || 5)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Finding candidates...
                  </>
                ) : (
                  "Find Best Candidates"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {candidates.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Matching Candidates</h2>
            <Button variant="outline" onClick={handleExportCSV}>
              Export to CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{candidate.name}</h3>
                    <div className="bg-primary text-white px-2 py-1 rounded text-sm font-medium">
                      {candidate.matchScore}% Match
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Skills:</span>{" "}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {candidate.skills.map((skill: string, index: number) => (
                          <span 
                            key={index} 
                            className="bg-gray-100 px-2 py-1 rounded text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Experience:</span>{" "}
                        {candidate.experience}
                      </div>
                      <div>
                        <span className="font-medium">Education:</span>{" "}
                        {candidate.education}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>{" "}
                        {candidate.location}
                      </div>
                      <div>
                        <span className="font-medium">Availability:</span>{" "}
                        {candidate.availability}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="font-medium mb-1">Contact:</div>
                      <div>{candidate.contactDetails.email}</div>
                      <div>{candidate.contactDetails.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BestCandidates;
