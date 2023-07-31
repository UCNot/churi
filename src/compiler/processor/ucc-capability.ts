import { UcFeatureConstraint, UcProcessorName } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from './ucc-feature.js';
import { UccSetup } from './ucc-setup.js';

/**
 * Schema {@link UccProcessor processing} capability.
 *
 * Called by {@link UccProcessor.Options#capabilities schema processor} to activate the capability.
 *
 * Capabilities used e.g. to refine {@link churi!UcConstraints schema constraints}, or to enable
 * {@link UccFeature processing features}.
 *
 * @typeParam TSetup - Type of schema processing setup.
 * @param activation - Activation context.
 */
export type UccCapability<in TSetup extends UccSetup<TSetup>> = (
  this: void,
  activation: UccCapability.Activation<TSetup>,
) => void;

export namespace UccCapability {
  /**
   * Activation context of {@link UccCapability schema processing capability}.
   *
   * @typeParam TSetup - Type of schema processing setup.
   */
  export interface Activation<out TSetup extends UccSetup<TSetup>> {
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
     * Registers {@link churi!UcFeatureConstraint schema constraint} application handler.
     *
     * If multiple handlers match the same `criteria`, they all will be applied in order of their registration.
     * Handlers matching any presentation always applied after the ones matching concrete one.
     *
     * @param criterion - Constraint criterion to apply the `handler` to.
     * @param handler - Constraint application handler to call each time the matching constraint is about to be
     * applied.
     */
    onConstraint(criterion: ConstraintCriterion, handler: ConstraintHandler<TSetup>): this;
  }

  /**
   * Schema constraint {@link Activation#onConstraint application} handler.
   *
   * The handler is called each time the matching constraint applied.
   *
   * If the handler neither {@link ConstraintApplication#apply applies}, nor {@link ConstraintApplication#ignore
   * ignores} the constraint, the latter will be applied automatically after the the handler ends its work.
   *
   * @typeParam TSetup - Type of schema processing setup.
   * @param application - Constraint application context.
   *
   * @returns Either none if constraint application handled immediately, or promise-like instance resolved when
   * constraint application handle asynchronously.
   */
  export type ConstraintHandler<in TSetup extends UccSetup<TSetup>> = (
    this: void,
    application: ConstraintApplication<TSetup>,
  ) => void | PromiseLike<void>;

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
   * @typeParam TSetup - Type of schema processing setup.
   */
  export interface ConstraintApplication<out TSetup extends UccSetup<TSetup>> {
    /**
     * Schema processing setup.
     */
    get setup(): TSetup;

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
    get constraint(): UcFeatureConstraint;

    /**
     * Custom data passed by parent schema processor.
     */
    get data(): unknown;

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
    apply(): Promise<void>;

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
