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
    it('has stub creating UcEntity instance', async () => {
      await expect(
        new UccCode()
          .write(
            UcrxCore.ent.stub(
              { value: 'value', reject: 'reject' },
              UcrxCore.ent.toMethod(lib),
              template,
            ),
          )
          .toText(),
      ).resolves.toBe(
        `return this.any(new UcEntity(value)) || reject(ucrxRejectType('entity', this));\n`,
      );
    });
  });

  describe('nls', () => {
    it('has stub raising error', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.nls.stub({ reject: 'reject' }, UcrxCore.nls.toMethod(lib), template))
          .toText(),
      ).resolves.toBe(`return reject(ucrxRejectType('nested list', this));\n`);
    });
  });

  describe('nul', () => {
    it('has stub assigning null', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.nul.stub({ reject: 'reject' }, UcrxCore.nul.toMethod(lib), template))
          .toText(),
      ).resolves.toBe(`return this.any(null) || reject(ucrxRejectNull(this));\n`);
    });
  });

  describe('for', () => {
    it('has stub raising error', async () => {
      await expect(
        new UccCode()
          .write(
            UcrxCore.for.stub(
              { key: 'key', reject: 'reject' },
              UcrxCore.for.toMethod(lib),
              template,
            ),
          )
          .toText(),
      ).resolves.toBe(`return reject(ucrxRejectType('map', this));\n`);
    });
  });

  describe('map', () => {
    it('has stub raising error', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.map.stub({ reject: 'reject' }, UcrxCore.map.toMethod(lib), template))
          .toText(),
      ).resolves.toBe(`return reject(ucrxRejectType('map', this));\n`);
    });
  });

  describe('and', () => {
    it('has stub raising error', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.and.stub({ reject: 'reject' }, UcrxCore.and.toMethod(lib), template))
          .toText(),
      ).resolves.toBe(`return reject(ucrxRejectType('list', this));\n`);
    });
  });

  describe('end', () => {
    it('has empty stub', async () => {
      await expect(
        new UccCode()
          .write(UcrxCore.end.stub({ reject: 'reject' }, UcrxCore.end.toMethod(lib), template))
          .toText(),
      ).resolves.toBe('');
    });
  });
});
