import { describe, expect, it } from '@jest/globals';
import { ChURIDirective, ChURIEntity } from './churi-value.js';

describe('ChURIEntity', () => {
  const entity = new ChURIEntity('!foo%20bar');

  it('contains raw encoded value', () => {
    expect(entity.raw).toBe('!foo%20bar');
    expect(String(entity)).toBe('!foo%20bar');
    expect(entity.toString()).toBe('!foo%20bar');
    expect(entity.valueOf()).toBe('!foo%20bar');
  });

  it('has string tag', () => {
    expect(entity[Symbol.toStringTag]).toBe('ChURIEntity');
  });
});

describe('ChURIDirective', () => {
  const directive = new ChURIDirective('!foo%20bar', { foo: 'bar' });

  describe('rawName', () => {
    it('contains raw encoded name', () => {
      expect(directive.rawName).toBe('!foo%20bar');
    });
  });

  it('has string tag', () => {
    expect(directive[Symbol.toStringTag]).toBe('ChURIDirective');
  });

  describe('toString', () => {
    it('reflects directive contents', () => {
      expect(
        String(new ChURIDirective('!test', ['arg1', 'arg2', { foo: 'bar', suffix: '' }])),
      ).toBe('!test(arg1)(arg2)foo(bar)suffix');
    });
  });
});
