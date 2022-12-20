import { chargeURI } from './charge-uri.js';
import { URIChargeable } from './uri-chargeable.js';

/**
 * URI charge value represented as native JavaScript value.
 *
 * May be one of:
 *
 * - value of base type.
 * - {@link UcPrimitive primitive value},
 * - object representing {@link UcMap map},
 * - array representing {@link UcList list},
 * - unrecognized {@link UcEntity entity},
 * - unrecognized {@link UcDirective directive} containing charge value.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export type UcValue<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcMap<TValue>
  | UcList<TValue>
  | UcDirective<UcValue<TValue>>;

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = bigint | boolean | number | string | null;

/**
 * URI charge list represented as JavaScript array.
 *
 * @typeParam TValue - List item value type.
 */
export type UcList<TValue = UcPrimitive> = UcValue<TValue>[];

/**
 * URI charge map represented as JavaScript object.
 *
 * @typeParam TValue - Map entry value type.
 */
export interface UcMap<out TValue = UcPrimitive> {
  [key: string]: UcValue<TValue> | undefined;
}

/**
 * Unrecognized URI charge entity.
 *
 * This representation is used when entity is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 */
export class UcEntity implements URIChargeable {

  readonly #raw: string;

  /**
   * Constructs unrecognized entity.
   *
   * @param raw - The entity as is, with leading `!` and _not_ URI-decoded.
   */
  constructor(raw: string) {
    this.#raw = raw;
  }

  /**
   * The entity as is, with leading `!` and _not_ URI-decoded.
   */
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

  /**
   * Encodes this entity into URI charge.
   *
   * @param _placement - The ignored placement of encoded entity.
   *
   * @returns The entity {@link raw as is}.
   */
  chargeURI(_placement: URIChargeable.Placement): string {
    return this.#raw;
  }

  /**
   * String representation of the entity.
   *
   * @returns The {@link chargeURI encoded} entity.
   */
  toString(): string {
    return this.chargeURI({});
  }

}

/**
 * Unrecognized URI charge directive.
 *
 * This representation is used when directive is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 *
 * @typeParam TCharge - Directive argument charge representation type.
 */
export class UcDirective<out TCharge = UcPrimitive> implements URIChargeable {

  readonly #rawName: string;
  readonly #arg: TCharge;

  /**
   * Constructs unrecognized URI directive.
   *
   * @param rawName - Directive name as is, with leading `!` and _not_ URI-decoded.
   * @param args - Directive argument charge.
   */
  constructor(rawName: string, args: TCharge) {
    this.#rawName = rawName;
    this.#arg = args;
  }

  /**
   * Directive name as is, with leading `!` and _not_ URI-decoded.
   */
  get rawName(): string {
    return this.#rawName;
  }

  /**
   * Directive argument charge.
   */
  get arg(): TCharge {
    return this.#arg;
  }

  get [Symbol.toStringTag](): string {
    return 'UcDirective';
  }

  /**
   * Encodes this directive into URI charge.
   *
   * @param _placement - The ignored placement of encoded directive.
   *
   * @returns The encoded directive.
   */
  chargeURI(_placement: URIChargeable.Placement): string {
    let omitParentheses = false;
    const encodedValue =
      chargeURI(this.#arg, {
        as: 'arg',
        omitParentheses() {
          omitParentheses = true;
        },
      }) ?? '--';

    return omitParentheses
      ? `${this.#rawName}${encodedValue}`
      : `${this.#rawName}(${encodedValue})`;
  }

  /**
   * String representation of the directive.
   *
   * @returns The {@link chargeURI encoded} directive.
   */
  toString(): string {
    return this.chargeURI({});
  }

}
