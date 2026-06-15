import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
if (!args[0]) {
  fail("Usage: npm run convert -- path/to/subtitles.srt [input/script.csv]");
}

const inputPath = resolve(root, args[0]);
const outputPath = resolve(root, args[1] || "input/script.csv");
const speaker = process.env.SPEAKER || "RADIO";
const defaultDuration = Number(process.env.DEFAULT_DURATION || 4);
const minDuration = Number(process.env.MIN_DURATION || 0.35);

const TIME_PATTERN = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[\.,]\d{1,3})?`;
const timeRegex = new RegExp(TIME_PATTERN, "u");

if (!existsSync(inputPath)) {
  fail(`Timed text not found: ${inputPath}`);
}

const text = stripBom(readFileSync(inputPath, "utf8"));
const rows = parseTimedText(text);

if (rows.length === 0) {
  fail(`No timestamped lines found in ${inputPath}`);
}

mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, buildCsv(rows), "utf8");

console.log(`Input: ${relative(inputPath)}`);
console.log(`Rows: ${rows.length}`);
console.log(`Output: ${relative(outputPath)}`);

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
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const timingIndex = lines.findIndex((line) => matchCueTimingLine(line));
    if (timingIndex === -1) continue;

    const timing = matchCueTimingLine(lines[timingIndex]);
    if (!timing) continue;

    const ja = cleanCueText(lines.slice(timingIndex + 1).join(" "));
    if (!ja) continue;

    rows.push({
      start: parseTime(timing.startText),
      end: parseTime(timing.endText),
      ja,
      zh: "",
      speaker,
    });
  }

  return rows;
}

function matchCueTimingLine(line) {
  if (line.includes("-->")) {
    const [left, right] = line.split(/-->/);
    const startText = extractTime(left);
    const endText = extractTime(right);
    return startText && endText ? {startText, endText} : null;
  }

  const sbvPattern = new RegExp(
    String.raw`^\s*(${TIME_PATTERN})\s*,\s*(${TIME_PATTERN})\s*$`,
    "u"
  );
  const match = line.match(sbvPattern);
  if (!match) return null;
  return {
    startText: match[1],
    endText: match[2],
  };
}

function parsePlainTimestampLines(source) {
  const lines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^WEBVTT\b/i.test(line));

  const rows = [];
  let current = null;

  for (const line of lines) {
    const range = matchRangeLine(line);
    if (range) {
      finishCurrent();
      rows.push({
        start: range.start,
        end: range.end,
        ja: cleanCueText(range.text),
        zh: "",
        speaker,
      });
      continue;
    }

    const prefixed = matchPrefixedLine(line);
    if (prefixed) {
      finishCurrent();
      current = {
        start: prefixed.start,
        end: null,
        textParts: [prefixed.text],
      };
      continue;
    }

    const timeOnly = matchTimeOnlyLine(line);
    if (timeOnly) {
      finishCurrent();
      current = {
        start: timeOnly,
        end: null,
        textParts: [],
      };
      continue;
    }

    if (current) {
      current.textParts.push(line);
    }
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
        speaker,
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
      end: Number(row.end),
    }))
    .filter((row) => Number.isFinite(row.start) && row.ja)
    .sort((a, b) => a.start - b.start);

  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index];
    const next = sorted[index + 1];

    if (Number.isFinite(row.end) && row.end > row.start) continue;

    if (next && next.start > row.start + 0.05) {
      const beforeNext = next.start - 0.05;
      row.end = beforeNext > row.start + minDuration ? beforeNext : next.start;
    } else {
      row.end = row.start + defaultDuration;
    }
  }

  return sorted.filter((row) => row.end > row.start);
}

function matchRangeLine(line) {
  const pattern = new RegExp(
    String.raw`^\s*\[?(${TIME_PATTERN})\]?\s*(?:-->|[-–—]|,)\s*\[?(${TIME_PATTERN})\]?\s+(.+)$`,
    "u"
  );
  const match = line.match(pattern);
  if (!match) return null;
  return {
    start: parseTime(match[1]),
    end: parseTime(match[2]),
    text: match[3],
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
    text: match[4],
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

function extractTime(value) {
  const match = String(value).match(timeRegex);
  return match ? match[0] : "";
}

function cleanCueText(value) {
  let text = decodeEntities(String(value))
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\.*?\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.startsWith(",")) text = text.slice(1).trim();
  if (text.length >= 2 && text.startsWith("\"") && text.endsWith("\"")) {
    text = text.slice(1, -1).replaceAll("\"\"", "\"").trim();
  }

  return text;
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
  const normalized = String(value).trim().replace(",", ".");
  const parts = normalized.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(normalized) || 0;
}

function formatTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    `${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`,
  ].join(":");
}

function buildCsv(rows) {
  const header = ["start", "end", "ja", "zh", "speaker"];
  const body = rows.map((row) => [
    formatTime(row.start),
    formatTime(row.end),
    row.ja,
    row.zh || "",
    row.speaker || speaker,
  ]);

  return [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n";
}

function csvEscape(value) {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function stripBom(value) {
  return value.replace(/^\uFEFF/, "");
}

function relative(path) {
  return path.startsWith(root) ? path.slice(root.length) : path;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
