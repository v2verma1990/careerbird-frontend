
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Target, 
  BarChart3, 
  Calendar, 
  Users, 
  Zap, 
  Sparkles,
  Clock,
  ArrowLeft,
  CheckCircle,
  Star,
  TrendingUp,
  MessageCircle,
  FileVideo,
  Shield,
  Globe
} from 'lucide-react';

const UpcomingFeatures = () => {
  const upcomingFeatures = [
    {
      id: 1,
      title: "AI Career Coach",
      description: "Get personalized career guidance powered by advanced AI that learns from your goals and progress.",
      icon: Brain,
      status: "Coming Soon",
      timeline: "Q2 2024",
      benefits: [
        "Personalized career roadmaps",
        "Daily actionable insights",
        "Goal tracking and reminders"
      ]
    },
    {
      id: 2,
      title: "Smart Job Matching",
      description: "Our AI algorithm will automatically match you with the perfect job opportunities based on your profile.",
      icon: Target,
      status: "In Development",
      timeline: "Q3 2024",
      benefits: [
        "AI-powered job recommendations",
        "Compatibility scoring",
        "One-click applications"
      ]
    },
    {
      id: 3,
      title: "Career Progress Analytics",
      description: "Advanced analytics dashboard to track your career growth and identify areas for improvement.",
      icon: BarChart3,
      status: "Planning",
      timeline: "Q4 2024",
      benefits: [
        "Detailed progress reports",
        "Industry benchmarking",
        "Skill gap analysis"
      ]
    },
    {
      id: 4,
      title: "Interview Scheduler",
      description: "Seamlessly schedule and manage interviews with built-in calendar integration and reminders.",
      icon: Calendar,
      status: "Coming Soon",
      timeline: "Q2 2024",
      benefits: [
        "Calendar integration",
        "Automated reminders",
        "Interview preparation tips"
      ]
    },
    {
      id: 5,
      title: "Networking Hub",
      description: "Connect with industry professionals, mentors, and peers to expand your professional network.",
      icon: Users,
      status: "In Development",
      timeline: "Q3 2024",
      benefits: [
        "Professional networking",
        "Mentorship matching",
        "Industry events"
      ]
    },
    {
      id: 6,
      title: "Real-time Market Insights",
      description: "Stay updated with the latest job market trends and salary information in your field.",
      icon: TrendingUp,
      status: "Planning",
      timeline: "Q4 2024",
      benefits: [
        "Market trend analysis",
        "Salary benchmarking",
        "Industry forecasts"
      ]
    },
    {
      id: 7,
      title: "Video Resume Builder",
      description: "Create compelling video resumes to stand out from the competition with our easy-to-use tools.",
      icon: FileVideo,
      status: "Coming Soon",
      timeline: "Q2 2024",
      benefits: [
        "Professional video templates",
        "Script assistance",
        "Easy editing tools"
      ]
    },
    {
      id: 8,
      title: "AI Chat Assistant",
      description: "24/7 AI-powered career assistant to answer questions and provide instant guidance.",
      icon: MessageCircle,
      status: "In Development",
      timeline: "Q3 2024",
      benefits: [
        "Instant career advice",
        "24/7 availability",
        "Personalized responses"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Coming Soon":
        return "bg-green-100 text-green-800";
      case "In Development":
        return "bg-blue-100 text-blue-800";
      case "Planning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/candidate-dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 mr-3 text-purple-600" />
              Upcoming Features
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Exciting new features are on the horizon! Here's what we're building to enhance your career journey.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {upcomingFeatures.map((feature) => (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <feature.icon className="w-8 h-8 text-purple-600" />
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {feature.timeline}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Key Benefits:</h4>
                  {feature.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="text-center py-12">
            <Star className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
            <h2 className="text-3xl font-bold mb-4">Be the First to Know!</h2>
            <p className="text-xl mb-8 opacity-90">
              Want to be notified when these amazing features launch? 
              We'll keep you updated on our progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact-us">
                <Button size="lg" variant="outline" className="bg-white text-purple-600 hover:bg-gray-100">
                  <Zap className="w-5 h-5 mr-2" />
                  Request Feature Updates
                </Button>
              </Link>
              <Link to="/help-center">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Suggest a Feature
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Beta Program */}
        <Card className="mt-8 border-2 border-dashed border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-600">
              <Shield className="w-6 h-6 mr-2" />
              Join Our Beta Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Get early access to new features before they're released to everyone. 
              Your feedback helps us build better tools for your career success.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">Early Access</Badge>
              <Badge variant="outline">Direct Feedback</Badge>
              <Badge variant="outline">Shape Development</Badge>
              <Badge variant="outline">Free Beta Access</Badge>
            </div>
            <Link to="/contact-us">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Globe className="w-4 h-4 mr-2" />
                Join Beta Program
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpcomingFeatures;
