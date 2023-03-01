import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcErrorInfo } from '../../schema/uc-error.js';
import { UC_TOKEN_COLON } from '../../syntax/uc-token.js';
import { UcTokenizer } from '../../syntax/uc-tokenizer.js';
import { SyncUcdReader } from '../sync-ucd-reader.js';
import { UcdRx } from '../ucd-rx.js';
import { UcdEntityReader } from './ucd-entity-reader.js';

describe('UcdEntityReader', () => {
  let reader: UcdEntityReader;
  let errors: UcErrorInfo[];
  let rx: UcdRx;
  let value: unknown;

  beforeEach(() => {
    const ucdReader = new SyncUcdReader([], {
      onError(error) {
        errors.push(error);
      },
    });

    errors = [];
    reader = new UcdEntityReader(ucdReader);
    value = undefined;
    rx = {
      _: {
        any: v => {
          value = v;

          return 1;
        },
      },
    };
  });

  describe('entity handler', () => {
    it('handles exact match', () => {
      const entity = UcTokenizer.split('!foo:bar');

      reader.addEntity(entity, (_reader, rx, entity) => {
        rx._.any?.(entity);
      });
      reader.read(rx, entity);

      expect(value).toEqual(entity);
    });
    it('does not handle different entity', () => {
      const expectedEntity = UcTokenizer.split('!foo:bar');
      const entity = UcTokenizer.split('!foo:baz');

      reader.addEntity(expectedEntity, (_reader, rx, entity) => {
        rx._.any?.(entity);
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:baz',
        },
      ]);
    });
    it('does not handle longer entity', () => {
      const expectedEntity = UcTokenizer.split('!foo:bar');
      const entity = UcTokenizer.split('!foo:bar:baz');

      reader.addEntity(expectedEntity, (_reader, rx, entity) => {
        rx._.any?.(entity);
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:bar:baz',
        },
      ]);
    });
    it('does not handle longer text entity', () => {
      const expectedEntity = UcTokenizer.split('!foo:bar');
      const entity = UcTokenizer.split('!foo:barbaz');

      reader.addEntity(expectedEntity, (_reader, rx, entity) => {
        rx._.any?.(entity);
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:barbaz',
        },
      ]);
    });
  });

  describe('prefix handler', () => {
    it('handles exact match', () => {
      const entity = UcTokenizer.split('!foo:bar');

      reader.addPrefix(entity, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles exact match ending with delimiter', () => {
      const entity = UcTokenizer.split('!foo:bar:');

      reader.addPrefix(entity, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles prefix tokens match', () => {
      const prefix = UcTokenizer.split('!foo:bar');
      const entity = UcTokenizer.split('!foo:bar:baz');

      reader.addPrefix(prefix, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix, args: entity.slice(prefix.length) });
    });
    it('does not handle shorter entity', () => {
      const prefix = UcTokenizer.split('!foo:bar:');
      const entity = UcTokenizer.split('!foo:bar');

      reader.addPrefix(prefix, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:bar',
        },
      ]);
    });
    it('does not handle unmatched prefix', () => {
      const prefix = UcTokenizer.split('!foo:bar:');
      const entity = UcTokenizer.split('!foo:bar!!');

      reader.addPrefix(prefix, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:bar!!',
        },
      ]);
    });
    it('does not handle unmatched text prefix', () => {
      const prefix = UcTokenizer.split('!foo:bar:baz');
      const entity = UcTokenizer.split('!foo:bar:bat');

      reader.addPrefix(prefix, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity,
          },
          message: 'Unrecognized entity: !foo:bar:bat',
        },
      ]);
    });
    it('handles prefix text match', () => {
      const prefix = UcTokenizer.split('!foo:bar');
      const entity = UcTokenizer.split('!foo:bar-baz');

      reader.addPrefix(prefix, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix, args: ['-baz'] });
    });
    it('prefers longer prefix', () => {
      const prefix1 = UcTokenizer.split('!foo:bar');
      const prefix2 = UcTokenizer.split('!foo:bar:');
      const entity = UcTokenizer.split('!foo:bar:baz');

      reader.addPrefix(prefix1, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.addPrefix(prefix2, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
    it('prefers longer prefix for suffix starting with delimiter', () => {
      const prefix1 = UcTokenizer.split('!foo:bar');
      const prefix2 = UcTokenizer.split('!foo:bar:');
      const entity = UcTokenizer.split('!foo:bar::');

      reader.addPrefix(prefix1, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.addPrefix(prefix2, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: [UC_TOKEN_COLON] });
    });
    it('prefers longer text prefix', () => {
      const prefix1 = UcTokenizer.split('!foo:bar');
      const prefix2 = UcTokenizer.split('!foo:bar-');
      const entity = UcTokenizer.split('!foo:bar-baz');

      reader.addPrefix(prefix1, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.addPrefix(prefix2, (_reader, rx, prefix, args) => {
        rx._.any?.({ prefix, args });
      });
      reader.read(rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
  });
});
