"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, Mail, MessageSquare, Star, Lightbulb, Handshake, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { appPath } from "@/lib/app-path";

export default function ContactPage() {
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    type: "review" as "review" | "feature" | "partnership",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(appPath("/api/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackForm)
      });

      if (!response.ok) throw new Error("Failed to submit");

      setIsSuccess(true);
      toast.success("Message sent successfully!");
      setFeedbackForm({ name: "", email: "", type: "review", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-slate-400 hover:text-white">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Connect with Us</h1>
              <p className="text-slate-400">
                We're always excited to hear from our users, creators, and partners.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Email</p>
                  <p className="text-sm text-slate-200">contact@knimex.com</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Support</p>
                  <p className="text-sm text-slate-200">Available 24/7</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="md:col-span-2 bg-slate-900 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Send a Message</CardTitle>
              <CardDescription className="text-slate-400">
                Tell us what's on your mind and we'll get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex p-4 rounded-full bg-green-500/20 text-green-400 mb-4">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Message Received!</h3>
                  <p className="text-slate-400 max-w-xs mx-auto">
                    Thank you for reaching out. Our team will review your message and respond shortly.
                  </p>
                  <Button 
                    onClick={() => setIsSuccess(false)}
                    variant="outline"
                    className="mt-6 border-slate-700 hover:bg-slate-800"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackForm({...feedbackForm, type: "review"})}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        feedbackForm.type === "review"
                          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Star className={`w-5 h-5 ${feedbackForm.type === "review" ? "text-yellow-400" : "text-slate-500"}`} />
                        <span className="text-xs font-semibold">Review</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackForm({...feedbackForm, type: "feature"})}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        feedbackForm.type === "feature"
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Lightbulb className={`w-5 h-5 ${feedbackForm.type === "feature" ? "text-blue-400" : "text-slate-500"}`} />
                        <span className="text-xs font-semibold">Feature</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackForm({...feedbackForm, type: "partnership"})}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        feedbackForm.type === "partnership"
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-200"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Handshake className={`w-5 h-5 ${feedbackForm.type === "partnership" ? "text-purple-400" : "text-slate-500"}`} />
                        <span className="text-xs font-semibold">Partner</span>
                      </div>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={feedbackForm.name}
                        onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                        placeholder="Your name"
                        required
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={feedbackForm.email}
                        onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                        placeholder="your@email.com"
                        required
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                      placeholder="How can we help?"
                      rows={5}
                      required
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isSubmitting ? "Sending..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
