import { UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBootstrap } from './ucc-bootstrap.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema processing feature. Configures {@link UccProcessor schema processor} at bootstrap.
 *
 * Can be enabled by {@link churi!UcSchemaConstraint schema constraints} or {@link UccProcessor#enable explicitly}.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 * @typeParam TOptions - Type of schema processing options.
 */
export type UccFeature<TBoot, TOptions = void> =
  | UccFeature.Object<TBoot, TOptions>
  | UccFeature.Function<TBoot, TOptions>;

export namespace UccFeature {
  /**
   * Schema processing feature interface.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @typeParam TOptions - Type of supported schema constraint options.
   */
  export interface Object<in TBoot, in TOptions = void> {
    /**
     * Enables this feature in schema `processor` at bootstrap.
     *
     * Called when feature {@link UccProcessor#enable enabled} in processor, at most once per processor.
     *
     * @param boot - Schema processing bootstrap.
     *
     * @returns Either feature handle when this feature supports schema constraints, or nothing otherwise.
     */
    uccEnable(boot: TBoot): Handle<TOptions> | void;
  }

  /**
   * Schema processing feature signature.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @typeParam TOptions - Type of supported schema constraint options.
   */
  export type Function<in TBoot, in TOptions = void> = UccFeature.Object<
    TBoot,
    TOptions
  >['uccEnable'];

  /**
   * {@link UccFeature Feature} handle returned when the latter enabled.
   *
   * @typeParam TOptions - Type of supported schema constraint options.
   */
  export interface Handle<in TOptions = void> {
    /**
     * Constrains the given schema with the given options.
     *
     * Called each time the supported `constraint` applied to the schema.
     *
     * @param constraint - Information about constraint to apply.
     */
    constrain(constraint: Constraint<TOptions>): void;
  }

  /**
   * Information about {@link constraint} applied to the {@link schema}.
   *
   * @typeParam TOptions - Constraint options type.
   * @typeParam TSchema - Supported schema type.
   */
  export interface Constraint<out TOptions, out TSchema extends UcSchema = UcSchema> {
    /**
     * Name of schema processor that applies the constraint.
     */
    readonly processor: UcProcessorName;

    /**
     * Target schema to constrain.
     */
    readonly schema: TSchema;

    /**
     * Schema instance presentation the {@link constraint} to is applied within.
     */
    readonly within: UcPresentationName | undefined;

    /**
     * The constraint to apply.
     */
    readonly constraint: UcSchemaConstraint;

    /**
     * Constraint options.
     */
    readonly options: TOptions;
  }

  /**
   * Schema constraint {@link UccBootstrap#onConstraint application} handler.
   *
   * The handler is called each time the matching constraint applied.
   *
   * If the handler neither {@link ConstraintApplication#apply applies}, nor {@link ConstraintApplication#ignore
   * ignores} the constraint, the latter will be applied automatically after the the handler ends its work.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @typeParam TOptions - Constraint options type.
   * @param application - Constraint application context.
   */
  export type ConstraintHandler<in TBoot extends UccBootstrap<TBoot>, in TOptions = never> = (
    this: void,
    application: ConstraintApplication<TBoot, TOptions>,
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
     * Target {@link churi!UcSchemaConstraint#use feature name} to use.
     */
    readonly use: string;

    /**
     * Target {@link churi!UcSchemaConstraint#from ECMAScript module name} to import the feature from.
     */
    readonly from: string;
  }

  /**
   * Schema constraint application context.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @typeParam TOptions - Constraint options type.
   */
  export interface ConstraintApplication<out TBoot extends UccBootstrap<TBoot>, out TOptions>
    extends Constraint<TOptions> {
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
