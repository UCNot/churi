import { UcPrimitive } from '../schema/uc-primitive.js';
import { URIChargeRx } from './uri-charge-rx.js';

/**
 * Opaque URI charge receiver implementation.
 *
 * Ignores charges and always results to {@link OpaqueURIChargeRx#none none}.
 *
 * Can be used as a base for other implementations.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type.
 */
export class OpaqueURIChargeRx<out TValue = UcPrimitive, out TCharge = unknown>
  implements URIChargeRx<TValue, TCharge> {

  /**
   * Opaque URI charge values(s) receiver.
   *
   * Ignores charges and always results to {@link OpaqueURIChargeRx#none none}.
   *
   * Can be used as a base for other implementations.
   */
  static get ValueRx(): URIChargeRx.ValueRx.Constructor {
    return OpaqueURICharge$ValueRx;
  }

  /**
   * Opaque URI charge map entries receiver.
   *
   * Ignores charges and always results to {@link OpaqueURIChargeRx#none none}.
   *
   * Can be used as a base for other implementations.
   */
  static get MapRx(): URIChargeRx.MapRx.Constructor {
    return OpaqueURICharge$MapRx;
  }

  readonly #none: TCharge;

  constructor({ none }: URIChargeRx.Init<TCharge>) {
    this.#none = none;
  }

  get ns(): URIChargeRx.Namespace {
    return this.constructor as typeof OpaqueURIChargeRx<TValue, TCharge>;
  }

  get none(): TCharge {
    return this.#none;
  }

  createDirective(_rawName: string, _rawArg: string): TCharge {
    return this.none;
  }

  createEntity(_rawEntity: string): TCharge {
    return this.none;
  }

  createValue(_value: TValue | UcPrimitive, _type: string): TCharge {
    return this.none;
  }

  rxValue(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge {
    return build(new this.ns.ValueRx(this));
  }

  rxMap(build: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge {
    return build(new this.ns.MapRx(this));
  }

  rxList(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge {
    return this.rxValue(build);
  }

}

class OpaqueURICharge$ValueRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.ValueRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;

  constructor(chargeRx: TRx) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  add(_charge: TCharge): void {
    // Ignore charge.
  }

  addDirective(rawName: string, rawArg: string): void {
    this.add(this.#chargeRx.createDirective(rawName, rawArg));
  }

  addEntity(rawEntity: string): void {
    this.add(this.#chargeRx.createEntity(rawEntity));
  }

  addValue(value: UcPrimitive | TValue, type: string): void {
    this.add(this.#chargeRx.createValue(value, type));
  }

  rxMap(build: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void {
    this.add(this.chargeRx.rxMap(build));
  }

  rxList(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void {
    this.add(this.chargeRx.rxList(build));
  }

  end(): TCharge {
    return this.#chargeRx.none;
  }

}

class OpaqueURICharge$MapRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.MapRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;

  constructor(chargeRx: TRx) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  rxEntry(
    _key: string,
    build: (rx: URIChargeRx.ValueRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): void {
    this.#chargeRx.rxValue(build);
  }

  addSuffix(suffix: string): void {
    this.rxEntry(suffix, rx => {
      rx.addValue('', 'string');

      return rx.end();
    });
  }

  endMap(): TCharge {
    return this.#chargeRx.none;
  }

}
