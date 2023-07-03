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
  emitDeserializerDefaults(),
  emitUcValueDeserializer(),
  emitUcValueDeserializerTypes(),
  emitURIChargeDeserializer(),
  emitURIChargeDeserializerTypes(),
  emitMainModule(),
  emitMainModuleTypes(),
]);

async function emitDeserializerDefaults() {
  const compiler = new UcdCompiler({
    models: {},
    exportDefaults: true,
    features(compiler) {
      // Call explicitly rather enable to force default handlers generation.
      return ucdSupportDefaults(compiler);
    },
  });

  await writeDistFile(
    'churi.deserializer.defaults.js',
    await compiler.generate(
      {},
      `export { onMeta$byDefault } from '#churi/uc-value/deserializer.js';`,
    ),
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

  await writeDistFile(
    'churi.uc-value.deserializer.js',
    await compiler.generate({}, (_, { ns }) => {
      ns.refer(onMeta$byDefault);
    }),
  );
}

async function emitUcValueDeserializerTypes() {
  await writeDistFile(
    'churi.uc-value.deserializer.d.ts',
    `
/// <reference path="churi.core.d.ts" />
import type { UcDeserializer } from 'churi';

export const parseUcValue: UcDeserializer.Sync<unknown>;
`,
  );
}

async function emitURIChargeDeserializer() {
  const compiler = new URIChargeCompiler();

  await writeDistFile('churi.uri-charge.deserializer.js', await compiler.generate());
}

async function emitURIChargeDeserializerTypes() {
  await writeDistFile(
    'churi.uri-charge.deserializer.d.ts',
    `
/// <reference path="churi.core.d.ts" />
import type { UcDeserializer, URICharge } from 'churi';

export const parseURICharge: UcDeserializer.Sync<URICharge>;
`,
  );
}

async function emitMainModule() {
  await writeDistFile(
    'churi.js',
    `
export * from './churi.core.js';
export { parseUcValue } from './churi.uc-value.deserializer.js';
export { parseURICharge } from './churi.uri-charge.deserializer.js';
`,
  );
}

async function emitMainModuleTypes() {
  await writeDistFile(
    'churi.d.ts',
    `
/// <reference path="churi.core.d.ts" />
/// <reference path="churi.uc-value.deserializer.d.ts" />
/// <reference path="churi.uri-charge.deserializer.d.ts" />

export { parseUcValue } from './churi.uc-value.deserializer.js';
export { parseURICharge } from './churi.uri-charge.deserializer.js';
`,
  );
}

async function writeDistFile(name, contents) {
  const distFile = path.join(distDir, name);

  await fs.writeFile(distFile, contents.trimStart(), 'utf-8');

  console.info('Generated', path.relative('..', distFile));
}
