import { UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema processing feature. Configures {@link UccProcessor schema processor} at bootstrap.
 *
 * Can be enabled by {@link churi!UcFeatureConstraint schema constraints} or {@link UccProcessor#enable explicitly}.
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
   * {@link Feature} handle returned when the latter enabled.
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
}
