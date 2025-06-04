
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Save, CheckCircle, Target, Award, Brain, Sparkles, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { exportToCSV, downloadTextFile } from "@/utils/exportUtils";
import api from "@/utils/apiClient";
import { Badge } from "@/components/ui/badge";

interface InterviewQuestion {
  question: string;
  category: string;
}

const InterviewQuestions = () => {
  const { user, incrementUsageCount } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestion[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const [featureUsage, setFeatureUsage] = useState<{ usageCount: number; usageLimit: number }>({ usageCount: 0, usageLimit: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'technical', name: 'Technical Skills' },
    { id: 'behavioral', name: 'Behavioral' },
    { id: 'experience', name: 'Work Experience' },
    { id: 'situational', name: 'Situational' },
  ];

  useEffect(() => {
    setLoadingUsage(true);
    setError(null);
    api.usage.getFeatureUsage(user.id, "interview_questions")
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch usage data.");
          setFeatureUsage({ usageCount: 0, usageLimit: 0 });
        } else if (data) {
          setFeatureUsage(data);
        }
        setLoadingUsage(false);
      })
      .catch(() => {
        setError("An unexpected error occurred while loading usage data.");
        setFeatureUsage({ usageCount: 0, usageLimit: 0 });
        setLoadingUsage(false);
      });
  }, [user]);

  const generateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast({
        variant: "destructive", 
        title: "Job title required",
        description: "Please enter a job title to generate relevant questions."
      });
      return;
    }
    setIsLoading(true);
    try {
      const featureKey = "interview_questions";
      if (featureUsage.usageLimit > 0 && featureUsage.usageCount >= featureUsage.usageLimit) {
        setUpgradePrompt(
          "You have reached your plan's limit for interview questions. Upgrade for unlimited access!"
        );
        setIsLoading(false);
        return;
      }

      const newCount = await incrementUsageCount(featureKey);
      setFeatureUsage((prev) => ({
        ...prev,
        usageCount: newCount,
      }));

      // Mock questions for demonstration
      const mockQuestions: InterviewQuestion[] = [
        { question: `What interests you most about the ${jobTitle} position?`, category: 'behavioral' },
        { question: `Describe a challenging project you've worked on as a ${jobTitle.toLowerCase()}.`, category: 'experience' },
        { question: `What technical skills are most important for a ${jobTitle}?`, category: 'technical' },
        { question: `How would you handle a situation where you disagree with your team's approach?`, category: 'situational' },
        { question: `Where do you see yourself in 5 years as a ${jobTitle}?`, category: 'behavioral' },
        { question: `What methodologies or frameworks do you prefer for ${jobTitle.toLowerCase()} work?`, category: 'technical' },
        { question: `Tell me about a time you had to learn a new skill quickly for your role.`, category: 'experience' },
        { question: `How do you prioritize tasks when everything seems urgent?`, category: 'situational' },
        { question: `What motivates you in your ${jobTitle.toLowerCase()} career?`, category: 'behavioral' },
        { question: `Describe your experience with [relevant technology/tool for ${jobTitle}].`, category: 'technical' }
      ];

      setGeneratedQuestions(mockQuestions);
      
      toast({
        title: "Questions generated successfully",
        description: `Generated ${mockQuestions.length} interview questions for ${jobTitle}.`
      });
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate interview questions. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = selectedCategory === 'all' 
    ? generatedQuestions 
    : generatedQuestions.filter(q => q.category === selectedCategory);

  const handleDownload = () => {
    if (generatedQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions to download",
        description: "Please generate questions first."
      });
      return;
    }

    const questionsText = `INTERVIEW QUESTIONS FOR: ${jobTitle.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}

${filteredQuestions.map((q, i) => `${i+1}. ${q.question} (${q.category})`).join('\n\n')}
`;

    downloadTextFile(questionsText, `interview_questions_${jobTitle.replace(/\s+/g, '_').toLowerCase()}.txt`);
    
    toast({
      title: "Questions downloaded",
      description: "Interview questions have been downloaded successfully."
    });
  };

  const handleExportCSV = () => {
    if (generatedQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions to export",
        description: "Please generate questions first."
      });
      return;
    }

    const exportData = filteredQuestions.map((q, i) => ({
      Number: i + 1,
      Question: q.question,
      Category: q.category.charAt(0).toUpperCase() + q.category.slice(1),
      JobTitle: jobTitle
    }));

    exportToCSV(exportData, `${jobTitle.replace(/\s+/g, '_')}_interview_questions`);
    
    toast({
      title: "Export successful",
      description: "Interview questions exported to CSV."
    });
  };

  if (loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
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
              <Button variant="ghost" onClick={() => navigate('/candidate-dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Interview Question Generator</h1>
                  <p className="text-gray-600">Practice with AI-generated questions tailored to your target role</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <Brain className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
              <Badge variant="outline" className="border-pink-200 text-pink-700">
                <HelpCircle className="w-3 h-3 mr-1" />
                Practice Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-purple-600" />
                Generate Questions
              </CardTitle>
              <p className="text-gray-600">Enter your target job title to generate relevant interview questions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="jobTitle" className="text-base font-medium">
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="e.g. Full Stack Developer"
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  onClick={generateQuestions}
                  disabled={isLoading}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Generate Interview Questions
                    </>
                  )}
                </Button>
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  💡 Interview Tips:
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Practice answers using the STAR method (Situation, Task, Action, Result)</li>
                  <li>• Research the company and role beforehand</li>
                  <li>• Prepare specific examples from your experience</li>
                  <li>• Practice with a friend or record yourself</li>
                  <li>• Have questions ready to ask the interviewer</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Questions Display */}
          {generatedQuestions.length > 0 ? (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Interview Questions
                  </CardTitle>
                  <div className="flex space-x-2">
                    <select
                      title="Select question category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Save className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600">
                  {filteredQuestions.length} questions for {jobTitle || 'your role'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {index + 1}. {q.question}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`ml-3 text-xs ${
                              q.category === 'technical' ? 'border-blue-300 text-blue-700' :
                              q.category === 'behavioral' ? 'border-green-300 text-green-700' :
                              q.category === 'experience' ? 'border-purple-300 text-purple-700' :
                              q.category === 'situational' ? 'border-orange-300 text-orange-700' :
                              'border-gray-300 text-gray-700'
                            }`}
                          >
                            {q.category.charAt(0).toUpperCase() + q.category.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No questions found for the selected category</p>
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
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Generating Questions</h3>
                      <p className="text-gray-600">Our AI is creating personalized interview questions...</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                        <span>Analyzing job requirements</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Practice</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Enter your target job title to generate relevant interview questions and start practicing your responses.
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
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Why Practice Interview Questions?</h3>
              <p className="text-purple-100 max-w-2xl mx-auto">
                Well-prepared candidates perform 50% better in interviews and are 3x more likely to receive job offers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">50%</div>
                <p className="text-purple-100">Better Performance</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">3x</div>
                <p className="text-purple-100">More Job Offers</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">85%</div>
                <p className="text-purple-100">Confidence Boost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewQuestions;
