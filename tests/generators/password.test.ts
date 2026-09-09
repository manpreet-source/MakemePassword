import { describe, expect, it } from "vitest";
import {
  generatePassword,
  describePassword,
  validatePasswordOptions,
  getPasswordPoolInfo,
  resolveSymbolPool,
  estimatePasswordEntropyBits,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  DEFAULT_PASSWORD_OPTIONS,
} from "@/lib/generators/password";
import { GeneratorValidationError } from "@/lib/generators/random";

const ITERATIONS = 1000;

describe("generatePassword — length correctness (TEST 1, TEST 7)", () => {
  it("generates exactly the requested length across 1000 runs", () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const password = generatePassword({ length: 20 });
      expect(password).toHaveLength(20);
    }
  });

  it("changes length correctly when reconfigured from 12 to 32", () => {
    expect(generatePassword({ length: 12 })).toHaveLength(12);
    expect(generatePassword({ length: 32 })).toHaveLength(32);
  });

  it("never produces a length that disagrees with the requested value, for every length in range", () => {
    for (let length = PASSWORD_MIN_LENGTH; length <= PASSWORD_MAX_LENGTH; length += 4) {
      expect(generatePassword({ length })).toHaveLength(length);
    }
  });
});

describe("generatePassword — single-category pools (TEST 2, 3, 4)", () => {
  it("lowercase-only: every character is lowercase across 1000 runs", () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const password = generatePassword({ length: 20, uppercase: false, lowercase: true, numbers: false, symbols: false });
      expect(/^[a-z]+$/.test(password)).toBe(true);
    }
  });

  it("uppercase-only: every character is uppercase across 1000 runs", () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const password = generatePassword({ length: 20, uppercase: true, lowercase: false, numbers: false, symbols: false });
      expect(/^[A-Z]+$/.test(password)).toBe(true);
    }
  });

  it("numbers-only: every character is numeric across 1000 runs", () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const password = generatePassword({ length: 20, uppercase: false, lowercase: false, numbers: true, symbols: false });
      expect(/^[0-9]+$/.test(password)).toBe(true);
    }
  });
});

describe("generatePassword — required-category coverage (TEST 5)", () => {
  it("includes at least one character from every selected category", () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const password = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false });
      const chars = describePassword(password);
      expect(chars.hasUppercase).toBe(true);
      expect(chars.hasLowercase).toBe(true);
      expect(chars.hasNumbers).toBe(true);
      expect(chars.hasSymbols).toBe(true);
    }
  });
});

describe("generatePassword — ambiguous character exclusion (TEST 6)", () => {
  it("never includes an excluded lookalike character across 500 runs", () => {
    for (let i = 0; i < 500; i += 1) {
      const password = generatePassword({ length: 30, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: true });
      expect(password).not.toMatch(/[Il1O0o]/);
    }
  });

  it("shrinks the reported pool size when ambiguous exclusion is enabled", () => {
    const withAmbiguous = getPasswordPoolInfo({ uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false });
    const withoutAmbiguous = getPasswordPoolInfo({ uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: true });
    expect(withoutAmbiguous.poolSize).toBeLessThan(withAmbiguous.poolSize);
  });
});

describe("generatePassword — disabled categories (TEST 8, 9)", () => {
  it("produces no symbols when symbols are disabled", () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword({ length: 24, symbols: false });
      expect(/[^A-Za-z0-9]/.test(password)).toBe(false);
    }
  });

  it("produces no numbers when numbers are disabled", () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword({ length: 24, numbers: false });
      expect(/[0-9]/.test(password)).toBe(false);
    }
  });
});

describe("generatePassword — custom symbol set (TEST 10)", () => {
  it("only ever uses symbols from the custom set", () => {
    const custom = "!?";
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword({
        length: 24,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
        customSymbols: custom,
        excludeAmbiguous: false,
      });
      expect(/^[!?]+$/.test(password)).toBe(true);
    }
  });

  it("resolveSymbolPool ignores characters outside the safe symbol list", () => {
    const pool = resolveSymbolPool("!a1"); // 'a' and '1' are not symbols
    expect(pool).toBe("!");
  });

  it("resolveSymbolPool falls back to the full pool when nothing valid remains", () => {
    expect(resolveSymbolPool("abc")).not.toBe("");
  });
});

describe("generatePassword — impossible configurations are rejected, never silently wrong", () => {
  it("rejects when no character type is selected", () => {
    expect(() => generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow(GeneratorValidationError);
  });

  it("rejects impossible minimum-character constraints", () => {
    expect(() => generatePassword({ length: 8, minNumbers: 5, minSymbols: 5 })).toThrow(GeneratorValidationError);
  });

  it("rejects a length below the minimum", () => {
    expect(() => generatePassword({ length: PASSWORD_MIN_LENGTH - 1 })).toThrow(GeneratorValidationError);
  });

  it("rejects a length above the maximum", () => {
    expect(() => generatePassword({ length: PASSWORD_MAX_LENGTH + 1 })).toThrow(GeneratorValidationError);
  });
});

describe("validatePasswordOptions — pure pre-check the UI can call before generating", () => {
  it("flags an impossible combination without throwing", () => {
    const result = validatePasswordOptions({ ...DEFAULT_PASSWORD_OPTIONS, length: 8, minNumbers: 5, minSymbols: 5 });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("min_exceeds_length");
    expect(result.minViableLength).toBeGreaterThan(8);
  });

  it("approves a valid combination", () => {
    const result = validatePasswordOptions(DEFAULT_PASSWORD_OPTIONS);
    expect(result.valid).toBe(true);
  });

  it("agrees with generatePassword: whatever it approves, generatePassword can produce", () => {
    const configs: Partial<typeof DEFAULT_PASSWORD_OPTIONS>[] = [
      { length: 8, uppercase: true, lowercase: true, numbers: true, symbols: true },
      { length: 10, minNumbers: 3, minSymbols: 3 },
      { length: 64, uppercase: false, lowercase: true, numbers: false, symbols: false },
    ];
    for (const patch of configs) {
      const options = { ...DEFAULT_PASSWORD_OPTIONS, ...patch };
      const result = validatePasswordOptions(options);
      if (result.valid) {
        expect(() => generatePassword(options)).not.toThrow();
      } else {
        expect(() => generatePassword(options)).toThrow(GeneratorValidationError);
      }
    }
  });
});

describe("generatePassword — randomness sanity checks (TEST 11)", () => {
  // These are sanity checks that the implementation isn't accidentally
  // deterministic or repeating — NOT a cryptographic proof of randomness.
  it("produces effectively no duplicates across 10,000 generations at length 20", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i += 1) {
      seen.add(generatePassword({ length: 20 }));
    }
    // Collisions in a 20-char password from a large pool should be
    // astronomically unlikely; any duplicate at all would indicate a bug.
    expect(seen.size).toBe(10_000);
  });

  it("does not always place categories in the same order (no fixed template)", () => {
    const firstCharIsUppercaseCount = Array.from({ length: 300 }, () =>
      generatePassword({ length: 12, uppercase: true, lowercase: true, numbers: true, symbols: true }),
    ).filter((password) => /[A-Z]/.test(password[0] ?? "")).length;
    // If uppercase were always placed first, this would be ~300. It should
    // instead land roughly near a plausible shuffled distribution.
    expect(firstCharIsUppercaseCount).toBeLessThan(280);
    expect(firstCharIsUppercaseCount).toBeGreaterThan(0);
  });
});

describe("estimatePasswordEntropyBits (TEST 12)", () => {
  it("changes when length changes", () => {
    const short = estimatePasswordEntropyBits({ length: 10 });
    const long = estimatePasswordEntropyBits({ length: 20 });
    expect(long).toBeGreaterThan(short);
  });

  it("changes when a character category is toggled off", () => {
    const all = estimatePasswordEntropyBits({ uppercase: true, lowercase: true, numbers: true, symbols: true });
    const fewer = estimatePasswordEntropyBits({ uppercase: true, lowercase: true, numbers: true, symbols: false });
    expect(all).toBeGreaterThan(fewer);
  });

  it("changes when ambiguous characters are excluded", () => {
    const included = estimatePasswordEntropyBits({ excludeAmbiguous: false });
    const excluded = estimatePasswordEntropyBits({ excludeAmbiguous: true });
    expect(included).toBeGreaterThan(excluded);
  });

  it("changes when the custom symbol set narrows the pool", () => {
    const fullSymbols = estimatePasswordEntropyBits({ uppercase: false, lowercase: false, numbers: false, symbols: true });
    const narrowSymbols = estimatePasswordEntropyBits({
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: true,
      customSymbols: "!?",
    });
    expect(fullSymbols).toBeGreaterThan(narrowSymbols);
  });

  it("is never negative or NaN for any valid configuration", () => {
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length: PASSWORD_MIN_LENGTH };
    const value = estimatePasswordEntropyBits(options);
    expect(Number.isNaN(value)).toBe(false);
    expect(value).toBeGreaterThanOrEqual(0);
  });
});

describe("describePassword (TEST 16 support: real character analysis)", () => {
  it("reports exact character counts, not just presence booleans", () => {
    const characteristics = describePassword("Ab1!Ab1!");
    expect(characteristics.counts).toEqual({ uppercase: 2, lowercase: 2, numbers: 2, symbols: 2 });
    expect(characteristics.length).toBe(8);
  });

  it("count totals always add up to the password length", () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword({ length: 24 });
      const { counts, length } = describePassword(password);
      expect(counts.uppercase + counts.lowercase + counts.numbers + counts.symbols).toBe(length);
    }
  });
});

describe("no Math.random anywhere in the generator implementation (source review)", () => {
  it("the password and random source modules never call Math.random() outside of comments", async () => {
    const fs = await import("node:fs/promises");
    const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const passwordSource = stripComments(await fs.readFile(new URL("../../lib/generators/password.ts", import.meta.url), "utf8"));
    const randomSource = stripComments(await fs.readFile(new URL("../../lib/generators/random.ts", import.meta.url), "utf8"));
    expect(passwordSource).not.toMatch(/Math\.random\(/);
    expect(randomSource).not.toMatch(/Math\.random\(/);
  });
});
