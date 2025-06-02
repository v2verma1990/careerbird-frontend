
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageSquare, Brain, Video, Target } from "lucide-react";

const InterviewPrep = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Interview Preparation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master your next interview with AI-powered practice sessions, personalized feedback, and industry-specific question banks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Mock Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Practice with AI-generated questions tailored to your role and industry.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Get detailed feedback on your answers, tone, and delivery.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Video Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Record practice sessions and analyze your body language and presentation.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Custom Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Practice company-specific scenarios and behavioral questions.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/interview-questions">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Interview Practice
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Upcoming Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">VR Interview Rooms</h3>
              <p className="text-gray-600">Practice in realistic virtual interview environments.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Stress Analysis</h3>
              <p className="text-gray-600">Monitor stress levels and get tips for staying calm under pressure.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Interview Scheduling</h3>
              <p className="text-gray-600">Direct integration with company calendars for seamless scheduling.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
