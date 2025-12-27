import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),rgba(0,0,0,0))]" />
      
      <Card className="w-full max-w-md border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 w-fit mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-6xl font-bold text-white mb-4">404</CardTitle>
          <CardTitle className="text-3xl font-bold text-white">Page Not Found</CardTitle>
          <CardDescription className="text-zinc-400 text-base mt-2">
            Looks like you've wandered into uncharted territory. This page doesn't exist!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 text-center">
              💡 The page you're looking for might have been moved or deleted.
            </p>
          </div>

          <Link href="/" className="block">
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Need help? Contact us at{" "}
            <a href="mailto:contact@knimex.space" className="text-purple-400 hover:text-purple-300 underline">
              contact@knimex.space
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
