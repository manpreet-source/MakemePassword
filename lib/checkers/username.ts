import type { CheckResult } from "./password";
import { scoreLabel } from "./password";

/**
 * Local, client-side username predictability heuristic. The username value
 * never leaves the browser and is never sent to analytics or a server.
 */
export function checkUsername(value: string): CheckResult {
  let score = 5;
  const recommendations: string[] = [];
  const normalized = value.toLowerCase();

  if (value.length < 6) {
    score -= 2;
    recommendations.push("Use at least 6 characters.");
  }
  if (/\d{4}/.test(value)) {
    score -= 1;
    recommendations.push("Avoid year-like numbers such as a birth year.");
  }
  if (/^(john|mike|admin|user|test|guest)/i.test(value) || /(123|qwerty|password)/i.test(normalized)) {
    score -= 2;
    recommendations.push("Avoid common names, labels, and predictable patterns.");
  }
  if (/(.)\1{2,}/.test(value) || /[^a-z0-9]{2,}/i.test(value)) {
    score -= 1;
    recommendations.push("Reduce repeated characters and excessive symbols.");
  }
  if (value.length < 10) recommendations.push("Consider two unrelated words for a less predictable username.");
  recommendations.push("Avoid reusing the same username everywhere.");

  score = Math.max(1, score);
  const summary =
    score <= 2
      ? "This username has patterns that make it easier to guess."
      : score === 3
        ? "This username is usable, but could be less predictable."
        : "This username avoids the most common predictable patterns.";

  return { score, label: scoreLabel(score), summary, recommendations };
}

export type { CheckResult };
