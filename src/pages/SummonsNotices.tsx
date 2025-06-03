
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail, Phone, MapPin } from "lucide-react";

const SummonsNotices = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Summons & Legal Notices</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Information for serving legal documents and notices to ResumeAI.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Legal Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Registered Agent for Service</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Company:</strong> Corporation Service Company</p>
                    <p><strong>Address:</strong> 2710 Gateway Oaks Drive, Suite 150N</p>
                    <p><strong>City:</strong> Sacramento, CA 95833</p>
                    <p><strong>Phone:</strong> (916) 924-8000</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Corporate Headquarters</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Company:</strong> ResumeAI Inc.</p>
                    <p><strong>Address:</strong> 123 Innovation Drive, Suite 456</p>
                    <p><strong>City:</strong> San Francisco, CA 94105</p>
                    <p><strong>Attention:</strong> Legal Department</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Service of Process Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Required Information</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Complete case caption and court information</li>
                    <li>• Plaintiff and defendant names</li>
                    <li>• Case number and jurisdiction</li>
                    <li>• Date of service</li>
                    <li>• Process server information</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Processing Time</h4>
                  <p className="text-yellow-700">
                    Please allow 10-15 business days for initial review and routing to appropriate legal counsel. 
                    Urgent matters should be clearly marked as such.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">legal@resumeai.com</p>
                  <p className="text-sm text-gray-500 mt-2">For non-urgent legal matters</p>
                </div>
                
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <Phone className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">(555) 123-LEGAL</p>
                  <p className="text-sm text-gray-500 mt-2">Business hours: 9AM-5PM PST</p>
                </div>
                
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Physical Service</h3>
                  <p className="text-gray-600">Use registered agent address</p>
                  <p className="text-sm text-gray-500 mt-2">Certified mail recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              <strong>Disclaimer:</strong> This information is provided for convenience only. 
              For official legal proceedings, please consult with qualified legal counsel to ensure 
              proper service of process procedures are followed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummonsNotices;
