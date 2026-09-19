import { readdir, readFile, writeFile } from 'node:fs/promises';
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

let changed = 0;
for (const file of await images(path.join(process.cwd(), 'public'))) {
  const original = await readFile(file);
  const type = types.get(path.extname(file).toLowerCase())!;
  const sanitized = sanitizeImageMetadata(original, type);
  if (!Buffer.from(sanitized).equals(original)) {
    await writeFile(file, sanitized);
    changed += 1;
    console.log(`Sanitized ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`Sanitized ${changed} public image${changed === 1 ? '' : 's'}.`);
