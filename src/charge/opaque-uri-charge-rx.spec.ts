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

  describe('rxList', () => {
    it('ignores charge', () => {
      expect(
        chargeRx.rxList(rx => {
          rx.add('value');

          return rx.end();
        }),
      ).toBe(NONE);
    });
  });

  describe('rxDirective', () => {
    it('ignores charge', () => {
      expect(
        chargeRx.rxDirective('!test', rx => {
          rx.add('value');

          return rx.end();
        }),
      ).toBe(NONE);
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
    describe('rxEntry', () => {
      it('ignores entity', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.rxEntry('key', rx => rx.end());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });
  });
});
