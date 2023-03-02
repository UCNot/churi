import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptStat = await fs.stat(scriptPath);

const sourceDir = path.resolve(path.dirname(scriptPath), '..', 'src');

await genSync(
  path.join(sourceDir, 'deserializer', 'impl', 'ucd-read-value.ts'),
  'ucd-read-value.sync.ts',
  ['async ', ''],
  ['await ', ''],
  [/: Promise<(.*)> {/g, ': $1 {'],
  ['./async-ucd-reader.js', './sync-ucd-reader.js'],
  ['AsyncUcdReader', 'SyncUcdReader'],
  [/ucd(Read|Find|Skip)([\w$]+)/g, 'ucd$1$2Sync'],
);

/**
 * @param {string} sourceFile
 * @param {string} targetFile
 * @param {[RegExp, string][]} replace
 *
 * @returns {Promise<void>}
 */
async function genSync(sourceFile, targetFile, ...replacements) {
  targetFile = path.resolve(path.dirname(sourceFile), targetFile);

  const sourceStat = await fs.stat(sourceFile);
  /** @type {import('node:fs').Stats} */
  let targetStat;

  try {
    targetStat = await fs.stat(targetFile);
  } catch {
    // No target file.
  }

  if (
    targetStat
    && targetStat.mtimeMs > sourceStat.mtimeMs
    && targetStat.mtimeMs > scriptStat.mtimeMs
  ) {
    return; // No modified.
  }

  const sourceName = path.relative(path.dirname(targetFile), sourceFile);

  const banner = `/* istanbul ignore file */
/* eslint-disable */
/* @formatter:off */
/*
 * Converted from: ${sourceName}
 *
 * !!! DO NOT MODIFY !!!
 */
`;

  const sourceCode = await fs.readFile(sourceFile, 'utf-8');
  let targetCode = sourceCode;

  for (const [pattern, replacement] of replacements) {
    targetCode = targetCode.replaceAll(pattern, replacement);
  }

  await fs.writeFile(targetFile, `${banner}${targetCode}`);
}
