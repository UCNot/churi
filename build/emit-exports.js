import { ucUnknown } from '#churi/core';
import { createURIChargeUcdLib } from '#churi/uri-charge/compiler';
import { UccCode, UcdSetup, ucdSupportDefaults } from 'churi/compiler';
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
  const lib = await new UcdSetup({
    models: {},
    features(setup) {
      // Call explicitly rather enable to force entity handler generation.
      ucdSupportDefaults(setup);
    },
  }).bootstrap();

  lib.declarations.declare('onEntity$byDefault', location => lib.createEntityHandler(location), {
    exported: true,
  });

  await fs.writeFile(
    path.join(distDir, 'churi.default-entities.js'),
    await new UccCode().write(lib.imports.asStatic(), '', lib.declarations).toText(),
    'utf-8',
  );
}

async function emitUcValueDeserializer() {
  const lib = await new UcdSetup({ models: { parseUcValue: ucUnknown() } }).bootstrap();

  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.js'),
    await lib.compileModule('sync').toText(),
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
  const lib = await createURIChargeUcdLib();

  await fs.writeFile(
    path.join(distDir, 'churi.uri-charge.deserializer.js'),
    await lib.compileModule('sync').toText(),
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
