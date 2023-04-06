import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { UC_TOKEN_APOSTROPHE } from '../syntax/uc-token.js';
import { TokenUcrx } from './token.ucrx.js';
import { Ucrx } from './ucrx.js';

describe('TokenUcrx', () => {
  let ucrx: Ucrx;

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
  });
});
