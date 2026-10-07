import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(fullPath);
    return entry.isFile() && /\.[jt]sx?$/.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

let errors = 0;
for (const file of await files('app')) {
  const source = await readFile(file, 'utf8');
  if (!/^['"]use server['"];?/.test(source)) continue;
  for (const match of source.matchAll(/^export\s+(?!async\s+function\b|type\b|interface\b)(.+)$/gm)) {
    console.error(`${file}: a use server module may export only async functions (found ${match[1].trim()})`);
    errors += 1;
  }
}
if (errors > 0) process.exitCode = 1;
