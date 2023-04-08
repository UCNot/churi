import { ucUnknown } from '#churi/core';
import { URIChargeUcdLib } from '#churi/uri-charge/compiler';
import { DefaultUcdDefs, UccCode, UcdLib } from 'churi/compiler';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const distDir = path.resolve(path.dirname(scriptPath), '..', 'dist');

class DefaultUcdLib extends UcdLib {

  constructor() {
    super({ schemae: { parseUcValue: ucUnknown() } });
  }

}

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
  const lib = new DefaultUcdLib();

  await fs.writeFile(
    path.join(distDir, 'churi.default-entities.js'),
    new UccCode()
      .write(
        lib.imports.asStatic(),
        '',
        lib.createEntityHandler({
          entityDefs: DefaultUcdDefs.filter(def => !!def.entity || !!def.entityPrefix),
          prefix: `export const onEntity$byDefault = `,
          suffix: ';',
        }),
      )
      .toString(),
    'utf-8',
  );
}

async function emitUcValueDeserializer() {
  const lib = new DefaultUcdLib();

  await fs.writeFile(
    path.join(distDir, 'churi.uc-value.deserializer.js'),
    lib.compileModule('sync').print(),
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
  await fs.writeFile(
    path.join(distDir, 'churi.uri-charge.deserializer.js'),
    new URIChargeUcdLib().compileModule('sync').print(),
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
