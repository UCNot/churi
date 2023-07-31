import { UcSchema } from '../../schema/uc-schema.js';

/**
 * Schema processing configuration.
 *
 * Created by schema processing feature. Used to {@link configure} schema processing.
 *
 * @typeParam TOptions - Type of schema processing options.
 */
export interface UccConfig<in TOptions = void> {
  /**
   * Configures schema processing.
   *
   * May be called multiple times.
   *
   * @param options - Configuration options.
   * @param data - Custom data passed by parent schema processor. `undefined` for top-level schemas.
   */
  configure?(options: TOptions, data: UccConfig.Data): void;

  /**
   * Configures processing of concrete `schema`.
   *
   * May be called multiple times.
   *
   * @param schema - Schema which processing
   * @param options - Configuration options.
   * @param data - Custom data passed by parent schema processor. `undefined` for top-level schemas.
   */
  configureSchema?(schema: UcSchema, options: TOptions, data: UccConfig.Data): void;
}

export namespace UccConfig {
  /**
   * Custom data to pass to feature configurations.
   */
  export type Data = { readonly [key in PropertyKey]: unknown };
}
