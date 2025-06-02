
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

  const isRecruiter = userType === 'recruiter';
  const isCandidate = userType === 'candidate';

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

        {/* Plans Section */}
        <div className="max-w-7xl mx-auto">
          {/* Candidate Plans */}
          <div className="mb-16">
            <div className="flex items-center justify-center mb-8">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">For Job Seekers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                subscriptionStatus?.type === 'free' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}>
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-600" />
                  </div>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>3 Resume scans per month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Basic ATS feedback</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Salary insights</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Email support</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={subscriptionStatus?.type === 'free' ? "secondary" : "outline"}
                    disabled={subscriptionStatus?.type === 'free'}
                  >
                    {subscriptionStatus?.type === 'free' ? "Current Plan" : "Get Started"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Basic Plan */}
              <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                subscriptionStatus?.type === 'basic' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}>
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Basic</CardTitle>
                  <CardDescription>For active job seekers</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>10 Resume scans per month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced ATS feedback</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Resume optimization</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Cover letter generation</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={() => handleUpgrade("basic")}
                    disabled={loading || (subscriptionStatus?.type === 'basic' && !subscriptionStatus?.cancelled)}
                  >
                    {loading ? "Upgrading..." : 
                     (subscriptionStatus?.type === 'basic' && !subscriptionStatus?.cancelled ? "Current Plan" : "Upgrade to Basic")}
                  </Button>
                </CardFooter>
              </Card>

              {/* Premium Plan */}
              <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                subscriptionStatus?.type === 'premium' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
              }`}>
                {subscriptionStatus?.type !== 'premium' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <CardDescription>For career professionals</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$19.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited resume scans</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Premium ATS feedback</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>AI resume customization</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Interview preparation tools</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>24/7 priority support</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
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

          {/* Recruiter Plan */}
          <div>
            <div className="flex items-center justify-center mb-8">
              <Briefcase className="w-8 h-8 text-indigo-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">For Recruiters</h2>
            </div>
            
            <div className="max-w-md mx-auto">
              <Card className={`border-2 transition-all duration-300 hover:shadow-xl ${
                subscriptionStatus?.type === 'recruiter' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
              }`}>
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-2xl">Recruiter Pro</CardTitle>
                  <CardDescription>Complete hiring solution</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited candidate analysis</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>AI-powered candidate matching</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Skill gap analysis</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Automated feedback reports</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Candidate comparison tools</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Dedicated account manager</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700" 
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
        </div>

        {/* Enterprise Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Need Something Custom?</h3>
              <p className="text-gray-600 mb-6">
                For large organizations with specific requirements, we offer custom enterprise solutions.
              </p>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                onClick={() => window.open('mailto:enterprise@resumeai.com?subject=Enterprise%20Plan%20Inquiry', '_blank')}
              >
                Contact Enterprise Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="px-8">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
