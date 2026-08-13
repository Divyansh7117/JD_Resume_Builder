"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ResumeDocument from "@/components/ResumeDocument";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <div className="p-6 text-gray-500 font-sans">Loading PDF Viewer...</div>,
  }
);

const sampleData = {
  name: "Divyansh Agarwal",
  contact: "divyanshagarwal.work7117@gmail.com | +91-9205216028 | New Delhi, India | linkedin.com/in/divyansh-agarwal7117 | github.com/Divyansh7117 | divyansh-agarwal-portfolio.vercel.app",
  summary: "Full Stack Developer and B.Tech CSE (Data Science) student with production-level experience shipping real applications — led end-to-end development of a social platform with 500+ live users, delivered a freelance B2B platform, and built a cross-platform React Native dating app spanning JWT authentication, REST APIs, real-time WebSockets, and optimized MongoDB pipelines. Currently expanding into Python, Machine Learning, and Deep Learning to build AI-native features into production software.",
  experience: [
    {
      company: "Xoodrip",
      title: "Software Engineer Intern",
      dates: "Oct 2025 – Present",
      bullets: [
        "Engineered end-to-end full-stack architecture as sole developer; owned feature development, CI/CD deployment pipeline, and release reviews.",
        "Optimized MongoDB aggregation pipelines for the news feed; cut initial payload from 120 to 10 posts via cursor-based pagination and infinite scroll, reducing API response time to under 200ms.",
        "Built secure JWT-based authentication with role-based authorization, eliminating unauthorized access across all API endpoints; validated cross-browser (Chrome, Firefox, Safari).",
        "Improved Lighthouse Performance score from 62 to 88 through media optimization, achieving 1.8–2.2s initial page loads.",
        "Built a desktop feed UI and Admin Dashboard with real-time KPI cards for user growth, content volume, and engagement metrics.",
        "Designed and developed the official Xoodrip company website (xoodrip.com), optimized for performance, SEO, and responsiveness.",
      ],
    },
  ],
  projects: [
    {
      name: "GrowIn Bharat — Social Media Platform",
      bullets: [
        "Live in production with 500+ real users; implemented infinite scroll with cursor-based pagination, cutting API response time to under 200ms and reaching a Lighthouse score of 88.",
      ],
    },
    {
      name: "Bondbrite — B2B Industrial Adhesives Platform (Freelance)",
      bullets: [
        "Delivered a manufacturer-direct B2B platform with product catalogue, dealer onboarding, and GST-validated inquiry workflows; JWT-secured admin panel with Cloudinary-backed CDN delivery.",
      ],
    },
    {
      name: "Gostart — Dating App (Personal Project)",
      bullets: [
        "Built real-time chat over native WebSockets with optimistic updates and REST fallback; engineered a bidirectional match engine with a custom dual-thumb age-range slider and credit-gated conversations.",
      ],
    },
  ],
  skills: [
    "React.js",
    "Next.js",
    "Node.js",
    "TypeScript",
    "RESTful APIs",
    "GraphQL",
    "WebSockets",
    "MongoDB",
    "PostgreSQL",
    "CI/CD",
    "Docker",
    "React Native (Expo)",
    "Tailwind CSS",
  ],
  education: [
    {
      institution: "USICT, Guru Gobind Singh Indraprastha University",
      degree: "B.Tech – Computer Science Engineering (Data Science)",
      dates: "2024 – 2028",
    },
  ],
  certifications: [
    {
      name: "The Complete JavaScript Course 2025",
      issuer: "Udemy",
    },
  ],
};

export default function TestPdfPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="p-8 text-gray-600 font-sans">Initializing PDF Viewer...</div>;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
        <ResumeDocument {...sampleData} />
      </PDFViewer>
    </div>
  );
}
