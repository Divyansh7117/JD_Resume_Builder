"use client";

import React, { useState, useEffect, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import ResumeDocument from "@/components/ResumeDocument";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { TailoredOutput, ResumeData } from "@/types";

interface ApiResponse {
  tailored: TailoredOutput;
  originalResume: ResumeData;
}

const TEMPLATES = [
  { id: "ats-standard", name: "ATS Classic Single-Column", color: "#0F1419", badge: "100% ATS Safe" },
  { id: "modern-sidebar", name: "Modern Tech Sidebar", color: "#3654FF", badge: "Two-Column" },
  { id: "executive-leadership", name: "Executive Leadership", color: "#D08C1B", badge: "Executive" },
  { id: "dark-cyber", name: "Creative Developer Dark", color: "#1F9D6B", badge: "Dark Theme" },
  { id: "compact-dense", name: "Compact One-Page Dense", color: "#8B5CF6", badge: "High Density" },
  { id: "academic-research", name: "Academic & AI Research", color: "#0284C7", badge: "Academic" },
];

const SAMPLE_JD = `Senior Frontend Developer | Acme Commerce
Location: Remote | Experience: 4+ years

About the Role:
We are looking for a Senior Frontend Developer to lead the UI development of our e-commerce web applications.

Required Skills & Expertise:
- Strong proficiency in React, TypeScript, and Vue.js
- Expertise in Tailwind CSS and responsive design
- Experience with Web Performance optimization and Core Web Vitals
- Hands-on experience with E2E testing using Cypress and Playwright
- Proficiency with GraphQL and REST API integration
- Experience collaborating with UI/UX designers in Figma

Nice to Have:
- Experience with Next.js and Server-Side Rendering (SSR)
- Knowledge of Micro-frontends architecture`;

const SAMPLE_RESUME = `DAVID MILLER
david.miller@example.com | (555) 321-7654 | Austin, TX | github.com/davidmiller

PROFESSIONAL EXPERIENCE
Frontend Developer | RetailPulse Inc. | Feb 2021 - Present
• Developed dynamic single-page web applications using React, JavaScript, and HTML5/CSS3.
• Integrated REST APIs for dynamic inventory sync and payment processing.
• Wrote unit and integration tests using Jest and React Testing Library, maintaining 85% test coverage.

Web Developer | WebCraft Studios | Aug 2018 - Jan 2021
• Built responsive client websites using Vue.js, Tailwind CSS, and HTML5.
• Optimized web asset delivery and image lazy-loading, improving page performance scores by 35%.

PROJECTS
StoreFront UI Kit - Open Source Component Library
• Created a lightweight accessible React UI component library published on npm.

SKILLS
React, Vue.js, JavaScript, HTML5, CSS3, Tailwind CSS, REST APIs, Jest, Git, Web Performance`;

export default function AppPage() {
  const shouldReduceMotion = useReducedMotion();
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("ats-standard");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [diffFilter, setDiffFilter] = useState<"all" | "matched" | "missing">("all");
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

  const canSubmit = jdText.trim().length > 0 && resumeText.trim().length > 0 && !loading;

  function loadSampleData() {
    setJdText(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
    setJdFileName(null);
    setResumeFileName(null);
    setError(null);
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
        setError(data.error || "Couldn't read that file. If it's a scanned/image-based PDF, please paste the text manually instead.");
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
      setError("Couldn't read that file. If it's a scanned/image-based PDF, please paste the text manually instead.");
    } finally {
      if (isJd) {
        setUploadingJd(false);
      } else {
        setUploadingResume(false);
      }
      e.target.value = "";
    }
  }

  async function generatePdfBlobUrl(tailored: TailoredOutput, originalResume: ResumeData, tmplId: string) {
    const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
    const name = lines[0]?.trim() || "Your Name";
    const contact = lines[1]?.trim() || "";

    const doc = (
      <ResumeDocument
        name={name}
        contact={contact}
        experience={tailored.rewritten_experience}
        projects={originalResume.sections.projects}
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
      if (isMounted) {
        setPdfPreviewUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTemplateId, result]);

  // Animated generation progress stages simulator
  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }

    const t1 = setTimeout(() => setLoadingStage(1), 600);
    const t2 = setTimeout(() => setLoadingStage(2), 1600);
    const t3 = setTimeout(() => setLoadingStage(3), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading]);

  async function handleSubmit() {
    setLoading(true);
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
      a.download = `tailored-resume-${selectedTemplateId}.pdf`;
      a.click();
    } catch {
      setError("Failed to generate PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  function handleCopyBullet(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(key);
    setTimeout(() => setCopiedBulletIdx(null), 2500);
  }

  function getMatchRating(score: number) {
    if (score >= 75) return { label: "Strong Match", color: "#1F9D6B", bg: "rgba(31,157,107,0.12)", border: "#A7F3D0" };
    if (score >= 45) return { label: "Moderate Match", color: "#D08C1B", bg: "rgba(208,140,27,0.12)", border: "#FDE68A" };
    return { label: "Low Match", color: "#FF5F57", bg: "rgba(255,95,87,0.12)", border: "#FECACA" };
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#E5E7EB] flex flex-col font-sans relative overflow-x-hidden bg-grid-pattern">
      {/* Background glowing orb mesh */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-glow-orb-1 pointer-events-none z-0" />
      <div className="absolute top-96 right-1/4 w-[600px] h-[600px] bg-glow-orb-2 pointer-events-none z-0" />

      <Navbar />

      {/* ═══ Main Workspace Container ═══ */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-6 md:px-8 py-10 flex flex-col gap-8">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              JD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] to-[#1F9D6B]">→</span> Resume Customiser
              <span className="text-xs font-label text-[#1F9D6B] bg-[#1F9D6B]/10 px-2.5 py-0.5 rounded-full border border-[#1F9D6B]/20">
                v2.5 Gemini Engine
              </span>
            </h1>
            <p className="font-label mt-1 text-xs text-[#9CA3AF]">
              customise your resume to match the target JD skillset & select your PDF template
            </p>
          </div>

          {/* Quick Load Sample Button */}
          <button
            onClick={loadSampleData}
            className="self-start sm:self-auto text-xs font-label px-3.5 py-2 rounded-xl bg-[#161B22]/90 border border-[#2A303C] hover:border-[#3654FF] text-[#9CA3AF] hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-lg backdrop-blur-md hover:scale-105"
          >
            <span>⚡</span> Load Sample Data
          </button>
        </div>

        {/* ── PDF TEMPLATE SELECTOR BAR ── */}
        <div className="p-4.5 rounded-2xl bg-[#161B22]/90 border border-[#2A303C] shadow-2xl backdrop-blur-xl">
          <div className="font-label text-xs uppercase tracking-widest text-[#6B7280] font-bold mb-3 flex items-center justify-between">
            <span>SELECT PDF TEMPLATE LAYOUT:</span>
            <span className="text-[#3654FF] text-[10px] font-bold">
              Active: {TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === selectedTemplateId;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-3 rounded-xl font-heading text-xs font-semibold text-center transition-all cursor-pointer border flex flex-col items-center justify-between gap-1.5 min-h-[75px] ${
                    isSelected
                      ? "bg-[#3654FF] text-white border-[#3654FF] shadow-lg shadow-indigo-500/30 scale-[1.03]"
                      : "bg-[#0F1419]/90 text-[#9CA3AF] border-[#2A303C] hover:border-[#3654FF]/50 hover:text-white hover:scale-105"
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                  <span className="line-clamp-2 text-[11px] leading-tight">{tmpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Editor Input Shell ── */}
        <div className="editor-shell shadow-2xl">
          {/* Traffic light dots */}
          <div className="traffic-dots border-b border-[#2A303C]">
            <span className="traffic-dot bg-[#FF5F57]" />
            <span className="traffic-dot bg-[#FEBC2E]" />
            <span className="traffic-dot bg-[#28C840]" />
            <span className="font-label text-[10px] text-[#6B7280] uppercase tracking-widest ml-2 font-bold">
              DUAL-PANE EDITOR WORKSPACE
            </span>
          </div>

          {/* Panes */}
          <div className="flex flex-col md:flex-row">
            {/* JD pane */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="editor-tab-label justify-between flex-wrap gap-2">
                <span>Target Job Description</span>
                <label className="cursor-pointer text-[10px] font-label px-2.5 py-1 rounded bg-[#161B22] border border-[#2A303C] hover:border-[#3654FF] text-[#9CA3AF] hover:text-white transition-all inline-flex items-center gap-1.5">
                  {uploadingJd ? (
                    <>
                      <span className="loading-spinner" />
                      <span>Extracting text…</span>
                    </>
                  ) : (
                    <>
                      <span>📁 upload file (.pdf, .docx, .txt)</span>
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

              {/* Upload Success Badge */}
              {jdFileName && (
                <div className="text-[11px] font-label text-[#1F9D6B] px-4 py-1.5 bg-[#1F9D6B]/10 border-b border-[#2A303C] flex items-center justify-between">
                  <span>{jdFileName} uploaded ✓</span>
                  <button
                    onClick={() => setJdFileName(null)}
                    className="text-[#9CA3AF] hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                className="editor-textarea flex-1"
                placeholder="Paste the full job description or upload a file above..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Divider */}
            <div className="editor-divider-v hidden md:block" />
            <div className="editor-divider-h block md:hidden" />

            {/* Resume pane */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="editor-tab-label justify-between flex-wrap gap-2">
                <span>Your Candidate Resume</span>
                <label className="cursor-pointer text-[10px] font-label px-2.5 py-1 rounded bg-[#161B22] border border-[#2A303C] hover:border-[#3654FF] text-[#9CA3AF] hover:text-white transition-all inline-flex items-center gap-1.5">
                  {uploadingResume ? (
                    <>
                      <span className="loading-spinner" />
                      <span>Extracting text…</span>
                    </>
                  ) : (
                    <>
                      <span>📁 upload file (.pdf, .docx, .txt)</span>
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

              {/* Upload Success Badge */}
              {resumeFileName && (
                <div className="text-[11px] font-label text-[#1F9D6B] px-4 py-1.5 bg-[#1F9D6B]/10 border-b border-[#2A303C] flex items-center justify-between">
                  <span>{resumeFileName} uploaded ✓</span>
                  <button
                    onClick={() => setResumeFileName(null)}
                    className="text-[#9CA3AF] hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                className="editor-textarea flex-1"
                placeholder="Paste your full resume text or upload a file above..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* ── Action Row ── */}
        <div className="flex flex-col items-start gap-3">
          <button
            className="btn-primary cursor-pointer"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Processing Pipeline…
              </>
            ) : (
              `Generate Resume with ${TEMPLATES.find((t) => t.id === selectedTemplateId)?.name} →`
            )}
          </button>

          {error && <div className="error-bar">{error}</div>}
        </div>

        {/* ── ANIMATED GENERATION PROGRESS HUD MODAL ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 rounded-2xl bg-[#161B22]/90 backdrop-blur-xl border border-[#3654FF]/50 shadow-2xl shadow-indigo-950/60 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#2A303C] pb-3">
                <div className="flex items-center gap-3">
                  <span className="loading-spinner" />
                  <span className="font-heading font-bold text-white text-sm">
                    Tailoring Pipeline Active
                  </span>
                </div>
                <span className="font-label text-xs text-[#3654FF] animate-pulse font-bold">
                  GEMINI 2.5 LLM
                </span>
              </div>

              {/* Step Progress List */}
              <div className="space-y-2.5 font-label text-xs">
                <div className="flex items-center gap-3">
                  <span className={loadingStage >= 0 ? "text-[#1F9D6B] font-bold" : "text-[#6B7280]"}>
                    {loadingStage > 0 ? "✓" : "⟳"}
                  </span>
                  <span className={loadingStage >= 0 ? "text-white font-medium" : "text-[#6B7280]"}>
                    Stage 1: Extracting Job Description Requirements & Tech Stack
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={loadingStage >= 1 ? "text-[#1F9D6B] font-bold" : "text-[#6B7280]"}>
                    {loadingStage > 1 ? "✓" : loadingStage === 1 ? "⟳" : "○"}
                  </span>
                  <span className={loadingStage >= 1 ? "text-white font-medium" : "text-[#6B7280]"}>
                    Stage 2: Parsing Candidate Resume Work History & Skills
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={loadingStage >= 2 ? "text-[#1F9D6B] font-bold" : "text-[#6B7280]"}>
                    {loadingStage > 2 ? "✓" : loadingStage === 2 ? "⟳" : "○"}
                  </span>
                  <span className={loadingStage >= 2 ? "text-white font-medium" : "text-[#6B7280]"}>
                    Stage 3: Computing Skillset Overlap & Normalized Stemming Match Score
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={loadingStage >= 3 ? "text-[#3654FF] font-bold" : "text-[#6B7280]"}>
                    {loadingStage >= 3 ? "⟳" : "○"}
                  </span>
                  <span className={loadingStage >= 3 ? "text-white font-medium" : "text-[#6B7280]"}>
                    Stage 4: Verifying Anti-Fabrication Guardrails & Formatting Selected PDF Template
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#0F1419] rounded-full overflow-hidden border border-[#2A303C]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#3654FF] via-[#5B73FF] to-[#1F9D6B]"
                  initial={{ width: "10%" }}
                  animate={{ width: loadingStage === 0 ? "25%" : loadingStage === 1 ? "50%" : loadingStage === 2 ? "75%" : "95%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results Section ── */}
        {result && (
          <div className="space-y-6">
            {/* View Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A303C] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("diff")}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "diff"
                      ? "bg-[#3654FF] text-white shadow-lg shadow-indigo-500/25"
                      : "bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2A303C]"
                  }`}
                >
                  Skillset Diff & Analysis
                </button>
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "pdf"
                      ? "bg-[#3654FF] text-white shadow-lg shadow-indigo-500/25"
                      : "bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2A303C]"
                  }`}
                >
                  📄 Preview PDF ({TEMPLATES.find((t) => t.id === selectedTemplateId)?.name})
                </button>
              </div>

              <button
                className="btn-secondary cursor-pointer self-start sm:self-auto"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? "Preparing PDF…" : "Download Tailored PDF"}
              </button>
            </div>

            {/* TAB 1: Skillset Diff & Analysis Card */}
            {activeTab === "diff" && (
              <div className="document-card p-8 md:p-10 shadow-2xl">
                {/* ══ OVERHAULED MATCH SCORE DASHBOARD HEADER ══ */}
                <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0F1419] to-[#161B22] border border-[#2A303C] text-white shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  {/* Left: SVG Circular Gauge Ring */}
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        {/* Animated Arc */}
                        {(() => {
                          const rating = getMatchRating(result.tailored.match_score);
                          const strokeDash = (result.tailored.match_score / 100) * 264;
                          return (
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              stroke={rating.color}
                              strokeWidth="10"
                              strokeDasharray="264"
                              strokeDashoffset={264 - strokeDash}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        })()}
                      </svg>
                      {/* Center Score Number */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-heading text-3xl font-extrabold text-white leading-none">
                          {result.tailored.match_score}%
                        </span>
                        <span className="font-label text-[9px] text-[#9CA3AF] uppercase tracking-widest mt-0.5 font-bold">
                          MATCH
                        </span>
                      </div>
                    </div>

                    {/* Score Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-label text-xs uppercase tracking-widest text-[#6B7280] font-bold">
                          SKILLSET MATCH INDEX
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
                      </div>
                      <h3 className="font-heading text-xl font-bold text-white">
                        {result.tailored.match_score >= 75
                          ? "High Skillset Alignment"
                          : result.tailored.match_score >= 45
                          ? "Moderate Skillset Coverage"
                          : "Low Skill Alignment"}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] max-w-sm leading-relaxed">
                        Your experience covers {result.tailored.matched_skills.length} of the {result.tailored.matched_skills.length + result.tailored.missing_skills.length} evaluated requirements in the Job Description.
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Stat Badges */}
                  <div className="flex md:flex-col gap-3 shrink-0 w-full md:w-auto justify-stretch">
                    <div className="flex-1 px-4 py-2.5 rounded-xl bg-[#161B22] border border-[#1F9D6B]/30 flex items-center justify-between gap-4">
                      <span className="font-label text-xs text-[#9CA3AF]">Matched Skills</span>
                      <span className="font-heading font-extrabold text-sm text-[#1F9D6B]">
                        + {result.tailored.matched_skills.length}
                      </span>
                    </div>
                    <div className="flex-1 px-4 py-2.5 rounded-xl bg-[#161B22] border border-[#D08C1B]/30 flex items-center justify-between gap-4">
                      <span className="font-label text-xs text-[#9CA3AF]">Skill Gaps</span>
                      <span className="font-heading font-extrabold text-sm text-[#D08C1B]">
                        - {result.tailored.missing_skills.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills Diff Section Header & Filter Tabs */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                  <span className="section-label font-bold text-[#0F1419]">Skillset Diff Breakdown</span>

                  <div className="flex items-center gap-1 bg-[#E5E7EB] p-1 rounded-xl text-xs font-label">
                    <button
                      onClick={() => setDiffFilter("all")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                        diffFilter === "all" ? "bg-white text-[#0F1419] shadow-sm" : "text-[#6B7280] hover:text-[#0F1419]"
                      }`}
                    >
                      All ({result.tailored.matched_skills.length + result.tailored.missing_skills.length})
                    </button>
                    <button
                      onClick={() => setDiffFilter("matched")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                        diffFilter === "matched" ? "bg-white text-[#1F9D6B] shadow-sm" : "text-[#6B7280] hover:text-[#1F9D6B]"
                      }`}
                    >
                      + Matched ({result.tailored.matched_skills.length})
                    </button>
                    <button
                      onClick={() => setDiffFilter("missing")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                        diffFilter === "missing" ? "bg-white text-[#D08C1B] shadow-sm" : "text-[#6B7280] hover:text-[#D08C1B]"
                      }`}
                    >
                      - Missing ({result.tailored.missing_skills.length})
                    </button>
                  </div>
                </div>

                {/* Overhauled Visual Diff Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                  {(diffFilter === "all" || diffFilter === "matched") &&
                    result.tailored.matched_skills.map((skill, i) => (
                      <div
                        key={`m-${i}`}
                        className="px-3.5 py-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-label text-xs font-semibold flex items-center justify-between shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[#059669] font-bold">✓</span>
                          {skill}
                        </span>
                        <span className="text-[10px] text-[#10B981] uppercase tracking-wider font-bold">MATCHED</span>
                      </div>
                    ))}
                  {(diffFilter === "all" || diffFilter === "missing") &&
                    result.tailored.missing_skills.map((skill, i) => (
                      <div
                        key={`g-${i}`}
                        className="px-3.5 py-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] font-label text-xs font-semibold flex items-center justify-between shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[#D97706] font-bold">⚠️</span>
                          {skill}
                        </span>
                        <span className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-bold">MISSING</span>
                      </div>
                    ))}
                </div>

                {/* Missing Skills Strategy Tip */}
                {result.tailored.missing_skills.length > 0 && (
                  <div className="mb-8 p-4.5 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] text-[#92400E] text-xs font-sans flex items-start gap-3 shadow-sm">
                    <span className="text-lg">💡</span>
                    <div>
                      <div className="font-bold font-heading mb-0.5 text-[#78350F]">
                        Gap Analysis Strategy for Missing Skills:
                      </div>
                      <p className="leading-relaxed">
                        Skills marked with <span className="font-semibold text-[#B45309]">MISSING</span> were not found on your resume. Our AI <strong>never fabricates fake experience</strong> to protect your interview integrity. If you actually have experience with any of these missing tools, simply add them to your input resume text above and click <strong>Generate</strong> to instantly boost your match score!
                      </p>
                    </div>
                  </div>
                )}

                {/* Tailored Experience */}
                {result.tailored.rewritten_experience.length > 0 && (
                  <div className="mt-8">
                    <div className="mb-4">
                      <span className="section-label font-bold">Tailored Experience (Reordered to JD Skillset)</span>
                    </div>
                    {result.tailored.rewritten_experience.map((exp, idx) => (
                      <div key={idx} className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                          <div>
                            <span
                              className="font-heading font-semibold text-sm"
                              style={{ color: "#0F1419" }}
                            >
                              {exp.title}
                            </span>
                            <span className="text-sm" style={{ color: "#6B7280" }}>
                              {" "}| {exp.company}
                            </span>
                          </div>
                          <span className="font-label text-xs" style={{ color: "#9CA3AF" }}>
                            {exp.dates}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {exp.bullets.map((bullet, bIdx) => {
                            const key = `${idx}-${bIdx}`;
                            const isCopied = copiedBulletIdx === key;
                            return (
                              <li
                                key={bIdx}
                                className="text-sm pl-4 relative group flex items-start justify-between gap-2"
                                style={{ color: "#374151", lineHeight: "1.65" }}
                              >
                                <div>
                                  <span className="absolute left-0" style={{ color: "#9CA3AF" }}>•</span>
                                  {bullet}
                                </div>
                                <button
                                  onClick={() => handleCopyBullet(bullet, key)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-label px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#0F1419] border border-[#E5E7EB] shrink-0 cursor-pointer"
                                >
                                  {isCopied ? "✓ Copied" : "Copy"}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reordered Skills */}
                <div className="mt-8">
                  <div className="mb-3">
                    <span className="section-label font-bold">Reordered Skills (JD Matched Skills Surfaced First)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tailored.rewritten_skills.map((skill, i) => {
                      const isMatched = result.tailored.matched_skills.some((ms) => {
                        const msLower = ms.toLowerCase().trim();
                        const sLower = skill.toLowerCase().trim();
                        if (msLower === sLower || msLower.includes(sLower) || sLower.includes(msLower)) return true;
                        const msClean = msLower.replace(/\b(integration|integrations|optimization|optimizations|architecture|design|development|testing|services)\b/g, "").trim();
                        const sClean = sLower.replace(/\b(integration|integrations|optimization|optimizations|architecture|design|development|testing|services)\b/g, "").trim();
                        return msClean.replace(/s$/, "") === sClean.replace(/s$/, "") || msClean.includes(sClean) || sClean.includes(msClean);
                      });
                      return (
                        <span
                          key={i}
                          className={`skill-tag ${isMatched ? "skill-tag-matched" : "skill-tag-neutral"}`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Embedded Live Finished PDF Viewer using Selected Template */}
            {activeTab === "pdf" && pdfPreviewUrl && (
              <div className="p-4 rounded-2xl bg-[#161B22]/90 backdrop-blur-xl border border-[#2A303C] shadow-2xl">
                <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-[#2A303C]">
                  <span className="font-label text-xs uppercase tracking-widest text-white font-bold">
                    FINISHED PDF PREVIEW ({TEMPLATES.find((t) => t.id === selectedTemplateId)?.name})
                  </span>
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-label text-[#3654FF] hover:underline"
                  >
                    Open in new tab ↗
                  </a>
                </div>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-[650px] rounded-xl border border-[#2A303C]"
                  title="Tailored Resume PDF Preview"
                />
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
