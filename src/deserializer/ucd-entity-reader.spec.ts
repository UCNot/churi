import { beforeEach, describe, expect, it } from '@jest/globals';
import { Ucrx } from '../rx/ucrx.js';
import { VoidUcrx } from '../rx/void.ucrx.js';
import { UcErrorInfo } from '../schema/uc-error.js';
import { UcLexer } from '../syntax/uc-lexer.js';
import { UC_TOKEN_COLON } from '../syntax/uc-token.js';
import { SyncUcdReader } from './sync-ucd-reader.js';
import { UcdEntityReader } from './ucd-entity-reader.js';

describe('UcdEntityReader', () => {
  let ucdReader: SyncUcdReader;
  let reader: UcdEntityReader;
  let errors: UcErrorInfo[];
  let rx: Ucrx;
  let value: unknown;

  beforeEach(() => {
    ucdReader = new SyncUcdReader([], {
      onError(error) {
        errors.push(error);
      },
    });

    errors = [];
    reader = new UcdEntityReader();
    value = undefined;

    class TestUcrx extends VoidUcrx {

      override any(v: unknown): 1 {
        return this.set(v);
      }

}

    rx = new TestUcrx(v => {
      value = v;
    });
  });

  describe('entity handler', () => {
    it('handles exact match', () => {
      const entity = UcLexer.scan('!foo:bar');

      reader.addEntity(entity, (_reader, _rx, entity) => {
        value = entity;
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual(entity);
    });
    it('does not handle different entity', () => {
      const expectedEntity = UcLexer.scan('!foo:bar');
      const entity = UcLexer.scan('!foo:baz');

      reader.addEntity(expectedEntity, (_reader, _rx, entity) => {
        value = entity;
      });
      reader.read(ucdReader, rx, entity);

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
      const expectedEntity = UcLexer.scan('!foo:bar');
      const entity = UcLexer.scan('!foo:bar:baz');

      reader.addEntity(expectedEntity, (_reader, _rx, entity) => {
        value = entity;
      });
      reader.read(ucdReader, rx, entity);

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
      const expectedEntity = UcLexer.scan('!foo:bar');
      const entity = UcLexer.scan('!foo:barbaz');

      reader.addEntity(expectedEntity, (_reader, _rx, entity) => {
        value = entity;
      });
      reader.read(ucdReader, rx, entity);

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
      const entity = UcLexer.scan('!foo:bar');

      reader.addPrefix(entity, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles exact match ending with delimiter', () => {
      const entity = UcLexer.scan('!foo:bar:');

      reader.addPrefix(entity, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles prefix tokens match', () => {
      const prefix = UcLexer.scan('!foo:bar');
      const entity = UcLexer.scan('!foo:bar:baz');

      reader.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix, args: entity.slice(prefix.length) });
    });
    it('does not handle shorter entity', () => {
      const prefix = UcLexer.scan('!foo:bar:');
      const entity = UcLexer.scan('!foo:bar');

      reader.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

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
      const prefix = UcLexer.scan('!foo:bar:');
      const entity = UcLexer.scan('!foo:bar!!');

      reader.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

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
      const prefix = UcLexer.scan('!foo:bar:baz');
      const entity = UcLexer.scan('!foo:bar:bat');

      reader.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

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
      const prefix = UcLexer.scan('!foo:bar');
      const entity = UcLexer.scan('!foo:bar-baz');

      reader.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix, args: ['-baz'] });
    });
    it('prefers longer prefix', () => {
      const prefix1 = UcLexer.scan('!foo:bar');
      const prefix2 = UcLexer.scan('!foo:bar:');
      const entity = UcLexer.scan('!foo:bar:baz');

      reader.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
    it('prefers longer prefix for suffix starting with delimiter', () => {
      const prefix1 = UcLexer.scan('!foo:bar');
      const prefix2 = UcLexer.scan('!foo:bar:');
      const entity = UcLexer.scan('!foo:bar::');

      reader.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: [UC_TOKEN_COLON] });
    });
    it('prefers longer text prefix', () => {
      const prefix1 = UcLexer.scan('!foo:bar');
      const prefix2 = UcLexer.scan('!foo:bar-');
      const entity = UcLexer.scan('!foo:bar-baz');

      reader.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };
      });
      reader.read(ucdReader, rx, entity);

      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
  });
});
