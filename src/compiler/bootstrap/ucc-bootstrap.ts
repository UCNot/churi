import { UcFeatureConstraint, UcProcessorName } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from './ucc-feature.js';

/**
 * Schema {@link UccProcessor processing} bootstrap.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 */
export interface UccBootstrap<in TBoot = unknown> {
  /**
   * Currently working schema processor name.
   */
  get currentProcessor(): UcProcessorName | undefined;

  /**
   * Currently processed schema, if any
   */
  get currentSchema(): UcSchema | undefined;

  /**
   * Current presentation name, if any.
   */
  get currentPresentation(): UcPresentationName | undefined;

  /**
   * Currently processed schema constraint, if any
   */
  get currentConstraint(): UcFeatureConstraint | undefined;

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TBoot, TOptions>, options: TOptions): this;

  /**
   * Enables the given processing `feature` that does not require options.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UccFeature<TBoot, void>, options?: void): this;

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
