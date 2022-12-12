import { encodeURICharge } from './uri-charge-codec.js';
import { URIChargeEncodable } from './uri-charge-encodable.js';

export type ChURIValue<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIEntity
  | ChURIMap<TValue>
  | ChURIList<TValue>
  | ChURIDirective<ChURIValue<TValue>>;

export type ChURIPrimitive = bigint | boolean | number | string | null;

export type ChURIList<TValue = ChURIPrimitive> = ChURIValue<TValue>[];

export interface ChURIMap<out TValue = ChURIPrimitive> {
  [key: string]: ChURIValue<TValue> | undefined;
}

export class ChURIEntity implements URIChargeEncodable {

  readonly #raw: string;

  constructor(raw: string) {
    this.#raw = raw;
  }

  get raw(): string {
    return this.#raw;
  }

  get [Symbol.toStringTag](): string {
    return 'ChURIEntity';
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

export class ChURIDirective<out TValue = ChURIPrimitive> implements URIChargeEncodable {

  #rawName: string;
  #value: TValue;

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
    return 'ChURIDirective';
  }

  encodeURICharge(_placement: URIChargeEncodable.Placement): string {
    let omitParentheses = false;
    const valuePlacement: URIChargeEncodable.Arg = {
      as: 'arg',
      omitParentheses() {
        omitParentheses = true;
      },
    };

    const encodedValue = encodeURICharge(this.#value, valuePlacement) ?? '--';

    return omitParentheses
      ? `${this.#rawName}${encodedValue}`
      : `${this.#rawName}(${encodedValue})`;
  }

  toString(): string {
    return this.encodeURICharge({});
  }

}
