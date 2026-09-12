import fs from 'fs';
import zlib from 'zlib';

function generateRealisticEmblemPNG(width: number, height: number) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const crc32 = (buf: Buffer) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const makeChunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const stride = 1 + width * 4;
  const raw = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.46;
  const rRing = width * 0.43;
  const rInner = width * 0.40;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      if (dist <= rOuter) {
        if (dist > rRing) {
          // Polished outer gold rim
          const shine = Math.cos(angle * 4 + (y / height) * 2);
          const r = Math.min(255, Math.floor(215 + shine * 30));
          const g = Math.min(255, Math.floor(165 + shine * 25));
          const b = Math.min(255, Math.floor(65 + shine * 20));
          raw[pxOffset] = r;
          raw[pxOffset + 1] = g;
          raw[pxOffset + 2] = b;
          raw[pxOffset + 3] = 255;
        } else if (dist > rInner) {
          // Warm cream divider track
          raw[pxOffset] = 248;
          raw[pxOffset + 1] = 250;
          raw[pxOffset + 2] = 252;
          raw[pxOffset + 3] = 255;
        } else {
          // Deep Islamic Sapphire Blue circular field
          const grad = y / height;
          let r = Math.floor(18 + 10 * grad);
          let g = Math.floor(45 + 20 * grad);
          let b = Math.floor(95 + 30 * grad);

          // Center Open Quran Book pages
          const inBookY = y >= cy - 20 && y <= cy + 32;
          const inBookLeft = inBookY && x >= cx - 52 && x <= cx - 5;
          const inBookRight = inBookY && x >= cx + 5 && x <= cx + 52;

          if (inBookLeft || inBookRight) {
            const pageCurve = Math.sin((x - cx) * 0.08) * 4;
            if (y > cy - 20 + pageCurve && y < cy + 30 + pageCurve) {
              r = 245;
              g = 220;
              b = 145;
              // script lines
              if (
                y % 7 === 0 &&
                ((x > cx - 44 && x < cx - 12) || (x > cx + 12 && x < cx + 44))
              ) {
                r = 160;
                g = 120;
                b = 50;
              }
            }
          }

          // Stand
          if (y >= cy + 32 && y <= cy + 56) {
            const standDistL = Math.abs(x - cx + (y - (cy + 42)) * 0.8);
            const standDistR = Math.abs(x - cx - (y - (cy + 42)) * 0.8);
            if (standDistL < 4 || standDistR < 4) {
              r = 215;
              g = 165;
              b = 65;
            }
          }

          // Crescent & Star
          if (y >= cy - 70 && y <= cy - 30 && Math.hypot(dx, dy + 50) < 22) {
            const crescentDist1 = Math.hypot(dx, dy + 50);
            const crescentDist2 = Math.hypot(dx - 5, dy + 52);
            if (crescentDist1 < 20 && crescentDist2 > 13) {
              r = 235;
              g = 185;
              b = 75;
            }
            if (Math.hypot(dx - 5, dy + 50) < 5) {
              r = 250;
              g = 210;
              b = 90;
            }
          }

          raw[pxOffset] = r;
          raw[pxOffset + 1] = g;
          raw[pxOffset + 2] = b;
          raw[pxOffset + 3] = 255;
        }
      } else {
        raw[pxOffset] = 0;
        raw[pxOffset + 1] = 0;
        raw[pxOffset + 2] = 0;
        raw[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const emblemPng = generateRealisticEmblemPNG(256, 256);
fs.writeFileSync('public/naseem-emblem.png', emblemPng);
fs.writeFileSync('public/logo.png', emblemPng);
console.log('Emblem generated successfully! Size:', emblemPng.length);
