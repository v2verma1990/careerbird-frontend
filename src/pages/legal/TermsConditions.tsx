
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>By accessing and using ResumeAI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Use License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Permission is granted to temporarily use ResumeAI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Our services include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Resume optimization and analysis</li>
              <li>Job matching and career insights</li>
              <li>Interview preparation tools</li>
              <li>Recruiting and candidate management tools</li>
            </ul>
            <p>Services are provided "as is" and we reserve the right to modify or discontinue any aspect of the service at any time.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Subscription fees are billed in advance on a monthly basis. You may cancel your subscription at any time, but no partial refunds will be provided for unused portions of the billing period.</p>
            <p>All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The materials on ResumeAI are provided on an 'as is' basis. ResumeAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>In no event shall ResumeAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ResumeAI, even if ResumeAI or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>If you have any questions about these Terms & Conditions, please contact us at:</p>
            <p className="mt-2">
              Email: legal@resumeai.com<br />
              Address: 123 Legal Street, San Francisco, CA 94105
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsConditions;
