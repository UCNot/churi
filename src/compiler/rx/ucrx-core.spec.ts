import { describe, expect, it } from '@jest/globals';
import { EsClass, esGenerate } from 'esgen';
import { UcrxCore } from './ucrx-core.js';
import { UcrxMethod } from './ucrx-method.js';

describe('UcrxCore', () => {
  describe('ent', () => {
    it('has stub creating UcEntity instance', async () => {
      await expect(generate(UcrxCore.ent)).resolves.toContain(
        `
class TestClass {
  ent(value, reject) {
    return this.any(new UcEntity(value)) || reject(ucrxRejectType('entity', this));
  }
}`.trimStart(),
      );
    });
  });

  describe('nls', () => {
    it('has stub raising error', async () => {
      await expect(generate(UcrxCore.nls)).resolves.toContain(
        `
class TestClass {
  nls(reject) {
    return reject(ucrxRejectType('nested list', this));
  }
}`.trimStart(),
      );
    });
  });

  describe('nul', () => {
    it('has stub assigning null', async () => {
      await expect(generate(UcrxCore.nul)).resolves.toContain(
        `
class TestClass {
  nul(reject) {
    return this.any(null) || reject(ucrxRejectNull(this));
  }
}`.trimStart(),
      );
    });
  });

  describe('for', () => {
    it('has stub raising error', async () => {
      await expect(generate(UcrxCore.for)).resolves.toContain(
        `
class TestClass {
  ['for'](key, reject) {
    return reject(ucrxRejectType('map', this));
  }
}`.trimStart(),
      );
    });
  });

  describe('map', () => {
    it('has stub raising error', async () => {
      await expect(generate(UcrxCore.map)).resolves.toContain(
        `
class TestClass {
  map(reject) {
    return reject(ucrxRejectType('map', this));
  }
}`.trimStart(),
      );
    });
  });

  describe('and', () => {
    it('has stub raising error', async () => {
      await expect(generate(UcrxCore.and)).resolves.toContain(
        `
class TestClass {
  and(reject) {
    return reject(ucrxRejectType('list', this));
  }
}`.trimStart(),
      );
    });
  });

  describe('end', () => {
    it('has empty stub', async () => {
      await expect(generate(UcrxCore.end)).resolves.toContain(
        `
class TestClass {
  end(reject) {
  }
}`.trimStart(),
      );
    });
  });

  describe('any', () => {
    it('has stub returning 0', async () => {
      await expect(generate(UcrxCore.any)).resolves.toContain(
        `
class TestClass {
  any(value) {
    return 0;
  }
}`.trimStart(),
      );
    });
  });

  async function generate(method: UcrxMethod): Promise<string> {
    const testClass = new EsClass('TestClass');

    method.declareStub(testClass);

    return await esGenerate(testClass.declare());
  }
});
