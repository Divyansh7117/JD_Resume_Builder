import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1C2333] bg-[#070A0F] text-[#9CA3AF] font-sans relative overflow-hidden mt-auto">
      {/* Top Ambient Glow Gradient Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-[#3654FF]/60 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-24 bg-[#3654FF]/5 blur-3xl pointer-events-none" />

      {/* Main Footer Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & AI Engine Mission (Span 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Logo />
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-sm leading-relaxed">
              Fact-checked AI resume tailoring and deterministic capability matching. Align your professional experience against any job description and generate ATS-compliant PDFs with zero hallucinated facts.
            </p>

            {/* Live Gemini API Status Pill */}
            <div className="pt-1 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D121D] border border-[#1E293B] shadow-inner text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </span>
                <span className="font-semibold text-white tracking-wide font-mono text-[11px]">Gemini API</span>
                <span className="text-[#475569]">|</span>
                <span className="text-emerald-400 font-mono text-[11px]">Online</span>
              </div>

              <span className="text-[11px] text-[#64748B] font-mono hidden sm:inline">
                4-Tier Deterministic Evaluator
              </span>
            </div>
          </div>

          {/* Column 2: Product & Workspace (Span 2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs font-mono">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/app" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> Workspace Tool
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> Features Overview
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> ATS Templates
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Guides (Span 2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs font-mono">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/faq" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> FAQ & Help
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#scoring" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> Scoring Model
                </Link>
              </li>
              <li>
                <Link href="/templates#guide" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> ATS Formatting Guide
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-[#94A3B8] hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                  <span className="text-[#3654FF] text-[10px]">›</span> Match Intelligence
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Technology & Open Source (Span 3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs font-mono">
              Technology & Source
            </h4>
            <div className="space-y-3 text-xs">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#0F141E] hover:bg-[#161F2E] border border-[#232D3F] hover:border-[#3654FF] text-[#E2E8F0] hover:text-white transition-all shadow-md active:scale-95"
              >
                <svg className="w-4 h-4 fill-current text-[#94A3B8] group-hover:text-white transition-colors" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-xs text-white">GitHub Repository</div>
                  <div className="text-[10px] text-[#64748B] font-mono">View Source Code</div>
                </div>
              </a>

              <div className="space-y-1 text-[#64748B] text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#3654FF]" />
                  <span>Powered by <span className="text-[#94A3B8]">Google Gemini API</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#3654FF]" />
                  <span>Next.js 16 • Turbopack • TypeScript</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sub-Bar */}
      <div className="border-t border-[#161F2E] bg-[#05080C] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} <strong className="text-[#E2E8F0] font-normal">JD → Resume</strong>.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Powered by Google Gemini API & Next.js.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-[#475569]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
              ATS Vector PDF
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              Deterministic Engine
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80" />
              Zero Hallucination
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
