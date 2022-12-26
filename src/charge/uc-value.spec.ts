import { describe, expect, it } from '@jest/globals';
import { UcDirective } from '../schema/uc-directive.js';
import { UcEntity } from '../schema/uc-entity.js';

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
