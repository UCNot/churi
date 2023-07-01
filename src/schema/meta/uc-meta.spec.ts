import { describe, expect, it } from '@jest/globals';
import { UcMeta } from './uc-meta.js';

describe('UcMeta', () => {
  describe('has', () => {
    it('returns true for existing attribute', () => {
      expect(new UcMeta().add('attr', 'boo').has('attr')).toBe(true);
    });
    it('returns true for missing attribute', () => {
      expect(new UcMeta().has('attr')).toBe(false);
    });
  });

  describe('attributes', () => {
    it('iterates over all attribute names', () => {
      expect([...new UcMeta().attributes()]).toEqual([]);
      expect(
        [...new UcMeta().add('foo', 1).add('bar', 1).add('bar', 2).attributes()].map(
          ({ name }) => name,
        ),
      ).toEqual(['foo', 'bar']);
    });
  });

  describe('get', () => {
    it('returns the latest attribute value', () => {
      expect(new UcMeta().add('attr', 1).add('attr', 2).get('attr')).toBe(2);
    });
    it('returns none for missing attribute', () => {
      expect(new UcMeta().get('attr')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all attribute values', () => {
      const meta = new UcMeta().add('attr', 1).add('attr', 2).add('attr', 3);
      const values = meta.getAll('attr');

      expect(values).toEqual([1, 2, 3]);

      values.push(4);
      expect(meta.getAll('attr')).toEqual([1, 2, 3]);
    });
    it('returns empty array for missing attribute', () => {
      const meta = new UcMeta();
      const values = meta.getAll('attr');

      expect(values).toEqual([]);

      values.push(4);
      expect(meta.getAll('attr')).toEqual([]);
    });
  });

  describe('addAll', () => {
    it('merges metadata', () => {
      const meta = new UcMeta()
        .add('attr1', 1)
        .add('attr2', 21)
        .add('attr2', 22)
        .addAll(new UcMeta().add('attr2', 23).add('attr2', 24).add('attr3', 31).add('attr3', 32));

      expect(meta.getAll('attr1')).toEqual([1]);
      expect(meta.getAll('attr2')).toEqual([21, 22, 23, 24]);
      expect(meta.getAll('attr3')).toEqual([31, 32]);
    });
  });

  describe('toString', () => {
    it('builds metadata representation', () => {
      expect(new UcMeta().add('foo', 'bar').add('foo', 'baz').toString()).toBe(
        '!foo(bar)!foo(baz)',
      );
      expect(new UcMeta().add('foo', '').toString()).toBe('!foo()');
    });
    it('builds metadata list representation', () => {
      expect(new UcMeta().add('foo', ['bar', 'baz']).toString()).toBe('!foo(bar,baz)');
      expect(new UcMeta().add('foo', ['bar', '']).toString()).toBe('!foo(bar,,)');
      expect(new UcMeta().add('foo', ['', 'baz']).toString()).toBe('!foo(,,baz)');
      expect(new UcMeta().add('foo', ['bar']).toString()).toBe('!foo(bar,)');
      expect(new UcMeta().add('foo', ['']).toString()).toBe('!foo(,,)');
      expect(new UcMeta().add('foo', [['bar'], 'baz']).toString()).toBe('!foo((bar),baz)');
      expect(new UcMeta().add('foo', [['bar'], 'baz']).toString()).toBe('!foo((bar),baz)');
    });
    it('builds metadata map representation', () => {
      expect(new UcMeta().add('foo', { bar: 'baz' }).toString()).toBe('!foo(bar(baz))');
      expect(new UcMeta().add('foo', { bar: { baz: [1, 2, 3] } }).toString()).toBe(
        '!foo(bar(baz(1,2,3)))',
      );
      expect(new UcMeta().add('foo', {}).toString()).toBe('!foo($)');
    });
    it('builds nested metadata representation', () => {
      expect(
        new UcMeta().add('foo', new UcMeta().add('bar', new UcMeta().add('baz', 13))).toString(),
      ).toBe('!foo(!bar(!baz(13)))');
      expect(
        new UcMeta()
          .add('foo', [new UcMeta().add('bar', [1, 2]), new UcMeta().add('baz', [3, 4])])
          .toString(),
      ).toBe('!foo(!bar(1,2),!baz(3,4))');
    });
    it('builds empty metadata representation', () => {
      expect(new UcMeta().toString()).toBe('!()');
    });
  });

  describe('freezed', () => {
    it('is freezed', () => {
      const meta = new UcMeta().add('foo', 1);
      const freezed = meta.freeze();

      expect(freezed).not.toBe(meta);
      expect(meta.isFreezed()).toBe(false);
      expect(meta.isMutable()).toBe(true);
      expect(freezed.isFreezed()).toBe(true);
      expect(freezed.isMutable()).toBe(false);
      expect(freezed.get('foo')).toBe(1);
    });

    describe('freeze', () => {
      it('returns the same instance', () => {
        const meta = new UcMeta().add('foo', 1).freeze();

        expect(meta.freeze()).toBe(meta);
      });
    });

    describe('clone', () => {
      it('returns new mutable instance', () => {
        const meta = new UcMeta().add('foo', 1).freeze();
        const clone = meta.clone();

        expect(clone).not.toBe(meta);
        expect(clone.isFreezed()).toBe(false);
        expect(clone.isMutable()).toBe(true);
        expect(clone.get('foo')).toBe(1);
      });
    });

    describe('unfreeze', () => {
      it('returns new mutable instance', () => {
        const meta = new UcMeta().add('foo', 1).freeze();
        const mutable = meta.unfreeze();

        expect(mutable).not.toBe(meta);
        expect(mutable.isFreezed()).toBe(false);
        expect(mutable.isMutable()).toBe(true);
        expect(mutable.get('foo')).toBe(1);
      });
    });

    describe('add', () => {
      it('creates mutable clone', () => {
        const meta = new UcMeta().add('foo', 1).freeze();
        const modified = meta.add('foo', 2);

        expect(modified).not.toBe(meta);
        expect(modified.isMutable()).toBe(true);
        expect(meta.getAll('foo')).toEqual([1]);
        expect(modified.getAll('foo')).toEqual([1, 2]);
      });
    });
  });

  describe('cloned', () => {
    describe('add', () => {
      it('does not affect cloned meta', () => {
        const meta = new UcMeta().add('foo', 1);
        const cloned = meta.clone();

        expect(cloned).not.toBe(meta);
        expect(cloned.isMutable()).toBe(true);

        expect(meta.add('foo', 2)).toBe(meta);
        expect(meta.getAll('foo')).toEqual([1, 2]);
        expect(cloned.getAll('foo')).toEqual([1]);
      });
      it('does not affect the clone', () => {
        const meta = new UcMeta().add('foo', 1);
        const cloned = meta.clone();

        expect(cloned).not.toBe(meta);
        expect(cloned.isMutable()).toBe(true);

        expect(cloned.add('foo', 2)).toBe(cloned);
        expect(meta.getAll('foo')).toEqual([1]);
        expect(cloned.getAll('foo')).toEqual([1, 2]);
      });
    });

    describe('freeze', () => {
      it('returns empty constant when empty', () => {
        expect(new UcMeta().clone().freeze()).toBe(UcMeta.empty);
      });
    });

    describe('unfreeze', () => {
      it('returns the same instance', () => {
        const meta = new UcMeta().add('foo', 1);
        const cloned = meta.clone();

        expect(meta.unfreeze()).toBe(meta);
        expect(cloned.unfreeze()).toBe(cloned);
      });
    });
  });
});
