import { describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { ucInteger } from './uc-integer.js';

describe('UcInteger JSON serializer', () => {
  it('serializes number', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucInteger({
            where: ucFormatJSON(),
          }),
        },
        writeAsString: {
          model: ucInteger({
            string: 'serialize',
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue, writeAsString } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, -13.1))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeAsString(to, -13.1))).resolves.toBe(
      '"-13"',
    );

    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      'null',
    );
    await expect(TextOutStream.read(async to => await writeAsString(to, -Infinity))).resolves.toBe(
      'null',
    );

    await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe('null');
    await expect(TextOutStream.read(async to => await writeAsString(to, NaN))).resolves.toBe(
      'null',
    );
  });
  it('serializes nullable number', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucNullable(
            ucInteger({
              where: ucFormatJSON(),
            }),
          ),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('null');
    await expect(TextOutStream.read(async to => await writeValue(to, 13.1))).resolves.toBe('13');
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      'null',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe('null');
  });
  it('serializes optional number', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucOptional(
            ucInteger({
              where: ucFormatJSON(),
            }),
          ),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe(
      'null',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, -13.1))).resolves.toBe('-13');
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      'null',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe('null');
  });
});
