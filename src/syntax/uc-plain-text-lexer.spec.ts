import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { Readable } from 'node:stream';
import { UcdCompiler } from '../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../compiler/impl/uc-modules.js';
import { ucList } from '../schema/list/uc-list.js';
import { ucMap } from '../schema/map/uc-map.js';
import { UcNumber, ucNumber } from '../schema/numeric/uc-number.js';
import { UcString, ucString } from '../schema/string/uc-string.js';
import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcErrorInfo } from '../schema/uc-error.js';
import {
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_INSET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UC_TOKEN_PREFIX_SPACE,
  UcToken,
} from './uc-token.js';

describe('UcPlainTextLexer', () => {
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  function onError(error: UcErrorInfo): void {
    errors.push(error);
  }

  describe('at top level', () => {
    let readValue: UcDeserializer<UcString>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: ucString(),
        },
        inset: code => {
          const UcPlainTextLexer = UC_MODULE_CHURI.import('UcPlainTextLexer');

          code.line(esline`emit => new ${UcPlainTextLexer}(emit)`);
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('generates string synchronously', () => {
      expect(readValue([UC_TOKEN_INSET, `'test'`, UC_TOKEN_INSET])).toBe(`'test'`);
    });

    it('generates string asynchronously', async () => {
      await expect(readValue(readTokens(UC_TOKEN_INSET, `'test'`, UC_TOKEN_INSET))).resolves.toBe(
        `'test'`,
      );
    });
  });

  describe('as list item', () => {
    let readList: UcDeserializer<UcString[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: ucList<UcString>(ucString()),
        },
        inset: code => {
          const UcPlainTextLexer = UC_MODULE_CHURI.import('UcPlainTextLexer');

          code.line(esline`emit => new ${UcPlainTextLexer}(emit)`);
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('generates string item synchronously', () => {
      expect(
        readList([
          'start',
          UC_TOKEN_COMMA,
          UC_TOKEN_INSET,
          `'te`,
          `st'`,
          UC_TOKEN_INSET,
          UC_TOKEN_COMMA,
          UC_TOKEN_APOSTROPHE,
          'end',
        ]),
      ).toEqual(['start', `'test'`, 'end']);
    });

    it('generates string item asynchronously', async () => {
      await expect(
        readList(
          readTokens(
            'start',
            UC_TOKEN_COMMA,
            UC_TOKEN_INSET,
            `'te`,
            `st'`,
            UC_TOKEN_INSET,
            UC_TOKEN_COMMA,
            UC_TOKEN_APOSTROPHE,
            'end',
          ),
        ),
      ).resolves.toEqual(['start', `'test'`, 'end']);
    });
  });

  describe('as map entry', () => {
    let readMap: UcDeserializer<{ foo: UcNumber; bar: UcString; baz: UcString }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap({ foo: ucNumber(), bar: ucString(), baz: ucString() }),
        },
        inset: code => {
          const UcPlainTextLexer = UC_MODULE_CHURI.import('UcPlainTextLexer');

          code.line(esline`emit => new ${UcPlainTextLexer}(emit)`);
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('generates string item synchronously', () => {
      expect(
        readMap([
          'foo',
          UC_TOKEN_OPENING_PARENTHESIS,
          '13',
          UC_TOKEN_CLOSING_PARENTHESIS,
          'bar',
          UC_TOKEN_OPENING_PARENTHESIS,
          UC_TOKEN_PREFIX_SPACE || 2 << 8,
          UC_TOKEN_INSET,
          `'te`,
          `st'`,
          UC_TOKEN_INSET,
          UC_TOKEN_PREFIX_SPACE || 2 << 8,
          UC_TOKEN_CLOSING_PARENTHESIS,
          'baz',
          UC_TOKEN_OPENING_PARENTHESIS,
          UC_TOKEN_APOSTROPHE,
          'end',
          UC_TOKEN_CLOSING_PARENTHESIS,
        ]),
      ).toEqual({ foo: 13, bar: `'test'`, baz: 'end' });
    });

    it('generates string item asynchronously', async () => {
      await expect(
        readMap(
          readTokens(
            'foo',
            UC_TOKEN_OPENING_PARENTHESIS,
            '13',
            UC_TOKEN_CLOSING_PARENTHESIS,
            'bar',
            UC_TOKEN_OPENING_PARENTHESIS,
            UC_TOKEN_PREFIX_SPACE || 2 << 8,
            UC_TOKEN_INSET,
            `'te`,
            `st'`,
            UC_TOKEN_INSET,
            UC_TOKEN_PREFIX_SPACE || 2 << 8,
            UC_TOKEN_CLOSING_PARENTHESIS,
            'baz',
            UC_TOKEN_OPENING_PARENTHESIS,
            UC_TOKEN_APOSTROPHE,
            'end',
            UC_TOKEN_CLOSING_PARENTHESIS,
          ),
        ),
      ).resolves.toEqual({ foo: 13, bar: `'test'`, baz: 'end' });
    });
  });

  describe('when turned off', () => {
    let readValue: UcDeserializer<UcString>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: ucString(),
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('errors on inset', () => {
      expect(readValue([UC_TOKEN_INSET, `'test'`, UC_TOKEN_INSET], { onError })).toBe(``);

      expect(errors).toEqual([
        {
          code: 'unexpectedInset',
          path: [{}],
          message: 'Unrecognized inset',
        },
      ]);
    });
  });

  function readTokens(...tokens: UcToken[]): ReadableStream<UcToken> {
    return Readable.toWeb(Readable.from(tokens)) as ReadableStream<UcToken>;
  }
});
