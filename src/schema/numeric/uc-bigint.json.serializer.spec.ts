import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucBigInt } from './uc-bigint.js';

describe('UcBigInt JSON serializer', () => {
  const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
  const tooSmall = BigInt(Number.MIN_SAFE_INTEGER) - 1n;

  it('serializes bigint value', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucBigInt({
            where: ucFormatJSON(),
          }),
        },
        writeAsNumber: {
          model: ucBigInt({
            number: 'serialize',
            where: ucFormatJSON(),
          }),
        },
        writeAsString: {
          model: ucBigInt({
            string: 'serialize',
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue, writeAsNumber, writeAsString } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeValue(to, tooBig))).resolves.toBe(
      `"${tooBig}"`,
    );
    await expect(TextOutStream.read(async to => await writeValue(to, tooSmall))).resolves.toBe(
      `"${tooSmall}"`,
    );

    await expect(TextOutStream.read(async to => await writeAsNumber(to, -13n))).resolves.toBe(
      '-13',
    );
    await expect(TextOutStream.read(async to => await writeAsNumber(to, tooBig))).resolves.toBe(
      `${tooBig}`,
    );
    await expect(TextOutStream.read(async to => await writeAsNumber(to, tooSmall))).resolves.toBe(
      `${tooSmall}`,
    );

    await expect(TextOutStream.read(async to => await writeAsString(to, -13n))).resolves.toBe(
      '"-13"',
    );
    await expect(TextOutStream.read(async to => await writeAsString(to, tooBig))).resolves.toBe(
      `"${tooBig}"`,
    );
    await expect(TextOutStream.read(async to => await writeAsString(to, tooSmall))).resolves.toBe(
      `"${tooSmall}"`,
    );
  });
  it('requires string representation by default', async () => {
    const schema = ucBigInt({
      string: 'reject',
      where: ucFormatJSON(),
    });
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: schema,
        },
      },
    });

    await expect(compiler.generate()).rejects.toThrow(
      new UnsupportedUcSchemaError(schema, `BigInt value has to be representable as string`),
    );
  });
  it('does not require string representation when represented as number', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucBigInt({
            number: 'serialize',
            string: 'reject',
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-13');
  });
  it('prefixes value when can not be represented as string', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucBigInt({
            number: 'reject',
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('"0n13"');
    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe(
      '"-0n13"',
    );
  });
});
