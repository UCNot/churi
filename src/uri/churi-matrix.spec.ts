import { describe, expect, it } from '@jest/globals';
import { ChURIMatrix } from './churi-params.js';

describe('ChURIMatrix', () => {
  it('decodes semicolon-separated params', () => {
    const params = new ChURIMatrix('?a=1;b=2;a=3');

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['a', '3'],
    ]);
  });
  it('encodes semicolon-separated params', () => {
    const params = new ChURIMatrix({ a: 'a1', b: 'b2', c: 'c3' });

    expect(String(params)).toBe('a=a1;b=b2;c=c3');
  });
});
