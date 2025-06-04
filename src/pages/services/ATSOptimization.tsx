
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Target, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";

const ATSOptimization = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ATS Optimization Service</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ensure your resume passes through Applicant Tracking Systems with our advanced ATS optimization technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">ATS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Get a real-time compatibility score for your resume.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analyze keyword density and relevance for job descriptions.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Format Check</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Ensure your formatting works with all ATS systems.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Issue Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Identify and fix common ATS parsing problems.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/ats-scanner">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
              <Target className="w-5 h-5 mr-2" />
              Scan Your Resume Now
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Upcoming Enhancements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Multi-ATS Testing</h3>
              <p className="text-gray-600">Test compatibility across 50+ ATS platforms simultaneously.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Industry-Specific Optimization</h3>
              <p className="text-gray-600">Tailored optimization rules for different industries and roles.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Real-time Job Matching</h3>
              <p className="text-gray-600">Optimize your resume for specific job postings in real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSOptimization;
