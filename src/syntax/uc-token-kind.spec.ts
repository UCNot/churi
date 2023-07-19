import { describe, expect, it } from '@jest/globals';
import { UC_TOKEN_KIND_CONTROL, ucTokenKind } from './uc-token-kind.js';
import { UC_TOKEN_EMBED } from './uc-token.js';

describe('ucTokenKind', () => {
  it('is control for embed token', () => {
    expect(ucTokenKind(UC_TOKEN_EMBED)).toBe(UC_TOKEN_KIND_CONTROL);
  });
});
