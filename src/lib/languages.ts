export interface LanguageOption {
  code: string; // ISO 639-1 or specific code e.g. "en", "ta", "hi"
  name: string; // English name
  nativeName: string; // Native script
  flag: string;
  speechCode: string; // BCP-47 for browser speech recognition
  ttsVoice: string; // Recommended TTS voice identifier
  sampleText: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "auto",
    name: "Auto Detect",
    nativeName: "தானியங்கி கண்டறிதல் / Auto",
    flag: "🌐",
    speechCode: "auto",
    ttsVoice: "en",
    sampleText: "",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    speechCode: "en-US",
    ttsVoice: "en",
    sampleText: "Welcome to Voxora AI. Speak or type in any language.",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    speechCode: "ta-IN",
    ttsVoice: "ta",
    sampleText: "வணக்கம், இன்று உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    speechCode: "hi-IN",
    ttsVoice: "hi",
    sampleText: "नमस्ते, वोक्सोरा एआई में आपका स्वागत है।",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    speechCode: "te-IN",
    ttsVoice: "te",
    sampleText: "నమస్కారం, ఈ రోజు మీకు నేను ఎలా సహాయం చేయగలను?",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    speechCode: "ml-IN",
    ttsVoice: "ml",
    sampleText: "നമസ്കാരം, വോക്സോറ എഐയിലേക്ക് സ്വാഗതം.",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    flag: "🇮🇳",
    speechCode: "kn-IN",
    ttsVoice: "kn",
    sampleText: "ನಮಸ್ಕಾರ, ವೊಕ್ಸೋರಾ ಎಐಗೆ ಸುಸ್ವಾಗತ.",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    speechCode: "bn-IN",
    ttsVoice: "bn",
    sampleText: "নমস্কার, ভোক্সোরা এআই-তে আপনাকে স্বাগতম।",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    speechCode: "mr-IN",
    ttsVoice: "mr",
    sampleText: "नमस्कार, व्होक्सोरा एआय मध्ये आपले स्वागत आहे.",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    speechCode: "gu-IN",
    ttsVoice: "gu",
    sampleText: "નમસ્તે, વોક્સોરા એઆઈમાં આપનું સ્વાગત છે.",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    flag: "🇮🇳",
    speechCode: "pa-IN",
    ttsVoice: "pa",
    sampleText: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਵੌਕਸੋਰਾ ਏਆਈ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    speechCode: "ur-PK",
    ttsVoice: "ur",
    sampleText: "خوش آمدید، ووکسورا اے آئی میں آپ کا خیرمقدم ہے۔",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    speechCode: "es-ES",
    ttsVoice: "es",
    sampleText: "Hola, bienvenido a Voxora AI. Habla o escribe en cualquier idioma.",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    speechCode: "fr-FR",
    ttsVoice: "fr",
    sampleText: "Bonjour et bienvenue sur Voxora AI. Parlez ou écrivez.",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    speechCode: "de-DE",
    ttsVoice: "de",
    sampleText: "Hallo und willkommen bei Voxora AI.",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    speechCode: "it-IT",
    ttsVoice: "it",
    sampleText: "Ciao e benvenuto su Voxora AI.",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    speechCode: "pt-BR",
    ttsVoice: "pt",
    sampleText: "Olá e bem-vindo ao Voxora AI.",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    speechCode: "ar-SA",
    ttsVoice: "ar",
    sampleText: "مرحبا بكم في فوكسورا للذكاء الاصطناعي.",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    speechCode: "ja-JP",
    ttsVoice: "ja",
    sampleText: "こんにちは、ボクソラAIへようこそ。",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    speechCode: "ko-KR",
    ttsVoice: "ko",
    sampleText: "안녕하세요, 복소라 AI에 오신 것을 환영합니다.",
  },
  {
    code: "zh",
    name: "Chinese (Mandarin)",
    nativeName: "中文 (普通话)",
    flag: "🇨🇳",
    speechCode: "zh-CN",
    ttsVoice: "zh",
    sampleText: "你好，欢迎使用 Voxora AI。",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    speechCode: "ru-RU",
    ttsVoice: "ru",
    sampleText: "Здравствуйте, добро пожаловать в Voxora AI.",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    speechCode: "tr-TR",
    ttsVoice: "tr",
    sampleText: "Merhaba, Voxora AI'ya hoş geldiniz.",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    speechCode: "nl-NL",
    ttsVoice: "nl",
    sampleText: "Hallo, welkom bij Voxora AI.",
  },
];

export function getLanguageByCode(code: string): LanguageOption {
  const found = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code.toLowerCase() === (code || "en").toLowerCase()
  );
  return (
    found || {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: "🌐",
      speechCode: "en-US",
      ttsVoice: "en",
      sampleText: "",
    }
  );
}

// Simple heuristic text language detector
export function detectLanguageFromText(text: string): {
  code: string;
  name: string;
  confidence: number;
} {
  if (!text || text.trim().length === 0) {
    return { code: "en", name: "English", confidence: 0.5 };
  }

  // Unicode scripts ranges
  const tamilRegex = /[\u0B80-\u0BFF]/;
  const devanagariRegex = /[\u0900-\u097F]/; // Hindi, Marathi
  const teluguRegex = /[\u0C00-\u0C7F]/;
  const malayalamRegex = /[\u0D00-\u0D7F]/;
  const kannadaRegex = /[\u0C80-\u0CFF]/;
  const bengaliRegex = /[\u0980-\u09FF]/;
  const gujaratiRegex = /[\u0A80-\u0AFF]/;
  const punjabiRegex = /[\u0A00-\u0A7F]/;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/;
  const chineseRegex = /[\u4E00-\u9FFF]/;
  const cyrillicRegex = /[\u0400-\u04FF]/;

  if (tamilRegex.test(text)) return { code: "ta", name: "Tamil", confidence: 0.98 };
  if (teluguRegex.test(text)) return { code: "te", name: "Telugu", confidence: 0.98 };
  if (malayalamRegex.test(text)) return { code: "ml", name: "Malayalam", confidence: 0.98 };
  if (kannadaRegex.test(text)) return { code: "kn", name: "Kannada", confidence: 0.98 };
  if (bengaliRegex.test(text)) return { code: "bn", name: "Bengali", confidence: 0.98 };
  if (gujaratiRegex.test(text)) return { code: "gu", name: "Gujarati", confidence: 0.98 };
  if (punjabiRegex.test(text)) return { code: "pa", name: "Punjabi", confidence: 0.98 };
  if (devanagariRegex.test(text)) return { code: "hi", name: "Hindi", confidence: 0.97 };
  if (arabicRegex.test(text)) return { code: "ar", name: "Arabic", confidence: 0.98 };
  if (japaneseRegex.test(text)) return { code: "ja", name: "Japanese", confidence: 0.99 };
  if (koreanRegex.test(text)) return { code: "ko", name: "Korean", confidence: 0.99 };
  if (chineseRegex.test(text)) return { code: "zh", name: "Chinese", confidence: 0.97 };
  if (cyrillicRegex.test(text)) return { code: "ru", name: "Russian", confidence: 0.96 };

  // Common European cues
  const lower = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(lower) || /\b(el|la|los|las|de|en|que|por|para|con)\b/.test(lower)) {
    return { code: "es", name: "Spanish", confidence: 0.94 };
  }
  if (/[àâçéèêëîïôûùüÿœæ]/.test(lower) || /\b(le|la|les|des|un|une|est|dans|pour)\b/.test(lower)) {
    return { code: "fr", name: "French", confidence: 0.93 };
  }
  if (/[äöüß]/.test(lower) || /\b(der|die|das|und|ist|nicht|mit|für|von)\b/.test(lower)) {
    return { code: "de", name: "German", confidence: 0.95 };
  }

  return { code: "en", name: "English", confidence: 0.95 };
}
