import { describe, expect, it } from "vitest";
import { secureRandomInt, securePick, secureShuffle, hasSequentialRun, hasRepeatedRun } from "@/lib/generators/random";

describe("secureRandomInt", () => {
  it("stays within [0, max)", () => {
    for (let i = 0; i < 500; i += 1) {
      const value = secureRandomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it("rejects a non-positive-integer bound", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });
});

describe("securePick", () => {
  it("only returns items from the list", () => {
    const list = ["a", "b", "c"];
    for (let i = 0; i < 50; i += 1) {
      expect(list).toContain(securePick(list));
    }
  });

  it("throws on an empty list", () => {
    expect(() => securePick([])).toThrow(RangeError);
  });
});

describe("secureShuffle", () => {
  it("preserves length and multiset of elements", () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = secureShuffle(input);
    expect(shuffled).toHaveLength(input.length);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    const copy = [...input];
    secureShuffle(input);
    expect(input).toEqual(copy);
  });
});

describe("hasSequentialRun", () => {
  it("detects ascending and descending runs", () => {
    expect(hasSequentialRun("ab12cd", 3)).toBe(false);
    expect(hasSequentialRun("abc123", 3)).toBe(true);
    expect(hasSequentialRun("cba", 3)).toBe(true);
  });

  it("ignores strings shorter than the run length", () => {
    expect(hasSequentialRun("ab", 3)).toBe(false);
  });
});

describe("hasRepeatedRun", () => {
  it("detects repeated characters", () => {
    expect(hasRepeatedRun("aaab", 3)).toBe(true);
    expect(hasRepeatedRun("aabb", 3)).toBe(false);
  });
});
