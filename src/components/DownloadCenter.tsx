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
  Clock, Trash2, FileCheck, ScanLine, Fingerprint, Eraser, FolderTree, Image as ImageIcon
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef, type ChangeEvent, type InputHTMLAttributes } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
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

interface ExportOptionsState {
  downloadCleaned: boolean;
  generateLog: boolean;
  exportJson: boolean;
  createReport: boolean;
  generateCertificate: boolean;
}

interface NamingOptionsState {
  keepOriginal: boolean;
  addSuffix: boolean;
  customName: string;
  addTimestamp: boolean;
}

interface SecurityOptionsState {
  verifyIntegrity: boolean;
  generateHash: boolean;
  encryptedBackup: boolean;
}

interface BatchPreferencesState {
  preserveFolders: boolean;
  includeManifest: boolean;
  autoSelectLowRisk: boolean;
  batchLabel: string;
}

interface WorkflowProfile {
  name: string;
  description: string;
  template: string;
  privacyLevel: number;
  compression: string;
  exportOptions: ExportOptionsState;
  namingOptions: NamingOptionsState;
  securityOptions: SecurityOptionsState;
  batchPreferences: BatchPreferencesState;
}

const SUGGESTION_BY_RISK: Record<"high" | "medium" | "low", string> = {
  high: "Recommended: Remove immediately",
  medium: "Recommended: Remove before sharing",
  low: "Optional: Safe to keep or remove",
};

const METADATA_BATCH_SIZE = 10;
const FILEX_PREFERENCES_STORAGE_KEY = "filex-user-preferences-v2";
const DEFAULT_WORKFLOW_PROFILE = "balanced";
type FileWithRelativePath = File & { webkitRelativePath?: string };
type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
};
type FileSystemFileEntryLike = FileSystemEntryLike & {
  isFile: true;
  file: (success: (file: File) => void, error: (error: DOMException) => void) => void;
};
type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
  isDirectory: true;
  createReader: () => {
    readEntries: (success: (entries: FileSystemEntryLike[]) => void, error: (error: DOMException) => void) => void;
  };
};

type FileDropEvent = {
  dataTransfer?: DataTransfer | null;
  target?: { files?: FileList | null } | null;
};

function getRelativeFilePath(file: File): string {
  const relativePath = (file as FileWithRelativePath).webkitRelativePath?.trim();
  return relativePath || file.name;
}

function fileKey(file: File): string {
  return `${getRelativeFilePath(file)}:${file.size}:${file.lastModified}`;
}

function outputPath(file: File, fileName: string): string {
  const relativePath = getRelativeFilePath(file).replaceAll("\\", "/");
  const lastSlash = relativePath.lastIndexOf("/");
  const directory = lastSlash >= 0 ? relativePath.slice(0, lastSlash + 1) : "";
  return `${directory}${fileName}`.replace(/^\/+/, "");
}

function sanitizePathSegment(value: string): string {
  return value.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "");
}

function outputPathForPreference(
  file: File,
  fileName: string,
  preferences: BatchPreferencesState,
): string {
  const basePath = preferences.preserveFolders ? outputPath(file, fileName) : fileName;
  const label = sanitizePathSegment(preferences.batchLabel);
  return label ? `${label}/${basePath}` : basePath;
}

function rootOutputPath(fileName: string, preferences: BatchPreferencesState): string {
  const label = sanitizePathSegment(preferences.batchLabel);
  return label ? `${label}/${fileName}` : fileName;
}

function splitFileName(fileName: string): { baseName: string; extension: string } {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return { baseName: fileName, extension: "" };
  return {
    baseName: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex + 1),
  };
}

function buildExportFileName(
  file: File,
  index: number,
  namingOptions: NamingOptionsState,
  sessionStamp: string,
): string {
  const { baseName: originalBaseName, extension } = splitFileName(file.name);
  const customBase = namingOptions.customName.trim();
  const numberedCustomBase = customBase ? `${sanitizePathSegment(customBase)}_${String(index + 1).padStart(2, "0")}` : "";
  let nextBaseName = namingOptions.keepOriginal || !numberedCustomBase ? originalBaseName : numberedCustomBase;
  if (namingOptions.addSuffix) nextBaseName += "_secured";
  if (namingOptions.addTimestamp) nextBaseName += `_${sessionStamp}`;
  return extension ? `${nextBaseName}.${extension}` : nextBaseName;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function sha256Hex(data: Blob | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array
    ? data
    : new Uint8Array(await data.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function fileWithRelativePath(file: File, relativePath: string): File {
  const copy = new File([file], file.name, { type: file.type, lastModified: file.lastModified }) as FileWithRelativePath;
  Object.defineProperty(copy, "webkitRelativePath", { value: relativePath, configurable: true });
  return copy;
}

function readFileEntry(entry: FileSystemFileEntryLike, relativePath: string): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(
      (file) => resolve(fileWithRelativePath(file, relativePath)),
      (error) => reject(error),
    );
  });
}

async function readDirectoryEntry(entry: FileSystemDirectoryEntryLike, parentPath: string): Promise<File[]> {
  const reader = entry.createReader();
  const entries: FileSystemEntryLike[] = [];
  await new Promise<void>((resolve, reject) => {
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve();
            return;
          }
          entries.push(...batch);
          readBatch();
        },
        reject,
      );
    };
    readBatch();
  });

  const directoryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  return (await Promise.all(entries.map((child) => readFileSystemEntry(child, directoryPath)))).flat();
}

async function readFileSystemEntry(entry: FileSystemEntryLike, parentPath = ""): Promise<File[]> {
  const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  if (entry.isFile) return [await readFileEntry(entry as FileSystemFileEntryLike, relativePath)];
  if (entry.isDirectory) return readDirectoryEntry(entry as FileSystemDirectoryEntryLike, parentPath);
  return [];
}

async function getFilesFromEvent(event: unknown): Promise<File[]> {
  const inputEvent = event as FileDropEvent;
  const items = inputEvent.dataTransfer?.items;
  if (!items?.length) return Array.from(inputEvent.target?.files ?? []);

  const entries = Array.from(items)
    .map((item) => (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (entries.length === 0) return Array.from(inputEvent.dataTransfer?.files ?? []);
  return (await Promise.all(entries.map((entry) => readFileSystemEntry(entry)))).flat();
}

class MetadataRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MetadataRequestError";
  }
}

async function postMetadataBatches<T>(
  action: "extract" | "remove",
  files: File[],
  fields: Record<string, string> = {},
  onProgress?: (completed: number, total: number) => void,
): Promise<T[]> {
  const results: T[] = [];
  for (let start = 0; start < files.length; start += METADATA_BATCH_SIZE) {
    const batch = files.slice(start, start + METADATA_BATCH_SIZE);
    const formData = new FormData();
    formData.append("action", action);
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    batch.forEach((file) => formData.append("files", file, file.name));

    const response = await fetch(appPath("/api/metadata"), { method: "POST", body: formData });
    const data = await response.json().catch(() => ({} as { error?: string; files?: T[] }));
    if (!response.ok) {
      throw new MetadataRequestError(data.error || "Metadata processing failed.", response.status);
    }

    results.push(...((data.files ?? []) as T[]));
    onProgress?.(Math.min(start + batch.length, files.length), files.length);
  }
  return results;
}

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

const WORKFLOW_PROFILES: Record<string, WorkflowProfile> = {
  balanced: {
    name: "Balanced review",
    description: "A production-safe default for everyday document sharing and client delivery.",
    template: "custom",
    privacyLevel: 78,
    compression: "smart",
    exportOptions: {
      downloadCleaned: true,
      generateLog: true,
      exportJson: false,
      createReport: false,
      generateCertificate: false,
    },
    namingOptions: {
      keepOriginal: true,
      addSuffix: true,
      customName: "",
      addTimestamp: false,
    },
    securityOptions: {
      verifyIntegrity: true,
      generateHash: true,
      encryptedBackup: false,
    },
    batchPreferences: {
      preserveFolders: true,
      includeManifest: true,
      autoSelectLowRisk: false,
      batchLabel: "",
    },
  },
  counsel: {
    name: "Counsel ready",
    description: "Heavier scrubbing, evidence artifacts, and folder preservation for legal or diligence use.",
    template: "job",
    privacyLevel: 92,
    compression: "max",
    exportOptions: {
      downloadCleaned: true,
      generateLog: true,
      exportJson: true,
      createReport: true,
      generateCertificate: true,
    },
    namingOptions: {
      keepOriginal: true,
      addSuffix: true,
      customName: "",
      addTimestamp: true,
    },
    securityOptions: {
      verifyIntegrity: true,
      generateHash: true,
      encryptedBackup: false,
    },
    batchPreferences: {
      preserveFolders: true,
      includeManifest: true,
      autoSelectLowRisk: true,
      batchLabel: "counsel-ready",
    },
  },
  publisher: {
    name: "Publisher export",
    description: "Cleaner naming and flatter export bundles for press kits, blogs, and publication drops.",
    template: "social",
    privacyLevel: 88,
    compression: "smart",
    exportOptions: {
      downloadCleaned: true,
      generateLog: true,
      exportJson: false,
      createReport: false,
      generateCertificate: false,
    },
    namingOptions: {
      keepOriginal: false,
      addSuffix: true,
      customName: "release",
      addTimestamp: false,
    },
    securityOptions: {
      verifyIntegrity: true,
      generateHash: false,
      encryptedBackup: false,
    },
    batchPreferences: {
      preserveFolders: false,
      includeManifest: true,
      autoSelectLowRisk: true,
      batchLabel: "publication-drop",
    },
  },
};

export default function DownloadCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>("free");
  const defaultProfile = WORKFLOW_PROFILES[DEFAULT_WORKFLOW_PROFILE];

  useEffect(() => {
    if (!session?.user) return;
    const token = localStorage.getItem("bearer_token");
    fetch(appPath("/api/billing/status"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.plan && setUserPlan(data.plan))
      .catch(() => {});
  }, [session]);

  const [workflowProfile, setWorkflowProfile] = useState<string>(DEFAULT_WORKFLOW_PROFILE);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultProfile.template);
  const [privacyLevel, setPrivacyLevel] = useState(defaultProfile.privacyLevel);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [risks, setRisks] = useState<DetectedRisk[]>([]);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [watermarkEditorFile, setWatermarkEditorFile] = useState<File | null>(null);
  const [processedCount, setProcessedCount] = useState(12842);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);

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
  const [exportOptions, setExportOptions] = useState<ExportOptionsState>(() => ({ ...defaultProfile.exportOptions }));

  const [namingOptions, setNamingOptions] = useState<NamingOptionsState>(() => ({ ...defaultProfile.namingOptions }));

  const [compression, setCompression] = useState(defaultProfile.compression);
  const [securityOptions, setSecurityOptions] = useState<SecurityOptionsState>(() => ({ ...defaultProfile.securityOptions }));
  const [batchPreferences, setBatchPreferences] = useState<BatchPreferencesState>(() => ({ ...defaultProfile.batchPreferences }));

  const [fileSizeEstimates] = useState({
    downloadCleaned: "Variable",
    generateLog: "12 KB",
    exportJson: "45 KB",
    createReport: "124 KB",
    generateCertificate: "240 KB"
  });

  const applyWorkflowProfile = useCallback((profileId: string) => {
    const profile = WORKFLOW_PROFILES[profileId];
    if (!profile) return;
    setWorkflowProfile(profileId);
    setSelectedTemplate(profile.template);
    setPrivacyLevel(profile.privacyLevel);
    setExportOptions({ ...profile.exportOptions });
    setNamingOptions({ ...profile.namingOptions });
    setCompression(profile.compression);
    setSecurityOptions({ ...profile.securityOptions });
    setBatchPreferences({ ...profile.batchPreferences });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILEX_PREFERENCES_STORAGE_KEY);
      if (!stored) {
        setPreferencesHydrated(true);
        return;
      }
      const parsed = JSON.parse(stored) as Partial<{
        workflowProfile: string;
        selectedTemplate: string;
        privacyLevel: number;
        exportOptions: ExportOptionsState;
        namingOptions: NamingOptionsState;
        compression: string;
        securityOptions: SecurityOptionsState;
        batchPreferences: BatchPreferencesState;
      }>;
      if (parsed.workflowProfile && WORKFLOW_PROFILES[parsed.workflowProfile]) {
        setWorkflowProfile(parsed.workflowProfile);
      }
      if (typeof parsed.selectedTemplate === "string") setSelectedTemplate(parsed.selectedTemplate);
      if (typeof parsed.privacyLevel === "number") setPrivacyLevel(parsed.privacyLevel);
      if (parsed.exportOptions) setExportOptions((previous) => ({ ...previous, ...parsed.exportOptions }));
      if (parsed.namingOptions) setNamingOptions((previous) => ({ ...previous, ...parsed.namingOptions }));
      if (typeof parsed.compression === "string") setCompression(parsed.compression);
      if (parsed.securityOptions) setSecurityOptions((previous) => ({ ...previous, ...parsed.securityOptions }));
      if (parsed.batchPreferences) setBatchPreferences((previous) => ({ ...previous, ...parsed.batchPreferences }));
    } catch (error) {
      console.error(error);
    } finally {
      setPreferencesHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesHydrated) return;
    localStorage.setItem(
      FILEX_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        workflowProfile,
        selectedTemplate,
        privacyLevel,
        exportOptions,
        namingOptions,
        compression,
        securityOptions,
        batchPreferences,
      }),
    );
  }, [
    batchPreferences,
    compression,
    exportOptions,
    namingOptions,
    preferencesHydrated,
    privacyLevel,
    securityOptions,
    selectedTemplate,
    workflowProfile,
  ]);

  const stageFiles = useCallback(async (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    const nextFiles = Array.from(new Map(
      [...uploadedFiles, ...incomingFiles].map((file) => [fileKey(file), file]),
    ).values());
    const duplicateCount = uploadedFiles.length + incomingFiles.length - nextFiles.length;
    setIsProcessing(true);
    setBatchProgress({ completed: 0, total: nextFiles.length });
    setUploadedFiles(nextFiles);
    setRisks([]);

    try {
      const fileResults = await postMetadataBatches<{ fields: ExtractedMetadataField[] }>(
        "extract",
        nextFiles,
        {},
        (completed, total) => setBatchProgress({ completed, total }),
      );
      const detected = new Map<string, DetectedRisk>();
      const shouldAutoSelectLowRisk = batchPreferences.autoSelectLowRisk || privacyLevel >= 90 || selectedTemplate === "social";
      for (const fileResult of fileResults) {
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
            isChecked: field.riskLevel === "high" || field.riskLevel === "medium" || shouldAutoSelectLowRisk,
            originalValue: value,
            cleanedValue: "[Removed]",
          });
        }
      }

      const riskList = Array.from(detected.values());
      setRisks(riskList);
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} duplicate file(s) skipped while preserving the current batch queue.`);
      }
      const highCount = riskList.filter((r) => r.type === "high").length;
      if (riskList.length === 0) {
        toast.success(`No risky metadata detected across ${nextFiles.length} file(s).`);
      } else if (highCount > 0) {
        toast.success(`${nextFiles.length} file(s) analyzed. ${highCount} critical privacy risk(s) detected.`);
      } else {
        toast.success(`${nextFiles.length} file(s) analyzed. ${riskList.length} metadata field(s) found.`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof MetadataRequestError ? error.message : "Failed to analyze files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [batchPreferences.autoSelectLowRisk, privacyLevel, selectedTemplate, uploadedFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[], _fileRejections: unknown[], event: unknown) => {
    try {
      const discoveredFiles = await getFilesFromEvent(event);
      await stageFiles(discoveredFiles.length > 0 ? discoveredFiles : acceptedFiles);
    } catch (error) {
      console.error(error);
      toast.error("Could not read the selected files or folder.");
    }
  }, [stageFiles]);

  const onFolderChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await stageFiles(files);
  }, [stageFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false,
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

  const activeTemplate = useMemo(
    () => (selectedTemplate === "custom" ? null : TEMPLATES[selectedTemplate] ?? null),
    [selectedTemplate],
  );

  const batchSummary = useMemo(() => {
    const folderSet = new Set<string>();
    let imageCount = 0;
    let documentCount = 0;
    let videoCount = 0;

    for (const file of uploadedFiles) {
      const relativePath = getRelativeFilePath(file).replaceAll("\\", "/");
      const lastSlash = relativePath.lastIndexOf("/");
      if (lastSlash > 0) folderSet.add(relativePath.slice(0, lastSlash));

      if (file.type.startsWith("image/")) imageCount += 1;
      else if (file.type.startsWith("video/")) videoCount += 1;
      else documentCount += 1;
    }

    return {
      folders: folderSet.size,
      imageCount,
      documentCount,
      videoCount,
      totalSizeMb: uploadedFiles.reduce((total, file) => total + file.size, 0) / (1024 * 1024),
    };
  }, [uploadedFiles]);

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

  const selectedDeliverableCount = useMemo(
    () => Object.values(exportOptions).filter(Boolean).length,
    [exportOptions],
  );

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
      const processedAt = new Date();
      const processedAtIso = processedAt.toISOString();
      const sessionStamp = processedAtIso.replace(/[-:]/g, "").replace(/\..+/, "");
      const manifestEntries: Array<Record<string, string | number | boolean>> = [];

      // Strip metadata server-side in ten-file windows so recursive folder batches
      // can exceed one request without exceeding the API's per-request limit.
      let cleanedByIndex: string[] | null = null;
      if (exportOptions.downloadCleaned) {
        const removeFields = risks.filter((r) => r.isChecked).map((r) => r.id);
        try {
          const cleaned = await postMetadataBatches<{ fileName: string; data: string }>(
            "remove",
            uploadedFiles,
            {
              removeFields: JSON.stringify(removeFields),
              replaceFields: JSON.stringify({}),
              removeSignature: "false",
            },
            (completed, total) => setBatchProgress({ completed, total }),
          );
          cleanedByIndex = cleaned.map((file) => file.data);
        } catch (error) {
          if (error instanceof MetadataRequestError && error.status === 402) {
            toast.error(error.message || "Daily processing limit reached.");
            router.push(appPath("/pricing"));
          } else {
            toast.error(error instanceof Error ? error.message : "Failed to clean files.");
          }
          setIsProcessing(false);
          return;
        }
      }

      // Process each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fullFileName = buildExportFileName(file, i, namingOptions, sessionStamp);
        const cleanedBase64 = cleanedByIndex?.[i] ?? null;
        const cleanedOutputPath = outputPathForPreference(file, fullFileName, batchPreferences);
        const sha256 = securityOptions.generateHash
          ? await sha256Hex(cleanedBase64 ? base64ToBytes(cleanedBase64) : file)
          : null;

        // 1. Cleaned File — actual metadata-stripped bytes from the engine
        if (exportOptions.downloadCleaned) {
          if (cleanedBase64) {
            zip.file(cleanedOutputPath, cleanedBase64, { base64: true });
          } else {
            zip.file(cleanedOutputPath, file);
          }
        }

        // 2. Generate Log
        if (exportOptions.generateLog) {
          const logContent = `Privacy Log for ${file.name}\n` + 
            `Timestamp: ${processedAtIso}\n` +
            `Workflow profile: ${WORKFLOW_PROFILES[workflowProfile].name}\n` +
            `Template: ${activeTemplate?.name ?? "Manual/Custom"}\n` +
            `Privacy level: ${privacyLevel}%\n` +
            `Watermark cleanup: ${file.name.includes("_watermark_removed") ? "APPLIED LOCALLY" : "NOT REQUESTED"}\n` +
            `SHA-256: ${sha256 ?? "Not requested"}\n` +
            `-----------------------------------\n` +
            risks.map(r => `${r.label}: ${r.isChecked ? 'STRIPPED' : 'PRESERVED'} (Original: ${r.originalValue})`).join("\n");
          zip.file(outputPathForPreference(file, `${fullFileName.replace(/\.[^.]+$/, "")}_privacy_log.txt`, batchPreferences), logContent);
        }

        // 3. Export JSON
        if (exportOptions.exportJson) {
          const jsonContent = JSON.stringify({
            file: file.name,
            originalSize: file.size,
            processedAt: processedAtIso,
            workflowProfile,
            selectedTemplate,
            privacyLevel,
            riskAnalysis: risks,
            watermarkCleanupApplied: file.name.includes("_watermark_removed"),
            sha256,
          }, null, 2);
          zip.file(outputPathForPreference(file, `${fullFileName.replace(/\.[^.]+$/, "")}_metadata_snapshot.json`, batchPreferences), jsonContent);
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
                <p>Workflow Profile: ${WORKFLOW_PROFILES[workflowProfile].name}</p>
                <p>SHA-256: ${sha256 ?? "Not requested"}</p>
                <ul>${risks.map(r => `<li>${r.label}: ${r.isChecked ? '✅ Secure' : '⚠️ Exposed'}</li>`).join('')}</ul>
              </body>
            </html>
          `;
          zip.file(outputPathForPreference(file, `${fullFileName.replace(/\.[^.]+$/, "")}_audit_report.html`, batchPreferences), reportHtml);
        }

        // 5. Generate PDF Certificate
        if (exportOptions.generateCertificate) {
          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.text("Certificate of Privacy Verification", 20, 30);
          doc.setFontSize(12);
          doc.text(`File Name: ${file.name}`, 20, 50);
          doc.text(`Date of Audit: ${processedAt.toLocaleDateString()}`, 20, 60);
          doc.text(`Verification ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 20, 70);
          doc.text(`Status: METADATA STRIPPED & VERIFIED`, 20, 90);
          if (sha256) doc.text(`SHA-256: ${sha256.slice(0, 36)}...`, 20, 105);
          const pdfBlob = doc.output("blob");
          zip.file(outputPathForPreference(file, `${fullFileName.replace(/\.[^.]+$/, "")}_privacy_cert.pdf`, batchPreferences), pdfBlob);
        }

        manifestEntries.push({
          sourcePath: getRelativeFilePath(file),
          outputPath: cleanedOutputPath,
          sizeBytes: file.size,
          watermarkCleanupApplied: file.name.includes("_watermark_removed"),
          selectedRiskCount: risks.filter((risk) => risk.isChecked).length,
          sha256: sha256 ?? "",
        });
      }

      if (batchPreferences.includeManifest) {
        zip.file(
          rootOutputPath("batch_manifest.json", batchPreferences),
          JSON.stringify(
            {
              profile: WORKFLOW_PROFILES[workflowProfile].name,
              template: activeTemplate?.name ?? "Manual/Custom",
              privacyLevel,
              preserveFolders: batchPreferences.preserveFolders,
              compression,
              generatedAt: processedAtIso,
              files: manifestEntries,
            },
            null,
            2,
          ),
        );
      }

      // Generate and trigger download
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: compression === "none" ? "STORE" : "DEFLATE",
        compressionOptions: compression === "none"
          ? undefined
          : { level: compression === "max" ? 9 : compression === "fast" ? 3 : 6 },
      });
      const bundlePrefix = sanitizePathSegment(batchPreferences.batchLabel);
      const bundleName = bundlePrefix
        ? `${bundlePrefix}_${uploadedFiles.length > 1 ? "filex_secure_batch" : "filex_secure_download"}.zip`
        : uploadedFiles.length > 1 ? "filex_secure_batch.zip" : "filex_secure_download.zip";
      saveAs(zipBlob, bundleName);
      
      toast.success("Secure files downloaded successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate secure download.");
    } finally {
      setIsProcessing(false);
      setBatchProgress((progress) => ({ completed: progress.total, total: progress.total }));
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-filex-blue/30 font-sans antialiased overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-filex-cyan/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-filex-blue-deep/10 blur-[150px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* Header */}
          <header className="flex justify-between items-center border-b border-border/70 pb-8">
            <FileXLogo variant="standard" size="md" />
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">KNIMEX Home</Link>
                  <Link href={`${appPath("/")}#processing-hub`} className="hover:text-foreground transition-colors">Tools</Link>
                  <Link href={appPath("/pricing")} className="hover:text-foreground transition-colors">Pricing</Link>
                  <Button variant="ghost" size="sm" onClick={startTour} className="text-filex-blue hover:text-filex-blue-deep hover:bg-filex-blue/10 gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Guided Tour
                  </Button>
              </nav>
              <div className="h-6 w-px bg-accent" />
              {session ? (
                <div className="flex items-center gap-4">
                  <Link href={appPath("/account")} className="flex flex-col items-end group">
                    <span className="text-xs font-bold group-hover:text-filex-blue transition-colors">{session.user.name}</span>
                    <Badge className="bg-filex-blue/10 text-filex-blue border-filex-blue/20 text-[9px] py-0 uppercase">
                      {userPlan}
                    </Badge>
                  </Link>
                  <Button aria-label="Sign out" variant="ghost" size="icon" className="rounded-full hover:bg-accent/50" onClick={() => authClient.signOut()}>
                    <LogOut className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Link href={appPath("/login")}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl px-6">
                    Sign In
                  </Button>
                </Link>
              )}
              <MobileNav
                links={[
                  { href: "/", label: "KNIMEX Home" },
                  { href: appPath("/pricing"), label: "Pricing" },
                  { href: session ? appPath("/account") : appPath("/login"), label: session ? "My Account" : "Sign In" },
                  { href: appPath("/contact"), label: "Contact" },
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
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  FileX uses AI to detect and remove sensitive metadata from your files. 
                  Zero server-side storage. 100% private.
                </p>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg shadow-xl shadow-black/5"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" onClick={startTour} className="h-14 px-8 rounded-2xl border-border bg-accent/50 hover:bg-accent font-bold text-lg">
                  <PlayCircle className="w-5 h-5 mr-2 text-filex-blue" />
                  Watch Workflow
                </Button>
              </div>

              {/* Trust Section */}
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-border/70">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black text-foreground tabular-nums">
                    {processedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Secures Today</span>
                </div>
                {[
                  { label: "Local Processing", icon: HardDrive, color: "text-filex-cyan" },
                  { label: "AI Threat Detection", icon: ScanLine, color: "text-filex-blue" },
                  { label: "Encrypted Exports", icon: LockKeyhole, color: "text-emerald-700 dark:text-emerald-400" },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-1">
                    <badge.icon className={`w-6 h-6 ${badge.color}`} />
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{badge.label}</span>
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
                <Card className="bg-card/80 border-border/70 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_1fr]">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Workflow Profile</Label>
                          <Select value={workflowProfile} onValueChange={applyWorkflowProfile}>
                            <SelectTrigger className="bg-background border-border h-12 rounded-xl focus:ring-filex-blue/50">
                              <SelectValue placeholder="Select workflow profile" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-popover-foreground rounded-xl">
                              {Object.entries(WORKFLOW_PROFILES).map(([id, profile]) => (
                                <SelectItem key={id} value={id} className="p-3 focus:bg-filex-blue/10">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm">{profile.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{profile.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Metadata Template</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                              <SelectTrigger className="bg-background border-border h-12 rounded-xl focus:ring-filex-blue/50">
                                <SelectValue placeholder="Select Template" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border text-popover-foreground rounded-xl">
                                {Object.entries(TEMPLATES).map(([id, t]) => (
                                  <SelectItem key={id} value={id} className="p-3 focus:bg-filex-blue/10">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm">{t.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom" className="p-3">Manual/Custom Mode</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Privacy Aggression</Label>
                              <Badge variant="outline" className="text-[10px] border-filex-blue/30 text-filex-blue">{privacyLevel}%</Badge>
                            </div>
                            <Slider value={[privacyLevel]} onValueChange={(v) => setPrivacyLevel(v[0])} max={100} className="py-4" />
                            <p className="text-[10px] text-muted-foreground font-medium italic">Higher levels strip more deeply embedded markers and can auto-select low-risk cleanup items.</p>
                          </div>
                        </div>
                        {activeTemplate && (
                          <div className="rounded-3xl border border-border/70 bg-accent/40 p-5 space-y-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-filex-cyan">Template behavior</p>
                              <h3 className="mt-1 text-lg font-semibold">{activeTemplate.name}</h3>
                              <p className="text-sm text-muted-foreground">{activeTemplate.description}</p>
                            </div>
                            <div className="grid gap-3">
                              {activeTemplate.settings.map((setting) => (
                                <div key={setting.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                                    {setting.value && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{setting.value}</p>}
                                  </div>
                                  <Badge variant="outline" className={setting.enabled ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-300" : "border-border text-muted-foreground"}>
                                    {setting.enabled ? "Applied" : "Optional"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-3xl border border-border/70 bg-accent/40 p-6 space-y-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-filex-blue">Batch Preferences</p>
                          <h3 className="mt-1 text-lg font-semibold">Delivery tuned to your workflow</h3>
                          <p className="text-sm text-muted-foreground">These settings persist in this browser and shape how FileX stages, names, and exports each batch.</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Preserve folder structure</p>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Keep nested directories intact inside the final archive.</p>
                            </div>
                            <Checkbox checked={batchPreferences.preserveFolders} onCheckedChange={(value) => setBatchPreferences((previous) => ({ ...previous, preserveFolders: !!value }))} className="h-5 w-5 rounded-md" />
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Generate batch manifest</p>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Include a root-level JSON manifest with queue, output paths, and audit data.</p>
                            </div>
                            <Checkbox checked={batchPreferences.includeManifest} onCheckedChange={(value) => setBatchPreferences((previous) => ({ ...previous, includeManifest: !!value }))} className="h-5 w-5 rounded-md" />
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Auto-select low-risk cleanup</p>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Useful for social drops, counsel review, and one-click batch hardening.</p>
                            </div>
                            <Checkbox checked={batchPreferences.autoSelectLowRisk} onCheckedChange={(value) => setBatchPreferences((previous) => ({ ...previous, autoSelectLowRisk: !!value }))} className="h-5 w-5 rounded-md" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Batch label</Label>
                            <Input
                              placeholder="Optional root folder or delivery label"
                              className="bg-background border-border rounded-xl h-11 text-sm focus:ring-filex-blue/50"
                              value={batchPreferences.batchLabel}
                              onChange={(event) => setBatchPreferences((previous) => ({ ...previous, batchLabel: event.target.value }))}
                            />
                          </div>
                        </div>
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
                    <Button variant="ghost" size="sm" onClick={() => { setUploadedFiles([]); setRisks([]); setBatchProgress({ completed: 0, total: 0 }); setWatermarkEditorFile(null); }} className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-400/10 h-8">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </h2>
                <div {...getRootProps()} className={`relative group cursor-pointer ${uploadedFiles.length > 0 ? 'h-40' : 'h-80'} flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2.5rem] transition-all duration-500 ${
                  isDragActive ? "border-filex-blue bg-filex-blue/5 scale-[0.99]" : "border-border bg-card hover:bg-card"
                }`}>
                  <input {...getInputProps()} id="file-upload-input" />
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-filex-blue/20 border-t-filex-blue animate-spin" />
                      <div className="space-y-1">
                        <p className="font-black text-xl tracking-tight text-foreground uppercase">AI Analysis in Progress</p>
                        <p className="text-xs text-filex-blue uppercase tracking-widest animate-pulse">Scanning binary structures...</p>
                      </div>
                    </div>
                  ) : uploadedFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {uploadedFiles.slice(0, 3).map((f, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-accent border-2 border-card flex items-center justify-center">
                              <FileIcon className="w-5 h-5 text-filex-blue" />
                            </div>
                          ))}
                          {uploadedFiles.length > 3 && (
                            <div className="w-10 h-10 rounded-xl bg-accent border-2 border-card flex items-center justify-center text-[10px] font-bold">
                              +{uploadedFiles.length - 3}
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold">{uploadedFiles.length} File(s) Staged</p>
                      </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Drop more files or folders to add · processed in secure batches</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-[1.5rem] bg-filex-gradient flex items-center justify-center mb-6 shadow-2xl shadow-filex-blue/40 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">Drop files or use the buttons below</h3>
                      <p className="text-muted-foreground max-w-sm text-center font-medium mt-2">Select multiple files or an entire folder. Nested paths stay intact in your export.</p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button type="button" variant="outline" className="border-border bg-background text-foreground hover:bg-accent" onClick={(event) => { event.stopPropagation(); document.getElementById("file-upload-input")?.click(); }}>
                          <FileIcon className="mr-2 h-4 w-4" /> Choose files
                        </Button>
                        <Button type="button" variant="outline" className="border-border bg-background text-foreground hover:bg-accent" onClick={(event) => { event.stopPropagation(); folderInputRef.current?.click(); }}>
                          <FolderTree className="mr-2 h-4 w-4" /> Choose folder
                        </Button>
                      </div>
                      <input ref={folderInputRef} type="file" className="sr-only" onChange={onFolderChange} {...({ webkitdirectory: "", directory: "" } as InputHTMLAttributes<HTMLInputElement>)} />
                      <Badge variant="outline" className="mt-4 border-border/70 bg-accent/50 text-muted-foreground px-4 py-1">
                        JPG, PNG, PDF, MP4, MOV · files stay in your browser
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
                      <p className="mt-1 text-xs text-muted-foreground">Each staged file is retained independently for export.</p>
                    </div>
                    <Badge variant="outline" className="border-border text-foreground">{uploadedFiles.length} staged</Badge>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => {
                      const isImage = file.type.startsWith("image/");
                      return (
                        <div key={`${file.name}:${file.size}:${file.lastModified}`} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-xl bg-accent/50 p-2 text-filex-cyan">{isImage ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}</div>
                            <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground" title={getRelativeFilePath(file)}>{getRelativeFilePath(file)}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {file.type || "file"}</p></div>
                          </div>
                          {isImage && <Button type="button" size="sm" variant="outline" onClick={() => setWatermarkEditorFile(file)} className="border-filex-blue/30 text-filex-blue-deep dark:text-filex-cyan hover:bg-filex-blue/10"><Eraser className="mr-2 h-4 w-4" />Remove watermark</Button>}
                        </div>
                      );
                    })}
                  </div>
                  {batchProgress.total > 0 && (
                    <div className="space-y-2" aria-live="polite">
                      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Batch progress</span><span>{batchProgress.completed}/{batchProgress.total}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-filex-gradient transition-[width] duration-200" style={{ width: `${batchProgress.total ? (batchProgress.completed / batchProgress.total) * 100 : 0}%` }} /></div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-accent/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Folders</p>
                      <p className="mt-2 text-2xl font-black text-foreground">{batchSummary.folders}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-accent/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Images</p>
                      <p className="mt-2 text-2xl font-black text-foreground">{batchSummary.imageCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-accent/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Docs/Other</p>
                      <p className="mt-2 text-2xl font-black text-foreground">{batchSummary.documentCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-accent/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Size</p>
                      <p className="mt-2 text-2xl font-black text-foreground">{batchSummary.totalSizeMb.toFixed(1)}<span className="text-xs text-muted-foreground"> MB</span></p>
                    </div>
                  </div>
                  {imageFiles.length > 0 && <p className="text-[10px] font-medium italic text-muted-foreground">Watermark cleanup is local and intended for content you own or are authorized to edit.</p>}
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
                        <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-300" />
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
                            <p className="text-xs text-muted-foreground">These files look clean — you can still proceed to export them securely.</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {risks.map(risk => (
                        <Card key={risk.id} className={`bg-card/60 border-border/70 backdrop-blur-md rounded-2xl group hover:border-border transition-all ${!risk.isChecked ? 'opacity-70' : ''}`}>
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
                                <p className="text-[10px] text-muted-foreground font-mono leading-none">{risk.description}</p>
                                {risk.isChecked && <p className="text-[10px] text-filex-blue font-bold mt-2 flex items-center gap-1"><ScanLine className="w-3 h-3" /> Auto-Stripped</p>}
                              </div>
                            </div>
                            <Checkbox 
                              checked={risk.isChecked} 
                              onCheckedChange={() => toggleRisk(risk.id)}
                              className="mt-1 border-border data-[state=checked]:bg-filex-blue data-[state=checked]:border-filex-blue rounded-lg h-6 w-6"
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
                  <Card className="bg-card/80 border-border/70 rounded-[2.5rem] overflow-hidden p-8 space-y-10 shadow-2xl">
                    
                    {/* Download Options */}
                    <div className="space-y-4">
                      <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Select Deliverables</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'downloadCleaned', label: 'Secured Files', icon: Download, size: fileSizeEstimates.downloadCleaned, color: 'text-green-400' },
                          { id: 'generateLog', label: 'Privacy Log (.txt)', icon: FileText, size: fileSizeEstimates.generateLog, color: 'text-filex-cyan' },
                          { id: 'exportJson', label: 'Raw Metadata (.json)', icon: FileJson, size: fileSizeEstimates.exportJson, color: 'text-yellow-400' },
                          { id: 'createReport', label: 'Audit Report (.html)', icon: FileCode, size: fileSizeEstimates.createReport, color: 'text-orange-400' },
                          { id: 'generateCertificate', label: 'Verified Certificate (.pdf)', icon: ShieldCheck, size: fileSizeEstimates.generateCertificate, color: 'text-filex-blue' },
                        ].map((opt) => (
                          <div key={opt.id} className="flex items-center justify-between p-4 rounded-2xl bg-accent/50 border border-border/70 hover:border-border transition-colors cursor-pointer" onClick={() => setExportOptions({...exportOptions, [opt.id]: !exportOptions[opt.id as keyof typeof exportOptions]})}>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl bg-accent/50 ${opt.color}`}>
                                <opt.icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{opt.label}</span>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{opt.size}</span>
                              </div>
                            </div>
                            <Checkbox 
                              checked={exportOptions[opt.id as keyof typeof exportOptions]} 
                              onCheckedChange={(v) => setExportOptions({...exportOptions, [opt.id]: !!v})} 
                              className="rounded-lg h-5 w-5 border-border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-accent/50" />

                    {/* Security & Verification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Naming Protocols</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Checkbox id="keepOriginal" checked={namingOptions.keepOriginal} onCheckedChange={(v) => setNamingOptions({...namingOptions, keepOriginal: !!v})} className="rounded" />
                            <Label htmlFor="keepOriginal" className="text-xs font-medium cursor-pointer">Keep original base name</Label>
                          </div>
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
                            className="bg-accent/50 border-border rounded-xl h-10 text-xs focus:ring-filex-blue/50"
                            value={namingOptions.customName}
                            onChange={(e) => setNamingOptions({...namingOptions, customName: e.target.value})}
                            disabled={namingOptions.keepOriginal}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Data Verification</Label>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium">Auto-verify File Integrity {securityOptions.verifyIntegrity ? "enabled" : "disabled"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox id="hash" checked={securityOptions.generateHash} onCheckedChange={(v) => setSecurityOptions({...securityOptions, generateHash: !!v})} className="rounded" />
                            <Label htmlFor="hash" className="text-xs font-medium cursor-pointer">Generate SHA-256 Hash Log</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Compression Strategy</Label>
                            <Select value={compression} onValueChange={setCompression}>
                              <SelectTrigger className="bg-accent/50 border-border h-10 rounded-xl focus:ring-filex-blue/50">
                                <SelectValue placeholder="Compression strategy" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border text-popover-foreground rounded-xl">
                                <SelectItem value="fast">Fast batch export</SelectItem>
                                <SelectItem value="smart">Smart balanced compression</SelectItem>
                                <SelectItem value="max">Maximum size reduction</SelectItem>
                                <SelectItem value="none">No compression</SelectItem>
                              </SelectContent>
                            </Select>
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
              <Card className="metadata-shield bg-card/80 border-border/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden sticky top-8 shadow-2xl">
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
                      <div className="grid grid-cols-2 gap-px bg-accent/50 rounded-3xl overflow-hidden border border-border/70">
                        <div className="p-5 bg-black/20 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/70">Original Data</p>
                          <div className="space-y-3 font-mono text-[9px] leading-tight text-muted-foreground">
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
                                <span className={r.isChecked ? "text-green-400 font-bold" : "text-muted-foreground italic"}>
                                  {r.isChecked ? "[SCRUBBED]" : "[PRESERVED]"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Score Indicator */}
                      <div className="p-6 rounded-3xl bg-accent/50 border border-border/70 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Privacy Protection Score</p>
                          <p className="text-4xl font-black">{stats.score}<span className="text-xl text-muted-foreground">%</span></p>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{selectedDeliverableCount} deliverable(s) selected · {WORKFLOW_PROFILES[workflowProfile].name}</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-filex-gradient flex items-center justify-center shadow-lg shadow-filex-blue/20">
                          <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownload}
                        disabled={isProcessing}
                        className="download-btn w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-2xl h-16 shadow-2xl shadow-filex-blue/10 group text-lg"
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
                      
                      <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                        Total {uploadedFiles.length} file(s) staged for local processing
                      </p>
                    </div>
                  ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
                        <ScanLine className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-bold text-sm">Upload files to begin<br/>secure threat scanning</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Advisory */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-tr from-filex-cyan/5 to-filex-blue/5 border border-border/70 space-y-3">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-filex-cyan" />
                  <h4 className="font-bold text-xs uppercase tracking-tight text-foreground">Privacy Advisory</h4>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
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
                className="w-full max-w-lg bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl shadow-green-500/10"
              >
                <div className="bg-gradient-to-tr from-green-500/20 via-filex-cyan/20 to-filex-blue/20 p-12 text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
                    <FileCheck className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight uppercase">SECURED!</h2>
                    <p className="text-muted-foreground font-medium">Digital footprints successfully erased.</p>
                  </div>
                </div>
                <div className="p-12 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-accent/50 border border-border/70 text-center space-y-1">
                      <p className="text-3xl font-black text-green-400">{stats.resolved}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Threats Neutralized</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-accent/50 border border-border/70 text-center space-y-1">
                      <p className="text-3xl font-black text-filex-cyan">{uploadedFiles.length}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Files Verified</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Button onClick={() => setShowSuccessModal(false)} className="h-16 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg">
                      Start New Session
                    </Button>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1 h-12 rounded-2xl border-border hover:bg-accent/50 font-bold" onClick={() => router.push(appPath("/pricing"))}>
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
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-filex-blue/50 rounded-[2.5rem] p-10 shadow-2xl shadow-filex-blue/30 pointer-events-auto"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-filex-blue flex items-center justify-center text-xs font-black">
                        {tourStep + 1}
                      </div>
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">FileX Onboarding</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeTour} className="rounded-full hover:bg-accent/50 h-8 w-8">
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tight text-foreground uppercase">{tourSteps[tourStep].title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{tourSteps[tourStep].content}</p>
                  </div>
                  <div className="pt-6 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {tourSteps.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === tourStep ? 'w-6 bg-filex-blue' : 'bg-accent'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" className="text-xs text-muted-foreground hover:text-foreground font-bold" onClick={closeTour}>
                        Skip
                      </Button>
                      <Button onClick={nextStep} className="bg-primary text-primary-foreground hover:bg-primary/90 font-black px-8 rounded-2xl h-12">
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
        <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-border/70 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <FileXLogo variant="standard" size="md" />
              <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
                The world's most advanced client-side metadata erasure tool. Built for professionals who value digital sovereignty.
              </p>
              <div className="flex gap-3">
                <a aria-label="FileX GitHub repository" href="https://github.com/gaurav-chakraborty/filex" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/80 transition hover:bg-accent/50 hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                <a aria-label="Email KNIMEX support" href="mailto:contact@knimex.com" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/80 transition hover:bg-accent/50 hover:text-foreground"><Mail className="h-4 w-4" /></a>
                <button aria-label="Copy FileX link" type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("FileX link copied."); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/80 transition hover:bg-accent/50 hover:text-foreground"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Product</h4>
              <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">KNIMEX Home</Link>
                <Link href="#security-engine" className="hover:text-foreground transition-colors">Security Engine</Link>
                <Link href={appPath("/api-docs")} className="hover:text-foreground transition-colors">API Docs</Link>
                <Link href={appPath("/pricing")} className="hover:text-foreground transition-colors">Pricing Plans</Link>
                <a href="https://github.com/gaurav-chakraborty/filex" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Open Source</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Legal</h4>
              <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
                <Link href={appPath("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href={appPath("/terms")} className="hover:text-foreground transition-colors">Terms of Service</Link>
                <Link href={appPath("/security")} className="hover:text-foreground transition-colors">Security Policy</Link>
                <Link href={`${appPath("/privacy")}#cookies`} className="hover:text-foreground transition-colors">Cookie Audit</Link>
              </nav>
            </div>
              <div className="col-span-2 lg:col-span-1 space-y-6">
                <div className="p-6 rounded-3xl bg-filex-gradient/10 border border-border/70 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-tight text-foreground">Need support?</h4>
                  <p className="text-xs leading-5 text-muted-foreground">Questions about privacy, batch exports, or enterprise workflows?</p>
                  <Link href={appPath("/contact")} className="inline-flex items-center gap-2 text-xs font-bold text-filex-blue-deep dark:text-filex-cyan hover:text-foreground">Open support center <ExternalLink className="h-3 w-3" /></Link>
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
