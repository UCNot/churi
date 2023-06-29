import { AllUcrx } from '../../rx/all.ucrx.js';
import { chargeURI } from '../../rx/charge-uri.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { UcAttr } from './uc-attr.js';
import { UcMetaAttr } from './uc-meta-attr.js';

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
   * Obtains the value of the named `attribute`.
   *
   * If attribute has multiple values, then returns the last one.
   *
   * @param attribute - Target attribute name.
   *
   * @returns Either attribute value, or `undefined` if there is no such attribute.
   */
  get(attribute: string): unknown | undefined;

  /**
   * Extracts the typed value of the `attribute`.
   *
   * @typeParam T - Attribute value type.
   * @param attribute - Target attribute.
   *
   * @returns Either attribute value, or `undefined` if attribute value can not be {@link UcMeteAttr#extract extracted}.
   */
  get<T>(attribute: UcMetaAttr<T>): T | undefined;

  get<T>(attribute: string | UcMetaAttr<T>): unknown | undefined {
    const uid = this.#attrUid(attribute);
    const store = this.#state.attrs.get(uid);

    if (!store) {
      return typeof attribute === 'string' ? undefined : attribute.extract(undefined, this);
    }

    const [attr, data] = store;

    return attr.extract(data, this);
  }

  #attrUid(attribute: string | UcMetaAttr): unknown {
    return typeof attribute === 'string' ? attribute : attribute.uid;
  }

  /**
   * Obtains all values of the named `attribute`.
   *
   * @param attribute - Target attribute name.
   *
   * @returns Either array of attribute values, or empty array if there is no such attribute.
   */
  getAll(attribute: string): unknown[];

  /**
   * Extracts all typed values of the `attribute`.
   *
   * @param T - Attribute value type.
   * @param attribute - Target attribute.
   *
   * @returns Either array of attribute values, or empty array attribute values can not be
   * {@link UcMeteAttr#extractAll extracted}.
   */
  getAll<T>(attribute: UcMetaAttr<T>): T[];

  getAll(attribute: string | UcMetaAttr): unknown[] {
    const uid = this.#attrUid(attribute);
    const store = this.#state.attrs.get(uid);

    if (!store) {
      return typeof attribute === 'string' ? [] : attribute.extractAll(undefined, this);
    }

    const [attr, data] = store;

    return attr.extractAll(data, this);
  }

  /**
   * Iterates over attributes.
   *
   * @returns Iterable iterator of attributes.
   */
  *attributes(): IterableIterator<UcMetaAttr> {
    for (const [attr] of this.#state.attrs.values()) {
      yield attr;
    }
  }

  /**
   * Adds named `attribute` value to this metadata.
   *
   * @param attribute - Target attribute name.
   * @param value - Value to add.
   *
   * @returns Modified metadata instance containing both attributes of this instance and the added ones.
   */
  add(attribute: string, value: unknown): UcMeta.Mutable;

  /**
   * Adds typed `attribute` value to this metadata.
   *
   * @param TInput - Attribute input type.
   * @param attribute - Target attribute.
   * @param value - Value to add.
   *
   * @returns Modified metadata instance containing both attributes of this instance and the added ones.
   */
  add<TInput>(attribute: UcMetaAttr<unknown, TInput>, value: TInput): UcMeta.Mutable;

  add(attribute: string | UcMetaAttr, value: unknown): UcMeta.Mutable {
    const clone = this.#modify();

    clone.#add(attribute, value);

    return clone;
  }

  #add(attribute: string | UcMetaAttr, value: unknown): void {
    const uid = this.#attrUid(attribute);
    const store = this.#state.attrs.get(uid);

    if (store) {
      const [attr, data] = store;

      store[1] = attr.store(data, value, this);
    } else {
      const attr = typeof attribute === 'string' ? new UcAttr(attribute, attribute) : attribute;

      this.#state.attrs.set(uid, [attr, attr.store(undefined, value, this)]);
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
        [...this.#state.attrs].map(([attribute, [attr, data]]) => [
          attribute,
          [attr, attr.clone(data)],
        ]),
      ),
      clones: 0,
    };
  }

  /**
   * Adds the given metadata attributes to this metadata.
   *
   * @param other - Metadata to add attributes from.
   *
   * @returns Modified metadata instance containing both attributes of this instance and the added ones.
   */
  addAll(other: UcMeta): UcMeta.Mutable {
    const clone = this.#modify();

    clone.#addAll(other);

    return clone;
  }

  #addAll(other: UcMeta): void {
    for (const [uid, [attr, data]] of other.#state.attrs) {
      const prevStore = this.#state.attrs.get(uid);

      if (prevStore) {
        const [prevAttr, prevData] = prevStore;

        prevStore[1] = prevAttr.merge(prevData, data);
      } else {
        this.#state.attrs.set(uid, [attr, attr.clone(data)]);
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
    for (const [attr, data] of this.#state.attrs.values()) {
      attr.charge(rx, data, this);
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
    add<TInput>(attribute: UcMetaAttr<unknown, TInput>, value: TInput): this;
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
  readonly attrs: Map<unknown, [UcMetaAttr, unknown]>;
  clones: number;
}
