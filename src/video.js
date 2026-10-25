// Video converter and probe. Thin wrapper over ffmpeg/ffprobe so agents get the right flags every time.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, extname } from "node:path";

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.error) throw new Error(`${cmd} not found. Install ffmpeg (https://ffmpeg.org/download.html) and retry.`);
  return r;
};

export function probeVideo(file) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,duration:format=duration,size", "-of", "json", file]);
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr.trim().split("\n").pop()}`);
  const j = JSON.parse(r.stdout);
  const s = j.streams?.[0] ?? {};
  const [n, d] = String(s.r_frame_rate ?? "0/1").split("/").map(Number);
  return { codec: s.codec_name, width: s.width, height: s.height, fps: d ? Math.round((n / d) * 100) / 100 : undefined, seconds: +(s.duration ?? j.format?.duration ?? 0), bytes: +(j.format?.size ?? 0) };
}

// Output format follows the extension: .webm (VP9, plays in headless Chromium and browsers), .mp4 (H.264, plays everywhere
// except headless Chromium), .gif (palette-optimised). Options: width (keeps aspect), fps, start, duration, crf, mute.
export function convertVideo(input, output, { width, fps, start, duration, crf, alpha } = {}) {
  mkdirSync(dirname(output), { recursive: true });
  const ext = extname(output).toLowerCase();
  const filters = [];
  if (fps) filters.push(`fps=${fps}`);
  if (width) filters.push(`scale=${width}:-2:flags=lanczos`);
  const pre = [...(start != null ? ["-ss", String(start)] : []), ...(duration != null ? ["-t", String(duration)] : [])];
  let args;
  if (ext === ".webm") args = ["-c:v", "libvpx-vp9", "-pix_fmt", alpha ? "yuva420p" : "yuv420p", "-b:v", "0", "-crf", String(crf ?? 30), "-an", ...(filters.length ? ["-vf", filters.join(",")] : [])];
  else if (ext === ".mp4") args = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", String(crf ?? 20), "-movflags", "+faststart", "-an", ...(filters.length ? ["-vf", filters.join(",")] : [])];
  else if (ext === ".gif") args = ["-vf", [...filters.length ? [filters.join(",")] : [`fps=${fps ?? 15}`], "split[a][b];[a]palettegen[p];[b][p]paletteuse"].join(",")];
  else throw new Error(`Unsupported output "${ext}". Use .webm, .mp4 or .gif.`);
  const r = run("ffmpeg", ["-y", "-v", "error", ...pre, "-i", input, ...args, output]);
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim().split("\n").slice(-2).join(" ")}`);
  return probeVideo(output);
}
