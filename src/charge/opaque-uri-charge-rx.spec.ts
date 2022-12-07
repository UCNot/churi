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
    let received: unknown;

    beforeEach(() => {
      rx = chargeRx.rxValue(charge => {
        received = charge;
      });
      received = undefined;
    });

    describe('setValue', () => {
      it('charges none', () => {
        expect(rx.setValue('some', 'string')).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });
    describe('setCharge', () => {
      it('charges input', () => {
        const charge = { name: 'test charge' };

        expect(rx.set(charge)).toBe(charge);
        expect(received).toBe(charge);
      });
    });
  });

  describe('MapRx', () => {
    let rx: URIChargeRx.MapRx;
    let received: unknown;

    beforeEach(() => {
      rx = chargeRx.rxMap(charge => {
        received = charge;
      });
      received = undefined;
    });

    describe('put', () => {
      it('ignores charge', () => {
        rx.put('key', 'some');

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });

    describe('putEntity', () => {
      it('ignores entity', () => {
        rx.putEntity('key', '!some');

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });

    describe('putValue', () => {
      it('ignores value', () => {
        rx.putValue('key', 'some', 'string');

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });

    describe('startMap', () => {
      it('ignores charge', () => {
        rx.startMap('key').endMap();

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });

    describe('startList', () => {
      it('ignores charge', () => {
        rx.startList('key').endList();

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });

    describe('startDirective', () => {
      it('ignores charge', () => {
        rx.startDirective('key', '!test').endDirective();

        expect(rx.endMap()).toBe(NONE);
        expect(received).toBe(NONE);
      });
    });
  });

  describe('ListRx', () => {
    let rx: URIChargeRx.ListRx;
    let received: unknown;

    beforeEach(() => {
      rx = chargeRx.rxList(charge => {
        received = charge;
      });
      received = undefined;
    });

    it('is instance of `ListRx`', () => {
      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ListRx);
      expect(rx).not.toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.ListRx(chargeRx);

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      rx.add('some');

      expect(rx.endList()).toBe(NONE);
      expect(received).toBe(NONE);
    });
  });

  describe('DirectiveRx', () => {
    let rx: URIChargeRx.DirectiveRx;
    let received: unknown;

    beforeEach(() => {
      rx = chargeRx.rxDirective('!test', charge => {
        received = charge;
      });
      received = undefined;
    });

    it('is instance of `DirectiveRx`', () => {
      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
      expect(rx).not.toBeInstanceOf(OpaqueURIChargeRx.ListRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test');

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      rx.add('some');

      expect(rx.endDirective()).toBe(NONE);
      expect(received).toBe(NONE);
    });

    describe('rawName', () => {
      it('contains directive name', () => {
        const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test%20directive');

        expect(rx.rawName).toBe('!test%20directive');
      });
    });
  });
});
