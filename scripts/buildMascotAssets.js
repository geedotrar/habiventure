const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../resources/mascots');
const outputDir = path.join(__dirname, '../public/mascots');

const isCheckerPixel = (r, g, b) => {
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return maxDiff <= 15 && r >= 160 && g >= 160 && b >= 160;
};

function buildAlphaMask(data, w, h, isAvatar = false) {
  const comp = new Int32Array(w * h).fill(-1);
  let compCount = 0;
  const components = [];

  for (let i = 0; i < w * h; i++) {
    const idx = i * 3;
    if (comp[i] !== -1 || !isCheckerPixel(data[idx], data[idx + 1], data[idx + 2])) continue;

    const currentId = compCount++;
    let size = 0, countDark = 0, countLight = 0, touchesTopOrSides = false;

    const queue = [i];
    comp[i] = currentId;

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      size++;
      const cx = curr % w;
      const cy = Math.floor(curr / w);

      if (cy === 0 || cx === 0 || cx === w - 1) touchesTopOrSides = true;

      const r = data[curr * 3];
      if (r <= 205) countDark++;
      else if (r >= 235) countLight++;

      const nbs = [
        cx > 0 ? curr - 1 : -1,
        cx < w - 1 ? curr + 1 : -1,
        cy > 0 ? curr - w : -1,
        cy < h - 1 ? curr + w : -1,
      ];

      for (const n of nbs) {
        if (n !== -1 && comp[n] === -1 && isCheckerPixel(data[n * 3], data[n * 3 + 1], data[n * 3 + 2])) {
          comp[n] = currentId;
          queue.push(n);
        }
      }
    }
    components.push({ id: currentId, size, touchesTopOrSides, countDark, countLight });
  }

  const bgCompSet = new Set();
  for (const c of components) {
    const totalDL = c.countDark + c.countLight;
    const ratio = totalDL > 0 ? c.countDark / totalDL : 0;
    if (c.touchesTopOrSides && (isAvatar ? c.countDark > 50 && c.countLight > 50 : true)) {
      bgCompSet.add(c.id);
    } else if (c.size > 150 && c.countDark > 20 && c.countLight > 20 && ratio >= 0.35 && ratio <= 0.65) {
      bgCompSet.add(c.id);
    }
  }

  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const cId = comp[i];
    alpha[i] = cId !== -1 && bgCompSet.has(cId) ? 0 : 255;
  }

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (alpha[idx] === 255) {
        if (alpha[idx - 1] === 0 || alpha[idx + 1] === 0 || alpha[idx - w] === 0 || alpha[idx + w] === 0) {
          const r = data[idx * 3], g = data[idx * 3 + 1], b = data[idx * 3 + 2];
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          if (maxDiff <= 18 && (r + g + b) / 3 > 185) {
            alpha[idx] = Math.max(0, Math.floor(255 - ((r + g + b) / 3 - 185) * 3));
          }
        }
      }
    }
  }
  return alpha;
}

async function processDuo(inputFile, outputFile, targetHeight = 960) {
  const inputPath = path.join(sourceDir, inputFile);
  const outputPath = path.join(outputDir, outputFile);
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const alpha = buildAlphaMask(data, w, h, false);

  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 24;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2);

  const croppedRgba = Buffer.alloc(cropW * cropH * 4);
  for (let cy = 0; cy < cropH; cy++) {
    for (let cx = 0; cx < cropW; cx++) {
      const srcIdx = (cropY + cy) * w + (cropX + cx);
      const dstIdx = (cy * cropW + cx) * 4;
      croppedRgba[dstIdx] = data[srcIdx * 3];
      croppedRgba[dstIdx + 1] = data[srcIdx * 3 + 1];
      croppedRgba[dstIdx + 2] = data[srcIdx * 3 + 2];
      croppedRgba[dstIdx + 3] = alpha[srcIdx];
    }
  }

  await sharp(croppedRgba, { raw: { width: cropW, height: cropH, channels: 4 } })
    .resize({ height: targetHeight })
    .png({ compressionLevel: 8 })
    .toFile(outputPath);
}

async function processAvatar(inputFile, outputFile) {
  const inputPath = path.join(sourceDir, inputFile);
  const outputPath = path.join(outputDir, outputFile);
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const alpha = buildAlphaMask(data, w, h, true);

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }

  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize(512, 512)
    .png({ compressionLevel: 8 })
    .toFile(outputPath);
}

async function run() {
  const duoMapping = [
    { in: 'source_celebrate.jpg', out: 'mascot_celebrate.png' },
    { in: 'source_celebrate.jpg', out: 'mascot_success.png' },
    { in: 'source_crying.jpg', out: 'mascot_crying.png' },
    { in: 'source_idle.jpg', out: 'mascot_idle.png' },
    { in: 'source_idle.jpg', out: 'avatar_team.png' },
    { in: 'source_wink.jpg', out: 'mascot_blink.png' },
    { in: 'source_wink.jpg', out: 'mascot_wink.png' },
    { in: 'source_wave.jpg', out: 'mascot_wave.png' },
    { in: 'source_yay.jpg', out: 'mascot_yay.png' },
    { in: 'source_jump.jpg', out: 'mascot_jump.png' },
    { in: 'source_encourage.jpg', out: 'mascot_encourage.png' },
    { in: 'source_sad.jpg', out: 'mascot_sad.png' },
    { in: 'source_thinking.jpg', out: 'mascot_thinking.png' },
  ];

  for (const item of duoMapping) {
    await processDuo(item.in, item.out);
  }

  await processAvatar('source_avatar_female.jpg', 'avatar_female.png');
  await processAvatar('source_avatar_male.jpg', 'avatar_male.png');

  console.log('Mascot assets built successfully in public/mascots!');
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { processDuo, processAvatar };
