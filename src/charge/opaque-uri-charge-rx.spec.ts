import { beforeEach, describe, expect, it } from '@jest/globals';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { URIChargeRx } from './uri-charge-rx.js';

describe('OpaqueURIChargeRx', () => {
  const NONE = { name: 'None' };
  let chargeRx: URIChargeRx;

  beforeEach(() => {
    chargeRx = new OpaqueURIChargeRx({ none: NONE });
  });

  describe('createValue', () => {
    it('charges none', () => {
      expect(chargeRx.createValue(123, 'number')).toBe(NONE);
    });
  });

  describe('createEntity', () => {
    it('charges none', () => {
      expect(chargeRx.createEntity('!test')).toBe(NONE);
    });
  });

  describe('ValueRx', () => {
    let rx: URIChargeRx.ValueRx;

    beforeEach(() => {
      rx = chargeRx.rxValue();
    });

    describe('setValue', () => {
      it('charges none', () => {
        expect(rx.setValue('some', 'string')).toBe(NONE);
      });
    });
    describe('setCharge', () => {
      it('charges input', () => {
        const charge = { name: 'test charge' };

        expect(rx.set(charge)).toBe(charge);
      });
    });
  });

  describe('MapRx', () => {
    let rx: URIChargeRx.MapRx;

    beforeEach(() => {
      rx = chargeRx.rxMap();
    });

    describe('put', () => {
      it('ignores charge', () => {
        rx.put('key', 'some');

        expect(rx.endMap()).toBe(NONE);
      });
    });

    describe('putEntity', () => {
      it('ignores entity', () => {
        rx.putEntity('key', '!some');

        expect(rx.endMap()).toBe(NONE);
      });
    });

    describe('putValue', () => {
      it('ignores value', () => {
        rx.putValue('key', 'some', 'string');

        expect(rx.endMap()).toBe(NONE);
      });
    });

    describe('startMap', () => {
      it('ignores charge', () => {
        rx.startMap('key').endMap();

        expect(rx.endMap()).toBe(NONE);
      });
    });

    describe('startList', () => {
      it('ignores charge', () => {
        rx.startList('key').endList();

        expect(rx.endMap()).toBe(NONE);
      });
    });

    describe('startDirective', () => {
      it('ignores charge', () => {
        rx.startDirective('key', '!test').endDirective();

        expect(rx.endMap()).toBe(NONE);
      });
    });
  });

  describe('ListRx', () => {
    it('is instance of `ListRx`', () => {
      const rx = chargeRx.rxList();

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ListRx);
      expect(rx).not.toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.ListRx(chargeRx);

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      const rx = chargeRx.rxList();

      rx.add('some');

      expect(rx.endList()).toBe(NONE);
    });
  });

  describe('DirectiveRx', () => {
    it('is instance of `DirectiveRx`', () => {
      const rx = chargeRx.rxDirective('!test');

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
      expect(rx).not.toBeInstanceOf(OpaqueURIChargeRx.ListRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test');

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      const rx = chargeRx.rxDirective('!test');

      rx.add('some');

      expect(rx.endDirective()).toBe(NONE);
    });

    describe('rawName', () => {
      it('contains directive name', () => {
        const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test%20directive');

        expect(rx.rawName).toBe('!test%20directive');
      });
    });
  });
});
