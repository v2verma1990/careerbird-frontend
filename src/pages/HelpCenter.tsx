
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Book, MessageCircle, Video, Download } from "lucide-react";

const HelpCenter = () => {
  const categories = [
    {
      title: "Getting Started",
      icon: Book,
      articles: [
        "How to create your first resume",
        "Setting up your account",
        "Understanding ATS optimization",
        "Choosing the right plan"
      ]
    },
    {
      title: "Resume Optimization",
      icon: Search,
      articles: [
        "ATS score explanation",
        "Keyword optimization tips",
        "Formatting best practices",
        "Industry-specific guidelines"
      ]
    },
    {
      title: "Recruiter Tools",
      icon: MessageCircle,
      articles: [
        "Uploading candidate resumes",
        "Using AI matching features",
        "Generating comparison reports",
        "Exporting candidate data"
      ]
    },
    {
      title: "Video Tutorials",
      icon: Video,
      articles: [
        "Platform overview walkthrough",
        "Resume optimization demo",
        "Recruiter dashboard tour",
        "Advanced features guide"
      ]
    }
  ];

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
            />
            <Button className="absolute right-2 top-2">Search</Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-gray-600 text-sm">Get help from our support team</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Video className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Watch Tutorials</h3>
              <p className="text-gray-600 text-sm">Learn with step-by-step videos</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Download className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Download Guides</h3>
              <p className="text-gray-600 text-sm">Get comprehensive PDF guides</p>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <div key={articleIndex} className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
                      <span className="text-sm">• {article}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Articles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How ATS Scoring Works</h3>
                <p className="text-gray-600 text-sm mb-4">Understand how we calculate your resume's ATS compatibility score.</p>
                <span className="text-blue-600 text-sm font-medium">Read more →</span>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Resume Optimization Tips</h3>
                <p className="text-gray-600 text-sm mb-4">Best practices for creating ATS-friendly resumes that get noticed.</p>
                <span className="text-blue-600 text-sm font-medium">Read more →</span>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Troubleshooting Upload Issues</h3>
                <p className="text-gray-600 text-sm mb-4">Solutions for common problems when uploading resume files.</p>
                <span className="text-blue-600 text-sm font-medium">Read more →</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
