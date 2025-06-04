
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Award, Globe } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ResumeAI</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionizing recruitment and career advancement with AI-powered solutions that connect talent with opportunity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">To democratize access to career opportunities through intelligent technology.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">A diverse group of AI experts, career counselors, and industry professionals.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Integrity, innovation, and inclusivity in everything we do.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Globe className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Global Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Serving professionals and recruiters in over 50 countries worldwide.</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="text-lg mb-6">
              Founded in 2023, ResumeAI emerged from a simple observation: the job market was broken. 
              Talented candidates struggled to showcase their skills effectively, while recruiters 
              drowned in an ocean of resumes, unable to identify the best fits efficiently.
            </p>
            <p className="text-lg mb-6">
              Our founders, a team of former recruiters and AI researchers, decided to bridge this gap 
              using cutting-edge artificial intelligence. What started as a resume optimization tool 
              has evolved into a comprehensive platform that transforms how people find jobs and how 
              companies find talent.
            </p>
            <p className="text-lg">
              Today, we're proud to serve thousands of job seekers and hundreds of companies, 
              helping them make better, faster, and more informed decisions in their hiring journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
