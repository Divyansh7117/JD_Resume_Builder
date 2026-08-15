"use client";

import React, { useState, useEffect, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { motion, AnimatePresence } from "motion/react";
import ResumeDocument from "@/components/ResumeDocument";
import { extractCleanName } from "@/lib/parseResume";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { TailoredOutput, ResumeData } from "@/types";

interface ApiResponse {
  tailored: TailoredOutput;
  originalResume: ResumeData;
}

interface TemplateMeta {
  id: string;
  name: string;
  color: string;
  badge: string;
  category: string;
  desc: string;
  layoutType: "single-column" | "sidebar" | "executive" | "dark-cyber" | "compact" | "academic";
}

const TEMPLATES: TemplateMeta[] = [
  {
    id: "ats-standard",
    name: "ATS Classic Standard",
    color: "#3654FF",
    badge: "100% ATS Safe",
    category: "Software & Systems",
    desc: "Single-column clean serif / sans layout with clear section dividers and bold job titles.",
    layoutType: "single-column",
  },
  {
    id: "modern-sidebar",
    name: "Modern Tech Sidebar",
    color: "#00F0FF",
    badge: "Two-Column",
    category: "Full-Stack & Product",
    desc: "Vibrant left sidebar for contact & technical skills; spacious right side for impact bullets.",
    layoutType: "sidebar",
  },
  {
    id: "executive-leadership",
    name: "Executive Leadership",
    color: "#F59E0B",
    badge: "Executive",
    category: "Tech Leads & PMs",
    desc: "Sophisticated gold top accent border with executive summary box and leadership metrics.",
    layoutType: "executive",
  },
  {
    id: "dark-cyber",
    name: "Creative Dark Theme",
    color: "#10B981",
    badge: "Dark Mode",
    category: "UI/UX & Creative",
    desc: "High-contrast dark charcoal paper styling with glowing emerald skill badges.",
    layoutType: "dark-cyber",
  },
  {
    id: "compact-dense",
    name: "Compact One-Page",
    color: "#8B5CF6",
    badge: "Dense Format",
    category: "Senior Engineers",
    desc: "Space-efficient, high-density format designed to fit extensive experience on 1 page.",
    layoutType: "compact",
  },
  {
    id: "academic-research",
    name: "Academic & AI Research",
    color: "#38BDF8",
    badge: "Research",
    category: "AI/ML & Data Science",
    desc: "Formal publication-styled layout highlighting ML models, research papers, and technical depth.",
    layoutType: "academic",
  },
];



function TemplateMiniaturePreview({ template }: { template: TemplateMeta }) {
  if (template.layoutType === "sidebar") {
    return (
      <div className="w-full h-40 bg-[#FAF9F6] text-[#0F1419] rounded-lg overflow-hidden border border-white/20 shadow-inner grid grid-cols-12 text-[7px] leading-tight select-none pointer-events-none">
        <div className="col-span-4 bg-[#3654FF] text-white p-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="font-bold text-[8px]">ALEX R.</div>
            <div className="opacity-80 text-[6px]">San Francisco, CA</div>
            <div className="pt-1 border-t border-white/20 space-y-1">
              <div className="font-bold uppercase text-[5px]">Skills</div>
              <div className="flex flex-wrap gap-0.5">
                <span className="px-1 py-0.5 rounded bg-white/20 text-[5px]">React</span>
                <span className="px-1 py-0.5 rounded bg-white/20 text-[5px]">Node</span>
                <span className="px-1 py-0.5 rounded bg-white/20 text-[5px]">SQL</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-8 p-2 space-y-1.5 bg-white">
          <div className="font-bold text-[8px] text-[#3654FF]">Senior Full-Stack Engineer</div>
          <div className="space-y-1">
            <div className="font-bold text-[#0F1419]">TechCorp • 2022 - Present</div>
            <div className="text-[#4B5563] space-y-0.5">
              <div className="flex items-center gap-1">• Built scalable web microservices.</div>
              <div className="flex items-center gap-1">• Optimized Postgres database latency.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template.layoutType === "executive") {
    return (
      <div className="w-full h-40 bg-[#FAF9F6] text-[#0F1419] rounded-lg overflow-hidden border-t-4 border-[#F59E0B] border-x border-b border-white/20 shadow-inner p-2.5 space-y-1.5 text-[7px] leading-tight select-none pointer-events-none">
        <div className="flex justify-between items-start border-b border-gray-200 pb-1">
          <div>
            <div className="font-bold text-[8px] text-[#0F1419]">DAVID MILLER</div>
            <div className="text-[6px] font-bold text-[#F59E0B] uppercase">Lead Product Manager</div>
          </div>
          <div className="text-[6px] text-gray-500">Austin, TX</div>
        </div>
        <div className="bg-amber-50/50 p-1 rounded border-l-2 border-[#F59E0B] text-[6px] text-gray-700 italic">
          Executive summary driving 0→1 business growth and engineering metrics.
        </div>
        <div className="space-y-1">
          <div className="font-bold text-[6.5px] uppercase border-b border-gray-200 pb-0.5 text-gray-800">Experience</div>
          <div className="flex justify-between font-bold">
            <span>Product Owner • PW Store</span>
            <span className="text-[#F59E0B]">2022 - Present</span>
          </div>
          <div className="text-gray-600 space-y-0.5">
            <div>• Scaled e-commerce platform to ₹200Cr+ revenue.</div>
            <div>• Optimized checkout conversion from 1.7% to 5%.</div>
          </div>
        </div>
      </div>
    );
  }

  if (template.layoutType === "dark-cyber") {
    return (
      <div className="w-full h-40 bg-[#0F141C] text-[#E2E8F0] rounded-lg overflow-hidden border border-[#10B981]/40 shadow-inner p-2.5 space-y-1.5 text-[7px] leading-tight select-none pointer-events-none font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-1">
          <div>
            <div className="font-bold text-[8px] text-[#10B981]">{"// "}ELENA ROSTOVA</div>
            <div className="text-[6px] text-[#94A3B8]">Creative Technologist</div>
          </div>
          <div className="text-[6px] text-[#10B981]">REMOTE</div>
        </div>
        <div className="space-y-1">
          <div className="text-[6.5px] text-[#10B981] font-bold uppercase">&gt; EXPERIENCE</div>
          <div className="flex justify-between font-bold text-white">
            <span>Creative Engineer • Nexus</span>
            <span className="text-[#94A3B8]">2021 - Present</span>
          </div>
          <div className="text-gray-400 space-y-0.5">
            <div>- Built interactive 3D WebGL interfaces.</div>
            <div>- Engineered component design system.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="px-1 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[5px]">Three.js</span>
          <span className="px-1 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[5px]">React</span>
          <span className="px-1 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[5px]">TypeScript</span>
        </div>
      </div>
    );
  }

  if (template.layoutType === "compact") {
    return (
      <div className="w-full h-40 bg-[#FAF9F6] text-[#0F1419] rounded-lg overflow-hidden border border-[#8B5CF6]/30 shadow-inner p-2 space-y-1 text-[6.5px] leading-tight select-none pointer-events-none">
        <div className="text-center border-b border-gray-200 pb-1">
          <div className="font-bold text-[8px] text-[#8B5CF6]">MARCUS VANCE</div>
          <div className="text-[5.5px] text-gray-500">marcus@example.com | Seattle, WA | github.com/mvance</div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-[6px] text-[#8B5CF6] uppercase border-b border-gray-200">Experience</div>
          <div className="flex justify-between font-bold">
            <span>Senior DevOps Engineer • CloudGrid</span>
            <span className="text-gray-500">2020 - Present</span>
          </div>
          <div className="text-gray-600 space-y-0.5">
            <div>• Managed multi-region Kubernetes clusters with 99.99% uptime.</div>
            <div>• Cut CI/CD build duration from 25 min to 4 min.</div>
          </div>
        </div>
        <div className="pt-0.5 border-t border-gray-200 text-gray-700">
          <span className="font-bold text-[#8B5CF6]">Skills: </span>Kubernetes, AWS, Terraform, Docker, Python, Bash
        </div>
      </div>
    );
  }

  if (template.layoutType === "academic") {
    return (
      <div className="w-full h-40 bg-[#FAF9F6] text-[#0F1419] rounded-lg overflow-hidden border border-[#38BDF8]/40 shadow-inner p-2.5 space-y-1.5 text-[7px] leading-tight select-none pointer-events-none">
        <div className="text-center border-b border-gray-200 pb-1">
          <div className="font-serif font-bold text-[8px] text-[#0F1419]">DR. ARJUN PATEL</div>
          <div className="text-[6px] text-gray-500">AI Research Scientist • Boston, MA</div>
        </div>
        <div className="space-y-1">
          <div className="font-serif font-bold text-[6.5px] text-[#0284C7] uppercase border-b border-gray-200">Research & Publications</div>
          <div className="text-gray-700">
            <div className="font-bold text-[#0F1419]">Transformer Attention Pruning in Multi-Modal Models</div>
            <div className="text-gray-500 text-[6px]">Neural Information Processing Systems (NeurIPS)</div>
          </div>
          <div className="font-serif font-bold text-[6.5px] text-[#0284C7] uppercase border-b border-gray-200 pt-0.5">Experience</div>
          <div className="text-gray-600">
            <div>• Trained LLMs using PyTorch and DDP across 128 GPUs.</div>
          </div>
        </div>
      </div>
    );
  }

  // Default: ATS Standard Single-Column
  return (
    <div className="w-full h-40 bg-[#FAF9F6] text-[#0F1419] rounded-lg overflow-hidden border border-gray-200 shadow-inner p-2.5 space-y-1.5 text-[7px] leading-tight select-none pointer-events-none">
      <div className="text-center border-b border-gray-300 pb-1">
        <div className="font-bold text-[8.5px] text-[#0F1419] tracking-wider">ALEX RIVERA</div>
        <div className="text-[6px] text-gray-600 mt-0.5">alex@example.com • (555) 019-2834 • San Francisco, CA</div>
      </div>
      <div className="space-y-1">
        <div className="font-bold text-[6.5px] uppercase tracking-wider text-[#0F1419] border-b border-gray-300 pb-0.5">
          Professional Experience
        </div>
        <div className="flex justify-between font-bold text-[#0F1419]">
          <span>Senior Full-Stack Engineer • TechCorp</span>
          <span className="text-gray-600">2022 - Present</span>
        </div>
        <div className="text-gray-700 space-y-0.5 pl-1.5">
          <div>• Architected real-time web platform using Next.js & React.</div>
          <div>• Built high-throughput RESTful APIs serving 100k+ DAU.</div>
        </div>
      </div>
      <div className="pt-1 border-t border-gray-300 text-gray-700">
        <span className="font-bold text-[#0F1419]">Skills: </span>TypeScript, React, Next.js, Node.js, REST APIs, Git
      </div>
    </div>
  );
}

export default function AppPage() {
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("ats-standard");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [diffFilter, setDiffFilter] = useState<"all" | "matched" | "partial" | "missing">("all");
  const [matrixViewMode, setMatrixViewMode] = useState<"grid" | "tags">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diff" | "pdf">("diff");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // File Upload States
  const [uploadingJd, setUploadingJd] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const canSubmit = jdText.trim().length > 0 && resumeText.trim().length > 0 && !loading;



  function clearAll() {
    setJdText("");
    setResumeText("");
    setJdFileName(null);
    setResumeFileName(null);
    setError(null);
    setResult(null);
    setPdfPreviewUrl(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: "jd" | "resume") {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJd = target === "jd";
    if (isJd) {
      setUploadingJd(true);
      setJdFileName(null);
    } else {
      setUploadingResume(true);
      setResumeFileName(null);
    }

    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Couldn't read that file. If it's a scanned/image PDF, please paste the text manually.");
        return;
      }

      if (isJd) {
        setJdText(data.text);
        setJdFileName(file.name);
      } else {
        setResumeText(data.text);
        setResumeFileName(file.name);
      }
    } catch {
      setError("Couldn't read that file. Please try pasting raw text instead.");
    } finally {
      if (isJd) setUploadingJd(false);
      else setUploadingResume(false);
      e.target.value = "";
    }
  }

  async function generatePdfBlobUrl(tailored: TailoredOutput, originalResume: ResumeData, tmplId: string) {
    const contactInfo = originalResume.contact;
    const name = extractCleanName(contactInfo?.name || "Your Name");
    const contactParts = [
      contactInfo?.email,
      contactInfo?.phone,
      contactInfo?.location,
      ...(contactInfo?.links || []),
    ].filter(Boolean);

    const contactStr = contactParts.join(" • ");

    const doc = (
      <ResumeDocument
        name={name}
        contact={contactStr}
        summary={tailored.rewritten_summary}
        experience={tailored.rewritten_experience}
        projects={originalResume.sections.projects}
        education={originalResume.sections.education}
        certifications={originalResume.sections.certifications}
        skills={tailored.rewritten_skills}
        templateId={tmplId}
      />
    );

    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  useEffect(() => {
    if (!result) return;
    let isMounted = true;

    generatePdfBlobUrl(result.tailored, result.originalResume, selectedTemplateId).then((url) => {
      if (isMounted) setPdfPreviewUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTemplateId, result]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live real-time 2-minute progress timer & stage progression
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Dynamically advance stages based on elapsed time (up to 120s window)
        if (next < 10) setLoadingStage(0);
        else if (next < 25) setLoadingStage(1);
        else if (next < 50) setLoadingStage(2);
        else if (next < 80) setLoadingStage(3);
        else setLoadingStage(4);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  async function handleSubmit() {
    setLoading(true);
    setElapsedSeconds(0);
    setLoadingStage(0);
    setError(null);
    setResult(null);
    setPdfPreviewUrl(null);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong generating your resume. Try again.");
        return;
      }

      const resObj = data as ApiResponse;
      setResult(resObj);

      const previewUrl = await generatePdfBlobUrl(resObj.tailored, resObj.originalResume, selectedTemplateId);
      setPdfPreviewUrl(previewUrl);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Something went wrong generating your resume. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    setDownloading(true);

    try {
      const url = await generatePdfBlobUrl(result.tailored, result.originalResume, selectedTemplateId);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (result.originalResume.contact?.name || "Resume").replace(/\s+/g, "_");
      a.download = `${cleanName}_Tailored.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  function handleCopyBullet(bulletText: string, key: string) {
    navigator.clipboard.writeText(bulletText);
    setCopiedBulletIdx(key);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  }

  function getMatchRating(score: number): { label: string; color: string; bg: string; border: string; glow: string } {
    if (score >= 90) {
      return { label: "EXCEPTIONAL FIT", color: "#10B981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.5)", glow: "rgba(16,185,129,0.3)" };
    }
    if (score >= 75) {
      return { label: "STRONG ALIGNMENT", color: "#3654FF", bg: "rgba(54,84,255,0.15)", border: "rgba(54,84,255,0.5)", glow: "rgba(54,84,255,0.3)" };
    }
    if (score >= 50) {
      return { label: "MODERATE FIT", color: "#38BDF8", bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.5)", glow: "rgba(56,189,248,0.3)" };
    }
    if (score >= 30) {
      return { label: "PARTIAL COVERAGE", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.5)", glow: "rgba(245,158,11,0.3)" };
    }
    return { label: "LOW FIT / GAPS", color: "#EF4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)", glow: "rgba(239,68,68,0.3)" };
  }

  return (
    <div className="min-h-screen bg-[#090D14] text-[#F8FAFC] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#3654FF] selection:text-white bg-grid-pattern">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-120px] left-[20%] w-[500px] h-[500px] bg-glow-orb-1 pointer-events-none z-0 opacity-35 blur-3xl" />
      <div className="fixed top-[40%] right-[10%] w-[550px] h-[550px] bg-glow-orb-2 pointer-events-none z-0 opacity-25 blur-3xl" />

      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 w-full z-10">
        {/* ── STREAMLINED COMPACT WORKSPACE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3654FF] to-[#00F0FF] p-[1px] flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-[#090D14] rounded-xl flex items-center justify-center text-sm font-bold text-white">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Resume Intelligence Workspace
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[10px] font-label text-[#10B981] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Anti-Fabrication Guard
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-label hidden sm:block">
                Pure deterministic matching • Factual provenance • ATS vector PDF
              </p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            {(jdText || resumeText) && (
              <button
                onClick={clearAll}
                className="text-[11px] font-label px-3 py-1.5 rounded-lg bg-[#111622] border border-[#EF4444]/40 hover:bg-[#EF4444]/20 text-[#EF4444] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm flex items-center gap-1.5 font-medium"
                title="Clear All Inputs"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* ── DUAL-PANE WORKSPACE CONSOLE (IMMEDIATELY VISIBLE AT THE TOP) ── */}
        <div className="editor-shell shadow-2xl">
          {/* Console Header Bar */}
          <div className="border-b border-[#232D3F] bg-[#0B0F17] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] inline-block shadow-sm shadow-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] inline-block shadow-sm shadow-amber-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840] inline-block shadow-sm shadow-emerald-500/50" />
              <span className="font-label text-[11px] text-[#94A3B8] uppercase tracking-wider ml-1.5 font-bold">
                DUAL-INPUT CONSOLE
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-label text-[#64748B]">
              <span>{jdText ? `${jdText.trim().split(/\s+/).length} JD words` : "No JD"}</span>
              <span>•</span>
              <span>{resumeText ? `${resumeText.trim().split(/\s+/).length} Resume words` : "No Resume"}</span>
            </div>
          </div>

          {/* Dual Text Panes */}
          <div className="flex flex-col md:flex-row">
            {/* Target Job Description Pane */}
            <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-[#232D3F]">
              <div className="justify-between flex-wrap gap-2 py-2 px-3.5 bg-[#0F141F] border-b border-[#232D3F] flex items-center">
                <span className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                  <span>🎯</span> Target Job Description
                </span>
                <label className="cursor-pointer text-[10px] font-label px-2 py-1 rounded bg-[#090D14] border border-[#2B384E] hover:border-[#3654FF] text-[#94A3B8] hover:text-white transition-all inline-flex items-center gap-1 shadow-sm">
                  {uploadingJd ? (
                    <>
                      <span className="loading-spinner w-2.5 h-2.5" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <span>📁 Upload (.pdf, .docx)</span>
                    </>
                  )}
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "jd")}
                  />
                </label>
              </div>

              {jdFileName && (
                <div className="text-[11px] font-label text-[#10B981] px-3.5 py-1 bg-[#10B981]/10 border-b border-[#232D3F] flex items-center justify-between">
                  <span className="truncate">✓ {jdFileName}</span>
                  <button onClick={() => setJdFileName(null)} className="text-[#94A3B8] hover:text-white px-1">✕</button>
                </div>
              )}

              <textarea
                className="editor-textarea min-h-[170px] sm:min-h-[190px] p-3 text-xs sm:text-[13px]"
                placeholder="Paste the full job description or upload file above..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Candidate Resume Pane */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="justify-between flex-wrap gap-2 py-2 px-3.5 bg-[#0F141F] border-b border-[#232D3F] flex items-center">
                <span className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                  <span>📄</span> Candidate Resume
                </span>
                <label className="cursor-pointer text-[10px] font-label px-2 py-1 rounded bg-[#090D14] border border-[#2B384E] hover:border-[#3654FF] text-[#94A3B8] hover:text-white transition-all inline-flex items-center gap-1 shadow-sm">
                  {uploadingResume ? (
                    <>
                      <span className="loading-spinner w-2.5 h-2.5" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <span>📁 Upload (.pdf, .docx)</span>
                    </>
                  )}
                  <input
                    ref={resumeFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "resume")}
                  />
                </label>
              </div>

              {resumeFileName && (
                <div className="text-[11px] font-label text-[#10B981] px-3.5 py-1 bg-[#10B981]/10 border-b border-[#232D3F] flex items-center justify-between">
                  <span className="truncate">✓ {resumeFileName}</span>
                  <button onClick={() => setResumeFileName(null)} className="text-[#94A3B8] hover:text-white px-1">✕</button>
                </div>
              )}

              <textarea
                className="editor-textarea min-h-[170px] sm:min-h-[190px] p-3 text-xs sm:text-[13px]"
                placeholder="Paste your resume text or upload your CV above..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* ── INTEGRATED ACTION BAR (TEMPLATE SELECTOR + PREVIEW MODAL TRIGGER + PRIMARY CTA) ── */}
        <div className="cyber-card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
          {/* Template Selector with Preview Gallery Modal Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-label font-bold text-[#94A3B8] uppercase flex items-center gap-1 shrink-0">
                <span>🎨</span> Template:
              </span>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="text-[11px] font-label px-2.5 py-1 rounded-lg bg-[#3654FF]/20 border border-[#3654FF]/50 text-[#38BDF8] hover:bg-[#3654FF] hover:text-white transition-all cursor-pointer font-bold flex items-center gap-1 shadow-sm"
              >
                <span>👁️</span> Preview Layouts
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#3654FF] text-white border-[#3654FF] shadow-sm shadow-indigo-500/30 scale-[1.02]"
                        : "bg-[#090D14] text-[#94A3B8] border-[#222C3D] hover:border-[#3654FF]/50 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tmpl.color }} />
                    <span className="whitespace-nowrap">{tmpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Submit CTA */}
          <button
            className={`btn-radiant cursor-pointer min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 transition-all ${
              !canSubmit ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
            }`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="loading-spinner w-4 h-4" />
                <span>Running Semantic Matcher…</span>
              </>
            ) : (
              <>
                <span>✨ Tailor Resume & Analyze Fit →</span>
              </>
            )}
          </button>
        </div>

        {/* ── VISUAL TEMPLATE GALLERY MODAL / POPUP ── */}
        <AnimatePresence>
          {showTemplateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
              onClick={() => setShowTemplateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="cyber-card-glow max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-white border border-[#3654FF]/50 shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-[#232D3F] pb-4">
                  <div>
                    <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                      <span>🎨</span> ATS Resume Template Gallery
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Choose an ATS-compliant layout with real-time vector typography and scannable visual structures.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="w-8 h-8 rounded-full bg-[#111622] border border-[#232D3F] hover:bg-[#EF4444]/20 hover:border-[#EF4444] text-[#94A3B8] hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* 6 Miniature Template Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {TEMPLATES.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          setShowTemplateModal(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative ${
                          isSelected
                            ? "bg-[#161D2A] border-[#3654FF] shadow-xl shadow-indigo-500/30 ring-2 ring-[#3654FF]"
                            : "bg-[#0C1018] border-[#222C3D] hover:border-[#3654FF]/70 hover:bg-[#111622]"
                        }`}
                      >
                        {/* Miniature Document Rendering */}
                        <div className="transition-transform group-hover:scale-[1.02]">
                          <TemplateMiniaturePreview template={tmpl} />
                        </div>

                        {/* Metadata Footer */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-bold text-sm text-white group-hover:text-[#38BDF8] transition-colors">
                              {tmpl.name}
                            </span>
                            <span className="text-[9px] font-label font-bold px-2 py-0.5 rounded bg-black/50 text-[#94A3B8] border border-white/10">
                              {tmpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                            {tmpl.desc}
                          </p>
                        </div>

                        {/* Select Button Indicator */}
                        <button
                          className={`w-full py-1.5 rounded-xl text-xs font-heading font-bold transition-all ${
                            isSelected
                              ? "bg-[#3654FF] text-white"
                              : "bg-[#111622] text-[#94A3B8] group-hover:bg-[#3654FF]/20 group-hover:text-white border border-[#232D3F]"
                          }`}
                        >
                          {isSelected ? "Active Selected ✓" : "Select Layout"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-medium w-full flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── ANIMATED PROCESSING HUD WITH 2-MINUTE LIVE TIMER ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="cyber-card-glow p-5 sm:p-6 space-y-4 border border-[#3654FF]/40 shadow-2xl bg-[#0B0F17]/95"
            >
              {/* Header with Live Status & Countdown Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232D3F] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="loading-spinner w-5 h-5 text-[#00F0FF]" />
                    <span className="absolute w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                      <span>Tailoring & Analyzing Fit…</span>
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] font-label">
                      Multi-pass AI evaluation & bullet optimization in progress
                    </p>
                  </div>
                </div>

                {/* Live 2-Minute Timer Display */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto bg-[#070A10] px-3.5 py-1.5 rounded-xl border border-[#232D3F]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                    <span className="text-[#00F0FF]">{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}</span>
                    <span className="text-[#64748B]">/ 2:00 max</span>
                  </div>
                  <span className="text-[10px] font-label text-[#94A3B8] border-l border-[#232D3F] pl-2 hidden sm:inline">
                    ~{Math.max(0, 120 - elapsedSeconds)}s est. remaining
                  </span>
                </div>
              </div>

              {/* Dynamic 5-Stage Step Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-label">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${loadingStage >= 0 ? "bg-[#0C1018] border-[#10B981]/50 text-white shadow-sm shadow-emerald-500/10" : "bg-[#0C1018]/50 border-[#232D3F] text-[#64748B]"}`}>
                  <span className={loadingStage > 0 ? "text-[#10B981] font-bold text-sm" : "text-[#3654FF] animate-spin text-sm"}>
                    {loadingStage > 0 ? "✓" : "⟳"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">1. JD Deconstruct</div>
                    <div className="text-[9px] text-[#94A3B8] truncate">Extract atomic reqs</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${loadingStage >= 1 ? "bg-[#0C1018] border-[#10B981]/50 text-white shadow-sm shadow-emerald-500/10" : "bg-[#0C1018]/50 border-[#232D3F] text-[#64748B]"}`}>
                  <span className={loadingStage > 1 ? "text-[#10B981] font-bold text-sm" : loadingStage === 1 ? "text-[#3654FF] animate-spin text-sm" : "text-[#475569] text-sm"}>
                    {loadingStage > 1 ? "✓" : loadingStage === 1 ? "⟳" : "○"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">2. Resume Parsing</div>
                    <div className="text-[9px] text-[#94A3B8] truncate">Compile evidence units</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${loadingStage >= 2 ? "bg-[#0C1018] border-[#10B981]/50 text-white shadow-sm shadow-emerald-500/10" : "bg-[#0C1018]/50 border-[#232D3F] text-[#64748B]"}`}>
                  <span className={loadingStage > 2 ? "text-[#10B981] font-bold text-sm" : loadingStage === 2 ? "text-[#3654FF] animate-spin text-sm" : "text-[#475569] text-sm"}>
                    {loadingStage > 2 ? "✓" : loadingStage === 2 ? "⟳" : "○"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">3. Semantic Match</div>
                    <div className="text-[9px] text-[#94A3B8] truncate">Dense vector retrieval</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${loadingStage >= 3 ? "bg-[#0C1018] border-[#10B981]/50 text-white shadow-sm shadow-emerald-500/10" : "bg-[#0C1018]/50 border-[#232D3F] text-[#64748B]"}`}>
                  <span className={loadingStage > 3 ? "text-[#10B981] font-bold text-sm" : loadingStage === 3 ? "text-[#3654FF] animate-spin text-sm" : "text-[#475569] text-sm"}>
                    {loadingStage > 3 ? "✓" : loadingStage === 3 ? "⟳" : "○"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">4. Experience Rewrite</div>
                    <div className="text-[9px] text-[#94A3B8] truncate">Tailor impact bullets</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${loadingStage >= 4 ? "bg-[#0C1018] border-[#10B981]/50 text-white shadow-sm shadow-emerald-500/10" : "bg-[#0C1018]/50 border-[#232D3F] text-[#64748B]"}`}>
                  <span className={loadingStage >= 4 ? "text-[#3654FF] animate-spin text-sm" : "text-[#475569] text-sm"}>
                    {loadingStage >= 4 ? "⟳" : "○"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">5. PDF Verification</div>
                    <div className="text-[9px] text-[#94A3B8] truncate">Hallucination check</div>
                  </div>
                </div>
              </div>

              {/* Continuous Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-label text-[#94A3B8]">
                  <span>Overall Pipeline Progress</span>
                  <span className="font-mono text-[#00F0FF] font-bold">
                    {Math.min(96, Math.max(10, Math.round(
                      elapsedSeconds < 10 ? 10 + (elapsedSeconds / 10) * 15 :
                      elapsedSeconds < 25 ? 25 + ((elapsedSeconds - 10) / 15) * 25 :
                      elapsedSeconds < 50 ? 50 + ((elapsedSeconds - 25) / 25) * 25 :
                      elapsedSeconds < 80 ? 75 + ((elapsedSeconds - 50) / 30) * 15 :
                      90 + Math.min(6, ((elapsedSeconds - 80) / 40) * 6)
                    )))}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#070A10] rounded-full overflow-hidden border border-[#232D3F] shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3654FF] via-[#00F0FF] to-[#10B981] shadow-lg shadow-cyan-500/30"
                    style={{
                      width: `${Math.min(96, Math.max(10, Math.round(
                        elapsedSeconds < 10 ? 10 + (elapsedSeconds / 10) * 15 :
                        elapsedSeconds < 25 ? 25 + ((elapsedSeconds - 10) / 15) * 25 :
                        elapsedSeconds < 50 ? 50 + ((elapsedSeconds - 25) / 25) * 25 :
                        elapsedSeconds < 80 ? 75 + ((elapsedSeconds - 50) / 30) * 15 :
                        90 + Math.min(6, ((elapsedSeconds - 80) / 40) * 6)
                      )))}%`
                    }}
                    transition={{ duration: 0.3, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Reassuring Live Activity Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-[#94A3B8] border-t border-[#232D3F]/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  <span>Deep AI semantic auditing is active. Evaluations typically take 25–45s (up to 2 min under peak load).</span>
                </div>
                <div className="text-[10px] text-[#64748B] shrink-0 font-label">
                  Please keep this tab open
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ── RESULTS INTELLIGENCE DASHBOARD (SMOOTH SCROLL TARGET) ── */}
        {result && (
          <div ref={resultsRef} className="space-y-6 pt-2">
            {/* View Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232D3F] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("diff")}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "diff"
                      ? "bg-gradient-to-r from-[#3654FF] to-[#6366F1] text-white shadow-lg shadow-indigo-500/30"
                      : "bg-[#111622] text-[#94A3B8] hover:text-white border border-[#232D3F]"
                  }`}
                >
                  <span>📊</span> Skillset Alignment & Audit
                </button>
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pdf"
                      ? "bg-gradient-to-r from-[#3654FF] to-[#6366F1] text-white shadow-lg shadow-indigo-500/30"
                      : "bg-[#111622] text-[#94A3B8] hover:text-white border border-[#232D3F]"
                  }`}
                >
                  <span>📄</span> Live ATS PDF Preview
                </button>
              </div>

              <button
                className="cursor-pointer min-h-[38px] px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 bg-[#111622] border border-[#3654FF]/50 text-white hover:bg-[#3654FF] transition-all font-semibold shadow-md"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <span>💾</span>
                <span>{downloading ? "Preparing Vector PDF…" : "Download Tailored PDF"}</span>
              </button>
            </div>

            {/* TAB 1: Skillset Diff & Analysis */}
            {activeTab === "diff" && (
              <div className="space-y-6">
                {/* ══ CENTERPIECE NEON RADIAL SCORE ENGINE ══ */}
                <div className="cyber-card-glow p-5 sm:p-8 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Left: Glowing SVG Radial Gauge */}
                  <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 w-full lg:w-auto">
                    <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="9"
                          fill="transparent"
                        />
                        {(() => {
                          const rating = getMatchRating(result.tailored.match_score);
                          const strokeDash = (result.tailored.match_score / 100) * 264;
                          return (
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              stroke={rating.color}
                              strokeWidth="9"
                              strokeDasharray="264"
                              strokeDashoffset={264 - strokeDash}
                              strokeLinecap="round"
                              fill="transparent"
                              style={{ filter: `drop-shadow(0 0 8px ${rating.glow})` }}
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        })()}
                      </svg>
                      {/* Center Score Value */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-heading text-3xl font-extrabold text-white leading-none tracking-tight">
                          {result.tailored.match_score}%
                        </span>
                        <span className="font-label text-[9px] text-[#94A3B8] uppercase tracking-widest mt-1 font-bold">
                          MATCH
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Verdict */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="font-label text-[10px] uppercase tracking-widest text-[#64748B] font-bold">
                          DETERMINISTIC CAPABILITY FIT
                        </span>
                        {(() => {
                          const rating = getMatchRating(result.tailored.match_score);
                          return (
                            <span
                              className="font-label text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm"
                              style={{
                                color: rating.color,
                                backgroundColor: rating.bg,
                                borderColor: rating.border,
                              }}
                            >
                              {rating.label}
                            </span>
                          );
                        })()}
                        {typeof result.tailored.confidence_score === "number" && (
                          <span className="font-label text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#0C1018] text-[#38BDF8] border border-[#38BDF8]/30">
                            {result.tailored.confidence_score}% Confidence ({result.tailored.match_analysis?.confidence_level?.toUpperCase() || "HIGH"})
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
                        {result.tailored.match_score >= 90
                          ? "Exceptional Technical & Domain Alignment"
                          : result.tailored.match_score >= 75
                          ? "Strong Technical & Requirement Alignment"
                          : result.tailored.match_score >= 50
                          ? "Moderate Requirement Alignment"
                          : "Low Fit / Critical Technical Gaps"}
                      </h3>
                      <p className="text-xs text-[#94A3B8] max-w-lg leading-relaxed">
                        Evaluated across {result.tailored.match_analysis?.scorable_capabilities_count ?? result.tailored.match_analysis?.evaluations?.length ?? 0} scorable capability dimensions using verified exact evidence.
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Stat Telemetry Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col gap-2 shrink-0 w-full lg:w-44">
                    <div className="px-3 py-2 rounded-xl bg-[#0C1018] border border-[#10B981]/30 flex items-center justify-between gap-2 shadow-sm">
                      <span className="font-label text-[11px] text-[#94A3B8]">Direct</span>
                      <span className="font-heading font-extrabold text-sm text-[#10B981]">
                        + {result.tailored.match_analysis?.matched_requirements?.length ?? 0}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#0C1018] border border-[#6366F1]/30 flex items-center justify-between gap-2 shadow-sm">
                      <span className="font-label text-[11px] text-[#94A3B8]">Claimed</span>
                      <span className="font-heading font-extrabold text-sm text-[#818CF8]">
                        * {result.tailored.match_analysis?.claimed_requirements?.length ?? 0}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#0C1018] border border-[#00F0FF]/30 flex items-center justify-between gap-2 shadow-sm">
                      <span className="font-label text-[11px] text-[#94A3B8]">Partial</span>
                      <span className="font-heading font-extrabold text-sm text-[#00F0FF]">
                        ~ {result.tailored.match_analysis?.partial_requirements?.length ?? 0}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#0C1018] border border-[#EF4444]/30 flex items-center justify-between gap-2 shadow-sm">
                      <span className="font-label text-[11px] text-[#94A3B8]">Gaps</span>
                      <span className="font-heading font-extrabold text-sm text-[#EF4444]">
                        - {result.tailored.match_analysis?.missing_requirements?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ══ NEW: EXECUTIVE SKILLS COVERAGE & ALIGNMENT BAR ══ */}
                {result.tailored.match_analysis?.evaluations && result.tailored.match_analysis.evaluations.length > 0 && (
                  <div className="cyber-card p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232D3F] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">📊</span>
                          <h4 className="font-heading font-bold text-sm sm:text-base text-white">
                            Skills Coverage & Alignment Breakdown
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Visual ratio of demonstrated direct matches, claimed skills, partial fits, and missing gaps
                        </p>
                      </div>
                      <span className="text-xs font-label text-[#38BDF8] font-bold px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                        {result.tailored.match_analysis.evaluations.length} Total JD Skills Evaluated
                      </span>
                    </div>

                    {/* Segmented Multi-Color Progress Bar */}
                    {(() => {
                      const total = result.tailored.match_analysis.evaluations.length || 1;
                      const directCount = result.tailored.match_analysis.evaluations.filter((e) => e.status === "strong_match").length;
                      const claimedCount = result.tailored.match_analysis.evaluations.filter((e) => e.status === "claimed_match").length;
                      const partialCount = result.tailored.match_analysis.evaluations.filter((e) => e.status === "partial_match").length;
                      const missingCount = result.tailored.match_analysis.evaluations.filter((e) => e.status === "no_evidence" || e.score === 0).length;

                      const directPct = Math.round((directCount / total) * 100);
                      const claimedPct = Math.round((claimedCount / total) * 100);
                      const partialPct = Math.round((partialCount / total) * 100);
                      const missingPct = Math.max(0, 100 - directPct - claimedPct - partialPct);

                      return (
                        <div className="space-y-3">
                          {/* Bar */}
                          <div className="w-full h-3.5 bg-[#0C1018] rounded-full overflow-hidden flex border border-[#232D3F] p-0.5 shadow-inner">
                            {directPct > 0 && (
                              <div
                                style={{ width: `${directPct}%` }}
                                className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-l-full transition-all duration-700 shadow-sm shadow-emerald-500/50"
                                title={`Direct Demonstrated: ${directCount} (${directPct}%)`}
                              />
                            )}
                            {claimedPct > 0 && (
                              <div
                                style={{ width: `${claimedPct}%` }}
                                className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all duration-700 shadow-sm shadow-indigo-500/50"
                                title={`Claimed Skills: ${claimedCount} (${claimedPct}%)`}
                              />
                            )}
                            {partialPct > 0 && (
                              <div
                                style={{ width: `${partialPct}%` }}
                                className="h-full bg-gradient-to-r from-[#38BDF8] to-[#00F0FF] transition-all duration-700 shadow-sm shadow-cyan-500/50"
                                title={`Partial Matches: ${partialCount} (${partialPct}%)`}
                              />
                            )}
                            {missingPct > 0 && (
                              <div
                                style={{ width: `${missingPct}%` }}
                                className="h-full bg-gradient-to-r from-[#EF4444] to-[#F87171] rounded-r-full transition-all duration-700 shadow-sm shadow-red-500/50"
                                title={`Missing Gaps: ${missingCount} (${missingPct}%)`}
                              />
                            )}
                          </div>

                          {/* Legend Counters */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                            <div className="p-2.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-sm shadow-emerald-400" />
                                <span className="text-white font-medium text-[11px]">Direct Matches</span>
                              </div>
                              <span className="font-bold font-mono text-[#10B981] text-xs">{directCount}</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#818CF8] inline-block shadow-sm shadow-indigo-400" />
                                <span className="text-white font-medium text-[11px]">Claimed Skills</span>
                              </div>
                              <span className="font-bold font-mono text-[#818CF8] text-xs">{claimedCount}</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-sm shadow-cyan-400" />
                                <span className="text-white font-medium text-[11px]">Partial / Related</span>
                              </div>
                              <span className="font-bold font-mono text-[#00F0FF] text-xs">{partialCount}</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block shadow-sm shadow-red-400" />
                                <span className="text-white font-medium text-[11px]">Missing Gaps</span>
                              </div>
                              <span className="font-bold font-mono text-[#EF4444] text-xs">{missingCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ══ ROLE ELIGIBILITY & QUALIFICATIONS (ISOLATED STATUS) ══ */}
                {result.tailored.match_analysis?.eligibility_results && result.tailored.match_analysis.eligibility_results.length > 0 && (
                  <div className="cyber-card p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232D3F] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span className="font-heading font-bold text-xs sm:text-sm text-white">
                          Role Eligibility & Stated Qualifications ({result.tailored.match_analysis.eligibility_results.length})
                        </span>
                      </div>
                      <span className="text-[10px] font-label text-[#64748B] uppercase tracking-wider">
                        Evaluated Separately from Capability Fit
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {result.tailored.match_analysis.eligibility_results.map((elig, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#0C1018] border border-[#232D3F] flex flex-col justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-[#F1F5F9] text-xs sm:text-sm">{elig.stated_requirement}</div>
                            <div className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{elig.reasoning}</div>
                          </div>
                          <span className={`text-[10px] font-label font-bold px-2.5 py-0.5 rounded-lg shrink-0 self-start ${
                            elig.status === "meets_requirement"
                              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40"
                              : elig.status === "location_mismatch"
                              ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40"
                              : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40"
                          }`}>
                            {elig.status === "meets_requirement"
                              ? "✓ MEETS REQUIREMENT"
                              : elig.status === "location_mismatch"
                              ? "📍 LOCATION MISMATCH"
                              : "✕ REQUIREMENT NOT MET"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══ CRITICALITY SUB-SCORES & WHY NOT 100% ══ */}
                {result.tailored.match_analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: Hard vs Preferred Breakdown */}
                    <div className="cyber-card p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between border-b border-[#232D3F] pb-2.5 mb-3">
                          <span className="font-heading font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                            <span>🎯</span> Requirement Criticality Sub-Scores
                          </span>
                          <span className="text-[10px] font-label text-[#64748B] uppercase">Weighted Fit</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#94A3B8] font-medium">Hard Requirements (Must Have)</span>
                              <span className="font-bold text-[#F1F5F9]">{result.tailored.match_analysis.hard_requirement_match_score ?? result.tailored.match_score}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#0C1018] rounded-full overflow-hidden border border-[#232D3F]">
                              <div
                                className="h-full bg-gradient-to-r from-[#3654FF] to-[#6366F1] rounded-full"
                                style={{ width: `${result.tailored.match_analysis.hard_requirement_match_score ?? result.tailored.match_score}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#94A3B8] font-medium">Preferred & Domain Competencies</span>
                              <span className="font-bold text-[#F1F5F9]">{result.tailored.match_analysis.preferred_requirement_match_score ?? 100}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#0C1018] rounded-full overflow-hidden border border-[#232D3F]">
                              <div
                                className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full"
                                style={{ width: `${result.tailored.match_analysis.preferred_requirement_match_score ?? 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {result.tailored.match_analysis.critical_gaps && result.tailored.match_analysis.critical_gaps.length > 0 && (
                        <div className="pt-3 border-t border-[#232D3F]">
                          <span className="text-[10px] font-label font-bold text-[#EF4444] uppercase tracking-wider block mb-1.5">
                            Critical Missing Requirements ({result.tailored.match_analysis.critical_gaps.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.tailored.match_analysis.critical_gaps.map((cg, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-0.5 rounded-lg bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-medium">
                                🔴 {cg.requirement_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Why Not 100% Diagnostic */}
                    <div className="cyber-card p-5 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-[#232D3F] pb-2.5">
                        <span className="font-heading font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                          <span>💡</span> Diagnostic: Why Not 100%?
                        </span>
                        <span className="text-[10px] font-label text-[#64748B] uppercase">Deductions</span>
                      </div>
                      {result.tailored.match_analysis.why_not_100 && result.tailored.match_analysis.why_not_100.length > 0 ? (
                        <ul className="space-y-2 text-xs text-[#94A3B8] overflow-y-auto max-h-[160px] pr-1">
                          {result.tailored.match_analysis.why_not_100.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed p-2 rounded-lg bg-[#0C1018] border border-[#232D3F]">
                              <span className="text-[#F59E0B] shrink-0 mt-0.5 font-bold">⚡</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#10B981] mt-2">Candidate matches all evaluated requirements with direct evidence.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ SIDE-BY-SIDE JD VS RESUME MATCH MATRIX & SKILL TAGS ══ */}
                <div className="cyber-card p-5 sm:p-6 space-y-4">
                  {/* Matrix Header & Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#232D3F] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎯</span>
                        <h4 className="font-heading font-bold text-base text-white">
                          JD Requirements vs Candidate Resume Evidence
                        </h4>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        Clear side-by-side comparison of job requirements against exact verified resume proof
                      </p>
                    </div>

                    {/* View Switcher & Search Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Mode (Side-by-Side vs Tag Cloud) */}
                      <div className="flex items-center gap-1 bg-[#0C1018] p-1 rounded-xl text-xs font-label border border-[#232D3F]">
                        <button
                          onClick={() => setMatrixViewMode("grid")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs flex items-center gap-1 ${
                            matrixViewMode === "grid" ? "bg-[#3654FF] text-white shadow-sm" : "text-[#64748B] hover:text-white"
                          }`}
                        >
                          <span>📋</span> Side-by-Side
                        </button>
                        <button
                          onClick={() => setMatrixViewMode("tags")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs flex items-center gap-1 ${
                            matrixViewMode === "tags" ? "bg-[#3654FF] text-white shadow-sm" : "text-[#64748B] hover:text-white"
                          }`}
                        >
                          <span>🏷️</span> Skill Tags
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Search requirement…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1 rounded-xl bg-[#0C1018] border border-[#232D3F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#3654FF] font-mono"
                      />

                      {/* Status Filter Tabs */}
                      <div className="flex items-center gap-1 bg-[#0C1018] p-1 rounded-xl text-xs font-label border border-[#232D3F]">
                        <button
                          onClick={() => setDiffFilter("all")}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs ${
                            diffFilter === "all" ? "bg-[#3654FF] text-white shadow-sm" : "text-[#64748B] hover:text-white"
                          }`}
                        >
                          All ({result.tailored.match_analysis?.evaluations?.length ?? (result.tailored.matched_skills.length + result.tailored.missing_skills.length)})
                        </button>
                        <button
                          onClick={() => setDiffFilter("matched")}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs ${
                            diffFilter === "matched" ? "bg-[#10B981] text-white shadow-sm" : "text-[#64748B] hover:text-[#10B981]"
                          }`}
                        >
                          + Direct
                        </button>
                        <button
                          onClick={() => setDiffFilter("partial")}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs ${
                            diffFilter === "partial" ? "bg-[#00F0FF] text-black shadow-sm" : "text-[#64748B] hover:text-[#00F0FF]"
                          }`}
                        >
                          ~ Partial
                        </button>
                        <button
                          onClick={() => setDiffFilter("missing")}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-xs ${
                            diffFilter === "missing" ? "bg-[#EF4444] text-white shadow-sm" : "text-[#64748B] hover:text-[#EF4444]"
                          }`}
                        >
                          - Gaps
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VIEW 1: SIDE-BY-SIDE MATCH TABLE / GRID */}
                  {matrixViewMode === "grid" && (
                    <div className="space-y-3">
                      {result.tailored.match_analysis?.evaluations
                        ?.filter((item) => {
                          if (searchQuery && !item.requirement_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                          if (diffFilter === "matched") return item.status === "strong_match";
                          if (diffFilter === "partial") return item.status === "partial_match";
                          if (diffFilter === "missing") return item.status === "no_evidence" || item.score === 0.0;
                          return true;
                        })
                        .map((req, i) => {
                          const isDemonstrated = req.status === "strong_match";
                          const isClaimed = req.status === "claimed_match";
                          const isPartial = req.status === "partial_match";

                          return (
                            <div
                              key={i}
                              className={`p-4 rounded-2xl border transition-all grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start ${
                                isDemonstrated
                                  ? "bg-[#0C1018] border-[#10B981]/30 hover:border-[#10B981]/60"
                                  : isClaimed
                                  ? "bg-[#0C1018] border-[#34D399]/30 hover:border-[#34D399]/60"
                                  : isPartial
                                  ? "bg-[#0C1018] border-[#00F0FF]/30 hover:border-[#00F0FF]/60"
                                  : "bg-[#0C1018] border-[#EF4444]/30 hover:border-[#EF4444]/60"
                              }`}
                            >
                              {/* Col 1: JD Requirement (4 Cols) */}
                              <div className="lg:col-span-4 space-y-1.5 border-b lg:border-b-0 lg:border-r border-[#232D3F] pb-2.5 lg:pb-0 lg:pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-label text-[#64748B] uppercase font-bold">🎯 Target Requirement:</span>
                                </div>
                                <h5 className="font-heading font-bold text-sm text-white">
                                  {req.requirement_name}
                                </h5>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <span className={`text-[9px] font-label font-bold px-2 py-0.5 rounded-full uppercase ${
                                    req.criticality === "hard"
                                      ? "bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40"
                                      : req.criticality === "preferred"
                                      ? "bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40"
                                      : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"
                                  }`}>
                                    {req.criticality === "hard" ? "Must Have (Hard)" : "Preferred / Soft"}
                                  </span>
                                  {typeof req.score === "number" && (
                                    <span className="text-[9px] font-mono text-[#64748B]">Score: {(req.score * 100).toFixed(0)}%</span>
                                  )}
                                </div>
                              </div>

                              {/* Col 2: Candidate Resume Proof (5 Cols) */}
                              <div className="lg:col-span-5 space-y-1.5 border-b lg:border-b-0 lg:border-r border-[#232D3F] pb-2.5 lg:pb-0 lg:pr-3">
                                <span className="text-xs font-label text-[#64748B] uppercase font-bold block">
                                  📄 Verified Resume Evidence:
                                </span>
                                {req.evidence && req.evidence.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {req.evidence.map((ev, evIdx) => (
                                      <div key={evIdx} className="p-2 rounded-lg bg-[#111622] border border-[#232D3F] text-xs text-[#E2E8F0] italic font-mono flex items-start gap-1.5 leading-relaxed">
                                        <span className="text-[#38BDF8] not-italic shrink-0 font-bold">❝</span>
                                        <span>{ev.text}</span>
                                        <span className="text-[#38BDF8] not-italic shrink-0 font-bold">❞</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#FCA5A5] italic">
                                    No direct verified evidence found in candidate resume text.
                                  </div>
                                )}
                              </div>

                              {/* Col 3: Status & Verdict (3 Cols) */}
                              <div className="lg:col-span-3 flex flex-col justify-between space-y-2 h-full">
                                <div>
                                  <span className="text-xs font-label text-[#64748B] uppercase font-bold block mb-1">
                                    Match Verdict:
                                  </span>
                                  <span className={`text-[10px] font-label font-bold px-2.5 py-1 rounded-lg inline-block ${
                                    isDemonstrated
                                      ? "bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40"
                                      : isClaimed
                                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                                      : isPartial
                                      ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                                      : "bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/40"
                                  }`}>
                                    {isDemonstrated
                                      ? "✓ DEMONSTRATED MATCH (100%)"
                                      : isClaimed
                                      ? "✓ CLAIMED SKILL (80%)"
                                      : isPartial
                                      ? "⚡ PARTIAL FIT (60%)"
                                      : "✕ MISSING (0%)"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#94A3B8] leading-tight">
                                  {req.reasoning}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* VIEW 2: VISUAL SKILL TAGS CLOUD */}
                  {matrixViewMode === "tags" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {/* Matched Skills Deck */}
                      <div className="p-5 rounded-2xl bg-[#0C1018] border border-[#10B981]/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#232D3F] pb-2.5">
                          <span className="font-heading font-bold text-sm text-[#10B981] flex items-center gap-2">
                            <span>✓</span> Matched Skills & Capabilities ({result.tailored.matched_skills.length})
                          </span>
                          <span className="text-[10px] font-label text-[#10B981] font-bold">100% VERIFIED</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.tailored.matched_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-mono font-medium px-3 py-1 rounded-xl bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/40 shadow-sm flex items-center gap-1.5"
                            >
                              <span>✓</span> {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps Deck */}
                      <div className="p-5 rounded-2xl bg-[#0C1018] border border-[#EF4444]/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#232D3F] pb-2.5">
                          <span className="font-heading font-bold text-sm text-[#EF4444] flex items-center gap-2">
                            <span>✕</span> Missing Skills / Gaps to Address ({result.tailored.missing_skills.length})
                          </span>
                          <span className="text-[10px] font-label text-[#EF4444] font-bold">ACTION ITEMS</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.tailored.missing_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-mono font-medium px-3 py-1 rounded-xl bg-[#EF4444]/15 text-[#FCA5A5] border border-[#EF4444]/40 shadow-sm flex items-center gap-1.5"
                            >
                              <span>+</span> {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ══ TAILORED BULLETS & CONTENT STUDIO ══ */}
                <div className="cyber-card p-5 sm:p-6 space-y-4">
                  <div className="border-b border-[#232D3F] pb-3">
                    <h4 className="font-heading font-bold text-base text-white">Tailored Content & Impact Bullets</h4>
                    <p className="text-xs text-[#64748B]">Optimized for target JD while preserving 100% factual accuracy</p>
                  </div>

                  {/* Summary */}
                  {result.tailored.rewritten_summary && (
                    <div className="p-4 rounded-xl bg-[#0C1018] border border-[#232D3F] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-xs text-white">Professional Summary</span>
                        <button
                          onClick={() => handleCopyBullet(result.tailored.rewritten_summary, "sum")}
                          className="text-xs font-label text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          {copiedBulletIdx === "sum" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-[#F1F5F9] leading-relaxed">
                        {result.tailored.rewritten_summary}
                      </p>
                    </div>
                  )}

                  {/* Experience Entries */}
                  {result.tailored.rewritten_experience?.map((exp, expIdx) => (
                    <div key={expIdx} className="p-4 rounded-xl bg-[#0C1018] border border-[#232D3F] space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#1E293B] pb-2">
                        <div>
                          <div className="font-heading font-bold text-xs sm:text-sm text-white">{exp.title}</div>
                          <div className="text-xs text-[#94A3B8]">{exp.company}</div>
                        </div>
                        <span className="text-xs font-label text-[#64748B]">{exp.dates}</span>
                      </div>

                      <div className="space-y-1.5">
                        {exp.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start justify-between gap-2.5 p-2.5 rounded-lg bg-[#111622] border border-[#232D3F]">
                            <div className="flex items-start gap-2 text-xs text-[#F1F5F9] leading-relaxed">
                              <span className="text-[#38BDF8] shrink-0 font-bold">•</span>
                              <span>{b}</span>
                            </div>
                            <button
                              onClick={() => handleCopyBullet(b, `b_${expIdx}_${bIdx}`)}
                              className="text-xs font-label text-[#64748B] hover:text-white shrink-0 px-2 py-0.5"
                            >
                              {copiedBulletIdx === `b_${expIdx}_${bIdx}` ? "Copied ✓" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Live ATS PDF Preview */}
            {activeTab === "pdf" && (
              <div className="cyber-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232D3F] pb-3">
                  <div>
                    <h4 className="font-heading font-bold text-base text-white">
                      Live ATS Vector PDF Preview ({TEMPLATES.find((t) => t.id === selectedTemplateId)?.name})
                    </h4>
                    <p className="text-xs text-[#64748B]">100% Vector Text Layer • High Readability for ATS Scanners</p>
                  </div>

                  {/* Switch Template Inline in PDF view */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="text-xs font-label px-3 py-1.5 rounded-xl bg-[#111622] border border-[#3654FF]/40 text-[#38BDF8] hover:bg-[#3654FF] hover:text-white transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🎨</span> Change Layout
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloading}
                      className="btn-radiant px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>💾</span>
                      <span>{downloading ? "Preparing Vector PDF…" : "Download Tailored PDF"}</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-[700px] rounded-xl overflow-hidden border border-[#232D3F] bg-[#090D14] shadow-2xl">
                  {pdfPreviewUrl ? (
                    <iframe
                      src={pdfPreviewUrl}
                      title="Tailored Resume Preview"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#64748B]">
                      <span className="loading-spinner w-8 h-8" />
                      <span className="text-xs font-label">Rendering Vector ATS PDF Document…</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
