import { describe, expect, it } from "vitest";
import {
  generatePassphrase,
  estimatePassphraseEntropyBits,
  PASSPHRASE_WORDLIST,
  PASSPHRASE_MIN_WORDS,
  PASSPHRASE_MAX_WORDS,
} from "@/lib/generators/passphrase";

describe("generatePassphrase", () => {
  it("uses the requested number of unique words joined by the separator", () => {
    const phrase = generatePassphrase({ words: 5, separator: "-", capitalize: false, includeNumber: false });
    const parts = phrase.split("-");
    expect(parts).toHaveLength(5);
    expect(new Set(parts).size).toBe(5);
    for (const part of parts) {
      expect(PASSPHRASE_WORDLIST).toContain(part);
    }
  });

  it("capitalizes each word when requested", () => {
    const phrase = generatePassphrase({ words: 4, separator: "-", capitalize: true, includeNumber: false });
    for (const part of phrase.split("-")) {
      expect(part[0]).toBe(part[0]?.toUpperCase());
    }
  });

  it("appends a trailing number when requested", () => {
    const phrase = generatePassphrase({ words: 3, separator: "-", capitalize: false, includeNumber: true });
    const parts = phrase.split("-");
    expect(parts).toHaveLength(4);
    expect(/^\d+$/.test(parts[3] ?? "")).toBe(true);
  });

  it("clamps word count to the supported range", () => {
    const tooFew = generatePassphrase({ words: 0, includeNumber: false });
    expect(tooFew.split("-")).toHaveLength(PASSPHRASE_MIN_WORDS);
    const tooMany = generatePassphrase({ words: 1000, includeNumber: false });
    expect(tooMany.split("-")).toHaveLength(PASSPHRASE_MAX_WORDS);
  });
});

describe("estimatePassphraseEntropyBits", () => {
  it("increases with word count", () => {
    const fewer = estimatePassphraseEntropyBits({ words: 3, includeNumber: false });
    const more = estimatePassphraseEntropyBits({ words: 6, includeNumber: false });
    expect(more).toBeGreaterThan(fewer);
  });

  it("accounts for the trailing number", () => {
    const without = estimatePassphraseEntropyBits({ words: 5, includeNumber: false });
    const with_ = estimatePassphraseEntropyBits({ words: 5, includeNumber: true });
    expect(with_).toBeGreaterThan(without);
  });
});
