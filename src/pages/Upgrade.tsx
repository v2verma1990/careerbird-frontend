
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import TopNavigation from '@/components/TopNavigation';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Brain,
  Rocket
} from 'lucide-react';

const Upgrade = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  // Function to handle back button click
  const handleBackClick = () => {
    // Check if we have a return path in the location state
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    
    if (!user) {
      navigate('/');
      return;
    }
    
    // Navigate to the appropriate dashboard based on user type and subscription
    const userType = user.user_metadata?.userType || 'candidate';
    if (userType === 'recruiter') {
      navigate('/recruiter-dashboard');
    } else {
      // For candidates, check subscription type
      if (subscriptionStatus?.type === 'free') {
        navigate('/free-plan-dashboard');
      } else if (subscriptionStatus?.type === 'basic') {
        navigate('/candidate-dashboard');
      } else {
        navigate('/candidate-dashboard');
      }
    }
  };

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started',
      features: [
        'Basic resume builder',
        'ATS compatibility check',
        '3 resume downloads per month',
        'Basic templates',
        'Email support'
      ],
      limitations: [
        'Limited monthly usage',
        'Basic templates only',
        'No premium features'
      ],
      current: subscriptionStatus?.type === 'free',
      popular: false,
      color: 'from-gray-500 to-gray-600',
      icon: Shield
    },
    {
      name: 'Basic',
      price: { monthly: 9.99, annual: 99.99 },
      description: 'Great for active job seekers',
      features: [
        'Everything in Free',
        'Advanced resume builder',
        'Unlimited downloads',
        'Premium templates',
        'Cover letter generator',
        'Priority email support',
        'Resume optimization tips'
      ],
      limitations: [
        'Limited AI features',
        'No salary insights'
      ],
      current: subscriptionStatus?.type === 'basic',
      popular: false,
      color: 'from-blue-500 to-cyan-500',
      icon: Zap
    },
    {
      name: 'Premium',
      price: { monthly: 19.99, annual: 199.99 },
      description: 'Everything you need to excel',
      features: [
        'Everything in Basic',
        'Unlimited AI features',
        'Resume visible to recruiters for 6 months*',
        'Salary insights & analytics',
        'Interview question generator',
        'Personal career coach',
        'Custom branding',
        'Advanced analytics',
        'Priority phone support',
        'Early access to new features'
      ],
      limitations: [],
      current: subscriptionStatus?.type === 'premium',
      popular: true,
      color: 'from-purple-500 to-pink-500',
      icon: Crown
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Optimization',
      description: 'Advanced algorithms analyze your resume and provide personalized suggestions'
    },
    {
      icon: Target,
      title: 'ATS Compatibility',
      description: 'Ensure your resume passes through Applicant Tracking Systems'
    },
    {
      icon: BarChart3,
      title: 'Market Insights',
      description: 'Get salary data and industry trends for informed career decisions'
    },
    {
      icon: Users,
      title: 'Interview Preparation',
      description: 'Practice with AI-generated questions tailored to your role'
    }
  ];

  const handleUpgrade = (planName: string) => {
    console.log(`Upgrading to ${planName} plan`);
    // Handle subscription upgrade logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <TopNavigation />
      
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBackClick}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Subscription Plans</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Unlock Your Career Potential
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your 
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Success </span>
            Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of professionals who've accelerated their careers with our AI-powered platform. 
            Get the tools you need to stand out in today's competitive job market.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full transition-all duration-200 ${
                billingCycle === 'monthly' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-full transition-all duration-200 relative ${
                billingCycle === 'annual' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const monthlyPrice = plan.price[billingCycle];
            const savings = billingCycle === 'annual' ? Math.round(((plan.price.monthly * 12) - plan.price.annual) * 100) / 100 : 0;
            
            return (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${
                  plan.popular ? 'ring-2 ring-purple-500 shadow-xl scale-105' : 'hover:shadow-xl'
                } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
                    <Star className="w-4 h-4 inline mr-1" />
                    Most Popular
                  </div>
                )}
                
                {plan.current && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium">
                    <Check className="w-4 h-4 inline mr-1" />
                    Current Plan
                  </div>
                )}

                <CardHeader className={`${plan.popular || plan.current ? 'pt-12' : 'pt-6'} pb-2`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${monthlyPrice.toFixed(0)}
                      </span>
                      <span className="text-gray-600">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                    </div>
                    {savings > 0 && (
                      <div className="text-green-600 text-sm font-medium mt-1">
                        Save ${savings.toFixed(0)} per year
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center gap-3 text-sm opacity-60">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full h-12 text-base font-medium transition-all duration-200 ${
                      plan.current 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : plan.popular
                          ? `bg-gradient-to-r ${plan.color} hover:shadow-lg transform hover:scale-105 text-white`
                          : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => !plan.current && handleUpgrade(plan.name)}
                    disabled={plan.current}
                  >
                    {plan.current ? (
                      'Current Plan'
                    ) : plan.name === 'Free' ? (
                      'Get Started Free'
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Upgrade to {plan.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ResumeAI?</h2>
          <p className="text-xl text-gray-600 mb-12">Powerful features designed to accelerate your career success</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by 50,000+ Professionals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Software Engineer', quote: 'Landed my dream job in just 2 weeks!' },
              { name: 'Michael Chen', role: 'Marketing Manager', quote: 'The AI suggestions were incredibly helpful.' },
              { name: 'Emily Davis', role: 'Product Designer', quote: 'Best investment in my career growth.' }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-blue-200">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' },
              { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' }
            ].map((faq, index) => (
              <Card key={index} className="text-left">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resume Visibility Feature Note */}
        <div className="max-w-4xl mx-auto mt-16 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                🎯 Premium Benefit: Extended Resume Visibility
              </h3>
              <p className="text-purple-800 mb-3">
                <strong>*Resume Visibility Guarantee:</strong> Once you enable resume visibility with Premium, 
                your resume stays visible to recruiters for <strong>6 full months</strong> - even if you downgrade your subscription!
              </p>
              <div className="bg-white/50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">How it works:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• <strong>Enable once with Premium</strong> → Resume visible for 6 months</li>
                  <li>• <strong>Update your resume anytime</strong> → Extends visibility for another 6 months</li>
                  <li>• <strong>No subscription required</strong> → Visibility continues even on Free plan</li>
                  <li>• <strong>Upgrade again later</strong> → Instantly extends your visibility period</li>
                </ul>
              </div>
              <p className="text-sm text-purple-700 mt-3 italic">
                This gives you confidence to try Premium knowing your investment in visibility continues long-term!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
