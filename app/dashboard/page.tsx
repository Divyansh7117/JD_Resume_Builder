"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RECENT_SESSIONS = [
  {
    id: "s-1",
    role: "Senior Frontend Developer",
    company: "Acme Commerce",
    matchScore: 40,
    matchedCount: 6,
    missingCount: 9,
    date: "Today, 4:56 PM",
  },
  {
    id: "s-2",
    role: "Cloud Backend Engineer",
    company: "DataScale Systems",
    matchScore: 78,
    matchedCount: 11,
    missingCount: 3,
    date: "Yesterday",
  },
  {
    id: "s-3",
    role: "Full-Stack Engineer",
    company: "TechCorp Inc.",
    matchScore: 80,
    matchedCount: 8,
    missingCount: 2,
    date: "3 days ago",
  },
];

export default function DashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const { isSignedIn, userId } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#E5E7EB] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-6 md:px-8 py-12 w-full">
        {/* User Greeting Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-8 border-b border-[#1C2333]">
          <div>
            <div className="font-label text-xs uppercase tracking-widest text-[#3654FF] font-bold">
              USER DASHBOARD
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mt-1">
              Resume Applications Overview
            </h1>
            <p className="text-xs text-[#9CA3AF] font-label mt-1">
              User ID: {userId || "Authenticated Session"}
            </p>
          </div>

          <Link
            href="/app"
            className="bg-[#3654FF] hover:bg-[#2A44E0] text-white px-6 py-3 rounded-xl font-heading font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 self-start md:self-auto"
          >
            + New Tailored Application
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-2">
            <div className="font-label text-xs text-[#6B7280] uppercase tracking-wider">
              Total Tailored Resumes
            </div>
            <div className="font-heading text-3xl font-extrabold text-white">
              14
            </div>
            <div className="text-xs text-[#1F9D6B] font-label">+3 this week</div>
          </div>

          <div className="p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-2">
            <div className="font-label text-xs text-[#6B7280] uppercase tracking-wider">
              Avg. Match Score
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#1F9D6B]">
              76%
            </div>
            <div className="text-xs text-[#9CA3AF] font-label">Across all applications</div>
          </div>

          <div className="p-6 rounded-xl bg-[#161B22] border border-[#2A303C] space-y-2">
            <div className="font-label text-xs text-[#6B7280] uppercase tracking-wider">
              Anti-Fabrication Guard
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#3654FF]">
              100%
            </div>
            <div className="text-xs text-[#9CA3AF] font-label">Truthful facts verified</div>
          </div>
        </div>

        {/* Recent Applications List */}
        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-white">
              Recent Tailoring Sessions
            </h2>
            <span className="font-label text-xs text-[#6B7280]">
              Showing last 3 runs
            </span>
          </div>

          {RECENT_SESSIONS.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-[#161B22] border border-[#2A303C] hover:border-[#3654FF]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-bold text-white text-base">
                    {session.role}
                  </h3>
                  <span className="text-xs text-[#9CA3AF] font-label">
                    • {session.company}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-label text-[#9CA3AF] mt-1">
                  <span className="text-[#1F9D6B]">+{session.matchedCount} matched</span>
                  <span className="text-[#D08C1B]">-{session.missingCount} missing</span>
                  <span>{session.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-heading text-2xl font-bold text-white">
                    {session.matchScore}%
                  </div>
                  <div className="font-label text-[10px] uppercase text-[#6B7280]">
                    Match Score
                  </div>
                </div>

                <Link
                  href="/app"
                  className="px-4 py-2 text-xs font-label font-medium rounded-lg bg-[#0F1419] border border-[#2A303C] hover:border-[#3654FF] text-white transition-all"
                >
                  Re-Tailor →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
