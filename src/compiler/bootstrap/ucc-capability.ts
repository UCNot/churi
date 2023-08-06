import { UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBootstrap } from './ucc-bootstrap.js';
import { UccFeature } from './ucc-feature.js';

/**
 * Schema {@link UccProcessor processing} capability.
 *
 * Called by {@link UccProcessor.Options#capabilities schema processor} to activate the capability.
 *
 * Capabilities used e.g. to refine {@link churi!UcConstraints schema constraints}, or to enable
 * {@link UccFeature processing features}.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 * @param activation - Activation context.
 */
export type UccCapability<in TBoot extends UccBootstrap<TBoot>> = (
  this: void,
  activation: UccCapability.Activation<TBoot>,
) => void;

export namespace UccCapability {
  /**
   * Activation context of {@link UccCapability schema processing capability}.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   */
  export interface Activation<out TBoot extends UccBootstrap<TBoot>> {
    /**
     * Enables the given processing `feature`.
     *
     * @typeParam TOptions - Type of schema processing options.
     * @param feature - Feature to enable.
     * @param options - Processing options.
     *
     * @returns `this` instance.
     */
    enable<TOptions>(feature: UccFeature<TBoot, TOptions>): this;

    /**
     * Registers {@link churi!UcFeatureConstraint schema constraint} application handler.
     *
     * If multiple handlers match the same `criteria`, they all will be applied in order of their registration.
     * Handlers matching any presentation always applied after the ones matching concrete one.
     *
     * @param criterion - Constraint criterion to apply the `handler` to.
     * @param handler - Constraint application handler to call each time the matching constraint is about to be
     * applied.
     */
    onConstraint(criterion: ConstraintCriterion, handler: ConstraintHandler<TBoot>): this;
  }

  /**
   * Schema constraint {@link Activation#onConstraint application} handler.
   *
   * The handler is called each time the matching constraint applied.
   *
   * If the handler neither {@link ConstraintApplication#apply applies}, nor {@link ConstraintApplication#ignore
   * ignores} the constraint, the latter will be applied automatically after the the handler ends its work.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @param application - Constraint application context.
   */
  export type ConstraintHandler<in TBoot extends UccBootstrap<TBoot>> = (
    this: void,
    application: ConstraintApplication<TBoot>,
  ) => void;

  /**
   * Schema constraint criterion.
   */
  export interface ConstraintCriterion {
    /**
     * Target schema processor.
     */
    readonly processor: UcProcessorName;

    /**
     * Target schema instance presentation, or `undefined` to match any presentation.
     */
    readonly within?: UcPresentationName | undefined;

    /**
     * Target {@link churi!UcFeatureConstraint#use feature name} to use.
     */
    readonly use: string;

    /**
     * Target {@link churi!UcFeatureConstraint#from ECMAScript module name} to import the feature from.
     */
    readonly from: string;
  }

  /**
   * Schema constraint application context.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   */
  export interface ConstraintApplication<out TBoot extends UccBootstrap<TBoot>> {
    /**
     * Schema processing bootstrap.
     */
    get boot(): TBoot;

    /**
     * Schema processor name.
     */
    get processor(): UcProcessorName;

    /**
     * Target schema the {@link constraint} is applied to.
     */
    get schema(): UcSchema;

    /**
     * Schema instance presentation the {@link constraint} to be applied within.
     */
    get within(): UcPresentationName | undefined;

    /**
     * Schema constraint about to be applied.
     */
    get constraint(): UcSchemaConstraint;

    /**
     * Informs whether the {@link constraint} is {@link apply applied} already.
     *
     * @returns `true` after {@link apply} method call, or `false` otherwise.
     */
    isApplied(): boolean;

    /**
     * Informs whether the {@link constraint} is {@link ignore ignored}.
     *
     * @returns `true` after {@link ignore} method call, or `false` otherwise or after {@link apply} method call.
     */
    isIgnored(): boolean;

    /**
     * Applies the schema {@link constraint} immediately.
     *
     * Does nothing if the constraint {@link isApplied applied} already.
     *
     * Ignores the {@link ignore} instruction.
     */
    apply(): void;

    /**
     * Ignores the {@link constraint}.
     *
     * Calling this method disables automatic {@link constraint} application.
     *
     * Does nothing if the constraint {@link isApplied applied} already.
     */
    ignore(): void;
  }
}
