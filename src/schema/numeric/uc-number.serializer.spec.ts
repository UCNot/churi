import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucNumber } from './uc-number.js';

describe('UcNumber serializer', () => {
  describe('by default', () => {
    let writeValue: UcSerializer<number>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: { model: Number },
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes number', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 13))).resolves.toBe('13');
      await expect(TextOutStream.read(async to => await writeValue(to, -13))).resolves.toBe('-13');
    });
    it('serializes `NaN`', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe('!NaN');
    });
    it('serializes infinity', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, Infinity))).resolves.toBe(
        '!Infinity',
      );
      await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
        '!-Infinity',
      );
    });
  });

  describe('when converted to string', () => {
    let writeValue: UcSerializer<number>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: { model: ucNumber({ string: 'serialize' }) },
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes number', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 13))).resolves.toBe("'13");
      await expect(TextOutStream.read(async to => await writeValue(to, -13))).resolves.toBe("'-13");
    });
    it('serializes `NaN`', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe("'NaN");
    });
    it('serializes infinity', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, Infinity))).resolves.toBe(
        "'Infinity",
      );
      await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
        "'-Infinity",
      );
    });
  });
});
