
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Users, CheckCircle, FileText } from "lucide-react";

const TrustSafety = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trust & Safety</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trust is our foundation. Learn about our comprehensive measures to keep you safe and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Lock className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• End-to-end encryption</li>
                <li>• SOC 2 compliance</li>
                <li>• Regular security audits</li>
                <li>• Secure data centers</li>
                <li>• GDPR compliance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Eye className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Privacy Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Transparent data practices</li>
                <li>• User control over data</li>
                <li>• No selling of personal info</li>
                <li>• Anonymous usage options</li>
                <li>• Right to be forgotten</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Community Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Content moderation</li>
                <li>• User verification</li>
                <li>• Report mechanisms</li>
                <li>• Anti-harassment policies</li>
                <li>• Professional standards</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-blue-800">Our Commitments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-blue-700">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Transparency</h3>
                    <p className="text-sm">Clear communication about our practices and policies</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Accountability</h3>
                    <p className="text-sm">Regular audits and public reporting on our security measures</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Continuous Improvement</h3>
                    <p className="text-sm">Ongoing investment in security and safety measures</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-green-800">Safety Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-green-700">
                <a href="/fraud-alert" className="block p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                  <h3 className="font-semibold">Fraud Alert</h3>
                  <p className="text-sm">Learn about common scams and how to avoid them</p>
                </a>
                <a href="/help-center" className="block p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                  <h3 className="font-semibold">Help Center</h3>
                  <p className="text-sm">Get help with account security and safety</p>
                </a>
                <a href="/report-issue" className="block p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                  <h3 className="font-semibold">Report Issue</h3>
                  <p className="text-sm">Report security concerns or safety issues</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Security Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">SOC 2 Type II</h3>
              <p className="text-sm text-gray-600">Certified</p>
            </div>
            <div className="p-4">
              <Lock className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">ISO 27001</h3>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div className="p-4">
              <Eye className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">GDPR</h3>
              <p className="text-sm text-gray-600">Compliant</p>
            </div>
            <div className="p-4">
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold">CCPA</h3>
              <p className="text-sm text-gray-600">Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSafety;
