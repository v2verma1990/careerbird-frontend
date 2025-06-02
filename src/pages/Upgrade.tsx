
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Check, Star, Crown, Briefcase, Users } from "lucide-react";
import React, { useState } from "react";

const Upgrade = () => {
  const navigate = useNavigate();
  const { user, userType, profile, subscriptionStatus, updateSubscription } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (type: string) => {
    setLoading(true);
    try {
      console.log(`Initiating upgrade to ${type} plan`);
      await updateSubscription(type, true);
      console.log(`Upgrade to ${type} plan completed`);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatExpirationDate = () => {
    if (!subscriptionStatus?.endDate) return null;
    const endDate = new Date(subscriptionStatus.endDate);
    return endDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're advancing your career or finding top talent, we have the perfect plan for you.
          </p>
        </div>

        {/* Current Plan Status */}
        {subscriptionStatus && (
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Current Plan Status</h3>
                <p className="text-gray-600">
                  You're currently on the <span className="font-bold text-blue-600 capitalize">{subscriptionStatus.type}</span> plan
                  {subscriptionStatus.endDate && (
                    <span className="block text-sm mt-1">
                      {subscriptionStatus.cancelled ? 'Expires' : 'Renews'} on {formatExpirationDate()}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Candidate Plans Section */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-4 mr-4">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900">For Job Seekers</h2>
              <p className="text-gray-600 mt-2">Accelerate your career with AI-powered tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
              subscriptionStatus?.type === 'free' ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-gray-200'
            }`}>
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-t-lg">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Free</CardTitle>
                <CardDescription className="text-gray-500">Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">3 Resume scans per month</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Basic ATS feedback</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Salary insights</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button 
                  className="w-full py-3" 
                  variant={subscriptionStatus?.type === 'free' ? "secondary" : "outline"}
                  disabled={subscriptionStatus?.type === 'free'}
                >
                  {subscriptionStatus?.type === 'free' ? "Current Plan" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>

            {/* Basic Plan */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
              subscriptionStatus?.type === 'basic' ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-gray-200'
            }`}>
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Basic</CardTitle>
                <CardDescription className="text-gray-500">For active job seekers</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-blue-600">$9.99</span>
                  <span className="text-gray-500 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">10 Resume scans per month</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced ATS feedback</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Resume optimization</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Cover letter generation</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => handleUpgrade("basic")}
                  disabled={loading || (subscriptionStatus?.type === 'basic' && !subscriptionStatus?.cancelled)}
                >
                  {loading ? "Upgrading..." : 
                   (subscriptionStatus?.type === 'basic' && !subscriptionStatus?.cancelled ? "Current Plan" : "Upgrade to Basic")}
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
              subscriptionStatus?.type === 'premium' ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg' : 'border-gray-200'
            }`}>
              {subscriptionStatus?.type !== 'premium' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-lg">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Premium</CardTitle>
                <CardDescription className="text-gray-500">For career professionals</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$19.99</span>
                  <span className="text-gray-500 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited resume scans</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Premium ATS feedback</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI resume customization</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Interview preparation tools</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">24/7 priority support</span>
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button 
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                  onClick={() => handleUpgrade("premium")}
                  disabled={loading || (subscriptionStatus?.type === 'premium' && !subscriptionStatus?.cancelled)}
                >
                  {loading ? "Upgrading..." : 
                   (subscriptionStatus?.type === 'premium' && !subscriptionStatus?.cancelled ? "Current Plan" : "Upgrade to Premium")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Recruiter Plan Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-12">
            <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full p-4 mr-4">
              <Briefcase className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900">For Recruiters</h2>
              <p className="text-gray-600 mt-2">Transform your hiring process with AI</p>
            </div>
          </div>
          
          <div className="max-w-lg mx-auto">
            <Card className={`border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
              subscriptionStatus?.type === 'recruiter' ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg' : 'border-gray-200'
            }`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Complete Solution
                </span>
              </div>
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-t-lg">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Briefcase className="w-10 h-10 text-indigo-600" />
                </div>
                <CardTitle className="text-3xl font-bold">Recruiter Pro</CardTitle>
                <CardDescription className="text-gray-500 text-lg">Complete hiring solution</CardDescription>
                <div className="mt-6">
                  <span className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">$29.99</span>
                  <span className="text-gray-500 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-8">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Unlimited candidate analysis</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">AI-powered candidate matching</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Skill gap analysis</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Automated feedback reports</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Candidate comparison tools</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Advanced analytics</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">Dedicated account manager</span>
                </div>
              </CardContent>
              <CardFooter className="p-8">
                <Button 
                  className="w-full py-4 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white" 
                  onClick={() => handleUpgrade("recruiter")}
                  disabled={loading || (subscriptionStatus?.type === 'recruiter' && !subscriptionStatus?.cancelled)}
                >
                  {loading ? "Upgrading..." : 
                   (subscriptionStatus?.type === 'recruiter' && !subscriptionStatus?.cancelled ? "Current Plan" : "Get Recruiter Pro")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-6">Need Something Custom?</h3>
              <p className="text-gray-600 mb-8 text-lg">
                For large organizations with specific requirements, we offer custom enterprise solutions with dedicated support, custom integrations, and flexible pricing.
              </p>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg"
                onClick={() => window.open('mailto:enterprise@resumeai.com?subject=Enterprise%20Plan%20Inquiry', '_blank')}
              >
                Contact Enterprise Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="px-8 py-3">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
