
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Home, User, Briefcase, FileText, Settings, HelpCircle } from "lucide-react";

const Sitemap = () => {
  const siteStructure = [
    {
      category: "Main Pages",
      icon: Home,
      links: [
        { name: "Home", url: "/" },
        { name: "About Us", url: "/about-us" },
        { name: "Contact Us", url: "/contact-us" },
        { name: "Careers", url: "/careers" },
      ]
    },
    {
      category: "Authentication",
      icon: User,
      links: [
        { name: "Login", url: "/login" },
        { name: "Sign Up", url: "/signup" },
      ]
    },
    {
      category: "Dashboards",
      icon: Settings,
      links: [
        { name: "Recruiter Dashboard", url: "/dashboard" },
        { name: "Candidate Dashboard", url: "/candidate-dashboard" },
        { name: "Free Plan Dashboard", url: "/free-plan-dashboard" },
      ]
    },
    {
      category: "Candidate Tools",
      icon: FileText,
      links: [
        { name: "Resume Optimizer", url: "/resume-optimizer" },
        { name: "Resume Customizer", url: "/resume-customizer" },
        { name: "ATS Scanner", url: "/ats-scanner" },
        { name: "Cover Letter Generator", url: "/cover-letter-generator" },
        { name: "Interview Questions", url: "/interview-questions" },
        { name: "Salary Insights", url: "/salary-insights" },
      ]
    },
    {
      category: "Recruiter Tools",
      icon: Briefcase,
      links: [
        { name: "Best Candidates", url: "/best-candidates" },
        { name: "Optimize Job", url: "/optimize-job" },
      ]
    },
    {
      category: "Services",
      icon: Settings,
      links: [
        { name: "Resume Builder", url: "/services/resume-builder" },
        { name: "ATS Optimization", url: "/services/ats-optimization" },
        { name: "Cover Letters", url: "/services/cover-letters" },
        { name: "Interview Prep", url: "/services/interview-prep" },
        { name: "Recruiting Tools", url: "/services/recruiting-tools" },
        { name: "Career Insights", url: "/services/career-insights" },
      ]
    },
    {
      category: "Support & Legal",
      icon: HelpCircle,
      links: [
        { name: "Help Center", url: "/help-center" },
        { name: "Privacy Policy", url: "/privacy-policy" },
        { name: "Terms & Conditions", url: "/terms-conditions" },
        { name: "Upgrade Plans", url: "/upgrade" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sitemap</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Navigate through all pages and features of our platform. Find exactly what you're looking for.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteStructure.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <section.icon className="w-6 h-6 mr-3 text-blue-600" />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      to={link.url}
                      className="block text-gray-600 hover:text-blue-600 transition-colors py-1 px-2 rounded hover:bg-blue-50"
                    >
                      • {link.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Link to="/" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Home className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <Link to="/candidate-dashboard" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <span className="text-sm font-medium">Candidate</span>
            </Link>
            <Link to="/dashboard" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <span className="text-sm font-medium">Recruiter</span>
            </Link>
            <Link to="/help-center" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <span className="text-sm font-medium">Help</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
