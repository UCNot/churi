import { UccConfig } from './ucc-config.js';
import { UccProcessor } from './ucc-processor.js';

/**
 * Schema processing feature. Configures {@link UccProcessor schema processor} at bootstrap.
 *
 * Can be enabled by {@link churi!UcConstraints schema constraints} or {@link UccProcessor#enable explicitly}.
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
   * @typeParam TOptions - Type of schema processing options.
   */
  export interface Object<in TBoot, in TOptions = void> {
    /**
     * Enables this feature in schema `processor` at bootstrap.
     *
     * Called when feature {@link UccProcessor#enable enabled} in processor, at most once per processor.
     *
     * @param boot - Schema processing bootstrap.
     *
     * @returns Configuration of schema processing.
     */
    uccProcess(boot: TBoot): UccConfig<TOptions>;
  }

  /**
   * Schema processing feature signature.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   * @typeParam TOptions - Type of schema processing options.
   */
  export type Function<in TBoot, in TOptions = void> = UccFeature.Object<
    TBoot,
    TOptions
  >['uccProcess'];
}
