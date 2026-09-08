"use client";

import { useEffect, useRef, useState } from "react";
import ConsentBanner from "./consent-banner";
import {
  generateUsername,
  USERNAME_STYLE_LABELS,
  USERNAME_STYLE_ORDER,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_DEFAULT_LENGTH,
  type UsernameStyle,
} from "@/lib/generators/username";
import {
  generatePassword,
  estimatePasswordEntropyBits,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_DEFAULT_LENGTH,
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions,
} from "@/lib/generators/password";
import { PASSWORD_PRESET_LABELS, PASSWORD_PRESET_ORDER, getPasswordPresetOptions, type PasswordPresetKey } from "@/lib/generators/presets";
import {
  generatePassphrase,
  estimatePassphraseEntropyBits,
  PASSPHRASE_MIN_WORDS,
  PASSPHRASE_MAX_WORDS,
  PASSPHRASE_SEPARATORS,
  PASSPHRASE_SEPARATOR_LABELS,
  DEFAULT_PASSPHRASE_OPTIONS,
  type PassphraseOptions,
  type PassphraseSeparator,
} from "@/lib/generators/passphrase";
import { checkUsername } from "@/lib/checkers/username";
import { checkPassword } from "@/lib/checkers/password";
import type { CheckResult } from "@/lib/checkers/password";
import { analyticsEvents, track, THEME_STORAGE_KEY } from "@/lib/analytics/events";

type Mode = "password" | "passphrase" | "username";
type Preset = PasswordPresetKey | "custom";

const USERNAME_SUGGESTION_COUNT = 5;
const USERNAME_FAVORITES_STORAGE_KEY = "makemepassword-username-favorites";

const USERNAME_STYLE_EXAMPLES: Record<UsernameStyle, string> = {
  memorable: "brightorbit482",
  gaming: "phantomrift77",
  professional: "novaapex214",
  anonymous: "quietblank391",
  minimal: "kx7m2p9q",
  random: "hJ4np_2v9Lk",
};

function lengthBucket(length: number): "short" | "standard" | "long" {
  return length < 12 ? "short" : length < 20 ? "standard" : "long";
}

function passwordStrengthScore(entropyBits: number): number {
  if (entropyBits >= 80) return 5;
  if (entropyBits >= 60) return 4;
  if (entropyBits >= 36) return 3;
  if (entropyBits >= 28) return 2;
  return 1;
}

function generateUsernameSuggestions(style: UsernameStyle, length: number): string[] {
  const seen = new Set<string>();
  let attempts = 0;
  while (seen.size < USERNAME_SUGGESTION_COUNT && attempts < USERNAME_SUGGESTION_COUNT * 6) {
    seen.add(generateUsername({ style, length }));
    attempts += 1;
  }
  return [...seen];
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("password");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [preset, setPreset] = useState<Preset>("custom");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [passphrase, setPassphrase] = useState("");

  const [usernameStyle, setUsernameStyle] = useState<UsernameStyle>("memorable");
  const [usernameLength, setUsernameLength] = useState(USERNAME_DEFAULT_LENGTH);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameFavorites, setUsernameFavorites] = useState<string[]>([]);

  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameResult, setUsernameResult] = useState<CheckResult | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordInputVisible, setPasswordInputVisible] = useState(false);
  const [passwordResult, setPasswordResult] = useState<CheckResult | null>(null);

  function showToast(message: string) {
    setToast({ visible: true, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((state) => ({ ...state, visible: false })), 1800);
  }

  function newPassword(options: PasswordOptions, trigger: "change" | "regenerate") {
    const value = generatePassword(options);
    setPassword(value);
    track(trigger === "regenerate" ? analyticsEvents.passwordRegenerated : analyticsEvents.passwordGenerated, {
      generator_type: "password",
      length_bucket: lengthBucket(options.length),
    });
  }

  function newPassphrase(options: PassphraseOptions, trigger: "change" | "regenerate") {
    const value = generatePassphrase(options);
    setPassphrase(value);
    track(trigger === "regenerate" ? analyticsEvents.passphraseRegenerated : analyticsEvents.passphraseGenerated, {
      generator_type: "passphrase",
      word_count: options.words,
    });
  }

  function newUsernameSuggestions(style: UsernameStyle, length: number, trigger: "change" | "regenerate") {
    const values = generateUsernameSuggestions(style, length);
    setUsernameSuggestions(values);
    track(analyticsEvents.usernameSuggestionsGenerated, {
      generator_type: "username",
      style,
      length_bucket: lengthBucket(length),
      trigger,
      count: values.length,
    });
  }

  // Generate initial credentials once on mount, mirroring the static prototype's load-time behavior.
  useEffect(() => {
    newPassword(passwordOptions, "change");
    newPassphrase(passphraseOptions, "change");
    newUsernameSuggestions(usernameStyle, usernameLength, "change");
    track(analyticsEvents.generatorOpened, { generator_type: "combined" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = (() => {
      try {
        return window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const initial = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    setTheme(initial);

    try {
      const storedFavorites = window.localStorage.getItem(USERNAME_FAVORITES_STORAGE_KEY);
      if (storedFavorites) setUsernameFavorites(JSON.parse(storedFavorites));
    } catch {
      // Ignore malformed or inaccessible storage; favorites simply start empty.
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the preference simply won't persist.
    }
    track(analyticsEvents.themeChanged, { theme: next });
  }

  async function copyValue(value: string, kind: "username" | "password" | "passphrase") {
    try {
      await navigator.clipboard.writeText(value);
      showToast(kind === "passphrase" ? "Passphrase copied" : kind === "password" ? "Password copied" : "Username copied");
      track(analyticsEvents.credentialCopied, { credential_type: kind });
    } catch {
      showToast("Copy unavailable — select the text instead");
    }
  }

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next === "custom") return;
    const presetOptions = { ...passwordOptions, ...getPasswordPresetOptions(next) };
    setPasswordOptions(presetOptions);
    newPassword(presetOptions, "change");
    track(analyticsEvents.presetSelected, { preset_type: "password", preset_name: next });
  }

  function openAdvanced() {
    if (!advancedOpen) track(analyticsEvents.advancedOptionsOpened, {});
    setAdvancedOpen((open) => !open);
  }

  function updatePassword(patch: Partial<PasswordOptions>) {
    const next = { ...passwordOptions, ...patch };
    setPasswordOptions(next);
    setPreset("custom");
    newPassword(next, "change");
  }

  function updatePassphrase(patch: Partial<PassphraseOptions>) {
    const next = { ...passphraseOptions, ...patch };
    setPassphraseOptions(next);
    newPassphrase(next, "change");
  }

  function selectUsernameStyle(style: UsernameStyle) {
    setUsernameStyle(style);
    newUsernameSuggestions(style, usernameLength, "change");
    track(analyticsEvents.presetSelected, { preset_type: "username_style", preset_name: style });
  }

  function updateUsernameLength(length: number) {
    setUsernameLength(length);
    newUsernameSuggestions(usernameStyle, length, "change");
  }

  function toggleFavorite(name: string) {
    setUsernameFavorites((current) => {
      const isFavorite = current.includes(name);
      const next = isFavorite ? current.filter((item) => item !== name) : [...current, name];
      try {
        window.localStorage.setItem(USERNAME_FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures; favorites simply won't persist.
      }
      track(isFavorite ? analyticsEvents.usernameUnfavorited : analyticsEvents.usernameFavorited, { generator_type: "username" });
      return next;
    });
  }

  const passwordEntropyBits = estimatePasswordEntropyBits(passwordOptions);
  const strengthScore = passwordStrengthScore(passwordEntropyBits);
  const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const passphraseEntropyBits = estimatePassphraseEntropyBits(passphraseOptions);

  function runUsernameCheck() {
    const value = usernameInput.trim();
    if (!value) {
      showToast("Enter a username to check");
      return;
    }
    const result = checkUsername(value);
    setUsernameResult(result);
    track(analyticsEvents.usernameChecked, { strength: result.label });
  }

  function runPasswordCheck() {
    if (!passwordInput) {
      showToast("Enter a password to check");
      return;
    }
    const result = checkPassword(passwordInput);
    setPasswordResult(result);
    track(analyticsEvents.passwordChecked, { strength: result.label });
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MakeMePassword home">
          <span className="brand-mark">M</span>
          <span>akeMePassword</span>
        </a>
        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#generator">Generate</a>
          <a href="#checker">Check mine</a>
          <a href="#security">Security</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="top-actions">
          <button className="icon-button" type="button" aria-label="Toggle color theme" title="Toggle color theme" onClick={toggleTheme}>
            ◐
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero reveal">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot"></span> Local-first credential studio
            </p>
            <h1>
              Generate. Check.
              <br />
              <em>Protect.</em>
            </h1>
            <p className="hero-lede">Create a username and password, or check credentials you already use. No account, no storage, no noise.</p>
            <a className="button button-dark" href="#generator">
              Start generating <span>↓</span>
            </a>
          </div>
          <div className="hero-art" aria-label="Preview of a generated credential" role="img">
            <div className="art-label">NEW CREDENTIAL</div>
            <div className="art-username">
              Nova<span>Pixel</span>
              <b>_482</b>
            </div>
            <div className="art-rule"></div>
            <div className="art-password">
              vQ7!mR2#xL9@<span>pT4$</span>
            </div>
            <div className="art-foot">
              <span>Generated locally</span>
              <span className="shield">⌁</span>
            </div>
          </div>
        </section>

        <section className="generator-section" id="generator">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Your studio</p>
              <h2>One click from ready.</h2>
            </div>
            <p className="section-note">Every result is created in your browser using cryptographically secure randomness.</p>
          </div>
          <div className="mode-tabs" role="tablist" aria-label="Generator mode">
            {(["password", "passphrase", "username"] as Mode[]).map((tab) => (
              <button
                key={tab}
                className={`mode-tab${mode === tab ? " active" : ""}`}
                data-mode={tab}
                role="tab"
                aria-selected={mode === tab}
                onClick={() => {
                  setMode(tab);
                  track("generator_mode_changed", { mode: tab });
                }}
              >
                {tab === "password" ? "Password" : tab === "passphrase" ? "Passphrase" : "Username"}
              </button>
            ))}
          </div>

          {mode === "password" && (
            <article className="credential-card password-card">
              <div className="card-top">
                <div>
                  <p className="card-kicker">YOUR PASSWORD</p>
                  <h3>Strong by default.</h3>
                </div>
                <button
                  className="round-button regenerate"
                  type="button"
                  aria-label="Regenerate password"
                  title="Regenerate password"
                  onClick={() => newPassword(passwordOptions, "regenerate")}
                >
                  ↻
                </button>
              </div>
              <div className={`credential-value password-value${passwordVisible ? "" : " masked"}`} aria-live="polite" style={{ filter: passwordVisible ? "none" : "blur(5px)" }}>
                {password}
              </div>
              <div className="strength-row">
                <span>Strength</span>
                <strong>{strengthLabels[strengthScore - 1]}</strong>
                <div className="strength-meter" aria-label="Password strength">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <i key={index} className={index < strengthScore ? "on" : ""}></i>
                  ))}
                </div>
              </div>
              <p className="entropy-hint">{passwordEntropyBits} bits estimated entropy</p>
              <div className="card-controls password-controls">
                <label>
                  Length <output>{passwordOptions.length}</output>
                  <input
                    type="range"
                    min={PASSWORD_MIN_LENGTH}
                    max={PASSWORD_MAX_LENGTH}
                    value={passwordOptions.length}
                    onChange={(event) => updatePassword({ length: Number(event.target.value) })}
                  />
                </label>
                <div className="toggle-list">
                  <label>
                    <input type="checkbox" checked={passwordOptions.symbols} onChange={(event) => updatePassword({ symbols: event.target.checked })} /> Symbols
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={passwordOptions.excludeAmbiguous}
                      onChange={(event) => updatePassword({ excludeAmbiguous: event.target.checked })}
                    />{" "}
                    Exclude lookalikes
                  </label>
                </div>
                <label>
                  Preset
                  <select value={preset} onChange={(event) => applyPreset(event.target.value as Preset)}>
                    <option value="custom">Custom</option>
                    {PASSWORD_PRESET_ORDER.map((key) => (
                      <option key={key} value={key}>
                        {PASSWORD_PRESET_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="button" className="text-button advanced-toggle" onClick={openAdvanced} aria-expanded={advancedOpen}>
                {advancedOpen ? "Hide advanced options" : "Advanced options"}
              </button>
              {advancedOpen && (
                <div className="advanced-options">
                  <label>
                    <input type="checkbox" checked={passwordOptions.avoidRepeated} onChange={(event) => updatePassword({ avoidRepeated: event.target.checked })} /> Avoid
                    repeated characters
                  </label>
                  <label>
                    <input type="checkbox" checked={passwordOptions.avoidSequential} onChange={(event) => updatePassword({ avoidSequential: event.target.checked })} /> Avoid
                    sequential characters
                  </label>
                  <label>
                    <input type="checkbox" checked={passwordOptions.pronounceable} onChange={(event) => updatePassword({ pronounceable: event.target.checked })} /> Pronounceable
                  </label>
                  <label>
                    Min numbers
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={passwordOptions.minNumbers}
                      onChange={(event) => updatePassword({ minNumbers: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Min symbols
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={passwordOptions.minSymbols}
                      onChange={(event) => updatePassword({ minSymbols: Number(event.target.value) })}
                    />
                  </label>
                </div>
              )}
              <div className="card-actions">
                <button className="button button-accent copy-button" type="button" onClick={() => copyValue(password, "password")}>
                  Copy password <span>↗</span>
                </button>
                <button className="text-button" type="button" onClick={() => setPasswordVisible((visible) => !visible)}>
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </div>
            </article>
          )}

          {mode === "passphrase" && (
            <article className="credential-card passphrase-card">
              <div className="card-top">
                <div>
                  <p className="card-kicker">YOUR PASSPHRASE</p>
                  <h3>Easy to remember.</h3>
                </div>
                <button
                  className="round-button regenerate"
                  type="button"
                  aria-label="Regenerate passphrase"
                  title="Regenerate passphrase"
                  onClick={() => newPassphrase(passphraseOptions, "regenerate")}
                >
                  ↻
                </button>
              </div>
              <div className="credential-value passphrase-value" aria-live="polite">
                {passphrase}
              </div>
              <p className="entropy-hint">{passphraseEntropyBits} bits estimated entropy</p>
              <div className="card-controls">
                <label>
                  Words <output>{passphraseOptions.words}</output>
                  <input
                    type="range"
                    min={PASSPHRASE_MIN_WORDS}
                    max={PASSPHRASE_MAX_WORDS}
                    value={passphraseOptions.words}
                    onChange={(event) => updatePassphrase({ words: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Separator
                  <select
                    value={passphraseOptions.separator}
                    onChange={(event) => updatePassphrase({ separator: event.target.value as PassphraseSeparator })}
                  >
                    {PASSPHRASE_SEPARATORS.map((separator) => (
                      <option key={separator} value={separator}>
                        {PASSPHRASE_SEPARATOR_LABELS[separator]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="toggle-list">
                  <label>
                    <input type="checkbox" checked={passphraseOptions.capitalize} onChange={(event) => updatePassphrase({ capitalize: event.target.checked })} /> Capitalize
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={passphraseOptions.includeNumber}
                      onChange={(event) => updatePassphrase({ includeNumber: event.target.checked })}
                    />{" "}
                    Include number
                  </label>
                </div>
              </div>
              <div className="card-actions">
                <button className="button button-accent copy-button" type="button" onClick={() => copyValue(passphrase, "passphrase")}>
                  Copy passphrase <span>↗</span>
                </button>
                <button className="text-button regenerate" type="button" onClick={() => newPassphrase(passphraseOptions, "regenerate")}>
                  Regenerate
                </button>
              </div>
            </article>
          )}

          {mode === "username" && (
            <article className="credential-card username-studio">
              <div className="card-top">
                <div>
                  <p className="card-kicker">USERNAME STUDIO</p>
                  <h3>Something that sticks.</h3>
                </div>
              </div>
              <div className="style-cards" role="tablist" aria-label="Username style">
                {USERNAME_STYLE_ORDER.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`style-card${usernameStyle === style ? " active" : ""}`}
                    role="tab"
                    aria-selected={usernameStyle === style}
                    onClick={() => selectUsernameStyle(style)}
                  >
                    <span className="style-card-label">{USERNAME_STYLE_LABELS[style]}</span>
                    <span className="style-card-example">{USERNAME_STYLE_EXAMPLES[style]}</span>
                  </button>
                ))}
              </div>
              <div className="card-controls">
                <label>
                  Length <output>{usernameLength}</output>
                  <input
                    type="range"
                    min={USERNAME_MIN_LENGTH}
                    max={USERNAME_MAX_LENGTH}
                    value={usernameLength}
                    onChange={(event) => updateUsernameLength(Number(event.target.value))}
                  />
                </label>
              </div>
              <div className="suggestion-list">
                {usernameSuggestions.map((name) => {
                  const isFavorite = usernameFavorites.includes(name);
                  return (
                    <div className="suggestion-row" key={name}>
                      <div>
                        <span className="suggestion-name">{name}</span>
                        <span className="suggestion-meta">
                          {USERNAME_STYLE_LABELS[usernameStyle]} · {name.length} chars
                        </span>
                      </div>
                      <div className="suggestion-actions">
                        <button className="icon-button" type="button" aria-label={`Copy ${name}`} title="Copy" onClick={() => copyValue(name, "username")}>
                          ⧉
                        </button>
                        <button
                          className={`icon-button favorite${isFavorite ? " active" : ""}`}
                          type="button"
                          aria-label={isFavorite ? `Remove ${name} from favorites` : `Favorite ${name}`}
                          aria-pressed={isFavorite}
                          title="Favorite"
                          onClick={() => toggleFavorite(name)}
                        >
                          {isFavorite ? "♥" : "♡"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card-actions">
                <button
                  className="button button-accent copy-button"
                  type="button"
                  onClick={() => newUsernameSuggestions(usernameStyle, usernameLength, "regenerate")}
                >
                  Generate more <span>↗</span>
                </button>
              </div>
              {usernameFavorites.length > 0 && (
                <div className="favorites-panel">
                  <p className="card-kicker">FAVORITES</p>
                  <div className="favorites-list">
                    {usernameFavorites.map((name) => (
                      <span className="favorite-chip" key={name}>
                        {name}
                        <button type="button" aria-label={`Remove ${name} from favorites`} onClick={() => toggleFavorite(name)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}

          <div className="privacy-note">
            <span>✧</span>
            <div>
              <strong>Private by design.</strong> Credentials never leave this browser. MakeMePassword does not store, log, or send what you generate.
            </div>
          </div>
        </section>

        <section className="checker-section" id="checker">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / Check mine</p>
              <h2>
                Already have one?
                <br />
                <em>Bring it here.</em>
              </h2>
            </div>
            <p className="section-note">Your input stays in this browser. Nothing is stored, logged, or sent to analytics.</p>
          </div>
          <div className="checker-grid">
            <article className="checker-card">
              <div className="card-top">
                <div>
                  <p className="card-kicker">USERNAME CHECKER</p>
                  <h3>Spot the obvious.</h3>
                </div>
              </div>
              <label className="checker-label" htmlFor="usernameInput">
                Your username
              </label>
              <div className="input-with-action">
                <input
                  id="usernameInput"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. johnsmith1998"
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runUsernameCheck();
                  }}
                />
                <button className="button button-accent" type="button" onClick={runUsernameCheck}>
                  Check
                </button>
              </div>
              {usernameResult && (
                <div className="check-result">
                  <div className="result-heading">
                    <strong>{usernameResult.label}</strong>
                    <span className={`result-bar level-${usernameResult.score}`}></span>
                  </div>
                  <p>{usernameResult.summary}</p>
                  <ul>
                    {usernameResult.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
            <article className="checker-card checker-password">
              <div className="card-top">
                <div>
                  <p className="card-kicker">PASSWORD CHECKER</p>
                  <h3>Know what to improve.</h3>
                </div>
              </div>
              <label className="checker-label" htmlFor="passwordInput">
                Your password
              </label>
              <div className="input-with-action">
                <input
                  id="passwordInput"
                  type={passwordInputVisible ? "text" : "password"}
                  autoComplete="off"
                  placeholder="Type or paste privately"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runPasswordCheck();
                  }}
                />
                <button className="button button-accent" type="button" onClick={runPasswordCheck}>
                  Check
                </button>
              </div>
              <label className="show-check">
                <input type="checkbox" checked={passwordInputVisible} onChange={(event) => setPasswordInputVisible(event.target.checked)} /> Show password
              </label>
              {passwordResult && (
                <div className="check-result">
                  <div className="result-heading">
                    <strong>{passwordResult.label}</strong>
                    <span className={`result-bar level-${passwordResult.score}`}></span>
                  </div>
                  <p>{passwordResult.summary}</p>
                  <ul>
                    {passwordResult.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                  <button
                    className="text-button generate-recommendation"
                    type="button"
                    onClick={() => {
                      setMode("password");
                      document.querySelector("#generator")?.scrollIntoView({ behavior: "smooth" });
                      showToast("Use the generator above for a fresh password");
                      track("recommendation_clicked", { generator_type: "password" });
                    }}
                  >
                    Generate a stronger password →
                  </button>
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="feature-band" id="security">
          <div className="feature-intro">
            <p className="eyebrow">03 / The good stuff</p>
            <h2>
              A clearer path
              <br />
              <em>to safer accounts.</em>
            </h2>
          </div>
          <div className="feature-list">
            <div className="feature-item">
              <span>01</span>
              <div>
                <h3>Actually random</h3>
                <p>Passwords use the browser&rsquo;s Web Crypto API, never predictable Math.random().</p>
              </div>
            </div>
            <div className="feature-item">
              <span>02</span>
              <div>
                <h3>Readable when you need it</h3>
                <p>Choose a style that feels like you, from quiet anonymous to full gaming energy.</p>
              </div>
            </div>
            <div className="feature-item">
              <span>03</span>
              <div>
                <h3>Quietly private</h3>
                <p>Usage analytics measure actions, never credential contents or clipboard data.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div>
            <p className="eyebrow">04 / Good questions</p>
            <h2>
              Designed to be
              <br />
              <em>easy to trust.</em>
            </h2>
          </div>
          <div className="faq-list">
            <details open>
              <summary>Are generated passwords stored anywhere?</summary>
              <p>No. Generation is performed locally in your browser. The result is not written to a database, URL, or analytics event.</p>
            </details>
            <details>
              <summary>Can I use a generated username anywhere?</summary>
              <p>You can use it wherever you like, but MakeMePassword does not claim platform availability. Availability depends on the service you choose.</p>
            </details>
            <details>
              <summary>How does analytics work?</summary>
              <p>Optional GA4 tracking records anonymous product events such as generation and copy actions. Credential values are deliberately excluded.</p>
            </details>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top">
          <span className="brand-mark">M</span>
          <span>akeMePassword</span>
        </a>
        <p>Strong identities, made simply.</p>
        <span>© 2026 MakeMePassword</span>
      </footer>

      <ConsentBanner />
      <div className={`toast${toast.visible ? " show" : ""}`} role="status" aria-live="polite">
        {toast.message}
      </div>
    </div>
  );
}
