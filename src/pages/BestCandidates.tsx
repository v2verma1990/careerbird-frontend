
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import api, { IS_BACKEND_RUNNING } from "@/utils/apiClient";
import { 
  Loader, 
  Users, 
  Search, 
  Star, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Briefcase,
  Download,
  ArrowLeft,
  Zap,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
          title: "Candidate search complete",
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

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
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
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Find Best Candidates</h1>
                  <p className="text-gray-600">AI-powered candidate matching for your perfect hire</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm sticky top-8">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Search className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Search Criteria</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="jobDescription" className="text-base font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Job Description
                    </Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the complete job description here... Include requirements, responsibilities, and qualifications."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px] mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="candidateCount" className="text-base font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of Candidates
                    </Label>
                    <Input
                      id="candidateCount"
                      type="number"
                      min={1}
                      max={20}
                      value={candidateCount}
                      onChange={(e) => setCandidateCount(parseInt(e.target.value) || 5)}
                      className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg transform transition-all duration-200 hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Finding candidates...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Best Candidates
                      </>
                    )}
                  </Button>
                </form>

                {/* Search Tips */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Include specific skills and requirements</li>
                    <li>• Mention experience level needed</li>
                    <li>• Add location preferences</li>
                    <li>• Specify industry or domain</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {candidates.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Top Matching Candidates</h2>
                    <Badge className="bg-blue-100 text-blue-800">{candidates.length} found</Badge>
                  </div>
                  <Button variant="outline" onClick={handleExportCSV} className="hover:bg-blue-50">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <div className="space-y-4">
                  {candidates.map((candidate, index) => (
                    <Card key={candidate.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {candidate.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                              <p className="text-gray-600">Rank #{index + 1}</p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-bold text-lg ${getMatchScoreColor(candidate.matchScore)}`}>
                            <Star className="w-4 h-4 inline mr-1" />
                            {candidate.matchScore}% Match
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Skills</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {candidate.skills.map((skill: string, skillIndex: number) => (
                                    <Badge 
                                      key={skillIndex} 
                                      variant="outline"
                                      className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Briefcase className="w-5 h-5 text-green-600" />
                              <div>
                                <span className="font-semibold text-gray-900">Experience:</span>
                                <span className="ml-2 text-gray-700">{candidate.experience}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-5 h-5 text-purple-600" />
                              <div>
                                <span className="font-semibold text-gray-900">Education:</span>
                                <span className="ml-2 text-gray-700">{candidate.education}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-red-600" />
                              <div>
                                <span className="font-semibold text-gray-900">Location:</span>
                                <span className="ml-2 text-gray-700">{candidate.location}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-orange-600" />
                              <div>
                                <span className="font-semibold text-gray-900">Availability:</span>
                                <span className="ml-2 text-gray-700">{candidate.availability}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900">Contact Information</h4>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <a href={`mailto:${candidate.contactDetails.email}`} className="text-blue-600 hover:underline">
                                  {candidate.contactDetails.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-green-600" />
                                <a href={`tel:${candidate.contactDetails.phone}`} className="text-green-600 hover:underline">
                                  {candidate.contactDetails.phone}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching for Candidates</h3>
                  <p className="text-gray-600 mb-4">Our AI is analyzing your job description and matching the best candidates...</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Processing requirements</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Your Perfect Hire</h3>
                  <p className="text-gray-600 max-w-md">
                    Enter your job description to discover the most qualified candidates using our AI-powered matching system.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestCandidates;
