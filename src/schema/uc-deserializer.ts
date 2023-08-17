import { EntityUcrx } from '../rx/entity.ucrx.js';
import { FormatUcrx } from '../rx/format.ucrx.js';
import { MetaUcrx } from '../rx/meta.ucrx.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcBundle } from './uc-bundle.js';
import { UcErrorInfo } from './uc-error.js';
import { ucModelName } from './uc-model-name.js';
import { UcModel } from './uc-schema.js';

/**
 * Data deserializer.
 *
 * Reads the data value from the given input. Deserializer may be either synchronous or asynchronous depending
 * on input type.
 *
 * @typeParam T - Deserialized data type.
 */
export interface UcDeserializer<out T, in TInput = string> {
  /**
   * Brand property not supposed to be declared.
   */
  __UcDeserializerByTokens__: false;

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
   * Scans input `stream` for tokens and reads the encoded data.
   *
   * @param stream - Input stream to read the data from.
   * @param options - Deserialization options.
   *
   * @returns Promise resolved to deserialized data value.
   */
  (stream: ReadableStream<string>, options?: UcDeserializer.Options): Promise<T>;
}

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
   * Token deserializer.
   *
   * Reads the data value from input tokens. Deserializer may be either synchronous or asynchronous depending
   * on input type.
   *
   * @typeParam T - Deserialized data type.
   */
  export interface ByTokens<out T> {
    /**
     * Brand property not supposed to be declared.
     */
    __UcDeserializerByTokens__: true;

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
     * Reads the data _asynchronously_ from the given readable `stream` of tokens.
     *
     * @param stream - Input stream to read the data from.
     * @param options - Deserialization options.
     *
     * @returns Promise resolved to deserialized data value.
     */
    (stream: ReadableStream<UcToken>, options?: UcDeserializer.Options): Promise<T>;
  }

  /**
   * Asynchronous deserializer.
   *
   * @typeParam T - Deserialized data type.
   */
  export interface Async<out T> {
    /**
     * Brand property not supposed to be declared.
     */
    __UcDeserializerByTokens__: false;

    /**
     * Reads the data _asynchronously_ from the given readable `stream`.
     *
     * Scans input `stream` for tokens and reads the encoded data.
     *
     * @param stream - Input stream to read the data from.
     * @param options - Deserialization options.
     *
     * @returns Promise resolved to deserialized data value.
     */
    (stream: ReadableStream<string>, options?: UcDeserializer.Options): Promise<T>;
  }

  /**
   * Asynchronous deserializer by tokens.
   *
   * Reads data encoded as input `stream` of tokens.
   *
   * @typeParam T - Deserialized data type.
   */
  export interface AsyncByTokens<out T> {
    /**
     * Brand property not supposed to be declared.
     */
    __UcDeserializerByTokens__: true;

    /**
     * Reads the data _asynchronously_ from the given readable `stream` of tokens.
     *
     * @param stream - Input stream to read the data from.
     * @param options - Deserialization options.
     *
     * @returns Promise resolved to deserialized data value.
     */
    (stream: ReadableStream<UcToken>, options?: UcDeserializer.Options): Promise<T>;
  }

  /**
   * Synchronous data deserializer.
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
     * Custom deserialization data.
     *
     * This data can be used by deserializers and handlers.
     */
    readonly data?: Record<PropertyKey, unknown> | undefined;

    /**
     * Function to call to report deserialization error.
     *
     * By default, throws an {@link churi!UcError} with the given `error` info.
     *
     * @param error - Error info.
     */
    readonly onError?: ((this: void, error: UcErrorInfo) => void) | undefined;

    /**
     * Map of recognized {@link churi!EntityUcrx entity} receivers.
     *
     * By default, entities will be deserialized by {@link churi/compiler.js!UcdCompiler#handleEntity compiler}.
     */
    readonly entities?: { readonly [entity: string]: EntityUcrx | undefined } | undefined;

    /**
     * Map of recognized {@link churi!FormatUcrx formatted data} receivers.
     *
     * By default, formatted data will be deserialized by {@link churi/compiler.js!UcdCompiler#handleFormat compiler}.
     */
    readonly formats?: { readonly [entity: string]: FormatUcrx | undefined } | undefined;

    /**
     * Function to call to deserialize metadata attribute.
     *
     * By default, metadata attribute value will be deserialized as {@link churi!ucUnknown unknown}.
     */
    readonly onMeta?: MetaUcrx;
  }

  export interface BaseConfig {
    /**
     * Target bundle the compiled deserializer will be included into.
     *
     * Default bundle will be used when omitted.
     */
    readonly bundle?: UcBundle | undefined;
  }

  /**
   * {@link UcDeserializer Universal} deserializer {@link createUcDeserializer compiler} configuration.
   */
  export interface Config extends BaseConfig {
    readonly mode?: 'universal' | undefined;

    /**
     * Whether the deserializer expects tokens as input.
     */
    readonly byTokens?: false | undefined;
  }

  /**
   * {@link UcDeserializer.ByTokens By-tokens} deserializer {@link createUcDeserializer compiler} configuration.
   */
  export interface ByTokensConfig extends BaseConfig {
    readonly mode?: 'universal' | undefined;

    readonly byTokens: true;
  }

  /**
   * {@link Sync Synchronous} deserializer {@link createUcDeserializer compiler} configuration.
   */
  export interface SyncConfig extends BaseConfig {
    readonly mode: 'sync';
  }

  /**
   * {@link Async Asynchronous} deserializer {@link createUcDeserializer compiler} configuration.
   */
  export interface AsyncConfig extends BaseConfig {
    readonly mode: 'async';

    readonly byTokens?: false | undefined;
  }

  /**
   * {@link Async Asynchronous} by-tokens deserializer {@link createUcDeserializer compiler} configuration.
   */
  export interface AsyncByTokensConfig extends BaseConfig {
    readonly mode: 'async';

    readonly byTokens: true;
  }
}

/**
 * Compiles {@link UcDeserializer deserializer} for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Universal deserializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcDeserializer<T>(
  model: UcModel<T>,
  config?: UcDeserializer.Config,
): UcDeserializer<T>;

/**
 * Compiles {@link UcDeserializer.ByTokens by-tokens deserializer} for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Universal deserializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcDeserializer<T>(
  model: UcModel<T>,
  config?: UcDeserializer.ByTokensConfig,
): UcDeserializer.ByTokens<T>;

/**
 * Compiles {@link UcDeserializer.Sync synchronous deserializer} for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Synchronous deserializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcDeserializer<T>(
  model: UcModel<T>,
  config: UcDeserializer.SyncConfig,
): UcDeserializer.Sync<T>;

/**
 * Compiles {@link UcDeserializer.Async asynchronous deserializer} for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Asynchronous deserializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcDeserializer<T>(
  model: UcModel<T>,
  config: UcDeserializer.AsyncConfig,
): UcDeserializer.Async<T>;

/**
 * Compiles {@link UcDeserializer.Async by-tokens asynchronous deserializer} for the given data `model`.
 *
 * **This is a placeholder**. It is replaced with actual deserializer when TypeScript code compiled with
 * [ts-transformer-churi] enabled. It is expected that the result of this function call is stored to constant.
 *
 * @typeParam T - Deserialized data type.
 * @param model - Deserialized data model.
 * @param config - Compiler configuration.
 *
 * @returns Asynchronous deserializer instance.
 *
 * [ts-transformer-churi]: https://www.npmjs.com/package/ts-transformer-churi
 */
export function createUcDeserializer<T>(
  model: UcModel<T>,
  config: UcDeserializer.AsyncByTokensConfig,
): UcDeserializer.AsyncByTokens<T>;

export function createUcDeserializer<T>(
  model: UcModel<T>,
  _init?:
    | UcDeserializer.Config
    | UcDeserializer.ByTokensConfig
    | UcDeserializer.SyncConfig
    | UcDeserializer.AsyncConfig
    | UcDeserializer.AsyncByTokensConfig,
):
  | UcDeserializer.Sync<T>
  | UcDeserializer.Async<T>
  | UcDeserializer.ByTokens<T>
  | UcDeserializer.AsyncByTokens<T> {
  return (() => {
    throw new TypeError(
      `Can not deserialize ${ucModelName(model)}. Is "ts-transformer-churi" applied?`,
    );
  }) as unknown as UcDeserializer<T> | UcDeserializer.ByTokens<T>;
}
