import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from './ucc-config.js';
import { UccSetup } from './ucc-setup.js';

/**
 * Schema-specific processing feature.
 *
 * Can be enabled by {@link churi!UcConstraints schema constraints}.
 *
 * @typeParam TSetup - Schema processing setup type.
 * @typeParam TOptions - Type of schema processing options.
 */
export type UccSchemaFeature<TSetup extends UccSetup<TSetup>, TOptions = unknown> =
  | UccSchemaFeature.Object<TSetup, TOptions>
  | UccSchemaFeature.Function<TSetup, TOptions>;

export namespace UccSchemaFeature {
  /**
   * Schema-specific processing feature interface.
   *
   * @typeParam TSetup - Schema processing setup type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export interface Object<in TSetup extends UccSetup<TSetup>, in TOptions = unknown> {
    /**
     * Enables particular `schema` processing.
     *
     * Called when feature enabled in processor, at most once per schema per processor.
     *
     * @param setup - Target schema processing setup.
     * @param schema - Schema to process.
     *
     * @returns Configuration of schema processing.
     */
    uccProcessSchema(setup: TSetup, schema: UcSchema): UccConfig<TOptions>;
  }

  /**
   * Schema-specific processing feature signature.
   *
   * @typeParam TSetup - Schema processing setup type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export type Function<
    TSetup extends UccSetup<TSetup>,
    TOptions = unknown,
  > = UccSchemaFeature.Object<TSetup, TOptions>['uccProcessSchema'];
}
