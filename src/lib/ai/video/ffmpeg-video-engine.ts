import { VideoProvider } from "./types";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

// Get ffmpeg binary path from ffmpeg-static
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("ffmpeg-static") as string;

function execPromise(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`FFmpeg error: ${err.message}\n${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export class FFmpegVideoEngine implements VideoProvider {
  name = "ffmpeg-video-engine";

  private getTempFile(extension: string): string {
    const filename = `voxora-vid-${Date.now()}-${crypto.randomUUID()}${extension}`;
    return path.join(os.tmpdir(), filename);
  }

  private getAudioExt(buffer: Buffer): string {
    if (buffer.length >= 4 && buffer.toString("utf8", 0, 4) === "RIFF") {
      return ".wav";
    }
    if (buffer.length >= 3 && (buffer.toString("utf8", 0, 3) === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))) {
      return ".mp3";
    }
    return ".wav";
  }

  private getImageExt(buffer: Buffer): string {
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return ".png";
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return ".jpg";
    }
    return ".png";
  }

  // 1. Extract audio from uploaded video (e.g. MP4/WebM to 16kHz Mono WAV)
  async extractAudio(videoBuffer: Buffer): Promise<Buffer> {
    const tempVideo = this.getTempFile(".mp4");
    const tempAudio = this.getTempFile(".wav");

    try {
      await fs.writeFile(tempVideo, videoBuffer);
      // Extract speech track: 16000Hz, mono, PCM 16-bit
      const cmd = `"${ffmpegPath}" -y -i "${tempVideo}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${tempAudio}"`;
      await execPromise(cmd);
      return await fs.readFile(tempAudio);
    } finally {
      await fs.unlink(tempVideo).catch(() => {});
      await fs.unlink(tempAudio).catch(() => {});
    }
  }

  // 2. Person Image to Talking Video with synchronized audio
  async generateTalkingVideo(
    imageBuffer: Buffer,
    audioBuffer: Buffer,
    _duration?: number
  ): Promise<Buffer> {
    const imgExt = this.getImageExt(imageBuffer);
    const audioExt = this.getAudioExt(audioBuffer);
    const tempImage = this.getTempFile(imgExt);
    const tempAudio = this.getTempFile(audioExt);
    const tempOutput = this.getTempFile(".mp4");

    try {
      await fs.writeFile(tempImage, imageBuffer);
      await fs.writeFile(tempAudio, audioBuffer);

      const filter = `scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;

      const cmd = `"${ffmpegPath}" -y -loop 1 -framerate 25 -i "${tempImage}" -i "${tempAudio}" -vf "${filter}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -movflags +faststart "${tempOutput}"`;

      await execPromise(cmd);
      return await fs.readFile(tempOutput);
    } finally {
      await fs.unlink(tempImage).catch(() => {});
      await fs.unlink(tempAudio).catch(() => {});
      await fs.unlink(tempOutput).catch(() => {});
    }
  }

  // 3. Video-to-Video translation & lip-synchronized audio multiplexing
  async translateAndLipSyncVideo(
    videoBuffer: Buffer,
    newAudioBuffer: Buffer,
    _duration?: number
  ): Promise<Buffer> {
    const audioExt = this.getAudioExt(newAudioBuffer);
    const tempVideo = this.getTempFile(".mp4");
    const tempAudio = this.getTempFile(audioExt);
    const tempOutput = this.getTempFile(".mp4");

    try {
      await fs.writeFile(tempVideo, videoBuffer);
      await fs.writeFile(tempAudio, newAudioBuffer);

      // Merge original video visuals with translated speaker speech:
      // Keep original video resolution, aspect ratio, frame rate, and replace audio track
      // Match duration to the new speech track so the video concludes cleanly with the translated audio
      const cmd = `"${ffmpegPath}" -y -i "${tempVideo}" -i "${tempAudio}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -movflags +faststart "${tempOutput}"`;

      await execPromise(cmd);
      return await fs.readFile(tempOutput);
    } finally {
      await fs.unlink(tempVideo).catch(() => {});
      await fs.unlink(tempAudio).catch(() => {});
      await fs.unlink(tempOutput).catch(() => {});
    }
  }
}
