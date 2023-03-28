import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcSchema } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBoolean serializer', () => {
  let lib: UcsLib<{ writeValue: UcSchema.Spec<boolean> }>;
  let writeValue: UcSerializer<boolean>;

  beforeEach(async () => {
    lib = new UcsLib({
      schemae: {
        writeValue: Boolean,
      },
    });
    ({ writeValue } = await lib.compile().toSerializers());
  });

  it('serializes boolean', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes optional boolean', async () => {
    const lib = new UcsLib({
      schemae: {
        writeValue: ucOptional(Boolean),
      },
    });
    const { writeValue } = await lib.compile().toSerializers();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
  it('serializes nullable boolean', async () => {
    const lib = new UcsLib({
      schemae: {
        writeValue: ucNullable(Boolean),
      },
    });
    const { writeValue } = await lib.compile().toSerializers();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
  });
  it('serializes optional nullable boolean', async () => {
    const lib = new UcsLib({
      schemae: {
        writeValue: ucOptional(ucNullable(Boolean)),
      },
    });
    const { writeValue } = await lib.compile().toSerializers();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
});
