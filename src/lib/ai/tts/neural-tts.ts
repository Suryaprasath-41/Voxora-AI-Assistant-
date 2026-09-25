import { TTSProvider, TTSVoice, TTSOptions, TTSResult } from "./types";
import { getLanguageByCode } from "../../languages";

export class NeuralTTSProvider implements TTSProvider {
  name = "neural-speech";

  private voices: TTSVoice[] = [
    { id: "natural-female", name: "Aria (Natural)", language: "en", gender: "female", style: "natural", description: "Warm, conversational, and lifelike" },
    { id: "natural-male", name: "Marcus (Professional)", language: "en", gender: "male", style: "professional", description: "Clear, authoritative, and articulate" },
    { id: "friendly-female", name: "Maya (Friendly)", language: "en", gender: "female", style: "friendly", description: "Bright, welcoming, and upbeat" },
    { id: "narrator-male", name: "David (Narrator)", language: "en", gender: "male", style: "narrator", description: "Deep, resonant, and engaging for stories" },
    { id: "assistant-female", name: "Nova (Assistant)", language: "en", gender: "female", style: "assistant", description: "Crisp, fast, and responsive digital assistant" },
    
    // Indic voices
    { id: "tamil-natural", name: "Kavitha (Tamil Natural)", language: "ta", gender: "female", style: "natural", description: "இயற்கையான தமிழ் உச்சரிப்பு" },
    { id: "tamil-pro", name: "Murugan (Tamil Studio)", language: "ta", gender: "male", style: "professional", description: "தெளிவான தமிழ் குரல்" },
    { id: "hindi-natural", name: "Pooja (Hindi Natural)", language: "hi", gender: "female", style: "natural", description: "प्राकृतिक हिंदी आवाज" },
    { id: "hindi-pro", name: "Amit (Hindi Professional)", language: "hi", gender: "male", style: "professional", description: "स्पष्ट एवं औपचारिक हिंदी" },
    { id: "telugu-natural", name: "Sravani (Telugu)", language: "te", gender: "female", style: "natural", description: "సహజమైన తెలుగు స్వరం" },
    { id: "malayalam-natural", name: "Anjali (Malayalam)", language: "ml", gender: "female", style: "natural", description: "സ്വാഭാവിക മലയാള ശബ്ദം" },
    { id: "spanish-natural", name: "Sofia (Spanish)", language: "es", gender: "female", style: "natural", description: "Voz natural en español" },
    { id: "french-natural", name: "Camille (French)", language: "fr", gender: "female", style: "natural", description: "Voix française naturelle" },
    { id: "german-natural", name: "Hans (German)", language: "de", gender: "male", style: "professional", description: "Klare deutsche Aussprache" },
    { id: "japanese-natural", name: "Nanami (Japanese)", language: "ja", gender: "female", style: "friendly", description: "自然な日本語音声" },
    { id: "arabic-natural", name: "Zaid (Arabic)", language: "ar", gender: "male", style: "narrator", description: "صوت عربي فصيح وطبيعي" },
  ];

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    if (!languageCode || languageCode === "auto") {
      return this.voices;
    }
    const filtered = this.voices.filter((v) => v.language === languageCode);
    return filtered.length > 0 ? filtered : this.voices.filter((v) => v.language === "en");
  }

  async synthesize(
    text: string,
    language: string,
    options?: TTSOptions
  ): Promise<TTSResult> {
    const langInfo = getLanguageByCode(language);
    const targetLang = langInfo.code === "auto" ? "en" : langInfo.code;
    const cleanText = text.trim();

    if (!cleanText) {
      throw new Error("Text cannot be empty for speech synthesis.");
    }

    // Google Translate TTS endpoint generates real MP3 audio stream for 100+ languages
    // Break into chunks if text exceeds 200 characters to stay within single-request limit
    const chunks: string[] = [];
    const maxLen = 180;
    
    // Split on sentence boundaries
    const sentences = cleanText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [cleanText];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length < maxLen) {
        currentChunk += sentence;
      } else {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${targetLang}&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`Speech synthesis failed with status ${res.status}`);
      }

      const arrayBuf = await res.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuf));
    }

    const mergedBuffer = Buffer.concat(audioBuffers);
    const estimatedDuration = Math.max(1, Math.round(cleanText.split(/\s+/).length / 2.5));

    return {
      audioBuffer: mergedBuffer,
      mimeType: "audio/mpeg",
      duration: estimatedDuration,
      provider: this.name,
      voiceId: options?.voiceId || `${targetLang}-natural`,
    };
  }
}
