import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter byte None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Corporate Blue Background (#1E3A8A / #1D4ED8)
      let r = 30;
      let g = 58;
      let b = 138;
      let a = 255;

      // Rounded app container or full-bleed if maskable
      if (!isMaskable && (Math.abs(dx) > width * 0.46 || Math.abs(dy) > height * 0.46)) {
        a = 0;
      }

      // Warehouse box emblem in center
      if (dist < radius) {
        // Top highlight
        if (dy < -height * 0.05 && Math.abs(dx) < width * 0.28) {
          // White top face
          r = 255;
          g = 255;
          b = 255;
        } else if (dx > 0 && Math.abs(dy) < height * 0.25) {
          // Bright blue right face (#2563EB)
          r = 37;
          g = 99;
          b = 235;
        } else if (dx <= 0 && Math.abs(dy) < height * 0.25) {
          // Deep navy left face (#1E3A8A)
          r = 23;
          g = 37;
          b = 84;
        }

        // Red focal point badge (#DC2626)
        if (Math.abs(dx) < width * 0.12 && dy > height * 0.08 && dy < height * 0.22) {
          r = 220;
          g = 38;
          b = 38;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  const idat = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const pubDir = path.resolve('/public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
console.log('Successfully generated PWA PNG icons!');
