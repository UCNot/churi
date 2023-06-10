import { ucUnknown } from '#churi/core.js';
import { URIChargeCompiler } from '#churi/uri-charge/compiler.js';
import { UcdCompiler, ucdSupportDefaults } from 'churi/compiler.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const distDir = path.resolve(path.dirname(scriptPath), '..', 'dist');

await Promise.all([
  emitDefaultEntities(),
  emitUcValueDeserializer(),
  emitUcValueDeserializerTypes(),
  emitURIChargeDeserializer(),
  emitURIChargeDeserializerTypes(),
  emitMainModule(),
  emitMainModuleTypes(),
]);

async function emitDefaultEntities() {
  const compiler = new UcdCompiler({
    models: {},
    exportEntityHandler: true,
    features(compiler) {
      // Call explicitly rather enable to force entity handler generation.
      return ucdSupportDefaults(compiler);
    },
  });

  await fs.writeFile(
    path.join(distDir, 'churi.default-entities.js'),
    await compiler.generate(),
    'utf-8',
  );
}

async function emitUcValueDeserializer() {
  const compiler = new UcdCompiler({
    models: { parseUcValue: ucUnknown() },
    mode: 'sync',
  });

  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.js'),
    await compiler.generate(),
    'utf-8',
  );
}

async function emitUcValueDeserializerTypes() {
  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.d.ts'),
    [
      `/// <reference path="churi.core.d.ts" />\n`,
      `import type { UcDeserializer } from 'churi';\n`,
      '\n',
      `export const parseUcValue: UcDeserializer.Sync<unknown>;\n`,
    ],
    'utf-8',
  );
}

async function emitURIChargeDeserializer() {
  const compiler = new URIChargeCompiler();

  await fs.writeFile(
    path.join(distDir, 'churi.uri-charge.deserializer.js'),
    await compiler.generate(),
    'utf-8',
  );
}

async function emitURIChargeDeserializerTypes() {
  await fs.writeFile(
    path.join(distDir, 'churi.uri-charge.deserializer.d.ts'),
    [
      `/// <reference path="churi.core.d.ts" />\n`,
      `import type { UcDeserializer, URICharge } from 'churi';\n`,
      '\n',
      `export const parseURICharge: UcDeserializer.Sync<URICharge>;\n`,
    ],
    'utf-8',
  );
}

async function emitMainModule() {
  await fs.writeFile(
    path.join(distDir, 'churi.js'),
    [
      `export * from './churi.core.js';\n`,
      `export * from './churi.uc-value.deserializer.js';\n`,
      `export * from './churi.uri-charge.deserializer.js';\n`,
    ],
    'utf-8',
  );
}

async function emitMainModuleTypes() {
  await fs.writeFile(
    path.join(distDir, 'churi.d.ts'),
    [
      `/// <reference path="churi.core.d.ts" />\n`,
      `/// <reference path="churi.uc-value.deserializer.d.ts" />\n`,
      `/// <reference path="churi.uri-charge.deserializer.d.ts" />\n`,
      `\n`,
      `export * from './churi.uc-value.deserializer.js';\n`,
      `export * from './churi.uri-charge.deserializer.js';\n`,
    ],
    'utf-8',
  );
}
