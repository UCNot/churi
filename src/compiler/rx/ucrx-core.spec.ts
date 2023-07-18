import { describe, expect, it } from '@jest/globals';
import { EsClass, esGenerate } from 'esgen';
import { UcrxCore } from './ucrx-core.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxProperty } from './ucrx-property.js';

describe('UcrxCore', () => {
  describe('types', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.types)).resolves.toContain(
        `
class TestClass {
  get types() {
  }
}`.trimStart(),
      );
    });
  });

  describe('att', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.att)).resolves.toContain(
        `
class TestClass {
  att(attr, cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('ent', () => {
    it('foes nothing', async () => {
      await expect(generate(UcrxCore.ent)).resolves.toContain(
        `
class TestClass {
  ent(name, cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('fmt', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.fmt)).resolves.toContain(
        `
class TestClass {
  fmt(format, data, cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('nls', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.nls)).resolves.toContain(
        `
class TestClass {
  nls(cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('nul', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.nul)).resolves.toContain(
        `
class TestClass {
  nul(cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('for', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.for)).resolves.toContain(
        `
class TestClass {
  for(key, cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('map', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.map)).resolves.toContain(
        `
class TestClass {
  map(cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('and', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.and)).resolves.toContain(
        `
class TestClass {
  and(cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('end', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.end)).resolves.toContain(
        `
class TestClass {
  end(cx) {
  }
}`.trimStart(),
      );
    });
  });

  describe('any', () => {
    it('does nothing', async () => {
      await expect(generate(UcrxCore.any)).resolves.toContain(
        `
class TestClass {
  any(value) {
  }
}`.trimStart(),
      );
    });
  });

  async function generate(method: UcrxMethod | UcrxProperty): Promise<string> {
    const testClass = new EsClass('TestClass');

    method.declareStub(testClass);

    return await esGenerate(testClass.declare());
  }
});
