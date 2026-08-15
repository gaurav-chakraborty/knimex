"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700">
      <Card className="max-w-4xl mx-auto bg-card/95 backdrop-blur-xl border-border p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 p-3 bg-filex-blue/15 rounded-2xl">
            <Cookie className="w-8 h-8 text-filex-blue" />
          </div>
          
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="text-lg font-bold text-foreground">Privacy & Cookies</h3>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies to improve your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies as described in our{" "}
              <Link href="/privacy" className="text-filex-blue hover:underline font-medium">
                Privacy Policy
              </Link>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={handleDecline}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              Essential Only
            </Button>
            <Button 
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 shadow-lg shadow-blue-500/20"
            >
              Accept All
            </Button>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
