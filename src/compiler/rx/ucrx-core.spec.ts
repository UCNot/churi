import { describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcrxCore } from './ucrx-core.js';

describe('UcrxCore', () => {
  describe('nls', () => {
    it('has empty stub', () => {
      expect(
        new UccCode().write(UcrxCore.nls.stub({ '': '' }, new UccMethod<''>('set', []))).toString(),
      ).toBe('');
    });
  });

  describe('for', () => {
    it('has empty stub', () => {
      expect(
        new UccCode()
          .write(UcrxCore.for.stub({ key: 'key' }, new UccMethod('set', ['key'])))
          .toString(),
      ).toBe('');
    });
  });

  describe('map', () => {
    it('has empty stub', () => {
      expect(
        new UccCode().write(UcrxCore.map.stub({ '': '' }, new UccMethod<''>('set', []))).toString(),
      ).toBe('');
    });
  });

  describe('em', () => {
    it('has stub returning 0', () => {
      expect(
        new UccCode().write(UcrxCore.em.stub({ '': '' }, new UccMethod<''>('set', []))).toString(),
      ).toBe('return 0;\n');
    });
  });

  describe('ls', () => {
    it('has empty stub', () => {
      expect(
        new UccCode().write(UcrxCore.ls.stub({ '': '' }, new UccMethod<''>('set', []))).toString(),
      ).toBe('');
    });
  });

  describe('nul', () => {
    it('has stub assigning null', () => {
      expect(
        new UccCode().write(UcrxCore.nul.stub({ '': '' }, new UccMethod<''>('set', []))).toString(),
      ).toBe('return this.set(null);\n');
    });
  });
});
