import {createServer} from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {spawn} from "node:child_process";
import {extname, join, normalize} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const inputDir = join(root, "input");
const outputVideo = "output/broadcast-popup.mp4";

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
  ".webm": "video/webm"
};

const server = createServer(async (request, response) => {
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

function serveStatic(url, response) {
  const decoded = decodeURIComponent(url.pathname);
  const relative = decoded === "/" ? "index.html" : decoded.slice(1);
  const path = normalize(join(root, relative));

  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) {
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

  if (url.pathname === "/api/render" && request.method === "POST") {
    const result = await renderVideo();
    if (result.status !== 0) {
      response.writeHead(500, {"Content-Type": "application/json; charset=utf-8"});
      response.end(JSON.stringify({ok: false, error: result.output || "Render failed"}));
      return;
    }

    sendJson(response, {ok: true, path: outputVideo});
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

function renderVideo() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/render.mjs"], {
      cwd: root,
      env: process.env,
    });

    let output = "";
    const append = (chunk) => {
      output += chunk.toString();
      if (output.length > 20000) output = output.slice(-20000);
    };

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (error) => resolve({status: 1, output: error.message}));
    child.on("close", (status) => resolve({status, output}));
  });
}

function sendJson(response, payload) {
  response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
  response.end(JSON.stringify(payload));
}

server.listen(port, "127.0.0.1", () => {
  console.log(`Broadcast popup preview: http://127.0.0.1:${port}`);
});
