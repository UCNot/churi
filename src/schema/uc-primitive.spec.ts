import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UcSerializer } from '../compiler/serialization/uc-serializer.js';
import { UcsFunction } from '../compiler/serialization/ucs-function.js';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { UcDeserializer } from '../deserializer/uc-deserializer.js';
import { chunkStream } from '../spec/chunk-stream.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcError, UcErrorInfo } from './uc-error.js';
import { ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { UcSchema } from './uc-schema.js';

describe('BigInt', () => {
  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<bigint> }>;
    let writeValue: UcSerializer<bigint>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: BigInt,
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

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error instanceof UcError ? error.toJSON() : error);
    };
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let lib: UcdLib<{ readValue: UcSchema.Spec<bigint> }>;
    let readValue: UcDeserializer<bigint>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readValue: BigInt,
        },
      });
      ({ readValue } = await lib.compile().toDeserializers());
    });

    it('deserializes number', async () => {
      await expect(readValue(chunkStream(' 0n123   '))).resolves.toBe(123n);
      await expect(readValue(chunkStream('-0n123'))).resolves.toBe(-123n);
    });
    it('deserializes hexadecimal number', async () => {
      await expect(readValue(chunkStream('0n0x123'))).resolves.toBe(0x123n);
      await expect(readValue(chunkStream('-0n0x123'))).resolves.toBe(-0x123n);
    });
    it('deserializes zero', async () => {
      await expect(readValue(chunkStream('0n0'))).resolves.toBe(0n);
      await expect(readValue(chunkStream('-0n0'))).resolves.toBe(-0n);
      await expect(readValue(chunkStream('0n'))).resolves.toBe(0n);
      await expect(readValue(chunkStream('-0n'))).resolves.toBe(-0n);
    });
    it('rejects NaN', async () => {
      await expect(readValue(chunkStream('0nz'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'invalidSyntax',
          details: { type: 'bigint' },
          message: 'Cannot convert z to a BigInt',
          cause: new SyntaxError('Cannot convert z to a BigInt'),
        },
      ]);
    });
    it('rejects number', async () => {
      await expect(readValue(chunkStream('123'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: { type: 'number', expected: { types: ['bigint'] } },
          message: 'Unexpected number, while bigint expected',
        },
      ]);
    });
  });
});

describe('Boolean', () => {
  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<boolean> }>;
    let writeValue: UcSerializer<boolean>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: Boolean,
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
          writeValue: ucOptional(Boolean),
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
          writeValue: ucNullable(Boolean),
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
          writeValue: ucOptional(ucNullable(Boolean)),
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

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error instanceof UcError ? error.toJSON() : error);
    };
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let lib: UcdLib<{ readValue: UcSchema.Spec<boolean> }>;
    let readValue: UcDeserializer<boolean>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readValue: Boolean,
        },
      });
      ({ readValue } = await lib.compile().toDeserializers());
    });

    it('deserializes boolean', async () => {
      await expect(readValue(chunkStream('!'))).resolves.toBe(true);
      await expect(readValue(chunkStream(' ! '))).resolves.toBe(true);
      await expect(readValue(chunkStream('-'))).resolves.toBe(false);
      await expect(readValue(chunkStream(' -  '))).resolves.toBe(false);
    });
    it('rejects null', async () => {
      await expect(readValue(chunkStream('--'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'null',
            expected: {
              types: ['boolean'],
            },
          },
          message: 'Unexpected null, while boolean expected',
        },
      ]);
    });
    it('rejects nested list', async () => {
      await expect(readValue(chunkStream('()'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'nested list',
            expected: {
              types: ['boolean'],
            },
          },
          message: 'Unexpected nested list, while boolean expected',
        },
      ]);
    });
    it('rejects second item', async () => {
      await expect(readValue(chunkStream('!,-'), { onError })).resolves.toBe(true);

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'list',
            expected: {
              types: ['boolean'],
            },
          },
          message: 'Unexpected list, while boolean expected',
        },
      ]);
    });

    describe('nullable', () => {
      let lib: UcdLib<{ readValue: UcSchema.Spec<boolean | null> }>;
      let readValue: UcDeserializer<boolean | null>;

      beforeEach(async () => {
        lib = new UcdLib({
          schemae: {
            readValue: ucNullable<boolean>(Boolean),
          },
        });
        ({ readValue } = await lib.compile().toDeserializers());
      });

      it('deserializes boolean', async () => {
        await expect(readValue(chunkStream('!'))).resolves.toBe(true);
        await expect(readValue(chunkStream(' ! '))).resolves.toBe(true);
        await expect(readValue(chunkStream('-'))).resolves.toBe(false);
        await expect(readValue(chunkStream(' -  '))).resolves.toBe(false);
      });
      it('deserializes null', async () => {
        await expect(readValue(chunkStream('--'))).resolves.toBeNull();
        await expect(readValue(chunkStream('   --'))).resolves.toBeNull();
        await expect(readValue(chunkStream('--   \r\n'))).resolves.toBeNull();
      });
      it('rejects number', async () => {
        await expect(readValue(chunkStream('-1'), { onError })).resolves.toBeUndefined();

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'number',
              expected: {
                types: ['boolean', 'null'],
              },
            },
            message: 'Unexpected number, while boolean or null expected',
          },
        ]);
      });
    });
  });
});

describe('Number', () => {
  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<number> }>;
    let writeValue: UcSerializer<number>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: Number,
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

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error instanceof UcError ? error.toJSON() : error);
    };
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let lib: UcdLib<{ readValue: UcSchema.Spec<number> }>;
    let readValue: UcDeserializer<number>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readValue: Number,
        },
      });
      ({ readValue } = await lib.compile().toDeserializers());
    });

    it('deserializes number', async () => {
      await expect(readValue(chunkStream('123'))).resolves.toBe(123);
      await expect(readValue(chunkStream('-123'))).resolves.toBe(-123);
    });
    it('deserializes percent-encoded number', async () => {
      await expect(readValue(chunkStream('%3123'))).resolves.toBe(123);
      await expect(readValue(chunkStream('%2D%3123'))).resolves.toBe(-123);
    });
    it('deserializes hexadecimal number', async () => {
      await expect(readValue(chunkStream('0x123'))).resolves.toBe(0x123);
      await expect(readValue(chunkStream('-0x123'))).resolves.toBe(-0x123);
    });
    it('deserializes zero', async () => {
      await expect(readValue(chunkStream('0'))).resolves.toBe(0);
      await expect(readValue(chunkStream('-0'))).resolves.toBe(-0);
    });
    it('rejects NaN', async () => {
      await expect(readValue(chunkStream('0xz'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'invalidSyntax',
          details: { type: 'number' },
          message: 'Not a number',
        },
      ]);
    });
    it('rejects bigint', async () => {
      await expect(readValue(chunkStream('0n1'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: { type: 'bigint', expected: { types: ['number'] } },
          message: 'Unexpected bigint, while number expected',
        },
      ]);
    });
    it('rejects boolean', async () => {
      await expect(readValue(chunkStream('-'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: { type: 'boolean', expected: { types: ['number'] } },
          message: 'Unexpected boolean, while number expected',
        },
      ]);
    });
    it('rejects string', async () => {
      await expect(readValue(chunkStream("'1"), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: { type: 'string', expected: { types: ['number'] } },
          message: 'Unexpected string, while number expected',
        },
      ]);
    });
  });
});

describe('String', () => {
  describe('serializer', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<string> }>;
    let writeValue: UcSerializer<string>;

    beforeEach(async () => {
      lib = new UcsLib({
        schemae: {
          writeValue: String,
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
          writeValue: String,
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

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error instanceof UcError ? error.toJSON() : error);
    };
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let lib: UcdLib<{ readValue: UcSchema.Spec<string> }>;
    let readValue: UcDeserializer<string>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readValue: String,
        },
      });
      ({ readValue } = await lib.compile().toDeserializers());
    });

    it('deserializes string', async () => {
      await expect(readValue(chunkStream('some string'))).resolves.toBe('some string');
    });
    it('deserializes multiline string', async () => {
      await expect(readValue(chunkStream('prefix\r', '\n-end(suffix'))).resolves.toBe(
        'prefix\r\n-end(suffix',
      );
    });
    it('URI-decodes string', async () => {
      await expect(readValue(chunkStream('some%20string'))).resolves.toBe('some string');
    });
    it('deserializes empty string', async () => {
      await expect(readValue(chunkStream(''))).resolves.toBe('');
      await expect(readValue(chunkStream(')'))).resolves.toBe('');
    });
    it('deserializes minus-prefixed string', async () => {
      await expect(readValue(chunkStream('-a%55c'))).resolves.toBe('-aUc');
      await expect(readValue(chunkStream('%2Da%55c'))).resolves.toBe('-aUc');
    });
    it('deserializes quoted string', async () => {
      await expect(readValue(chunkStream("'abc"))).resolves.toBe('abc');
    });
    it('deserializes balanced parentheses within quoted string', async () => {
      await expect(readValue(chunkStream("'abc(def()))"))).resolves.toBe('abc(def())');
    });
    it('does not close unbalanced parentheses within quoted string', async () => {
      await expect(readValue(chunkStream("'abc(def("))).resolves.toBe('abc(def(');
    });
    it('rejects map', async () => {
      await expect(readValue(chunkStream('foo(bar)'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'map',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected map, while string expected',
        },
      ]);
    });
    it('rejects suffix', async () => {
      await expect(readValue(chunkStream('$foo'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'map',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected map, while string expected',
        },
      ]);
    });
  });
});
