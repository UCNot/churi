import { UcSchema } from '../../schema/uc-schema.js';
import { UcdSetup } from './ucd-setup.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer during setup.
 *
 * May be enabled by {@link churi!UcInstructions#deserializer schema instructions} or {@link UcdSetup#enable
 * explicitly}.
 */
export type UcdFeature = UcdFeature.Object | UcdFeature.Function;

export namespace UcdFeature {
  /**
   * Deserializer feature interface.
   */
  export interface Object {
    /**
     * Configures deserializer during setup.
     *
     * @param setup - Deserializer setup.
     */
    configureDeserializer(setup: UcdSetup.Any): void;
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
     * Configures schema deserialization during setup.
     *
     * @param setup - Deserializer setup.
     * @param schema - Configured schema instance.
     */
    configureSchemaDeserializer(setup: UcdSetup.Any, schema: UcSchema): void;
  }

  /**
   * Schema deserializer function signature.
   */
  export type Function = UcdSchemaFeature.Object['configureSchemaDeserializer'];
}
