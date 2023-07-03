import { describe, expect, it } from '@jest/globals';
import { EsClass, esGenerate } from 'esgen';
import { UcrxCore } from './ucrx-core.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxProperty } from './ucrx-property.js';

describe('UcrxCore', () => {
  describe('types', () => {
    it('returns void', async () => {
      await expect(generate(UcrxCore.types)).resolves.toContain(
        `
class TestClass {
  get types() {
    return ['void'];
  }
}`.trimStart(),
      );
    });
  });

  describe('att', () => {
    it('has empty stub', async () => {
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
    it('has stub creating UcEntity instance', async () => {
      await expect(generate(UcrxCore.ent)).resolves.toContain(
        `
class TestClass {
  ent(name, cx) {
    return this.any(new UcEntity(name)) || cx.reject(ucrxRejectEntity(name));
  }
}`.trimStart(),
      );
    });
  });

  describe('fmt', () => {
    it('has stub creating UcFormatted instance', async () => {
      await expect(generate(UcrxCore.fmt)).resolves.toContain(
        `
class TestClass {
  fmt(format, data, cx) {
    return this.any(new UcFormatted(format, data)) || cx.reject(ucrxRejectFormat(format, data));
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
  nls(cx) {
    return cx.reject(ucrxRejectType('nested list', this));
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
  nul(cx) {
    return this.any(null) || cx.reject(ucrxRejectNull(this));
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
  for(key, cx) {
    return cx.reject(ucrxRejectType('map', this));
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
  map(cx) {
    return cx.reject(ucrxRejectType('map', this));
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
  and(cx) {
    return cx.reject(ucrxRejectType('list', this));
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
  end(cx) {
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

  async function generate(method: UcrxMethod | UcrxProperty): Promise<string> {
    const testClass = new EsClass('TestClass');

    method.declareStub(testClass);

    return await esGenerate(testClass.declare());
  }
});
