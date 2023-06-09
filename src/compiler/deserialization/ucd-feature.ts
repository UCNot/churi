import { UcSchema } from '../../schema/uc-schema.js';
import { UcdCompiler } from './ucd-compiler.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer compiler during setup.
 *
 * May be enabled by {@link churi!UcInstructions#deserializer schema instructions} or {@link UcdCompiler#enable
 * explicitly}.
 *
 * @typeParam TOptions - Type of feature options.
 */
export type UcdFeature<TOptions = unknown> =
  | UcdFeature.Object<TOptions>
  | UcdFeature.Function<TOptions>;

export namespace UcdFeature {
  /**
   * Deserializer feature interface.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export interface Object<in TOptions = unknown> {
    /**
     * Configures deserializer compiler during setup.
     *
     * @param compiler - Deserializer compiler to configure.
     * @param options - Feature options.
     */
    configureDeserializer(compiler: UcdCompiler.Any, options: TOptions): void;
  }

  /**
   * Deserializer feature signature.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export type Function<in TOptions = unknown> =
    UcdFeature.Object<TOptions>['configureDeserializer'];
}

/**
 * Schema deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#deserializer schema instructions}.
 *
 * @typeParam TOptions - Type of feature options.
 */
export type UcdSchemaFeature<TOptions = unknown> =
  | UcdSchemaFeature.Object<TOptions>
  | UcdSchemaFeature.Function<TOptions>;

export namespace UcdSchemaFeature {
  /**
   * Schema deserializer feature interface.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export interface Object<in TOptions = unknown> {
    /**
     * Configures schema serialization.
     *
     * @param compiler - Deserializer compiler to configure.
     * @param schema - Configured schema instance.
     * @param options - Feature options.
     */
    configureSchemaDeserializer(
      compiler: UcdCompiler.Any,
      schema: UcSchema,
      options: TOptions,
    ): void;
  }

  /**
   * Schema deserializer function signature.
   */
  export type Function<in TOptions = unknown> =
    UcdSchemaFeature.Object<TOptions>['configureSchemaDeserializer'];
}
