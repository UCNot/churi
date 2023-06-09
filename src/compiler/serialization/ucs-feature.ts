import { UcSchema } from '../../schema/uc-schema.js';
import { UcsCompiler } from './ucs-compiler.js';

/**
 * Deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#serializer schema instructions}
 * or {@link UcsCompiler#enable explicitly}.
 *
 * @typeParam TOptions - Type of feature options.
 */
export type UcsFeature<TOptions = unknown> =
  | UcsFeature.Object<TOptions>
  | UcsFeature.Function<TOptions>;

export namespace UcsFeature {
  /**
   * Serializer feature interface.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export interface Object<in TOptions = unknown> {
    /**
     * Configures serializer compiler during setup.
     *
     * @param compiler - Compiler to configure.
     */
    configureSerializer(compiler: UcsCompiler, options: TOptions): void;
  }

  /**
   * Serializer feature signature.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export type Function<in TOptions = unknown> = UcsFeature.Object<TOptions>['configureSerializer'];
}

/**
 * Schema serializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#serializer schema instructions}.
 *
 * @typeParam TOptions - Type of feature options.
 */
export type UcsSchemaFeature<TOptions = unknown> =
  | UcsSchemaFeature.Object<TOptions>
  | UcsSchemaFeature.Function<TOptions>;

export namespace UcsSchemaFeature {
  /**
   * Schema serializer feature interface.
   *
   * @typeParam TOptions - Type of feature options.
   */
  export interface Object<in TOptions = unknown> {
    /**
     * Configures schema serialization.
     *
     * @param compiler - Serializer compiler to configure.
     * @param schema - Configured schema instance.
     * @param options - Feature options.
     */
    configureSchemaSerializer(compiler: UcsCompiler, schema: UcSchema, options: TOptions): void;
  }

  /**
   * Schema serializer feature signature.
   */
  export type Function<in TOptions = unknown> =
    UcsSchemaFeature.Object<TOptions>['configureSchemaSerializer'];
}
