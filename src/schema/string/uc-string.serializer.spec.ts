import { beforeEach, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UC_MODULE_SPEC } from '../../compiler/impl/uc-modules.js';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { UcsFunction } from '../../compiler/serialization/ucs-function.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucNullable } from '../uc-nullable.js';
import { UcSchema } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucString } from './uc-string.js';

describe('UcString serializer', () => {
  describe('by default', () => {
    let writeValue: UcSerializer<string>;

    beforeEach(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: String,
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('percent-encodes special symbols', async () => {
      await expect(
        TextOutStream.read(async to => await writeValue(to, 'Hello, %(World)!')),
      ).resolves.toBe('Hello%2C %25%28World%29!');
    });
    it('retains tab, space, new line and line feed', async () => {
      await expect(
        TextOutStream.read(async to => await writeValue(to, '\t \n \r\n')),
      ).resolves.toBe("'\t \n \r\n");
    });
    it('percent-encodes control chars', async () => {
      const value =
        '\0\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u000b\u000c\u000e\u000f'
        + '\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019';

      await expect(TextOutStream.read(async to => await writeValue(to, value))).resolves.toBe(
        encodeURIComponent(value),
      );
    });
    it('does not escape empty string', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe('');
    });
    it('escapes numeric strings', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, '123'))).resolves.toBe(
        "'123",
      );
      await expect(TextOutStream.read(async to => await writeValue(to, '-123'))).resolves.toBe(
        "'-123",
      );
    });
    it('escapes hyphens', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, '-'))).resolves.toBe("'-");
      await expect(TextOutStream.read(async to => await writeValue(to, '--'))).resolves.toBe("'--");
      await expect(TextOutStream.read(async to => await writeValue(to, '---'))).resolves.toBe(
        '---',
      );
    });
    it('writes multiple chunks', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: String,
        },
        createSerializer<T, TSchema extends UcSchema<T>>(options: UcsFunction.Options<T, TSchema>) {
          return new UcsFunction<T, TSchema>({
            ...options,
            createWriter({ stream }) {
              const UcsWriter = UC_MODULE_SPEC.import('SmallChunkUcsWriter');

              return esline`new ${UcsWriter}(${stream}, 4);`;
            },
          });
        },
      });
      const { writeValue } = await compiler.evaluate();

      await expect(
        TextOutStream.read(
          async to => await writeValue(to, '1234567890'),
          undefined,
          new ByteLengthQueuingStrategy({ highWaterMark: 4 }),
        ),
      ).resolves.toBe("'1234567890");
    });
  });

  describe('with raw strings', () => {
    let writeValue: UcSerializer<string>;

    beforeEach(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: ucString({ raw: 'asString' }),
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('percent-encodes special symbols', async () => {
      await expect(
        TextOutStream.read(async to => await writeValue(to, 'Hello, %(World)!')),
      ).resolves.toBe('Hello%2C %25%28World%29!');
    });
    it('does not escape numeric strings', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, '123'))).resolves.toBe(
        '123',
      );
      await expect(TextOutStream.read(async to => await writeValue(to, '-123'))).resolves.toBe(
        '-123',
      );
    });
    it('does not escape hyphens', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, '-'))).resolves.toBe('-');
      await expect(TextOutStream.read(async to => await writeValue(to, '--'))).resolves.toBe('--');
      await expect(TextOutStream.read(async to => await writeValue(to, '---'))).resolves.toBe(
        '---',
      );
    });

    describe('when nullable', () => {
      let writeValue: UcSerializer<string | null>;

      beforeEach(async () => {
        const compiler = new UcsCompiler({
          models: {
            writeValue: ucNullable(ucString({ raw: 'asString' })),
          },
        });

        ({ writeValue } = await compiler.evaluate());
      });

      it('encodes null', async () => {
        await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe(
          '--',
        );
      });
      it('escapes double hyphen', async () => {
        await expect(TextOutStream.read(async to => await writeValue(to, '--'))).resolves.toBe(
          "'--",
        );
      });
      it('does not escape single hyphen', async () => {
        await expect(TextOutStream.read(async to => await writeValue(to, '-'))).resolves.toBe('-');
      });
    });
  });
});
