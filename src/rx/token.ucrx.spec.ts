import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import {
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_OPENING_PARENTHESIS,
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

    describe('end', () => {
      it('can not be called twice', () => {
        ucrx.end();
        expect(() => ucrx.end()).toThrow(new TypeError('Invalid charge'));
      });
    });
  });

  describe('charge', () => {
    it('charges tokens', () => {
      expect(TokenUcrx.charge('!Hello, World!')).toEqual([UC_TOKEN_APOSTROPHE, '!Hello, World!']);
    });
    it('charges nested list', () => {
      expect(TokenUcrx.charge(['!Hello, World!'], { asItem: true })).toEqual([
        UC_TOKEN_OPENING_PARENTHESIS,
        UC_TOKEN_APOSTROPHE,
        '!Hello, World!',
        UC_TOKEN_CLOSING_PARENTHESIS,
      ]);
    });
  });
});
