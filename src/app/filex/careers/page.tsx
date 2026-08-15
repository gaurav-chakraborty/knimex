"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appPath } from "@/lib/app-path";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  role: "",
  portfolioUrl: "",
  resumeUrl: "",
  coverLetter: "",
};

export default function CareersPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(appPath("/api/job-applications"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Application submission failed");
      setSubmitted(true);
      setForm(initialForm);
      toast.success("Application received securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href={appPath("/")} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to FileX
        </Link>

        <div className="mb-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-filex-blue/30 bg-filex-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-filex-blue-deep dark:text-filex-cyan">
            <BriefcaseBusiness className="h-4 w-4" /> Careers at KNIMEX
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Build tools that protect people and their data.</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">Submit an application for a role at KNIMEX. Applications are stored securely and are visible only to authorized administrators.</p>
        </div>

        <Card className="border-border bg-card shadow-xl shadow-filex-blue/5">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Job application</CardTitle>
            <CardDescription>Provide a role, contact details, portfolio or resume link, and a short cover letter.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 py-12 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-2xl font-bold text-foreground">Application received</h2>
                <p className="mx-auto max-w-md text-muted-foreground">Thank you. Our hiring team can now review your application securely.</p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>Submit another application</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="application-name">Full name</Label><Input id="application-name" value={form.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} /></div>
                  <div className="space-y-2"><Label htmlFor="application-email">Email</Label><Input id="application-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={320} /></div>
                  <div className="space-y-2"><Label htmlFor="application-phone">Phone</Label><Input id="application-phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} maxLength={40} /></div>
                  <div className="space-y-2"><Label htmlFor="application-role">Role of interest</Label><Input id="application-role" value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="Product engineer" required maxLength={160} /></div>
                  <div className="space-y-2"><Label htmlFor="application-portfolio">Portfolio URL</Label><Input id="application-portfolio" type="url" value={form.portfolioUrl} onChange={(event) => update("portfolioUrl", event.target.value)} placeholder="https://" /></div>
                  <div className="space-y-2"><Label htmlFor="application-resume">Resume URL</Label><Input id="application-resume" type="url" value={form.resumeUrl} onChange={(event) => update("resumeUrl", event.target.value)} placeholder="https://" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="application-cover-letter">Cover letter</Label><Textarea id="application-cover-letter" value={form.coverLetter} onChange={(event) => update("coverLetter", event.target.value)} required minLength={1} maxLength={20000} rows={8} placeholder="Tell us what you would build at KNIMEX and why this role is a fit." /></div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-filex-gradient text-slate-950 hover:opacity-90 sm:w-auto"><Send className="mr-2 h-4 w-4" />{isSubmitting ? "Submitting..." : "Submit application"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
