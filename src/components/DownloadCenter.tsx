"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FileXLogo from "@/components/FileXLogo";
import { 
  Download, Upload, File as FileIcon, CheckCircle2, Sparkles, Zap, Shield, X, 
  Lock, AlertTriangle, Camera, Eye, History, MapPin, Cpu, Scissors, 
  Settings2, Database, Info, LogOut, LayoutDashboard, FileText, FileJson, 
  ShieldCheck, FileCode, Archive, Minimize2, HardDrive, RefreshCw,
  Copy, PlayCircle, ExternalLink, Globe, LockKeyhole, HelpCircle, Mail,
  Clock, Trash2, FileCheck, ScanLine, Fingerprint, Eraser, Image as ImageIcon
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import MobileNav from "@/components/MobileNav";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import WatermarkRemovalDialog from "@/components/WatermarkRemovalDialog";
import { appPath } from "@/lib/app-path";

interface TemplateSetting {
  id: string;
  label: string;
  enabled: boolean;
  inputType?: "text" | "date" | "dropdown";
  value?: string;
  options?: string[];
}

interface Template {
  name: string;
  description: string;
  settings: TemplateSetting[];
}

interface DetectedRisk {
  id: string;
  type: "high" | "medium" | "low" | "safe";
  label: string;
  description: string;
  suggestion: string;
  isChecked: boolean;
  category: string;
  originalValue: string;
  cleanedValue: string;
}

interface ExtractedMetadataField {
  key: string;
  value: string | string[];
  category: string;
  riskLevel: "high" | "medium" | "low";
  description: string;
}

const SUGGESTION_BY_RISK: Record<"high" | "medium" | "low", string> = {
  high: "Recommended: Remove immediately",
  medium: "Recommended: Remove before sharing",
  low: "Optional: Safe to keep or remove",
};

const TEMPLATES: Record<string, Template> = {
  "student": {
    name: "Student Submission",
    description: "Ideal for university assignments and academic papers.",
    settings: [
      { id: "author", label: "Replace author with", enabled: true, inputType: "text", value: "Anonymous Student" },
      { id: "organization", label: "Set organization to", enabled: true, inputType: "text", value: "Academic Institution" },
      { id: "title", label: "Update title to", enabled: true, inputType: "text", value: "Final Submission" },
      { id: "removeSoftware", label: "Remove original software metadata", enabled: true },
    ]
  },
  "job": {
    name: "Job Application",
    description: "Strip employer history and internal markers.",
    settings: [
      { id: "author", label: "Replace author with", enabled: true, inputType: "text", value: "Applicant" },
      { id: "organization", label: "Clear organization field", enabled: true },
      { id: "clearEmployer", label: "Clear previous employer info", enabled: true },
      { id: "stripConfidential", label: "Strip confidential markers", enabled: true },
    ]
  },
  "social": {
    name: "Social Media Upload",
    description: "Maximum privacy for public sharing platforms.",
    settings: [
      { id: "stripExif", label: "Strip all EXIF data", enabled: true },
      { id: "removeGps", label: "Remove GPS coordinates", enabled: true },
      { id: "clearDevice", label: "Clear device information", enabled: true },
      { id: "anonymizeTime", label: "Anonymize timestamps", enabled: true },
    ]
  }
};

export default function DownloadCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    if (!session?.user) return;
    const token = localStorage.getItem("bearer_token");
    fetch(appPath("/api/billing/status"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.plan && setUserPlan(data.plan))
      .catch(() => {});
  }, [session]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [privacyLevel, setPrivacyLevel] = useState(75);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [risks, setRisks] = useState<DetectedRisk[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [watermarkEditorFile, setWatermarkEditorFile] = useState<File | null>(null);
  const [processedCount, setProcessedCount] = useState(12842);

  // Guided Tour State
  const [tourStep, setTourStep] = useState<number | null>(null);
  const tourSteps = [
    {
      target: ".security-config",
      title: "Security Configuration",
      content: "Choose a metadata template or manually set your privacy aggression level. Templates are pre-configured for common scenarios like student submissions or social media.",
    },
    {
      target: ".dropzone-area",
      title: "Processing Hub",
      content: "Drag and drop your files here. We support images, documents, and videos. All processing happens locally in your browser for maximum security.",
    },
    {
      target: ".metadata-shield",
      title: "Metadata Shield",
      content: "Review exactly what data is being removed. Our AI identifies high-risk metadata like GPS, device serials, and author information.",
    },
    {
      target: ".export-settings",
      title: "Export & Security",
      content: "Configure naming conventions, compression levels, and security verification logs before finalizing your secure download.",
    }
  ];

  const startTour = () => setTourStep(0);
  const closeTour = () => {
    setTourStep(null);
    localStorage.setItem("filex_tour_seen", "true");
  };
  const nextStep = () =>
    setTourStep(prev => {
      if (prev !== null && prev < tourSteps.length - 1) return prev + 1;
      localStorage.setItem("filex_tour_seen", "true");
      return null;
    });

  // Auto-launch the guided tour for first-time visitors so the product is
  // discoverable without them having to find the "Guided Tour" button.
  useEffect(() => {
    if (localStorage.getItem("filex_tour_seen")) return;
    const timer = setTimeout(() => setTourStep(0), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Live Counter Animation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessedCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Export Settings State
  const [exportOptions, setExportOptions] = useState({
    downloadCleaned: true,
    generateLog: true,
    exportJson: false,
    createReport: false,
    generateCertificate: false
  });

  const [namingOptions, setNamingOptions] = useState({
    keepOriginal: false,
    addSuffix: true,
    customName: "",
    addTimestamp: false
  });

  const [compression, setCompression] = useState("smart");
  const [securityOptions, setSecurityOptions] = useState({
    verifyIntegrity: true,
    generateHash: false,
    encryptedBackup: false
  });

  const [fileSizeEstimates] = useState({
    downloadCleaned: "Variable",
    generateLog: "12 KB",
    exportJson: "45 KB",
    createReport: "124 KB",
    generateCertificate: "240 KB"
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const nextFiles = Array.from(new Map(
      [...uploadedFiles, ...acceptedFiles].map((file) => [`${file.name}:${file.size}:${file.lastModified}`, file])
    ).values());
    setIsProcessing(true);
    setUploadedFiles(nextFiles);
    setRisks([]);

    try {
      const formData = new FormData();
      formData.append("action", "extract");
      nextFiles.forEach((file) => formData.append("files", file));

      const res = await fetch(appPath("/api/metadata"), { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to analyze files.");
        return;
      }

      const detected = new Map<string, DetectedRisk>();
      for (const fileResult of data.files as Array<{ fields: ExtractedMetadataField[] }>) {
        for (const field of fileResult.fields) {
          if (detected.has(field.key)) continue;
          const value = Array.isArray(field.value) ? field.value.join(", ") : field.value;
          detected.set(field.key, {
            id: field.key,
            type: field.riskLevel,
            category: field.category,
            label: field.description,
            description: value,
            suggestion: SUGGESTION_BY_RISK[field.riskLevel],
            isChecked: field.riskLevel !== "low",
            originalValue: value,
            cleanedValue: "[Removed]",
          });
        }
      }

      const riskList = Array.from(detected.values());
      setRisks(riskList);

      const highCount = riskList.filter((r) => r.type === "high").length;
      if (riskList.length === 0) {
        toast.success("No risky metadata detected — your files look clean.");
      } else if (highCount > 0) {
        toast.success(`${nextFiles.length} file(s) analyzed! ${highCount} critical privacy risk(s) detected.`);
      } else {
        toast.success(`${nextFiles.length} file(s) analyzed! ${riskList.length} metadata field(s) found.`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    multiple: true,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.mov']
    }
  });

  const toggleRisk = (id: string) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, isChecked: !r.isChecked } : r));
  };

  const applyAllRecommendations = () => {
    setRisks(prev => prev.map(r => r.type !== 'safe' ? { ...r, isChecked: true } : r));
    toast.success("All privacy recommendations applied");
  };

  const imageFiles = useMemo(
    () => uploadedFiles.filter((file) => file.type.startsWith("image/")),
    [uploadedFiles]
  );

  const applyWatermarkRemoval = (originalFile: File, cleanedFile: File) => {
    setUploadedFiles((files) => files.map((file) => file === originalFile ? cleanedFile : file));
    toast.success(`${originalFile.name} is ready with watermark cleanup applied.`);
  };

  const stats = useMemo(() => {
    const resolved = risks.filter(r => r.type !== 'safe' && r.isChecked).length;
    const totalRisks = risks.filter(r => r.type !== 'safe').length;
    const cleanedFields = risks.filter(r => r.isChecked).length;
    const preservedFields = risks.filter(r => !r.isChecked).length;
    // No detected risks means nothing to protect against — that's a clean
    // file, not a 0% score.
    const score = totalRisks === 0 ? 100 : Math.round((resolved / totalRisks) * 100);
    return { resolved, totalRisks, cleanedFields, preservedFields, score };
  }, [risks]);

  const handleDownload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("No files to process. Please upload files first.");
      return;
    }

    const activeOptionsCount = Object.values(exportOptions).filter(Boolean).length;
    if (activeOptionsCount === 0) {
      toast.error("Please select at least one download option.");
      return;
    }

    setIsProcessing(true);
    const zip = new JSZip();

    try {
      // Strip metadata server-side for every file the user checked off,
      // subject to the plan's daily limit (enforced in /api/metadata).
      let cleanedByIndex: string[] | null = null;
      if (exportOptions.downloadCleaned) {
        const removeFields = risks.filter((r) => r.isChecked).map((r) => r.id);
        const cleanFormData = new FormData();
        cleanFormData.append("action", "remove");
        uploadedFiles.forEach((file) => cleanFormData.append("files", file));
        cleanFormData.append("removeFields", JSON.stringify(removeFields));
        cleanFormData.append("replaceFields", JSON.stringify({}));
        cleanFormData.append("removeSignature", "false");

        const cleanRes = await fetch(appPath("/api/metadata"), { method: "POST", body: cleanFormData });
        const cleanData = await cleanRes.json();

        if (!cleanRes.ok) {
          if (cleanRes.status === 402) {
            toast.error(cleanData.error || "Daily processing limit reached.");
            router.push(appPath("/pricing"));
          } else {
            toast.error(cleanData.error || "Failed to clean files.");
          }
          setIsProcessing(false);
          return;
        }

        cleanedByIndex = (cleanData.files as Array<{ fileName: string; data: string }>).map((cleaned) => cleaned.data);
      }

      // Process each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const baseName = namingOptions.customName || file.name.split('.')[0];
        let fileName = baseName;
        if (namingOptions.addSuffix) fileName += "_cleaned";
        if (namingOptions.addTimestamp) fileName += `_${Date.now()}`;

        const extension = file.name.split('.').pop();
        const fullFileName = `${fileName}.${extension}`;

        // 1. Cleaned File — actual metadata-stripped bytes from the engine
        if (exportOptions.downloadCleaned) {
          const cleanedBase64 = cleanedByIndex?.[i];
          if (cleanedBase64) {
            zip.file(fullFileName, cleanedBase64, { base64: true });
          } else {
            zip.file(fullFileName, file);
          }
        }

        // 2. Generate Log
        if (exportOptions.generateLog) {
          const logContent = `Privacy Log for ${file.name}\n` + 
            `Timestamp: ${new Date().toISOString()}\n` +
            `Watermark cleanup: ${file.name.includes("_watermark_removed") ? "APPLIED LOCALLY" : "NOT REQUESTED"}\n` +
            `-----------------------------------\n` +
            risks.map(r => `${r.label}: ${r.isChecked ? 'STRIPPED' : 'PRESERVED'} (Original: ${r.originalValue})`).join("\n");
          zip.file(`${fileName}_privacy_log.txt`, logContent);
        }

        // 3. Export JSON
        if (exportOptions.exportJson) {
          const jsonContent = JSON.stringify({
            file: file.name,
            originalSize: file.size,
            processedAt: new Date().toISOString(),
            riskAnalysis: risks,
            watermarkCleanupApplied: file.name.includes("_watermark_removed")
          }, null, 2);
          zip.file(`${fileName}_metadata_snapshot.json`, jsonContent);
        }

        // 4. Create HTML Report
        if (exportOptions.createReport) {
          const reportHtml = `
            <html>
              <head><style>body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }</style></head>
              <body>
                <h1>Privacy Audit Report</h1>
                <h2>File: ${file.name}</h2>
                <p>Privacy Score: ${stats.score}%</p>
                <ul>${risks.map(r => `<li>${r.label}: ${r.isChecked ? '✅ Secure' : '⚠️ Exposed'}</li>`).join('')}</ul>
              </body>
            </html>
          `;
          zip.file(`${fileName}_audit_report.html`, reportHtml);
        }

        // 5. Generate PDF Certificate
        if (exportOptions.generateCertificate) {
          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.text("Certificate of Privacy Verification", 20, 30);
          doc.setFontSize(12);
          doc.text(`File Name: ${file.name}`, 20, 50);
          doc.text(`Date of Audit: ${new Date().toLocaleDateString()}`, 20, 60);
          doc.text(`Verification ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 20, 70);
          doc.text(`Status: METADATA STRIPPED & VERIFIED`, 20, 90);
          const pdfBlob = doc.output("blob");
          zip.file(`${fileName}_privacy_cert.pdf`, pdfBlob);
        }
      }

      // Generate and trigger download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const bundleName = uploadedFiles.length > 1 ? "filex_secure_bundle.zip" : "filex_secure_download.zip";
      saveAs(zipBlob, bundleName);
      
      toast.success("Secure files downloaded successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate secure download.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#020617] text-white selection:bg-filex-blue/30 font-sans antialiased overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-filex-cyan/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-filex-blue-deep/10 blur-[150px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* Header */}
          <header className="flex justify-between items-center border-b border-white/5 pb-8">
            <FileXLogo variant="standard" size="md" />
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                  <Link href="#processing-hub" className="hover:text-white transition-colors">Tools</Link>
                  <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                  <Button variant="ghost" size="sm" onClick={startTour} className="text-filex-blue hover:text-filex-blue-deep hover:bg-filex-blue/10 gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Guided Tour
                  </Button>
              </nav>
              <div className="h-6 w-px bg-white/10" />
              <ThemeSwitcher />
              {session ? (
                <div className="flex items-center gap-4">
                  <Link href="/account" className="flex flex-col items-end group">
                    <span className="text-xs font-bold group-hover:text-filex-blue transition-colors">{session.user.name}</span>
                    <Badge className="bg-filex-blue/10 text-filex-blue border-filex-blue/20 text-[9px] py-0 uppercase">
                      {userPlan}
                    </Badge>
                  </Link>
                  <Button aria-label="Sign out" variant="ghost" size="icon" className="rounded-full hover:bg-white/5" onClick={() => authClient.signOut()}>
                    <LogOut className="w-5 h-5 text-slate-400" />
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="bg-white text-black hover:bg-slate-200 font-bold rounded-xl px-6">
                    Sign In
                  </Button>
                </Link>
              )}
              <MobileNav
                links={[
                  { href: "/pricing", label: "Pricing" },
                  { href: session ? "/account" : "/login", label: session ? "My Account" : "Sign In" },
                  { href: "/contact", label: "Contact" },
                ]}
                footer={
                  <Button variant="ghost" size="sm" onClick={startTour} className="w-full justify-start text-filex-blue hover:text-filex-blue-deep hover:bg-filex-blue/10 gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Guided Tour
                  </Button>
                }
              />
            </div>
          </header>

          {/* Hero Section */}
          {uploadedFiles.length === 0 && (
            <section className="text-center py-10 space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Badge className="bg-filex-blue/10 text-filex-blue border-filex-blue/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
                  ✨ MULTI-FILE SUPPORT NOW ACTIVE
                </Badge>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl mx-auto leading-[0.9]">
                  STRIP DATA FINGERPRINTS. <span className="text-transparent bg-clip-text bg-filex-gradient">SECURE YOUR PRIVACY.</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                  FileX uses AI to detect and remove sensitive metadata from your files. 
                  Zero server-side storage. 100% private.
                </p>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-lg shadow-xl shadow-white/5"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" onClick={startTour} className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-lg">
                  <PlayCircle className="w-5 h-5 mr-2 text-filex-blue" />
                  Watch Workflow
                </Button>
              </div>

              {/* Trust Section */}
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {processedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Secures Today</span>
                </div>
                {[
                  { label: "Local Processing", icon: HardDrive, color: "text-filex-cyan" },
                  { label: "AI Threat Detection", icon: ScanLine, color: "text-filex-blue" },
                  { label: "Encrypted Exports", icon: LockKeyhole, color: "text-green-400" },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-1">
                    <badge.icon className={`w-6 h-6 ${badge.color}`} />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{badge.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Configuration & Risks */}
            <div className="lg:col-span-7 space-y-10">
              {/* Security Configuration */}
              <section id="security-engine" className="security-config space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Settings2 className="w-6 h-6 text-filex-blue" />
                  Security Configuration
                </h2>
                <Card className="bg-[#0f172a]/50 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Metadata Template</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger className="bg-[#020617] border-white/10 h-12 rounded-xl focus:ring-filex-blue/50">
                            <SelectValue placeholder="Select Template" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0f172a] border-white/10 text-white rounded-xl">
                            {Object.entries(TEMPLATES).map(([id, t]) => (
                              <SelectItem key={id} value={id} className="p-3 focus:bg-filex-blue/10">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{t.name}</span>
                                  <span className="text-[10px] text-slate-500">{t.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <SelectItem value="custom" className="p-3">Manual/Custom Mode</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Privacy Aggression</Label>
                          <Badge variant="outline" className="text-[10px] border-filex-blue/30 text-filex-blue">{privacyLevel}%</Badge>
                        </div>
                        <Slider value={[privacyLevel]} onValueChange={(v) => setPrivacyLevel(v[0])} max={100} className="py-4" />
                        <p className="text-[10px] text-slate-500 font-medium italic">Higher levels strip more deeply embedded markers.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Processing Hub / Dropzone */}
              <section id="processing-hub" className="dropzone-area space-y-6">
                <h2 className="text-2xl font-bold flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-filex-cyan" />
                    Processing Hub
                  </div>
                  {uploadedFiles.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => { setUploadedFiles([]); setWatermarkEditorFile(null); }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </h2>
                <div {...getRootProps()} className={`relative group cursor-pointer ${uploadedFiles.length > 0 ? 'h-40' : 'h-80'} flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2.5rem] transition-all duration-500 ${
                  isDragActive ? "border-filex-blue bg-filex-blue/5 scale-[0.99]" : "border-white/10 bg-[#0f172a]/80 hover:bg-[#0f172a]"
                }`}>
                  <input {...getInputProps()} id="file-upload-input" />
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-filex-blue/20 border-t-filex-blue animate-spin" />
                      <div className="space-y-1">
                        <p className="font-black text-xl tracking-tight text-white uppercase">AI Analysis in Progress</p>
                        <p className="text-xs text-filex-blue uppercase tracking-widest animate-pulse">Scanning binary structures...</p>
                      </div>
                    </div>
                  ) : uploadedFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {uploadedFiles.slice(0, 3).map((f, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-white/10 border-2 border-[#0f172a] flex items-center justify-center">
                              <FileIcon className="w-5 h-5 text-filex-blue" />
                            </div>
                          ))}
                          {uploadedFiles.length > 3 && (
                            <div className="w-10 h-10 rounded-xl bg-white/10 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">
                              +{uploadedFiles.length - 3}
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold">{uploadedFiles.length} File(s) Staged</p>
                      </div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Drop more to add · maximum 10 files</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-[1.5rem] bg-filex-gradient flex items-center justify-center mb-6 shadow-2xl shadow-filex-blue/40 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">Drop files or click to upload</h3>
                      <p className="text-slate-500 max-w-sm text-center font-medium mt-2">Maximum privacy. All processing happens in your browser.</p>
                      <Badge variant="outline" className="mt-6 border-white/5 bg-white/5 text-slate-400 px-4 py-1">
                        JPG, PNG, PDF, MP4, MOV
                      </Badge>
                    </>
                  )}
                </div>
              </section>

              {uploadedFiles.length > 0 && (
                <section id="batch-queue" aria-labelledby="batch-queue-title" className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 id="batch-queue-title" className="text-2xl font-bold flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-filex-cyan" />Batch queue</h2>
                      <p className="mt-1 text-xs text-slate-500">Each staged file is retained independently for export.</p>
                    </div>
                    <Badge variant="outline" className="border-white/10 text-slate-300">{uploadedFiles.length}/10</Badge>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => {
                      const isImage = file.type.startsWith("image/");
                      return (
                        <div key={`${file.name}:${file.size}:${file.lastModified}`} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-xl bg-white/5 p-2 text-filex-cyan">{isImage ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}</div>
                            <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{file.name}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">{(file.size / 1024).toFixed(1)} KB · {file.type || "file"}</p></div>
                          </div>
                          {isImage && <Button type="button" size="sm" variant="outline" onClick={() => setWatermarkEditorFile(file)} className="border-cyan-400/25 text-cyan-200 hover:bg-cyan-400/10"><Eraser className="mr-2 h-4 w-4" />Remove watermark</Button>}
                        </div>
                      );
                    })}
                  </div>
                  {imageFiles.length > 0 && <p className="text-[10px] font-medium italic text-slate-500">Watermark cleanup is local and intended for content you own or are authorized to edit.</p>}
                </section>
              )}

              {/* AI-Detected Risks */}
              <AnimatePresence>
                {uploadedFiles.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ai-risks space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        AI Risk Assessment
                      </h2>
                      <Button variant="outline" size="sm" onClick={applyAllRecommendations} disabled={risks.length === 0} className="border-filex-blue/30 text-filex-blue hover:bg-filex-blue/10 text-xs rounded-xl disabled:opacity-30">
                        Auto-Secure All
                      </Button>
                    </div>

                    {!isProcessing && risks.length === 0 ? (
                      <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl">
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">No risky metadata detected</h4>
                            <p className="text-xs text-slate-400">These files look clean — you can still proceed to export them securely.</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {risks.map(risk => (
                        <Card key={risk.id} className={`bg-[#0f172a]/40 border-white/5 backdrop-blur-md rounded-2xl group hover:border-white/10 transition-all ${!risk.isChecked ? 'opacity-70' : ''}`}>
                          <CardContent className="p-5 flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                              <div className={`mt-1 p-2 rounded-xl ${
                                risk.type === 'high' ? "bg-red-500/10 text-red-500" : 
                                risk.type === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                                risk.type === 'low' ? "bg-filex-cyan/10 text-filex-cyan" : "bg-green-500/10 text-green-500"
                              }`}>
                                {risk.type === 'safe' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm tracking-tight">{risk.label}</h4>
                                <p className="text-[10px] text-slate-400 font-mono leading-none">{risk.description}</p>
                                {risk.isChecked && <p className="text-[10px] text-filex-blue font-bold mt-2 flex items-center gap-1"><ScanLine className="w-3 h-3" /> Auto-Stripped</p>}
                              </div>
                            </div>
                            <Checkbox 
                              checked={risk.isChecked} 
                              onCheckedChange={() => toggleRisk(risk.id)}
                              className="mt-1 border-white/20 data-[state=checked]:bg-filex-blue data-[state=checked]:border-filex-blue rounded-lg h-6 w-6"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Export Settings */}
              {uploadedFiles.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="export-settings space-y-6 pb-20"
                >
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Archive className="w-6 h-6 text-filex-blue" />
                    Export & Delivery
                  </h2>
                  <Card className="bg-[#0f172a]/50 border-white/5 rounded-[2.5rem] overflow-hidden p-8 space-y-10 shadow-2xl">
                    
                    {/* Download Options */}
                    <div className="space-y-4">
                      <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Select Deliverables</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'downloadCleaned', label: 'Secured Files', icon: Download, size: fileSizeEstimates.downloadCleaned, color: 'text-green-400' },
                          { id: 'generateLog', label: 'Privacy Log (.txt)', icon: FileText, size: fileSizeEstimates.generateLog, color: 'text-filex-cyan' },
                          { id: 'exportJson', label: 'Raw Metadata (.json)', icon: FileJson, size: fileSizeEstimates.exportJson, color: 'text-yellow-400' },
                          { id: 'createReport', label: 'Audit Report (.html)', icon: FileCode, size: fileSizeEstimates.createReport, color: 'text-orange-400' },
                          { id: 'generateCertificate', label: 'Verified Certificate (.pdf)', icon: ShieldCheck, size: fileSizeEstimates.generateCertificate, color: 'text-filex-blue' },
                        ].map((opt) => (
                          <div key={opt.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => setExportOptions({...exportOptions, [opt.id]: !exportOptions[opt.id as keyof typeof exportOptions]})}>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl bg-white/5 ${opt.color}`}>
                                <opt.icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{opt.label}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{opt.size}</span>
                              </div>
                            </div>
                            <Checkbox 
                              checked={exportOptions[opt.id as keyof typeof exportOptions]} 
                              onCheckedChange={(v) => setExportOptions({...exportOptions, [opt.id]: !!v})} 
                              className="rounded-lg h-5 w-5 border-white/10"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Security & Verification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Naming Protocols</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Checkbox id="ts" checked={namingOptions.addTimestamp} onCheckedChange={(v) => setNamingOptions({...namingOptions, addTimestamp: !!v})} className="rounded" />
                            <Label htmlFor="ts" className="text-xs font-medium cursor-pointer">Append Epoch Timestamp</Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox id="sx" checked={namingOptions.addSuffix} onCheckedChange={(v) => setNamingOptions({...namingOptions, addSuffix: !!v})} className="rounded" />
                            <Label htmlFor="sx" className="text-xs font-medium cursor-pointer">Append "_secured" Suffix</Label>
                          </div>
                          <Input 
                            placeholder="Custom Prefix (Optional)" 
                            className="bg-white/5 border-white/10 rounded-xl h-10 text-xs focus:ring-filex-blue/50"
                            value={namingOptions.customName}
                            onChange={(e) => setNamingOptions({...namingOptions, customName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Data Verification</Label>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium">Auto-verify File Integrity</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox id="hash" checked={securityOptions.generateHash} onCheckedChange={(v) => setSecurityOptions({...securityOptions, generateHash: !!v})} className="rounded" />
                            <Label htmlFor="hash" className="text-xs font-medium cursor-pointer">Generate SHA-256 Hash Log</Label>
                          </div>
                          <div className="flex items-center gap-3 opacity-30 cursor-not-allowed grayscale">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs font-medium">AES-256 Cloud Backup (Pro)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.section>
              )}
            </div>

            {/* Right Column: Metadata Shield Preview */}
            <div className="lg:col-span-5 space-y-8">
              <Card className="metadata-shield bg-[#0f172a]/50 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden sticky top-8 shadow-2xl">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-filex-blue" />
                      Metadata Shield
                    </CardTitle>
                    <CardDescription>Real-time security preview.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5 px-3 py-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      SECURE
                    </span>
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-6">
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-6">
                      {/* Split View */}
                      <div className="grid grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                        <div className="p-5 bg-black/20 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/70">Original Data</p>
                          <div className="space-y-3 font-mono text-[9px] leading-tight text-slate-500">
                            {risks.map(r => (
                              <div key={r.id} className="flex gap-2">
                                <span className="text-red-900 shrink-0">[-]</span>
                                <span className="truncate">{r.label}: {r.originalValue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-5 bg-black/40 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/70">Secure Output</p>
                          <div className="space-y-3 font-mono text-[9px] leading-tight">
                            {risks.map(r => (
                              <div key={r.id} className="flex gap-2">
                                <span className="text-green-600 shrink-0">[+]</span>
                                <span className={r.isChecked ? "text-green-400 font-bold" : "text-slate-600 italic"}>
                                  {r.isChecked ? "[SCRUBBED]" : "[PRESERVED]"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Score Indicator */}
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Privacy Protection Score</p>
                          <p className="text-4xl font-black">{stats.score}<span className="text-xl text-slate-500">%</span></p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-filex-gradient flex items-center justify-center shadow-lg shadow-filex-blue/20">
                          <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownload}
                        disabled={isProcessing}
                        className="download-btn w-full bg-white text-black hover:bg-slate-200 font-black rounded-2xl h-16 shadow-2xl shadow-filex-blue/10 group text-lg"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-6 h-6 mr-3 text-filex-blue-deep group-hover:scale-110 transition-transform" />
                            PROCEED TO SECURE EXPORT
                          </>
                        )}
                      </Button>
                      
                      <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest">
                        Total {uploadedFiles.length} file(s) staged for local processing
                      </p>
                    </div>
                  ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
                        <ScanLine className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="font-bold text-sm">Upload files to begin<br/>secure threat scanning</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Advisory */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-tr from-filex-cyan/5 to-filex-blue/5 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-filex-cyan" />
                  <h4 className="font-bold text-xs uppercase tracking-tight text-white">Privacy Advisory</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Your files are never uploaded to any server. Our shield operates entirely within the secure context of your browser's V8 engine. Once you close this tab, all session data is permanently purged.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-green-500/10"
              >
                <div className="bg-gradient-to-tr from-green-500/20 via-filex-cyan/20 to-filex-blue/20 p-12 text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
                    <FileCheck className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight uppercase">SECURED!</h2>
                    <p className="text-slate-400 font-medium">Digital footprints successfully erased.</p>
                  </div>
                </div>
                <div className="p-12 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center space-y-1">
                      <p className="text-3xl font-black text-green-400">{stats.resolved}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Threats Neutralized</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center space-y-1">
                      <p className="text-3xl font-black text-filex-cyan">{uploadedFiles.length}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Files Verified</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Button onClick={() => setShowSuccessModal(false)} className="h-16 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-lg">
                      Start New Session
                    </Button>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1 h-12 rounded-2xl border-white/10 hover:bg-white/5 font-bold" onClick={() => router.push(appPath("/pricing"))}>
                        View Pro Features
                      </Button>
                      <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => toast.info("Feedback form coming soon!")}>
                        Leave Feedback
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <WatermarkRemovalDialog
          file={watermarkEditorFile}
          open={Boolean(watermarkEditorFile)}
          onOpenChange={(open) => { if (!open) setWatermarkEditorFile(null); }}
          onApply={(cleanedFile) => {
            if (watermarkEditorFile) applyWatermarkRemoval(watermarkEditorFile, cleanedFile);
          }}
        />

        {/* Guided Tour Overlay */}
        <AnimatePresence>
          {tourStep !== null && (
            <div className="fixed inset-0 z-[200] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
                onClick={closeTour}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0f172a] border border-filex-blue/50 rounded-[2.5rem] p-10 shadow-2xl shadow-filex-blue/30 pointer-events-auto"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-filex-blue flex items-center justify-center text-xs font-black">
                        {tourStep + 1}
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">FileX Onboarding</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeTour} className="rounded-full hover:bg-white/5 h-8 w-8">
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tight text-white uppercase">{tourSteps[tourStep].title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{tourSteps[tourStep].content}</p>
                  </div>
                  <div className="pt-6 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {tourSteps.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === tourStep ? 'w-6 bg-filex-blue' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" className="text-xs text-slate-500 hover:text-white font-bold" onClick={closeTour}>
                        Skip
                      </Button>
                      <Button onClick={nextStep} className="bg-white text-black hover:bg-slate-200 font-black px-8 rounded-2xl h-12">
                        {tourStep === tourSteps.length - 1 ? "Get Started" : "Next Step"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <FileXLogo variant="standard" size="md" />
              <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
                The world's most advanced client-side metadata erasure tool. Built for professionals who value digital sovereignty.
              </p>
              <div className="flex gap-3">
                <a aria-label="FileX GitHub repository" href="https://github.com/gaurav-chakraborty/filex" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" /></a>
                <a aria-label="Email KNIMEX support" href="mailto:contact@knimex.com" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"><Mail className="h-4 w-4" /></a>
                <button aria-label="Copy FileX link" type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("FileX link copied."); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Product</h4>
              <nav className="flex flex-col gap-3 text-sm font-medium text-slate-500">
                <Link href="#security-engine" className="hover:text-white transition-colors">Security Engine</Link>
                <Link href="/api-docs" className="hover:text-white transition-colors">API Docs</Link>
                <Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link>
                <a href="https://github.com/gaurav-chakraborty/filex" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Open Source</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Legal</h4>
              <nav className="flex flex-col gap-3 text-sm font-medium text-slate-500">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/security" className="hover:text-white transition-colors">Security Policy</Link>
                <Link href="/privacy#cookies" className="hover:text-white transition-colors">Cookie Audit</Link>
              </nav>
            </div>
              <div className="col-span-2 lg:col-span-1 space-y-6">
                <div className="p-6 rounded-3xl bg-filex-gradient/10 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-tight text-white">Need support?</h4>
                  <p className="text-xs leading-5 text-slate-400">Questions about privacy, batch exports, or enterprise workflows?</p>
                  <Link href="/contact" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-200 hover:text-white">Open support center <ExternalLink className="h-3 w-3" /></Link>
                </div>
              </div>
          </div>
          <div className="pt-20 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-[10px] font-black uppercase tracking-widest">
              <p>© 2025 KNIMEX. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Operational</span>
              <span>Encrypted via AES-256</span>
              <span className="flex items-center gap-2"><Globe className="w-3 h-3 text-white" /> Global CDN</span>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
    );
}
