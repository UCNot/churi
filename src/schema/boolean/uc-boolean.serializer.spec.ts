import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBoolean serializer', () => {
  let lib: UcsLib<{ writeValue: UcModel<boolean> }>;
  let writeValue: UcSerializer<boolean>;

  beforeEach(async () => {
    lib = await new UcsSetup({
      models: {
        writeValue: Boolean,
      },
    }).bootstrap();
    ({ writeValue } = await lib.compileFactory().toExports());
  });

  it('serializes boolean', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes optional boolean', async () => {
    const lib = await new UcsSetup({
      models: {
        writeValue: ucOptional(Boolean),
      },
    }).bootstrap();
    const { writeValue } = await lib.compileFactory().toExports();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
  it('serializes nullable boolean', async () => {
    const lib = await new UcsSetup({
      models: {
        writeValue: ucNullable(Boolean),
      },
    }).bootstrap();
    const { writeValue } = await lib.compileFactory().toExports();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
  });
  it('serializes optional nullable boolean', async () => {
    const lib = await new UcsSetup({
      models: {
        writeValue: ucOptional(ucNullable(Boolean)),
      },
    }).bootstrap();
    const { writeValue } = await lib.compileFactory().toExports();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
});
