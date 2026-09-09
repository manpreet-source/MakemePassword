import { secureRandomInt, securePick } from "./random";

export const USERNAME_MIN_LENGTH = 6;
export const USERNAME_MAX_LENGTH = 24;
export const USERNAME_DEFAULT_LENGTH = 14;

export type UsernameStyle =
  | "memorable"
  | "gaming"
  | "professional"
  | "anonymous"
  | "minimal"
  | "random";

export const USERNAME_STYLE_LABELS: Record<UsernameStyle, string> = {
  memorable: "Memorable",
  gaming: "Gaming",
  professional: "Professional",
  anonymous: "Anonymous",
  minimal: "Minimal",
  random: "Random",
};

export const USERNAME_STYLE_ORDER: UsernameStyle[] = [
  "memorable",
  "gaming",
  "professional",
  "anonymous",
  "minimal",
  "random",
];

const ADJECTIVES = ["Silent", "Bright", "Velvet", "Brisk", "Cosmic", "Golden", "Quiet", "Wandering", "Clever", "Hidden", "Neon", "Mellow"];
const NOUNS = ["Orbit", "Pixel", "Comet", "Vector", "Harbor", "Falcon", "Meadow", "Circuit", "Nexus", "Summit", "Echo", "Current"];
const GAMING_NOUNS = ["Rift", "Viper", "Quest", "Reaper", "Drift", "Wolf", "Striker", "Phantom"];
const PROFESSIONAL_ADJECTIVES = ["Nova", "Apex", "Clear", "North", "Prime", "Vertex"];
const ANONYMOUS_ADJECTIVES = ["Quiet", "Hidden", "Unknown", "Blank", "Private"];

const RANDOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789_";
const MINIMAL_CHARS = "abcdefghjkmnpqrstuvwxyz23456789_";

export interface UsernameOptions {
  style: UsernameStyle;
  length: number;
}

export const DEFAULT_USERNAME_OPTIONS: UsernameOptions = {
  style: "memorable",
  length: USERNAME_DEFAULT_LENGTH,
};

export function generateUsername(rawOptions: Partial<UsernameOptions> = {}): string {
  const options: UsernameOptions = { ...DEFAULT_USERNAME_OPTIONS, ...rawOptions };
  const length = Math.min(USERNAME_MAX_LENGTH, Math.max(USERNAME_MIN_LENGTH, options.length));

  let result: string;
  if (options.style === "random" || options.style === "minimal") {
    const chars = options.style === "minimal" ? MINIMAL_CHARS : RANDOM_CHARS;
    result = Array.from({ length }, () => chars[secureRandomInt(chars.length)]).join("");
  } else {
    const noun = options.style === "gaming" ? securePick(GAMING_NOUNS) : securePick(NOUNS);
    const adjective =
      options.style === "professional"
        ? securePick(PROFESSIONAL_ADJECTIVES)
        : options.style === "anonymous"
          ? securePick(ANONYMOUS_ADJECTIVES)
          : securePick(ADJECTIVES);
    result = `${adjective}${noun}${secureRandomInt(900) + 100}`;
  }

  return result.slice(0, length);
}

/**
 * Strips a user-typed name/word down to safe username characters (letters
 * and digits only — no spaces, punctuation, or emoji), so every downstream
 * variant is guaranteed usable on virtually any platform's username rules.
 */
function sanitizePersonalizeBase(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (é -> e) rather than dropping the letter
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function capitalize(value: string): string {
  return value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Builds one randomized variant of the sanitized base using a random pattern. */
function buildPersonalizedVariant(base: string): string {
  switch (secureRandomInt(5)) {
    case 0: // name + number, e.g. "alexmorgan482"
      return `${base}${secureRandomInt(9000) + 100}`;
    case 1: { // Capitalized name + themed word + short number, e.g. "AlexmorganOrbit42"
      const word = securePick(NOUNS);
      return `${capitalize(base)}${word}${secureRandomInt(90) + 10}`;
    }
    case 2: { // name + separator + short random tag, e.g. "alexmorgan_k7q"
      const separator = securePick(["_", "."]);
      const tag = Array.from({ length: 3 }, () => MINIMAL_CHARS[secureRandomInt(MINIMAL_CHARS.length)]).join("");
      return `${base}${separator}${tag}`;
    }
    case 3: { // themed adjective + Capitalized name, e.g. "CosmicAlexmorgan"
      return `${securePick(ADJECTIVES)}${capitalize(base)}`;
    }
    default: { // name + number + single trailing letter, e.g. "alexmorgan73x"
      return `${base}${secureRandomInt(90) + 10}${securePick(["x", "z", "q", "v"])}`;
    }
  }
}

/**
 * Generates real, randomized username variants built from a name or word the
 * user typed. This never calls an external AI service — it's the same
 * client-side, crypto-secure generator used everywhere else in the app,
 * just seeded with the user's own text instead of a themed word bank.
 *
 * Returns an empty array if the input has no usable letters/digits at all
 * (e.g. only emoji or punctuation) so the caller can show a clear message
 * instead of silently returning nothing.
 */
export function generatePersonalizedUsernames(rawBase: string, count = 5): string[] {
  const base = sanitizePersonalizeBase(rawBase).slice(0, USERNAME_MAX_LENGTH - 2);
  if (!base) return [];

  const seen = new Set<string>();
  const maxAttempts = count * 10;
  let attempts = 0;
  while (seen.size < count && attempts < maxAttempts) {
    attempts += 1;
    const variant = buildPersonalizedVariant(base).slice(0, USERNAME_MAX_LENGTH);
    if (variant.length < USERNAME_MIN_LENGTH) continue;
    seen.add(variant);
  }
  return [...seen];
}
