import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from './ucc-config.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema-specific processing feature.
 *
 * Can be enabled by {@link churi!UcInstructions schema instructions}.
 *
 * @typeParam TProcessor - Supported schema processor type.
 * @typeParam TOptions - Type of schema processing options.
 */
export type UccSchemaFeature<TProcessor extends UccProcessor<TProcessor>, TOptions = unknown> =
  | UccSchemaFeature.Object<TProcessor, TOptions>
  | UccSchemaFeature.Function<TProcessor, TOptions>;

export namespace UccSchemaFeature {
  /**
   * Schema-specific processing feature interface.
   *
   * @typeParam TProcessor - Supported schema processor type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export interface Object<in TProcessor extends UccProcessor<TProcessor>, in TOptions = unknown> {
    /**
     * Enables particular `schema` processing.
     *
     * Called when feature enabled in processor, at least once per schema per processor.
     *
     * @param processor - Schema processor to enable processing in.
     * @param schema - Schema to process.
     *
     * @returns Configuration of schema processing.
     */
    uccProcessSchema(processor: TProcessor, schema: UcSchema): UccConfig<TOptions>;
  }

  /**
   * Schema-specific processing feature signature.
   *
   * @typeParam TProcessor - Supported schema processor type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export type Function<
    TProcessor extends UccProcessor<TProcessor>,
    TOptions = unknown,
  > = UccSchemaFeature.Object<TProcessor, TOptions>['uccProcessSchema'];
}
