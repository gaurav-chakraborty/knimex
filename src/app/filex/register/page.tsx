"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, User, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";
import { appPath } from "@/lib/app-path";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password
      });

      if (error?.code) {
        const errorMessages: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered. Please use a different email or log in.",
        };
        
        toast.error(errorMessages[error.code] || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully! Redirecting to login...");
      router.push(appPath("/login?registered=true"));
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 animate-gradient-x" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,116,144,0.12),transparent)]" />
      
      <Card className="w-full max-w-md border-border bg-card/90 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 w-fit">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Join KNIMEX and start editing metadata like a pro
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80 font-medium">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="off"
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground/80 font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="off"
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={appPath("/login")} className="text-filex-blue-deep hover:text-filex-blue dark:text-filex-cyan dark:hover:text-filex-blue font-medium underline decoration-dotted underline-offset-4 transition-colors">
                Log in instead
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Link href={appPath("/")}>
              <Button variant="outline" className="w-full border-border hover:bg-accent/50 text-foreground">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
