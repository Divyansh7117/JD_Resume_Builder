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
  }

  // 6. Skill existence check
  for (const skill of output.rewritten_skills || []) {
    if (!origSkillsLower.includes(skill.toLowerCase())) {
      issues.push(`Invented skill '${skill}' not found in original skills list.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
