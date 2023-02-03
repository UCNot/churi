import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcSerializer } from '../compiler/serialization/uc-serializer.js';
import { UcsFunction } from '../compiler/serialization/ucs-function.js';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { UcBigInt, UcBoolean, UcNumber, UcString } from './uc-primitive.js';
import { UcSchema } from './uc-schema.js';

describe('UcBigInt', () => {
  it('creates schema', () => {
    expect(UcBigInt()).toMatchObject({
      type: 'bigint',
    });
  });

  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcBigInt.Schema }>;
    let writeValue: UcSerializer<bigint>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: UcBigInt(),
        },
      });
      ({ writeValue } = await lib.compile().toSerializers());
    });

    it('serializes value', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0n0');
      await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('0n13');
      await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe(
        '-0n13',
      );
    });
  });
});

describe('UcBoolean', () => {
  it('creates schema', () => {
    expect(UcBoolean()).toMatchObject({
      type: 'boolean',
    });
  });

  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcBoolean.Schema }>;
    let writeValue: UcSerializer<boolean>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: UcBoolean(),
        },
      });
      ({ writeValue } = await lib.compile().toSerializers());
    });

    it('serializes boolean', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
      await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
    });
    it('serializes optional boolean', async () => {
      const lib = new UcsLib({
        schemae: {
          writeValue: ucOptional(UcBoolean()),
        },
      });
      const { writeValue } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
      await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
      await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe(
        '',
      );
    });
    it('serializes nullable boolean', async () => {
      const lib = new UcsLib({
        schemae: {
          writeValue: ucNullable(UcBoolean()),
        },
      });
      const { writeValue } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
      await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
      await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
    });
    it('serializes optional nullable boolean', async () => {
      const lib = new UcsLib({
        schemae: {
          writeValue: ucOptional(ucNullable(UcBoolean())),
        },
      });
      const { writeValue } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeValue(to, true))).resolves.toBe('!');
      await expect(TextOutStream.read(async to => await writeValue(to, false))).resolves.toBe('-');
      await expect(TextOutStream.read(async to => await writeValue(to, null))).resolves.toBe('--');
      await expect(TextOutStream.read(async to => await writeValue(to, undefined))).resolves.toBe(
        '',
      );
    });
  });
});

describe('UcNumber', () => {
  it('creates schema', () => {
    expect(UcNumber()).toMatchObject({
      type: 'number',
    });
  });

  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcNumber.Schema }>;
    let writeValue: UcSerializer<number>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: UcNumber(),
        },
      });
      ({ writeValue } = await lib.compile().toSerializers());
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
});

describe('UcString', () => {
  it('creates schema', () => {
    expect(UcString()).toMatchObject({
      type: 'string',
    });
  });

  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcString.Schema }>;
    let writeValue: UcSerializer<string>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: UcString(),
        },
      });
      ({ writeValue } = await lib.compile().toSerializers());
    });

    it('percent-encodes special symbols', async () => {
      await expect(
        TextOutStream.read(async to => await writeValue(to, 'Hello, %(World)!')),
      ).resolves.toBe("'Hello%2C %25%28World%29!");
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
        `'${encodeURIComponent(value)}`,
      );
    });
    it('escapes empty string', async () => {
      await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe("'");
    });
    it('writes multiple chunks', async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: UcString(),
        },
        createSerializer<T, TSchema extends UcSchema<T>>(options: UcsFunction.Options<T, TSchema>) {
          return new UcsFunction<T, TSchema>({
            ...options,
            createWriter(serializer, writer, stream) {
              const UcsWriter = serializer.lib.import('@hatsy/churi/spec', 'SmallChunkUcsWriter');

              return `const ${writer} = new ${UcsWriter}(${stream}, 4);`;
            },
          });
        },
      });
      ({ writeValue } = await lib.compile().toSerializers());

      await expect(
        TextOutStream.read(
          async to => await writeValue(to, '1234567890'),
          undefined,
          new ByteLengthQueuingStrategy({ highWaterMark: 4 }),
        ),
      ).resolves.toBe("'1234567890");
    });
  });
});
