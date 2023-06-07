import { UcSchema } from '../../schema/uc-schema.js';
import { UcdCompiler } from './ucd-compiler.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer compiler during setup.
 *
 * May be enabled by {@link churi!UcInstructions#deserializer schema instructions} or {@link UcdCompiler#enable
 * explicitly}.
 */
export type UcdFeature = UcdFeature.Object | UcdFeature.Function;

export namespace UcdFeature {
  /**
   * Deserializer feature interface.
   */
  export interface Object {
    /**
     * Configures deserializer compiler during setup.
     *
     * @param compiler - Deserializer compiler to configure.
     */
    configureDeserializer(compiler: UcdCompiler.Any): void;
  }

  /**
   * Deserializer feature signature.
   */
  export type Function = UcdFeature.Object['configureDeserializer'];
}

/**
 * Schema deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#deserializer schema instructions}.
 */
export type UcdSchemaFeature = UcdSchemaFeature.Object | UcdSchemaFeature.Function;

export namespace UcdSchemaFeature {
  /**
   * Schema deserializer feature interface.
   */
  export interface Object {
    /**
     * Configures schema serialization.
     *
     * @param compiler - Deserializer compiler to configure.
     * @param schema - Configured schema instance.
     */
    configureSchemaDeserializer(compiler: UcdCompiler.Any, schema: UcSchema): void;
  }

  /**
   * Schema deserializer function signature.
   */
  export type Function = UcdSchemaFeature.Object['configureSchemaDeserializer'];
}
