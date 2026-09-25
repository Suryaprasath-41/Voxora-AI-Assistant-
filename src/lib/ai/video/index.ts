import { VideoProvider } from "./types";
import { FFmpegVideoEngine } from "./ffmpeg-video-engine";

export * from "./types";
export * from "./ffmpeg-video-engine";

export function getVideoProvider(): VideoProvider {
  return new FFmpegVideoEngine();
}
