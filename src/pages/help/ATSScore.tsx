
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const ATSScore = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/help-center" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">How ATS Scoring Works</h1>
            <p className="text-gray-600 mb-8">Updated on March 15, 2024 • 5 min read</p>
            
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Understanding ATS Compatibility</h2>
              <p className="mb-6">
                Applicant Tracking Systems (ATS) are software applications that help employers manage the recruitment process. 
                Our ATS scoring system evaluates how well your resume will perform when processed by these systems.
              </p>

              <h3 className="text-xl font-semibold mb-4">What We Analyze</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Format & Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• File format compatibility</li>
                      <li>• Section organization</li>
                      <li>• Heading consistency</li>
                      <li>• Text readability</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Keywords & Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Job-relevant keywords</li>
                      <li>• Skills matching</li>
                      <li>• Industry terminology</li>
                      <li>• Experience alignment</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <XCircle className="w-5 h-5 mr-2" />
                      Common Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Complex formatting</li>
                      <li>• Images or graphics</li>
                      <li>• Unusual fonts</li>
                      <li>• Missing sections</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mb-4">Score Breakdown</h3>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">90-100 (Excellent)</span>
                    <div className="w-32 bg-green-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">70-89 (Good)</span>
                    <div className="w-32 bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-4/5"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">50-69 (Fair)</span>
                    <div className="w-32 bg-yellow-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full w-3/5"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Below 50 (Needs Work)</span>
                    <div className="w-32 bg-red-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Tips to Improve Your Score</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Use standard section headings like "Experience," "Education," and "Skills"</li>
                <li>Include relevant keywords from the job description</li>
                <li>Use a clean, simple format without graphics or unusual fonts</li>
                <li>Save your resume as a PDF or Word document</li>
                <li>Include your contact information at the top</li>
                <li>Use bullet points for easy scanning</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Pro Tip</h4>
                <p className="text-blue-700">
                  Our AI analyzes over 50 different factors to give you the most accurate ATS compatibility score. 
                  Use our optimization suggestions to improve your score and increase your chances of getting noticed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScore;
