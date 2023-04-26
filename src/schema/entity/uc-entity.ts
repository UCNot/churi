import { encodeURIPart } from 'httongue';
import { chargeURI } from '../../rx/charge-uri.js';
import { Ucrx } from '../../rx/ucrx.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { Uctx } from '../../rx/uctx.js';
import { printUcTokens } from '../../syntax/print-uc-token.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UcToken } from '../../syntax/uc-token.js';

/**
 * Opaque URI charge entity.
 *
 * This representation is used when entity is not recognized by parser.
 */

export class UcEntity implements Uctx {

  readonly #tokens: readonly UcToken[];
  #raw?: string;

  /**
   * Constructs unrecognized entity.
   *
   * @param tokens - The entity entity tokens. When string is given, it will be {@link UcLexer.scan scanned} for tokens.
   */
  constructor(tokens: string | readonly UcToken[]) {
    this.#tokens = typeof tokens === 'string' ? UcLexer.scan(tokens) : tokens;
  }

  /**
   * Entity tokens.
   */
  get tokens(): readonly UcToken[] {
    return this.#tokens;
  }

  /**
   * The entity as is.
   */
  get raw(): string {
    return (this.#raw ??= printUcTokens(this.tokens, encodeURIPart));
  }

  get [Symbol.toStringTag](): string {
    return 'UcEntity';
  }

  [Symbol.toPrimitive](): string {
    return this.raw;
  }

  valueOf(): string {
    return this.raw;
  }

  /**
   * Represents this entity as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: Ucrx, mode: UctxMode): void;
  toUC(rx: Ucrx, _mode: UctxMode): void {
    rx.ent(this.tokens);
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
