import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, EyeOff, Database, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-400">Last Updated: February 2025</p>
        </div>

        <div className="grid gap-8">
          <Card className="bg-white/5 border-white/10 text-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-blue-400" />
                Our Privacy Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At FileX by KNIMEX, we believe privacy is a fundamental human right. Our platform is designed from the ground up to minimize data collection and maximize user control.
              </p>
            </CardContent>
          </Card>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-purple-400" />
              Data Processing & Storage
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-bold text-white mb-2">1. Client-Side Processing</h3>
                <p>
                  All file metadata editing is performed **locally in your browser**. Your files are never uploaded to our servers for processing. The "upload" button merely loads the file into your browser's memory.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-bold text-white mb-2">2. Zero File Storage</h3>
                <p>
                  We do not store, host, or cache your files. Once you close your browser tab or refresh the page, any data held in memory is wiped instantly.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-bold text-white mb-2">3. Analytics & Tracking</h3>
                <p>
                  We do not use tracking pixels, third-party analytics (like Google Analytics), or behavioral tracking. We may log basic, anonymous event data (e.g., "a file was processed") to improve our service, but this data contains no identifiable information.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-400" />
              Account Information
            </h2>
            <p>
              If you choose to create an account (FXP Premium), we store the following in our secure Turso database:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (for login and communication)</li>
              <li>Hashed password (using enterprise-grade encryption)</li>
              <li>Subscription status</li>
            </ul>
            <p className="text-sm italic">
              We never sell or share this data with third parties.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <EyeOff className="w-6 h-6 text-green-400" />
              GDPR & CCPA Compliance
            </h2>
            <p>
              We are committed to complying with global privacy standards, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>**Right to Access:** You can request a copy of the personal data we hold about you.</li>
              <li>**Right to Erasure:** You can request that we delete your account and all associated data at any time.</li>
              <li>**Data Minimization:** We only collect what is strictly necessary to provide our service.</li>
            </ul>
          </section>

          <Card className="bg-blue-500/10 border-blue-500/30 text-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-blue-400" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                For any privacy-related concerns or data requests, please contact our Data Protection Officer at:
                <br />
                <a href="mailto:contact@knimex.space" className="text-blue-400 font-bold hover:underline">contact@knimex.space</a>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="pt-12 border-t border-white/5 text-center">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
