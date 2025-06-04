
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Clock } from "lucide-react";

const HelpSearch = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const allArticles = [
    { title: "How ATS Scoring Works", description: "Understand how we calculate your resume's ATS compatibility score", category: "Resume Optimization", readTime: "5 min", link: "/help/ats-score" },
    { title: "Resume Optimization Tips", description: "Best practices for creating ATS-friendly resumes", category: "Resume Optimization", readTime: "8 min", link: "/help/keyword-optimization" },
    { title: "Troubleshooting Upload Issues", description: "Solutions for common problems when uploading resume files", category: "Getting Started", readTime: "3 min", link: "/help/upload-troubleshooting" },
    { title: "Setting up your account", description: "Complete guide to getting started with your account", category: "Getting Started", readTime: "4 min", link: "/help/setup-account" },
    { title: "Understanding Different Resume Formats", description: "Learn about chronological, functional, and combination formats", category: "Resume Optimization", readTime: "6 min", link: "/help/resume-formats" },
    { title: "Cover Letter Best Practices", description: "How to write compelling cover letters", category: "Cover Letters", readTime: "7 min", link: "/help/cover-letter-tips" },
    { title: "Interview Preparation Guide", description: "Comprehensive guide to preparing for interviews", category: "Interview Prep", readTime: "10 min", link: "/help/interview-prep" },
    { title: "Keyword Optimization Guide", description: "How to optimize your resume with the right keywords", category: "Resume Optimization", readTime: "6 min", link: "/help/keyword-optimization" },
    { title: "Using AI Matching Features", description: "Guide to recruiter AI matching tools", category: "Recruiter Tools", readTime: "5 min", link: "/help/ai-matching" },
    { title: "Choosing the Right Plan", description: "Compare plans and find the best fit for your needs", category: "Getting Started", readTime: "4 min", link: "/help/choosing-plan" },
  ];

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = allArticles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase()) ||
      article.category.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/help-center" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Help Articles</h1>
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

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {searchResults.length > 0 
                ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : `No results found for "${searchQuery}"`
              }
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((article, index) => (
                  <Link key={index} to={article.link}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {article.category}
                          </span>
                          <div className="flex items-center text-gray-500 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {article.readTime}
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                        <span className="text-blue-600 text-sm font-medium">Read more →</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-4">Try searching with different keywords or browse our categories.</p>
                  <Link to="/help-center">
                    <Button>Browse Help Categories</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Popular Searches */}
        {!searchQuery && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Popular Searches</h2>
            <div className="flex flex-wrap gap-3 mb-8">
              {['ATS Score', 'Resume Upload', 'Account Setup', 'Keyword Optimization', 'Cover Letter', 'Interview Prep'].map((term) => (
                <Button 
                  key={term}
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery(term);
                    performSearch(term);
                  }}
                >
                  {term}
                </Button>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-6">All Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((article, index) => (
                <Link key={index} to={article.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {article.category}
                        </span>
                        <div className="flex items-center text-gray-500 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {article.readTime}
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2">{article.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                      <span className="text-blue-600 text-sm font-medium">Read more →</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSearch;
