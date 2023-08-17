import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../../compiler/serialization/ucs-compiler.js';
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
import { ucFormatURIEncoded } from './uc-format-uri-encoded.js';

describe('URI-encoded serializer', () => {
  it('serializes bigint', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucBigInt({
            string: 'serialize',
            where: ucFormatURIEncoded(),
          }),
        },
        writeNumber: {
          model: ucBigInt({
            number: 'serialize',
            where: ucFormatURIEncoded(),
          }),
        },
        writeAuto: {
          model: ucBigInt({
            number: 'auto',
            where: ucFormatURIEncoded(),
          }),
        },
      },
    });

    const { writeValue, writeNumber, writeAuto } = await compiler.evaluate();

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
      models: {
        writeValue: { model: ucBoolean({ where: ucFormatURIEncoded() }) },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
  });
  it('serializes number', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucNumber({
            string: 'serialize',
            where: ucFormatURIEncoded(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, -13.1))).resolves.toBe(
      '-13.1',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      '!-Infinity',
    );
  });
  it('serializes integer', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucInteger({
            string: 'serialize',
            where: ucFormatURIEncoded(),
          }),
        },
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
      models: {
        writeValue: {
          model: ucString({
            raw: 'escape',
            where: ucFormatURIEncoded(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, '1, b c!'))).resolves.toBe(
      '1%2C%20b%20c%21',
    );
  });
  it('can not serialize list', async () => {
    const schema = ucList(Number, {
      where: ucFormatURIEncoded(),
    });
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: schema,
        },
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
    const schema = ucMap(
      {
        foo: Number,
      },
      {
        where: ucFormatURIEncoded(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
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
    const schema = ucNullable(ucNumber({ where: ucFormatURIEncoded() }));
    const compiler = new UcsCompiler({
      models: {
        write: {
          model: schema,
        },
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
    const schema = ucOptional(ucNumber({ where: ucFormatURIEncoded() }));
    const compiler = new UcsCompiler({
      models: {
        write: {
          model: schema,
        },
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
