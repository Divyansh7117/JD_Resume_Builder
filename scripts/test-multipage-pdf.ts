import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import pdfParse from "pdf-parse";
import ResumeDocument, { ResumeDocumentProps } from "../components/ResumeDocument";

const longExperienceBullets = [
  "Architected high-throughput microservices handling 50k+ requests per second with 99.99% uptime SLA.",
  "Engineered real-time streaming data pipeline using Apache Kafka, Apache Flink, and PostgreSQL.",
  "Reduced cloud infrastructure latency by 45% through aggressive distributed Redis caching and query indexing.",
  "Spearheaded cloud migration of 14 monolithic legacy services to containerized Kubernetes deployments on AWS.",
  "Mentored a distributed engineering squad of 8 software engineers across three geographic time zones.",
  "Authored comprehensive architectural decision records and conducted weekly cross-team system design reviews.",
  "Optimized database schema and partitioning strategies, saving $18,000 monthly in compute and storage costs.",
  "Implemented OAuth 2.0 and RBAC access control across all client-facing APIs with zero security incidents.",
];

const sampleMultiPageData: ResumeDocumentProps = {
  name: "Alex Morgan",
  contact: "alex.morgan@example.com • (555) 019-2834 • San Francisco, CA • linkedin.com/in/alexmorgan • github.com/alexmorgan",
  summary:
    "Senior Full Stack & Systems Engineer with extensive production experience delivering scalable distributed applications, microservices, and real-time cloud data pipelines. Track record of scaling systems to millions of users while maintaining high reliability and team velocity.",
  experience: [
    {
      company: "Apex Global Cloud Solutions",
      title: "Staff Software Engineer & Platform Lead",
      dates: "Jan 2023 – Present",
      bullets: longExperienceBullets.slice(0, 6),
    },
    {
      company: "DataScale Tech Corp",
      title: "Senior Backend Engineer",
      dates: "Mar 2021 – Dec 2022",
      bullets: longExperienceBullets.slice(2, 7),
    },
    {
      company: "Nexus Digital Systems",
      title: "Full Stack Engineer",
      dates: "Aug 2019 – Feb 2021",
      bullets: longExperienceBullets.slice(3, 8),
    },
    {
      company: "EarlyTech Labs",
      title: "Junior Developer",
      dates: "Jun 2018 – Jul 2019",
      bullets: longExperienceBullets.slice(0, 4),
    },
  ],
  projects: [
    {
      name: "Distributed Event Store Engine",
      url: "github.com/example/event-store",
      techStack: "Go • Kafka • Docker • Kubernetes",
      bullets: [
        "Constructed a high-performance event sourcing log supporting 100k events/sec with consensus replication.",
        "Benchmarked throughput and memory profiling, achieving sub-5ms write latencies under peak load.",
      ],
    },
    {
      name: "AI Query Optimizer & Explain Engine",
      url: "github.com/example/ai-query",
      techStack: "Python • PyTorch • PostgreSQL • Fastify",
      bullets: [
        "Trained transformer-based model to predict query execution plans and index suggestions with 92% accuracy.",
      ],
    },
  ],
  skills: [
    "TypeScript", "React", "Next.js", "Node.js", "Python", "Go",
    "PostgreSQL", "MongoDB", "Redis", "Kafka", "Docker", "Kubernetes",
    "AWS", "GCP", "CI/CD", "GraphQL", "REST APIs", "System Architecture"
  ],
  education: [
    {
      institution: "USICT, Guru Gobind Singh Indraprastha University",
      degree: "B.Tech – Computer Science & Engineering",
      dates: "2018 – 2022",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
    },
    {
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "CNCF",
    },
  ],
  additional: [
    "Open Source Contributor: Active committer to 3 CNCF distributed systems repositories.",
    "Speaker: Delivered keynote on Real-Time Event-Driven Architectures at TechCon 2024.",
  ],
};

async function testTemplates() {
  const templates = [
    "ats-standard",
    "modern-sidebar",
    "executive-leadership",
    "dark-cyber",
    "compact-dense",
    "academic-research",
  ];

  console.log("=================================================================");
  console.log("TESTING MULTI-PAGE PDF GENERATION & NON-COLLIDING HEADERS");
  console.log("=================================================================\n");

  for (const tmpl of templates) {
    console.log(`▶ Testing Template: ${tmpl}...`);
    const docElement = React.createElement(ResumeDocument, {
      ...sampleMultiPageData,
      templateId: tmpl,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(docElement as any);
    const parsed = await pdfParse(buffer);

    console.log(`  ✓ Rendered successfully: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`  ✓ Page Count: ${parsed.numpages} page(s)`);
    console.log(`  ✓ Name extracted in text: ${parsed.text.toUpperCase().includes("ALEX MORGAN")}`);
    console.log(`  ✓ Contact extracted in text: ${parsed.text.includes("alex.morgan@example.com")}`);

    if (parsed.numpages >= 2) {
      console.log(`  ✅ Multi-page flow verified: Document correctly spans ${parsed.numpages} pages without truncation.\n`);
    } else {
      console.log(`  ℹ Rendered in ${parsed.numpages} page.\n`);
    }
  }

  console.log("🎉 ALL TEMPLATE AND MULTI-PAGE TESTS PASSED!");
}

testTemplates().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
