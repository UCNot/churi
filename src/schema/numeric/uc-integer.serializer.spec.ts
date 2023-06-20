import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucInteger } from './uc-integer.js';

describe('UcInteger serializer', () => {
  describe('by default', () => {
    let writeValue: UcSerializer<number>;

    beforeEach(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: ucInteger(),
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes number', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 13))).resolves.toBe('13');
      await expect(TextOutStream.read(async to => await writeValue(to, -13))).resolves.toBe('-13');
    });
  });

  describe('when converted to string', () => {
    let writeValue: UcSerializer<number>;

    beforeEach(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: ucInteger({ string: 'serialize' }),
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
