import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBoolean serializer', () => {
  let setup: UcsSetup<{ writeValue: UcModel<boolean> }>;
  let writeValue: UcSerializer<boolean>;

  beforeEach(async () => {
    setup = new UcsSetup({
      models: {
        writeValue: Boolean,
      },
    });
    ({ writeValue } = await setup.evaluate());
  });

  it('serializes boolean', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes optional boolean', async () => {
    const setup = new UcsSetup({
      models: {
        writeValue: ucOptional(Boolean),
      },
    });
    const { writeValue } = await setup.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
  it('serializes nullable boolean', async () => {
    const setup = new UcsSetup({
      models: {
        writeValue: ucNullable(Boolean),
      },
    });
    const { writeValue } = await setup.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
  });
  it('serializes optional nullable boolean', async () => {
    const setup = new UcsSetup({
      models: {
        writeValue: ucOptional(ucNullable(Boolean)),
      },
    });
    const { writeValue } = await setup.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
});
