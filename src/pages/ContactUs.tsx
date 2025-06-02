
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions or need support? We're here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <Input placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <Input placeholder="Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" placeholder="john.doe@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea placeholder="Tell us how we can help..." rows={5} />
              </div>

              <Button className="w-full" size="lg">Send Message</Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">For general inquiries:</p>
                <p className="font-medium">hello@resumeai.com</p>
                <p className="text-gray-600 mb-2 mt-4">For technical support:</p>
                <p className="font-medium">support@resumeai.com</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-green-600" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">+1 (555) 123-4567</p>
                <p className="text-gray-600">Monday - Friday, 9 AM - 6 PM PST</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                  Office Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">ResumeAI Headquarters</p>
                <p className="text-gray-600">
                  123 Innovation Drive<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p><span className="font-medium">Monday - Friday:</span> 9:00 AM - 6:00 PM PST</p>
                  <p><span className="font-medium">Saturday:</span> 10:00 AM - 4:00 PM PST</p>
                  <p><span className="font-medium">Sunday:</span> Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">How do I cancel my subscription?</h3>
              <p className="text-gray-600 text-sm">You can cancel your subscription anytime from your dashboard settings.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-gray-600 text-sm">Yes, we use enterprise-grade security to protect all user data.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 text-sm">We offer a 30-day money-back guarantee for all paid plans.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade my plan anytime?</h3>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
