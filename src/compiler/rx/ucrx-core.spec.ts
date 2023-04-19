import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UcdSetup } from '../deserialization/ucd-setup.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxCore } from './ucrx-core.js';

describe('UcrxCore', () => {
  let lib: UcdLib;
  let template: BaseUcrxTemplate;

  beforeEach(async () => {
    lib = await new UcdSetup({ models: {} }).bootstrap();
    template = lib.voidUcrx;
  });

  describe('ent', () => {
    it('constructs UcEntity instance', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.ent.stub({ value: 'value' }, UcrxCore.ent.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('return this.any(new UcEntity(value));\n');
    });
  });

  describe('nls', () => {
    it('has empty stub', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.nls.stub({ '': '' }, UcrxCore.nls.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('');
    });
  });

  describe('nul', () => {
    it('has stub assigning null', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.nul.stub({ '': '' }, UcrxCore.nul.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('return this.any(null);\n');
    });
  });

  describe('for', () => {
    it('has empty stub', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.for.stub({ key: 'key' }, UcrxCore.for.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('');
    });
  });

  describe('map', () => {
    it('has stub returning 0', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.map.stub({ '': '' }, UcrxCore.map.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('return 0;\n');
    });
  });

  describe('and', () => {
    it('has stub returning 0', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.and.stub({ '': '' }, UcrxCore.and.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('return 0;\n');
    });
  });

  describe('end', () => {
    it('has empty stub', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.end.stub({ '': '' }, UcrxCore.end.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('');
    });
  });
});
