import { UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from './ucc-feature.js';
import { UccSchemaIndex } from './ucc-schema-index.js';

/**
 * Schema {@link UccProcessor processing} bootstrap.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 */
export interface UccBootstrap<in out TBoot extends UccBootstrap<TBoot>> {
  /**
   * Schema index used to uniquely identify schemas.
   */
  get schemaIndex(): UccSchemaIndex;

  /**
   * Currently working schema processor name.
   */
  get currentProcessor(): UcProcessorName | undefined;

  /**
   * Currently processed schema entry. This may be e.g. a serializer or deserializer name.
   *
   * `undefined` when processing nested schema. This happens e.g. when model processed
   * {@link UccBootstrap#processModel explicitly} rather automatically.
   */
  get currentEntry(): string | undefined;

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
  get currentConstraint(): UcSchemaConstraint | undefined;

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TBoot, TOptions>): this;

  /**
   * Applies model processing instructions specified as its {@link churi!UcSchema#where constraints}.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this;

  /**
   * Registers {@link churi!UcSchemaConstraint schema constraint} application handler.
   *
   * If multiple handlers match the same `criteria`, they all will be applied in order of their registration.
   * Handlers matching any presentation always applied after the ones matching concrete one.
   *
   * @typeParam TOptions - Constraint options type.
   * @param criterion - Constraint criterion to apply the `handler` to.
   * @param handler - Constraint application handler to call each time the matching constraint is about to be
   * applied.
   */
  onConstraint<TOptions>(
    criterion: UccFeature.ConstraintCriterion,
    handler: UccFeature.ConstraintHandler<TBoot, TOptions>,
  ): this;
}
