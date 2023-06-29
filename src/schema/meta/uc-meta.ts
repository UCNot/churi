import { AllUcrx } from '../../rx/all.ucrx.js';
import { chargeURI } from '../../rx/charge-uri.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { uctxValue } from '../../rx/uctx-value.js';

/**
 * Charge metadata consisting of attributes and their values.
 *
 * Metadata instance is mutable, unless {@link freeze freezed}. When freezed, each modification method call returns
 * new, mutable {@link clone}. When mutable, each modification method call returns `this` instance.
 *
 * Applies copy-on-write technique to avoid excessive data copying.
 */
export class UcMeta {

  #state: UcMeta$State;
  readonly #freezed: boolean;

  /**
   * Constructs new metadata instance.
   *
   * @param source - Source metadata to clone the contents of.
   * @param freeze - Whether to freeze constructed metadata. `false` by default.
   */
  constructor(source?: UcMeta, freeze = false) {
    if (!source) {
      this.#state = { attrs: new Map(), clones: 0 };
    } else {
      this.#state = source.#state;
      ++this.#state.clones;
    }
    this.#freezed = freeze;
  }

  /**
   * Informs whether this metadata instance is {@link UcMeta.Freezed freezed}.
   */
  isFreezed(): this is UcMeta.Freezed {
    return this.#freezed;
  }

  /**
   * Informs whether this metadata instance is {@link UcMeta.Mutable mutable}.
   */
  isMutable(): this is UcMeta.Mutable {
    return !this.isFreezed();
  }

  /**
   * Checks whether the given `attribute` exists within metadata.
   *
   * @param attribute - Target attribute.
   */
  has(attribute: string): boolean {
    return this.#state.attrs.has(attribute);
  }

  /**
   * Obtains the value of the given `attribute`.
   *
   * If attribute has multiple values, then returns the last one.
   *
   * @param attribute - Target attribute.
   *
   * @returns Either attribute value, or `undefined` if there is no such attribute.
   */
  get(attribute: string): unknown | undefined {
    const values = this.#state.attrs.get(attribute);

    return values?.[values.length - 1];
  }

  /**
   * Obtains all values of the given `attribute`.
   *
   * @param attribute - Target attribute.
   *
   * @readonly Either array of attribute values, or empty array if there is no such attribute.
   */
  getAll(attribute: string): unknown[] {
    const values = this.#state.attrs.get(attribute);

    return values ? values.slice() : [];
  }

  /**
   * Iterates over attributes.
   */
  attributes(): IterableIterator<string> {
    return this.#state.attrs.keys();
  }

  /**
   * Adds `attribute` value to this metadata.
   *
   * @param attribute - Target attribute.
   * @param value - Value to add.
   *
   * @returns {@link modify Modified} metadata instance containing both attributes of this instance and the added ones.
   */
  add(attribute: string, value: unknown): UcMeta.Mutable {
    const clone = this.#modify();

    clone.#add(attribute, value);

    return clone;
  }

  #add(attribute: string, value: unknown): void {
    const values = this.#state.attrs.get(attribute);

    if (values) {
      values.push(value);
    } else {
      this.#state.attrs.set(attribute, [value]);
    }
  }

  #modify(): UcMeta.Mutable {
    if (this.isFreezed()) {
      const clone = this.clone();

      clone.#state = clone.#forkState();

      return clone;
    }

    if (this.#state.clones) {
      this.#state = this.#forkState();
    }

    return this as UcMeta.Mutable;
  }

  #forkState(): UcMeta$State {
    --this.#state.clones;

    return {
      attrs: new Map(
        [...this.#state.attrs].map(([attribute, values]) => [attribute, values.slice()]),
      ),
      clones: 0,
    };
  }

  /**
   * Adds the given metadata attributes to this metadata.
   *
   * @param other - Metadata to add attributes from.
   *
   * @returns {@link modify Modified} metadata instance containing both attributes of this instance and the added ones.
   */
  addAll(other: UcMeta): UcMeta.Mutable {
    const clone = this.#modify();

    clone.#addAll(other);

    return clone;
  }

  #addAll(other: UcMeta): void {
    for (const [attribute, values] of other.#state.attrs) {
      const prevValues = this.#state.attrs.get(attribute);

      if (prevValues) {
        prevValues.push(...values);
      } else {
        this.#state.attrs.set(attribute, values);
      }
    }
  }

  /**
   * Creates {@link UcMeta.Mutable mutable} clone of this metadata.
   *
   * @returns Mutable clone with this metadata contents.
   */
  clone(): UcMeta.Mutable {
    return new (this.constructor as typeof UcMeta)(this) as UcMeta.Mutable;
  }

  /**
   * Converts this metadata to {@link UcMeta.Freezed freezed} one.
   *
   * @returns Either `this` instance if already {@link isFreezed freezed}, or freezed clone otherwise.
   */
  freeze(): UcMeta.Freezed {
    if (this.isFreezed()) {
      return this;
    }

    return new (this.constructor as typeof UcMeta)(this, true) as UcMeta.Freezed;
  }

  /**
   * Converts this metadata to {@link UcMeta.Mutable mutable} one.
   *
   * @returns Either `this` instance if already {@link isMutable mutable}, or mutable {@link clone} otherwise.
   */
  unfreeze(): UcMeta.Mutable {
    return this.isFreezed() ? this.clone() : (this as UcMeta.Mutable);
  }

  /**
   * Represents this metadata as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  toUC(rx: AllUcrx, mode: UctxMode): void;
  toUC(rx: AllUcrx, _mode: UctxMode): void {
    for (const [attribute, values] of this.#state.attrs) {
      for (const value of values) {
        const attrRx = rx.att(attribute);

        if (attrRx) {
          uctxValue(attrRx, value);
          attrRx.end();
        }
      }
    }
  }

  /**
   * Represents this metadata as string.
   *
   * @returns The {@link toUC encoded} metadata.
   */
  toString(): string {
    return chargeURI(this) ?? '!()';
  }

}

export namespace UcMeta {
  /**
   * Mutable {@link UcMeta charge metadata} instance.
   */
  export interface Mutable extends UcMeta {
    isMutable(): true;
    isFreezed(): false;
    add(attribute: string, value: unknown): this;
    addAll(other: UcMeta): this;
    clone(): this;
    unfreeze(): this;
  }

  /**
   * Freezed (immutable) {@link UcMeta charge metadata} instance.
   */
  export interface Freezed extends UcMeta {
    isMutable(): false;
    isFreezed(): true;
    freeze(): this;
  }
}

interface UcMeta$State {
  readonly attrs: Map<string, unknown[]>;
  clones: number;
}
