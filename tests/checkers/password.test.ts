import { describe, expect, it } from "vitest";
import { checkPassword, scoreLabel } from "@/lib/checkers/password";

describe("checkPassword", () => {
  it("scores a short, common password as weak", () => {
    const result = checkPassword("password");
    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("scores a long, varied password as strong", () => {
    const result = checkPassword("Xk9#mQ2$vL7!pR4@wZ1&");
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it("flags sequential and repeated characters", () => {
    const sequential = checkPassword("abc12345XYZ!");
    expect(sequential.recommendations.some((item) => /sequence/i.test(item))).toBe(true);

    const repeated = checkPassword("aaaBBB111!!!");
    expect(repeated.recommendations.some((item) => /repeating/i.test(item))).toBe(true);
  });

  it("never returns a score outside 1-5", () => {
    for (const value of ["", "a", "aaaaaaaaaaaaaaaaaaaa", "P@ssw0rd!P@ssw0rd!"]) {
      const result = checkPassword(value);
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(5);
    }
  });
});

describe("scoreLabel", () => {
  it("maps every valid score to a label", () => {
    for (let score = 1; score <= 5; score += 1) {
      expect(scoreLabel(score)).not.toBe("Unknown");
    }
  });
});
