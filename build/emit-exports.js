import { ucUnknown } from '#churi/core.js';
import { URIChargeCompiler } from '#churi/uri-charge/compiler.js';
import { UcdCompiler, ucdSupportDefaults } from 'churi/compiler.js';
import { EsFunction, esline } from 'esgen';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const distDir = path.resolve(path.dirname(scriptPath), '..', 'dist');

await Promise.all([
  emitDefaults(),
  emitUcValueDeserializer(),
  emitUcValueDeserializerTypes(),
  emitURIChargeDeserializer(),
  emitURIChargeDeserializerTypes(),
  emitMainModule(),
  emitMainModuleTypes(),
]);

async function emitDefaults() {
  const compiler = new UcdCompiler({
    models: {},
    exportDefaults: true,
    features(compiler) {
      // Call explicitly rather enable to force default handlers generation.
      return ucdSupportDefaults(compiler);
    },
  });

  await fs.writeFile(
    path.join(distDir, 'churi.defaults.js'),
    await compiler.generate(
      {},
      `export { onMeta$byDefault } from '#churi/uc-value/deserializer.js';`,
    ),
    'utf-8',
  );
}

async function emitUcValueDeserializer() {
  const compiler = new UcdCompiler({
    models: { parseUcValue: ucUnknown() },
    mode: 'sync',
  });

  const onMeta$byDefault = new EsFunction(
    'onMeta$byDefault',
    { cx: {}, rx: {}, attr: {} },
    {
      declare: {
        at: 'exports',
        body: ({ args: { cx, attr } }) => esline`return new AnyUcrx($ => ${cx}.meta.add(${attr}, $));`,
      },
    },
  );

  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.js'),
    await compiler.generate({}, (_, { ns }) => {
      ns.refer(onMeta$byDefault);
    }),
    'utf-8',
  );
}

async function emitUcValueDeserializerTypes() {
  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.d.ts'),
    `
/// <reference path="churi.core.d.ts" />
import type { UcDeserializer } from 'churi';

export const parseUcValue: UcDeserializer.Sync<unknown>;
`.trimStart(),
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
    `
/// <reference path="churi.core.d.ts" />
import type { UcDeserializer, URICharge } from 'churi';

export const parseURICharge: UcDeserializer.Sync<URICharge>;
`.trimStart(),
    'utf-8',
  );
}

async function emitMainModule() {
  await fs.writeFile(
    path.join(distDir, 'churi.js'),
    `
export * from './churi.core.js';
export { parseUcValue } from './churi.uc-value.deserializer.js';
export { parseURICharge } from './churi.uri-charge.deserializer.js';
`.trimStart(),
    'utf-8',
  );
}

async function emitMainModuleTypes() {
  await fs.writeFile(
    path.join(distDir, 'churi.d.ts'),
    `
/// <reference path="churi.core.d.ts" />
/// <reference path="churi.uc-value.deserializer.d.ts" />
/// <reference path="churi.uri-charge.deserializer.d.ts" />

export { parseUcValue } from './churi.uc-value.deserializer.js';
export { parseURICharge } from './churi.uri-charge.deserializer.js';
`.trimStart(),
    'utf-8',
  );
}
