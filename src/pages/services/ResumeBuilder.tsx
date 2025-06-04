
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, Download, Edit3, Sparkles } from "lucide-react";

const ResumeBuilder = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional Resume Builder</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create stunning, ATS-optimized resumes with our AI-powered builder. Choose from professional templates and get real-time optimization suggestions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Professional Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Choose from dozens of professionally designed templates that work across all industries.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>AI-Powered Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Get intelligent content suggestions and formatting recommendations powered by advanced AI.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Download className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Multiple Export Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Download your resume in PDF, Word, or other popular formats optimized for ATS systems.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/resume-optimizer">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              <Edit3 className="w-5 h-5 mr-2" />
              Start Building Your Resume
            </Button>
          </Link>
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Coming Soon: Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">Share your resume with mentors and get real-time feedback.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Video Resumes</h3>
              <p className="text-gray-600">Create interactive video resumes to stand out from the crowd.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
