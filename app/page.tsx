"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, SignUpButton, SignInButton } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

const DEMO_SKILLS = [
  { name: "React", inResume: true, required: true },
  { name: "TypeScript", inResume: false, required: true },
  { name: "Next.js", inResume: true, required: true },
  { name: "Tailwind CSS", inResume: true, required: true },
  { name: "Node.js", inResume: true, required: true },
  { name: "REST APIs", inResume: true, required: true },
  { name: "Docker", inResume: false, required: true },
  { name: "GraphQL", inResume: false, required: true },
  { name: "PostgreSQL", inResume: false, required: true },
];

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const { isSignedIn } = useAuth();
  const [candidateSkills, setCandidateSkills] = useState<string[]>([
    "React",
    "Next.js",
    "Tailwind CSS",
    "Node.js",
    "REST APIs",
  ]);

  function toggleSkill(skillName: string) {
    if (candidateSkills.includes(skillName)) {
      setCandidateSkills(candidateSkills.filter((s) => s !== skillName));
    } else {
      setCandidateSkills([...candidateSkills, skillName]);
    }
  }

  const matchedSkills = DEMO_SKILLS.filter((s) => candidateSkills.includes(s.name));
  const missingSkills = DEMO_SKILLS.filter((s) => !candidateSkills.includes(s.name));
  const matchScore = Math.round((matchedSkills.length / DEMO_SKILLS.length) * 100);

  const fadeInVariant = (delay: number) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: shouldReduceMotion ? 0 : delay },
  });

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#E5E7EB] flex flex-col font-sans relative overflow-x-hidden bg-grid-pattern">
      {/* Ambient background glow orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-glow-orb-1 pointer-events-none z-0" />
      <div className="absolute top-96 right-1/4 w-[600px] h-[600px] bg-glow-orb-2 pointer-events-none z-0" />

      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        {/* Version Badge */}
        <motion.div {...fadeInVariant(0.05)}>
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#161B22]/90 border border-[#3654FF]/30 text-[10px] sm:text-xs font-label font-medium text-white shadow-lg backdrop-blur-md max-w-full truncate">
            <span className="w-2 h-2 rounded-full bg-[#1F9D6B] animate-pulse shrink-0" />
            AI Resume Tailoring Engine v2.5 • Fact-Checked & Truthful
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          {...fadeInVariant(0.1)}
          className="mt-6 font-heading text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]"
        >
          Tailor your resume to any job description <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] via-[#5B73FF] to-[#1F9D6B]">without inventing facts</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeInVariant(0.2)}
          className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#9CA3AF] max-w-2xl leading-relaxed"
        >
          Paste any job description and your resume. Get a customised version matching the required skillset with a transparent match score and finished ATS PDF.
        </motion.p>

        {/* Call-to-Action Buttons */}
        <motion.div {...fadeInVariant(0.3)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
          {!isSignedIn ? (
            <>
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center"
                >
                  Get Started Free →
                </motion.button>
              </SignUpButton>

              <SignInButton mode="modal">
                <button className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl border border-[#2A303C] hover:border-white/30 text-white font-heading font-medium text-sm transition-all bg-[#161B22]/90 backdrop-blur-md cursor-pointer flex items-center justify-center">
                  Sign In to Account
                </button>
              </SignInButton>
            </>
          ) : (
            <Link href="/app" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                className="w-full min-h-[44px] bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center"
              >
                Launch Workspace Tool →
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Social Proof Metrics Bar */}
        <motion.div
          {...fadeInVariant(0.35)}
          className="mt-10 pt-6 sm:mt-12 sm:pt-8 border-t border-[#1C2333]/80 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center w-full max-w-4xl"
        >
          <div className="p-3 sm:p-4 rounded-xl bg-[#161B22]/50 border border-[#2A303C]/50 backdrop-blur-sm">
            <div className="font-heading text-xl sm:text-2xl font-extrabold text-white">100%</div>
            <div className="font-label text-[10px] sm:text-xs text-[#9CA3AF]">Truthful & Verified</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[#161B22]/50 border border-[#2A303C]/50 backdrop-blur-sm">
            <div className="font-heading text-xl sm:text-2xl font-extrabold text-[#1F9D6B]">0-100%</div>
            <div className="font-label text-[10px] sm:text-xs text-[#9CA3AF]">Skillset Match Score</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[#161B22]/50 border border-[#2A303C]/50 backdrop-blur-sm">
            <div className="font-heading text-xl sm:text-2xl font-extrabold text-[#3654FF]">6 Styles</div>
            <div className="font-label text-[10px] sm:text-xs text-[#9CA3AF]">ATS PDF Templates</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[#161B22]/50 border border-[#2A303C]/50 backdrop-blur-sm">
            <div className="font-heading text-xl sm:text-2xl font-extrabold text-[#D08C1B]">Instant</div>
            <div className="font-label text-[10px] sm:text-xs text-[#9CA3AF]">PDF Vector Download</div>
          </div>
        </motion.div>
      </section>

      {/* ── INTERACTIVE MATCH SCORE SIMULATOR WIDGET ── */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full">
        <motion.div
          {...fadeInVariant(0.4)}
          className="p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-[#161B22]/90 border border-[#3654FF]/40 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center"
        >
          {/* Controls Side */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <span className="font-label text-xs uppercase tracking-widest text-[#3654FF] font-bold">
              INTERACTIVE MATCH SIMULATOR
            </span>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
              Toggle candidate skills to see the Match Engine react live
            </h2>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Click skills below to simulate adding or removing skills from your resume and watch the match score dial update automatically:
            </p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
              {DEMO_SKILLS.map((skill) => {
                const isSelected = candidateSkills.includes(skill.name);
                return (
                  <button
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-label font-medium transition-all cursor-pointer border flex items-center gap-1 ${
                      isSelected
                        ? "bg-[#1F9D6B]/20 text-[#1F9D6B] border-[#1F9D6B]/50 font-semibold"
                        : "bg-[#0F1419] text-[#9CA3AF] border-[#2A303C] hover:border-white/30"
                    }`}
                  >
                    {isSelected ? `✓ ${skill.name}` : `+ ${skill.name}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score Dial & Diff Output Side */}
          <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-[#0F1419] border border-[#2A303C] text-center flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#3654FF] via-[#5B73FF] to-[#1F9D6B] p-[3px]">
              <div className="w-full h-full bg-[#0F1419] rounded-full flex flex-col items-center justify-center">
                <span className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
                  {matchScore}%
                </span>
                <span className="font-label text-[9px] text-[#9CA3AF] uppercase">
                  MATCH SCORE
                </span>
              </div>
            </div>

            <div className="w-full text-left font-label text-xs space-y-1">
              <div className="text-[#1F9D6B] text-[10px] sm:text-[11px] break-words">
                + Matched ({matchedSkills.length}): {matchedSkills.map((s) => s.name).join(", ")}
              </div>
              <div className="text-[#D08C1B] text-[10px] sm:text-[11px] break-words">
                - Missing ({missingSkills.length}): {missingSkills.map((s) => s.name).join(", ")}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 3-STEP WORKFLOW ── */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-t border-[#1C2333] bg-[#0B0F13]/90">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="font-label text-xs uppercase tracking-widest text-[#3654FF] font-bold">
              SIMPLE 3-STEP WORKFLOW
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
              How JD → Resume Works
            </h2>
            <p className="text-[#9CA3AF] text-xs sm:text-sm mt-3">
              Go from raw job description to finished ATS PDF in less than 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-3 hover:border-[#3654FF]/40 transition-all hover:-translate-y-1 shadow-lg">
              <div className="font-heading text-3xl font-extrabold text-[#3654FF]">01</div>
              <h3 className="font-heading text-lg font-bold text-white">Paste Job & Resume</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Paste the target job description and your current resume text into our dual-pane editor workspace.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-3 hover:border-[#1F9D6B]/40 transition-all hover:-translate-y-1 shadow-lg">
              <div className="font-heading text-3xl font-extrabold text-[#1F9D6B]">02</div>
              <h3 className="font-heading text-lg font-bold text-white">AI Skillset Customisation</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Our Gemini engine calculates an exact match score, diffs skills, and reorders your experience bullets to lead with matched keywords.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-3 hover:border-[#D08C1B]/40 transition-all hover:-translate-y-1 shadow-lg">
              <div className="font-heading text-3xl font-extrabold text-[#D08C1B]">03</div>
              <h3 className="font-heading text-lg font-bold text-white">Download Finished PDF</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Select your preferred ATS template style and download your finished vector PDF resume ready for submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 md:px-8 border-t border-[#1C2333] bg-gradient-to-b from-[#0F1419] to-[#0B0F13]">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#161B22] via-[#1E2638] to-[#161B22] border border-[#3654FF]/40 text-center flex flex-col items-center shadow-2xl">
          <Logo showText={false} size="lg" className="mb-4" />
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Ready to tailor your application?
          </h2>
          <p className="text-[#9CA3AF] max-w-xl text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
            Join thousands of job seekers using fact-checked AI tailoring to land more technical interviews.
          </p>

          {!isSignedIn ? (
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 sm:py-4 rounded-xl font-heading font-semibold text-sm sm:text-base shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center">
                Get Started Free →
              </button>
            </SignUpButton>
          ) : (
            <Link
              href="/app"
              className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-8 py-3.5 sm:py-4 rounded-xl font-heading font-semibold text-sm sm:text-base shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center"
            >
              Open Workspace Tool →
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
