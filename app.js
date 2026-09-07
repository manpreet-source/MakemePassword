const state = { username: '', password: '', passwordVisible: false };
const usernameValue = document.querySelector('#usernameValue');
const passwordValue = document.querySelector('#passwordValue');
const usernameLength = document.querySelector('#usernameLength');
const passwordLength = document.querySelector('#passwordLength');
const toast = document.querySelector('#toast');
const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const lowercase = 'abcdefghijkmnopqrstuvwxyz';
const numbers = '23456789';
const symbols = '!@#$%&*+=';
const adjectives = ['Silent','Bright','Velvet','Brisk','Cosmic','Golden','Quiet','Wandering','Clever','Hidden','Neon','Mellow'];
const nouns = ['Orbit','Pixel','Comet','Vector','Harbor','Falcon','Meadow','Circuit','Nexus','Summit','Echo','Current'];
const gamingNouns = ['Rift','Viper','Quest','Reaper','Drift','Wolf','Striker','Phantom'];
const randomInt = max => crypto.getRandomValues(new Uint32Array(1))[0] % max;
const pick = list => list[randomInt(list.length)];
const shuffle = text => [...text].sort(() => randomInt(2) ? 1 : -1).join('');
function safeEvent(name, params = {}) { if (window.gtag && localStorage.getItem('makemepassword-analytics-consent') === 'accepted') window.gtag('event', name, { ...params }); }
function generateUsername() {
  const style = document.querySelector('#usernameStyle').value;
  const length = Number(usernameLength.value);
  let result;
  if (style === 'random' || style === 'minimal') {
    const chars = style === 'minimal' ? lowercase + numbers + '_' : uppercase + lowercase + numbers + '_';
    result = Array.from({ length }, () => chars[randomInt(chars.length)]).join('');
  } else {
    const word = style === 'gaming' ? pick(gamingNouns) : pick(nouns);
    const adjective = style === 'professional' ? pick(['Nova','Apex','Clear','North','Prime','Vertex']) : style === 'anonymous' ? pick(['Quiet','Hidden','Unknown','Blank','Private']) : pick(adjectives);
    result = `${adjective}${word}${randomInt(900) + 100}`;
  }
  state.username = result.slice(0, length);
  usernameValue.textContent = state.username;
  safeEvent('generate_username', { generator_type: 'username', style });
}
function generatePassword() {
  const length = Number(passwordLength.value);
  const includeSymbols = document.querySelector('#includeSymbols').checked;
  const excludeAmbiguous = document.querySelector('#excludeAmbiguous').checked;
  let chars = uppercase + lowercase + numbers + (includeSymbols ? symbols : '');
  if (!excludeAmbiguous) chars += 'O0Il1';
  const required = [pick(uppercase), pick(lowercase), pick(numbers)];
  if (includeSymbols) required.push(pick(symbols));
  const result = shuffle(required.join('') + Array.from({ length: Math.max(0, length - required.length) }, () => chars[randomInt(chars.length)]).join(''));
  state.password = result;
  renderPassword();
  updateStrength();
  safeEvent('generate_password', { generator_type: 'password', length_bucket: length < 12 ? 'short' : length < 20 ? 'standard' : 'long' });
}
function renderPassword() { passwordValue.textContent = state.password; passwordValue.classList.toggle('masked', !state.passwordVisible); passwordValue.style.filter = state.passwordVisible ? 'none' : 'blur(5px)'; }
function updateStrength() { const score = Math.min(5, (Number(passwordLength.value) >= 16 ? 2 : 1) + (document.querySelector('#includeSymbols').checked ? 1 : 0) + (Number(passwordLength.value) >= 24 ? 1 : 0) + (state.password.length > 0 ? 1 : 0)); const labels = ['Very weak','Weak','Fair','Strong','Very strong']; document.querySelector('#strengthLabel').textContent = labels[score - 1]; document.querySelectorAll('.strength-meter i').forEach((bar, index) => bar.classList.toggle('on', index < score)); }
function scoreLabel(score) { return ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][Math.max(0, Math.min(4, score - 1))]; }
function setRecommendations(listId, recommendations) { const list = document.querySelector(`#${listId}`); list.replaceChildren(...recommendations.map(recommendation => { const item = document.createElement('li'); item.textContent = recommendation; return item; })); }
function renderCheckResult(resultType, score, summary, recommendations) {
  document.querySelector(`#${resultType}Result`).hidden = false;
  document.querySelector(`#${resultType}Score`).textContent = scoreLabel(score);
  document.querySelector(`#${resultType}ScoreBar`).className = `result-bar level-${score}`;
  document.querySelector(`#${resultType}Summary`).textContent = summary;
  setRecommendations(`${resultType}Recommendations`, recommendations);
}
function checkUsername() {
  const value = document.querySelector('#usernameInput').value.trim();
  if (!value) { showToast('Enter a username to check'); return; }
  let score = 5;
  const recommendations = [];
  const normalized = value.toLowerCase();
  if (value.length < 6) { score -= 2; recommendations.push('Use at least 6 characters.'); }
  if (/\d{4}/.test(value)) { score -= 1; recommendations.push('Avoid year-like numbers such as a birth year.'); }
  if (/^(john|mike|admin|user|test|guest)/i.test(value) || /(123|qwerty|password)/i.test(normalized)) { score -= 2; recommendations.push('Avoid common names, labels, and predictable patterns.'); }
  if (/(.)\1{2,}/.test(value) || /[^a-z0-9]{2,}/i.test(value)) { score -= 1; recommendations.push('Reduce repeated characters and excessive symbols.'); }
  if (value.length < 10) recommendations.push('Consider two unrelated words for a less predictable username.');
  recommendations.push('Avoid reusing the same username everywhere.');
  score = Math.max(1, score);
  renderCheckResult('username', score, score <= 2 ? 'This username has patterns that make it easier to guess.' : score === 3 ? 'This username is usable, but could be less predictable.' : 'This username avoids the most common predictable patterns.', recommendations);
  safeEvent('username_checked', { strength: scoreLabel(score) });
}
function checkPassword() {
  const value = document.querySelector('#passwordInput').value;
  if (!value) { showToast('Enter a password to check'); return; }
  let score = 0;
  const recommendations = [];
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const hasSequence = /(?:abc|bcd|cde|123|234|345|qwerty)/i.test(value);
  const repeated = /(.)\1{2,}/.test(value);
  if (value.length >= 16) score += 2; else if (value.length >= 12) score += 1; else recommendations.push('Make it at least 12 characters, preferably 16 or more.');
  score += [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length >= 3 ? 2 : 1;
  if (hasSequence) { score -= 1; recommendations.push('Avoid sequences such as 123, abc, or qwerty.'); }
  if (repeated) { score -= 1; recommendations.push('Avoid repeating the same character several times.'); }
  if (/password|letmein|welcome|admin|iloveyou/i.test(value)) { score -= 2; recommendations.push('Avoid common passwords and dictionary phrases.'); }
  if (!hasUpper) recommendations.push('Add an uppercase letter.');
  if (!hasLower) recommendations.push('Add a lowercase letter.');
  if (!hasNumber) recommendations.push('Add a number.');
  if (!hasSymbol) recommendations.push('Add a symbol.');
  if (!recommendations.length) recommendations.push('Use a different password for every account.');
  score = Math.max(1, Math.min(5, score));
  renderCheckResult('password', score, score <= 2 ? 'This password is easy to predict or too short.' : score === 3 ? 'This password is fair, but there is room to make it stronger.' : 'This password has good length and character variety.', recommendations);
  safeEvent('password_checked', { strength: scoreLabel(score) });
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }
async function copyValue(target) { const value = document.querySelector(`#${target}`).textContent; try { await navigator.clipboard.writeText(value); showToast('Copied to clipboard'); safeEvent(target === 'usernameValue' ? 'copy_username' : 'copy_password', { generator_type: target === 'usernameValue' ? 'username' : 'password' }); } catch { showToast('Copy unavailable — select the text instead'); } }
usernameLength.addEventListener('input', () => { document.querySelector('#usernameLengthOutput').textContent = usernameLength.value; generateUsername(); });
passwordLength.addEventListener('input', () => { document.querySelector('#passwordLengthOutput').textContent = passwordLength.value; generatePassword(); });
document.querySelector('#usernameStyle').addEventListener('change', generateUsername);
document.querySelector('#includeSymbols').addEventListener('change', generatePassword);
document.querySelector('#excludeAmbiguous').addEventListener('change', generatePassword);
document.querySelectorAll('.copy-button').forEach(button => button.addEventListener('click', () => copyValue(button.dataset.target)));
document.querySelector('#copyBoth').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`${state.username}\n${state.password}`); showToast('Both credentials copied'); safeEvent('copy_both', { generator_type: 'combined' }); } catch { showToast('Copy unavailable — select the text instead'); } });
document.querySelectorAll('.regenerate').forEach(button => button.addEventListener('click', () => button.dataset.target === 'username' ? generateUsername() : generatePassword()));
document.querySelector('#regenerateBoth').addEventListener('click', () => { generateUsername(); generatePassword(); safeEvent('generate_both', { generator_type: 'combined' }); });
document.querySelector('#togglePassword').addEventListener('click', event => { state.passwordVisible = !state.passwordVisible; event.currentTarget.textContent = state.passwordVisible ? 'Hide' : 'Show'; renderPassword(); });
document.querySelector('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('makemepassword-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); safeEvent('theme_changed', { theme: document.body.classList.contains('dark') ? 'dark' : 'light' }); });
if (localStorage.getItem('makemepassword-theme') === 'dark' || (!localStorage.getItem('makemepassword-theme') && matchMedia('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');
const consentBanner = document.querySelector('#consentBanner');
if (localStorage.getItem('makemepassword-analytics-consent')) consentBanner.hidden = true;
document.querySelector('#acceptAnalytics').addEventListener('click', () => { localStorage.setItem('makemepassword-analytics-consent', 'accepted'); consentBanner.hidden = true; });
document.querySelector('#rejectAnalytics').addEventListener('click', () => { localStorage.setItem('makemepassword-analytics-consent', 'rejected'); consentBanner.hidden = true; });
document.querySelector('#checkUsername').addEventListener('click', checkUsername);
document.querySelector('#checkPassword').addEventListener('click', checkPassword);
document.querySelector('#usernameInput').addEventListener('keydown', event => { if (event.key === 'Enter') checkUsername(); });
document.querySelector('#passwordInput').addEventListener('keydown', event => { if (event.key === 'Enter') checkPassword(); });
document.querySelector('#showPasswordInput').addEventListener('change', event => { document.querySelector('#passwordInput').type = event.currentTarget.checked ? 'text' : 'password'; });
document.querySelector('#generateRecommendation').addEventListener('click', () => { document.querySelector('#generator').scrollIntoView({ behavior: 'smooth' }); showToast('Use the generator above for a fresh password'); safeEvent('recommendation_clicked', { generator_type: 'password' }); });
document.querySelectorAll('.mode-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.mode-tab').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); }); tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); document.querySelector('.username-card').style.display = tab.dataset.mode === 'password' ? 'none' : ''; document.querySelector('.password-card').style.display = tab.dataset.mode === 'username' ? 'none' : ''; safeEvent('generator_mode_changed', { mode: tab.dataset.mode }); }));
generateUsername(); generatePassword();
