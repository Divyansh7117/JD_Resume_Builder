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
   1. STANDARD ATS SINGLE-COLUMN STYLES
   ═══════════════════════════════════════════════ */
const standardStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontFamily: "ResumeFont",
    fontSize: 8.5,
    lineHeight: 1.28,
    color: "#111827",
  },
  header: { marginBottom: 8, alignItems: "center", textAlign: "center" },
  name: {
    fontSize: 14.5,
    fontWeight: "bold",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#0F1419",
    textAlign: "center",
  },
  contact: { fontSize: 7.8, color: "#4B5563", lineHeight: 1.35, textAlign: "center" },
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
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9CA3AF",
  },
});

/* ═══════════════════════════════════════════════
   2. MODERN SIDEBAR STYLES (TWO COLUMN PDF)
   ═══════════════════════════════════════════════ */
const sidebarStyles = StyleSheet.create({
  page: { flexDirection: "row", backgroundColor: "#FFFFFF", fontFamily: "ResumeFont" },
  leftSidebar: { width: "32%", backgroundColor: "#1E293B", color: "#FFFFFF", padding: 18, minHeight: "100%" },
  rightMain: { width: "68%", padding: 20, color: "#0F1419" },
  sidebarName: { fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 4, color: "#FFFFFF" },
  sidebarContact: { fontSize: 7.5, color: "#94A3B8", lineHeight: 1.35, marginBottom: 10 },
  sidebarSectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
    paddingBottom: 1.5,
    color: "#38BDF8",
  },
  skillTag: {
    fontSize: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#E2E8F0",
    padding: 2,
    marginBottom: 2.5,
    borderRadius: 2,
  },
  mainSectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#0F1419",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 1.5,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9CA3AF",
  },
});

/* ═══════════════════════════════════════════════
   3. EXECUTIVE STYLES (GOLD & NAVY)
   ═══════════════════════════════════════════════ */
const executiveStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontFamily: "ResumeFont",
    fontSize: 8.5,
    lineHeight: 1.28,
    color: "#0F1419",
    borderTopWidth: 4,
    borderTopColor: "#D08C1B",
  },
  header: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingBottom: 5 },
  name: { fontSize: 14.5, fontWeight: "bold", color: "#0F1419", marginBottom: 3 },
  contact: { fontSize: 7.8, color: "#6B7280", lineHeight: 1.35 },
  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#D08C1B",
    padding: 5,
    marginBottom: 6,
    fontSize: 8.2,
    color: "#374151",
    lineHeight: 1.28,
  },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#0F1419",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3.5,
    borderBottomWidth: 1,
    borderBottomColor: "#D08C1B",
    paddingBottom: 1.5,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  entryTitleCompany: { fontSize: 8.8, fontWeight: "bold", flex: 1, color: "#0F1419" },
  entryDates: { fontSize: 7.8, fontStyle: "italic", color: "#6B7280", textAlign: "right", marginLeft: 8 },
  bulletItem: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 2 },
  bulletPoint: { width: 8, fontSize: 8.5, color: "#D08C1B" },
  bulletText: { flex: 1, fontSize: 8.2, lineHeight: 1.25, color: "#374151" },
  skillsText: { fontSize: 8.2, lineHeight: 1.28, color: "#374151" },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9CA3AF",
  },
});

/* ═══════════════════════════════════════════════
   4. DARK CYBER CREATIVE STYLES
   ═══════════════════════════════════════════════ */
const darkStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontFamily: "ResumeFont",
    fontSize: 8.2,
    lineHeight: 1.25,
    backgroundColor: "#0F1419",
    color: "#E5E7EB",
  },
  header: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#1F9D6B", paddingBottom: 5 },
  name: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF", marginBottom: 3 },
  contact: { fontSize: 7.5, color: "#9CA3AF", lineHeight: 1.35 },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 8.8,
    fontWeight: "bold",
    color: "#1F9D6B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1F9D6B",
    paddingBottom: 1.5,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  entryTitleCompany: { fontSize: 8.5, fontWeight: "bold", flex: 1, color: "#FFFFFF" },
  entryDates: { fontSize: 7.5, fontStyle: "italic", color: "#9CA3AF", textAlign: "right", marginLeft: 8 },
  bulletItem: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 2 },
  bulletPoint: { width: 8, fontSize: 8.2, color: "#1F9D6B" },
  bulletText: { flex: 1, fontSize: 8, lineHeight: 1.25, color: "#D1D5DB" },
  skillsText: { fontSize: 8, lineHeight: 1.25, color: "#D1D5DB" },
  summaryText: { fontSize: 8, lineHeight: 1.25, color: "#D1D5DB", marginBottom: 1 },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#6B7280",
  },
});

/* ═══════════════════════════════════════════════
   5. COMPACT DENSE STYLES
   ═══════════════════════════════════════════════ */
const compactStyles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 22,
    fontFamily: "ResumeFont",
    fontSize: 8,
    lineHeight: 1.2,
    color: "#111827",
  },
  header: { marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#8B5CF6", paddingBottom: 3 },
  name: { fontSize: 13, fontWeight: "bold", color: "#0F1419", marginBottom: 2 },
  contact: { fontSize: 7.2, color: "#4B5563", lineHeight: 1.3 },
  section: { marginBottom: 4.5 },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#8B5CF6",
    textTransform: "uppercase",
    marginBottom: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 1,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  entryTitleCompany: { fontSize: 8.2, fontWeight: "bold", flex: 1, color: "#0F1419" },
  entryDates: { fontSize: 7.2, fontStyle: "italic", color: "#6B7280", textAlign: "right", marginLeft: 8 },
  bulletItem: { flexDirection: "row", marginBottom: 1, paddingLeft: 2 },
  bulletPoint: { width: 7, fontSize: 8, color: "#8B5CF6" },
  bulletText: { flex: 1, fontSize: 7.8, lineHeight: 1.2, color: "#374151" },
  skillsText: { fontSize: 7.8, lineHeight: 1.22, color: "#374151" },
  summaryText: { fontSize: 7.8, lineHeight: 1.22, color: "#374151", marginBottom: 1 },
  pageNumber: {
    position: "absolute",
    fontSize: 6.8,
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9CA3AF",
  },
});

/* ═══════════════════════════════════════════════
   6. ACADEMIC SERIF STYLES
   ═══════════════════════════════════════════════ */
const academicStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontFamily: "ResumeFont",
    fontSize: 8.5,
    lineHeight: 1.28,
    color: "#000000",
  },
  header: { marginBottom: 8, textAlign: "center", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#000000", paddingBottom: 5 },
  name: { fontSize: 14, fontWeight: "bold", color: "#000000", marginBottom: 3, textAlign: "center" },
  contact: { fontSize: 7.8, fontStyle: "italic", color: "#333333", lineHeight: 1.35, textAlign: "center" },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 1.5,
    marginBottom: 3.5,
    color: "#000000",
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 },
  entryTitleCompany: { fontSize: 8.8, fontWeight: "bold", flex: 1, color: "#000000" },
  entryDates: { fontSize: 7.8, fontStyle: "italic", color: "#333333", textAlign: "right", marginLeft: 8 },
  bulletItem: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 2 },
  bulletPoint: { width: 8, fontSize: 8.5, color: "#000000" },
  bulletText: { flex: 1, fontSize: 8.2, lineHeight: 1.25, color: "#222222" },
  skillsText: { fontSize: 8.2, lineHeight: 1.28, color: "#222222" },
  summaryText: { fontSize: 8.2, lineHeight: 1.28, color: "#222222", marginBottom: 1 },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#666666",
  },
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

  // 1. Modern Sidebar Layout (Two Column)
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
                  <View key={idx} style={{ marginBottom: 5 }}>
                    <View wrap={false}>
                      <Text style={{ fontSize: 8.8, fontWeight: "bold", color: "#0F1419" }}>{exp.title}</Text>
                      <Text style={{ fontSize: 7.8, color: "#6B7280", marginBottom: 1.5 }}>{exp.company} | {exp.dates}</Text>
                    </View>
                    {exp.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1.5 }} wrap={false}>
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
                  <View key={idx} style={{ marginBottom: 4 }}>
                    <View wrap={false}>
                      <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#0F1419" }}>{proj.name}</Text>
                    </View>
                    {proj.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1 }} wrap={false}>
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

  // Select Stylesheet based on chosen template
  let styles: any = standardStyles;
  if (templateId === "executive-leadership") styles = executiveStyles;
  else if (templateId === "dark-cyber") styles = darkStyles;
  else if (templateId === "compact-dense") styles = compactStyles;
  else if (templateId === "academic-research") styles = academicStyles;


  // Single-Column / Standard Layout with natural multi-page flow across N pages
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header: Name & Contact Details with guaranteed clean spacing */}
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.contact}>{contact}</Text>
        </View>

        {/* Professional Summary */}
        {summary ? (
          <View style={styles.section}>
            {templateId === "executive-leadership" ? (
              <View style={(styles as typeof executiveStyles).summaryBox}>
                <Text style={{ fontWeight: "bold", marginBottom: 1 }}>EXECUTIVE SUMMARY</Text>
                <Text>{summary}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
                <Text style={styles.summaryText}>{summary}</Text>
              </>
            )}
          </View>
        ) : null}

        {/* Experience Section */}
        {experience && experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 4.5 }}>
                {/* Entry Title & Company Header */}
                <View style={styles.entryHeader} wrap={false}>
                  <Text style={styles.entryTitleCompany}>
                    {exp.title} | {exp.company}
                  </Text>
                  <Text style={styles.entryDates}>{exp.dates}</Text>
                </View>

                {/* Bullets with individual atomic wrapping so multi-page flow splits seamlessly */}
                <View style={{ marginTop: 1, marginBottom: 1 }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem} wrap={false}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Key Projects Section */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 3.5 }}>
                <View style={styles.entryHeader} wrap={false}>
                  <Text style={styles.entryTitleCompany}>{proj.name}</Text>
                  {proj.url && <Text style={styles.entryDates}>{proj.url}</Text>}
                </View>
                {proj.techStack && (
                  <Text style={{ fontSize: 7.8, fontStyle: "italic", marginBottom: 1, color: "#6B7280" }}>
                    Tech: {proj.techStack}
                  </Text>
                )}
                <View style={{ marginTop: 1, marginBottom: 1 }}>
                  {proj.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem} wrap={false}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills Section */}
        {skills && skills.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>SKILLS & EXPERTISE</Text>
            <Text style={styles.skillsText}>{skills.join(" • ")}</Text>
          </View>
        ) : null}

        {/* Education Section */}
        {education && education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 2 }} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleCompany}>{edu.degree}</Text>
                  <Text style={styles.entryDates}>{edu.dates}</Text>
                </View>
                <Text style={{ fontSize: 8, color: "#374151", marginTop: 0.5 }}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications Section */}
        {certifications && certifications.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            <View style={{ marginTop: 1, marginBottom: 1 }}>
              {certifications.map((cert, cIdx) => (
                <Text key={cIdx} style={{ fontSize: 8, color: "#374151", marginBottom: 1 }}>
                  • {renderCertText(cert)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Additional Information Section */}
        {additional && additional.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <View style={{ marginTop: 1, marginBottom: 1 }}>
              {additional.map((item, aIdx) => (
                <View key={aIdx} style={styles.bulletItem} wrap={false}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Page numbering footer for multi-page resumes (Page X of Y) */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")}
          fixed
        />
      </Page>
    </Document>
  );
}
