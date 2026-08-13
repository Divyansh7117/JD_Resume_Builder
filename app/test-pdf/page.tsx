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
  name: "Alex Rivera",
  contact: "alex.rivera@example.com | (555) 123-4567 | San Francisco, CA | github.com/alexrivera",
  summary: "Experienced Full-Stack Developer specializing in MERN stack, Next.js, TypeScript, and React Native.",
  experience: [
    {
      company: "TechCorp Inc.",
      title: "Senior Full-Stack Engineer",
      dates: "Jan 2022 - Present",
      bullets: [
        "Architected and launched a real-time web platform using Next.js, React, and TypeScript, reducing page load times by 40%.",
        "Built high-throughput RESTful APIs and MongoDB data pipelines using Node.js and Express (MERN stack) to serve over 100k daily active users.",
        "Developed cross-platform mobile application modules using React Native and Redux Toolkit for seamless sync across iOS and Android.",
      ],
    },
  ],
  projects: [
    {
      name: "TaskCraft - Mobile & Web Task Manager",
      bullets: [
        "Implemented end-to-end task synchronization using React Native for mobile, Next.js for web dashboard, and WebSocket connections via Node.js backend.",
        "Integrated TypeScript strict mode across shared frontend-backend packages to ensure type safety and prevent runtime errors.",
      ],
    },
  ],
  skills: [
    "TypeScript",
    "JavaScript",
    "React.js",
    "Next.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "React Native",
    "Redux",
    "HTML5",
    "CSS3",
    "Tailwind CSS",
    "REST APIs",
    "GraphQL",
    "Git",
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
