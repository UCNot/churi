import { describe, expect, it } from '@jest/globals';
import { UcDirective, UcEntity } from './uc-value.js';

describe('UcEntity', () => {
  const entity = new UcEntity('!foo%20bar');

  it('contains raw encoded value', () => {
    expect(entity.raw).toBe('!foo%20bar');
    expect(String(entity)).toBe('!foo%20bar');
    expect(entity.toString()).toBe('!foo%20bar');
    expect(entity.valueOf()).toBe('!foo%20bar');
  });

  it('has string tag', () => {
    expect(entity[Symbol.toStringTag]).toBe('UcEntity');
  });
});

describe('UcDirective', () => {
  const directive = new UcDirective('!foo%20bar', { foo: 'bar' });

  describe('rawName', () => {
    it('contains raw encoded name', () => {
      expect(directive.rawName).toBe('!foo%20bar');
    });
  });

  it('has string tag', () => {
    expect(directive[Symbol.toStringTag]).toBe('UcDirective');
  });

  describe('toString', () => {
    it('reflects directive contents', () => {
      expect(String(new UcDirective('!test', ['arg1', 'arg2', { foo: 'bar', suffix: '' }]))).toBe(
        '!test(arg1)(arg2)foo(bar)suffix',
      );
    });
  });
});
