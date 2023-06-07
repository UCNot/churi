import { UcSchema } from '../../schema/uc-schema.js';
import { UcsCompiler } from './ucs-compiler.js';

/**
 * Deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#serializer schema instructions}
 * or {@link UcsCompiler#enable explicitly}.
 */
export type UcsFeature = UcsFeature.Object | UcsFeature.Function;

export namespace UcsFeature {
  /**
   * Serializer feature interface.
   */
  export interface Object {
    /**
     * Configures serializer compiler during setup.
     *
     * @param compiler - Compiler to configure.
     */
    configureSerializer(compiler: UcsCompiler): void;
  }

  /**
   * Serializer feature signature.
   */
  export type Function = UcsFeature.Object['configureSerializer'];
}

/**
 * Schema serializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#serializer schema instructions}.
 */
export type UcsSchemaFeature = UcsSchemaFeature.Object | UcsSchemaFeature.Function;

export namespace UcsSchemaFeature {
  /**
   * Schema serializer feature interface.
   */
  export interface Object {
    /**
     * Configures schema serialization.
     *
     * @param compiler - Serializer compiler to configure.
     * @param schema - Configured schema instance.
     */
    configureSchemaSerializer(compiler: UcsCompiler, schema: UcSchema): void;
  }

  /**
   * Schema serializer feature signature.
   */
  export type Function = UcsSchemaFeature.Object['configureSchemaSerializer'];
}
