
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Book, MessageCircle, Video, Download, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const categories = [
    {
      title: "Getting Started",
      icon: Book,
      articles: [
        { title: "How to create your first resume", link: "/help/create-first-resume" },
        { title: "Setting up your account", link: "/help/setup-account" },
        { title: "Understanding ATS optimization", link: "/help/ats-understanding" },
        { title: "Choosing the right plan", link: "/help/choosing-plan" }
      ]
    },
    {
      title: "Resume Optimization",
      icon: Search,
      articles: [
        { title: "ATS score explanation", link: "/help/ats-score" },
        { title: "Keyword optimization tips", link: "/help/keyword-optimization" },
        { title: "Formatting best practices", link: "/help/formatting-best-practices" },
        { title: "Industry-specific guidelines", link: "/help/industry-guidelines" }
      ]
    },
    {
      title: "Recruiter Tools",
      icon: MessageCircle,
      articles: [
        { title: "Uploading candidate resumes", link: "/help/uploading-resumes" },
        { title: "Using AI matching features", link: "/help/ai-matching" },
        { title: "Generating comparison reports", link: "/help/comparison-reports" },
        { title: "Exporting candidate data", link: "/help/exporting-data" }
      ]
    },
    {
      title: "Video Tutorials",
      icon: Video,
      articles: [
        { title: "Platform overview walkthrough", link: "/help/platform-overview" },
        { title: "Resume optimization demo", link: "/help/optimization-demo" },
        { title: "Recruiter dashboard tour", link: "/help/dashboard-tour" },
        { title: "Advanced features guide", link: "/help/advanced-features" }
      ]
    }
  ];

  const popularArticles = [
    {
      title: "How ATS Scoring Works",
      description: "Understand how we calculate your resume's ATS compatibility score and what factors influence it.",
      link: "/help/ats-score",
      readTime: "5 min read"
    },
    {
      title: "Resume Optimization Tips",
      description: "Best practices for creating ATS-friendly resumes that get noticed by both systems and recruiters.",
      link: "/help/keyword-optimization",
      readTime: "8 min read"
    },
    {
      title: "Troubleshooting Upload Issues",
      description: "Solutions for common problems when uploading resume files and how to resolve them quickly.",
      link: "/help/upload-troubleshooting",
      readTime: "3 min read"
    },
    {
      title: "Understanding Different Resume Formats",
      description: "Learn about chronological, functional, and combination resume formats and when to use each.",
      link: "/help/resume-formats",
      readTime: "6 min read"
    },
    {
      title: "Cover Letter Best Practices",
      description: "How to write compelling cover letters that complement your optimized resume.",
      link: "/help/cover-letter-tips",
      readTime: "7 min read"
    },
    {
      title: "Interview Preparation Guide",
      description: "Comprehensive guide to preparing for interviews after your resume gets you noticed.",
      link: "/help/interview-prep",
      readTime: "10 min read"
    }
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions and learn how to make the most of our platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              className="pl-10 py-6 text-lg" 
              placeholder="Search for help articles, tutorials, or guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button className="absolute right-2 top-2" onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/contact-us">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-gray-600 text-sm">Get help from our support team</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/help/video-tutorials">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Video className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Watch Tutorials</h3>
                <p className="text-gray-600 text-sm">Learn with step-by-step videos</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/help/download-guides">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Download className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Download Guides</h3>
                <p className="text-gray-600 text-sm">Get comprehensive PDF guides</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {categories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <category.icon className="w-6 h-6 mr-3 text-blue-600" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <Link 
                      key={articleIndex} 
                      to={article.link}
                      className="flex items-center justify-between text-gray-600 hover:text-blue-600 cursor-pointer transition-colors group"
                    >
                      <span className="text-sm">{article.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
                <Link to={`/help/category/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View All Articles
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArticles.map((article, index) => (
              <Link key={index} to={article.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 text-sm font-medium">Read more →</span>
                      <span className="text-xs text-gray-500">{article.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">How do I cancel my subscription?</h3>
              <p className="text-gray-600 text-sm">You can cancel your subscription anytime from your dashboard settings. Navigate to Settings {'>'}  Subscription {'>'} Cancel Plan.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-gray-600 text-sm">Yes, we use enterprise-grade security with AES-256 encryption to protect all user data and comply with GDPR standards.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 text-sm">We offer a 30-day money-back guarantee for all paid plans. Contact support for refund requests.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade my plan anytime?</h3>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What file formats do you support?</h3>
              <p className="text-gray-600 text-sm">We support PDF, DOC, and DOCX files up to 5MB in size for resume uploads and analysis.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How accurate is the ATS scoring?</h3>
              <p className="text-gray-600 text-sm">Our ATS scoring uses algorithms based on real ATS systems with 95%+ accuracy in predicting compatibility.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
