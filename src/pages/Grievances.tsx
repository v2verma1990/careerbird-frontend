
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, FileText, CheckCircle } from "lucide-react";

const Grievances = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Grievances & Complaints</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We take all concerns seriously. Submit your grievance and our team will investigate and respond promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Submit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">File your complaint with detailed information</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">We review and investigate within 2-3 business days</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Resolve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Receive resolution and follow-up within 7 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Grievance Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Submit Grievance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <Input placeholder="John" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <Input placeholder="Doe" required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <Input type="email" placeholder="john.doe@example.com" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input type="tel" placeholder="+1 (555) 123-4567" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grievance Category *</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billing">Billing Issue</SelectItem>
                    <SelectItem value="service">Service Quality</SelectItem>
                    <SelectItem value="technical">Technical Problem</SelectItem>
                    <SelectItem value="privacy">Privacy Concern</SelectItem>
                    <SelectItem value="discrimination">Discrimination</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Incident Date</label>
                <Input type="date" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detailed Description *</label>
                <Textarea 
                  placeholder="Please provide a detailed description of your grievance, including any relevant dates, names, and circumstances..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Desired Resolution</label>
                <Textarea 
                  placeholder="What would you like us to do to resolve this issue?"
                  rows={3}
                />
              </div>

              <Button className="w-full" size="lg">Submit Grievance</Button>
              
              <p className="text-xs text-gray-500">
                * Required fields. All grievances are treated confidentially and will be investigated thoroughly.
              </p>
            </CardContent>
          </Card>

          {/* Information Panel */}
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Our Commitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  We are committed to addressing all grievances fairly, promptly, and confidentially. 
                  Every complaint is taken seriously and investigated thoroughly by our dedicated team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Acknowledgment</p>
                    <p className="text-sm text-gray-600">You'll receive confirmation within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Investigation</p>
                    <p className="text-sm text-gray-600">We'll investigate your concern thoroughly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Resolution</p>
                    <p className="text-sm text-gray-600">You'll receive a detailed response and resolution plan</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Follow-up</p>
                    <p className="text-sm text-gray-600">We'll ensure the resolution meets your satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alternative Contact Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Email:</strong> grievances@resumeai.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567 (Mon-Fri, 9 AM - 6 PM PST)</p>
                <p><strong>Mail:</strong> Grievance Department<br />123 Innovation Drive<br />San Francisco, CA 94105</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800">Anonymous Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 text-sm">
                  If you prefer to remain anonymous, you can submit your grievance without providing personal information. 
                  However, this may limit our ability to follow up with you directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grievances;
