import { UccConfig } from './ucc-config.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema processing feature. Configures {@link UccProcessor schema processor} during setup.
 *
 * Can be enabled by {@link churi!UcConstraints schema constraints} or {@link UccProcessor#enable explicitly}.
 *
 * @typeParam TProcessor - Supported schema processor type.
 * @typeParam TOptions - Type of schema processing options.
 */
export type UccFeature<TProcessor extends UccProcessor<TProcessor>, TOptions = void> =
  | UccFeature.Object<TProcessor, TOptions>
  | UccFeature.Function<TProcessor, TOptions>;

export namespace UccFeature {
  /**
   * Schema processing feature interface.
   *
   * @typeParam TProcessor - Supported schema processor type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export interface Object<in TProcessor extends UccProcessor<TProcessor>, in TOptions = void> {
    /**
     * Enables this feature in schema `processor` during setup.
     *
     * Called when feature {@link UccProcessor#enable enabled} in processor, at least once per processor.
     *
     * @param processor - Schema processor to enable.
     *
     * @returns Configuration of schema processing.
     */
    uccProcess(processor: TProcessor): UccConfig<TOptions>;
  }

  /**
   * Schema processing feature signature.
   *
   * @typeParam TProcessor - Supported schema processor type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export type Function<
    in TProcessor extends UccProcessor<TProcessor>,
    in TOptions = void,
  > = UccFeature.Object<TProcessor, TOptions>['uccProcess'];
}
