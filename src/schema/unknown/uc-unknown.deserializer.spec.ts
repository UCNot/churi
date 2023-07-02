import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { ucdSupportPlainEntity } from '../../spec/plain.format.js';
import { ucdSupportTimestampFormat } from '../../spec/timestamp.format.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcNullable, ucNullable } from '../uc-nullable.js';
import { UcUnknown, ucUnknown } from './uc-unknown.js';

describe('UcUnknown deserializer', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  describe('for nullable', () => {
    let readValue: UcDeserializer<unknown>;

    beforeEach(async () => {
      const compiler = new UcdCompiler({ models: { readValue: ucUnknown() } });

      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes boolean', () => {
      expect(readValue('!')).toBe(true);
      expect(readValue('-')).toBe(false);
    });
    it('recognizes bigint', () => {
      expect(readValue('0n123')).toBe(123n);
      expect(readValue('-0n123')).toBe(-123n);
    });
    it('recognizes bigint zero', () => {
      expect(readValue('0n0')).toBe(0n);
      expect(readValue('-0n0')).toBe(-0n);
      expect(readValue('0n')).toBe(0n);
      expect(readValue('-0n')).toBe(-0n);
    });
    it('rejects bigint NaN', () => {
      expect(readValue('0nz', { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'invalidSyntax',
          path: [{}],
          details: { type: 'bigint' },
          message: 'Cannot convert z to a BigInt',
          cause: new SyntaxError('Cannot convert z to a BigInt'),
        },
      ]);
    });
    it('recognizes number', () => {
      expect(readValue('123')).toBe(123);
      expect(readValue('-123')).toBe(-123);
    });
    it('recognizes string', () => {
      expect(readValue('abc')).toBe('abc');
      expect(readValue("'123")).toBe('123');
      expect(readValue('')).toBe('');
    });
    it('recognizes null', () => {
      expect(readValue('--')).toBeNull();
    });
    it('recognizes map', () => {
      expect(readValue('foo(bar)baz')).toEqual({ foo: 'bar', baz: '' });
    });
    it('recognizes empty map', () => {
      expect(readValue('$')).toEqual({});
    });
    it('recognizes nested map', () => {
      expect(readValue('foo(bar(baz)')).toEqual({ foo: { bar: 'baz' } });
    });
    it('recognizes nested empty map', () => {
      expect(readValue('foo($)')).toEqual({ foo: {} });
    });
    it('recognizes list', () => {
      expect(readValue('1,2,3')).toEqual([1, 2, 3]);
      expect(readValue(',1,2,3')).toEqual([1, 2, 3]);
      expect(readValue('1,2,3,')).toEqual([1, 2, 3]);
      expect(readValue(',')).toEqual([]);
    });
    it('recognizes null item', () => {
      expect(readValue('--,')).toEqual([null]);
      expect(readValue(',--')).toEqual([null]);
      expect(readValue('1,--,3,')).toEqual([1, null, 3]);
    });
    it('recognizes map item', () => {
      expect(readValue(',foo(bar)')).toEqual([{ foo: 'bar' }]);
      expect(readValue('foo(bar),')).toEqual([{ foo: 'bar' }]);
    });
    it('recognizes empty map item', () => {
      expect(readValue(',$')).toEqual([{}]);
      expect(readValue('$,')).toEqual([{}]);
    });
    it('recognizes multiple map items', () => {
      expect(readValue(',foo(bar),2,bar(baz)')).toEqual([{ foo: 'bar' }, 2, { bar: 'baz' }]);
      expect(readValue('foo(bar),2,bar(baz)')).toEqual([{ foo: 'bar' }, 2, { bar: 'baz' }]);
    });
    it('recognizes list entry', () => {
      expect(readValue('foo(bar, baz)')).toEqual({ foo: ['bar', 'baz'] });
    });
    it('recognizes repeating entries', () => {
      expect(readValue('foo(bar)foo(baz)foo(test)')).toEqual({ foo: 'test' });
    });
  });

  describe('for non-nullable', () => {
    let readValue: UcDeserializer<UcUnknown>;

    beforeEach(async () => {
      const compiler = new UcdCompiler({
        models: { readValue: ucNullable(ucUnknown(), false) },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('rejects null', () => {
      expect(readValue('--', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'null',
            expected: { types: ['non-null'] },
          },
          message: 'Unexpected null instead of non-null',
        },
      ]);
    });
  });

  describe('with custom entity', () => {
    let compiler: UcdCompiler<{ readValue: UcNullable<unknown, UcUnknown.Schema> }>;
    let readValue: UcDeserializer<unknown>;

    beforeEach(async () => {
      compiler = new UcdCompiler({
        models: { readValue: ucUnknown() },
        features: [ucdSupportPrimitives, ucdSupportPlainEntity, ucdSupportTimestampFormat],
      });
      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes custom entity', () => {
      expect(readValue("!plain'test")).toBe("!plain'test");
    });
    it('recognizes custom type', () => {
      const now = new Date();

      expect(readValue(`!timestamp'${now.toISOString()}`)).toEqual(now.getTime());
    });
    it('recognizes custom entity item', () => {
      expect(readValue(",!plain'test")).toEqual(["!plain'test"]);
      expect(readValue("!plain'test1, !plain'test2")).toEqual(["!plain'test1", "!plain'test2"]);
    });
  });
});
