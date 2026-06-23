import {createServer} from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {spawn} from "node:child_process";
import {extname, join, normalize} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const moduleRoot = fileURLToPath(new URL(".", import.meta.url));
const assetRoot = normalize(process.env.BPS_ASSET_ROOT || moduleRoot);
const dataRoot = normalize(process.env.BPS_DATA_ROOT || assetRoot);
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const inputDir = join(dataRoot, "input");
const outputDir = join(dataRoot, "output");
const outputVideo = "output/broadcast-popup.mp4";
const outputVideoPath = join(dataRoot, outputVideo);
const tempOutputVideo = "output/broadcast-popup.in-progress.mp4";
const tempOutputVideoPath = join(dataRoot, tempOutputVideo);
const renderIntermediateFiles = [
  tempOutputVideoPath,
  join(dataRoot, "output/render-lines.json"),
  join(dataRoot, "output/render-popup.ass"),
];
let activeRenderJob = null;
let lastRenderJob = null;
let renderJobSerial = 0;
let timedBackgroundFileSerial = 0;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webm": "video/webm"
};

function createBroadcastServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    try {
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url);
        return;
      }

      serveStatic(url, response);
    } catch (error) {
      response.writeHead(500, {"Content-Type": "text/plain; charset=utf-8"});
      response.end(error.message || "Server error");
    }
  });
}

function serveStatic(url, response) {
  const decoded = decodeURIComponent(url.pathname);
  const relative = decoded === "/" ? "index.html" : decoded.slice(1);
  const baseRoot = /^(input|output)\//.test(relative) ? dataRoot : assetRoot;
  const path = normalize(join(baseRoot, relative));

  if (!path.startsWith(baseRoot) || !existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": types[extname(path).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(path).pipe(response);
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/save-csv" && request.method === "POST") {
    const body = await readBody(request, 30 * 1024 * 1024);
    mkdirSync(inputDir, {recursive: true});
    writeFileSync(join(inputDir, "script.csv"), body);
    sendJson(response, {ok: true, path: "input/script.csv"});
    return;
  }

  if (url.pathname === "/api/save-audio" && request.method === "POST") {
    const fileName = url.searchParams.get("name") || "audio.m4a";
    const extension = extname(fileName).toLowerCase();
    const allowed = new Set([".m4a", ".mp3", ".wav", ".aac", ".mp4"]);

    if (!allowed.has(extension)) {
      response.writeHead(400, {"Content-Type": "text/plain; charset=utf-8"});
      response.end("Unsupported audio type");
      return;
    }

    const body = await readBody(request, 500 * 1024 * 1024);
    mkdirSync(inputDir, {recursive: true});

    for (const name of readdirSync(inputDir)) {
      if (/^audio\.(m4a|mp3|wav|aac|mp4)$/i.test(name)) {
        unlinkSync(join(inputDir, name));
      }
    }

    const target = join(inputDir, `audio${extension}`);
    writeFileSync(target, body);
    sendJson(response, {ok: true, path: `input/audio${extension}`});
    return;
  }

  if (url.pathname === "/api/save-background" && request.method === "POST") {
    const fileName = url.searchParams.get("name") || "background.png";
    const extension = extname(fileName).toLowerCase();
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"]);

    if (!allowed.has(extension)) {
      response.writeHead(400, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify({ok: false, error: "Unsupported background image type"}));
      return;
    }

    const body = await readBody(request, 80 * 1024 * 1024);
    mkdirSync(inputDir, {recursive: true});

    for (const name of readdirSync(inputDir)) {
      if (/^background\.(png|jpe?g|webp)$/i.test(name)) {
        unlinkSync(join(inputDir, name));
      }
    }

    const target = join(inputDir, `background${extension}`);
    writeFileSync(target, body);
    sendJson(response, {ok: true, path: `input/background${extension}`});
    return;
  }

  if (url.pathname === "/api/save-timed-background" && request.method === "POST") {
    const fileName = url.searchParams.get("name") || "timed-background.png";
    const extension = extname(fileName).toLowerCase();
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"]);

    if (!allowed.has(extension)) {
      response.writeHead(400, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify({ok: false, error: "Unsupported timed background image type"}));
      return;
    }

    const body = await readBody(request, 80 * 1024 * 1024);
    mkdirSync(inputDir, {recursive: true});

    const serial = `${Date.now()}-${timedBackgroundFileSerial += 1}`;
    const target = join(inputDir, `timed-background-${serial}${extension}`);
    writeFileSync(target, body);
    sendJson(response, {ok: true, path: `input/timed-background-${serial}${extension}`});
    return;
  }

  if (url.pathname === "/api/render" && request.method === "POST") {
    const body = await readBody(request, 1024 * 1024);
    const options = parseJsonBody(body);
    const ratio = normalizeVideoRatio(options.videoRatio);
    const job = startRenderJob({
      subtitleSize: normalizeSubtitleSize(options.subtitleSize),
      subtitleLead: normalizeSubtitleLead(options.subtitleLead),
      width: ratio.width,
      height: ratio.height,
      backgroundMode: normalizeBackgroundMode(options.backgroundMode),
      backgroundColor: normalizeHexColor(options.backgroundColor),
      backgroundScale: normalizeBackgroundScale(options.backgroundScale),
      timedBackgrounds: normalizeTimedBackgrounds(options.timedBackgrounds),
      subtitleStyle: normalizeSubtitleStyle(options.subtitleStyle)
    });
    if (!job.ok) {
      response.writeHead(409, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify(job));
      return;
    }

    sendJson(response, {ok: true, jobId: job.id});
    return;
  }

  if (url.pathname === "/api/render/status" && request.method === "GET") {
    const job = findRenderJob(url.searchParams.get("id"));
    if (!job) {
      response.writeHead(404, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify({ok: false, error: "Render job not found"}));
      return;
    }

    sendJson(response, serializeRenderJob(job));
    return;
  }

  if (url.pathname === "/api/render/cancel" && request.method === "POST") {
    const body = await readBody(request, 1024 * 1024);
    const options = parseJsonBody(body);
    const job = findRenderJob(options.jobId);
    if (!job) {
      response.writeHead(404, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify({ok: false, error: "Render job not found"}));
      return;
    }

    cancelRenderJob(job);
    sendJson(response, serializeRenderJob(job));
    return;
  }

  response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
  response.end("Not found");
}

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseJsonBody(body) {
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    return {};
  }
}

function normalizeSubtitleSize(value) {
  const size = Number(value);
  return Number.isFinite(size) ? Math.min(80, Math.max(20, Math.round(size))) : 46;
}

function normalizeSubtitleLead(value) {
  const lead = Number(value);
  return Number.isFinite(lead) ? Math.min(5, Math.max(-5, Math.round(lead * 10) / 10)) : 0;
}

function normalizeVideoRatio(value) {
  const presets = {
    "16:9": {width: 1920, height: 1080},
    "9:16": {width: 1080, height: 1920},
    "1:1": {width: 1080, height: 1080},
    "4:5": {width: 1080, height: 1350},
  };
  return presets[value] || presets["16:9"];
}

function normalizeBackgroundMode(value) {
  return ["grid", "color", "image"].includes(value) ? value : "grid";
}

function normalizeSubtitleStyle(value) {
  return ["card", "note"].includes(value) ? value : "card";
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : "#202124";
}

function normalizeBackgroundScale(value) {
  const scale = Number(value);
  return Number.isFinite(scale) ? Math.min(220, Math.max(80, Math.round(scale))) : 100;
}

function normalizeTimedBackgrounds(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const start = Number(item?.start);
      const end = Number(item?.end);
      const relativePath = String(item?.path || "").replace(/^\.\//, "");
      const allowedPath = /^input\/timed-background-[^/]+\.(png|jpe?g|webp)$/i.test(relativePath);

      return {
        path: allowedPath ? relativePath : "",
        start: Number.isFinite(start) ? Math.max(0, Math.round(start * 10) / 10) : 0,
        end: Number.isFinite(end) ? Math.max(0, Math.round(end * 10) / 10) : 0,
        scale: normalizeBackgroundScale(item?.scale),
      };
    })
    .filter((item) => item.path && item.end > item.start)
    .slice(0, 12);
}

function startRenderJob(options = {}) {
  if (activeRenderJob && ["starting", "running", "canceling"].includes(activeRenderJob.state)) {
    return {ok: false, error: "已有导出任务正在运行"};
  }

  mkdirSync(outputDir, {recursive: true});
  cleanupRenderArtifacts();

  const audioPath = findDefaultAudioPath();
  const backgroundImagePath = findBackgroundImagePath();
  const backgroundMode = options.backgroundMode === "image" && !backgroundImagePath ? "grid" : options.backgroundMode;
  const id = `render-${Date.now()}-${renderJobSerial += 1}`;
  const job = {
    id,
    ok: true,
    state: "starting",
    progress: 0,
    durationSeconds: null,
    outTimeSeconds: 0,
    renderSpeed: null,
    remainingSeconds: null,
    startedAt: Date.now(),
    endedAt: null,
    error: "",
    output: "",
    lineBuffer: "",
    cancelRequested: false,
    child: null,
    killTimer: null,
  };

  const nodeExecutable = process.env.BPS_NODE_EXECUTABLE || process.execPath;
  const renderScript = join(assetRoot, "scripts/render.mjs");
  const csvPath = join(dataRoot, "input/script.csv");
  const childEnv = {
    ...process.env,
    BPS_DATA_ROOT: dataRoot,
    RENDER_PROGRESS: "1",
    WIDTH: String(options.width || 1920),
    HEIGHT: String(options.height || 1080),
    SUBTITLE_SIZE: String(options.subtitleSize || 46),
    SUBTITLE_LEAD: String(options.subtitleLead || 0),
    SUBTITLE_STYLE: options.subtitleStyle || "card",
    BACKGROUND_MODE: backgroundMode || "grid",
    BACKGROUND_COLOR: options.backgroundColor || "#202124",
    BACKGROUND_SCALE: String(options.backgroundScale || 100),
    BACKGROUND_IMAGE: backgroundImagePath || "",
    TIMED_BACKGROUNDS: JSON.stringify(options.timedBackgrounds || []),
  };

  if (process.env.BPS_ELECTRON === "1") {
    childEnv.ELECTRON_RUN_AS_NODE = "1";
  }

  const child = spawn(nodeExecutable, [renderScript, csvPath, audioPath, tempOutputVideoPath], {
    cwd: assetRoot,
    env: {
      ...childEnv,
    },
  });

  job.child = child;
  activeRenderJob = job;
  lastRenderJob = job;

  child.stdout.on("data", (chunk) => {
    appendRenderOutput(job, chunk.toString());
  });
  child.stderr.on("data", (chunk) => {
    appendRenderLog(job, chunk.toString());
  });
  child.on("error", (error) => {
    job.state = "failed";
    job.error = error.message;
    finishRenderJob(job);
  });
  child.on("close", (status, signal) => {
    if (job.killTimer) clearTimeout(job.killTimer);
    if (job.lineBuffer.trim()) {
      appendRenderOutput(job, "\n");
    }

    if (job.cancelRequested) {
      job.state = "canceled";
      job.progress = Math.min(job.progress, 0.99);
      job.error = "导出已终止";
      cleanupRenderArtifacts();
    } else if (status === 0 && existsSync(tempOutputVideoPath)) {
      try {
        renameSync(tempOutputVideoPath, outputVideoPath);
        job.state = "complete";
        job.progress = 1;
        job.path = outputVideo;
      } catch (error) {
        job.state = "failed";
        job.error = error.message;
        cleanupRenderArtifacts();
      }
    } else {
      job.state = "failed";
      job.error = job.output || `Render failed${signal ? ` (${signal})` : ""}`;
      cleanupRenderArtifacts();
    }

    finishRenderJob(job);
  });

  job.state = "running";
  return job;
}

function appendRenderOutput(job, text) {
  job.lineBuffer += text;
  const lines = job.lineBuffer.split(/\r?\n/);
  job.lineBuffer = lines.pop() || "";

  for (const line of lines) {
    if (line.startsWith("PROGRESS ")) {
      updateRenderProgress(job, line.slice("PROGRESS ".length));
    } else {
      appendRenderLog(job, `${line}\n`);
    }
  }
}

function appendRenderLog(job, text) {
  job.output += text;
  if (job.output.length > 30000) job.output = job.output.slice(-30000);
}

function updateRenderProgress(job, payloadText) {
  try {
    const payload = JSON.parse(payloadText);
    const progress = Number(payload.progress);
    const outTime = Number(payload.outTimeSeconds);
    const duration = Number(payload.durationSeconds);
    const speed = Number(payload.speed);
    if (Number.isFinite(progress)) job.progress = Math.min(1, Math.max(0, progress));
    if (Number.isFinite(outTime)) job.outTimeSeconds = outTime;
    if (Number.isFinite(duration) && duration > 0) job.durationSeconds = duration;
    if (Number.isFinite(speed) && speed > 0) {
      job.renderSpeed = Number.isFinite(job.renderSpeed)
        ? job.renderSpeed * 0.7 + speed * 0.3
        : speed;
    }
    updateRemainingEstimate(job);
  } catch {
    appendRenderLog(job, `PROGRESS ${payloadText}\n`);
  }
}

function updateRemainingEstimate(job) {
  const estimate = calculateRemainingSeconds(job);
  if (!Number.isFinite(estimate)) return;

  if (!Number.isFinite(job.remainingSeconds)) {
    job.remainingSeconds = estimate;
    return;
  }

  const weight = estimate < job.remainingSeconds ? 0.35 : 0.2;
  job.remainingSeconds = job.remainingSeconds * (1 - weight) + estimate * weight;
}

function calculateRemainingSeconds(job) {
  const duration = Number(job.durationSeconds);
  const outTime = Number(job.outTimeSeconds);
  const speed = Number(job.renderSpeed);

  if (Number.isFinite(duration) && duration > 0 && Number.isFinite(outTime) && Number.isFinite(speed) && speed > 0.001) {
    return Math.max(0, (duration - outTime) / speed);
  }

  const progress = Math.min(1, Math.max(0, Number(job.progress) || 0));
  const elapsedSeconds = (Date.now() - job.startedAt) / 1000;
  if (progress <= 0.03 || elapsedSeconds < 10) return null;
  return Math.max(0, elapsedSeconds * (1 - progress) / progress);
}

function cancelRenderJob(job) {
  if (!["starting", "running"].includes(job.state)) return;
  job.cancelRequested = true;
  job.state = "canceling";
  job.error = "正在终止导出";

  if (job.child && !job.child.killed) {
    job.child.kill("SIGTERM");
    job.killTimer = setTimeout(() => {
      if (job.child && !job.child.killed) job.child.kill("SIGKILL");
      cleanupRenderArtifacts();
    }, 5000);
  } else {
    job.state = "canceled";
    cleanupRenderArtifacts();
    finishRenderJob(job);
  }
}

function finishRenderJob(job) {
  job.endedAt = Date.now();
  job.child = null;
  if (activeRenderJob?.id === job.id) activeRenderJob = null;
}

function findRenderJob(id) {
  if (!id) return activeRenderJob || lastRenderJob;
  if (activeRenderJob?.id === id) return activeRenderJob;
  if (lastRenderJob?.id === id) return lastRenderJob;
  return null;
}

function serializeRenderJob(job) {
  const elapsedSeconds = ((job.endedAt || Date.now()) - job.startedAt) / 1000;
  const progress = Math.min(1, Math.max(0, Number(job.progress) || 0));
  const remainingSeconds = job.state === "running" && progress > 0.01
    ? job.remainingSeconds
    : null;

  return {
    ok: true,
    jobId: job.id,
    state: job.state,
    progress,
    percent: Math.round(progress * 100),
    elapsedSeconds,
    remainingSeconds,
    durationSeconds: job.durationSeconds,
    outTimeSeconds: job.outTimeSeconds,
    renderSpeed: job.renderSpeed,
    path: job.path || "",
    error: job.error || "",
  };
}

function cleanupRenderArtifacts() {
  for (const path of renderIntermediateFiles) {
    try {
      if (existsSync(path)) unlinkSync(path);
    } catch {
      // A file can disappear while a canceled FFmpeg process is closing.
    }
  }
}

function findDefaultAudioPath() {
  const candidates = ["input/audio.m4a", "input/audio.mp3", "input/audio.wav", "input/audio.aac", "input/audio.mp4"];
  const found = candidates.map((name) => join(dataRoot, name)).find((path) => existsSync(path));
  return found || join(dataRoot, "input/audio.m4a");
}

function findBackgroundImagePath() {
  const candidates = ["input/background.png", "input/background.jpg", "input/background.jpeg", "input/background.webp"];
  return candidates.map((name) => join(dataRoot, name)).find((path) => existsSync(path)) || "";
}

function sendJson(response, payload) {
  response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
  response.end(JSON.stringify(payload));
}

export function startServer(options = {}) {
  const server = createBroadcastServer();
  const listenPort = Number(options.port ?? port);
  const listenHost = options.host || host;

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(listenPort, listenHost, () => {
      server.off("error", reject);
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : listenPort;
      resolve({
        server,
        host: listenHost,
        port: actualPort,
        url: `http://${listenHost}:${actualPort}`,
        assetRoot,
        dataRoot,
      });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runtime = await startServer();
  console.log(`Broadcast popup preview: ${runtime.url}`);
}
