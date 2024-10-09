/**
 * Representation bundle of schema processing code.
 *
 * Code processors have to {@link UcDeserializer.Config#bundle refer} the bundle in order to be included.
 *
 * Has to be created by {@link createUcBundle}.
 */
export declare abstract class UcBundle {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  #private;

  readonly config: UcBundleConfig;
}

/**
 * Creates new bundle with schema processing code.
 *
 * Bundle may include code of several schema processors (e.g. {@link UcSerializer serializers} and
 * {@link UcDeserializer deserializers}). For that, the processors has to refer  the bundle.
 *
 * @example
 * ```typescript
 * const myBundle = createUcBundle({ dist: 'my-bundle.js' });
 * const readValue = createUcDeserializer(mySchema, { bundle: myBundle });
 * const writeValue = createUcSerializer(mySchema, { bundle: myBundle });
 * ```
 *
 * **This is a placeholder**. It is not processed in any way at run time. The actual bundle generated when TypeScript
 * code compiled with [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to
 * constant.
 *
 * @param config - Bundle configuration.
 *
 * @returns New bundle representation.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
/*#__NO_SIDE_EFFECTS__*/
export function createUcBundle(config: UcBundleConfig = {}): UcBundle {
  return { config } as UcBundle;
}

/**
 * Schema processing bundle input passed to its {@link createUcBundle compiler}.
 *
 * @typeParam T - Compiled bundle interface.
 */
export interface UcBundleConfig {
  /**
   * Path to distribution file relative to the default one.
   *
   * If unspecified, will be guessed based on package main file and bundle constant name.
   */
  readonly dist?: string | undefined;
}
