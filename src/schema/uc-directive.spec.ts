import { describe, expect, it } from '@jest/globals';
import { UcDirective } from './uc-directive.js';

describe('UcDirective', () => {
  const directive = new UcDirective('!foo%20bar', '(bar)');

  describe('rawName', () => {
    it('contains raw encoded name', () => {
      expect(directive.rawName).toBe('!foo%20bar');
    });
  });

  describe('rawArg', () => {
    it('contains raw encoded argument', () => {
      expect(directive.rawArg).toBe('(bar)');
    });
  });

  it('has string tag', () => {
    expect(directive[Symbol.toStringTag]).toBe('UcDirective');
  });

  describe('toString', () => {
    it('reflects directive contents', () => {
      expect(String(new UcDirective('!test', '(arg)'))).toBe('!test(arg)');
    });
  });
});
