import { TranscriptionProvider } from "./types";
import { GroqWhisperProvider } from "./groq";
import { OpenAIWhisperProvider } from "./whisper";
import { LocalFallbackTranscriptionProvider } from "./local";

export * from "./types";
export * from "./whisper";
export * from "./groq";
export * from "./local";

export function getTranscriptionProvider(): TranscriptionProvider {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
    return new GroqWhisperProvider();
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    return new OpenAIWhisperProvider();
  }
  return new LocalFallbackTranscriptionProvider();
}
