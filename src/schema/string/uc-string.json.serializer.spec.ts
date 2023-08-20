import { describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { ucString } from './uc-string.js';

describe('UcString JSON serializer', () => {
  it('serializes string', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucString({
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe('""');
    await expect(TextOutStream.read(async to => await writeValue(to, '"test"'))).resolves.toBe(
      '"\\"test\\""',
    );
  });
  it('serializes nullable string', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucNullable(
            ucString({
              where: ucFormatJSON(),
            }),
          ),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('null');
    await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe('""');
    await expect(TextOutStream.read(async to => await writeValue(to, '"test"'))).resolves.toBe(
      '"\\"test\\""',
    );
  });
  it('serializes optional string', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucOptional(
            ucString({
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
    await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe('""');
    await expect(TextOutStream.read(async to => await writeValue(to, '"test"'))).resolves.toBe(
      '"\\"test\\""',
    );
  });
});
