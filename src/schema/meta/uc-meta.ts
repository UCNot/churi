import { AllUcrx } from '../../rx/all.ucrx.js';
import { chargeURI } from '../../rx/charge-uri.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { uctxValue } from '../../rx/uctx-value.js';

/**
 * Opaque URI charge metadata.
 *
 * This representation is used when metadata is not recognized by parser.
 *
 * Contains named attribute values. Each attribute may have multiple values.
 */
export class UcMeta {

  readonly #attributes: { readonly [name: string]: readonly unknown[] | undefined };
  #_names?: string[];

  /**
   * Constructs metadata.
   *
   * @param attributes - Attributes with corresponding array of values.
   */
  constructor(attributes: { readonly [name: string]: readonly unknown[] | undefined }) {
    this.#attributes = attributes;
  }

  /**
   * Checks whether `attribute` with the given name exists within metadata.
   *
   * @param attribute - Target attribute name.
   */
  has(attribute: string): boolean {
    return attribute in this.#attributes && !!this.#attributes[attribute]?.length;
  }

  /**
   * Obtains the value of `attribute` with the given name.
   *
   * If attribute has multiple values, then returns the last one.
   *
   * @param attribute - Target attribute name.
   *
   * @returns Either attribute value, or `undefined` if there is no such attribute.
   */
  get(attribute: string): unknown | undefined {
    const values = this.#attributes[attribute];

    return values?.[values.length - 1];
  }

  /**
   * Obtains all values of `attribute` with the given name.
   *
   * @param attribute - Target attribute name.
   *
   * @readonly Either array of attribute values, or empty array if there is no such attribute.
   */
  getAll(attribute: string): unknown[] {
    const values = this.#attributes[attribute];

    return values ? values.slice() : [];
  }

  /**
   * Iterates over attribute names.
   */
  *attributes(): IterableIterator<string> {
    yield* this.#names();
  }

  #names(): string[] {
    return (this.#_names ??= Object.keys(this.#attributes).filter(attribute => this.has(attribute)));
  }

  /**
   * Adds the given attributes to this metadata.
   *
   * @param attributes - Attributes to add.
   *
   * @returns New metadata instance containing both attributes of this instance ant the added ones.
   */
  add(attributes: { readonly [name: string]: readonly unknown[] | undefined }): UcMeta {
    const newAttributes: { [name: string]: readonly unknown[] | undefined } = {
      ...this.#attributes,
    };

    for (const [attribute, values] of Object.entries(attributes)) {
      if (values) {
        const oldValues = newAttributes[attribute];

        newAttributes[attribute] = oldValues ? [...oldValues, ...values] : values;
      }
    }

    return new UcMeta(newAttributes);
  }

  /**
   * Adds the given metadata attributes to this metadata.
   *
   * @param other - Metadata to add attributes from.
   *
   * @returns New metadata instance containing both attributes of this instance ant the added ones.
   */
  merge(other: UcMeta): UcMeta {
    return this.add(other.#attributes);
  }

  /**
   * Represents this entity as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: AllUcrx, mode: UctxMode): void;
  toUC(rx: AllUcrx, _mode: UctxMode): void {
    for (const attribute of this.#names()) {
      this.#attributes[attribute]?.forEach(value => {
        const attrRx = rx.met(attribute);

        if (attrRx) {
          uctxValue(attrRx, value);
          attrRx.end();
        }
      });
    }
  }

  /**
   * String representation of metadata.
   *
   * @returns The {@link chargeURI encoded} entity.
   */
  toString(): string {
    return chargeURI(this) ?? '!()';
  }

}
