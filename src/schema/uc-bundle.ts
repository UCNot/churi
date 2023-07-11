/**
 * Creates new bundle with schema processing code.
 *
 * Bundle may include code of several processors (e.g. {@link UcSerializer serializers} and
 * {@link UcDeserializer deserializers}). For that, create the named processors has to be created within `bundle`
 * function.
 *
 * @example
 * ```typescript
 * const { readValue, writeValue } = createUcBundle({
 *   dist: 'my-bundle.js',
 *   bundle() {
 *     return {
 *       readValue: createUcDeserializer(mySchema),
 *       writeValue: createUcSerialize(mySchema),
 *     };
 *   },
 * })
 * ```
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function called is stored as constant(s).
 *
 * @typeParam T - Compiled bundle interface.
 * @param input - Bundle initialization options.
 *
 * @returns New bundle instance.
 */
/*#__NO_SIDE_EFFECTS__*/
export function createUcBundle<T extends Record<string, unknown>>(input: UcBundleInput<T>): T {
  return input.bundle();
}

/**
 * Schema processing bundle input passed to its {@link createUcBundle compiler}.
 *
 * @typeParam T - Compiled bundle interface.
 */
export interface UcBundleInput<T extends Record<string, unknown>> {
  /**
   * Path to distribution file relative to the default one.
   *
   * If unspecified, will be guessed based on package main file and bundle constant name.
   */
  readonly dist?: string | undefined;

  /**
   * Creates bundled schema processors.
   *
   * Schema processors has to be created _inside_ of this function body in order to be bundled.
   *
   * @returns Record of named schema processors.
   */
  bundle(): T;
}
