import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, Upload, FileText, Target } from "lucide-react";

const ResumeAnalysis = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/recruiter-dashboard-new')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Resume Analysis</h1>
              <p className="text-gray-600 mt-1">Advanced AI-powered analysis of resumes against job descriptions</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">AI Resume Analysis</h3>
            <p className="text-gray-600 mb-6">
              This feature will provide comprehensive AI-powered analysis of resumes including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Target className="w-8 h-8 text-blue-500 mb-2" />
                <h4 className="font-medium">Match Scoring</h4>
                <p className="text-sm text-gray-600 text-center">Detailed scoring against job requirements</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-green-500 mb-2" />
                <h4 className="font-medium">Skill Analysis</h4>
                <p className="text-sm text-gray-600 text-center">Identify matching and missing skills</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Upload className="w-8 h-8 text-purple-500 mb-2" />
                <h4 className="font-medium">ATS Compliance</h4>
                <p className="text-sm text-gray-600 text-center">Check resume formatting and keywords</p>
              </div>
            </div>
            <Button onClick={() => navigate('/recruiter-dashboard-new')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeAnalysis;