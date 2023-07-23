import { describe, expect, it } from '@jest/globals';
import { UC_TOKEN_KIND_CONTROL, ucTokenKind } from './uc-token-kind.js';
import { UC_TOKEN_INSET_URI_PARAM } from './uc-token.js';

describe('ucTokenKind', () => {
  it('is control for inset bound', () => {
    expect(ucTokenKind(UC_TOKEN_INSET_URI_PARAM)).toBe(UC_TOKEN_KIND_CONTROL);
  });
});
