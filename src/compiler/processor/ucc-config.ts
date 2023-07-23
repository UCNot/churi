import { UcPresentationName } from '../../schema/uc-presentations.js';

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
   * @param context - Configuration context.
   */
  configure(options: TOptions, context: UccConfigContext): void;
}

/**
 * Schema processing configuration context.
 */
export interface UccConfigContext {
  /**
   * Presentation name the feature is applied in.
   */
  readonly within?: UcPresentationName | undefined;
}
