import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { sanitizeImageMetadata } from '../src/lib/image-metadata.ts';

const types = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

async function images(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) return images(file);
      return types.has(path.extname(entry.name).toLowerCase()) ? [file] : [];
    }),
  );
  return nested.flat();
}

function jpegFixture() {
  return Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9, 0x53, 0x45,
    0x46, 0x54,
  ]);
}

function webpFixture() {
  const bytes = new Uint8Array(42);
  bytes.set(Buffer.from('RIFF'), 0);
  new DataView(bytes.buffer).setUint32(4, 34, true);
  bytes.set(Buffer.from('WEBPVP8X'), 8);
  new DataView(bytes.buffer).setUint32(16, 10, true);
  bytes[20] = 0x2c;
  bytes.set(Buffer.from('EXIF'), 30);
  new DataView(bytes.buffer).setUint32(34, 4, true);
  bytes.set(Buffer.from('test'), 38);
  return bytes;
}

function pngFixture() {
  return Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 116, 69, 88, 116, 0, 0, 0, 0, 0, 0, 0, 0, 73, 69,
    78, 68, 0, 0, 0, 0,
  ]);
}

const strippedJpeg = sanitizeImageMetadata(jpegFixture(), 'image/jpeg');
assert.deepEqual([...strippedJpeg], [0xff, 0xd8, 0xff, 0xd9]);
const strippedPng = sanitizeImageMetadata(pngFixture(), 'image/png');
assert.equal(strippedPng.length, 20);
assert.equal(Buffer.from(strippedPng.subarray(12, 16)).toString(), 'IEND');
const strippedWebp = sanitizeImageMetadata(webpFixture(), 'image/webp');
assert.equal(strippedWebp.length, 30);
assert.equal(strippedWebp[20] & 0x2c, 0);

const publicDirectory = path.join(process.cwd(), 'public');
const files = await images(publicDirectory);
const unsafe: string[] = [];
for (const file of files) {
  const original = await readFile(file);
  const type = types.get(path.extname(file).toLowerCase())!;
  const sanitized = sanitizeImageMetadata(original, type);
  if (!Buffer.from(sanitized).equals(original)) unsafe.push(path.relative(process.cwd(), file));
}

if (unsafe.length) {
  console.error('Public images contain removable metadata or trailing data:');
  for (const file of unsafe) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log(
    `PASS: ${files.length} public images contain no removable metadata or trailing data.`,
  );
}
