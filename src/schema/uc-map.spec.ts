import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchemaError } from '../compiler/unsupported-uc-schema.error.js';
import { UcDeserializer } from '../deserializer/uc-deserializer.js';
import { readTokens } from '../spec/read-chunks.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcError, UcErrorInfo } from './uc-error.js';
import { ucList } from './uc-list.js';
import { ucMap, UcMap } from './uc-map.js';
import { UcNullable, ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { ucSchemaName } from './uc-schema-name.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from './uc-schema.js';

describe('UcMap', () => {
  let spec: UcMap.Schema.Spec<{
    foo: UcSchema<string>;
    bar: UcSchema.Ref<number>;
  }>;
  let resolver: UcSchemaResolver;
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
    spec = ucMap({
      foo: new EntrySchema<string>('test-string'),
      bar: ucSchemaRef(() => new EntrySchema<number>('test-number')),
    });
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('entries', () => {
    it('contains per-entry schema', () => {
      expect([...Object.keys(resolver.schemaOf(spec).entries)]).toEqual(['foo', 'bar']);
    });
  });

  describe('type', () => {
    it('is set to `map`', () => {
      expect(schema.type).toBe('map');
    });
  });

  describe('name', () => {
    it('reflects entry schemae', () => {
      expect(ucSchemaName(schema)).toBe('{foo: test-string, bar: test-number}');
    });
    it('reflects only a few entry schemae', () => {
      const spec = ucMap({
        foo: new EntrySchema<string>('test-string'),
        '0abc': new EntrySchema<string>('test-string'),
        '%abc': new EntrySchema<string>('test-string'),
        bar: new EntrySchema<string>('test-string'),
      });
      const schema = resolver.schemaOf(spec);

      expect(ucSchemaName(schema)).toBe(
        `{foo: test-string, '0abc': test-string, '%abc': test-string, ...}`,
      );
    });
  });

  describe('serializer', () => {
    it('serializes map', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            foo: String,
            bar: Number,
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: 13 })),
      ).resolves.toBe("foo('test)bar(13)");
    });
    it('serializes nested map', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            foo: ucMap({
              test1: Number,
            }),
            bar: ucMap({
              test2: Number,
            }),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(
          async to => await writeMap(to, { foo: { test1: 11 }, bar: { test2: 22 } }),
        ),
      ).resolves.toBe('foo(test1(11))bar(test2(22))');
    });
    it('serializes list entry', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            foo: ucList(Number),
            bar: ucList<number[]>(ucList(Number)),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { foo: [11], bar: [[22, 333]] })),
      ).resolves.toBe('foo(,11)bar(,(22,333))');
    });
    it('serializes entry with empty key', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            '': String,
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { '': 'test' })),
      ).resolves.toBe("$('test)");
    });
    it('serializes entry with special keys', async () => {
      const specialKey = '(%)\r\n\t\u042a ' as const;
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            "'": String,
            '!': String,
            $: String,
            '\\': Number,
            [specialKey]: String,
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(
          async to => await writeMap(to, {
              "'": 'quote',
              '!': 'exclamation',
              $: 'dollar',
              '\\': 13,
              [specialKey]: '13',
            }),
        ),
      ).resolves.toBe("$'('quote)$!('exclamation)$$('dollar)\\(13)%28%25%29%0D%0A%09Ъ ('13)");
    });
    it('serializes nullable entry', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            test: ucNullable(String),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
      ).resolves.toBe("test('value)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: null })),
      ).resolves.toBe('test(--)');
    });
    it('serializes optional nullable entry', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            test: ucOptional(ucNullable(String)),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
      ).resolves.toBe("test('value)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: null })),
      ).resolves.toBe('test(--)');
      await expect(TextOutStream.read(async to => await writeMap(to, {}))).resolves.toBe('$');
    });
    it('serializes second entry with empty key', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            first: Number,
            '': String,
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
      ).resolves.toBe("first(1)$('test)");
    });
    it('serializes second entry with empty key when first one is optional', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            first: ucOptional(Number),
            '': String,
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
      ).resolves.toBe("first(1)$('test)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: undefined, '': 'test' })),
      ).resolves.toBe("$('test)");
    });
    it('does not serialize unrecognized schema', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: ucMap({
            test: new EntrySchema<string>('test-type'),
          }),
        },
      });

      let error: UnsupportedUcSchemaError | undefined;

      try {
        await lib.compile().toSerializers();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe(
        'writeMap$serialize: Can not serialize entry "test" of type "test-type"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
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

    describe('single entry', () => {
      let lib: UcdLib<{ readMap: UcMap.Schema<{ foo: UcSchema.Spec<string> }> }>;
      let readMap: UcDeserializer<{ foo: string }>;

      beforeEach(async () => {
        lib = new UcdLib({
          schemae: {
            readMap: ucMap<{ foo: UcSchema.Spec<string> }>({
              foo: String,
            }),
          },
        });
        ({ readMap } = await lib.compile().toDeserializers());
      });

      it('deserializes entry', async () => {
        await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
      });
      it('deserializes $-escaped entry', async () => {
        await expect(readMap(readTokens('$foo(bar)'))).resolves.toEqual({ foo: 'bar' });
      });
      it('deserializes $-escaped suffix', async () => {
        await expect(readMap(readTokens('$foo'))).resolves.toEqual({ foo: '' });
        await expect(readMap(readTokens('$foo \r\n   '))).resolves.toEqual({ foo: '' });
        await expect(readMap(readTokens('\r\n $foo'))).resolves.toEqual({ foo: '' });
      });
      it('handles whitespace', async () => {
        await expect(readMap(readTokens(' \n foo \r  \n  (\n  bar  \n)\n'))).resolves.toEqual({
          foo: 'bar',
        });
      });
      it('rejects null', async () => {
        await expect(
          readMap(readTokens('--')).catch(error => (error as UcError)?.toJSON?.()),
        ).resolves.toEqual({
          code: 'unexpectedType',
          details: {
            type: 'null',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected null, while map expected',
        });
      });
      it('rejects second item', async () => {
        await expect(readMap(readTokens('foo(),'), { onError })).resolves.toEqual({ foo: '' });

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected list, while map expected',
          },
        ]);
      });
      it('rejects second item after $-prefixes map', async () => {
        await expect(readMap(readTokens('$foo(),'), { onError })).resolves.toEqual({ foo: '' });

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected list, while map expected',
          },
        ]);
      });
      it('does not deserialize unrecognized schema', async () => {
        const lib = new UcdLib({
          schemae: {
            readMap: ucMap({
              test: new EntrySchema<string>('test-type'),
            }),
          },
        });

        let error: UnsupportedUcSchemaError | undefined;

        try {
          await lib.compile().toDeserializers();
        } catch (e) {
          error = e as UnsupportedUcSchemaError;
        }

        expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
        expect(error?.schema.type).toBe('test-type');
        expect(error?.message).toBe(
          'readMap$deserialize: Can not deserialize entry "test" of type "test-type"',
        );
        expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
        expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
      });
    });

    describe('multiple entries', () => {
      let lib: UcdLib<{
        readMap: UcMap.Schema<{ foo: UcSchema.Spec<string>; bar: UcSchema.Spec<string> }>;
      }>;
      let readMap: UcDeserializer<{ foo: string; bar: string }>;

      beforeEach(async () => {
        lib = new UcdLib({
          schemae: {
            readMap: ucMap<{ foo: UcSchema.Spec<string>; bar: UcSchema.Spec<string> }>({
              foo: String,
              bar: String,
            }),
          },
        });
        ({ readMap } = await lib.compile().toDeserializers());
      });

      it('deserializes entries', async () => {
        await expect(readMap(readTokens('foo(first)bar(second'))).resolves.toEqual({
          foo: 'first',
          bar: 'second',
        });
      });
      it('deserializes $-escaped entries', async () => {
        await expect(readMap(readTokens('foo(first)$bar(second'))).resolves.toEqual({
          foo: 'first',
          bar: 'second',
        });
      });
      it('deserializes suffix', async () => {
        await expect(readMap(readTokens('foo(first) \n  bar \r\n '))).resolves.toEqual({
          foo: 'first',
          bar: '',
        });
        await expect(readMap(readTokens('foo(first) \n  bar )'))).resolves.toEqual({
          foo: 'first',
          bar: '',
        });
      });
      it('handles whitespace', async () => {
        await expect(
          readMap(readTokens('foo(first\r  \n) \n $bar \r \n ( \r second \n )')),
        ).resolves.toEqual({
          foo: 'first',
          bar: 'second',
        });
      });
      it('rejects unknown entry', async () => {
        await expect(
          readMap(readTokens('foo(first)wrong(123)bar(second'), { onError }),
        ).resolves.toEqual({
          foo: 'first',
          bar: 'second',
        });

        expect(errors).toEqual([
          {
            code: 'unexpectedEntry',
            details: {
              key: 'wrong',
            },
            message: 'Unexpected entry: wrong',
          },
        ]);
      });
      it('rejects nested list', async () => {
        await expect(
          readMap(readTokens('foo(first) bar(second) () '), { onError }),
        ).resolves.toEqual({ foo: 'first', bar: 'second' });

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'nested list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected nested list, while map expected',
          },
        ]);
      });
      it('rejects second item', async () => {
        await expect(
          readMap(readTokens('foo(first) bar(second) , '), { onError }),
        ).resolves.toEqual({ foo: 'first', bar: 'second' });

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected list, while map expected',
          },
        ]);
      });
    });

    describe('nullable', () => {
      let lib: UcdLib<{ readMap: UcNullable.Spec<{ foo: string }> }>;
      let readMap: UcDeserializer<{ foo: string } | null>;

      beforeEach(async () => {
        lib = new UcdLib({
          schemae: {
            readMap: ucNullable(
              ucMap<{ foo: UcSchema.Spec<string> }>({
                foo: String,
              }),
            ),
          },
        });
        ({ readMap } = await lib.compile().toDeserializers());
      });

      it('deserializes entry', async () => {
        await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
      });
      it('deserializes null', async () => {
        await expect(readMap(readTokens('--'))).resolves.toBeNull();
      });
    });
  });
});

class EntrySchema<T> implements UcSchema<T> {

  readonly #type: string;

  constructor(type: string) {
    this.#type = type;
  }

  get type(): string {
    return this.#type;
  }

  asis(value: T): T {
    return value;
  }

}
