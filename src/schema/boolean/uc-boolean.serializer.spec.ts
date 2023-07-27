import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBoolean serializer', () => {
  let writeValue: UcSerializer<boolean>;

  beforeAll(async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: { model: Boolean },
      },
    });

    ({ writeValue } = await compiler.evaluate());
  });

  it('serializes boolean', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes optional boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: { model: ucOptional(Boolean) },
      },
    });
    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
  it('serializes nullable boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: { model: ucNullable(Boolean) },
      },
    });
    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
  });
  it('serializes optional nullable boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: { model: ucOptional(ucNullable(Boolean)) },
      },
    });
    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe('');
  });
});
