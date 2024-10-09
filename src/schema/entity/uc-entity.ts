import { AllUcrx } from '../../rx/all.ucrx.js';
import { chargeURI } from '../../rx/charge-uri.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { Uctx } from '../../rx/uctx.js';

/**
 * Opaque charge entity.
 *
 * This representation is used when entity is not recognized by parser.
 */
export class UcEntity implements Uctx {
  readonly #name: string;

  /**
   * Constructs unrecognized entity.
   *
   * @param name - Entity name.
   */
  constructor(name: string) {
    this.#name = name;
  }

  /**
   * Entity name.
   */
  get name(): string {
    return this.#name;
  }

  get [Symbol.toStringTag](): string {
    return 'UcEntity';
  }

  /**
   * Represents this entity as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: AllUcrx, mode: UctxMode): void;
  toUC(rx: AllUcrx, _mode: UctxMode): void {
    rx.ent(this.name);
  }

  /**
   * Represents this entity as string.
   *
   * @returns The {@link chargeURI encoded} entity.
   */
  toString(): string {
    return chargeURI(this)!;
  }
}
