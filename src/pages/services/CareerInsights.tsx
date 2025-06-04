
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, MapPin, Award } from "lucide-react";

const CareerInsights = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Career Insights & Analytics</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed career decisions with comprehensive market data, salary insights, and trending skill analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Salary Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Access real-time salary information across industries and locations.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track job market trends and emerging opportunities in your field.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Skill Demand</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Identify in-demand skills and plan your professional development.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MapPin className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Location Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Compare opportunities across different cities and regions.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Link to="/salary-insights">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Career Insights
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Upcoming Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Career Path Mapping</h3>
              <p className="text-gray-600">Visualize potential career progressions and required skills.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Company Insights</h3>
              <p className="text-gray-600">Deep dive into company culture, benefits, and growth opportunities.</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-gray-600">Get AI-powered career recommendations based on your profile.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerInsights;
