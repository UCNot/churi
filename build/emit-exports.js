import { DefaultUcdDefs, UccCode, UcdLib } from '@hatsy/churi/compiler';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const distDir = path.resolve(path.dirname(scriptPath), '..', 'dist');

class BuildLib extends UcdLib {

  constructor() {
    super({ schemae: {}, definitions: DefaultUcdDefs });
  }

}

const lib = new BuildLib();

await Promise.all([emitDefaultEntities(), emitMainModule()]);

async function emitDefaultEntities() {
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

async function emitMainModule() {
  await fs.writeFile(path.join(distDir, 'churi.js'), `export * from './churi.core.js';\n`, 'utf-8');
}
