import { describe, expect, it } from '@jest/globals';
import { EsField } from 'esgen';
import { ucMap } from '../../schema/map/uc-map.js';
import { VoidUcrxClass } from './impl/void.ucrx.class.js';
import { UcrxClass, UcrxSignature } from './ucrx.class.js';

describe('UcrxClass', () => {
  describe('baseUcrx', () => {
    it('is undefined for non-Ucrx base', () => {
      expect(new TestClass().baseUcrx).toBeUndefined();
    });
    it('is defined for Ucrx base', () => {
      const testClass = new TestClass2();

      expect(testClass.baseUcrx).toBeDefined();
      expect(testClass.baseUcrx).toBe(testClass.baseClass);
    });
  });

  describe('isMemberOverridden', () => {
    it('returns false for non-declared member', () => {
      const member = new EsField('test');

      expect(new TestClass().isMemberOverridden(member)).toBe(false);
    });
  });
});

class TestClass extends UcrxClass {

  constructor() {
    super({
      lib: null!,
      typeName: 'Test',
      schema: ucMap({}),
      baseClass: VoidUcrxClass.instance,
      classConstructor: { args: UcrxSignature },
    });
  }

}

class TestClass2 extends UcrxClass {

  constructor() {
    super({
      lib: null!,
      typeName: 'Test2',
      schema: ucMap({}),
      baseClass: new TestClass(),
      classConstructor: { args: UcrxSignature },
    });
  }

}
