import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-slate-400 hover:text-white">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="border-b border-slate-800 pb-8">
            <CardTitle className="text-4xl font-bold text-white">Terms and Conditions</CardTitle>
            <p className="text-slate-400 mt-2">Last Updated: December 24, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none pt-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing and using FileX by KNIMEX ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
              <p>
                FileX provides tools for editing file metadata. We do not store your original files on our servers; all processing is done locally in your browser or temporarily for the duration of the session.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">3. User Responsibilities</h2>
              <p>
                You are responsible for the files you upload and the metadata you choose to associate with them. You agree not to use the Service for any illegal purposes or to infringe upon the intellectual property rights of others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">4. Privacy and Data</h2>
              <p>
                Your privacy is important to us. Please refer to our Privacy Policy for information on how we collect and use your data. We do not peek into your files or store their content permanently.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">5. Limitation of Liability</h2>
              <p>
                The Service is provided "as is" without any warranties. KNIMEX shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Your continued use of the Service after changes are posted constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">7. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at contact@knimex.space.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
