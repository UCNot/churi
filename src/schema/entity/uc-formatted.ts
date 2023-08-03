import { AllUcrx } from '../../rx/all.ucrx.js';
import { chargeURI } from '../../rx/charge-uri.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { UcChargeLexer } from '../../syntax/formats/charge/uc-charge.lexer.js';
import { UcToken } from '../../syntax/uc-token.js';

/**
 * Opaque charge formatted data.
 *
 * This representation is used when formatted data is not recognized by parser.
 */
export class UcFormatted {

  readonly #format: string;
  readonly #data: readonly UcToken[];

  /**
   * Constructs unrecognized formatted data.
   *
   * @param format - Format name.
   * @param data - Either formatted data tokens, or raw string to split onto tokens.
   */
  constructor(format: string, data: string | readonly UcToken[]) {
    this.#format = format;
    this.#data = typeof data === 'string' ? UcChargeLexer.scan(data) : data;
  }

  /**
   * Format name.
   */
  get format(): string {
    return this.#format;
  }

  /**
   * Formatted data tokens.
   */
  get data(): readonly UcToken[] {
    return this.#data;
  }

  get [Symbol.toStringTag](): string {
    return 'UcFormattedData';
  }

  /**
   * Represents this formatted data as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: AllUcrx, mode: UctxMode): void;
  toUC(rx: AllUcrx, _mode: UctxMode): void {
    rx.fmt(this.format, this.data);
  }

  /**
   * Represents this formatted data as string.
   *
   * @returns The {@link chargeURI encoded} formatted data.
   */
  toString(): string {
    return chargeURI(this)!;
  }

}
