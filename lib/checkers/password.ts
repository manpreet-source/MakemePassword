export interface CheckResult {
  score: number;
  label: string;
  summary: string;
  recommendations: string[];
}

const SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

export function scoreLabel(score: number): string {
  return SCORE_LABELS[Math.max(0, Math.min(4, score - 1))] ?? "Unknown";
}

/**
 * Local, client-side password strength heuristic. The password value never
 * leaves the browser and is never sent to analytics or a server.
 */
export function checkPassword(value: string): CheckResult {
  let score = 0;
  const recommendations: string[] = [];
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const hasSequence = /(?:abc|bcd|cde|123|234|345|qwerty)/i.test(value);
  const repeated = /(.)\1{2,}/.test(value);

  if (value.length >= 16) score += 2;
  else if (value.length >= 12) score += 1;
  else recommendations.push("Make it at least 12 characters, preferably 16 or more.");

  score += [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length >= 3 ? 2 : 1;

  if (hasSequence) {
    score -= 1;
    recommendations.push("Avoid sequences such as 123, abc, or qwerty.");
  }
  if (repeated) {
    score -= 1;
    recommendations.push("Avoid repeating the same character several times.");
  }
  if (/password|letmein|welcome|admin|iloveyou/i.test(value)) {
    score -= 2;
    recommendations.push("Avoid common passwords and dictionary phrases.");
  }
  if (!hasUpper) recommendations.push("Add an uppercase letter.");
  if (!hasLower) recommendations.push("Add a lowercase letter.");
  if (!hasNumber) recommendations.push("Add a number.");
  if (!hasSymbol) recommendations.push("Add a symbol.");
  if (!recommendations.length) recommendations.push("Use a different password for every account.");

  score = Math.max(1, Math.min(5, score));
  const summary =
    score <= 2
      ? "This password is easy to predict or too short."
      : score === 3
        ? "This password is fair, but there is room to make it stronger."
        : "This password has good length and character variety.";

  return { score, label: scoreLabel(score), summary, recommendations };
}
