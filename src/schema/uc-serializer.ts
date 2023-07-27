import { UcBundle } from './uc-bundle.js';
import { ucModelName } from './uc-model-name.js';
import { UcFormatName } from './uc-presentations.js';
import { UcModel } from './uc-schema.js';

/**
 * Data serializer signature.
 *
 * Writes the given data `value` to the given `stream`.
 *
 * Serializers generated by {@link churi/compiler.js!UcsLib compiler}.
 *
 * @typeParam T - Serialized data type.
 * @param stream - Writable stream to serialize the data to.
 * @param value - Data value to serialize.
 * @param options - Serialization options.
 *
 * @returns Promise resolved when data serialized.
 */
export type UcSerializer<in T> = (
  stream: WritableStream<Uint8Array>,
  value: T,
  options?: UcSerializer.Options,
) => Promise<void>;

export namespace UcSerializer {
  /**
   * Data serialization options passed to {@link churi!UcSerializer serializer}.
   */
  export interface Options {
    /**
     * Custom serialization data.
     *
     * This data can be used by serializers.
     */
    readonly data?: Record<PropertyKey, unknown> | undefined;
  }

  /**
   * {@link UcSerializer Serializer} {@link createUcSerializer compiler} configuration.
   */
  export interface Config {
    /**
     * Target bundle the compiled serializer will be included into.
     *
     * Default bundle will be used when omitted.
     */
    readonly bundle?: UcBundle | undefined;

    /**
     * Name of serialization format.
     *
     * @defaultValue `'charge'`
     */
    readonly to?: UcFormatName | undefined;
  }
}

/**
 * Compiles serializer for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual serializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Serialized data type.
 * @param model - Serialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Serializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcSerializer<T>(
  model: UcModel<T>,
  config?: UcSerializer.Config,
): UcSerializer<T>;

/*#__NO_SIDE_EFFECTS__*/
export function createUcSerializer<T>(
  model: UcModel<T>,
  _config?: UcSerializer.Config,
): UcSerializer<T> {
  return () => {
    throw new TypeError(
      `Can not serialize ${ucModelName(model)}. Is "ts-transformer-churi" applied?`,
    );
  };
}
