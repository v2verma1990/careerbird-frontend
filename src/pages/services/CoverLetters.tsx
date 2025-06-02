
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, Sparkles, Target, Clock } from "lucide-react";

const CoverLetters = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Cover Letter Generator</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create compelling, personalized cover letters that grab attention and showcase your perfect fit for any role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI-Powered Writing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Generate professional content tailored to your experience and the job role.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Job-Specific</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Customize each letter to match specific job requirements and company culture.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Multiple Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Choose from various professional templates for different industries.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Quick Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create polished cover letters in minutes, not hours.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/cover-letter-generator">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">
              <FileText className="w-5 h-5 mr-2" />
              Generate Cover Letter
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Email Templates</h3>
              <p className="text-gray-600">Generate follow-up emails, thank you notes, and networking messages.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Tone Adjustment</h3>
              <p className="text-gray-600">Adjust writing tone from formal to casual based on company culture.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetters;
