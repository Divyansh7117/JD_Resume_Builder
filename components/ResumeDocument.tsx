import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ResumeDocumentProps {
  name: string;
  contact: string; // e.g. "email | phone | linkedin"
  summary?: string;
  experience: { company: string; title: string; dates: string; bullets: string[]; location?: string }[];
  projects?: { name: string; bullets: string[]; url?: string; techStack?: string }[];
  education?: { institution: string; degree: string; dates: string; details?: string }[];
  certifications?: string[];
  skills: string[];
  additional?: string[];
  templateId?: string;
}

/* ═══════════════════════════════════════════════
   1. STANDARD ATS SINGLE-COLUMN STYLES
   ═══════════════════════════════════════════════ */
const standardStyles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4, color: "#111827" },
  header: { marginBottom: 14, textAlign: "center" },
  name: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  contact: { fontSize: 9, color: "#4B5563" },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 2,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
  entryTitleCompany: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },
  entryDates: { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#4B5563", textAlign: "right" },
  bulletItem: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
  bulletPoint: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10 },
  skillsText: { fontSize: 10, lineHeight: 1.4 },
});

/* ═══════════════════════════════════════════════
   2. MODERN SIDEBAR STYLES (TWO COLUMN PDF)
   ═══════════════════════════════════════════════ */
const sidebarStyles = StyleSheet.create({
  page: { flexDirection: "row", backgroundColor: "#FFFFFF" },
  leftSidebar: { width: "32%", backgroundColor: "#3654FF", color: "#FFFFFF", padding: 24, minHeight: "100%" },
  rightMain: { width: "68%", padding: 28, color: "#0F1419" },
  sidebarName: { fontSize: 16, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 4 },
  sidebarContact: { fontSize: 8, color: "#E0E7FF", lineHeight: 1.3, marginBottom: 16 },
  sidebarSectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#6366F1", paddingBottom: 2 },
  skillTag: { fontSize: 8, backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF", padding: 3, marginBottom: 4, borderRadius: 2 },
  mainSectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#3654FF", textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#E0E7FF", paddingBottom: 2, marginBottom: 8, letterSpacing: 0.5 },
});

/* ═══════════════════════════════════════════════
   3. EXECUTIVE STYLES (GOLD & NAVY)
   ═══════════════════════════════════════════════ */
const executiveStyles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4, color: "#0F1419", borderTopWidth: 8, borderTopColor: "#D08C1B" },
  header: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingBottom: 8 },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0F1419" },
  contact: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  summaryBox: { backgroundColor: "#F9FAFB", borderLeftWidth: 3, borderLeftColor: "#D08C1B", padding: 8, marginBottom: 12, fontSize: 9.5, color: "#374151" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0F1419", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#D08C1B", paddingBottom: 2 },
});

/* ═══════════════════════════════════════════════
   4. DARK CYBER CREATIVE STYLES
   ═══════════════════════════════════════════════ */
const darkStyles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Courier", fontSize: 9.5, lineHeight: 1.4, backgroundColor: "#0F1419", color: "#E5E7EB" },
  header: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#1F9D6B", paddingBottom: 6 },
  name: { fontSize: 16, fontFamily: "Courier-Bold", color: "#FFFFFF" },
  contact: { fontSize: 8.5, color: "#9CA3AF", marginTop: 2 },
  sectionTitle: { fontSize: 10, fontFamily: "Courier-Bold", color: "#1F9D6B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  bulletPoint: { width: 12, color: "#1F9D6B" },
});

/* ═══════════════════════════════════════════════
   5. COMPACT DENSE STYLES
   ═══════════════════════════════════════════════ */
const compactStyles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.25, color: "#111827" },
  header: { marginBottom: 10, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#8B5CF6", paddingBottom: 4 },
  name: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  contact: { fontSize: 8, color: "#4B5563" },
  sectionTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#8B5CF6", textTransform: "uppercase", marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB" },
});

/* ═══════════════════════════════════════════════
   6. ACADEMIC TIMES-ROMAN SERIF STYLES
   ═══════════════════════════════════════════════ */
const academicStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Times-Roman", fontSize: 10, lineHeight: 1.4, color: "#000000" },
  header: { marginBottom: 14, textAlign: "center", borderBottomWidth: 1, borderBottomColor: "#000000", paddingBottom: 6 },
  name: { fontSize: 16, fontFamily: "Times-Bold" },
  contact: { fontSize: 9, fontFamily: "Times-Italic", color: "#333333", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", textTransform: "uppercase", borderBottomWidth: 0.5, borderBottomColor: "#000000", paddingBottom: 2, marginBottom: 6 },
});

export default function ResumeDocument(props: ResumeDocumentProps) {
  const { name, contact, summary, experience, projects, education, certifications, skills, additional, templateId = "ats-standard" } = props;

  // Render 1: Modern Sidebar Layout (Two Column)
  if (templateId === "modern-sidebar") {
    return (
      <Document>
        <Page size="LETTER" style={sidebarStyles.page}>
          <View style={sidebarStyles.leftSidebar}>
            <Text style={sidebarStyles.sidebarName}>{name}</Text>
            <Text style={sidebarStyles.sidebarContact}>{contact}</Text>

            {skills && skills.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>TECHNICAL SKILLS</Text>
                {skills.map((skill, sIdx) => (
                  <Text key={sIdx} style={sidebarStyles.skillTag}>• {skill}</Text>
                ))}
              </View>
            )}

            {education && education.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>EDUCATION</Text>
                {education.map((edu, eIdx) => (
                  <View key={eIdx} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>{edu.degree}</Text>
                    <Text style={{ fontSize: 7.5, color: "#E0E7FF" }}>{edu.institution}</Text>
                    <Text style={{ fontSize: 7, color: "#93C5FD" }}>{edu.dates}</Text>
                  </View>
                ))}
              </View>
            )}

            {certifications && certifications.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={sidebarStyles.sidebarSectionTitle}>CERTIFICATIONS</Text>
                {certifications.map((cert, cIdx) => (
                  <Text key={cIdx} style={{ fontSize: 7.5, color: "#E0E7FF", marginBottom: 3 }}>• {cert}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={sidebarStyles.rightMain}>
            {summary ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={sidebarStyles.mainSectionTitle}>PROFILE SUMMARY</Text>
                <Text style={{ fontSize: 9.5, color: "#374151" }}>{summary}</Text>
              </View>
            ) : null}

            {experience && experience.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={sidebarStyles.mainSectionTitle}>WORK EXPERIENCE</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{exp.title}</Text>
                    <Text style={{ fontSize: 8.5, color: "#6B7280", marginBottom: 3 }}>{exp.company} | {exp.dates}</Text>
                    {exp.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
                        <Text style={{ width: 8, fontSize: 9, color: "#3654FF" }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 9, color: "#374151" }}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {projects && projects.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={sidebarStyles.mainSectionTitle}>KEY PROJECTS</Text>
                {projects.map((proj, idx) => (
                  <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                    <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold" }}>{proj.name}</Text>
                    {proj.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                        <Text style={{ width: 8, fontSize: 8.5, color: "#3654FF" }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 8.5, color: "#374151" }}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {additional && additional.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={sidebarStyles.mainSectionTitle}>ADDITIONAL INFORMATION</Text>
                {additional.map((item, aIdx) => (
                  <Text key={aIdx} style={{ fontSize: 8.5, color: "#374151", marginBottom: 2 }}>• {item}</Text>
                ))}
              </View>
            ) : null}
          </View>
        </Page>
      </Document>
    );
  }

  // Render 2: Dark Cyber Creative Layout
  if (templateId === "dark-cyber") {
    return (
      <Document>
        <Page size="LETTER" style={darkStyles.page}>
          <View style={darkStyles.header}>
            <Text style={darkStyles.name}>// {name}</Text>
            <Text style={darkStyles.contact}>{contact}</Text>
          </View>

          {summary && (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; PROFILE_SUMMARY</Text>
              <Text style={{ fontSize: 9, color: "#D4D4D8" }}>{summary}</Text>
            </View>
          )}

          {experience && experience.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; WORK_EXPERIENCE</Text>
              {experience.map((exp, idx) => (
                <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                  <Text style={{ fontSize: 9.5, fontFamily: "Courier-Bold", color: "#FFFFFF" }}>{exp.title} [{exp.company}]</Text>
                  <Text style={{ fontSize: 8.5, color: "#1F9D6B", marginBottom: 2 }}>{exp.dates}</Text>
                  {exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={darkStyles.bulletPoint}>+</Text>
                      <Text style={{ flex: 1, fontSize: 9, color: "#D4D4D8" }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {projects && projects.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; PROJECTS</Text>
              {projects.map((proj, idx) => (
                <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontSize: 9, fontFamily: "Courier-Bold", color: "#FFFFFF" }}>{proj.name}</Text>
                  {proj.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                      <Text style={darkStyles.bulletPoint}>+</Text>
                      <Text style={{ flex: 1, fontSize: 8.5, color: "#D4D4D8" }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {skills && skills.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; TECHNICAL_STACK</Text>
              <Text style={{ fontSize: 9, color: "#1F9D6B" }}>{skills.join(" • ")}</Text>
            </View>
          ) : null}

          {education && education.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; EDUCATION</Text>
              {education.map((edu, idx) => (
                <Text key={idx} style={{ fontSize: 8.5, color: "#E5E7EB" }}>
                  {edu.degree} — {edu.institution} ({edu.dates})
                </Text>
              ))}
            </View>
          ) : null}

          {certifications && certifications.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={darkStyles.sectionTitle}>&gt; CERTIFICATIONS</Text>
              <Text style={{ fontSize: 8.5, color: "#E5E7EB" }}>{certifications.join(" • ")}</Text>
            </View>
          ) : null}
        </Page>
      </Document>
    );
  }

  // Render 3: Executive Leadership Layout
  if (templateId === "executive-leadership") {
    return (
      <Document>
        <Page size="LETTER" style={executiveStyles.page}>
          <View style={executiveStyles.header}>
            <Text style={executiveStyles.name}>{name}</Text>
            <Text style={executiveStyles.contact}>{contact}</Text>
          </View>

          {summary ? (
            <View style={executiveStyles.summaryBox}>
              <Text>{summary}</Text>
            </View>
          ) : null}

          {experience && experience.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={executiveStyles.sectionTitle}>LEADERSHIP EXPERIENCE</Text>
              {experience.map((exp, idx) => (
                <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{exp.title} — {exp.company}</Text>
                    <Text style={{ fontSize: 8.5, color: "#D08C1B" }}>{exp.dates}</Text>
                  </View>
                  {exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 10, fontSize: 9, color: "#D08C1B" }}>▪</Text>
                      <Text style={{ flex: 1, fontSize: 9.5, color: "#374151" }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {projects && projects.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={executiveStyles.sectionTitle}>STRATEGIC PROJECTS</Text>
              {projects.map((proj, idx) => (
                <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold" }}>{proj.name}</Text>
                  {proj.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                      <Text style={{ width: 10, fontSize: 9, color: "#D08C1B" }}>▪</Text>
                      <Text style={{ flex: 1, fontSize: 9, color: "#374151" }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {skills && skills.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={executiveStyles.sectionTitle}>CORE COMPETENCIES</Text>
              <Text style={{ fontSize: 9.5, color: "#374151" }}>{skills.join(" • ")}</Text>
            </View>
          ) : null}

          {education && education.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={executiveStyles.sectionTitle}>EDUCATION</Text>
              {education.map((edu, idx) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{edu.degree} | {edu.institution}</Text>
                  <Text style={{ fontSize: 8.5, color: "#6B7280" }}>{edu.dates}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {certifications && certifications.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={executiveStyles.sectionTitle}>CERTIFICATIONS</Text>
              <Text style={{ fontSize: 9, color: "#374151" }}>{certifications.join(" • ")}</Text>
            </View>
          ) : null}
        </Page>
      </Document>
    );
  }

  // Render 4: Compact Dense Layout
  if (templateId === "compact-dense") {
    return (
      <Document>
        <Page size="LETTER" style={compactStyles.page}>
          <View style={compactStyles.header}>
            <Text style={compactStyles.name}>{name}</Text>
            <Text style={compactStyles.contact}>{contact}</Text>
          </View>

          {summary && (
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 8.5, color: "#374151" }}>{summary}</Text>
            </View>
          )}

          {experience && experience.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={compactStyles.sectionTitle}>EXPERIENCE</Text>
              {experience.map((exp, idx) => (
                <View key={idx} style={{ marginBottom: 4 }} wrap={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{exp.title} | {exp.company}</Text>
                    <Text style={{ fontSize: 8, color: "#6B7280" }}>{exp.dates}</Text>
                  </View>
                  {exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1 }}>
                      <Text style={{ width: 8, fontSize: 8 }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 8.5 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {projects && projects.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={compactStyles.sectionTitle}>PROJECTS</Text>
              {projects.map((proj, idx) => (
                <View key={idx} style={{ marginBottom: 3 }} wrap={false}>
                  <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold" }}>{proj.name}</Text>
                  {proj.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 1 }}>
                      <Text style={{ width: 8, fontSize: 8 }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 8 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {skills && skills.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={compactStyles.sectionTitle}>TECHNICAL SKILLS</Text>
              <Text style={{ fontSize: 8.5 }}>{skills.join(", ")}</Text>
            </View>
          ) : null}

          {education && education.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={compactStyles.sectionTitle}>EDUCATION</Text>
              {education.map((edu, idx) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold" }}>{edu.degree} - {edu.institution}</Text>
                  <Text style={{ fontSize: 8, color: "#6B7280" }}>{edu.dates}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {certifications && certifications.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={compactStyles.sectionTitle}>CERTIFICATIONS</Text>
              <Text style={{ fontSize: 8 }}>{certifications.join(" • ")}</Text>
            </View>
          ) : null}
        </Page>
      </Document>
    );
  }

  // Render 5: Academic Times-Roman Layout
  if (templateId === "academic-research") {
    return (
      <Document>
        <Page size="LETTER" style={academicStyles.page}>
          <View style={academicStyles.header}>
            <Text style={academicStyles.name}>{name}</Text>
            <Text style={academicStyles.contact}>{contact}</Text>
          </View>

          {summary && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9.5, fontFamily: "Times-Roman" }}>{summary}</Text>
            </View>
          )}

          {experience && experience.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={academicStyles.sectionTitle}>RESEARCH & ENGINEERING EXPERIENCE</Text>
              {experience.map((exp, idx) => (
                <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Times-Bold" }}>{exp.title}, {exp.company}</Text>
                    <Text style={{ fontSize: 9, fontFamily: "Times-Italic", color: "#555555" }}>{exp.dates}</Text>
                  </View>
                  {exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 10, fontSize: 9 }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 9.5 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {projects && projects.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={academicStyles.sectionTitle}>PUBLICATIONS & PROJECTS</Text>
              {projects.map((proj, idx) => (
                <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontSize: 9.5, fontFamily: "Times-Bold" }}>{proj.name}</Text>
                  {proj.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 10, fontSize: 9 }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 9 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {skills && skills.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={academicStyles.sectionTitle}>TECHNICAL STACK & ALGORITHMS</Text>
              <Text style={{ fontSize: 9.5 }}>{skills.join(", ")}</Text>
            </View>
          ) : null}

          {education && education.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={academicStyles.sectionTitle}>EDUCATION</Text>
              {education.map((edu, idx) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 9.5, fontFamily: "Times-Bold" }}>{edu.degree}, {edu.institution}</Text>
                  <Text style={{ fontSize: 9, fontFamily: "Times-Italic", color: "#555555" }}>{edu.dates}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {certifications && certifications.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={academicStyles.sectionTitle}>CERTIFICATIONS</Text>
              <Text style={{ fontSize: 9 }}>{certifications.join(" • ")}</Text>
            </View>
          ) : null}
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
          <View style={{ marginBottom: 12 }}>
            <Text style={standardStyles.sectionTitle}>PROFILE SUMMARY</Text>
            <Text style={{ fontSize: 10, color: "#374151" }}>{summary}</Text>
          </View>
        ) : null}

        {experience && experience.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>EXPERIENCE</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>
                    {exp.title} | {exp.company}
                  </Text>
                  <Text style={standardStyles.entryDates}>{exp.dates}</Text>
                </View>
                <View style={{ marginTop: 2, marginBottom: 4 }}>
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
              <View key={idx} style={{ marginBottom: 4 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>{proj.name}</Text>
                  {proj.url && <Text style={standardStyles.entryDates}>{proj.url}</Text>}
                </View>
                {proj.techStack && (
                  <Text style={{ fontSize: 9, fontStyle: "italic", marginBottom: 2 }}>Tech: {proj.techStack}</Text>
                )}
                <View style={{ marginTop: 2, marginBottom: 2 }}>
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
            <Text style={standardStyles.sectionTitle}>TECHNICAL SKILLS</Text>
            <Text style={standardStyles.skillsText}>{skills.join(", ")}</Text>
          </View>
        ) : null}

        {education && education.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>EDUCATION</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 4 }} wrap={false}>
                <View style={standardStyles.entryHeader}>
                  <Text style={standardStyles.entryTitleCompany}>
                    {edu.degree} — {edu.institution}
                  </Text>
                  <Text style={standardStyles.entryDates}>{edu.dates}</Text>
                </View>
                {edu.details && (
                  <View style={{ marginTop: 2, marginBottom: 2 }}>
                    <View style={standardStyles.bulletItem}>
                      <Text style={standardStyles.bulletPoint}>•</Text>
                      <Text style={standardStyles.bulletText}>{edu.details}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {certifications && certifications.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>CERTIFICATIONS & LEARNING</Text>
            <View style={{ marginTop: 2, marginBottom: 2 }}>
              {certifications.map((cert, cIdx) => (
                <View key={cIdx} style={standardStyles.bulletItem}>
                  <Text style={standardStyles.bulletPoint}>•</Text>
                  <Text style={standardStyles.bulletText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {additional && additional.length > 0 ? (
          <View style={standardStyles.section}>
            <Text style={standardStyles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <View style={{ marginTop: 2, marginBottom: 2 }}>
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
