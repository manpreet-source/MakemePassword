import { describe, expect, it } from "vitest";
import { generatePassword, describePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/generators/password";
import { GeneratorValidationError } from "@/lib/generators/random";

describe("generatePassword", () => {
  it("generates a password of the requested length", () => {
    const password = generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true });
    expect(password).toHaveLength(20);
  });

  it("only uses the selected character types", () => {
    const password = generatePassword({ length: 24, uppercase: false, lowercase: true, numbers: true, symbols: false });
    expect(/^[a-z0-9]+$/.test(password)).toBe(true);
  });

  it("excludes ambiguous characters when requested", () => {
    for (let i = 0; i < 20; i += 1) {
      const password = generatePassword({ length: 30, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: true });
      expect(password).not.toMatch(/[Il1O0o]/);
    }
  });

  it("rejects a length below the minimum", () => {
    expect(() => generatePassword({ length: PASSWORD_MIN_LENGTH - 1 })).toThrow(GeneratorValidationError);
  });

  it("rejects a length above the maximum", () => {
    expect(() => generatePassword({ length: PASSWORD_MAX_LENGTH + 1 })).toThrow(GeneratorValidationError);
  });

  it("rejects when no character type is selected", () => {
    expect(() => generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow(GeneratorValidationError);
  });

  it("rejects impossible minimum-character constraints", () => {
    expect(() => generatePassword({ length: 8, minNumbers: 5, minSymbols: 5 })).toThrow(GeneratorValidationError);
  });
});

describe("describePassword", () => {
  it("reports character composition accurately", () => {
    const characteristics = describePassword("Abc123!@");
    expect(characteristics.hasUppercase).toBe(true);
    expect(characteristics.hasLowercase).toBe(true);
    expect(characteristics.hasNumbers).toBe(true);
    expect(characteristics.hasSymbols).toBe(true);
    expect(characteristics.length).toBe(8);
  });
});
