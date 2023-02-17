import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccNamespace } from './ucc-namespace.js';

describe('UccNamespace', () => {
  let ns: UccNamespace;

  beforeEach(() => {
    ns = new UccNamespace();
  });

  describe('name', () => {
    it('declares "tmp" name by default', () => {
      expect(ns.name()).toBe('tmp');
    });
    it('permits duplicate names in nested namespaces', () => {
      expect(ns.nest().name('test')).toBe('test');
      expect(ns.nest().name('test')).toBe('test');
    });
    it('generates alias for duplicate in nested namespace', () => {
      expect(ns.name('test')).toBe('test');
      expect(ns.nest().name('test')).toBe('test$0');
      expect(ns.nest().name('test')).toBe('test$0');
    });
    it('prevents duplicate of the declared in nested namespace', () => {
      expect(ns.nest().name('test')).toBe('test');
      expect(ns.name('test')).toBe('test$0');
      expect(ns.nest().name('test')).toBe('test');
    });
  });
});
