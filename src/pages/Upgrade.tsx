import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Check } from "lucide-react";
import React, { useState } from "react";

const Upgrade = () => {
  const navigate = useNavigate();
  const { user, userType, profile, subscriptionStatus, updateSubscription } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if user is a recruiter or candidate
  const isRecruiter = userType === 'recruiter';
  const isCandidate = userType === 'candidate';

  console.log("Upgrade page - User info:", { 
    userType, 
    subscriptionType: subscriptionStatus?.type,
    isRecruiter,
    isCandidate
  });

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
  
  // Format subscription end date nicely
  const formatExpirationDate = () => {
    if (!subscriptionStatus.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    return endDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Show plans based on user type and current subscription
  const showFreePlan = isCandidate && subscriptionStatus?.type === 'free';
  const showBasicPlan = isCandidate; // Always show basic plan for candidates
  const showPremiumPlan = isCandidate; // Always show premium plan for candidates
  const showRecruiterPlan = isRecruiter; // Show recruiter plan for recruiters

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Upgrade Your Plan</h1>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Choose the plan that best fits your needs and unlock more features to boost your career. For enterprise, contact us for a custom solution.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-lg mb-12">
          <thead>
            <tr>
              <th className="py-4 px-6 text-left text-lg font-semibold">Feature</th>
              <th className="py-4 px-6 text-center font-semibold">Free</th>
              <th className="py-4 px-6 text-center font-semibold">Basic</th>
              <th className="py-4 px-6 text-center font-semibold">Premium</th>
              <th className="py-4 px-6 text-center font-semibold">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="py-3 px-6">Resume Uploads</td>
              <td className="text-center">1</td>
              <td className="text-center">10/mo</td>
              <td className="text-center">Unlimited</td>
              <td className="text-center">Unlimited</td>
            </tr>
            <tr className="border-t">
              <td className="py-3 px-6">ATS Analysis</td>
              <td className="text-center">Basic</td>
              <td className="text-center">Advanced</td>
              <td className="text-center">Premium</td>
              <td className="text-center">Custom</td>
            </tr>
            <tr className="border-t">
              <td className="py-3 px-6">AI Resume Customization</td>
              <td className="text-center">-</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-t">
              <td className="py-3 px-6">Cover Letter Generation</td>
              <td className="text-center">-</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-t">
              <td className="py-3 px-6">Interview Prep Tools</td>
              <td className="text-center">-</td>
              <td className="text-center">-</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-t">
              <td className="py-3 px-6">Support</td>
              <td className="text-center">Email</td>
              <td className="text-center">Priority</td>
              <td className="text-center">24/7</td>
              <td className="text-center">Dedicated Manager</td>
            </tr>
          </tbody>
        </table>
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
          <Button 
            size="lg" 
            className="bg-blue-600 text-white"
            onClick={() => subscriptionStatus.type === 'free' ? handleUpgrade("basic") : handleUpgrade("premium")}
            disabled={loading}
          >
            {loading ? "Upgrading..." : "Upgrade Now"}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-600"
            onClick={() => window.open('mailto:support@resumeai.com?subject=Enterprise%20Plan%20Inquiry', '_blank')}
          >
            Contact Sales
          </Button>
        </div>
      </div>

      <div className="text-center mt-12">
        <h2 className="text-3xl font-bold mb-6">Our Plans</h2>
        <p className="text-gray-600 mb-8">
          Select a plan to see detailed features and pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free Plan - Only for candidates */}
        {showFreePlan && (
          <Card className={`border ${subscriptionStatus?.type === 'free' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">Free Plan</CardTitle>
              <CardDescription>For casual users</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>3 Resume scans per month</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Basic ATS feedback</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Salary Insights</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={subscriptionStatus?.type === 'free' ? "secondary" : "outline"}
                onClick={() => handleUpgrade("free")}
                disabled={subscriptionStatus?.type === 'free' || loading}
              >
                {loading && subscriptionStatus?.type !== 'free' ? "Upgrading..." : (subscriptionStatus?.type === 'free' ? "Current Plan" : "Select Free")}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Basic Plan - For candidates */}
        {showBasicPlan && (
          <Card className={`border ${subscriptionStatus?.type === 'basic' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">Basic Plan</CardTitle>
              <CardDescription>For active job seekers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>10 Resume scans per month</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Advanced ATS feedback</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Resume optimization</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Cover letter generation</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={subscriptionStatus?.type === 'basic' ? "secondary" : "default"}
                onClick={() => handleUpgrade("basic")}
                disabled={subscriptionStatus?.type === 'basic' || loading}
              >
                {loading && subscriptionStatus?.type !== 'basic' ? "Upgrading..." : (subscriptionStatus?.type === 'basic' ? "Current Plan" : "Upgrade to Basic")}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Premium Plan - For candidates */}
        {showPremiumPlan && (
          <Card className={`border ${subscriptionStatus?.type === 'premium' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">Premium Plan</CardTitle>
              <CardDescription>For professionals</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Unlimited Resume scans</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Premium ATS feedback</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>AI Resume customization</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Interview preparation</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Priority support</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={subscriptionStatus?.type === 'premium' ? "secondary" : "default"}
                onClick={() => handleUpgrade("premium")}
                disabled={subscriptionStatus?.type === 'premium' || loading}
              >
                {loading && subscriptionStatus?.type !== 'premium' ? "Upgrading..." : (subscriptionStatus?.type === 'premium' ? "Current Plan" : "Upgrade to Premium")}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Recruiter Plan - Only for recruiters */}
        {showRecruiterPlan && (
          <Card className={`border ${subscriptionStatus?.type === 'recruiter' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">Recruiter Plan</CardTitle>
              <CardDescription>For hiring professionals</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Unlimited job postings</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>AI candidate matching</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Resume database access</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Priority support</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={subscriptionStatus?.type === 'recruiter' ? "secondary" : "default"}
                onClick={() => handleUpgrade("recruiter")}
                disabled={subscriptionStatus?.type === 'recruiter' || loading}
              >
                {loading && subscriptionStatus?.type !== 'recruiter' ? "Upgrading..." : (subscriptionStatus?.type === 'recruiter' ? "Current Plan" : "Upgrade to Recruiter")}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default Upgrade;
