import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { exportToCSV, downloadTextFile } from "@/utils/exportUtils";
import api from "@/utils/apiClient";

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
      // Usage tracking for interview questions
      const featureKey = "interview_questions";
      // Use backend-provided usage count and limit
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

      // ...your logic to generate questions...
      // setGeneratedQuestions(...);
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

  return (
    <div className="container mx-auto my-8 px-4">
      {upgradePrompt && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          {upgradePrompt}
          <Button className="ml-4" variant="outline" onClick={() => setUpgradePrompt(null)}>Dismiss</Button>
        </div>
      )}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/candidate-dashboard')}
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
        <h1 className="text-2xl font-bold mb-6">Interview Question Generator</h1>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Questions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Full Stack Developer"
                />
              </div>
              
              <Button
                onClick={generateQuestions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate Interview Questions"}
              </Button>
            </div>
          </Card>
          
          {generatedQuestions.length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Interview Questions</h2>
                <div className="flex space-x-2">
                  <select
                    title="Select question category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as CSV
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md divide-y">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-medium">{index + 1}. {q.question}</span>
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {q.category.charAt(0).toUpperCase() + q.category.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No questions found for the selected category
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewQuestions;
