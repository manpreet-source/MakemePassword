import { describe, expect, it } from "vitest";
import { generateUsername, USERNAME_STYLE_ORDER, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, generatePersonalizedUsernames } from "@/lib/generators/username";

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

describe("generatePersonalizedUsernames", () => {
  it("builds real variants that all contain the sanitized base", () => {
    const suggestions = generatePersonalizedUsernames("Alex Morgan", 5);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) {
      expect(suggestion.toLowerCase()).toContain("alexmorgan");
    }
  });

  it("strips spaces, punctuation, and emoji from the input", () => {
    const suggestions = generatePersonalizedUsernames("A!ex 🚀 Morgan?", 3);
    for (const suggestion of suggestions) {
      expect(/^[a-zA-Z0-9_.]+$/.test(suggestion)).toBe(true);
    }
  });

  it("normalizes accented characters instead of dropping the letter", () => {
    const suggestions = generatePersonalizedUsernames("José", 3);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.toLowerCase()).toContain("jose");
  });

  it("returns an empty array for input with no usable characters", () => {
    expect(generatePersonalizedUsernames("🚀🚀🚀", 5)).toEqual([]);
    expect(generatePersonalizedUsernames("   ", 5)).toEqual([]);
    expect(generatePersonalizedUsernames("", 5)).toEqual([]);
  });

  it("never returns duplicate suggestions", () => {
    const suggestions = generatePersonalizedUsernames("taylor", 8);
    expect(new Set(suggestions).size).toBe(suggestions.length);
  });

  it("respects the platform-safe length bounds", () => {
    const suggestions = generatePersonalizedUsernames("taylor", 10);
    for (const suggestion of suggestions) {
      expect(suggestion.length).toBeGreaterThanOrEqual(USERNAME_MIN_LENGTH);
      expect(suggestion.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH);
    }
  });

  it("still produces usable suggestions for a very long base by truncating safely", () => {
    const suggestions = generatePersonalizedUsernames("averyveryverylongusernamebase", 5);
    for (const suggestion of suggestions) {
      expect(suggestion.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH);
    }
  });

  it("is randomized rather than deterministic across calls", () => {
    const first = generatePersonalizedUsernames("jordan", 5);
    const second = generatePersonalizedUsernames("jordan", 5);
    expect(first).not.toEqual(second);
  });
});
