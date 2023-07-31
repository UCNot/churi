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
  configure(options: TOptions, data: unknown): void;
}
