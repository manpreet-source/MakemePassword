import { describe, expect, it } from "vitest";
import { calculateMaxEntropyBits, estimateCrackTime } from "@/lib/generators/entropy";

describe("calculateMaxEntropyBits", () => {
  it("matches the textbook formula for known values", () => {
    expect(calculateMaxEntropyBits({ poolSize: 2, length: 10 })).toBe(10);
    expect(calculateMaxEntropyBits({ poolSize: 4, length: 10 })).toBe(20);
    expect(calculateMaxEntropyBits({ poolSize: 16, length: 8 })).toBe(32);
  });

  it("returns 0 for a degenerate pool or length", () => {
    expect(calculateMaxEntropyBits({ poolSize: 1, length: 10 })).toBe(0);
    expect(calculateMaxEntropyBits({ poolSize: 26, length: 0 })).toBe(0);
  });

  it("scales linearly with length", () => {
    const ten = calculateMaxEntropyBits({ poolSize: 62, length: 10 });
    const twenty = calculateMaxEntropyBits({ poolSize: 62, length: 20 });
    expect(twenty).toBeCloseTo(ten * 2, 6);
  });

  it("scales with log2 of pool size", () => {
    const small = calculateMaxEntropyBits({ poolSize: 26, length: 16 });
    const large = calculateMaxEntropyBits({ poolSize: 94, length: 16 });
    expect(large).toBeGreaterThan(small);
  });
});

describe("estimateCrackTime", () => {
  it("never returns a negative or NaN duration", () => {
    for (const bits of [0, 1, 10, 40, 80, 128, 256, 512]) {
      const result = estimateCrackTime(bits);
      expect(Number.isNaN(result.seconds)).toBe(false);
      expect(result.seconds).toBeGreaterThanOrEqual(0);
      expect(typeof result.label).toBe("string");
    }
  });

  it("reports low-entropy passwords as fast to crack", () => {
    const result = estimateCrackTime(10);
    expect(result.label).toMatch(/second|instant/);
  });

  it("never overflows to Infinity/NaN in its label for very large entropy", () => {
    const result = estimateCrackTime(512);
    expect(result.label).not.toContain("NaN");
    expect(result.label).not.toContain("Infinity");
  });

  it("exposes the guesses-per-second assumption used", () => {
    const result = estimateCrackTime(64, 1_000_000);
    expect(result.guessesPerSecond).toBe(1_000_000);
  });

  it("increases estimated time as entropy increases", () => {
    const low = estimateCrackTime(20);
    const high = estimateCrackTime(80);
    expect(high.seconds).toBeGreaterThan(low.seconds);
  });
});
