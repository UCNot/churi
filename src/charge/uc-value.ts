import { encodeURICharge } from './uri-charge-codec.js';
import { URIChargeEncodable } from './uri-charge-encodable.js';

export type UcValue<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcMap<TValue>
  | UcList<TValue>
  | UcDirective<UcValue<TValue>>;

export type UcPrimitive = bigint | boolean | number | string | null;

export type UcList<TValue = UcPrimitive> = UcValue<TValue>[];

export interface UcMap<out TValue = UcPrimitive> {
  [key: string]: UcValue<TValue> | undefined;
}

export class UcEntity implements URIChargeEncodable {

  readonly #raw: string;

  constructor(raw: string) {
    this.#raw = raw;
  }

  get raw(): string {
    return this.#raw;
  }

  get [Symbol.toStringTag](): string {
    return 'UcEntity';
  }

  [Symbol.toPrimitive](): string {
    return this.#raw;
  }

  valueOf(): string {
    return this.#raw;
  }

  encodeURICharge(_placement: URIChargeEncodable.Placement): string {
    return this.#raw;
  }

  toString(): string {
    return this.encodeURICharge({});
  }

}

export class UcDirective<out TValue = UcPrimitive> implements URIChargeEncodable {

  readonly #rawName: string;
  readonly #value: TValue;

  constructor(rawName: string, value: TValue) {
    this.#rawName = rawName;
    this.#value = value;
  }

  get rawName(): string {
    return this.#rawName;
  }

  get value(): TValue {
    return this.#value;
  }

  get [Symbol.toStringTag](): string {
    return 'UcDirective';
  }

  encodeURICharge(_placement: URIChargeEncodable.Placement): string {
    let omitParentheses = false;
    const encodedValue =
      encodeURICharge(this.#value, {
        as: 'arg',
        omitParentheses() {
          omitParentheses = true;
        },
      }) ?? '--';

    return omitParentheses
      ? `${this.#rawName}${encodedValue}`
      : `${this.#rawName}(${encodedValue})`;
  }

  toString(): string {
    return this.encodeURICharge({});
  }

}
