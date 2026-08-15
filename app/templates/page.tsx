"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Template {
  id: string;
  name: string;
  category: string;
  badge: string;
  themeColor: string;
  description: string;
  features: string[];
  layoutType: "single-column" | "sidebar" | "executive" | "dark-cyber" | "compact" | "academic";
  sampleData: {
    name: string;
    title: string;
    contact: string;
    summary?: string;
    experience: {
      title: string;
      company: string;
      dates: string;
      bullets: string[];
    }[];
    skills: string[];
    projects?: {
      name: string;
      bullets: string[];
    }[];
  };
}

const TEMPLATES: Template[] = [
  {
    id: "ats-standard",
    name: "ATS Classic Single-Column",
    category: "Software Engineers & Systems Developers",
    badge: "100% ATS Safe",
    themeColor: "#0F1419",
    description:
      "Traditional single-column layout prioritizing clean section hierarchy, bold experience titles, right-aligned dates, and standard bullet list structure.",
    features: [
      "Zero tables, multi-column blocks, or graphics",
      "Standard 10.5pt font sizing with 15pt bold section titles",
      "Optimized for Lever, Greenhouse, Workday & Taleo scanners",
    ],
    layoutType: "single-column",
    sampleData: {
      name: "ALEX RIVERA",
      title: "Senior Full-Stack Engineer",
      contact: "alex@example.com | (555) 019-2834 | San Francisco, CA | github.com/alexrivera",
      experience: [
        {
          title: "Senior Full-Stack Engineer",
          company: "TechCorp Inc.",
          dates: "Jan 2022 - Present",
          bullets: [
            "Architected and launched a real-time web platform using Next.js, React, and TypeScript, reducing page load times by 40%.",
            "Built high-throughput RESTful APIs and MongoDB data pipelines using Node.js serving over 100k daily active users.",
          ],
        },
      ],
      skills: ["TypeScript", "React", "Next.js", "Node.js", "REST APIs", "GraphQL", "Git"],
    },
  },
  {
    id: "modern-sidebar",
    name: "Modern Tech Sidebar",
    category: "Full-Stack Developers & Product Engineers",
    badge: "Modern & Visual",
    themeColor: "#3654FF",
    description:
      "Distinct two-zone presentation: left accent sidebar dedicated to contact info, technical skills, and education; right column dedicated to experience and projects.",
    features: [
      "Visual sidebar division for instant scannability",
      "Indigo badge pills for technical competencies",
      "High visual impact for human recruiter reviews",
    ],
    layoutType: "sidebar",
    sampleData: {
      name: "SARAH CHEN",
      title: "Cloud Backend Engineer",
      contact: "sarah.chen@example.com | New York, NY | github.com/sarahchen",
      summary: "Backend specialist focused on high-throughput microservices, Docker containerization, and AWS infrastructure.",
      experience: [
        {
          title: "Cloud Backend Engineer",
          company: "DataScale Systems",
          dates: "Mar 2021 - Present",
          bullets: [
            "Designed and maintained distributed microservices using Python, Go, and PostgreSQL handling 5M daily API requests.",
            "Automated AWS cloud infrastructure deployment using Terraform and Docker, speeding CI/CD by 65%.",
          ],
        },
      ],
      skills: ["Python", "Go", "Docker", "Kubernetes", "AWS", "Terraform", "PostgreSQL", "Kafka"],
    },
  },
  {
    id: "executive-leadership",
    name: "Executive Leadership",
    category: "Tech Leads, Engineering Managers & Architects",
    badge: "Executive Format",
    themeColor: "#D08C1B",
    description:
      "Navy and gold accent styling emphasizing professional leadership summaries, engineering metrics, team size, and business impact.",
    features: [
      "Structured executive summary & leadership highlights",
      "Bold metric callouts for business impact",
      "Sophisticated border separations between roles",
    ],
    layoutType: "executive",
    sampleData: {
      name: "DAVID MILLER",
      title: "Lead Frontend Architect",
      contact: "david.miller@example.com | Austin, TX | linkedin.com/in/davidmiller",
      summary: "Engineering Lead with 7+ years driving frontend architecture, web performance optimization, and cross-functional team growth.",
      experience: [
        {
          title: "Lead Frontend Engineer",
          company: "RetailPulse Inc.",
          dates: "Feb 2021 - Present",
          bullets: [
            "Led cross-functional team of 6 frontend engineers building e-commerce applications.",
            "Optimized core web vitals and asset delivery, boosting conversion rate by 22%.",
          ],
        },
      ],
      skills: ["React", "Vue.js", "Tailwind CSS", "Web Performance", "Cypress", "GraphQL", "Figma"],
    },
  },
  {
    id: "dark-cyber",
    name: "Creative Developer Dark",
    category: "Creative Technologists & UI/UX Engineers",
    badge: "Dark Theme",
    themeColor: "#1F9D6B",
    description:
      "A high-contrast dark preview card featuring emerald green accents, monospace code styling, and tag pill badges.",
    features: [
      "Dark theme paper aesthetic with glowing emerald accents",
      "Monospace code-like header and experience bullets",
      "Perfect for portfolio resumes and creative tech roles",
    ],
    layoutType: "dark-cyber",
    sampleData: {
      name: "ELENA ROSTOVA",
      title: "UI/UX & Creative Engineer",
      contact: "elena@rostova.dev | Remote | github.com/erostova",
      experience: [
        {
          title: "Creative Frontend Developer",
          company: "Nexus Studio",
          dates: "Aug 2022 - Present",
          bullets: [
            "Built interactive WebGL 3D web experiences using Three.js and React Spring.",
            "Engineered responsive UI component system used across 12 client products.",
          ],
        },
      ],
      skills: ["Three.js", "React", "TypeScript", "Tailwind CSS", "Figma", "WebGL", "GSAP"],
    },
  },
  {
    id: "compact-dense",
    name: "Compact One-Page Dense",
    category: "Senior Engineers with 5+ Years Experience",
    badge: "High Density",
    themeColor: "#8B5CF6",
    description:
      "Space-efficient, high-density layout designed to fit extensive career histories and bullet points cleanly onto a single page without clutter.",
    features: [
      "Compact line spacing and tight section padding",
      "Inline skills list and bold lead-in keywords",
      "Maximum content density per vertical inch",
    ],
    layoutType: "compact",
    sampleData: {
      name: "MARCUS VANCE",
      title: "Senior DevOps & Platform Engineer",
      contact: "marcus.vance@example.com | Seattle, WA | github.com/mvance",
      experience: [
        {
          title: "Senior Infrastructure Engineer",
          company: "CloudGrid Tech",
          dates: "May 2020 - Present",
          bullets: [
            "Managed Kubernetes clusters across AWS and GCP, maintaining 99.99% system availability.",
            "Architected CI/CD pipelines reducing build times from 25 minutes to 4 minutes.",
          ],
        },
      ],
      skills: ["Kubernetes", "AWS", "Terraform", "Docker", "Python", "Bash", "Prometheus", "Helm"],
    },
  },
  {
    id: "academic-research",
    name: "Academic & AI Research",
    category: "AI/ML Engineers, Data Scientists & Researchers",
    badge: "Academic Format",
    themeColor: "#0284C7",
    description:
      "Formal serif/sans hybrid layout emphasizing technical publications, research projects, algorithmic models, and academic background.",
    features: [
      "Dedicated Research & Publication sections",
      "Clean serif headings paired with sans body text",
      "Structured dataset & ML model metadata fields",
    ],
    layoutType: "academic",
    sampleData: {
      name: "DR. ARJUN PATEL",
      title: "AI Research Scientist",
      contact: "arjun.patel@example.com | Boston, MA | scholar.google.com/apatel",
      summary: "Machine Learning Researcher specializing in Large Language Models, RAG architectures, and NLP optimization.",
      experience: [
        {
          title: "Staff AI Researcher",
          company: "NeuralLabs AI",
          dates: "Jul 2021 - Present",
          bullets: [
            "Co-authored research on transformer attention pruning, reducing inference latency by 30%.",
            "Trained multi-modal LLMs using PyTorch and Distributed Data Parallel across 128 GPUs.",
          ],
        },
      ],
      skills: ["PyTorch", "Python", "Transformers", "LLMs", "RAG", "CUDA", "C++", "MLOps"],
    },
  },
];

export default function TemplatesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>("ats-standard");

  const active = TEMPLATES.find((t) => t.id === selectedId) || TEMPLATES[0];

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#E5E7EB] flex flex-col font-sans relative overflow-x-hidden bg-grid-pattern">
      {/* Background glowing orb mesh */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-glow-orb-1 pointer-events-none z-0" />
      <div className="absolute top-96 right-1/4 w-[600px] h-[600px] bg-glow-orb-2 pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-6 md:px-8 py-16 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label text-xs uppercase tracking-widest text-[#3654FF] font-bold">
            6 DIVERSE ATS LAYOUTS
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 mb-4">
            ATS Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] via-[#5B73FF] to-[#1F9D6B]">Template Gallery</span>
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed">
            Choose from 6 distinct, professionally engineered template styles designed to pass ATS recruitment screeners while standing out to human hiring managers.
          </p>
        </div>

        {/* 6 Template Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {TEMPLATES.map((tmpl) => {
            const isSelected = tmpl.id === selectedId;
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelectedId(tmpl.id)}
                className={`p-3 rounded-xl font-heading text-xs font-semibold text-center transition-all cursor-pointer border flex flex-col items-center justify-between gap-2 min-h-[90px] ${
                  isSelected
                    ? "bg-[#3654FF] text-white border-[#3654FF] shadow-lg shadow-indigo-500/25 scale-[1.02]"
                    : "bg-[#161B22] text-[#9CA3AF] border-[#2A303C] hover:border-[#3654FF]/40 hover:text-white"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tmpl.themeColor }}
                />
                <span className="line-clamp-2">{tmpl.name}</span>
                <span className="text-[9px] font-label opacity-75">{tmpl.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Template Details & Live Preview Box */}
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16"
        >
          {/* Details Column */}
          <div className="lg:col-span-5 p-8 rounded-2xl bg-[#161B22]/90 backdrop-blur-xl shadow-2xl border border-[#2A303C] space-y-6">
            <div className="flex items-center justify-between">
              <span
                className="font-label text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-md border"
                style={{
                  color: active.themeColor,
                  backgroundColor: `${active.themeColor}18`,
                  borderColor: `${active.themeColor}33`,
                }}
              >
                {active.badge}
              </span>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-white">
                {active.name}
              </h2>
              <p className="text-xs text-[#9CA3AF] font-label mt-1">
                {active.category}
              </p>
            </div>

            <p className="text-sm text-[#D4D4D8] leading-relaxed">
              {active.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-[#2A303C]">
              <div className="font-label text-xs uppercase tracking-wider text-[#6B7280] font-bold mb-2">
                Template Highlights
              </div>
              {active.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                  <span style={{ color: active.themeColor }}>✓</span>
                  {feat}
                </div>
              ))}
            </div>

            <Link
              href="/app"
              className="w-full inline-flex items-center justify-center bg-[#3654FF] hover:bg-[#2A44E0] text-white py-3.5 rounded-xl font-heading font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
            >
              Use This Template in Workspace →
            </Link>
          </div>

          {/* DYNAMIC LIVE TEMPLATE PREVIEW CARD */}
          <div className="lg:col-span-7">
            {/* 1. Single Column Classic */}
            {active.layoutType === "single-column" && (
              <div className="p-8 md:p-10 rounded-2xl bg-[#FAF9F6] text-[#0F1419] border border-white/10 shadow-2xl space-y-6">
                <div className="border-b-2 border-[#0F1419] pb-4 text-center">
                  <h3 className="font-heading text-2xl font-extrabold tracking-tight">
                    {active.sampleData.name}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mt-0.5">
                    {active.sampleData.title}
                  </p>
                  <p className="text-xs font-label text-[#6B7280] mt-1">
                    {active.sampleData.contact}
                  </p>
                </div>

                <div>
                  <div className="font-label text-xs uppercase tracking-wider font-extrabold text-[#0F1419] mb-2 border-b border-[#E5E7EB] pb-1">
                    Professional Experience
                  </div>
                  {active.sampleData.experience.map((exp, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{exp.title} | {exp.company}</span>
                        <span className="font-label text-[#6B7280]">{exp.dates}</span>
                      </div>
                      <ul className="space-y-1 mt-1 pl-4 text-xs text-[#374151]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="list-disc">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="font-label text-xs uppercase tracking-wider font-extrabold text-[#0F1419] mb-2 border-b border-[#E5E7EB] pb-1">
                    Skills & Technical Proficiencies
                  </div>
                  <p className="font-label text-xs text-[#374151]">
                    {active.sampleData.skills.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Modern Sidebar Layout */}
            {active.layoutType === "sidebar" && (
              <div className="rounded-2xl bg-[#FAF9F6] text-[#0F1419] border border-white/10 shadow-2xl grid grid-cols-12 overflow-hidden min-h-[420px]">
                {/* Left Sidebar */}
                <div className="col-span-4 bg-[#3654FF] text-white p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold">{active.sampleData.name}</h3>
                      <p className="text-[10px] font-label opacity-80 mt-0.5">{active.sampleData.title}</p>
                    </div>
                    <div className="text-[10px] font-label opacity-75 leading-tight space-y-1">
                      <div>sarah.chen@example.com</div>
                      <div>New York, NY</div>
                    </div>
                    <div className="pt-3 border-t border-white/20">
                      <div className="font-label text-[10px] uppercase font-bold mb-2 tracking-wider">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {active.sampleData.skills.map((s, idx) => (
                          <span key={idx} className="text-[9px] font-label px-1.5 py-0.5 rounded bg-white/15">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Main Content */}
                <div className="col-span-8 p-6 space-y-4">
                  {active.sampleData.summary && (
                    <p className="text-xs text-[#374151] italic border-l-2 border-[#3654FF] pl-3">
                      {active.sampleData.summary}
                    </p>
                  )}
                  <div>
                    <div className="font-label text-xs uppercase tracking-wider font-bold text-[#3654FF] mb-2 border-b border-[#E5E7EB] pb-1">
                      Experience
                    </div>
                    {active.sampleData.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="text-xs font-bold">{exp.title}</div>
                        <div className="text-[10px] font-label text-[#6B7280]">{exp.company} • {exp.dates}</div>
                        <ul className="space-y-1 mt-1 pl-3 text-[11px] text-[#374151]">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="list-disc">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Executive Leadership Layout */}
            {active.layoutType === "executive" && (
              <div className="p-8 rounded-2xl bg-[#FAF9F6] text-[#0F1419] border-t-8 border-[#D08C1B] border-x border-b border-white/10 shadow-2xl space-y-5">
                <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="font-heading text-xl font-extrabold text-[#0F1419]">
                      {active.sampleData.name}
                    </h3>
                    <p className="text-xs font-bold text-[#D08C1B] uppercase tracking-wide">
                      {active.sampleData.title}
                    </p>
                  </div>
                  <p className="text-[10px] font-label text-[#6B7280] text-right">
                    {active.sampleData.contact}
                  </p>
                </div>

                {active.sampleData.summary && (
                  <div className="bg-[#FAF9F6] p-3 rounded border-l-4 border-[#D08C1B] text-xs text-[#374151] font-medium">
                    {active.sampleData.summary}
                  </div>
                )}

                <div>
                  <div className="font-label text-xs uppercase tracking-wider font-bold text-[#0F1419] mb-2 border-b border-[#E5E7EB] pb-1">
                    Leadership Experience
                  </div>
                  {active.sampleData.experience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold text-[#0F1419]">
                        <span>{exp.title}</span>
                        <span className="font-label text-[#D08C1B]">{exp.dates}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#6B7280] mb-1">{exp.company}</div>
                      <ul className="space-y-1 pl-4 text-xs text-[#374151]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="list-disc">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="font-label text-xs uppercase tracking-wider font-bold text-[#0F1419] mb-1">
                    Executive Competencies
                  </div>
                  <p className="font-label text-xs text-[#374151]">
                    {active.sampleData.skills.join(" • ")}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Creative Developer Dark Theme Layout */}
            {active.layoutType === "dark-cyber" && (
              <div className="p-8 rounded-2xl bg-[#0F1419] text-[#E5E7EB] border border-[#1F9D6B]/40 shadow-2xl shadow-emerald-900/20 space-y-5 font-label">
                <div className="border-b border-[#1F9D6B]/30 pb-3 flex justify-between items-end">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white tracking-tight">
                      {active.sampleData.name}
                    </h3>
                    <p className="text-xs text-[#1F9D6B] font-mono mt-0.5">
                      {"// "}{active.sampleData.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#6B7280]">
                    {active.sampleData.contact}
                  </span>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1F9D6B] font-bold mb-2">
                    &gt; WORK_EXPERIENCE
                  </div>
                  {active.sampleData.experience.map((exp, i) => (
                    <div key={i} className="bg-[#161B22] p-4 rounded-xl border border-[#2A303C]">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>{exp.title}</span>
                        <span className="text-[#1F9D6B]">{exp.dates}</span>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] mb-2">{exp.company}</div>
                      <ul className="space-y-1 text-xs text-[#D4D4D8]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx}>+ {b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1F9D6B] font-bold mb-2">
                    &gt; STACK_PILLS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {active.sampleData.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded bg-[#1F9D6B]/10 text-[#1F9D6B] border border-[#1F9D6B]/30 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Compact One-Page Dense Layout */}
            {active.layoutType === "compact" && (
              <div className="p-6 rounded-2xl bg-[#FAF9F6] text-[#0F1419] border border-white/10 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-baseline border-b border-[#0F1419] pb-2">
                  <h3 className="font-heading text-lg font-extrabold">{active.sampleData.name}</h3>
                  <span className="font-label text-[10px] text-[#6B7280]">{active.sampleData.contact}</span>
                </div>

                <div>
                  <div className="font-label text-[11px] uppercase font-extrabold text-[#8B5CF6] border-b border-[#E5E7EB] pb-0.5 mb-1.5">
                    Core Technical Experience
                  </div>
                  {active.sampleData.experience.map((exp, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-[#0F1419]">
                        <span>{exp.title} — {exp.company}</span>
                        <span className="font-label text-[10px] text-[#6B7280]">{exp.dates}</span>
                      </div>
                      <ul className="space-y-0.5 mt-0.5 pl-3 text-[11px] text-[#374151]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="list-disc">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="font-label text-[11px] uppercase font-extrabold text-[#8B5CF6] border-b border-[#E5E7EB] pb-0.5 mb-1">
                    Technical Stack
                  </div>
                  <p className="font-label text-[11px] text-[#374151] leading-tight">
                    {active.sampleData.skills.join(" • ")}
                  </p>
                </div>
              </div>
            )}

            {/* 6. Academic & AI Research Layout */}
            {active.layoutType === "academic" && (
              <div className="p-8 rounded-2xl bg-[#FAF9F6] text-[#0F1419] border border-white/10 shadow-2xl space-y-5 font-serif">
                <div className="text-center border-b border-[#0F1419] pb-3">
                  <h3 className="text-2xl font-bold">{active.sampleData.name}</h3>
                  <p className="text-xs italic text-[#0284C7] font-sans">{active.sampleData.title}</p>
                  <p className="text-[10px] font-sans text-[#6B7280] mt-1">{active.sampleData.contact}</p>
                </div>

                <div>
                  <div className="font-sans text-xs uppercase tracking-wider font-extrabold text-[#0284C7] mb-2 border-b border-[#E5E7EB] pb-1">
                    Research & Engineering Positions
                  </div>
                  {active.sampleData.experience.map((exp, i) => (
                    <div key={i} className="mb-3 font-sans">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{exp.title}, {exp.company}</span>
                        <span className="font-mono text-[10px] text-[#6B7280]">{exp.dates}</span>
                      </div>
                      <ul className="space-y-1 mt-1 pl-4 text-xs text-[#374151]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="list-disc">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="font-sans">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0284C7] mb-1">
                    Technical Stack & Algorithms
                  </div>
                  <p className="font-mono text-xs text-[#374151]">
                    {active.sampleData.skills.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
