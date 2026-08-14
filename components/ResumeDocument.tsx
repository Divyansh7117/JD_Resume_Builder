import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";

// Register Unicode-compliant TrueType font for native glyph rendering (₹, →, •, –, —, smart quotes)
const getFontPath = (fileName: string) => {
  if (typeof window === "undefined") {
    return path.join(process.cwd(), "public", "fonts", fileName);
  }
  return `/fonts/${fileName}`;
};

Font.register({
  family: "ResumeFont",
  fonts: [
    {
      src: getFontPath("ResumeFont-Regular.ttf"),
      fontWeight: "normal",
      fontStyle: "normal",
    },
    {
      src: getFontPath("ResumeFont-Bold.ttf"),
      fontWeight: "bold",
      fontStyle: "normal",
    },
    {
      src: getFontPath("ResumeFont-Italic.ttf"),
      fontWeight: "normal",
      fontStyle: "italic",
    },
    {
      src: getFontPath("ResumeFont-BoldItalic.ttf"),
      fontWeight: "bold",
      fontStyle: "italic",
    },
  ],
});

export interface ResumeDocumentProps {
  name: string;
  contact: string; // e.g. "email | phone | linkedin"
  summary?: string;
  experience: { company: string; title: string; dates: string; bullets: string[]; location?: string }[];
  projects?: { name: string; bullets: string[]; url?: string; techStack?: string }[];
  education: { institution: string; degree: string; dates: string }[];
  certifications: { name: string; issuer: string }[];
  skills: string[];
  additional?: string[];
  templateId?: string;
}

/* ═══════════════════════════════════════════════
   1. STANDARD ATS SINGLE-COLUMN STYLES (1-PAGE OPTIMIZED)
   ═══════════════════════════════════════════════ */
const standardStyles = StyleSheet.create({
  page: { padding: 24, fontFamily: "ResumeFont", fontSize: 8.5, lineHeight: 1.28, color: "#111827" },
  header: { marginBottom: 6, textAlign: "center" },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5, color: "#0F1419" },
  contact: { fontSize: 8, color: "#4B5563", lineHeight: 1.2 },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 1.5,
    marginBottom: 3.5,
    letterSpacing: 0.5,
    color: "#0F1419",
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  entryTitleCompany: { fontSize: 8.8, fontWeight: "bold", flex: 1, color: "#0F1419" },
  entryCompanySub: { fontSize: 8.2, color: "#374151" },
  entryDates: { fontSize: 7.8, fontStyle: "italic", color: "#6B7280", textAlign: "right", marginLeft: 8 },
  bulletItem: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 2 },
  bulletPoint: { width: 8, fontSize: 8.5, color: "#4B5563" },
  bulletText: { flex: 1, fontSize: 8.2, lineHeight: 1.25, color: "#374151" },
  skillsText: { fontSize: 8.2, lineHeight: 1.28, color: "#374151" },
  summaryText: { fontSize: 8.2, lineHeight: 1.28, color: "#374151", marginBottom: 1 },
});

/* ═══════════════════════════════════════════════
   2. MODERN SIDEBAR STYLES (TWO COLUMN PDF)
   ═══════════════════════════════════════════════ */
const sidebarStyles = StyleSheet.create({
  page: { flexDirection: "row", backgroundColor: "#FFFFFF", fontFamily: "ResumeFont" },
  leftSidebar: { width: "32%", backgroundColor: "#1E293B", color: "#FFFFFF", padding: 18, minHeight: "100%" },
  rightMain: { width: "68%", padding: 20, color: "#0F1419" },
  sidebarName: { fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 3, color: "#FFFFFF" },
  sidebarContact: { fontSize: 7.5, color: "#94A3B8", lineHeight: 1.25, marginBottom: 10 },
  sidebarSectionTitle: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#475569", paddingBottom: 1.5, color: "#38BDF8" },
  skillTag: { fontSize: 7, backgroundColor: "rgba(255,255,255,0.08)", color: "#E2E8F0", padding: 2, marginBottom: 2.5, borderRadius: 2 },
  mainSectionTitle: { fontSize: 9.5, fontWeight: "bold", color: "#0F1419", textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 1.5, marginBottom: 4, letterSpacing: 0.5 },
});

/* ═══════════════════════════════════════════════
   3. EXECUTIVE STYLES (GOLD & NAVY)
   ═══════════════════════════════════════════════ */
const executiveStyles = StyleSheet.create({
  page: { padding: 24, fontFamily: "ResumeFont", fontSize: 8.5, lineHeight: 1.28, color: "#0F1419", borderTopWidth: 5, borderTopColor: "#D08C1B" },
  header: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingBottom: 4 },
  name: { fontSize: 15, fontWeight: "bold", color: "#0F1419" },
  contact: { fontSize: 8, color: "#6B7280", marginTop: 2 },
  summaryBox: { backgroundColor: "#F9FAFB", borderLeftWidth: 3, borderLeftColor: "#D08C1B", padding: 5, marginBottom: 6, fontSize: 8.2, color: "#374151", lineHeight: 1.25 },
  sectionTitle: { fontSize: 9.5, fontWeight: "bold", color: "#0F1419", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3.5, borderBottomWidth: 1, borderBottomColor: "#D08C1B", paddingBottom: 1.5 },
});

/* ═══════════════════════════════════════════════
   4. DARK CYBER CREATIVE STYLES
   ═══════════════════════════════════════════════ */
const darkStyles = StyleSheet.create({
  page: { padding: 24, fontFamily: "ResumeFont", fontSize: 8.2, lineHeight: 1.25, backgroundColor: "#0F1419", color: "#E5E7EB" },
  header: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#1F9D6B", paddingBottom: 4 },
  name: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF" },
  contact: { fontSize: 7.5, color: "#9CA3AF", marginTop: 2 },
  sectionTitle: { fontSize: 8.8, fontWeight: "bold", color: "#1F9D6B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3.5 },
  bulletPoint: { width: 8, color: "#1F9D6B" },
});

/* ═══════════════════════════════════════════════
   5. COMPACT DENSE STYLES
   ═══════════════════════════════════════════════ */
const compactStyles = StyleSheet.create({
  page: { padding: 18, fontFamily: "ResumeFont", fontSize: 8, lineHeight: 1.2, color: "#111827" },
  header: { marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 1, borderBottomColor: "#8B5CF6", paddingBottom: 2 },
  name: { fontSize: 12, fontWeight: "bold" },
  contact: { fontSize: 7, color: "#4B5563" },
  sectionTitle: { fontSize: 8.5, fontWeight: "bold", color: "#8B5CF6", textTransform: "uppercase", marginBottom: 2.5, borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB" },
});

/* ═══════════════════════════════════════════════
   6. ACADEMIC SERIF STYLES
   ═══════════════════════════════════════════════ */
const academicStyles = StyleSheet.create({
  page: { padding: 26, fontFamily: "ResumeFont", fontSize: 8.5, lineHeight: 1.28, color: "#000000" },
  header: { marginBottom: 8, textAlign: "center", borderBottomWidth: 1, borderBottomColor: "#000000", paddingBottom: 4 },
  name: { fontSize: 14, fontWeight: "bold" },
  contact: { fontSize: 8, fontStyle: "italic", color: "#333333", marginTop: 2 },
  sectionTitle: { fontSize: 9.5, fontWeight: "bold", textTransform: "uppercase", borderBottomWidth: 0.5, borderBottomColor: "#000000", paddingBottom: 1.5, marginBottom: 3.5 },
});

/**
 * Preserves native Unicode characters (₹, →, •, –, —, smart quotes) while removing unprintable control codes.
 */
export function preservePdfUnicode(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "")
    .trim();
}

export default function ResumeDocument(props: ResumeDocumentProps) {
  const templateId = props.templateId || "ats-standard";

  const name = preservePdfUnicode(props.name);
  const contact = preservePdfUnicode(props.contact);
  const summary = props.summary ? preservePdfUnicode(props.summary) : undefined;
  const experience = (props.experience || []).map((exp) => ({
    company: preservePdfUnicode(exp.company),
    title: preservePdfUnicode(exp.title),
    dates: preservePdfUnicode(exp.dates),
    location: exp.location ? preservePdfUnicode(exp.location) : undefined,
    bullets: (exp.bullets || []).map(preservePdfUnicode),
  }));
  const projects = (props.projects || []).map((proj) => ({
    name: preservePdfUnicode(proj.name),
    url: proj.url ? preservePdfUnicode(proj.url) : undefined,
    techStack: proj.techStack ? preservePdfUnicode(proj.techStack) : undefined,
    bullets: (proj.bullets || []).map(preservePdfUnicode),
  }));
  const skills = (props.skills || []).map(preservePdfUnicode);
  const education = (props.education || []).map((edu) => ({
    degree: preservePdfUnicode(edu.degree),
    institution: preservePdfUnicode(edu.institution),
    dates: preservePdfUnicode(edu.dates),
  }));
  const certifications = (props.certifications || []).map((cert) => ({
    name: preservePdfUnicode(cert.name),
    issuer: preservePdfUnicode(cert.issuer),
  }));
  const additional = (props.additional || []).map(preservePdfUnicode);

  const renderCertText = (cert: { name: string; issuer: string } | string) => {
    if (typeof cert === "string") return preservePdfUnicode(cert);
    return cert.issuer ? `${preservePdfUnicode(cert.name)} — ${preservePdfUnicode(cert.issuer)}` : preservePdfUnicode(cert.name);
  };

  // Render 1: Modern Sidebar Layout (Two Column)
  if (templateId === "modern-sidebar") {
    return (
      <Document>
        <Page size="LETTER" style={sidebarStyles.page}>
          <View style={sidebarStyles.leftSidebar}>
            <Text style={sidebarStyles.sidebarName}>{name}</Text>
            <Text style={sidebarStyles.sidebarContact}>{contact}</Text>

            {skills && skills.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>SKILLS & EXPERTISE</Text>
                {skills.map((skill, sIdx) => (
                  <Text key={sIdx} style={sidebarStyles.skillTag}>• {skill}</Text>
                ))}
              </View>
            )}

            {education && education.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>EDUCATION</Text>
                {education.map((edu, eIdx) => (
                  <View key={eIdx} style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 7.8, fontWeight: "bold", color: "#FFFFFF" }}>{edu.degree}</Text>
                    <Text style={{ fontSize: 7.2, color: "#CBD5E1" }}>{edu.institution}</Text>
                    <Text style={{ fontSize: 6.8, color: "#94A3B8" }}>{edu.dates}</Text>
                  </View>
                ))}
              </View>
            )}

            {certifications && certifications.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>CERTIFICATIONS</Text>
                {certifications.map((cert, cIdx) => (
                  <Text key={cIdx} style={{ fontSize: 7.2, color: "#CBD5E1", marginBottom: 2 }}>
                    • {renderCertText(cert)}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={sidebarStyles.rightMain}>
            {summary ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={sidebarStyles.mainSectionTitle}>PROFESSIONAL SUMMARY</Text>
                <Text style={{ fontSize: 8.2, color: "#374151", lineHeight: 1.25 }}>{summary}</Text>
              </View>
            ) : null}

            {experience && experience.length > 0 ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={sidebarStyles.mainSectionTitle}>EXPERIENCE</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={{ marginBottom: 5 }} wrap={false}>
                    <Text style={{ fontSize: 8.8, fontWeight: "bold", color: "#0F1419" }}>{exp.title}</Text>
                    <Text style={{ fontSize: 7.8, color: "#6B7280", marginBottom: 1.5 }}>{exp.company} | {exp.dates}</Text>
                    {exp.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                        <Text style={{ width: 8, fontSize: 8, color: "#2563EB" }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 8, color: "#374151", lineHeight: 1.25 }}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {projects && projects.length > 0 ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={sidebarStyles.mainSectionTitle}>KEY PROJECTS</Text>
                {projects.map((proj, idx) => (
                  <View key={idx} style={{ marginBottom: 4 }} wrap={false}>
                    <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#0F1419" }}>{proj.name}</Text>
                    {proj.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1 }}>
                        <Text style={{ width: 8, fontSize: 7.5, color: "#2563EB" }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 7.5, color: "#374151", lineHeight: 1.25 }}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Page>
      </Document>
    );
  }

  // Default: Standard ATS Single-Column Layout (ats-standard)
  return (
    <Document>
      <Page size="LETTER" style={standardStyles.page}>
        <View style={standardStyles.header}>
          <Text style={standardStyles.name}>{name}</Text>
          <Text style={standardStyles.contact}>{contact}</Text>
        </View>

        {summary ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={standardStyles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {experience && experience.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>EXPERIENCE</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 4.5 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>
                    {exp.title} | {exp.company}
                  </Text>
                  <Text style={standardStyles.entryDates}>{exp.dates}</Text>
                </View>
                <View style={{ marginTop: 1, marginBottom: 1 }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={standardStyles.bulletItem}>
                      <Text style={standardStyles.bulletPoint}>•</Text>
                      <Text style={standardStyles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {projects && projects.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>PROJECTS</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 3.5 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>{proj.name}</Text>
                  {proj.url && <Text style={standardStyles.entryDates}>{proj.url}</Text>}
                </View>
                {proj.techStack && (
                  <Text style={{ fontSize: 7.8, fontStyle: "italic", marginBottom: 1, color: "#6B7280" }}>Tech: {proj.techStack}</Text>
                )}
                <View style={{ marginTop: 1, marginBottom: 1 }}>
                  {proj.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={standardStyles.bulletItem}>
                      <Text style={standardStyles.bulletPoint}>•</Text>
                      <Text style={standardStyles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {skills && skills.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>SKILLS & EXPERTISE</Text>
            <Text style={standardStyles.skillsText}>{skills.join(" • ")}</Text>
          </View>
        ) : null}

        {education && education.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>EDUCATION</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 2 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>{edu.degree}</Text>
                  <Text style={standardStyles.entryDates}>{edu.dates}</Text>
                </View>
                <Text style={{ fontSize: 8, color: "#374151", marginTop: 0.5 }}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {certifications && certifications.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>CERTIFICATIONS</Text>
            <View style={{ marginTop: 1, marginBottom: 1 }}>
              {certifications.map((cert, cIdx) => (
                <Text key={cIdx} style={{ fontSize: 8, color: "#374151", marginBottom: 1 }}>
                  • {renderCertText(cert)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {additional && additional.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <View style={{ marginTop: 1, marginBottom: 1 }}>
              {additional.map((item, aIdx) => (
                <View key={aIdx} style={standardStyles.bulletItem}>
                  <Text style={standardStyles.bulletPoint}>•</Text>
                  <Text style={standardStyles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
