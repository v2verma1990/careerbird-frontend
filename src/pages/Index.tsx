import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, FileText, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect authenticated users to their dashboard
  useEffect(() => {
    console.log("Index page - Auth state:", { 
      user: !!user, 
      userType, 
      subscriptionType: subscriptionStatus?.type,
      restoringSession 
    });
    
    // Only redirect after session restoration is complete
    if (restoringSession) {
      console.log("Session is still being restored, waiting...");
      return;
    }
    
    // Only redirect if we have a user and all required data
    if (user && userType && subscriptionStatus && !isRedirecting) {
      console.log("User is authenticated, redirecting to dashboard");
      setIsRedirecting(true);
      
      // User is authenticated, redirect to appropriate dashboard
      if (userType === 'recruiter') {
        console.log("Redirecting recruiter to /dashboard");
        navigate('/dashboard', { replace: true });
      } else if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          console.log("Redirecting free candidate to /free-plan-dashboard");
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          console.log("Redirecting paid candidate to /candidate-dashboard");
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        console.log("User type unknown, defaulting to candidate dashboard");
        navigate('/candidate-dashboard', { replace: true });
      }
    }
  }, [user, userType, subscriptionStatus, restoringSession, navigate, isRedirecting]);
  
  // Show loading indicator while checking auth state
  if (restoringSession) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Show loading indicator while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              Your Career Success <span className="text-blue-600">Starts Here</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered resume analysis for recruiters and job seekers. Find the perfect match or optimize your career journey.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup?type=recruiter">
                <Button size="lg" className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg">I'm a Recruiter</Button>
              </Link>
              <Link to="/signup?type=candidate">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-blue-600 text-blue-600 hover:bg-blue-50">I'm a Candidate</Button>
              </Link>
            </div>
            <div className="mt-8 flex justify-center gap-8">
              <img src="/public/placeholder.svg" alt="Trusted by 1000+ users" className="h-12" />
              <span className="text-gray-500 text-lg">Trusted by 1000+ professionals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Solutions for Everyone</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Recruiter Features */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Search className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold">For Recruiters</h3>
              </div>
              <ul className="space-y-3">
                {recruiterFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Candidate Features */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold">For Candidates</h3>
              </div>
              <ul className="space-y-3">
                {candidateFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section - Enterprise-level comparison */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Plans & Pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Choose the plan that fits your needs. Upgrade for advanced features and enterprise support.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Recruiter Pricing Table */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-blue-700">Recruiter Plans</h3>
              <table className="min-w-full bg-white rounded-lg shadow-lg mb-6">
                <thead>
                  <tr>
                    <th className="py-4 px-6 text-left text-lg font-semibold">Feature</th>
                    <th className="py-4 px-6 text-center font-semibold">Free</th>
                    <th className="py-4 px-6 text-center font-semibold">Basic</th>
                    <th className="py-4 px-6 text-center font-semibold">Pro</th>
                    <th className="py-4 px-6 text-center font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-3 px-6">Resume Uploads</td><td className="text-center">1</td><td className="text-center">50/mo</td><td className="text-center">Unlimited</td><td className="text-center">Unlimited</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">AI Candidate Matching</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Skill Gap Analysis</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Bulk Resume Upload</td><td className="text-center">-</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Team Collaboration</td><td className="text-center">-</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Support</td><td className="text-center">Email</td><td className="text-center">Priority</td><td className="text-center">24/7</td><td className="text-center">Dedicated Manager</td></tr>
                </tbody>
              </table>
              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Free</div>
                  <div className="text-3xl font-extrabold mb-2">$0</div>
                  <div className="text-gray-500 mb-4">forever</div>
                  <Button className="w-full" variant="outline">Get Started</Button>
                </div>
                <div className="flex-1 bg-blue-100 rounded-lg p-6 text-center border-2 border-blue-600 shadow-lg">
                  <div className="text-lg font-bold text-blue-800 mb-2">Basic</div>
                  <div className="text-3xl font-extrabold mb-2">$19</div>
                  <div className="text-gray-500 mb-4">/month</div>
                  <Button className="w-full bg-blue-600 text-white">Start Trial</Button>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Pro</div>
                  <div className="text-3xl font-extrabold mb-2">$49</div>
                  <div className="text-gray-500 mb-4">/month</div>
                  <Button className="w-full" variant="outline">Upgrade to Pro</Button>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Enterprise</div>
                  <div className="text-3xl font-extrabold mb-2">Custom</div>
                  <div className="text-gray-500 mb-4">Contact Us</div>
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </div>
              </div>
            </div>
            {/* Candidate Pricing Table */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-blue-700">Candidate Plans</h3>
              <table className="min-w-full bg-white rounded-lg shadow-lg mb-6">
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
                  <tr className="border-t"><td className="py-3 px-6">Resume Uploads</td><td className="text-center">1</td><td className="text-center">10/mo</td><td className="text-center">Unlimited</td><td className="text-center">Unlimited</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">ATS Analysis</td><td className="text-center">Basic</td><td className="text-center">Advanced</td><td className="text-center">Premium</td><td className="text-center">Custom</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">AI Resume Customization</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Cover Letter Generation</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Interview Prep Tools</td><td className="text-center">-</td><td className="text-center">-</td><td className="text-center">✓</td><td className="text-center">✓</td></tr>
                  <tr className="border-t"><td className="py-3 px-6">Support</td><td className="text-center">Email</td><td className="text-center">Priority</td><td className="text-center">24/7</td><td className="text-center">Dedicated Manager</td></tr>
                </tbody>
              </table>
              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Free</div>
                  <div className="text-3xl font-extrabold mb-2">$0</div>
                  <div className="text-gray-500 mb-4">forever</div>
                  <Button className="w-full" variant="outline">Get Started</Button>
                </div>
                <div className="flex-1 bg-blue-100 rounded-lg p-6 text-center border-2 border-blue-600 shadow-lg">
                  <div className="text-lg font-bold text-blue-800 mb-2">Basic</div>
                  <div className="text-3xl font-extrabold mb-2">$9.99</div>
                  <div className="text-gray-500 mb-4">/month</div>
                  <Button className="w-full bg-blue-600 text-white">Upgrade</Button>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Premium</div>
                  <div className="text-3xl font-extrabold mb-2">$19.99</div>
                  <div className="text-gray-500 mb-4">/month</div>
                  <Button className="w-full" variant="outline">Upgrade to Premium</Button>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-lg font-bold text-blue-700 mb-2">Enterprise</div>
                  <div className="text-3xl font-extrabold mb-2">Custom</div>
                  <div className="text-gray-500 mb-4">Contact Us</div>
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const recruiterFeatures = [
  "Upload and analyze multiple resumes",
  "AI-powered candidate matching",
  "Skill gap analysis",
  "Automated feedback generation",
  "Export detailed reports"
];

const candidateFeatures = [
  "ATS optimization score",
  "Resume enhancement suggestions",
  "Job description matching",
  "Cover letter generation",
  "Interview preparation tools"
];

export default Index;
