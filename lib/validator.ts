import { ResumeData, TailoredOutput } from "../types";

export function validateNoFabrication(
  original: ResumeData,
  output: TailoredOutput
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  const origExperiences = original.sections?.experience || [];
  const origSkills = original.sections?.skills || [];
  const origSkillsLower = origSkills.map((s) => s.toLowerCase());

  // 1-5. Validate rewritten experience entries
  for (const exp of output.rewritten_experience || []) {
    const origExp = origExperiences.find(
      (e) => e.company.toLowerCase() === exp.company.toLowerCase()
    );

    // 1. Company check
    if (!origExp) {
      issues.push(`Invented company '${exp.company}' not found in original experience.`);
      continue;
    }

    // 2. Title check
    if (exp.title.toLowerCase() !== origExp.title.toLowerCase()) {
      issues.push(
        `Title '${exp.title}' for company '${exp.company}' does not match original title '${origExp.title}'.`
      );
    }

    // 3. Dates check
    if (exp.dates.toLowerCase() !== origExp.dates.toLowerCase()) {
      issues.push(
        `Dates '${exp.dates}' for company '${exp.company}' do not match original dates '${origExp.dates}'.`
      );
    }

    // 4. Bullet count check
    if (exp.bullets.length > origExp.bullets.length) {
      issues.push(
        `Experience entry for '${exp.company}' has ${exp.bullets.length} bullets, which exceeds original bullet count of ${origExp.bullets.length}.`
      );
    }

    // 5. Standalone numbers/percentages check
    const origBulletsText = (origExp.bullets || []).join(" ").toLowerCase();
    const metricRegex = /\d+(?:\.\d+)?(?:%|[kKmM]|\+)?/g;

    for (const bullet of exp.bullets || []) {
      const matches = bullet.match(metricRegex) || [];
      for (const match of matches) {
        if (!origBulletsText.includes(match.toLowerCase())) {
          const companyName = exp.company.endsWith(".") ? exp.company.slice(0, -1) : exp.company;
          issues.push(
            `Invented metric '${match}' not found in original bullets for ${companyName}.`
          );
        }
      }
    }

    // 7. Check for skill insertion into bullets where they didn't originally appear
    const companyName = exp.company.endsWith(".") ? exp.company.slice(0, -1) : exp.company;
    for (const bullet of exp.bullets || []) {
      const bulletLower = bullet.toLowerCase();
      for (const skillTerm of origSkills) {
        const termLower = skillTerm.toLowerCase().trim();
        // Ignore extremely short single-letter terms unless specific
        if (termLower.length <= 1) continue;

        if (bulletLower.includes(termLower)) {
          if (!origBulletsText.includes(termLower)) {
            issues.push(
              `Inserted skill '${skillTerm}' into a bullet for ${companyName} where it did not originally appear — even though it's truthfully listed elsewhere on the resume, this changes the specific claim made in that bullet.`
            );
          }
        }
      }
    }
  }

  // 6. Skill existence check
  for (const skill of output.rewritten_skills || []) {
    if (!origSkillsLower.includes(skill.toLowerCase())) {
      issues.push(`Invented skill '${skill}' not found in original skills list.`);
    }
  }

  // Project bullets check (if output has rewritten_projects in future)
  const outputProjects = (output as unknown as Record<string, unknown>).rewritten_projects as
    | { name: string; bullets: string[] }[]
    | undefined;

  if (outputProjects && Array.isArray(outputProjects)) {
    const origProjects = original.sections?.projects || [];
    for (const proj of outputProjects) {
      const origProj = origProjects.find(
        (p) => p.name.toLowerCase() === proj.name.toLowerCase()
      );
      if (!origProj) continue;

      const origProjBulletsText = (origProj.bullets || []).join(" ").toLowerCase();
      for (const bullet of proj.bullets || []) {
        const bulletLower = bullet.toLowerCase();
        for (const skillTerm of origSkills) {
          const termLower = skillTerm.toLowerCase().trim();
          if (termLower.length <= 1) continue;

          if (bulletLower.includes(termLower) && !origProjBulletsText.includes(termLower)) {
            issues.push(
              `Inserted skill '${skillTerm}' into a bullet for project ${proj.name} where it did not originally appear — even though it's truthfully listed elsewhere on the resume, this changes the specific claim made in that bullet.`
            );
          }
        }
      }
    }
  }

  // 8. Check for skill insertion into rewritten_summary where they didn't appear in original summary
  if (output.rewritten_summary && original.summary && original.summary.trim().length > 0) {
    const summaryLower = output.rewritten_summary.toLowerCase();
    const origSummaryLower = original.summary.toLowerCase();

    for (const skillTerm of origSkills) {
      const termLower = skillTerm.toLowerCase().trim();
      if (termLower.length <= 1) continue;

      const escaped = termLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const startsWithWordChar = /^\w/.test(termLower);
      const endsWithWordChar = /\w$/.test(termLower);
      const prefix = startsWithWordChar ? "\\b" : "";
      const suffix = endsWithWordChar ? "\\b" : "";
      const regex = new RegExp(`${prefix}${escaped}${suffix}`, "i");

      if (regex.test(summaryLower) && !regex.test(origSummaryLower)) {
        issues.push(
          `Inserted skill '${skillTerm}' into rewritten summary where it did not appear in original summary text — even though it's listed elsewhere on the resume, do not add terms to summary not present in the original summary text.`
        );
      }
    }
  }

  // 9. Check for candidate professional title and parenthetical specialization integrity
  if (output.rewritten_summary && original.summary) {
    const getFirstSentenceSegment = (text: string) => {
      const match = text.split(/[.—\n]/)[0];
      return (match || text).trim();
    };

    const origFirstSeg = getFirstSentenceSegment(original.summary);
    const rewFirstSeg = getFirstSentenceSegment(output.rewritten_summary);

    const origFirstLower = origFirstSeg.toLowerCase();
    const rewFirstLower = rewFirstSeg.toLowerCase();

    // Key professional role nouns to check for changes
    const roleNouns = ["developer", "engineer", "architect", "analyst", "manager", "specialist", "consultant", "lead", "designer", "administrator"];

    for (const noun of roleNouns) {
      const regex = new RegExp(`\\b${noun}\\b`, "i");
      if (regex.test(rewFirstLower) && !regex.test(origFirstLower)) {
        issues.push(
          `Rewritten summary changed the candidate's stated professional title from the original — this is not a truthful rephrasing.`
        );
        break;
      }
    }

    // Check parenthetical specializations (e.g. "(Data Science)") in original first sentence
    const parenRegex = /\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = parenRegex.exec(origFirstSeg)) !== null) {
      const parenContent = match[1].toLowerCase().trim();
      if (!rewFirstLower.includes(parenContent)) {
        issues.push(
          `Rewritten summary altered or dropped the candidate's parenthetical specialization '(${match[1]})' from the original — this is not a truthful rephrasing.`
        );
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
