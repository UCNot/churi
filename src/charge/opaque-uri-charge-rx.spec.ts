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
    describe('addValue', () => {
      it('charges none', () => {
        expect(
          chargeRx.rxValue(rx => {
            rx.addValue('some', 'string');

            return rx.end();
          }),
        ).toBe(NONE);
      });
    });
    describe('add', () => {
      it('charges none', () => {
        const charge = { name: 'test charge' };

        expect(
          chargeRx.rxValue(rx => {
            rx.add(charge);

            return rx.end();
          }),
        ).toBe(NONE);
      });
    });
  });

  describe('MapRx', () => {
    describe('put', () => {
      it('ignores charge', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.put('key', 'some');

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('putEntity', () => {
      it('ignores entity', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.putEntity('key', '!some');

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('putValue', () => {
      it('ignores value', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.putValue('key', 'some', 'string');

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('rxMap', () => {
      it('ignores charge', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.rxMap('key', nestedRx => nestedRx.endMap());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('startList', () => {
      it('ignores charge', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.rxList('key', listRx => listRx.end());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('startDirective', () => {
      it('ignores charge', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.rxDirective('key', '!test', directiveRx => directiveRx.end());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });
  });
});
