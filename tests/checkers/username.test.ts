import { describe, expect, it } from "vitest";
import { checkUsername } from "@/lib/checkers/username";

describe("checkUsername", () => {
  it("flags short, predictable usernames", () => {
    const result = checkUsername("admin");
    expect(result.score).toBeLessThanOrEqual(2);
  });

  it("flags birth-year-like numbers", () => {
    const result = checkUsername("johnsmith1998");
    expect(result.recommendations.some((item) => /year/i.test(item))).toBe(true);
  });

  it("scores a distinctive username higher than a predictable one", () => {
    const predictable = checkUsername("admin");
    const distinctive = checkUsername("QuietFalconOrbit");
    expect(distinctive.score).toBeGreaterThan(predictable.score);
  });

  it("never returns a score below 1", () => {
    const result = checkUsername("a");
    expect(result.score).toBeGreaterThanOrEqual(1);
  });
});
