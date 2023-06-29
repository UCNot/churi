import { AllUcrx } from '../../rx/all.ucrx.js';
import { uctxValue } from '../../rx/uctx-value.js';
import { UcMeta } from './uc-meta.js';

/**
 * Typed attribute of {@link UcMeta charge metadata}.
 *
 * When used as attribute key, the methods of attribute applied to {@link store} and {@link extract} attribute value(s).
 *
 * @typeParam T - Attribute value type.
 * @typeParam TInput - Attribute input type.
 *
 * Accepted when attribute value {@link UcMeta#add added} to metadata.
 *
 * May differ from actual attribute value type.
 * @typeParam TData - Stored data type.
 *
 * Declares what actually stored inside metadata.
 */
export abstract class UcMetaAttr<out T = unknown, in TInput = unknown, out TData = unknown> {

  readonly #name: string;
  readonly #uid: unknown;

  /**
   * Constructs attribute.
   *
   * @param name - Attribute name.
   * @param uid - Unique attribute identifier. `this` by default.
   */
  constructor(name: string, uid?: unknown) {
    this.#name = name;
    this.#uid = uid ?? this;
  }

  /**
   * Attribute name.
   */
  get name(): string {
    return this.#name;
  }

  /**
   * Unique attribute identifier.
   *
   * Different attributes with the same identifier share the same value.
   */
  get uid(): unknown {
    return this.#uid;
  }

  /**
   * Extracts attribute value from metadata.
   *
   * @param data - Stored attribute data or `undefined` if nothing stored.
   * @param meta - Source metadata to extract the value from.
   *
   * @returns Either extracted attribute value, or `undefined` if nothing extracted.
   */
  abstract extract(data: TData | undefined, meta: UcMeta): T | undefined;

  /**
   * Extracts all attribute values.
   *
   * @param data - Stored attribute data or `undefined` if nothing stored.
   * @param meta - Source metadata to extract values from.
   *
   * @returns Either array of extracted attribute values, or empty array if nothing extracted.
   */
  abstract extractAll(data: TData | undefined, meta: UcMeta): T[];

  /**
   * Stores attribute `value` to metadata.
   *
   * @param data - Already stored attribute data or `undefined` if nothing stored yet.
   * @param value - The input value to store.
   * @param meta - Target metadata to store the value in.
   *
   * @returns Value to store.
   */
  abstract store(data: TData | undefined, value: TInput, meta: UcMeta): TData;

  /**
   * Clones attribute data.
   *
   * Called when metadata actually {@link UcMeta#cloned cloned}. This happens when one of the clones modified.
   *
   * @param data - Data to clone.
   *
   * @returns Cloned data.
   */
  abstract clone(data: TData): TData;

  /**
   * Merges two attribute data instances.
   *
   * Called when metadata instances {@link UcMeta#mergeAll merged}.
   *
   * @param first - First attribute data instance to merge.
   * @param second - Second attribute data instance to merge.
   *
   * @returns Merged attribute data.
   */
  abstract merge(first: TData, second: TData): TData;

  /**
   * Represents this attribute as charge and transfers it to the given charge receiver.
   *
   * Called by {@link UcMeta#toUC} method when attribute is present within.
   *
   * @param rx - Charge receiver.
   * @param data - Stored attribute data.
   * @param meta - Source metadata.
   */
  charge(rx: AllUcrx, data: TData, meta: UcMeta): void {
    for (const value of this.extractAll(data, meta)) {
      const attrRx = rx.att(this.name);

      if (attrRx) {
        uctxValue(attrRx, value);
        attrRx.end();
      }
    }
  }

}
