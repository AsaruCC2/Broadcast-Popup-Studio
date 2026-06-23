import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname, resolve} from "node:path";
import {spawn, spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dataRoot = resolve(process.env.BPS_DATA_ROOT || root);
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const csvPath = resolve(root, args[0] || "input/script.csv");
const audioPath = resolve(root, args[1] || findDefaultAudio());
const outputPath = resolve(root, args[2] || "output/broadcast-popup.mp4");
const width = Number(process.env.WIDTH || 1920);
const height = Number(process.env.HEIGHT || 1080);
const fps = Number(process.env.FPS || 30);
const subtitleLead = normalizeSubtitleLead(process.env.SUBTITLE_LEAD || 0);
const subtitleStyle = normalizeSubtitleStyle(process.env.SUBTITLE_STYLE || "card");
const backgroundMode = normalizeBackgroundMode(process.env.BACKGROUND_MODE || "grid");
const backgroundColor = normalizeHexColor(process.env.BACKGROUND_COLOR || "#202124");
const backgroundScale = normalizeBackgroundScale(process.env.BACKGROUND_SCALE || 100);
const backgroundImagePath = resolve(root, process.env.BACKGROUND_IMAGE || "input/background.png");
const timedBackgrounds = normalizeTimedBackgrounds(process.env.TIMED_BACKGROUNDS || "[]");
const shouldReportProgress = process.env.RENDER_PROGRESS === "1";
const fontsDir = findFontsDir();
const subtitleFontName = findSubtitleFontName();
const ffmpegPath = findFfmpeg();
let ffmpegChild = null;
let stopRequested = false;

process.on("SIGTERM", requestStop);
process.on("SIGINT", requestStop);

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

const renderDataPath = resolve(dataRoot, "output/render-lines.json");
writeFileSync(renderDataPath, JSON.stringify({lines, width, height, fps, subtitleLead, subtitleStyle, backgroundMode, backgroundColor, backgroundScale, timedBackgrounds}, null, 2), "utf8");
const assPath = resolve(dataRoot, "output/render-popup.ass");
writeFileSync(assPath, buildAss(lines, {width, height, subtitleLead, subtitleStyle}), "utf8");

const audioDuration = getAudioDuration(ffmpegPath, audioPath);
const subtitleDuration = Math.max(...lines.map((line) => shiftSubtitleTime(line.end, subtitleLead)), 1);
const duration = Math.max(audioDuration || 0, subtitleDuration);
const signalHeights = [
  10, 18, 28, 14, 24, 16, 12, 30, 18, 10, 14, 24,
  16, 20, 28, 12, 18, 22, 10, 30, 16, 20, 12, 26,
  18, 14, 24, 10, 28, 16, 12, 22, 18, 10, 20, 14
];

console.log(`CSV: ${relative(csvPath)}`);
console.log(`Audio: ${relative(audioPath)}`);
console.log(`Rows: ${lines.length}`);
console.log(`Subtitle lead: ${subtitleLead.toFixed(1)}s`);
console.log(`Subtitle style: ${subtitleStyle}`);
console.log(`Background: ${backgroundMode}`);
console.log(`Background scale: ${backgroundScale}%`);
console.log(`Timed backgrounds: ${timedBackgrounds.length}`);
console.log(`Duration: ${duration.toFixed(2)}s`);
console.log(`FFmpeg: ${ffmpegPath}`);
console.log(`Output: ${relative(outputPath)}`);
console.log("Rendering...");

const renderInput = buildVideoInputArgs();
const visualInputCount = 1 + timedBackgrounds.length;
const visualFilter = buildVisualFilter();
const filter = [
  ...visualFilter.filters,
  `[${visualFilter.outputLabel}]ass=${escapeFilterPath(assPath)}:fontsdir=${escapeFilterPath(fontsDir)}[v]`,
].join(";");

const result = await runFfmpeg(
  ffmpegPath,
  [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostats",
    "-progress",
    "pipe:1",
    ...renderInput,
    "-i",
    audioPath,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    `${visualInputCount}:a`,
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
  duration
);

if (result.error) fail(result.error.message);
if (stopRequested) process.exit(130);
if (result.status !== 0) {
  const detail = result.stderr?.trim();
  fail(detail || `FFmpeg exited with status ${result.status}`);
}

console.log(`Done: ${relative(outputPath)}`);

function requestStop() {
  stopRequested = true;
  if (ffmpegChild && !ffmpegChild.killed) {
    ffmpegChild.kill("SIGTERM");
    setTimeout(() => {
      if (ffmpegChild && !ffmpegChild.killed) ffmpegChild.kill("SIGKILL");
    }, 3000).unref();
    return;
  }
  process.exit(130);
}

function runFfmpeg(ffmpeg, ffmpegArgs, totalDuration) {
  return new Promise((resolve) => {
    const progressState = {};
    let progressBuffer = "";
    let stderr = "";
    let lastProgressReport = 0;

    ffmpegChild = spawn(ffmpeg, ffmpegArgs, {
      cwd: root,
      env: {
        ...process.env,
        WIDTH: String(width),
        HEIGHT: String(height),
        FPS: String(fps),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    ffmpegChild.stdout.on("data", (chunk) => {
      progressBuffer += chunk.toString();
      const lines = progressBuffer.split(/\r?\n/);
      progressBuffer = lines.pop() || "";

      for (const line of lines) {
        handleFfmpegProgressLine(line.trim(), progressState, totalDuration, (payload) => {
          const now = Date.now();
          if (payload.progress >= 1 || now - lastProgressReport > 450) {
            lastProgressReport = now;
            reportProgress(payload);
          }
        });
      }
    });

    ffmpegChild.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
      if (stderr.length > 20000) stderr = stderr.slice(-20000);
    });

    ffmpegChild.on("error", (error) => {
      resolve({status: 1, error, stderr});
    });

    ffmpegChild.on("close", (status) => {
      ffmpegChild = null;
      if (progressBuffer.trim()) {
        handleFfmpegProgressLine(progressBuffer.trim(), progressState, totalDuration, reportProgress);
      }
      resolve({status, stderr});
    });
  });
}

function handleFfmpegProgressLine(line, state, totalDuration, onProgress) {
  if (!line || !line.includes("=")) return;
  const separator = line.indexOf("=");
  const key = line.slice(0, separator);
  const value = line.slice(separator + 1);
  state[key] = value;

  if (key !== "progress") return;
  if (stopRequested && value === "end") return;

  const outTime = parseFfmpegOutTime(state.out_time)
    || parseFfmpegMicroseconds(state.out_time_us)
    || parseFfmpegMicroseconds(state.out_time_ms);
  const speed = parseFfmpegSpeed(state.speed);
  const progress = value === "end"
    ? 1
    : clamp(outTime / Math.max(totalDuration, 0.001), 0, 0.999);

  onProgress({
    progress,
    outTimeSeconds: outTime,
    durationSeconds: totalDuration,
    speed,
  });
}

function parseFfmpegOutTime(value) {
  const input = String(value || "").trim();
  const match = input.match(/^(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function parseFfmpegMicroseconds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number / 1_000_000 : 0;
}

function parseFfmpegSpeed(value) {
  const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)x$/);
  if (!match) return null;
  const speed = Number(match[1]);
  return Number.isFinite(speed) && speed > 0 ? speed : null;
}

function reportProgress(payload) {
  if (!shouldReportProgress) return;
  console.log(`PROGRESS ${JSON.stringify(payload)}`);
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  try {
    const bundled = require("ffmpeg-static");
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    // Optional desktop dependency; CLI usage can still rely on system FFmpeg.
  }

  const system = spawnSync("zsh", ["-lc", "command -v ffmpeg"], {encoding: "utf8"});
  const systemPath = system.stdout?.trim();
  if (system.status === 0 && systemPath) {
    return systemPath;
  }

  const pythonCandidates = [
    "/opt/anaconda3/bin/python3",
    "python3",
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

function findFontsDir() {
  const candidates = [
    process.env.FONTS_DIR,
    process.platform === "win32" ? "C:\\Windows\\Fonts" : "",
    "/System/Library/Fonts",
    "/Library/Fonts",
    "/usr/share/fonts",
  ].filter(Boolean);

  return candidates.find((path) => existsSync(path)) || candidates[0] || "";
}

function findSubtitleFontName() {
  if (process.env.SUBTITLE_FONT) return process.env.SUBTITLE_FONT;
  if (process.platform === "win32") return "Microsoft YaHei";
  if (process.platform === "darwin") return "Hiragino Sans GB";
  return "Noto Sans CJK SC";
}

function getAudioDuration(ffmpeg, audio) {
  const result = spawnSync(ffmpeg, ["-i", audio], {encoding: "utf8"});
  const text = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function buildVideoInputArgs() {
  const args = [];

  if (backgroundMode === "image" && existsSync(backgroundImagePath)) {
    args.push(
      "-loop",
      "1",
      "-framerate",
      String(fps),
      "-i",
      backgroundImagePath,
    );
  } else {
    args.push(
      "-f",
      "lavfi",
      "-i",
      `color=c=${hexToFfmpegColor(backgroundMode === "color" ? backgroundColor : "#202124")}:s=${width}x${height}:r=${fps}:d=${duration.toFixed(3)}`,
    );
  }

  for (const item of timedBackgrounds) {
    args.push(
      "-loop",
      "1",
      "-framerate",
      String(fps),
      "-t",
      getTimedBackgroundDuration(item).toFixed(3),
      "-i",
      item.path,
    );
  }

  return args;
}

function buildVisualFilter() {
  const filters = [`${buildBackgroundFilter()}[basebg]`];
  let currentLabel = "basebg";

  timedBackgrounds.forEach((item, index) => {
    const imageLabel = `timedbg${index}`;
    const outputLabel = `timedmix${index}`;
    const clipDuration = getTimedBackgroundDuration(item);
    const fade = Math.min(0.45, Math.max(0.15, clipDuration / 3));
    const fadeOutStart = Math.max(0, clipDuration - fade);
    const inputIndex = 1 + index;
    filters.push(
      `[${inputIndex}:v]${[
        buildTimedBackgroundFitFilters(item.scale),
        "setsar=1",
        "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.20:t=fill",
        "format=rgba",
        `fade=t=in:st=0:d=${fade.toFixed(3)}:alpha=1`,
        `fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fade.toFixed(3)}:alpha=1`,
        `setpts=PTS-STARTPTS+${item.start.toFixed(3)}/TB`,
      ].join(",")}[${imageLabel}]`
    );
    filters.push(
      `[${currentLabel}][${imageLabel}]overlay=x=0:y=0:eof_action=pass:repeatlast=0:enable='between(t,${item.start.toFixed(3)},${item.end.toFixed(3)})'[${outputLabel}]`
    );
    currentLabel = outputLabel;
  });

  return {filters, outputLabel: currentLabel};
}

function getTimedBackgroundDuration(item) {
  return Math.max(0.1, item.end - item.start);
}

function buildBackgroundFilter() {
  const signal = buildSignalDrawboxes(width, height);

  if (backgroundMode === "image" && existsSync(backgroundImagePath)) {
    const imageFit = buildImageFitFilters();
    return [
      `[0:v]${imageFit}`,
      "setsar=1",
      "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.28:t=fill",
      signal,
    ].join(",");
  }

  if (backgroundMode === "color") {
    return `[0:v]${signal}`;
  }

  return `[0:v]drawgrid=w=64:h=64:t=1:c=0xFFFFFF12,${signal}`;
}

function buildTimedBackgroundFitFilters(scale) {
  const factor = normalizeBackgroundScale(scale) / 100;
  const base = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
  ];

  if (factor === 1) return base.join(",");

  if (factor > 1) {
    return [
      ...base,
      `scale=iw*${factor.toFixed(2)}:ih*${factor.toFixed(2)}`,
      `crop=${width}:${height}`,
    ].join(",");
  }

  return [
    ...base,
    `scale=iw*${factor.toFixed(2)}:ih*${factor.toFixed(2)}`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black@0`,
  ].join(",");
}

function buildImageFitFilters() {
  const factor = backgroundScale / 100;
  const base = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
  ];

  if (factor === 1) return base.join(",");

  if (factor > 1) {
    return [
      ...base,
      `scale=iw*${factor.toFixed(2)}:ih*${factor.toFixed(2)}`,
      `crop=${width}:${height}`,
    ].join(",");
  }

  return [
    ...base,
    `scale=iw*${factor.toFixed(2)}:ih*${factor.toFixed(2)}`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${hexToFfmpegColor(backgroundColor)}`,
  ].join(",");
}

function buildSignalDrawboxes(width, height) {
  const signalWidth = Math.round(width * 0.72);
  const left = Math.round((width - signalWidth) / 2);
  const centerY = Math.round(height * 0.84);
  const baselineHeight = Math.max(1, Math.round(height / 900));
  const barWidth = Math.max(3, Math.round(width * 0.003));
  const maxBarHeight = Math.max(10, Math.round(height * 0.035));
  const step = signalWidth / Math.max(1, signalHeights.length - 1);

  const baseline = `drawbox=x=${left}:y=${centerY}:w=${signalWidth}:h=${baselineHeight}:color=0xFFFFFF22:t=fill`;
  const bars = signalHeights.map((value, index) => {
    const barHeight = Math.max(2, Math.round(maxBarHeight * value / 100));
    const x = Math.round(left + index * step - barWidth / 2);
    const y = Math.round(centerY - barHeight / 2);
    return `drawbox=x=${x}:y=${y}:w=${barWidth}:h=${barHeight}:color=0xFFFFFF3A:t=fill`;
  });

  return [baseline, ...bars].join(",");
}

function buildAss(lines, config) {
  const {width, height, subtitleLead, subtitleStyle} = config;
  const fontName = subtitleFontName;
  const styleConfig = getSubtitleStyleConfig(subtitleStyle);
  const zhSize = Math.round(Number(process.env.SUBTITLE_SIZE || width / 42));
  const popupMaxWidth = Math.round(width * styleConfig.maxWidthRatio);
  const popupMinWidth = Math.round(width * styleConfig.minWidthRatio);
  const centerX = Math.round(width / 2);
  const centerY = Math.round(height * 0.53);
  const maxCharsPerLine = Math.max(12, Math.floor(popupMaxWidth / (zhSize * 1.04)));

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: PopupText,${fontName},${zhSize},&H00181818,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: PopupShape,Arial,10,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = lines.map((line) => {
    const shiftedLine = {
      ...line,
      start: shiftSubtitleTime(line.start, subtitleLead),
      end: shiftSubtitleTime(line.end, subtitleLead),
    };
    if (shiftedLine.end <= shiftedLine.start) return "";

    const wrapped = wrapText(line.zh || line.ja, maxCharsPerLine);
    const wrappedLines = wrapped.split("\n").filter(Boolean);
    const box = getPopupBox(wrappedLines, {
      centerX,
      centerY,
      height,
      popupMaxWidth,
      popupMinWidth,
      zhSize,
      styleConfig,
    });
    const zh = assText(wrapped);

    const shadowOffset = Math.round(zhSize * styleConfig.shadowRatio);
    const border = Math.max(4, Math.round(width / 480));
    const shadow = shapeDialogue(0, shiftedLine, {
      left: box.left + shadowOffset,
      top: box.top + shadowOffset,
      right: box.right + shadowOffset,
      bottom: box.bottom + shadowOffset,
      color: "&H000000&",
      alpha: styleConfig.shadowAlpha,
    });
    const outline = shapeDialogue(1, shiftedLine, {
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom,
      color: "&H262220&",
      alpha: "&H00&",
    });
    const fill = shapeDialogue(2, shiftedLine, {
      left: box.left + border,
      top: box.top + border,
      right: box.right - border,
      bottom: box.bottom - border,
      color: styleConfig.fillColor,
      alpha: "&H00&",
    });
    const accent = styleConfig.accentColor
      ? shapeDialogue(3, shiftedLine, {
        left: box.left + Math.round((box.right - box.left) * 0.16),
        top: box.top,
        right: box.right - Math.round((box.right - box.left) * 0.16),
        bottom: box.top + Math.max(border * 2, Math.round(zhSize * 0.16)),
        color: styleConfig.accentColor,
        alpha: "&H00&",
      })
      : "";
    const text = [
      `{\\an5\\pos(${centerX},${box.textY})\\fad(180,180)\\fscx92\\fscy92\\t(0,260,\\fscx100\\fscy100)}`,
      `{\\fs${zhSize}\\b1\\c&H00181818&}${zh}`,
    ].join("");
    return [
      shadow,
      outline,
      fill,
      accent,
      `Dialogue: 4,${assTime(shiftedLine.start)},${assTime(shiftedLine.end)},PopupText,,0,0,0,,${text}`,
    ].join("\n");
  }).filter(Boolean).join("\n");

  return header + events + "\n";
}

function getSubtitleStyleConfig(style) {
  if (style === "note") {
    return {
      maxWidthRatio: 0.76,
      minWidthRatio: 0.28,
      paddingXRatio: 1.02,
      paddingYRatio: 0.72,
      shadowRatio: 0.25,
      shadowAlpha: "&H68&",
      fillColor: "&HBDF2FF&",
      accentColor: "&H4F5DDF&",
    };
  }

  return {
    maxWidthRatio: 0.82,
    minWidthRatio: 0.30,
    paddingXRatio: 0.92,
    paddingYRatio: 0.58,
    shadowRatio: 0.18,
    shadowAlpha: "&H78&",
    fillColor: "&HF1F9FF&",
    accentColor: "",
  };
}

function getPopupBox(lines, config) {
  const {
    centerX,
    centerY,
    height,
    popupMaxWidth,
    popupMinWidth,
    zhSize,
    styleConfig,
  } = config;
  const maxUnits = Math.max(...lines.map(measureLineUnits), 1);
  const paddingX = Math.round(zhSize * styleConfig.paddingXRatio);
  const paddingY = Math.round(zhSize * styleConfig.paddingYRatio);
  const lineHeight = Math.round(zhSize * 1.24);
  const textWidth = Math.round(maxUnits * zhSize * 0.98);
  const boxWidth = Math.min(popupMaxWidth, Math.max(popupMinWidth, textWidth + paddingX * 2));
  const boxHeight = Math.round(lines.length * lineHeight + paddingY * 2);
  const safeTop = Math.round(height * 0.16);
  const safeBottom = Math.round(height * 0.88);
  const top = clamp(Math.round(centerY - boxHeight / 2), safeTop, Math.max(safeTop, safeBottom - boxHeight));
  const bottom = top + boxHeight;
  const left = Math.round(centerX - boxWidth / 2);
  const right = left + boxWidth;

  return {
    left,
    top,
    right,
    bottom,
    textY: Math.round((top + bottom) / 2),
  };
}

function measureLineUnits(value) {
  let units = 0;

  for (const char of String(value)) {
    if (/\s/u.test(char)) {
      units += 0.35;
    } else if (/[A-Za-z0-9]/u.test(char)) {
      units += 0.58;
    } else if (/[.,:;'"!?，。！？、；：……（）()[\]{}]/u.test(char)) {
      units += 0.72;
    } else {
      units += 1;
    }
  }

  return units;
}

function shapeDialogue(layer, line, shape) {
  const {left, top, right, bottom, color, alpha} = shape;
  const points = [
    `m ${left} ${top}`,
    `l ${right} ${top}`,
    `l ${right} ${bottom}`,
    `l ${left} ${bottom}`,
    `l ${left} ${top}`,
  ].join(" ");
  const tags = `{\\an7\\pos(0,0)\\fad(180,180)\\p1\\c${color}\\alpha${alpha}}`;
  return `Dialogue: ${layer},${assTime(line.start)},${assTime(line.end)},PopupShape,,0,0,0,,${tags}${points}{\\p0}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSubtitleLead(value) {
  const lead = Number(value);
  return Number.isFinite(lead) ? clamp(Math.round(lead * 10) / 10, -5, 5) : 0;
}

function normalizeSubtitleStyle(value) {
  return ["card", "note"].includes(value) ? value : "card";
}

function normalizeBackgroundMode(value) {
  return ["grid", "color", "image"].includes(value) ? value : "grid";
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : "#202124";
}

function normalizeBackgroundScale(value) {
  const scale = Number(value);
  return Number.isFinite(scale) ? clamp(Math.round(scale), 80, 220) : 100;
}

function normalizeTimedBackgrounds(value) {
  let items = [];
  try {
    items = JSON.parse(String(value || "[]"));
  } catch {
    items = [];
  }
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const start = Number(item?.start);
      const end = Number(item?.end);
      const relativePath = String(item?.path || "").replace(/^\.\//, "");
      const path = /^input\/timed-background-[^/]+\.(png|jpe?g|webp)$/i.test(relativePath)
        ? resolve(dataRoot, relativePath)
        : "";

      return {
        path,
        start: Number.isFinite(start) ? Math.max(0, Math.round(start * 10) / 10) : 0,
        end: Number.isFinite(end) ? Math.max(0, Math.round(end * 10) / 10) : 0,
        scale: normalizeBackgroundScale(item?.scale),
      };
    })
    .filter((item) => item.path && existsSync(item.path) && item.end > item.start)
    .slice(0, 12);
}

function hexToFfmpegColor(value) {
  return `0x${normalizeHexColor(value).slice(1)}`;
}

function shiftSubtitleTime(seconds, lead) {
  return Math.max(0, seconds - lead);
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
  const normalized = String(path).replaceAll("\\", "/");
  return `'${normalized
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,")}'`;
}

function findDefaultAudio() {
  const names = ["input/audio.m4a", "input/audio.mp3", "input/audio.wav", "input/audio.aac", "input/audio.mp4"];
  const found = names.find((name) => existsSync(resolve(dataRoot, name)));
  return found ? resolve(dataRoot, found) : resolve(dataRoot, "input/audio.m4a");
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
