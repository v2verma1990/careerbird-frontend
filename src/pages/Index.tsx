import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Star, Zap, Users, Download, Eye, Target, Brain, BarChart3, MessageSquare, CheckCircle, UserCheck, TrendingUp, FileSearch, Award, Briefcase, Facebook, Twitter, Linkedin, Instagram, Youtube, Phone, Mail, MapPin, Clock, Sparkles, Rocket, Bot, Search, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [activePlanType, setActivePlanType] = useState<'candidate' | 'recruiter'>('candidate');
  
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

  // Smooth scroll to dual platform section
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('dual-platform');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smooth scroll to upcoming features section
  const scrollToUpcomingFeatures = () => {
    const upcomingSection = document.getElementById('upcoming-features');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Show loading indicator while checking auth state
  if (restoringSession) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-8 border border-blue-200">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Career Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-6">
              Your Complete{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Career Toolkit
              </span>
            </h1>
            
            <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From AI-powered resume optimization to intelligent candidate matching - everything you need to succeed in your career journey.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/resume-optimizer">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl rounded-full transition-all duration-300 transform hover:scale-105">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-10 py-6 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full transition-all duration-300"
                onClick={scrollToFeatures}
              >
                <Eye className="mr-2 w-5 h-5" />
                Explore Features
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-gray-600 mt-1">Resumes Optimized</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">15K+</div>
                <div className="text-gray-600 mt-1">Candidates Matched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">95%</div>
                <div className="text-gray-600 mt-1">ATS Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4.9★</div>
                <div className="text-gray-600 mt-1">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Platform Section */}
      <div id="dual-platform" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for{" "}
              <span className="text-blue-600">Everyone</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're advancing your career or finding the perfect talent, our AI-powered platform has you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Candidates Section */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100">
                {/* Candidate Image */}
                <div className="mb-8">
                  <img 
                    src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=300&fit=crop&crop=center" 
                    alt="Professional candidate working on laptop" 
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-4">For Candidates</h3>
                </div>
                <p className="text-gray-600 mb-8">Optimize your career potential with AI-powered tools</p>
                
                <div className="space-y-4">
                  {candidateFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900">{feature.title}</span>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to="/resume-optimizer" className="block mt-8">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3">
                    Start Optimizing
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recruiters Section */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border border-purple-100">
                {/* Recruiter Image */}
                <div className="mb-8">
                  <img 
                    src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=300&fit=crop&crop=center" 
                    alt="Recruiting team analyzing candidates" 
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-4">For Recruiters</h3>
                </div>
                <p className="text-gray-600 mb-8">Find and evaluate top talent with intelligent matching</p>
                
                <div className="space-y-4">
                  {recruiterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900">{feature.title}</span>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to="/signup" className="block mt-8">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3">
                    Start Recruiting
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by{" "}
              <span className="text-indigo-600">AI Intelligence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI algorithms analyze, optimize, and match with precision to give you the competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: Upcoming Features Section */}
      <div id="upcoming-features" className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Coming Soon
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Exciting Features{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                On The Way
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're constantly innovating to bring you the most advanced career tools. Here's what's coming next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-black" />
                  </div>
                  <div className="flex items-center mb-3">
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <div className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      {feature.status}
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">{feature.description}</p>
                  <div className="flex items-center text-yellow-400 text-sm font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    Expected: {feature.eta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 rounded-full font-bold transition-all duration-300 transform hover:scale-105">
              <Star className="mr-2 w-5 h-5" />
              Get Early Access
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Plans Preview */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{" "}
              <span className="text-green-600">Plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a job seeker or recruiter, we have the perfect plan for your needs.
            </p>
          </div>

          {/* Plan Type Selector */}
          <div className="flex justify-center mb-16">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button 
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activePlanType === 'candidate' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => setActivePlanType('candidate')}
              >
                Job Seeker Plans
              </button>
              <button 
                className={`px-6 py-3 rounded-md font-medium ml-1 transition-all duration-300 ${
                  activePlanType === 'recruiter' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
                onClick={() => setActivePlanType('recruiter')}
              >
                Recruiter Plans
              </button>
            </div>
          </div>

          {/* Candidate Plans */}
          <div className={`transition-all duration-500 ${activePlanType === 'candidate' ? 'block' : 'hidden'}`}>
            <h3 className="text-3xl font-bold text-center mb-12 text-blue-900">For Job Seekers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {candidatePlans.map((plan, index) => (
                <div key={index} className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-blue-500 bg-blue-50 transform scale-105' : 'border-gray-200 bg-white'} transition-all duration-300 hover:shadow-xl`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">Most Popular</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-6">
                      {plan.price}
                      <span className="text-lg text-gray-500">/month</span>
                    </div>
                    <p className="text-gray-600 mb-8">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link to="/signup?type=candidate">
                      <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-xl py-3`}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Plans */}
          <div className={`transition-all duration-500 ${activePlanType === 'recruiter' ? 'block' : 'hidden'}`}>
            <h3 className="text-3xl font-bold text-center mb-12 text-purple-900">For Recruiters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recruiterPlans.map((plan, index) => (
                <div key={index} className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-purple-500 bg-purple-50 transform scale-105' : 'border-gray-200 bg-white'} transition-all duration-300 hover:shadow-xl`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">Most Popular</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-6">
                      {plan.price}
                      <span className="text-lg text-gray-500">/month</span>
                    </div>
                    <p className="text-gray-600 mb-8">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link to="/signup?type=recruiter">
                      <Button className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-xl py-3`}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who have accelerated their careers with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/signup">
              <Button size="lg" className="px-10 py-6 text-lg bg-white text-blue-600 hover:bg-gray-100 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/resume-optimizer">
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-full transition-all duration-300">
                <Eye className="mr-2 w-5 h-5" />
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">ResumeAI</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering careers with AI-powered tools for resume optimization, candidate matching, and career advancement.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Visit our Facebook page">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Visit our Twitter page">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Visit our LinkedIn page">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Visit our Instagram page">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Visit our YouTube channel">
                  <Youtube className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link to="/services/resume-builder" className="text-gray-400 hover:text-white transition-colors">Resume Builder</Link></li>
                <li><Link to="/services/ats-optimization" className="text-gray-400 hover:text-white transition-colors">ATS Optimization</Link></li>
                <li><Link to="/services/cover-letters" className="text-gray-400 hover:text-white transition-colors">Cover Letters</Link></li>
                <li><Link to="/services/interview-prep" className="text-gray-400 hover:text-white transition-colors">Interview Prep</Link></li>
                <li><Link to="/services/recruiting-tools" className="text-gray-400 hover:text-white transition-colors">Recruiting Tools</Link></li>
                <li><Link to="/employer-home" className="text-gray-400 hover:text-white transition-colors">Employer Home</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/help-center" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors">Sitemap</Link></li>
                <li><Link to="/credits" className="text-gray-400 hover:text-white transition-colors">Credits</Link></li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal & Support</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/fraud-alert" className="text-gray-400 hover:text-white transition-colors">Fraud Alert</Link></li>
                <li><Link to="/trust-safety" className="text-gray-400 hover:text-white transition-colors">Trust & Safety</Link></li>
                <li><Link to="/summons-notices" className="text-gray-400 hover:text-white transition-colors">Summons/Notices</Link></li>
                <li><Link to="/grievances" className="text-gray-400 hover:text-white transition-colors">Grievances</Link></li>
                <li><Link to="/report-issue" className="text-gray-400 hover:text-white transition-colors">Report Issue</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-blue-400 mr-3" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-400 mr-3" />
                <span className="text-gray-400">support@resumeai.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-blue-400 mr-3" />
                <span className="text-gray-400">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 ResumeAI. All rights reserved. | Built with ❤️ for career success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const candidateFeatures = [
  {
    title: "ATS Optimization Score",
    description: "Real-time scoring to beat applicant tracking systems"
  },
  {
    title: "Resume Enhancement",
    description: "AI-powered suggestions for content and formatting"
  },
  {
    title: "Job Description Matching",
    description: "Tailor your resume to specific job requirements"
  },
  {
    title: "Cover Letter Generation",
    description: "Create compelling cover letters instantly"
  },
  {
    title: "Interview Preparation",
    description: "Practice with AI-generated questions and feedback"
  },
  {
    title: "Resume Builder",
    description: "Professional templates with smart recommendations"
  }
];

const recruiterFeatures = [
  {
    title: "Multi-Resume Analysis",
    description: "Upload and analyze multiple resumes simultaneously"
  },
  {
    title: "AI-Powered Matching",
    description: "Intelligent candidate-to-job matching algorithms"
  },
  {
    title: "Skill Gap Analysis",
    description: "Identify missing skills and competencies"
  },
  {
    title: "Automated Feedback",
    description: "Generate detailed candidate assessments"
  },
  {
    title: "Detailed Reports",
    description: "Export comprehensive evaluation reports"
  },
  {
    title: "Candidate Comparison",
    description: "Side-by-side candidate comparison tools"
  }
];

const coreFeatures = [
  {
    icon: Target,
    title: "Smart Optimization",
    description: "Our AI analyzes thousands of job postings to optimize your resume for maximum impact and ATS compatibility."
  },
  {
    icon: Brain,
    title: "Intelligent Matching",
    description: "Advanced algorithms match candidates with opportunities based on skills, experience, and cultural fit."
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your progress with detailed analytics and insights to continuously improve your career strategy."
  }
];

// NEW: Upcoming features data
const upcomingFeatures = [
  {
    icon: Bot,
    title: "AI Career Coach",
    description: "Personal AI assistant providing 24/7 career guidance, interview prep, and professional development advice.",
    status: "Beta",
    eta: "Q2 2024"
  },
  {
    icon: Search,
    title: "Smart Job Matching",
    description: "AI-powered job recommendations based on your skills, preferences, and career goals.",
    status: "Soon",
    eta: "Q3 2024"
  },
  {
    icon: Shield,
    title: "Privacy Shield",
    description: "Enhanced privacy controls and anonymous job searching to protect your career moves.",
    status: "Coming",
    eta: "Q4 2024"
  },
  {
    icon: Rocket,
    title: "Career Accelerator",
    description: "Personalized learning paths and skill development plans to fast-track your career growth.",
    status: "Planning",
    eta: "2025"
  },
  {
    icon: MessageSquare,
    title: "AI Interview Simulator",
    description: "Realistic interview practice with AI-powered feedback and improvement suggestions.",
    status: "Beta",
    eta: "Q2 2024"
  },
  {
    icon: TrendingUp,
    title: "Market Analytics",
    description: "Real-time job market insights, salary trends, and industry demand forecasting.",
    status: "Coming",
    eta: "Q3 2024"
  }
];

const candidatePlans = [
  {
    name: "Free",
    price: "$0",
    description: "Essential tools to get started",
    features: [
      "Basic resume builder",
      "3 ATS scans per month",
      "Basic job matching",
      "Standard templates",
      "Community support"
    ],
    popular: false
  },
  {
    name: "Basic",
    price: "$9",
    description: "Enhanced features for job seekers",
    features: [
      "Advanced resume optimization",
      "Unlimited ATS scans",
      "Cover letter generator",
      "Priority support",
      "Premium templates",
      "Interview prep tools"
    ],
    popular: true
  },
  {
    name: "Premium",
    price: "$29",
    description: "Complete career transformation suite",
    features: [
      "All Basic features",
      "AI interview preparation",
      "Advanced analytics",
      "Salary insights",
      "Custom branding",
      "1-on-1 career coaching"
    ],
    popular: false
  }
];

const recruiterPlans = [
  {
    name: "Starter",
    price: "$49",
    description: "Perfect for small teams",
    features: [
      "Up to 50 candidate profiles",
      "Basic AI matching",
      "Standard reporting",
      "Email support",
      "Job posting optimization"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$99",
    description: "Advanced recruiting tools",
    features: [
      "Up to 200 candidate profiles",
      "Advanced AI matching",
      "Detailed analytics",
      "Priority support",
      "Bulk resume analysis",
      "Interview question generator"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$199",
    description: "Full-scale recruiting solution",
    features: [
      "Unlimited candidate profiles",
      "Custom AI models",
      "Advanced reporting & analytics",
      "Dedicated account manager",
      "API access",
      "Custom integrations"
    ],
    popular: false
  }
];

export default Index;
