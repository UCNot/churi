import { UccConfig } from './ucc-config.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema processing feature. Configures {@link UccProcessor schema processor} during setup.
 *
 * Can be enabled by {@link churi!UcConstraints schema constraints} or {@link UccProcessor#enable explicitly}.
 *
 * @typeParam TSetup - Schema processing setup type.
 * @typeParam TOptions - Type of schema processing options.
 */
export type UccFeature<TSetup, TOptions = void> =
  | UccFeature.Object<TSetup, TOptions>
  | UccFeature.Function<TSetup, TOptions>;

export namespace UccFeature {
  /**
   * Schema processing feature interface.
   *
   * @typeParam TSetup - Schema processing setup type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export interface Object<in TSetup, in TOptions = void> {
    /**
     * Enables this feature in schema `processor` during setup.
     *
     * Called when feature {@link UccProcessor#enable enabled} in processor, at most once per processor.
     *
     * @param setup - Schema processing setup.
     *
     * @returns Configuration of schema processing.
     */
    uccProcess(setup: TSetup): UccConfig<TOptions>;
  }

  /**
   * Schema processing feature signature.
   *
   * @typeParam TSetup - Schema processing setup type.
   * @typeParam TOptions - Type of schema processing options.
   */
  export type Function<in TSetup, in TOptions = void> = UccFeature.Object<
    TSetup,
    TOptions
  >['uccProcess'];
}
