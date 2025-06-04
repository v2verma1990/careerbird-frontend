
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Code, Sparkles } from "lucide-react";

const Credits = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Credits & Acknowledgments</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're grateful to the amazing tools, libraries, and people that make our platform possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• React & TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Shadcn/ui Components</li>
                <li>• Supabase Backend</li>
                <li>• Lucide React Icons</li>
                <li>• Vite Build Tool</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>AI & APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• OpenAI GPT Models</li>
                <li>• Natural Language Processing</li>
                <li>• Machine Learning Algorithms</li>
                <li>• Career Data APIs</li>
                <li>• Salary Information Sources</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Heart className="w-12 h-12 text-red-600 mb-4" />
              <CardTitle>Special Thanks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Our beta testers</li>
                <li>• Career coaching experts</li>
                <li>• HR professionals</li>
                <li>• Open source community</li>
                <li>• Our amazing users</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
            <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Built with ❤️</h2>
            <p className="text-gray-600 leading-relaxed">
              ResumeAI is built with passion by a team dedicated to helping people advance their careers. 
              We believe everyone deserves access to powerful tools that can help them succeed in their professional journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
