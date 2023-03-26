import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxCore } from './ucrx-core.js';

describe('UcrxCore', () => {
  let lib: UcdLib;
  let template: BaseUcrxTemplate;

  beforeEach(() => {
    lib = new UcdLib({ schemae: {} });
    template = lib.voidUcrx;
  });

  describe('nls', () => {
    it('has empty stub', () => {
      expect(
        new UccCode()
          .write(UcrxCore.nls.stub({ '': '' }, UcrxCore.nls.toMethod(lib), template))
          .toString(),
      ).toBe('');
    });
  });

  describe('for', () => {
    it('has empty stub', () => {
      expect(
        new UccCode()
          .write(UcrxCore.for.stub({ key: 'key' }, UcrxCore.for.toMethod(lib), template))
          .toString(),
      ).toBe('');
    });
  });

  describe('map', () => {
    it('has empty stub', () => {
      expect(
        new UccCode()
          .write(UcrxCore.map.stub({ '': '' }, UcrxCore.map.toMethod(lib), template))
          .toString(),
      ).toBe('');
    });
  });

  describe('em', () => {
    it('has stub returning 0', () => {
      expect(
        new UccCode()
          .write(UcrxCore.em.stub({ '': '' }, UcrxCore.em.toMethod(lib), template))
          .toString(),
      ).toBe('return 0;\n');
    });
  });

  describe('ls', () => {
    it('has empty stub', () => {
      expect(
        new UccCode()
          .write(UcrxCore.ls.stub({ '': '' }, UcrxCore.ls.toMethod(lib), template))
          .toString(),
      ).toBe('');
    });
  });

  describe('nul', () => {
    it('has stub assigning null', () => {
      expect(
        new UccCode()
          .write(UcrxCore.nul.stub({ '': '' }, UcrxCore.nul.toMethod(lib), template))
          .toString(),
      ).toBe('return this.any(null);\n');
    });
  });
});
