import { describe, expect, it } from '@jest/globals';
import { UcMeta } from './uc-meta.js';

describe('UcMeta', () => {
  describe('has', () => {
    it('returns true for existing attribute', () => {
      expect(new UcMeta({ attr: ['boo'] }).has('attr')).toBe(true);
    });
    it('returns true for missing attribute', () => {
      expect(new UcMeta({}).has('attr')).toBe(false);
    });
    it('returns true for undefined attribute', () => {
      expect(new UcMeta({ attr: undefined }).has('attr')).toBe(false);
    });
    it('returns true for empty attribute', () => {
      expect(new UcMeta({ attr: [] }).has('attr2')).toBe(false);
    });
  });

  describe('attributes', () => {
    it('iterates over all attribute names', () => {
      expect([...new UcMeta({}).attributes()]).toEqual([]);
      expect([...new UcMeta({ foo: [], bar: [1, 2] }).attributes()]).toEqual(['bar']);
    });
  });

  describe('get', () => {
    it('returns the latest attribute value', () => {
      expect(new UcMeta({ attr: [1, 2] }).get('attr')).toBe(2);
    });
    it('returns none for missing attribute', () => {
      expect(new UcMeta({}).get('attr')).toBeUndefined();
    });
    it('returns none for empty attribute', () => {
      expect(new UcMeta({ attr: [] }).get('attr')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all attribute values', () => {
      const meta = new UcMeta({ attr: [1, 2, 3] });
      const values = meta.getAll('attr');

      expect(values).toEqual([1, 2, 3]);

      values.push(4);
      expect(meta.getAll('attr')).toEqual([1, 2, 3]);
    });
    it('returns empty array for missing attribute', () => {
      const meta = new UcMeta({});
      const values = meta.getAll('attr');

      expect(values).toEqual([]);

      values.push(4);
      expect(meta.getAll('attr')).toEqual([]);
    });
    it('returns empty array for empty attribute', () => {
      const meta = new UcMeta({ attr: [] });
      const values = meta.getAll('attr');

      expect(values).toEqual([]);

      values.push(4);
      expect(meta.getAll('attr')).toEqual([]);
    });
  });

  describe('add', () => {
    it('adds metadata', () => {
      const meta = new UcMeta({ attr1: [1], attr2: [21, 22] }).add({
        attr1: undefined,
        attr2: [23, 24],
        attr3: [31, 32],
      });

      expect(meta.getAll('attr1')).toEqual([1]);
      expect(meta.getAll('attr2')).toEqual([21, 22, 23, 24]);
      expect(meta.getAll('attr3')).toEqual([31, 32]);
    });
  });

  describe('merge', () => {
    it('merges metadata', () => {
      const meta = new UcMeta({ attr1: [1], attr2: [21, 22] }).merge(
        new UcMeta({
          attr1: undefined,
          attr2: [23, 24],
          attr3: [31, 32],
        }),
      );

      expect(meta.getAll('attr1')).toEqual([1]);
      expect(meta.getAll('attr2')).toEqual([21, 22, 23, 24]);
      expect(meta.getAll('attr3')).toEqual([31, 32]);
    });
  });

  describe('toString', () => {
    it('builds metadata representation', () => {
      expect(new UcMeta({ foo: ['bar', 'baz'] }).toString()).toBe('!!foo(bar)!!foo(baz)');
      expect(new UcMeta({ foo: [''] }).toString()).toBe('!!foo()');
    });
    it('builds metadata list representation', () => {
      expect(new UcMeta({ foo: [['bar', 'baz']] }).toString()).toBe('!!foo(bar,baz)');
      expect(new UcMeta({ foo: [['bar', '']] }).toString()).toBe('!!foo(bar,,)');
      expect(new UcMeta({ foo: [['', 'baz']] }).toString()).toBe('!!foo(,,baz)');
      expect(new UcMeta({ foo: [['bar']] }).toString()).toBe('!!foo(bar,)');
      expect(new UcMeta({ foo: [['']] }).toString()).toBe('!!foo(,,)');
      expect(new UcMeta({ foo: [[['bar'], 'baz']] }).toString()).toBe('!!foo((bar),baz)');
      expect(new UcMeta({ foo: [[['bar'], 'baz']] }).toString()).toBe('!!foo((bar),baz)');
    });
    it('builds metadata map representation', () => {
      expect(new UcMeta({ foo: [{ bar: 'baz' }] }).toString()).toBe('!!foo(bar(baz))');
      expect(new UcMeta({ foo: [{ bar: { baz: [1, 2, 3] } }] }).toString()).toBe(
        '!!foo(bar(baz(1,2,3)))',
      );
    });
    it('builds nested metadata representation', () => {
      expect(
        new UcMeta({ foo: [new UcMeta({ bar: [new UcMeta({ baz: [13] })] })] }).toString(),
      ).toBe('!!foo(!!bar(!!baz(13)))');
      expect(
        new UcMeta({
          foo: [[new UcMeta({ bar: [[1, 2]] }), new UcMeta({ baz: [[3, 4]] })]],
        }).toString(),
      ).toBe('!!foo(!!bar(1,2),!!baz(3,4))');
    });
    it('builds empty metadata representation', () => {
      expect(new UcMeta({}).toString()).toBe('!!()');
    });
  });
});
