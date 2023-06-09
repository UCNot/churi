import { EntityUcrx } from '../rx/entity.ucrx.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcErrorInfo } from './uc-error.js';
import { ucModelName } from './uc-model-name.js';
import { UcModel } from './uc-schema.js';

/**
 * Data deserializer signature.
 *
 * Reads the data value from the given input. Deserializer may be either synchronous or asynchronous depending
 * on input type.
 *
 * Serializers generated by {@link churi/compiler.js!UcdLib compiler}.
 *
 * @typeParam T - Deserialized data type.
 */
export type UcDeserializer<out T> = {
  /**
   * Reads the data _synchronously_ from the given string or array of {@link UcToken tokens}.
   *
   * @param input - Either input string or array of tokens to parse.
   * @param options - Deserialization options.
   *
   * @returns Deserialized data value.
   */
  (input: string | readonly UcToken[], options?: UcDeserializer.Options): T;

  /**
   * Reads the data _asynchronously_ from the given readable `stream`.
   *
   * @param stream - Input stream to read the data from.
   * @param options - Deserialization options.
   *
   * @returns Promise resolved to deserialized data value.
   */
  (stream: ReadableStream<UcToken>, options?: UcDeserializer.Options): Promise<T>;
};

export namespace UcDeserializer {
  /**
   * Data deserialization mode.
   *
   * Passed to {@link churi/compiler.js!UcdLib compiler} to a kind of deserializers to generate.
   *
   * Can be one of:
   *
   * - `sync` - to generate only {@link Sync synchronous} deserializers.
   * - `async` - to generate only {@link Async asynchronous} deserializers.
   * - `universal` (the default) - to generate {@link UcDeserializer universal} deserializers that support any kind of
   *   input.
   */
  export type Mode = 'sync' | 'async' | 'universal';

  /**
   * Asynchronous data deserializer signature.
   *
   * Reads the data from stream.
   *
   * Serializers of this kind generated by {@link churi/compiler.js!UcdLib compiler} in `async`
   * deserialization {@link Mode mode}.
   *
   * @typeParam T - Deserialized data type.
   * @param stream - Input stream to read the data from.
   * @param options - Deserialization options.
   *
   * @returns Promise resolved to deserialized data value.
   */
  export type Async<out T> = (
    stream: ReadableStream<UcToken>,
    options?: UcDeserializer.Options,
  ) => Promise<T>;

  /**
   * Synchronous data deserializer signature.
   *
   * Reads the data from `input` string or array of {@link UcToken tokens}.
   *
   * @typeParam T - Deserialized data type.
   * @param input - Either input string or array of tokens to parse.
   * @param options - Deserialization options.
   *
   * @returns Deserialized data value.
   */
  export type Sync<out T> = (input: string | readonly UcToken[], options?: Options) => T;

  /**
   * Data deserialization options passed to {@link churi!UcDeserializer deserializer}.
   */
  export interface Options {
    /**
     * Function to call to report deserialization error.
     *
     * By default, throw an {@link churi!UcError} with the given `error` info.
     *
     * @param error - Error info.
     */
    readonly onError?: ((this: void, error: UcErrorInfo) => void) | undefined;

    /**
     * Function to call to deserialize entities.
     *
     * By default, entities will be deserialized by {@link churi/compiler.js!UcdCompiler#handleEntity compiler}.
     */
    readonly onEntity?: EntityUcrx | undefined;
  }
}

/**
 * Creates deserializer for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript compiled with
 * [ts-transformer-churi] enabled.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 *
 * @returns Deserializer instance.
 */
export function createUcDeserializer<T>(model: UcModel<T>): UcDeserializer<T> {
  return () => {
    throw new TypeError(
      `Can not deserialize ${ucModelName(model)}. Is "ts-transformer-churi" applied?`,
    );
  };
}
