"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FeaturesPage() {
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-[#3654FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "Anti-Fabrication Guardrail",
      description:
        "Guarantees 100% truthfulness. Automatically validates that no invented company names, fake promotions, altered date ranges, or exaggerated metrics are added to your resume.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#1F9D6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
          <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
          <path d="M22 13H18" />
        </svg>
      ),
      title: "Deterministic Skill Diffing",
      description:
        "Performs exact keyword matching between job description requirements and your experience, calculating a transparent 0-100% match score.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#D08C1B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      title: "Smart Normalization & Stemming",
      description:
        "Intelligently bridges plurals (APIs ↔ API), acronyms (SSR ↔ Server-Side Rendering), and suffix words so your skills are matched accurately.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#8B5CF6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: "ATS-Optimized PDF Export",
      description:
        "Generates clean, single-column, standard-font PDFs formatted specifically to pass Applicant Tracking System scanners.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#3654FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Low-Latency Dual LLM Pipeline",
      description:
        "Powered by Gemini 2.5 with constrained temperature (0.2) for reliable, low-variance tailoring in seconds.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#1F9D6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: "Clerk & MongoDB Integration",
      description:
        "Secure user authentication with Clerk and persistent MongoDB cloud integration for webhook user tracking.",
    },
  ];

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
            PLATFORM CAPABILITIES
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 mb-4">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] via-[#5B73FF] to-[#1F9D6B]">Truthful</span> Resume Tailoring
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed">
            Unlike generic AI tools that invent experience, JD → Resume is built around strict verification guardrails and deterministic skill matching.
          </p>
        </div>

        {/* Feature Grid with Glassmorphic Shadow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-6 rounded-2xl bg-[#161B22]/90 border border-[#2A303C] hover:border-[#3654FF]/40 transition-all flex flex-col justify-between backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-indigo-950/40 hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0F1419] border border-[#2A303C] flex items-center justify-center mb-4 shadow-inner">
                  {item.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-[#161B22] via-[#1E2638] to-[#161B22] border border-[#3654FF]/40 text-center flex flex-col items-center shadow-2xl backdrop-blur-xl">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Ready to tailor your application?
          </h2>
          <p className="text-[#9CA3AF] max-w-xl text-sm mb-6 leading-relaxed">
            Paste your job description and resume to get an instant match score and ATS PDF.
          </p>
          <Link
            href="/app"
            className="bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 rounded-xl font-heading font-semibold text-base shadow-xl shadow-indigo-500/25 transition-all"
          >
            Open Workspace Tool →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
