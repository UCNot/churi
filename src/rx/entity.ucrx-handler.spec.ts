import { beforeEach, describe, expect, it } from '@jest/globals';
import { SyncUcdReader } from '../deserializer/sync-ucd-reader.js';
import { UcEntity } from '../schema/entity/uc-entity.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcLexer } from '../syntax/uc-lexer.js';
import { UC_TOKEN_COLON } from '../syntax/uc-token.js';
import { EntityUcrxHandler } from './entity.ucrx-handler.js';
import { Ucrx } from './ucrx.js';
import { VoidUcrx } from './void.ucrx.js';

describe('EntityUcrxHandler', () => {
  let reader: SyncUcdReader;
  let handler: EntityUcrxHandler;
  let rx: Ucrx;
  let value: unknown;

  beforeEach(() => {
    reader = new SyncUcdReader([]);

    handler = new EntityUcrxHandler();
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

  describe('entity rx', () => {
    it('handles exact match', () => {
      const entity = UcLexer.scan("!foo'bar");

      handler.addEntity(entity, (_reader, _rx, entity) => rx.ent(entity));

      expect(handler.rx(reader, rx, entity)).toBe(1);
      expect((value as UcEntity).raw).toEqual(printUcTokens(entity));
    });
    it('ignores whitespace after exact match', () => {
      const entity = UcLexer.scan("!foo'bar");

      handler.addEntity(entity, (_reader, _rx, entity) => rx.ent(entity));

      expect(handler.rx(reader, rx, UcLexer.scan("!foo'bar\t \n\t"))).toBe(1);
      expect((value as UcEntity).raw).toEqual(printUcTokens(entity));
    });
    it('does not handle different entity', () => {
      const expectedEntity = UcLexer.scan("!foo'bar");
      const entity = UcLexer.scan("!foo'baz");

      handler.addEntity(expectedEntity, (_reader, rx, entity) => rx.ent(entity));

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
    it('does not handle longer entity', () => {
      const expectedEntity = UcLexer.scan("!foo'bar");
      const entity = UcLexer.scan("!foo'bar'baz");

      handler.addEntity(expectedEntity, (_reader, rx, entity) => rx.ent(entity));

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
    it('does not handle longer text entity', () => {
      const expectedEntity = UcLexer.scan("!foo'bar");
      const entity = UcLexer.scan("!foo'barbaz");

      handler.addEntity(expectedEntity, (_reader, rx, entity) => rx.ent(entity));

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
  });

  describe('prefix handler', () => {
    it('handles exact match', () => {
      const entity = UcLexer.scan("!foo'bar");

      handler.addPrefix(entity, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.rx(reader, rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles prefix tokens match', () => {
      const prefix = UcLexer.scan("!foo'bar");
      const entity = UcLexer.scan("!foo'bar'baz");

      handler.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.rx(reader, rx, entity);

      expect(value).toEqual({ prefix, args: entity.slice(prefix.length) });
    });
    it('handles delimiter after prefix', () => {
      const entity = UcLexer.scan("!foo'bar'");

      handler.addPrefix(entity, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.rx(reader, rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('handles whitespace after prefix', () => {
      const entity = UcLexer.scan("!foo'bar\r\n\t");

      handler.addPrefix(entity, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.rx(reader, rx, entity);

      expect(value).toEqual({ prefix: entity, args: [] });
    });
    it('does not handle shorter entity', () => {
      const prefix = UcLexer.scan("!foo'bar'");
      const entity = UcLexer.scan("!foo'bar");

      handler.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
    it('does not handle unmatched prefix', () => {
      const prefix = UcLexer.scan("!foo'bar'");
      const entity = UcLexer.scan("!foo'bar!!");

      handler.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
    it('does not handle unmatched text prefix', () => {
      const prefix = UcLexer.scan("!foo'bar'baz");
      const entity = UcLexer.scan("!foo'bar'bat");

      handler.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(0);
      expect(value).toBeUndefined();
    });
    it('handles prefix text match', () => {
      const prefix = UcLexer.scan("!foo'bar");
      const entity = UcLexer.scan("!foo'bar-baz");

      handler.addPrefix(prefix, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(1);
      expect(value).toEqual({ prefix, args: ['-baz'] });
    });
    it('prefers longer prefix', () => {
      const prefix1 = UcLexer.scan("!foo'bar");
      const prefix2 = UcLexer.scan("!foo'bar'");
      const entity = UcLexer.scan("!foo'bar'baz");

      handler.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(1);
      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
    it('prefers longer prefix for suffix starting with delimiter', () => {
      const prefix1 = UcLexer.scan("!foo'bar");
      const prefix2 = UcLexer.scan("!foo'bar'");
      const entity = UcLexer.scan("!foo'bar':");

      handler.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(1);
      expect(value).toEqual({ prefix: prefix2, args: [UC_TOKEN_COLON] });
    });
    it('prefers longer text prefix', () => {
      const prefix1 = UcLexer.scan("!foo'bar");
      const prefix2 = UcLexer.scan("!foo'bar-");
      const entity = UcLexer.scan("!foo'bar-baz");

      handler.addPrefix(prefix1, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });
      handler.addPrefix(prefix2, (_reader, _rx, prefix, args) => {
        value = { prefix, args };

        return 1;
      });

      expect(handler.rx(reader, rx, entity)).toBe(1);
      expect(value).toEqual({ prefix: prefix2, args: ['baz'] });
    });
  });
});
