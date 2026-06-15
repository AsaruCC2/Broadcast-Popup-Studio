import {writeFileSync} from "node:fs";
import {mkdir} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {deflateSync} from "node:zlib";

const output = resolve(process.argv[2] || "build/icon.png");
const size = Number(process.argv[3] || 1024);
const scale = size / 1024;
const pixels = new Uint8Array(size * size * 4);

await mkdir(dirname(output), {recursive: true});

const colors = {
  ink: hex("#202226"),
  panel: hex("#fff7ea"),
  soft: hex("#f4e4cf"),
  coral: hex("#df5d4f"),
  teal: hex("#087f83"),
  amber: hex("#d7a12f"),
  shadow: hex("#151719"),
};

roundedRect(88, 102, 828, 828, 168, colors.teal);
roundedRect(118, 126, 800, 792, 150, colors.ink);
roundedRect(104, 100, 800, 792, 150, colors.panel);
line(322, 272, 226, 108, 46, colors.ink);
circle(224, 104, 42, colors.coral);
roundedRect(220, 306, 584, 450, 86, colors.ink);
roundedRect(242, 326, 540, 408, 70, colors.soft);
roundedRect(300, 380, 280, 122, 30, colors.ink);
roundedRect(316, 396, 248, 90, 22, colors.teal);
circle(654, 440, 52, colors.ink);
circle(654, 440, 30, colors.amber);
circle(742, 440, 52, colors.ink);
circle(742, 440, 30, colors.coral);
roundedRect(300, 560, 300, 52, 26, colors.ink);
roundedRect(324, 576, 252, 20, 10, colors.teal);
circle(696, 648, 132, colors.ink);
circle(696, 648, 106, colors.panel);
for (let y = -54; y <= 54; y += 36) {
  for (let x = -54; x <= 54; x += 36) {
    if (Math.hypot(x, y) <= 78) circle(696 + x, 648 + y, 12, colors.ink);
  }
}
roundedRect(274, 664, 286, 52, 26, colors.ink);
roundedRect(304, 682, 226, 16, 8, colors.coral);
roundedRect(292, 744, 444, 42, 21, colors.ink);
roundedRect(324, 758, 380, 14, 7, colors.amber);

writeFileSync(output, encodePng(size, size, pixels));

function roundedRect(x, y, width, height, radius, color) {
  const sx = Math.round(x * scale);
  const sy = Math.round(y * scale);
  const sw = Math.round(width * scale);
  const sh = Math.round(height * scale);
  const sr = Math.round(radius * scale);
  for (let py = sy; py < sy + sh; py += 1) {
    for (let px = sx; px < sx + sw; px += 1) {
      const dx = Math.max(sx + sr - px, 0, px - (sx + sw - sr));
      const dy = Math.max(sy + sr - py, 0, py - (sy + sh - sr));
      if (dx * dx + dy * dy <= sr * sr) setPixel(px, py, color);
    }
  }
}

function circle(cx, cy, radius, color) {
  const scx = Math.round(cx * scale);
  const scy = Math.round(cy * scale);
  const sr = Math.round(radius * scale);
  for (let py = scy - sr; py <= scy + sr; py += 1) {
    for (let px = scx - sr; px <= scx + sr; px += 1) {
      const dx = px - scx;
      const dy = py - scy;
      if (dx * dx + dy * dy <= sr * sr) setPixel(px, py, color);
    }
  }
}

function line(x1, y1, x2, y2, width, color) {
  const sx1 = x1 * scale;
  const sy1 = y1 * scale;
  const sx2 = x2 * scale;
  const sy2 = y2 * scale;
  const half = width * scale / 2;
  const minX = Math.floor(Math.min(sx1, sx2) - half);
  const maxX = Math.ceil(Math.max(sx1, sx2) + half);
  const minY = Math.floor(Math.min(sy1, sy2) - half);
  const maxY = Math.ceil(Math.max(sy1, sy2) + half);
  const lengthSq = (sx2 - sx1) ** 2 + (sy2 - sy1) ** 2;

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const t = Math.max(0, Math.min(1, ((px - sx1) * (sx2 - sx1) + (py - sy1) * (sy2 - sy1)) / lengthSq));
      const nx = sx1 + t * (sx2 - sx1);
      const ny = sy1 + t * (sy2 - sy1);
      if ((px - nx) ** 2 + (py - ny) ** 2 <= half ** 2) setPixel(px, py, color);
    }
  }
}

function setPixel(x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

function hex(value) {
  const clean = value.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    255,
  ];
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }

  const chunks = [
    chunk("IHDR", Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(raw, {level: 9})),
    chunk("IEND", Buffer.alloc(0)),
  ];

  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  return Buffer.concat([u32(data.length), typeBuffer, data, u32(crc32(Buffer.concat([typeBuffer, data])))]); 
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
