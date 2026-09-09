/**
 * Central entropy and crack-time math for the password generator.
 *
 * Every number this module returns is calculated from the actual character
 * pool and length passed in — nothing here is a hardcoded or invented value.
 * See the docstring on each function for exactly what it does and does not
 * guarantee, since entropy is a model of the generator's random-selection
 * process, not a guarantee of real-world security.
 */

export interface EntropyInput {
  /** Number of distinct characters the generator could have chosen from. */
  poolSize: number;
  /** Number of characters in the generated value. */
  length: number;
}

/**
 * Maximum-entropy estimate: bits = length * log2(poolSize).
 *
 * This is exact if and only if every position was chosen uniformly and
 * independently from the full pool. It is an upper bound (not the exact
 * entropy) when the generator also guarantees specific categories appear
 * — see `calculateGuaranteedEntropy` for that case.
 */
export function calculateMaxEntropyBits({ poolSize, length }: EntropyInput): number {
  if (poolSize <= 1 || length <= 0) return 0;
  return length * Math.log2(poolSize);
}

/**
 * The generator forces at least one character from each selected category
 * (see generatePassword), then fills remaining positions uniformly and
 * shuffles. Computing the *exact* entropy of that process — accounting for
 * the uniform shuffle over a multiset that can contain duplicate characters
 * — has no simple closed form. Rather than ship an approximate "exact"
 * formula that could overstate or understate the true value, this module
 * intentionally reports only the maximum-entropy upper bound above and
 * requires callers/UI to label it as such (see the `entropyLabel` /
 * `entropyAssumption` translation keys). In practice the gap between the
 * upper bound and the true value is negligible for any password long enough
 * to need multiple categories, since the excluded "missing a category"
 * outcomes are an extremely small fraction of the keyspace.
 */

export interface CrackTimeEstimate {
  /** Order-of-magnitude seconds to exhaust the keyspace at the assumed guess rate. */
  seconds: number;
  /** Human-readable duration, e.g. "3.2 thousand years" or "less than a second". */
  label: string;
  /** The guesses-per-second assumption used, so the UI can display it. */
  guessesPerSecond: number;
}

const TIME_UNITS: { unit: string; seconds: number }[] = [
  { unit: "centuries", seconds: 100 * 365.25 * 24 * 3600 },
  { unit: "years", seconds: 365.25 * 24 * 3600 },
  { unit: "days", seconds: 24 * 3600 },
  { unit: "hours", seconds: 3600 },
  { unit: "minutes", seconds: 60 },
  { unit: "seconds", seconds: 1 },
];

/**
 * Estimated offline brute-force time from entropy bits alone, using
 * logarithms throughout so it never overflows to Infinity for large
 * keyspaces. This is a labeled estimate under a stated assumption about
 * attacker speed — not a guarantee, and the UI must show the assumption
 * alongside the number (see `crackTimeAssumption` translation key).
 */
export function estimateCrackTime(entropyBits: number, guessesPerSecond = 1_000_000_000_000): CrackTimeEstimate {
  if (entropyBits <= 0) return { seconds: 0, label: "instant", guessesPerSecond };

  // Average case: attacker expects to find it after searching half the
  // keyspace. log2(0.5 * 2^entropyBits / guessesPerSecond).
  const log2Seconds = entropyBits - 1 - Math.log2(guessesPerSecond);
  const log10Seconds = log2Seconds * Math.log10(2);

  if (log10Seconds > 15) {
    // Far beyond any meaningful horizon; express as an order of magnitude
    // rather than a fabricated precise year count.
    return { seconds: Infinity, label: `more than 10^${Math.floor(log10Seconds - 8)} centuries`, guessesPerSecond };
  }

  const seconds = Math.pow(10, log10Seconds);
  if (seconds < 1) return { seconds, label: "less than a second", guessesPerSecond };

  for (const { unit, seconds: unitSeconds } of TIME_UNITS) {
    if (seconds >= unitSeconds) {
      const value = seconds / unitSeconds;
      const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
      return { seconds, label: `${rounded.toLocaleString()} ${unit}`, guessesPerSecond };
    }
  }
  return { seconds, label: "less than a second", guessesPerSecond };
}
