import {
  GeneratorValidationError,
  hasRepeatedRun,
  hasSequentialRun,
  securePick,
  secureShuffle,
} from "./random";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_DEFAULT_LENGTH = 16;

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";
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
};

function withoutAmbiguous(chars: string): string {
  return [...chars].filter((char) => !AMBIGUOUS.has(char)).join("");
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
 * for user-facing input problems (never crashes with a stack trace).
 */
export function generatePassword(rawOptions: Partial<PasswordOptions> = {}): string {
  const options: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...rawOptions };

  if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
    throw new GeneratorValidationError("Select at least one character type.");
  }
  if (options.length < PASSWORD_MIN_LENGTH) {
    throw new GeneratorValidationError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (options.length > PASSWORD_MAX_LENGTH) {
    throw new GeneratorValidationError(`Use at most ${PASSWORD_MAX_LENGTH} characters.`);
  }

  const maybeStrip = (chars: string) => (options.excludeAmbiguous ? withoutAmbiguous(chars) : chars);
  const pools = {
    uppercase: options.uppercase ? maybeStrip(UPPERCASE) : "",
    lowercase: options.lowercase ? maybeStrip(LOWERCASE) : "",
    numbers: options.numbers ? maybeStrip(NUMBERS) : "",
    symbols: options.symbols ? maybeStrip(SYMBOLS) : "",
  };
  const fullPool = pools.uppercase + pools.lowercase + pools.numbers + pools.symbols;
  if (fullPool.length === 0) {
    throw new GeneratorValidationError("Select at least one character type.");
  }

  const minNumbers = options.numbers ? Math.max(options.minNumbers, 0) : 0;
  const minSymbols = options.symbols ? Math.max(options.minSymbols, 0) : 0;
  if (minNumbers + minSymbols > options.length) {
    throw new GeneratorValidationError("Minimum numbers and symbols exceed the requested length.");
  }

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

export interface PasswordCharacteristics {
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  hasSequentialRun: boolean;
  hasRepeatedRun: boolean;
}

export function describePassword(value: string): PasswordCharacteristics {
  return {
    length: value.length,
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumbers: /[0-9]/.test(value),
    hasSymbols: /[^A-Za-z0-9]/.test(value),
    hasSequentialRun: hasSequentialRun(value, 3),
    hasRepeatedRun: hasRepeatedRun(value, 3),
  };
}
