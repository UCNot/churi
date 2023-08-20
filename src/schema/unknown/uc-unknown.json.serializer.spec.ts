import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { UcsModels } from '../../compiler/serialization/ucs-models.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucUnknown } from './uc-unknown.js';

describe('UcUnknown JSON serializer', () => {
  let writeValue: UcSerializer<unknown>;

  beforeAll(async () => {
    const compiler = new UcsCompiler<{ writeValue: UcsModels.Entry<UcModel> }>({
      models: {
        writeValue: {
          model: ucUnknown({
            where: ucFormatJSON(),
          }),
        },
      },
    });

    ({ writeValue } = await compiler.evaluate());
  });

  it('serializes primitive values', async () => {
    await expect(TextOutStream.read(async writer => await writeValue(writer, 1))).resolves.toBe(
      '1',
    );
    await expect(
      TextOutStream.read(async writer => await writeValue(writer, '0123')),
    ).resolves.toBe('"0123"');
    await expect(TextOutStream.read(async writer => await writeValue(writer, true))).resolves.toBe(
      'true',
    );
    await expect(TextOutStream.read(async writer => await writeValue(writer, false))).resolves.toBe(
      'false',
    );
    await expect(TextOutStream.read(async writer => await writeValue(writer, null))).resolves.toBe(
      'null',
    );
  });
  it('serializes lists', async () => {
    await expect(
      TextOutStream.read(async writer => await writeValue(writer, [1, 2, 3])),
    ).resolves.toBe('[1,2,3]');
    await expect(TextOutStream.read(async writer => await writeValue(writer, [1]))).resolves.toBe(
      '[1]',
    );
    await expect(TextOutStream.read(async writer => await writeValue(writer, []))).resolves.toBe(
      '[]',
    );
    await expect(TextOutStream.read(async writer => await writeValue(writer, [[]]))).resolves.toBe(
      '[[]]',
    );
  });
  it('serializes maps', async () => {
    await expect(
      TextOutStream.read(async writer => await writeValue(writer, { foo: 'bar', baz: '' })),
    ).resolves.toBe('{"foo":"bar","baz":""}');
    await expect(
      TextOutStream.read(async writer => await writeValue(writer, { foo: { bar: 'baz' } })),
    ).resolves.toBe('{"foo":{"bar":"baz"}}');
    await expect(TextOutStream.read(async writer => await writeValue(writer, {}))).resolves.toBe(
      '{}',
    );
    await expect(
      TextOutStream.read(async writer => await writeValue(writer, { foo: { bar: {} } })),
    ).resolves.toBe('{"foo":{"bar":{}}}');
  });
});
