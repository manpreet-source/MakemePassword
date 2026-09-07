export class GeneratorValidationError extends Error {}

function getCrypto(): Crypto {
  const source = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;
  if (!source || typeof source.getRandomValues !== "function") {
    throw new Error("A cryptographically secure random source (Web Crypto) is required.");
  }
  return source;
}

/**
 * Uniform random integer in [0, maxExclusive) via rejection sampling, so the
 * result is not biased toward the low end the way a plain `% maxExclusive`
 * would be. Never use Math.random() for anything credential-related.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("maxExclusive must be a positive integer");
  }
  const crypto = getCrypto();
  const range = 0x100000000; // 2^32
  const limit = range - (range % maxExclusive);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);
  return value % maxExclusive;
}

export function securePick<T>(list: readonly T[]): T {
  if (list.length === 0) throw new RangeError("Cannot pick from an empty list");
  const item = list[secureRandomInt(list.length)];
  if (item === undefined) throw new RangeError("Pick index out of range");
  return item;
}

/** Fisher-Yates shuffle using a cryptographically secure random source. */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

export function hasSequentialRun(value: string, runLength = 3): boolean {
  for (let i = 0; i <= value.length - runLength; i += 1) {
    let ascending = true;
    let descending = true;
    for (let j = 1; j < runLength; j += 1) {
      const prev = value.charCodeAt(i + j - 1);
      const curr = value.charCodeAt(i + j);
      if (curr - prev !== 1) ascending = false;
      if (curr - prev !== -1) descending = false;
    }
    if (ascending || descending) return true;
  }
  return false;
}

export function hasRepeatedRun(value: string, runLength = 3): boolean {
  for (let i = 0; i <= value.length - runLength; i += 1) {
    let repeated = true;
    for (let j = 1; j < runLength; j += 1) {
      if (value[i + j] !== value[i]) {
        repeated = false;
        break;
      }
    }
    if (repeated) return true;
  }
  return false;
}
