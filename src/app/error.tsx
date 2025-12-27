"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),rgba(0,0,0,0))]" />
      
      <Card className="w-full max-w-md border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/50 w-fit mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-zinc-400 text-base mt-2">
            Don't worry, we're on it! Try refreshing the page or go back home.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error.message && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5 text-white"
                size="lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-4">
            If the problem persists, please contact us at{" "}
            <a href="mailto:contact@knimex.space" className="text-purple-400 hover:text-purple-300 underline">
              contact@knimex.space
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
