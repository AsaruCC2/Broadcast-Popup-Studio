import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const args = process.argv.slice(2);
const csvPath = resolve(root, args[0] || "input/script.csv");
const audioPath = resolve(root, args[1] || findDefaultAudio());
const outputPath = resolve(root, args[2] || "output/broadcast-popup.mp4");
const width = Number(process.env.WIDTH || 1920);
const height = Number(process.env.HEIGHT || 1080);
const fps = Number(process.env.FPS || 30);
const fontsDir = "/System/Library/Fonts";
const ffmpegPath = findFfmpeg();

if (!existsSync(csvPath)) {
  fail(`CSV not found: ${csvPath}`);
}

if (!existsSync(audioPath)) {
  fail(`Audio not found: ${audioPath}\nPut audio at input/audio.m4a or input/audio.mp3, or pass a path: npm run render -- input/script.csv path/to/audio.m4a`);
}

mkdirSync(dirname(outputPath), {recursive: true});

const lines = parseCsv(readText(csvPath))
  .map((line) => {
    const rawJa = cleanImportedText(line.ja || "");
    const rawZh = cleanImportedText(line.zh || "");
    const importedTranslation = !rawZh && looksLikeImportedTranslation(rawJa);

    return {
      start: parseTime(line.start),
      end: parseTime(line.end),
      ja: importedTranslation ? "" : rawJa,
      zh: importedTranslation ? rawJa : rawZh,
      speaker: line.speaker || "RADIO",
    };
  })
  .filter((line) => line.end > line.start && (line.ja || line.zh))
  .sort((a, b) => a.start - b.start);

if (lines.length === 0) {
  fail(`No usable rows found in ${csvPath}`);
}

const renderDataPath = resolve(root, "output/render-lines.json");
writeFileSync(renderDataPath, JSON.stringify({lines, width, height, fps}, null, 2), "utf8");
const assPath = resolve(root, "output/render-popup.ass");
writeFileSync(assPath, buildAss(lines, {width, height}), "utf8");

const audioDuration = getAudioDuration(ffmpegPath, audioPath);
const subtitleDuration = Math.max(...lines.map((line) => line.end), 1);
const duration = Math.max(audioDuration || 0, subtitleDuration);

console.log(`CSV: ${relative(csvPath)}`);
console.log(`Audio: ${relative(audioPath)}`);
console.log(`Rows: ${lines.length}`);
console.log(`Duration: ${duration.toFixed(2)}s`);
console.log(`FFmpeg: ${ffmpegPath}`);
console.log(`Output: ${relative(outputPath)}`);
console.log("Rendering...");

const filter = [
  `[0:v]drawgrid=w=64:h=64:t=1:c=0xFFFFFF12[grid]`,
  `[1:a]showwaves=s=${Math.round(width * 0.82)}x${Math.round(height * 0.12)}:mode=line:colors=0xFFFFFF70:r=${fps},format=rgba[waves]`,
  `[grid][waves]overlay=(W-w)/2:H-${Math.round(height * 0.20)}[wavebg]`,
  `[wavebg]ass=${escapeFilterPath(assPath)}:fontsdir=${escapeFilterPath(fontsDir)}[v]`,
].join(";");

const result = spawnSync(
  ffmpegPath,
  [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x202124:s=${width}x${height}:r=${fps}:d=${duration.toFixed(3)}`,
    "-i",
    audioPath,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-t",
    duration.toFixed(3),
    outputPath,
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      WIDTH: String(width),
      HEIGHT: String(height),
      FPS: String(fps),
    },
  }
);

if (result.error) {
  fail(result.error.message);
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Done: ${relative(outputPath)}`);

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  const system = spawnSync("zsh", ["-lc", "command -v ffmpeg"], {encoding: "utf8"});
  const systemPath = system.stdout?.trim();
  if (system.status === 0 && systemPath) {
    return systemPath;
  }

  const pythonCandidates = [
    "/opt/anaconda3/bin/python3",
    "python3",
    "/Users/maomao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  ];

  for (const python of pythonCandidates) {
    const result = spawnSync(
      python,
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      {encoding: "utf8"}
    );
    const found = result.stdout?.trim();
    if (result.status === 0 && found && existsSync(found)) {
      return found;
    }
  }

  fail("FFmpeg not found. Install once with: /opt/anaconda3/bin/python3 -m pip install --user imageio-ffmpeg");
}

function getAudioDuration(ffmpeg, audio) {
  const result = spawnSync(ffmpeg, ["-i", audio], {encoding: "utf8"});
  const text = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function buildAss(lines, config) {
  const {width, height} = config;
  const fontName = "Hiragino Sans GB";
  const zhSize = Math.round(Number(process.env.SUBTITLE_SIZE || width / 54));
  const marginV = Math.round(height * 0.30);
  const popupWidth = Math.round(width * 0.76);
  const leftMargin = Math.round((width - popupWidth) / 2);
  const maxCharsPerLine = Math.max(10, Math.floor(popupWidth / (zhSize * 1.25)));

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Popup,${fontName},${zhSize},&H00181818,&H000000FF,&H00EAF4FF,&H55181818,-1,0,0,0,100,100,0,0,3,5,8,5,${leftMargin},${leftMargin},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = lines.map((line) => {
    const zh = assText(wrapText(line.zh || line.ja, maxCharsPerLine));
    const text = [
      `{\\an5\\pos(${Math.round(width / 2)},${Math.round(height / 2)})\\fad(180,180)\\fscx92\\fscy92\\t(0,260,\\fscx100\\fscy100)}`,
      `{\\fs${zhSize}\\b1\\c&H00181818&}${zh}`,
    ].join("");
    return `Dialogue: 0,${assTime(line.start)},${assTime(line.end)},Popup,,0,0,0,,${text}`;
  }).join("\n");

  return header + events + "\n";
}

function wrapText(value, maxChars) {
  const input = String(value).replace(/\s+/g, " ").trim();
  if (!input) return "";

  const chunks = [];
  let line = "";

  for (const char of input) {
    line += char;

    if (line.length >= maxChars || /[。！？!?、，；;]/u.test(char) && line.length >= Math.floor(maxChars * 0.62)) {
      chunks.push(line.trim());
      line = "";
    }
  }

  if (line.trim()) chunks.push(line.trim());
  return chunks.join("\n");
}

function assText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("\r\n", "\\N")
    .replaceAll("\n", "\\N")
    .replaceAll("\r", "\\N");
}

function cleanImportedText(value) {
  let text = String(value ?? "").trim();
  if (text.startsWith(",")) text = text.slice(1).trim();
  if (text.length >= 2 && text.startsWith("\"") && text.endsWith("\"")) {
    text = text.slice(1, -1).replaceAll("\"\"", "\"").trim();
  }
  return text;
}

function looksLikeImportedTranslation(value) {
  return /^,\s*"/.test(String(value)) || /[這这是我你他她它們们會会讓让與与對对為为個个說说]/.test(value);
}

function assTime(seconds) {
  const value = Math.max(0, seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  const centis = Math.floor((value - Math.floor(value)) * 100);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

function escapeFilterPath(path) {
  return path
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,");
}

function findDefaultAudio() {
  const names = ["input/audio.m4a", "input/audio.mp3", "input/audio.wav", "input/audio.aac", "input/audio.mp4"];
  const found = names.find((name) => existsSync(resolve(root, name)));
  return found || "input/audio.m4a";
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function parseCsv(text) {
  const rows = readCsvRows(text.trim());
  if (rows.length <= 1) return [];

  const headers = rows[0].map((header) => header.trim());
  const index = Object.fromEntries(headers.map((header, column) => [header, column]));

  for (const required of ["start", "end", "ja", "zh"]) {
    if (!(required in index)) {
      fail(`CSV is missing required column: ${required}`);
    }
  }

  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => Object.fromEntries(headers.map((header, column) => [header, row[column] || ""])));
}

function readCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function parseTime(value) {
  const input = String(value).trim();
  if (!input.includes(":")) return Number(input) || 0;
  const parts = input.split(":");
  const seconds = Number(parts.pop()) || 0;
  const minutes = Number(parts.pop()) || 0;
  const hours = Number(parts.pop()) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function relative(path) {
  return path.startsWith(root) ? path.slice(root.length) : path;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
