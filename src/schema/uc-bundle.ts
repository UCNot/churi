import { EsGenerationOptions } from 'esgen';

/**
 * Declaration of bundle containing compiled schema processing code.
 *
 * Bundle may include code of several processors (e.g. {@link UcSerializer serializers} and
 * {@link UcDeserializer deserializers}). To make this possible, different processors have to
 * {@link UcDeserializer.Init#bundle refer} the same bundle.
 *
 * A bundle _has to be created_ by {@link createUcBundle} function call and stored as top-level module constant.
 *
 * **This is a placeholder**. The actual bundle is generated when TypeScript compiled with
 * [ts-transformer-churi] enabled.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export interface UcBundle {
  readonly _brand: unique symbol;

  /**
   * Path to distribution file relative to the module containing the{@link createUcBundle call}.
   *
   * If unspecified, will be guessed based on package main file and bundle constant name.
   */
  readonly dist?: string | undefined;

  /**
   * Custom data passed to all schema processors within the bundle.
   */
  readonly data?: Record<PropertyKey, unknown> | undefined;

  /**
   * Bundle code generation options.
   */
  readonly generate?: EsGenerationOptions | undefined;
}

/**
 * Creates new {@link UcBundle bundle declaration}.
 *
 * @param options - Bundle options.
 *
 * @returns New bundle declaration.
 */
/*#__NO_SIDE_EFFECTS__*/
export function createUcBundle(options: Omit<UcBundle, '_brand'>): UcBundle {
  return options as UcBundle;
}
