import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1C2333] bg-[#0B0F13] text-[#9CA3AF] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <Logo />
          <p className="text-sm text-[#9CA3AF] max-w-sm leading-relaxed">
            Fact-checked AI resume tailoring pipeline. Diff your resume against any job description and generate ATS-compliant PDFs without hallucinated facts.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="space-y-3 font-label text-xs">
          <div className="text-white font-bold uppercase tracking-wider text-xs">
            Product & Tools
          </div>
          <ul className="space-y-2">
            <li>
              <Link href="/app" className="hover:text-white transition-colors">
                Workspace Tool
              </Link>
            </li>
            <li>
              <Link href="/features" className="hover:text-white transition-colors">
                Features Overview
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/templates" className="hover:text-white transition-colors">
                ATS Templates
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ & Guide
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="space-y-3 font-label text-xs">
          <div className="text-white font-bold uppercase tracking-wider text-xs">
            Project Info
          </div>
          <ul className="space-y-2">
            <li>
              <a
                href="https://github.com/Divyansh7117/JD_Resume_Builder"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub Repository
              </a>
            </li>
            <li className="text-[#6B7280]">PW Central AI Assignment</li>
            <li className="text-[#6B7280]">Powered by Gemini 2.5 & Next.js</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#1C2333]/60 py-6 text-center text-xs text-[#6B7280] font-label">
        © {new Date().getFullYear()} JD → Resume. Built with Gemini AI.
      </div>
    </footer>
  );
}
