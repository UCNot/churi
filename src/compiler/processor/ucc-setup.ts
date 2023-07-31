import { UcFeatureConstraint, UcProcessorName } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from './ucc-config.js';
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
   * @param data - Custom data to pass to {@link UccConfig#configure schema processing configuration}.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(
    feature: UccFeature<TSetup, TOptions>,
    options: TOptions,
    data?: UccConfig.Data,
  ): this;

  /**
   * Enables the given processing `feature` that does not require options.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param data - Custom data to pass to {@link UccConfig#configure schema processing configuration}.
   *
   * @returns `this` instance.
   */
  enable(feature: UccFeature<TSetup, void>, options?: void, data?: UccConfig.Data): this;

  /**
   * Applies model processing instructions specified as its {@link churi!UcSchema#where constraints}.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   * @param data - Custom data to pass to {@link UccConfig#configure schema processing configuration}.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>, data?: UccConfig.Data): this;
}
