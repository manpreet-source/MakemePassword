import type { PasswordOptions } from "./password";
import { secureRandomInt } from "./random";

export type PasswordPresetKey =
  | "easy"
  | "strong"
  | "veryStrong"
  | "maximum"
  | "wifi"
  | "developer"
  | "random";

export const PASSWORD_PRESET_LABELS: Record<PasswordPresetKey, string> = {
  easy: "Easy",
  strong: "Strong",
  veryStrong: "Very Strong",
  maximum: "Maximum Strength",
  wifi: "Wi-Fi",
  developer: "Developer",
  random: "Random",
};

export const PASSWORD_PRESET_ORDER: PasswordPresetKey[] = [
  "easy",
  "strong",
  "veryStrong",
  "maximum",
  "wifi",
  "developer",
  "random",
];

function randomBoolean(): boolean {
  return secureRandomInt(2) === 1;
}

function randomPasswordPreset(): Partial<PasswordOptions> {
  let uppercase = randomBoolean();
  let lowercase = randomBoolean();
  let numbers = randomBoolean();
  let symbols = randomBoolean();
  if (!uppercase && !lowercase && !numbers && !symbols) {
    lowercase = true;
    numbers = true;
  }
  return {
    length: 12 + secureRandomInt(21), // 12-32
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeAmbiguous: randomBoolean(),
    avoidRepeated: randomBoolean(),
    avoidSequential: randomBoolean(),
  };
}

export function getPasswordPresetOptions(preset: PasswordPresetKey): Partial<PasswordOptions> {
  switch (preset) {
    case "easy":
      return {
        length: 10,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeAmbiguous: true,
        pronounceable: true,
      };
    case "strong":
      return {
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: true,
      };
    case "veryStrong":
      return {
        length: 20,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false,
        avoidSequential: true,
        avoidRepeated: true,
      };
    case "maximum":
      return {
        length: 32,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false,
        avoidSequential: true,
        avoidRepeated: true,
        minNumbers: 4,
        minSymbols: 4,
      };
    case "wifi":
      return {
        length: 20,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeAmbiguous: true,
      };
    case "developer":
      return {
        length: 24,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false,
        minNumbers: 2,
        minSymbols: 2,
      };
    case "random":
      return randomPasswordPreset();
    default:
      return {};
  }
}
