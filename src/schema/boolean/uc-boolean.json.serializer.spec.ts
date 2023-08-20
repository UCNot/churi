import { describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { ucBoolean } from './uc-boolean.js';

describe('UcBoolean JSON serializer', () => {
  it('serializes boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucBoolean({
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('true');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe(
      'false',
    );
  });
  it('serializes nullable boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucNullable(
            ucBoolean({
              where: ucFormatJSON(),
            }),
          ),
        },
      },
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('null');
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('true');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe(
      'false',
    );
  });
  it('serializes optional boolean', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeValue: {
          model: ucOptional(
            ucBoolean({
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
    await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('true');
    await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe(
      'false',
    );
  });
});
