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
    describe('setValue', () => {
      it('charges none', () => {
        expect(chargeRx.rxValue(rx => rx.setValue('some', 'string'))).toBe(NONE);
      });
    });
    describe('setCharge', () => {
      it('charges input', () => {
        const charge = { name: 'test charge' };

        expect(chargeRx.rxValue(rx => rx.set(charge))).toBe(charge);
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
            rx.rxList('key', listRx => listRx.endList());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });

    describe('startDirective', () => {
      it('ignores charge', () => {
        expect(
          chargeRx.rxMap(rx => {
            rx.rxDirective('key', '!test', directiveRx => directiveRx.endDirective());

            return rx.endMap();
          }),
        ).toBe(NONE);
      });
    });
  });

  describe('ListRx', () => {
    it('is instance of `ListRx`', () => {
      let listRx!: URIChargeRx.ListRx;

      chargeRx.rxList(rx => {
        listRx = rx;
      });

      expect(listRx).toBeInstanceOf(OpaqueURIChargeRx.ListRx);
      expect(listRx).not.toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.ListRx(chargeRx);

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      expect(
        chargeRx.rxList(rx => {
          rx.add('some');

          return rx.endList();
        }),
      ).toBe(NONE);
    });
  });

  describe('DirectiveRx', () => {
    it('is instance of `DirectiveRx`', () => {
      let directiveRx!: URIChargeRx.DirectiveRx;

      chargeRx.rxDirective('!test', rx => {
        directiveRx = rx;

        return rx.endDirective();
      });

      expect(directiveRx).toBeInstanceOf(OpaqueURIChargeRx.DirectiveRx);
      expect(directiveRx).not.toBeInstanceOf(OpaqueURIChargeRx.ListRx);
    });
    it('is inherited from `ItemsRx`', () => {
      const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test');

      expect(rx).toBeInstanceOf(OpaqueURIChargeRx.ItemsRx);
    });
    it('ignores charge', () => {
      expect(
        chargeRx.rxDirective('!test', rx => {
          rx.add('some');

          return rx.endDirective();
        }),
      ).toBe(NONE);
    });

    describe('rawName', () => {
      it('contains directive name', () => {
        const rx = new OpaqueURIChargeRx.DirectiveRx(chargeRx, '!test%20directive');

        expect(rx.rawName).toBe('!test%20directive');
      });
    });
  });
});
