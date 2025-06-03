
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bug, Shield, Zap } from "lucide-react";
import { useState } from "react";

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: '',
    severity: 'medium',
    subject: '',
    description: '',
    steps: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual issue submission
    console.log('Issue reported:', formData);
    alert('Thank you for reporting this issue. Our team will investigate and respond as soon as possible.');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Report an Issue</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us improve by reporting bugs, security issues, or other problems you've encountered.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Issue Report Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="For follow-up (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issueType">Issue Type *</Label>
                      <select
                        id="issueType"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.issueType}
                        onChange={(e) => handleInputChange('issueType', e.target.value)}
                        required
                      >
                        <option value="">Select issue type</option>
                        <option value="bug">Bug/Error</option>
                        <option value="security">Security Vulnerability</option>
                        <option value="performance">Performance Issue</option>
                        <option value="ui">User Interface Problem</option>
                        <option value="feature">Feature Request</option>
                        <option value="data">Data Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity Level</Label>
                      <select
                        id="severity"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.severity}
                        onChange={(e) => handleInputChange('severity', e.target.value)}
                      >
                        <option value="low">Low - Minor inconvenience</option>
                        <option value="medium">Medium - Affects functionality</option>
                        <option value="high">High - Major impact</option>
                        <option value="critical">Critical - System unusable</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what happened, what you expected to happen, and any error messages you saw..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="steps">Steps to Reproduce</Label>
                    <Textarea
                      id="steps"
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                      value={formData.steps}
                      onChange={(e) => handleInputChange('steps', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                    Submit Issue Report
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <Shield className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle className="text-red-800">Security Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 text-sm mb-4">
                  Found a security vulnerability? Please report it responsibly through our security contact.
                </p>
                <Button variant="outline" className="w-full text-red-700 border-red-300">
                  security@resumeai.com
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bug className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Login Problems</h4>
                    <p className="text-gray-600">Clear browser cache and cookies</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Upload Errors</h4>
                    <p className="text-gray-600">Check file size and format</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Slow Performance</h4>
                    <p className="text-gray-600">Try a different browser or device</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Critical:</span>
                    <span className="text-green-600">< 4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">High:</span>
                    <span className="text-yellow-600">< 1 day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Medium:</span>
                    <span className="text-blue-600">< 3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Low:</span>
                    <span className="text-gray-600">< 1 week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
