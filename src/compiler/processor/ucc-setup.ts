import { UcModel } from '../../schema/uc-schema.js';
import { UccFeature } from './ucc-feature.js';

/**
 * Schema {@link UccProcessor processing} setup.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TSetup - Schema processing setup type.
 */
export interface UccSetup<in TSetup = unknown> {
  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TSetup, TOptions>, options: TOptions): this;

  /**
   * Enables the given processing `feature` that does not require options.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UccFeature<TSetup, void>): this;

  /**
   * Applies model processing instructions specified as its {@link churi!UcSchema#where constraints}.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this;
}
