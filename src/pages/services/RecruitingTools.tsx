
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Brain, BarChart3, FileSearch } from "lucide-react";

const RecruitingTools = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Recruiting Tools</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your hiring process with intelligent candidate matching, automated screening, and comprehensive analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Intelligent algorithms match candidates to job requirements automatically.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileSearch className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Resume Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Bulk analyze resumes and extract key skills and qualifications.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track hiring metrics and optimize your recruitment strategy.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Team-based hiring with feedback collection and decision tracking.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/best-candidates">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Start Recruiting
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Video Screening</h3>
              <p className="text-gray-600">AI-powered video interview screening and analysis.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Talent Pipeline</h3>
              <p className="text-gray-600">Build and manage talent pipelines for future openings.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Integration Hub</h3>
              <p className="text-gray-600">Connect with popular HR systems and job boards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitingTools;
