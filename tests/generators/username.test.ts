import { describe, expect, it } from "vitest";
import { generateUsername, USERNAME_STYLE_ORDER, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } from "@/lib/generators/username";

describe("generateUsername", () => {
  it("respects the requested length within bounds for every style", () => {
    for (const style of USERNAME_STYLE_ORDER) {
      const username = generateUsername({ style, length: 10 });
      expect(username.length).toBeLessThanOrEqual(10);
      expect(username.length).toBeGreaterThan(0);
    }
  });

  it("clamps length to the supported range", () => {
    const tooShort = generateUsername({ style: "minimal", length: 1 });
    expect(tooShort).toHaveLength(USERNAME_MIN_LENGTH);
    const tooLong = generateUsername({ style: "minimal", length: 1000 });
    expect(tooLong).toHaveLength(USERNAME_MAX_LENGTH);
  });

  it("only uses lowercase, digits, and underscore for the minimal style", () => {
    const username = generateUsername({ style: "minimal", length: 20 });
    expect(/^[a-z0-9_]+$/.test(username)).toBe(true);
  });
});
