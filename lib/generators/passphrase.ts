import { GeneratorValidationError, secureRandomInt } from "./random";

export const PASSPHRASE_MIN_WORDS = 3;
export const PASSPHRASE_MAX_WORDS = 10;
export const PASSPHRASE_DEFAULT_WORDS = 5;

export const PASSPHRASE_SEPARATORS = ["-", "_", ".", " "] as const;
export type PassphraseSeparator = (typeof PASSPHRASE_SEPARATORS)[number];

export const PASSPHRASE_SEPARATOR_LABELS: Record<PassphraseSeparator, string> = {
  "-": "Hyphen (-)",
  _: "Underscore (_)",
  ".": "Dot (.)",
  " ": "Space",
};

/**
 * A curated, unambiguous English wordlist. Not a full diceware list (7776
 * words); entropy is estimated from this list's actual size rather than
 * assumed, and shown to the user alongside every passphrase.
 */
export const PASSPHRASE_WORDLIST: readonly string[] = [
  "river", "mountain", "forest", "ocean", "desert", "valley", "meadow", "canyon", "glacier", "volcano",
  "island", "cave", "cliff", "coast", "delta", "dune", "fjord", "geyser", "harbor", "hill",
  "jungle", "lagoon", "lake", "marsh", "oasis", "peak", "plain", "plateau", "pond", "prairie",
  "reef", "ridge", "shore", "slope", "spring", "stream", "summit", "swamp", "tundra", "wetland",
  "breeze", "cloud", "dawn", "dusk", "fog", "frost", "hail", "mist", "moon", "rain",
  "rainbow", "shadow", "sky", "snow", "star", "storm", "sun", "thunder", "tide", "wind",
  "badger", "beaver", "bison", "camel", "cheetah", "cobra", "condor", "coyote", "crane", "dolphin",
  "eagle", "falcon", "ferret", "fox", "gazelle", "giraffe", "heron", "hyena", "ibis", "jackal",
  "jaguar", "koala", "lemur", "leopard", "lion", "lynx", "mantis", "marlin", "mongoose", "moose",
  "newt", "ocelot", "orca", "osprey", "otter", "owl", "panda", "panther", "parrot", "pelican",
  "penguin", "phoenix", "puma", "python", "rabbit", "raccoon", "raven", "salmon", "seal", "shark",
  "sparrow", "stag", "stork", "swan", "tiger", "toucan", "turtle", "viper", "vulture", "walrus",
  "wolf", "wombat", "zebra", "anchor", "arrow", "banner", "barrel", "basket", "beacon", "bell",
  "blade", "bolt", "bridge", "brush", "candle", "chain", "chalk", "chisel", "clock", "compass",
  "crown", "dagger", "drum", "engine", "feather", "flag", "flask", "frame", "gear", "glass",
  "hammer", "harp", "helmet", "hinge", "hook", "horn", "hourglass", "key", "kite", "ladder",
  "lamp", "lantern", "lens", "lever", "lock", "mirror", "needle", "nozzle", "oar", "paddle",
  "pendant", "pillar", "pipe", "prism", "pulley", "quiver", "ribbon", "rocket", "saddle", "sail",
  "scale", "shield", "spear", "spindle", "spoke", "staff", "stamp", "telescope", "thread", "torch",
  "tower", "trumpet", "umbrella", "valve", "vase", "wagon", "wheel", "whistle", "wrench", "amber",
  "azure", "bronze", "coral", "crimson", "cobalt", "copper", "crystal", "ebony", "emerald", "granite",
  "ivory", "jade", "jasper", "lavender", "magenta", "marble", "maroon", "obsidian", "onyx", "opal",
  "pearl", "platinum", "quartz", "ruby", "sable", "sapphire", "scarlet", "silver", "slate", "tan",
  "teal", "topaz", "turquoise", "almond", "apple", "apricot", "barley", "basil", "berry", "birch",
  "blossom", "bramble", "cactus", "cedar", "cherry", "chestnut", "cinnamon", "clover", "coconut", "cotton",
  "cranberry", "cypress", "daisy", "fern", "fig", "ginger", "grape", "hazel", "holly", "honey",
  "jasmine", "kelp", "lemon", "lentil", "lily", "lotus", "maple", "mint", "moss", "mulberry",
  "mustard", "nectar", "oak", "orchard", "palm", "papaya", "peach", "pear", "pecan", "pepper",
  "pine", "plum", "poppy", "quince", "reed", "rosemary", "saffron", "sage", "sesame", "sorrel",
  "spruce", "thistle", "thyme", "tulip", "wheat", "willow", "balance", "bravery", "calm", "candor",
  "clarity", "comfort", "courage", "credit", "curious", "dignity", "effort", "energy", "focus", "freedom",
  "gentle", "glory", "grace", "harmony", "honest", "hope", "humble", "insight", "instinct", "justice",
  "kindred", "liberty", "logic", "loyal", "marvel", "mercy", "mirth", "modest", "motion", "mystic",
  "notion", "patient", "peace", "pledge", "purpose", "quiet", "reason", "rebel", "resolve", "reward",
  "rhythm", "sanity", "secure", "spirit", "steady", "stellar", "zephyr", "tender", "thrive", "tribute",
  "triumph", "trust", "unity", "valor", "velvet", "vision", "vivid", "wander", "wisdom", "wonder",
  "zenith", "cabin", "castle", "chapel", "cottage", "garden", "marina", "haven", "lighthouse", "lodge",
  "manor", "orchid", "vineyard", "palace", "pavilion", "plaza", "porch", "shelter", "temple", "terrace",
  "vessel", "village", "atlas", "cairn", "canvas", "chapter", "circuit", "cluster", "comet", "current",
  "dial", "drift", "echo", "forge", "fossil", "fusion", "galaxy", "gravity", "horizon", "lattice",
  "magnet", "meteor", "module", "mosaic", "nebula", "orbit", "particle", "pixel", "pulse", "flint",
  "radar", "radius", "sensor", "signal", "solar", "sonic", "spark", "spectrum", "vector",
];

const PASSPHRASE_NUMBER_MAX = 100; // two-digit suffix, 0-99

export interface PassphraseOptions {
  words: number;
  separator: PassphraseSeparator;
  capitalize: boolean;
  includeNumber: boolean;
}

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  words: PASSPHRASE_DEFAULT_WORDS,
  separator: "-",
  capitalize: true,
  includeNumber: true,
};

function clampWordCount(words: number): number {
  return Math.min(PASSPHRASE_MAX_WORDS, Math.max(PASSPHRASE_MIN_WORDS, Math.round(words)));
}

function capitalize(word: string): string {
  return word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1);
}

/**
 * Generates a passphrase from the given options. Words are drawn without
 * replacement so a single phrase never repeats a word.
 */
export function generatePassphrase(rawOptions: Partial<PassphraseOptions> = {}): string {
  const options: PassphraseOptions = { ...DEFAULT_PASSPHRASE_OPTIONS, ...rawOptions };
  const wordCount = clampWordCount(options.words);
  if (wordCount > PASSPHRASE_WORDLIST.length) {
    throw new GeneratorValidationError("Requested more words than the wordlist supports.");
  }

  const pool = [...PASSPHRASE_WORDLIST];
  const picked: string[] = [];
  for (let i = 0; i < wordCount; i += 1) {
    const index = secureRandomInt(pool.length);
    picked.push(pool[index]!);
    pool.splice(index, 1);
  }

  const parts = options.capitalize ? picked.map(capitalize) : picked;
  if (options.includeNumber) parts.push(String(secureRandomInt(PASSPHRASE_NUMBER_MAX)));

  return parts.join(options.separator);
}

/**
 * Estimated entropy in bits, based on this wordlist's actual size. This is
 * an estimate of the random-choice space, not a guarantee of real-world
 * crack resistance.
 */
export function estimatePassphraseEntropyBits(rawOptions: Partial<PassphraseOptions> = {}): number {
  const options: PassphraseOptions = { ...DEFAULT_PASSPHRASE_OPTIONS, ...rawOptions };
  const wordCount = clampWordCount(options.words);
  const wordEntropy = wordCount * Math.log2(PASSPHRASE_WORDLIST.length);
  const numberEntropy = options.includeNumber ? Math.log2(PASSPHRASE_NUMBER_MAX) : 0;
  return Math.round(wordEntropy + numberEntropy);
}
