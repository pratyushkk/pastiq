import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size) {
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(height * (width * 4 + 1));

  // Colors:
  // Background: Deep dark navy #0A101D
  // Accent cyan: #38BDF8 (56, 189, 248)
  // Accent violet: #818CF8 (129, 140, 248)
  // Subtle border: #1E293B

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    buffer[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;

      // Rounded rect bounds
      const cornerRadius = Math.max(2, Math.floor(size * 0.22));
      const dx = Math.min(x, width - 1 - x);
      const dy = Math.min(y, height - 1 - y);

      let isInside = true;
      if (dx < cornerRadius && dy < cornerRadius) {
        const dist = Math.hypot(cornerRadius - dx, cornerRadius - dy);
        if (dist > cornerRadius) {
          isInside = false;
        }
      }

      if (!isInside) {
        // Transparent
        buffer[px] = 0;
        buffer[px + 1] = 0;
        buffer[px + 2] = 0;
        buffer[px + 3] = 0;
        continue;
      }

      // Background gradient
      const normY = y / height;
      let r = Math.round(10 + normY * 5);
      let g = Math.round(16 + normY * 8);
      let b = Math.round(29 + normY * 15);
      let a = 255;

      // Inner clipboard outline
      const pad = Math.max(2, Math.floor(size * 0.18));
      const clipW = width - pad * 2;
      const clipH = height - pad * 2;
      const relX = x - pad;
      const relY = y - pad;

      const strokeW = Math.max(1, Math.floor(size * 0.08));

      // Clipboard board rectangle
      if (relX >= 0 && relX < clipW && relY >= 0 && relY < clipH) {
        const isBorder = (
          relX < strokeW || relX >= clipW - strokeW ||
          relY >= clipH - strokeW || (relY < strokeW && (relX < clipW * 0.25 || relX >= clipW * 0.75))
        );

        if (isBorder) {
          // Cyan accent
          r = 56;
          g = 189;
          b = 248;
        }

        // Clip tab at top
        const clipTabW = Math.floor(clipW * 0.5);
        const clipTabH = Math.max(2, Math.floor(clipH * 0.22));
        const tabX = (clipW - clipTabW) / 2;
        if (relX >= tabX && relX < tabX + clipTabW && relY >= -Math.floor(clipTabH * 0.5) && relY < clipTabH * 0.5) {
          r = 129;
          g = 140;
          b = 248;
        }

        // Two horizontal document lines inside clipboard
        const line1Y = Math.floor(clipH * 0.45);
        const line2Y = Math.floor(clipH * 0.70);
        const lineLeft = Math.floor(clipW * 0.25);
        const lineRight = Math.floor(clipW * 0.75);

        if (relX >= lineLeft && relX <= lineRight) {
          if (Math.abs(relY - line1Y) < Math.max(1, Math.floor(strokeW * 0.6))) {
            r = 56;
            g = 189;
            b = 248;
          } else if (Math.abs(relY - line2Y) < Math.max(1, Math.floor(strokeW * 0.6))) {
            r = 148;
            g = 163;
            b = 184;
          }
        }
      }

      buffer[px] = r;
      buffer[px + 1] = g;
      buffer[px + 2] = b;
      buffer[px + 3] = a;
    }
  }

  // Deflate IDAT data
  const compressed = zlib.deflateSync(buffer);

  // Construct PNG chunks
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuf, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(calcCRC32(crcData), 0);

    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function calcCRC32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const png = createPNG(size);
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated icon: ${outPath} (${size}x${size}, ${png.length} bytes)`);
});
