const DEFAULT_TIMED_TEXT = `00:00:00.600 YouTube字幕の1行目をここに入れます。
00:00:03.700 YouTube字幕の2行目をここに入れます。
00:00:07.700 YouTube字幕の3行目をここに入れます。`;

const DEFAULT_LINES = [
  {
    start: 0.6,
    end: 3.3,
    ja: "こんばんは。今夜も番組を始めていきます。",
    zh: "晚上好。今晚的节目也要开始了。",
    speaker: "MC"
  },
  {
    start: 3.7,
    end: 7.2,
    ja: "まずはリスナーの皆さんから届いたメッセージです。",
    zh: "首先是听众们发来的留言。",
    speaker: "MC"
  },
  {
    start: 7.7,
    end: 11.6,
    ja: "最近、朝の空気が少しずつ変わってきましたね。",
    zh: "最近，早晨的空气一点点变得不一样了呢。",
    speaker: "MC"
  }
];

const TIME_PATTERN = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[\.,]\d{1,3})?`;
const timeRegex = new RegExp(TIME_PATTERN, "u");

const playButton = document.querySelector("#playButton");
const restartButton = document.querySelector("#restartButton");
const convertButton = document.querySelector("#convertButton");
const loadSampleButton = document.querySelector("#loadSampleButton");
const saveCsvButton = document.querySelector("#saveCsvButton");
const downloadCsvButton = document.querySelector("#downloadCsvButton");
const copyCsvButton = document.querySelector("#copyCsvButton");
const renderButton = document.querySelector("#renderButton");
const timedTextFileButton = document.querySelector("#timedTextFileButton");
const csvFileButton = document.querySelector("#csvFileButton");
const audioFileButton = document.querySelector("#audioFileButton");
const csvInput = document.querySelector("#csvInput");
const audioInput = document.querySelector("#audioInput");
const timedTextFileInput = document.querySelector("#timedTextFileInput");
const timedTextInput = document.querySelector("#timedTextInput");
const popupLayer = document.querySelector("#popupLayer");
const lineList = document.querySelector("#lineList");
const lineCount = document.querySelector("#lineCount");
const statusText = document.querySelector("#statusText");
const sourceStatus = document.querySelector("#sourceStatus");
const timeLabel = document.querySelector("#timeLabel");
const scrubber = document.querySelector("#scrubber");
const waveform = document.querySelector("#waveform");
const audio = document.querySelector("#audio");
const videoLink = document.querySelector("#videoLink");
const fileModeNotice = document.querySelector("#fileModeNotice");
const isFileMode = window.location.protocol === "file:";

let lines = DEFAULT_LINES;
let playing = false;
let currentTime = 0;
let startedAt = 0;
let pausedAt = 0;
let activeIndex = -1;
let audioReady = false;
let audioObjectUrl = "";

const barHeights = [
  22, 40, 64, 36, 70, 52, 28, 76, 48, 24, 42, 68,
  34, 58, 74, 32, 46, 62, 26, 80, 44, 60, 30, 72,
  50, 38, 66, 24, 78, 54, 36, 70, 46, 28, 56, 40
];

for (const height of barHeights) {
  const bar = document.createElement("span");
  bar.style.height = `${height}%`;
  waveform.append(bar);
}

audio.addEventListener("loadedmetadata", () => {
  audioReady = true;
  scrubber.max = String(getDuration());
  statusText.textContent = "音频已加载";
});

audio.addEventListener("error", () => {
  audioReady = false;
  statusText.textContent = "静音预览";
});

playButton.addEventListener("click", async () => {
  if (playing) {
    pause();
    return;
  }
  await play();
});

restartButton.addEventListener("click", () => {
  seek(0);
  if (playing && audioReady) audio.play();
});

scrubber.addEventListener("input", () => {
  seek(Number(scrubber.value));
});

timedTextFileButton.addEventListener("click", () => {
  timedTextFileInput.click();
});

csvFileButton.addEventListener("click", () => {
  csvInput.click();
});

audioFileButton.addEventListener("click", () => {
  audioInput.click();
});

timedTextFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  timedTextInput.value = await file.text();
  sourceStatus.textContent = file.name;
  convertTimedText();
});

csvInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  setLines(parseCsv(text));
  statusText.textContent = `已导入 ${file.name}`;
});

audioInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
  audioObjectUrl = URL.createObjectURL(file);
  audio.src = audioObjectUrl;
  audio.load();
  statusText.textContent = `已导入 ${file.name}`;
  await saveAudioToProject(file);
});

convertButton.addEventListener("click", convertTimedText);

loadSampleButton.addEventListener("click", () => {
  timedTextInput.value = DEFAULT_TIMED_TEXT;
  sourceStatus.textContent = "示例文本";
  convertTimedText();
});

saveCsvButton.addEventListener("click", async () => {
  try {
    await saveCsvToProject(true);
  } catch (error) {
    statusText.textContent = error.message || "保存失败";
  }
});

downloadCsvButton.addEventListener("click", () => {
  downloadText(buildCsv(lines), "script.csv", "text/csv;charset=utf-8");
  statusText.textContent = "CSV 已下载";
});

copyCsvButton.addEventListener("click", async () => {
  const csv = buildCsv(lines);
  try {
    await navigator.clipboard.writeText(csv);
    statusText.textContent = "CSV 已复制";
  } catch {
    downloadText(csv, "script.csv", "text/csv;charset=utf-8");
    statusText.textContent = "已改为下载 CSV";
  }
});

renderButton.addEventListener("click", async () => {
  await renderVideo();
});

lineList.addEventListener("click", (event) => {
  if (event.target.closest("input, textarea, button")) return;
  const item = event.target.closest(".line-item");
  if (!item) return;
  seek(Number(item.dataset.start || 0));
});

lineList.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.index);
  if (!field || !Number.isInteger(index) || !lines[index]) return;
  updateLine(index, field, event.target.value);
});

lineList.addEventListener("change", (event) => {
  const field = event.target.dataset.field;
  if (field !== "start" && field !== "end") return;
  lines.sort((a, b) => a.start - b.start);
  renderTimeline();
  renderFrame();
});

applyRuntimeModeNotice();
loadInitialData();
renderTimeline();
renderFrame();
requestAnimationFrame(tick);

async function loadInitialData() {
  try {
    const response = await fetch("./input/timed-text.txt", {cache: "no-store"});
    if (response.ok) {
      timedTextInput.value = await response.text();
      sourceStatus.textContent = "input/timed-text.txt";
    } else {
      timedTextInput.value = DEFAULT_TIMED_TEXT;
    }
  } catch {
    timedTextInput.value = DEFAULT_TIMED_TEXT;
  }

  try {
    const response = await fetch("./input/script.csv", {cache: "no-store"});
    if (!response.ok) throw new Error("CSV not found");
    const text = await response.text();
    setLines(parseCsv(text));
    statusText.textContent = "已读取 input/script.csv";
  } catch {
    setLines(DEFAULT_LINES);
    statusText.textContent = "使用内置示例台词";
  }

  applyRuntimeModeNotice();
}

function applyRuntimeModeNotice() {
  if (!isFileMode) return;
  if (fileModeNotice) fileModeNotice.hidden = false;
  statusText.textContent = "直接打开 index.html 时无法保存或导出；请双击 open-studio.command 打开完整功能";
}

function convertTimedText() {
  const nextLines = parseTimedText(timedTextInput.value);
  if (nextLines.length === 0) {
    statusText.textContent = "没有识别到时间戳";
    return;
  }
  setLines(nextLines);
  statusText.textContent = `已转换 ${nextLines.length} 句`;
}

function setLines(nextLines) {
  lines = nextLines.length > 0 ? nextLines : DEFAULT_LINES;
  lines.sort((a, b) => a.start - b.start);
  activeIndex = -1;
  scrubber.max = String(getDuration());
  renderTimeline();
  renderFrame();
}

async function play() {
  playing = true;
  playButton.textContent = "暂停";
  startedAt = performance.now() / 1000 - pausedAt;

  if (audioReady) {
    audio.currentTime = pausedAt;
    try {
      await audio.play();
    } catch {
      statusText.textContent = "浏览器拦截了音频播放";
    }
  }
}

function pause() {
  playing = false;
  playButton.textContent = "播放";
  pausedAt = currentTime;
  audio.pause();
}

function seek(time) {
  currentTime = clamp(time, 0, getDuration());
  pausedAt = currentTime;
  startedAt = performance.now() / 1000 - currentTime;
  if (audioReady) audio.currentTime = currentTime;
  renderFrame();
}

function tick() {
  if (playing) {
    currentTime = audioReady && !Number.isNaN(audio.currentTime)
      ? audio.currentTime
      : performance.now() / 1000 - startedAt;

    if (currentTime >= getDuration()) {
      currentTime = getDuration();
      pause();
    }

    pausedAt = currentTime;
    renderFrame();
  }

  requestAnimationFrame(tick);
}

function renderFrame() {
  scrubber.value = String(currentTime);
  timeLabel.textContent = formatClock(currentTime);

  const index = lines.findIndex((line) => currentTime >= line.start && currentTime <= line.end);
  const line = index >= 0 ? lines[index] : null;

  renderPopup(line);
  updateWaveform(line);

  if (index !== activeIndex) {
    activeIndex = index;
    updateActiveLine();
  }
}

function renderPopup(line) {
  popupLayer.innerHTML = "";
  if (!line) return;

  const local = currentTime - line.start;
  const duration = Math.max(0.1, line.end - line.start);
  const enter = easeOutBack(clamp(local / 0.42, 0, 1));
  const exit = clamp((duration - local) / 0.28, 0, 1);
  const visibility = Math.min(enter, exit);
  const lift = (1 - visibility) * 42;
  const scale = 0.88 + visibility * 0.12;
  const mainText = line.zh || line.ja;

  const popup = document.createElement("article");
  popup.className = "popup";
  popup.style.opacity = String(clamp(visibility, 0, 1));
  popup.style.transform = `translateY(${lift}px) scale(${scale})`;
  popup.innerHTML = `
    <div class="zh">${escapeHtml(mainText)}</div>
  `;
  popupLayer.append(popup);
}

function renderTimeline() {
  lineCount.textContent = `${lines.length} 句`;
  lineList.innerHTML = "";

  lines.forEach((line, index) => {
    const item = document.createElement("article");
    item.className = "line-item";
    item.dataset.index = String(index);
    item.dataset.start = String(line.start);
    item.innerHTML = `
      <div class="line-meta">
        <label>
          <span>开始</span>
          <input data-index="${index}" data-field="start" value="${escapeHtml(formatCsvTime(line.start))}" />
        </label>
        <label>
          <span>结束</span>
          <input data-index="${index}" data-field="end" value="${escapeHtml(formatCsvTime(line.end))}" />
        </label>
        <label>
          <span>说话人</span>
          <input data-index="${index}" data-field="speaker" value="${escapeHtml(line.speaker || "RADIO")}" />
        </label>
      </div>
      <label class="line-text">
        <span>日语原文</span>
        <textarea data-index="${index}" data-field="ja" rows="2">${escapeHtml(line.ja)}</textarea>
      </label>
      <label class="line-text">
        <span>中文翻译</span>
        <textarea data-index="${index}" data-field="zh" rows="2">${escapeHtml(line.zh)}</textarea>
      </label>
    `;
    lineList.append(item);
  });

  updateActiveLine();
}

function updateLine(index, field, value) {
  if (field === "start" || field === "end") {
    lines[index][field] = parseTime(value);
  } else {
    lines[index][field] = value;
  }
  scrubber.max = String(getDuration());
  renderFrame();
}

function updateActiveLine() {
  document.querySelectorAll(".line-item").forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.index) === activeIndex);
  });
}

function updateWaveform(line) {
  const bars = waveform.querySelectorAll("span");
  bars.forEach((bar, index) => {
    const activePulse = line ? 1 + Math.sin(currentTime * 6 + index * 0.7) * 0.26 : 0.72;
    const base = barHeights[index % barHeights.length];
    bar.style.transform = `scaleY(${activePulse})`;
    bar.style.opacity = line ? "0.72" : "0.34";
    bar.style.height = `${base}%`;
  });
}

async function saveCsvToProject(showStatus) {
  if (isFileMode) {
    throw new Error("请双击 open-studio.command 打开完整功能后再保存");
  }

  const response = await fetch("./api/save-csv", {
    method: "POST",
    headers: {"Content-Type": "text/csv; charset=utf-8"},
    body: buildCsv(lines)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "CSV save failed");
  }

  if (showStatus) statusText.textContent = "已保存 input/script.csv";
}

async function saveAudioToProject(file) {
  try {
    const response = await fetch(`./api/save-audio?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      body: file
    });
    if (!response.ok) throw new Error(await response.text());
    statusText.textContent = `已保存 ${file.name}`;
  } catch {
    statusText.textContent = "音频仅用于当前预览";
  }
}

async function renderVideo() {
  const originalText = renderButton.textContent;
  renderButton.disabled = true;
  renderButton.textContent = "导出中";
  videoLink.classList.add("is-hidden");

  try {
    await saveCsvToProject(false);
    const response = await fetch("./api/render", {method: "POST"});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Render failed");

    videoLink.href = `./output/broadcast-popup.mp4?t=${Date.now()}`;
    videoLink.classList.remove("is-hidden");
    statusText.textContent = "视频已导出";
  } catch (error) {
    statusText.textContent = error.message || "导出失败";
  } finally {
    renderButton.disabled = false;
    renderButton.textContent = originalText;
  }
}

function parseTimedText(source) {
  const cueRows = parseCueBlocks(source);
  if (cueRows.length > 0) return normalizeRows(cueRows);
  return normalizeRows(parsePlainTimestampLines(source));
}

function parseCueBlocks(source) {
  const blocks = source
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/);

  const rows = [];

  for (const block of blocks) {
    const cueLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const timingIndex = cueLines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [left, right] = cueLines[timingIndex].split(/-->/);
    const startText = extractTime(left);
    const endText = extractTime(right);
    if (!startText || !endText) continue;

    const ja = cleanCueText(cueLines.slice(timingIndex + 1).join(" "));
    if (!ja) continue;

    rows.push({
      start: parseTime(startText),
      end: parseTime(endText),
      ja,
      zh: "",
      speaker: "RADIO"
    });
  }

  return rows;
}

function parsePlainTimestampLines(source) {
  const sourceLines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^WEBVTT\b/i.test(line));

  const rows = [];
  let current = null;

  for (const line of sourceLines) {
    const range = matchRangeLine(line);
    if (range) {
      finishCurrent();
      rows.push({
        start: range.start,
        end: range.end,
        ja: cleanCueText(range.text),
        zh: "",
        speaker: "RADIO"
      });
      continue;
    }

    const prefixed = matchPrefixedLine(line);
    if (prefixed) {
      finishCurrent();
      current = {
        start: prefixed.start,
        end: null,
        textParts: [prefixed.text]
      };
      continue;
    }

    const timeOnly = matchTimeOnlyLine(line);
    if (timeOnly !== null) {
      finishCurrent();
      current = {
        start: timeOnly,
        end: null,
        textParts: []
      };
      continue;
    }

    if (current) current.textParts.push(line);
  }

  finishCurrent();
  return rows;

  function finishCurrent() {
    if (!current) return;
    const ja = cleanCueText(current.textParts.join(" "));
    if (ja) {
      rows.push({
        start: current.start,
        end: current.end,
        ja,
        zh: "",
        speaker: "RADIO"
      });
    }
    current = null;
  }
}

function normalizeRows(rows) {
  const sorted = rows
    .map((row) => ({
      ...row,
      start: Number(row.start),
      end: Number(row.end)
    }))
    .filter((row) => Number.isFinite(row.start) && row.ja)
    .sort((a, b) => a.start - b.start);

  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index];
    const next = sorted[index + 1];
    if (Number.isFinite(row.end) && row.end > row.start) continue;

    if (next && next.start > row.start + 0.05) {
      row.end = Math.max(row.start + 0.35, next.start - 0.05);
    } else {
      row.end = row.start + 4;
    }
  }

  return sorted.filter((row) => row.end > row.start);
}

function matchRangeLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*\[?(${TIME_PATTERN})\]?\s*(?:-->|[-–—])\s*\[?(${TIME_PATTERN})\]?\s+(.+)$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return {
    start: parseTime(match[1]),
    end: parseTime(match[2]),
    text: match[3]
  };
}

function matchPrefixedLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*(?:\[(${TIME_PATTERN})\]|\((${TIME_PATTERN})\)|(${TIME_PATTERN}))\s*(?:[-–—:：]\s*)?(.+)$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return {
    start: parseTime(match[1] || match[2] || match[3]),
    text: match[4]
  };
}

function matchTimeOnlyLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*(?:\[(${TIME_PATTERN})\]|\((${TIME_PATTERN})\)|(${TIME_PATTERN}))\s*$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return parseTime(match[1] || match[2] || match[3]);
}

function parseCsv(text) {
  const rows = readCsvRows(text.trim());
  if (rows.length <= 1) return [];

  const headers = rows[0].map((header) => header.trim());
  const index = Object.fromEntries(headers.map((header, column) => [normalizeHeader(header), column]));
  const timeColumn = findColumn(index, ["time", "timestamp", "时间戳", "时间戳记", "時間戳記"]);
  const textColumn = findColumn(index, ["text", "translation", "翻译", "翻译内文", "翻譯內文", "字幕", "中文"]);

  if (!("start" in index) || !("end" in index)) {
    if (timeColumn !== -1 && textColumn !== -1) {
      return normalizeRows(rows.slice(1)
        .filter((row) => row.some((cell) => cell.trim() !== ""))
        .map((row) => ({
          start: parseTime(row[timeColumn] || "0"),
          end: null,
          ja: "",
          zh: cleanImportedText(row[textColumn] || ""),
          speaker: "RADIO"
        })));
    }

    return parseTimedText(text);
  }

  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const rawJa = cleanImportedText(row[index.ja] || "");
      const rawZh = cleanImportedText(row[index.zh] || "");
      const importedTranslation = !rawZh && looksLikeImportedTranslation(rawJa);

      return {
        start: parseTime(row[index.start] || "0"),
        end: parseTime(row[index.end] || "0"),
        ja: importedTranslation ? "" : rawJa,
        zh: importedTranslation ? rawJa : rawZh,
        speaker: row[index.speaker] || "RADIO"
      };
    })
    .filter((line) => line.end > line.start && (line.ja || line.zh))
    .sort((a, b) => a.start - b.start);
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase();
}

function findColumn(index, candidates) {
  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    if (key in index) return index[key];
  }
  return -1;
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

function buildCsv(rows) {
  const header = ["start", "end", "ja", "zh", "speaker"];
  const body = rows.map((row) => [
    formatCsvTime(row.start),
    formatCsvTime(row.end),
    row.ja,
    row.zh,
    row.speaker || "RADIO"
  ]);

  return [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n";
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function extractTime(value) {
  const match = String(value).match(timeRegex);
  return match ? match[0] : "";
}

function cleanCueText(value) {
  return decodeEntities(String(value))
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\.*?\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function parseTime(value) {
  const input = String(value).trim().replace(",", ".");
  if (!input.includes(":")) return Number(input) || 0;
  const parts = input.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatClock(seconds) {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const wholeSeconds = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatCsvTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    `${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
  ].join(":");
}

function getDuration() {
  const lineDuration = Math.max(...lines.map((line) => line.end), 1);
  const audioDuration = audioReady && Number.isFinite(audio.duration) ? audio.duration : 0;
  return Math.max(lineDuration, audioDuration, 1);
}

function downloadText(text, filename, type) {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
