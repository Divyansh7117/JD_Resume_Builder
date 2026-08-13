"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HowItWorksPage() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      num: "01",
      title: "Input Job Description & Resume",
      tagline: "RAW TEXT PARSING",
      description:
        "Paste the target job description alongside your current resume into our dual-pane editor. The Gemini pipeline extracts structured requirements, must-have skills, and resume work history.",
      details: [
        "Identifies core technical skills & soft requirements",
        "Extracts company names, dates, titles, and bullet lists",
        "Maintains total data privacy inside your browser session",
      ],
    },
    {
      num: "02",
      title: "Deterministic Skill Diffing",
      tagline: "TRANSPARENT MATCHING",
      description:
        "The system compares your candidate skills against the JD criteria using normalized token matching (handling plurals like APIs ↔ API and acronyms like SSR ↔ Server-Side Rendering).",
      details: [
        "Calculates exact Match Score percentage (0–100%)",
        "Generates git-style + Matched and - Missing skills diff",
        "Highlights matched skill pills in your reordered skills list",
      ],
    },
    {
      num: "03",
      title: "Anti-Fabrication Tailoring",
      tagline: "FACT-CHECKED REWRITING",
      description:
        "The LLM reorders and rephrases your existing experience bullets to prioritize JD-relevant achievements. Built-in validator guardrails automatically reject any attempt to invent new dates, titles, or metrics.",
      details: [
        "Reorders bullet points to lead with role-relevant keywords",
        "Single-retry validation loop blocks invented facts",
        "Preserves exact company names, titles, and date ranges",
      ],
    },
    {
      num: "04",
      title: "ATS-Safe PDF Export",
      tagline: "ONE-CLICK DOWNLOAD",
      description:
        "Generate a clean, single-column PDF resume using @react-pdf/renderer. Formatted specifically for optimal parsing by ATS recruiting software like Lever, Greenhouse, and Workday.",
      details: [
        "Single-column ATS compliant layout",
        "Clean typography and standard section hierarchy",
        "Instant vector PDF download ready for submission",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#E5E7EB] flex flex-col font-sans relative overflow-x-hidden bg-grid-pattern">
      {/* Background glowing orb mesh */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-glow-orb-1 pointer-events-none z-0" />
      <div className="absolute top-96 right-1/4 w-[600px] h-[600px] bg-glow-orb-2 pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 md:px-8 py-16 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label text-xs uppercase tracking-widest text-[#3654FF] font-bold">
            PIPELINE ARCHITECTURE
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 mb-4">
            How the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] via-[#5B73FF] to-[#1F9D6B]">AI Pipeline</span> Works
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed">
            From raw job description text to an ATS-optimized, fact-checked resume PDF in four automated steps.
          </p>
        </div>

        {/* Step List */}
        <div className="space-y-12 mb-20">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-2xl bg-[#161B22]/90 border border-[#2A303C] hover:border-[#3654FF]/40 backdrop-blur-xl shadow-2xl transition-all grid grid-cols-1 md:grid-cols-12 gap-6 items-start hover:-translate-y-1"
            >
              <div className="md:col-span-2">
                <span className="font-heading text-4xl font-extrabold text-[#3654FF]">
                  {step.num}
                </span>
                <div className="font-label text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mt-1">
                  {step.tagline}
                </div>
              </div>

              <div className="md:col-span-10 space-y-3">
                <h3 className="font-heading text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  {step.description}
                </p>

                <ul className="pt-2 space-y-1.5 text-xs text-[#D4D4D8] font-label">
                  {step.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-center gap-2">
                      <span className="text-[#1F9D6B]">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-[#161B22] via-[#1E2638] to-[#161B22] border border-[#3654FF]/40 text-center flex flex-col items-center shadow-2xl backdrop-blur-xl">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Try it with your resume now
          </h2>
          <p className="text-[#9CA3AF] max-w-xl text-sm mb-6 leading-relaxed">
            Test the pipeline with any job posting and see your instant match score.
          </p>
          <Link
            href="/app"
            className="bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 rounded-xl font-heading font-semibold text-base shadow-xl shadow-indigo-500/25 transition-all"
          >
            Launch Tailoring Tool →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
