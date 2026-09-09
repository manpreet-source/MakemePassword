import {
  GeneratorValidationError,
  hasRepeatedRun,
  hasSequentialRun,
  securePick,
  secureShuffle,
} from "./random";
import { calculateMaxEntropyBits } from "./entropy";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_DEFAULT_LENGTH = 16;

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";
/** The only symbols the generator will ever use; a custom set is filtered against this. */
const ALLOWED_SYMBOLS = new Set([...SYMBOLS]);
const AMBIGUOUS = new Set(["I", "l", "1", "O", "0", "o"]);

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  avoidRepeated: boolean;
  avoidSequential: boolean;
  minNumbers: number;
  minSymbols: number;
  pronounceable: boolean;
  /**
   * Optional restricted symbol set. Only characters that are also in the
   * built-in SYMBOLS pool are honored — this narrows the pool, it never
   * introduces characters outside the documented, safe symbol set.
   */
  customSymbols: string;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: PASSWORD_DEFAULT_LENGTH,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  avoidRepeated: false,
  avoidSequential: false,
  minNumbers: 0,
  minSymbols: 0,
  pronounceable: false,
  customSymbols: "",
};

function withoutAmbiguous(chars: string): string {
  return [...chars].filter((char) => !AMBIGUOUS.has(char)).join("");
}

/** The full, safe symbol pool the UI can show as "allowed symbols" reference text. */
export const DEFAULT_SYMBOL_POOL = SYMBOLS;

/**
 * Resolves the actual symbol pool for a given option set: the custom set
 * intersected with the allowed symbols (deduped, order-preserved from the
 * canonical SYMBOLS string), or the full pool when no custom set is given.
 */
export function resolveSymbolPool(customSymbols: string): string {
  const trimmed = customSymbols.trim();
  if (!trimmed) return SYMBOLS;
  const requested = new Set([...trimmed].filter((char) => ALLOWED_SYMBOLS.has(char)));
  if (requested.size === 0) return SYMBOLS;
  return [...SYMBOLS].filter((char) => requested.has(char)).join("");
}

export interface PasswordPools {
  uppercase: string;
  lowercase: string;
  numbers: string;
  symbols: string;
}

/** Builds the actual character pools for a given option set. Never guesses or hides characters. */
export function buildPasswordPools(options: PasswordOptions): PasswordPools {
  const maybeStrip = (chars: string) => (options.excludeAmbiguous ? withoutAmbiguous(chars) : chars);
  return {
    uppercase: options.uppercase ? maybeStrip(UPPERCASE) : "",
    lowercase: options.lowercase ? maybeStrip(LOWERCASE) : "",
    numbers: options.numbers ? maybeStrip(NUMBERS) : "",
    symbols: options.symbols ? maybeStrip(resolveSymbolPool(options.customSymbols)) : "",
  };
}

export interface PasswordValidation {
  valid: boolean;
  /** Machine-readable reason so the UI can show a translated message. */
  reason?: "no_category" | "too_short" | "too_long" | "empty_pool" | "min_exceeds_length";
  /** The minimum length this exact configuration would need to succeed, if computable. */
  minViableLength?: number;
}

/**
 * Pure validation, safe to call on every keystroke before generating anything.
 * The UI uses this to disable Generate and explain *why*, instead of letting
 * an impossible configuration throw mid-generation.
 */
export function validatePasswordOptions(options: PasswordOptions): PasswordValidation {
  if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
    return { valid: false, reason: "no_category" };
  }
  if (options.length > PASSWORD_MAX_LENGTH) return { valid: false, reason: "too_long" };

  const pools = buildPasswordPools(options);
  const fullPool = pools.uppercase + pools.lowercase + pools.numbers + pools.symbols;
  if (fullPool.length === 0) return { valid: false, reason: "empty_pool" };

  const minNumbers = options.numbers ? Math.max(options.minNumbers, 0) : 0;
  const minSymbols = options.symbols ? Math.max(options.minSymbols, 0) : 0;
  const requiredSlots =
    (options.uppercase ? 1 : 0) + (options.lowercase ? 1 : 0) + Math.max(options.numbers ? 1 : 0, minNumbers) + Math.max(options.symbols ? 1 : 0, minSymbols);

  if (requiredSlots > options.length) {
    return { valid: false, reason: "min_exceeds_length", minViableLength: requiredSlots };
  }
  if (options.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, reason: "too_short", minViableLength: Math.max(PASSWORD_MIN_LENGTH, requiredSlots) };
  }
  return { valid: true };
}
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const VOWELS = "aeiou";

function generatePronounceableStem(length: number, excludeAmbiguous: boolean): string {
  const consonants = excludeAmbiguous ? withoutAmbiguous(CONSONANTS) : CONSONANTS;
  const vowels = excludeAmbiguous ? withoutAmbiguous(VOWELS) : VOWELS;
  const letters: string[] = [];
  let useConsonant = true;
  while (letters.length < length) {
    letters.push(securePick([...(useConsonant ? consonants : vowels)]));
    useConsonant = !useConsonant;
  }
  return letters.join("");
}

function capitalizeRandomLetters(value: string, count: number): string {
  const letterIndexes = [...value]
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => /[a-z]/.test(char))
    .map(({ index }) => index);
  const chars = [...value];
  const shuffled = secureShuffle(letterIndexes).slice(0, count);
  for (const index of shuffled) {
    const char = chars[index];
    if (char) chars[index] = char.toUpperCase();
  }
  return chars.join("");
}

/**
 * Generates a password from the given options. Throws GeneratorValidationError
 * for user-facing input problems (never crashes with a stack trace) — callers
 * that already ran `validatePasswordOptions` in the UI should never hit this,
 * but it stays defensive for any direct/programmatic caller.
 */
export function generatePassword(rawOptions: Partial<PasswordOptions> = {}): string {
  const options: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...rawOptions };
  const validation = validatePasswordOptions(options);
  if (!validation.valid) {
    const messages: Record<NonNullable<PasswordValidation["reason"]>, string> = {
      no_category: "Select at least one character type.",
      empty_pool: "Select at least one character type.",
      too_long: `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
      too_short: `Use at least ${validation.minViableLength ?? PASSWORD_MIN_LENGTH} characters.`,
      min_exceeds_length: `Length must be at least ${validation.minViableLength} for the selected character types and minimums.`,
    };
    throw new GeneratorValidationError(messages[validation.reason ?? "no_category"]);
  }

  const pools = buildPasswordPools(options);
  const fullPool = pools.uppercase + pools.lowercase + pools.numbers + pools.symbols;
  const minNumbers = options.numbers ? Math.max(options.minNumbers, 0) : 0;
  const minSymbols = options.symbols ? Math.max(options.minSymbols, 0) : 0;

  const attempt = (): string => {
    const required: string[] = [];
    if (options.uppercase) required.push(securePick([...pools.uppercase]));
    if (options.lowercase) required.push(securePick([...pools.lowercase]));
    if (options.numbers) {
      required.push(...Array.from({ length: Math.max(1, minNumbers) }, () => securePick([...pools.numbers])));
    }
    if (options.symbols) {
      required.push(...Array.from({ length: Math.max(1, minSymbols) }, () => securePick([...pools.symbols])));
    }

    let body: string;
    if (options.pronounceable && (options.lowercase || options.uppercase)) {
      const stemLength = Math.max(0, options.length - required.length);
      body = generatePronounceableStem(stemLength, options.excludeAmbiguous);
      if (options.uppercase && !options.lowercase) body = body.toUpperCase();
      else if (options.uppercase && options.lowercase) body = capitalizeRandomLetters(body, Math.max(1, Math.round(stemLength * 0.3)));
    } else {
      const remaining = Math.max(0, options.length - required.length);
      body = Array.from({ length: remaining }, () => securePick([...fullPool])).join("");
    }

    const combined = [...required, ...body].slice(0, options.length);
    while (combined.length < options.length) combined.push(securePick([...fullPool]));
    return secureShuffle(combined).join("");
  };

  const maxAttempts = 50;
  let result = attempt();
  for (let i = 0; i < maxAttempts; i += 1) {
    const violatesRepeated = options.avoidRepeated && hasRepeatedRun(result, 2);
    const violatesSequential = options.avoidSequential && hasSequentialRun(result, 3);
    if (!violatesRepeated && !violatesSequential) break;
    result = attempt();
  }

  return result;
}

export interface PasswordPoolInfo {
  poolSize: number;
  categories: { key: "uppercase" | "lowercase" | "numbers" | "symbols"; poolSize: number; minCount: number }[];
}

/** Exposes the exact pool sizes and per-category minimums driving entropy math — same values the UI displays. */
export function getPasswordPoolInfo(rawOptions: Partial<PasswordOptions> = {}): PasswordPoolInfo {
  const options: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...rawOptions };
  const pools = buildPasswordPools(options);
  const categories: PasswordPoolInfo["categories"] = [
    { key: "uppercase", poolSize: pools.uppercase.length, minCount: options.uppercase ? 1 : 0 },
    { key: "lowercase", poolSize: pools.lowercase.length, minCount: options.lowercase ? 1 : 0 },
    { key: "numbers", poolSize: pools.numbers.length, minCount: options.numbers ? Math.max(1, options.minNumbers) : 0 },
    { key: "symbols", poolSize: pools.symbols.length, minCount: options.symbols ? Math.max(1, options.minSymbols) : 0 },
  ];
  return { poolSize: categories.reduce((sum, c) => sum + c.poolSize, 0), categories };
}

/**
 * Estimated entropy in bits: the maximum-entropy upper bound
 * length * log2(poolSize), computed from the ACTUAL pool this configuration
 * produces (reflecting toggled categories, ambiguous-character exclusion,
 * and any custom symbol set). This is an upper-bound estimate that assumes
 * uniform independent selection — see lib/generators/entropy.ts for why an
 * exact formula isn't used, and always show it in the UI labeled as a
 * maximum estimate, not an exact guarantee.
 */
export function estimatePasswordEntropyBits(rawOptions: Partial<PasswordOptions> = {}): number {
  const options: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...rawOptions };
  const { poolSize } = getPasswordPoolInfo(options);
  return Math.round(calculateMaxEntropyBits({ poolSize, length: options.length }));
}

export interface PasswordCharacteristics {
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  hasSequentialRun: boolean;
  hasRepeatedRun: boolean;
  /** Exact counts of each character category actually present, not just booleans. */
  counts: { uppercase: number; lowercase: number; numbers: number; symbols: number };
}

export function describePassword(value: string): PasswordCharacteristics {
  const counts = { uppercase: 0, lowercase: 0, numbers: 0, symbols: 0 };
  for (const char of value) {
    if (/[A-Z]/.test(char)) counts.uppercase += 1;
    else if (/[a-z]/.test(char)) counts.lowercase += 1;
    else if (/[0-9]/.test(char)) counts.numbers += 1;
    else counts.symbols += 1;
  }
  return {
    length: value.length,
    hasUppercase: counts.uppercase > 0,
    hasLowercase: counts.lowercase > 0,
    hasNumbers: counts.numbers > 0,
    hasSymbols: counts.symbols > 0,
    hasSequentialRun: hasSequentialRun(value, 3),
    hasRepeatedRun: hasRepeatedRun(value, 3),
    counts,
  };
}
