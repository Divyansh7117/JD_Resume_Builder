/**
 * Hybrid Exact & Semantic Tech Matcher
 * Provides canonical normalization, alias resolution, and exact token matching.
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
  gql: "graphql",
  rest: "rest api",
  "rest api": "rest api",
  "restful api": "rest api",
  "rest apis": "rest api",
  git: "git",
  github: "git",
  gitlab: "git",
};

/**
 * Normalizes a technology/skill name to its canonical form if known.
 */
export function normalizeTechName(name: string): string {
  if (!name) return "";
  const cleaned = name.toLowerCase().replace(/[^\w\s\.\#\+\-]/g, "").trim();
  return CANONICAL_TECH_MAP[cleaned] || cleaned;
}

/**
 * Performs exact and normalized token matching of a requirement against candidate text.
 */
export function checkExactTechMatch(
  requirementName: string,
  candidateText: string
): { isMatch: boolean; canonicalName: string } {
  if (!requirementName || !candidateText) {
    return { isMatch: false, canonicalName: "" };
  }

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

