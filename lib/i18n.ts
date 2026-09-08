import { isLocale, type Locale, localeNames, siteConfig } from "./site-config";

export const LOCALE_STORAGE_KEY = "makemepassword-locale";
export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr", hi: "ltr", es: "ltr", fr: "ltr", de: "ltr", pt: "ltr", ar: "rtl", zh: "ltr", ja: "ltr", ko: "ltr",
};

type TranslationValues = Record<string, string | number>;
export type TranslationKey = keyof typeof translations.en;

const english = {
  language: "Language", theme: "Toggle color theme", support: "Support", supportCenter: "Support Center", contactSupport: "Contact support",
  generate: "Generate", checkMine: "Check mine", security: "Security", faq: "FAQ",
  heroEyebrow: "Local-first credential studio", heroTitle: "Generate. Check. Protect.", heroDescription: "Create a username and password, or check credentials you already use. No account, no storage, no noise.", startGenerating: "Start generating",
  password: "Password", passphrase: "Passphrase", username: "Username", copy: "Copy", copied: "Copied", regenerate: "Regenerate", show: "Show", hide: "Hide", check: "Check", generateMore: "Generate more",
  privateByDesign: "Private by design.", privateDescription: "Credentials never leave this browser. MakeMePassword does not store, log, or send what you generate.",
  footerDescription: "Strong identities, made simply.", tools: "Tools", resources: "Resources", helpCenter: "Help Center", privacy: "Privacy", terms: "Terms", followUs: "Follow us", allRightsReserved: "All rights reserved.",
  supportTitle: "How can we help?", supportDescription: "Find answers about the generators, privacy, and technical issues.", supportEmail: "Support email", stillNeedHelp: "Still need help?", supportTeam: "Contact our support team.", contactFormTitle: "Contact support", name: "Name", email: "Email", subject: "Subject", message: "Message", category: "Category", sendEmail: "Open email draft", formNote: "This opens your email app. No message is sent by this site.", required: "Please complete the required fields.",
  consentTitle: "Keep MakeMePassword quiet.", consentDescription: "Optional analytics help us improve the tool. Credential contents are never collected.", reject: "Reject", allowAnalytics: "Allow analytics",
  localeChanged: "Language changed",
  menu: "Menu", close: "Close", studio: "Your studio", oneClick: "One click from ready.", localRandomness: "Every result is created in your browser using cryptographically secure randomness.",
  strength: "Strength", veryWeak: "Very weak", weak: "Weak", fair: "Fair", strong: "Strong", veryStrong: "Very strong", length: "Length", symbols: "Symbols", excludeLookalikes: "Exclude lookalikes", preset: "Preset", custom: "Custom", advancedOptions: "Advanced options", hideAdvanced: "Hide advanced options", avoidRepeated: "Avoid repeated characters", avoidSequential: "Avoid sequential characters", pronounceable: "Pronounceable", minNumbers: "Min numbers", minSymbols: "Min symbols", words: "Words", separator: "Separator", capitalize: "Capitalize", includeNumber: "Include number", favorites: "Favorites", chars: "chars", usernameChecker: "Username checker", passwordChecker: "Password checker", yourUsername: "Your username", yourPassword: "Your password", typePrivately: "Type or paste privately", showPassword: "Show password", passwordRecommendation: "Generate a stronger password", checkSection: "Check mine", featureSection: "The good stuff", questionsSection: "Good questions", reportProblem: "Report a problem", suggestFeature: "Suggest a feature", technicalIssue: "Technical issue", featureRequest: "Feature request", bugReport: "Bug report", generalQuestion: "General question", searchHelp: "Search help articles", noTopics: "No matching topics found.", invalidUsername: "Enter a username to check", invalidPassword: "Enter a password to check", copyUnavailable: "Copy unavailable - select the text instead", freshPassword: "Use the generator above for a fresh password",
} as const;

type TranslationTable = { [Key in keyof typeof english]: string };

const translations: Record<Locale, TranslationTable> = {
  en: english,
  hi: { ...english, language: "भाषा", theme: "रंग थीम बदलें", support: "सहायता", generate: "बनाएँ", checkMine: "जाँचें", security: "सुरक्षा", faq: "सामान्य प्रश्न", heroEyebrow: "स्थानीय क्रेडेंशियल स्टूडियो", startGenerating: "बनाना शुरू करें", password: "पासवर्ड", passphrase: "पासफ़्रेज़", username: "उपयोगकर्ता नाम", copy: "कॉपी करें", copied: "कॉपी हो गया", regenerate: "फिर बनाएँ", check: "जाँचें", generateMore: "और बनाएँ", privateByDesign: "निजता के लिए बनाया गया।", supportTitle: "हम कैसे मदद कर सकते हैं?", contactSupport: "सहायता से संपर्क करें", name: "नाम", email: "ईमेल", subject: "विषय", message: "संदेश", sendEmail: "ईमेल ड्राफ्ट खोलें" },
  es: { ...english, language: "Idioma", theme: "Cambiar tema", support: "Soporte", generate: "Generar", checkMine: "Comprobar", security: "Seguridad", faq: "Preguntas frecuentes", startGenerating: "Empezar a generar", password: "Contraseña", passphrase: "Frase de contraseña", username: "Nombre de usuario", copy: "Copiar", copied: "Copiado", regenerate: "Regenerar", check: "Comprobar", generateMore: "Generar más", privateByDesign: "Privacidad desde el diseño.", supportTitle: "¿Cómo podemos ayudarte?", contactSupport: "Contactar con soporte", name: "Nombre", email: "Correo electrónico", subject: "Asunto", message: "Mensaje", sendEmail: "Abrir borrador de correo" },
  fr: { ...english, language: "Langue", theme: "Changer de thème", support: "Assistance", generate: "Générer", checkMine: "Vérifier", security: "Sécurité", faq: "FAQ", startGenerating: "Commencer à générer", password: "Mot de passe", passphrase: "Phrase secrète", username: "Nom d’utilisateur", copy: "Copier", copied: "Copié", regenerate: "Régénérer", check: "Vérifier", generateMore: "Générer plus", privateByDesign: "La confidentialité par conception.", supportTitle: "Comment pouvons-nous vous aider ?", contactSupport: "Contacter l’assistance", name: "Nom", email: "E-mail", subject: "Objet", message: "Message", sendEmail: "Ouvrir le brouillon d’e-mail" },
  de: { ...english, language: "Sprache", theme: "Farbschema ändern", support: "Support", generate: "Erstellen", checkMine: "Prüfen", security: "Sicherheit", faq: "FAQ", startGenerating: "Jetzt erstellen", password: "Passwort", passphrase: "Passphrase", username: "Benutzername", copy: "Kopieren", copied: "Kopiert", regenerate: "Neu erstellen", check: "Prüfen", generateMore: "Mehr erstellen", privateByDesign: "Datenschutz von Anfang an.", supportTitle: "Wie können wir helfen?", contactSupport: "Support kontaktieren", name: "Name", email: "E-Mail", subject: "Betreff", message: "Nachricht", sendEmail: "E-Mail-Entwurf öffnen" },
  pt: { ...english, language: "Idioma", theme: "Alterar tema", support: "Suporte", generate: "Gerar", checkMine: "Verificar", security: "Segurança", faq: "Perguntas frequentes", startGenerating: "Começar a gerar", password: "Senha", passphrase: "Frase de senha", username: "Nome de usuário", copy: "Copiar", copied: "Copiado", regenerate: "Gerar novamente", check: "Verificar", generateMore: "Gerar mais", privateByDesign: "Privacidade desde o início.", supportTitle: "Como podemos ajudar?", contactSupport: "Falar com o suporte", name: "Nome", email: "E-mail", subject: "Assunto", message: "Mensagem", sendEmail: "Abrir rascunho de e-mail" },
  ar: { ...english, language: "اللغة", theme: "تغيير المظهر", support: "الدعم", generate: "إنشاء", checkMine: "تحقق", security: "الأمان", faq: "الأسئلة الشائعة", startGenerating: "ابدأ الإنشاء", password: "كلمة المرور", passphrase: "عبارة المرور", username: "اسم المستخدم", copy: "نسخ", copied: "تم النسخ", regenerate: "إنشاء من جديد", check: "تحقق", generateMore: "إنشاء المزيد", privateByDesign: "الخصوصية أولاً.", supportTitle: "كيف يمكننا مساعدتك؟", contactSupport: "تواصل مع الدعم", name: "الاسم", email: "البريد الإلكتروني", subject: "الموضوع", message: "الرسالة", sendEmail: "فتح مسودة البريد" },
  zh: { ...english, language: "语言", theme: "切换主题", support: "支持", generate: "生成", checkMine: "检查", security: "安全", faq: "常见问题", startGenerating: "开始生成", password: "密码", passphrase: "密码短语", username: "用户名", copy: "复制", copied: "已复制", regenerate: "重新生成", check: "检查", generateMore: "生成更多", privateByDesign: "隐私设计。", supportTitle: "我们能如何帮助？", contactSupport: "联系支持", name: "姓名", email: "邮箱", subject: "主题", message: "消息", sendEmail: "打开邮件草稿" },
  ja: { ...english, language: "言語", theme: "テーマを切り替え", support: "サポート", generate: "生成", checkMine: "チェック", security: "セキュリティ", faq: "よくある質問", startGenerating: "生成を始める", password: "パスワード", passphrase: "パスフレーズ", username: "ユーザー名", copy: "コピー", copied: "コピーしました", regenerate: "再生成", check: "チェック", generateMore: "さらに生成", privateByDesign: "プライバシーを第一に。", supportTitle: "どのようなサポートが必要ですか？", contactSupport: "サポートに連絡", name: "名前", email: "メール", subject: "件名", message: "メッセージ", sendEmail: "メールの下書きを開く" },
  ko: { ...english, language: "언어", theme: "테마 전환", support: "지원", generate: "생성", checkMine: "확인", security: "보안", faq: "자주 묻는 질문", startGenerating: "생성 시작", password: "비밀번호", passphrase: "암호 문구", username: "사용자 이름", copy: "복사", copied: "복사됨", regenerate: "다시 생성", check: "확인", generateMore: "더 생성", privateByDesign: "개인정보 보호를 우선합니다.", supportTitle: "무엇을 도와드릴까요?", contactSupport: "지원팀에 문의", name: "이름", email: "이메일", subject: "제목", message: "메시지", sendEmail: "이메일 초안 열기" },
};

export function getLocale(value?: string | null): Locale {
  return value && isLocale(value) ? value : siteConfig.defaultLocale;
}

export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations.en;
}

export function translate(locale: Locale, key: TranslationKey, values: TranslationValues = {}): string {
  let output = getTranslations(locale)[key] ?? translations.en[key] ?? key;
  for (const [name, value] of Object.entries(values)) output = output.replace(`{${name}}`, String(value));
  return output;
}

export { localeNames };
