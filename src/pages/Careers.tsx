
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";

const Careers = () => {
  const jobOpenings = [
    {
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      salary: "$120k - $180k",
      description: "Join our engineering team to build the next generation of AI-powered recruitment tools."
    },
    {
      title: "AI/ML Engineer",
      department: "Data Science",
      location: "New York, NY / Remote",
      type: "Full-time",
      salary: "$140k - $200k",
      description: "Develop and optimize machine learning models for resume analysis and candidate matching."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Los Angeles, CA / Remote",
      type: "Full-time",
      salary: "$100k - $140k",
      description: "Create intuitive and beautiful user experiences for our platform."
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Austin, TX / Remote",
      type: "Full-time",
      salary: "$70k - $90k",
      description: "Help our customers achieve success with our platform and drive retention."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us revolutionize the future of work. We're looking for passionate individuals who want to make a real impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">Why Work With Us?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600">• Competitive salary and equity</p>
              <p className="text-gray-600">• Comprehensive health benefits</p>
              <p className="text-gray-600">• Flexible work arrangements</p>
              <p className="text-gray-600">• Professional development budget</p>
              <p className="text-gray-600">• Unlimited PTO policy</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">Our Culture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600">• Innovation-first mindset</p>
              <p className="text-gray-600">• Collaborative environment</p>
              <p className="text-gray-600">• Work-life balance</p>
              <p className="text-gray-600">• Continuous learning</p>
              <p className="text-gray-600">• Diversity and inclusion</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-center">Perks & Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600">• Stock options program</p>
              <p className="text-gray-600">• Modern office spaces</p>
              <p className="text-gray-600">• Catered meals</p>
              <p className="text-gray-600">• Gym membership</p>
              <p className="text-gray-600">• Team retreats</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Open Positions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobOpenings.map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <Badge variant="secondary">{job.department}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {job.type}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.salary}
                    </div>
                  </div>
                  <Button className="w-full">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg text-center">
          <h3 className="text-2xl font-bold mb-4">Don't See Your Perfect Role?</h3>
          <p className="text-gray-600 mb-6">
            We're always looking for exceptional talent. Send us your resume and let us know how you'd like to contribute.
          </p>
          <Button size="lg">Send Us Your Resume</Button>
        </div>
      </div>
    </div>
  );
};

export default Careers;
