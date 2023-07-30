import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../../compiler/serialization/ucs-compiler.js';
import { ucsEnableURIEncoded } from '../../../compiler/serialization/ucs-enable-uri-encoded.js';
import { ucBoolean } from '../../../schema/boolean/uc-boolean.js';
import { ucList } from '../../../schema/list/uc-list.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucBigInt } from '../../../schema/numeric/uc-bigint.js';
import { ucInteger } from '../../../schema/numeric/uc-integer.js';
import { ucNumber } from '../../../schema/numeric/uc-number.js';
import { ucString } from '../../../schema/string/uc-string.js';
import { ucNullable } from '../../../schema/uc-nullable.js';
import { ucOptional } from '../../../schema/uc-optional.js';
import { TextOutStream } from '../../../spec/text-out-stream.js';

describe('URI-encoded serializer', () => {
  it('serializes bigint', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writePrimitive: { model: BigInt, format: 'uriEncoded' },
        writeValue: { model: ucBigInt({ string: 'serialize' }), format: 'uriEncoded' },
        writeNumber: { model: ucBigInt({ number: 'serialize' }), format: 'uriEncoded' },
        writeAuto: { model: ucBigInt({ number: 'auto' }), format: 'uriEncoded' },
      },
    });

    const { writePrimitive, writeValue, writeNumber, writeAuto } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writePrimitive(to, -13n))).resolves.toBe(
      '-0n13',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-0n13');
    await expect(TextOutStream.read(async to => await writeNumber(to, -13n))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeAuto(to, -13n))).resolves.toBe('-13');
    await expect(
      TextOutStream.read(async to => await writeNumber(to, BigInt(Number.MAX_SAFE_INTEGER + 1))),
    ).resolves.toBe(BigInt(Number.MAX_SAFE_INTEGER + 1).toString());
    await expect(
      TextOutStream.read(async to => await writeAuto(to, BigInt(Number.MAX_SAFE_INTEGER + 1))),
    ).resolves.toBe(`0n` + BigInt(Number.MAX_SAFE_INTEGER + 1));
  });
  it('serializes boolean', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writePrimitive: { model: Boolean, format: 'uriEncoded' },
        writeValue: { model: ucBoolean(), format: 'uriEncoded' },
      },
    });

    const { writePrimitive, writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writePrimitive(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writePrimitive(to, false))).resolves.toBe(
      '-',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes number', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writePrimitive: { model: Number, format: 'uriEncoded' },
        writeValue: { model: ucNumber({ string: 'serialize' }), format: 'uriEncoded' },
      },
    });

    const { writePrimitive, writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writePrimitive(to, -13.1))).resolves.toBe(
      '-13.1',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, -13))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      '!-Infinity',
    );
  });
  it('serializes integer', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writeValue: { model: ucInteger({ string: 'serialize' }), format: 'uriEncoded' },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, -13.1))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      '-Infinity',
    );
  });
  it('serializes string', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writePrimitive: { model: String, format: 'uriEncoded' },
        writeValue: { model: ucString({ raw: 'escape' }), format: 'uriEncoded' },
      },
    });

    const { writePrimitive, writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writePrimitive(to, '1, b c!'))).resolves.toBe(
      '1%2C%20b%20c%21',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, '1, b c!'))).resolves.toBe(
      '1%2C%20b%20c%21',
    );
  });
  it('can not serialize list', async () => {
    const schema = ucList(Number);
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writeList: { model: schema, format: 'uriEncoded' },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        schema,
        'list$uriEncoded(writer, value, asItem?): Can not serialize type "Number[]"',
      ),
    );
  });
  it('can not serialize map', async () => {
    const schema = ucMap({ foo: Number });
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        writeMap: { model: schema, format: 'uriEncoded' },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        schema,
        'map$uriEncoded(writer, value, asItem?): Can not serialize type "{foo: Number}"',
      ),
    );
  });
  it('can not serialize nullable values', async () => {
    const schema = ucNullable(ucNumber());
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        write: { model: schema, format: 'uriEncoded' },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        schema,
        'Number$uriEncodedN(writer, value, asItem?): Can not URI-encode nullable values'
          + ' of type "(Number | null)"',
      ),
    );
  });
  it('can not serialize optional values', async () => {
    const schema = ucOptional(ucNumber());
    const compiler = new UcsCompiler({
      capabilities: ucsEnableURIEncoded,
      models: {
        write: { model: schema, format: 'uriEncoded' },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        schema,
        'Number$uriEncodedO(writer, value, asItem?): Can not URI-encode optional values'
          + ' of type "Number?"',
      ),
    );
  });
});
