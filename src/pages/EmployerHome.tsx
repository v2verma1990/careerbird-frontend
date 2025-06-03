
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Brain, BarChart3, FileSearch, Target, Zap } from "lucide-react";

const EmployerHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Employer Solutions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find, evaluate, and hire the best talent with our AI-powered recruiting platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>AI-Powered Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Our advanced algorithms match candidates to your job requirements with unprecedented accuracy.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileSearch className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Resume Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analyze multiple resumes simultaneously and get detailed insights on candidate qualifications.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Hiring Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track your hiring performance and optimize your recruitment strategy with detailed analytics.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/best-candidates">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg mr-4">
              <Users className="w-5 h-5 mr-2" />
              Find Candidates
            </Button>
          </Link>
          <Link to="/signup?type=recruiter">
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
              <Target className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Faster Hiring</h3>
              <p className="text-gray-600">Reduce time-to-hire by 50% with intelligent candidate screening and matching.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Target className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Better Quality</h3>
              <p className="text-gray-600">Find candidates that are not just qualified, but the perfect cultural fit for your team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerHome;
