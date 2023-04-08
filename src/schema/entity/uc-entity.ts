import { chargeURI } from '../../rx/charge-uri.js';
import { Ucrx } from '../../rx/ucrx.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { Uctx } from '../../rx/uctx.js';
import { UcLexer } from '../../syntax/uc-lexer.js';

/**
 * Opaque URI charge entity.
 *
 * This representation is used when entity is not recognized by parser.
 */

export class UcEntity implements Uctx {

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
   * Represents this entity as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: Ucrx, mode: UctxMode): void;
  toUC(rx: Ucrx, _mode: UctxMode): void {
    rx.ent(UcLexer.scan(this.raw));
  }

  /**
   * String representation of the entity.
   *
   * @returns The {@link chargeURI encoded} entity.
   */
  toString(): string {
    return chargeURI(this)!;
  }

}
