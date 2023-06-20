import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../syntax/uc-token.js';
import { AllUcrx } from './all.ucrx.js';
import { TokenUcrx } from './token.ucrx.js';

describe('TokenUcrx', () => {
  let ucrx: AllUcrx;

  beforeEach(() => {
    ucrx = new TokenUcrx(noop);
  });

  describe('types', () => {
    it('accepts any', () => {
      expect(ucrx.types).toEqual(['any']);
    });
  });

  describe('raw', () => {
    let tokens: UcToken[];

    beforeEach(() => {
      tokens = [];
      ucrx = new TokenUcrx(token => {
        tokens.push(token);
      });
    });
    it('does not escape empty string', () => {
      ucrx.raw('');
      expect(tokens).toEqual(['']);
    });
    it('does not escape numbers', () => {
      ucrx.raw('123');
      expect(tokens).toEqual(['123']);
    });
    it('does not escape negative numbers', () => {
      ucrx.raw('-123');
      expect(tokens).toEqual(['-123']);
    });
    it('does not escape simple strings', () => {
      ucrx.raw('a$bc');
      expect(tokens).toEqual(['a$bc']);
    });
    it('does not escape null', () => {
      ucrx.raw('--');
      expect(tokens).toEqual(['--']);
    });
    it('does not escape false', () => {
      ucrx.raw('-');
      expect(tokens).toEqual(['-']);
    });
    it('does not escape string starting with dollar sign', () => {
      ucrx.raw('$abc');
      expect(tokens).toEqual(['$abc']);
    });
    it('does not escape string starting with exclamation mark', () => {
      ucrx.raw('!abc');
      expect(tokens).toEqual(['!abc']);
    });
    it('does not escape string starting with apostrophe sign', () => {
      ucrx.raw("'abc");
      expect(tokens).toEqual(["'abc"]);
    });
  });

  describe('end', () => {
    it('can not be called twice', () => {
      ucrx.end();
      expect(() => ucrx.end()).toThrow(new TypeError('Invalid charge'));
    });
  });

  describe('charge', () => {
    it('charges tokens', () => {
      expect(TokenUcrx.charge('!Hello, World!')).toEqual(['!Hello, World!']);
    });
    it('charges nested list', () => {
      expect(TokenUcrx.charge(['!Hello, World!'], { asItem: true })).toEqual([
        UC_TOKEN_OPENING_PARENTHESIS,
        '!Hello, World!',
        UC_TOKEN_CLOSING_PARENTHESIS,
      ]);
    });
  });
});
