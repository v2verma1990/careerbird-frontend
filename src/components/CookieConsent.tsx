
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookieConsent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-2xl border-t-4 border-blue-600">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Cookie className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              We use cookies to enhance your experience
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              We use cookies to provide you with the best possible experience on our website. 
              These cookies help us understand how you use our site and improve our services. 
              By continuing to use our site, you consent to our use of cookies.{" "}
              <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                Learn more in our Privacy Policy
              </Link>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={acceptCookies}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept All Cookies
              </Button>
              <Button 
                onClick={declineCookies}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Decline
              </Button>
              <Link to="/privacy-policy">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                  Cookie Settings
                </Button>
              </Link>
            </div>
          </div>
          <button
            onClick={declineCookies}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cookie consent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
