/**
 * Hybrid Exact & Semantic Tech Matcher
 * Provides canonical normalization, incompatible tech disambiguation, and keyword-stuffing protection.
 */

export const CANONICAL_TECH_MAP: Record<string, string> = {
  postgres: "postgresql",
  postgresql: "postgresql",
  psql: "postgresql",
  pg: "postgresql",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  node: "node.js",
  nodejs: "node.js",
  "node.js": "node.js",
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  javascript: "javascript",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  golang: "go",
  go: "go",
  python: "python",
  py: "python",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  flutter: "flutter",
  "react native": "react native",
  reactnative: "react native",
  supabase: "supabase",
  firebase: "firebase",
  mongo: "mongodb",
  mongodb: "mongodb",
  redis: "redis",
  docker: "docker",
  graphql: "graphql",
  rest: "rest api",
  "rest api": "rest api",
  "restful api": "rest api",
  "rest apis": "rest api",
  git: "git",
  github: "git",
  gitlab: "git",
};

// Incompatible related technologies that must NOT be treated as interchangeable equivalents
export const INCOMPATIBLE_TECH_PAIRS: [string, string][] = [
  ["flutter", "react native"],
  ["flutter", "swift"],
  ["flutter", "kotlin"],
  ["react native", "flutter"],
  ["supabase", "firebase"],
  ["firebase", "supabase"],
  ["postgresql", "mongodb"],
  ["mongodb", "postgresql"],
  ["postgresql", "mysql"],
  ["mysql", "mongodb"],
  ["react", "angular"],
  ["react", "vue"],
  ["angular", "react"],
  ["vue", "react"],
  ["django", "node.js"],
  ["fastapi", "spring boot"],
  ["rust", "go"],
  ["elixir", "node.js"],
];

/**
 * Normalizes a technology/skill name to its canonical form if known.
 */
export function normalizeTechName(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^\w\s\.\#\+\-]/g, "").trim();
  return CANONICAL_TECH_MAP[cleaned] || cleaned;
}

/**
 * Checks if two technology names are known incompatible/non-equivalent pairs.
 */
export function areTechnologiesIncompatible(techA: string, techB: string): boolean {
  const normA = normalizeTechName(techA);
  const normB = normalizeTechName(techB);
  if (normA === normB) return false;

  return INCOMPATIBLE_TECH_PAIRS.some(
    ([a, b]) => (normA === a && normB === b) || (normA === b && normB === a)
  );
}

/**
 * Performs exact and normalized token matching of a requirement against candidate text.
 */
export function checkExactTechMatch(
  requirementName: string,
  candidateText: string
): { isMatch: boolean; canonicalName: string } {
  const normReq = normalizeTechName(requirementName);
  const words = candidateText.toLowerCase().split(/[^\w\.\#\+\-]+/).filter(Boolean);

  for (const w of words) {
    if (normalizeTechName(w) === normReq) {
      return { isMatch: true, canonicalName: normReq };
    }
  }

  // Also check phrase match
  const lowerCand = candidateText.toLowerCase();
  if (lowerCand.includes(requirementName.toLowerCase()) || lowerCand.includes(normReq)) {
    return { isMatch: true, canonicalName: normReq };
  }

  return { isMatch: false, canonicalName: normReq };
}

/**
 * Detects if the candidate's evidence consists purely of related generic tools (e.g. SQL, Python, Jira)
 * rather than the specific required technology (e.g. PostgreSQL, Supabase, Flutter, Git).
 */
export function isGenericSkillForSpecificTech(requirementName: string, evidenceText: string): boolean {
  const reqLower = requirementName.toLowerCase();
  const evLower = evidenceText.toLowerCase();

  // Specific PostgreSQL requirement check
  if ((reqLower.includes("postgres") || reqLower.includes("postgresql")) && !evLower.includes("postgres")) {
    return true;
  }

  // Specific Supabase requirement check
  if (reqLower.includes("supabase") && !evLower.includes("supabase")) {
    return true;
  }

  // Specific Flutter requirement check
  if (reqLower.includes("flutter") && !evLower.includes("flutter")) {
    return true;
  }

  // Specific Firebase requirement check
  if (reqLower.includes("firebase") && !evLower.includes("firebase")) {
    return true;
  }

  // Specific Git/GitHub requirement check
  if ((reqLower.includes("git") || reqLower.includes("github")) && !evLower.includes("git")) {
    return true;
  }

  // Specific REST API requirement check
  if ((reqLower.includes("rest") || reqLower.includes("api architecture")) && !evLower.includes("rest") && !evLower.includes("api") && !evLower.includes("endpoint")) {
    return true;
  }

  return false;
}
