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
