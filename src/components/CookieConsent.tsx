
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen the cookie notice
    const hasSeenNotice = localStorage.getItem('cookieNoticeShown');
    if (!hasSeenNotice) {
      setIsVisible(true);
    }
  }, []);

  const dismissNotice = () => {
    localStorage.setItem('cookieNoticeShown', 'true');
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
              Cookie Notice
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
              By continuing to use our website, you consent to our use of cookies.{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Learn more in our Privacy Policy
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Your continued use of this site indicates your acceptance of our cookie policy.
            </p>
          </div>
          <button
            onClick={dismissNotice}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
