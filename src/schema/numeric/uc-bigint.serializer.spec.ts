import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucBigInt } from './uc-bigint.js';

describe('UcBigInt serializer', () => {
  describe('by default', () => {
    let writeValue: UcSerializer<bigint>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: BigInt,
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes bigint value', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0n0');
      await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('0n13');
      await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe(
        '-0n13',
      );
    });

    describe('when converted to string', () => {
      let writeValue: UcSerializer<bigint>;

      beforeAll(async () => {
        const compiler = new UcsCompiler({
          models: {
            writeValue: ucBigInt({ string: 'serialize' }),
          },
        });

        ({ writeValue } = await compiler.evaluate());
      });

      it('serializes bigint value as string', async () => {
        await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe(
          "'0n0",
        );
        await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe(
          "'0n13",
        );
        await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe(
          "'-0n13",
        );
      });
    });
  });

  describe('when converted to number', () => {
    let writeValue: UcSerializer<bigint>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: ucBigInt({ number: 'serialize' }),
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes bigint value as number', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0');
      await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('13');
      await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-13');

      const value = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

      await expect(TextOutStream.read(async to => await writeValue(to, value))).resolves.toBe(
        `${value}`,
      );
    });

    describe('when converted to string', () => {
      let writeValue: UcSerializer<bigint>;

      beforeAll(async () => {
        const compiler = new UcsCompiler({
          models: {
            writeValue: ucBigInt({ string: 'serialize', number: 'serialize' }),
          },
        });

        ({ writeValue } = await compiler.evaluate());
      });

      it('serializes bigint value as numeric string', async () => {
        await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe("'0");
        await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe(
          "'13",
        );
        await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe(
          "'-13",
        );

        const value = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

        await expect(TextOutStream.read(async to => await writeValue(to, value))).resolves.toBe(
          `'${value}`,
        );
      });
    });
  });

  describe('when auto-converted to number', () => {
    let writeValue: UcSerializer<bigint>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeValue: ucBigInt({ number: 'auto' }),
        },
      });

      ({ writeValue } = await compiler.evaluate());
    });

    it('serializes small enough bigint value as number', async () => {
      await expect(
        TextOutStream.read(async to => await writeValue(to, BigInt(Number.MIN_SAFE_INTEGER))),
      ).resolves.toBe(Number.MIN_SAFE_INTEGER.toString());
      await expect(
        TextOutStream.read(async to => await writeValue(to, BigInt(Number.MAX_SAFE_INTEGER))),
      ).resolves.toBe(Number.MAX_SAFE_INTEGER.toString());
    });
    it('serializes larger bigint value as bigint', async () => {
      const value1 = BigInt(Number.MIN_SAFE_INTEGER) - 1n;

      await expect(TextOutStream.read(async to => await writeValue(to, value1))).resolves.toBe(
        `-0n${-value1}`,
      );

      const value2 = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

      await expect(TextOutStream.read(async to => await writeValue(to, value2))).resolves.toBe(
        `0n${value2}`,
      );
    });

    describe('when converted to string', () => {
      let writeValue: UcSerializer<bigint>;

      beforeAll(async () => {
        const compiler = new UcsCompiler({
          models: {
            writeValue: ucBigInt({ string: 'serialize', number: 'auto' }),
          },
        });

        ({ writeValue } = await compiler.evaluate());
      });

      it('serializes small enough bigint value as numeric string', async () => {
        await expect(
          TextOutStream.read(async to => await writeValue(to, BigInt(Number.MIN_SAFE_INTEGER))),
        ).resolves.toBe(`'${Number.MIN_SAFE_INTEGER.toString()}`);
        await expect(
          TextOutStream.read(async to => await writeValue(to, BigInt(Number.MAX_SAFE_INTEGER))),
        ).resolves.toBe(`'${Number.MAX_SAFE_INTEGER.toString()}`);
      });
      it('serializes larger bigint value as bigint string', async () => {
        const value1 = BigInt(Number.MIN_SAFE_INTEGER) - 1n;

        await expect(TextOutStream.read(async to => await writeValue(to, value1))).resolves.toBe(
          `'-0n${-value1}`,
        );

        const value2 = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

        await expect(TextOutStream.read(async to => await writeValue(to, value2))).resolves.toBe(
          `'0n${value2}`,
        );
      });
    });
  });
});
