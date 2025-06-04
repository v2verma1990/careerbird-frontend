
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Mail, Phone } from "lucide-react";

const FraudAlert = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fraud Alert</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay vigilant against fraudulent activities. Learn how to protect yourself and report suspicious behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle className="text-red-800">Common Fraud Schemes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-red-700">
                <li>• Fake job postings requesting personal information</li>
                <li>• Phishing emails claiming to be from ResumeAI</li>
                <li>• Requests for payment for "guaranteed" job placements</li>
                <li>• Unauthorized use of our brand name or logo</li>
                <li>• Fake recruiters asking for sensitive data</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <Shield className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-green-800">How to Protect Yourself</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-green-700">
                <li>• Verify communications through official channels</li>
                <li>• Never share passwords or financial information</li>
                <li>• Check URLs carefully for official domains</li>
                <li>• Report suspicious activities immediately</li>
                <li>• Use strong, unique passwords for your account</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Report Fraud</h2>
          <p className="text-gray-600 text-center mb-8">
            If you encounter any suspicious activity or believe you've been targeted by fraud, please contact us immediately.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-gray-600 mb-4">security@resumeai.com</p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Phone className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">1-800-RESUME-AI</p>
              <Button variant="outline" className="w-full">
                Call Now
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Our Commitment to Security</h3>
            <p className="text-blue-700">
              ResumeAI is committed to protecting our users from fraud and maintaining the highest security standards. 
              We continuously monitor for suspicious activities and work with law enforcement when necessary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudAlert;
