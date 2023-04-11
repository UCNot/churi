import { UcSchema } from '../../schema/uc-schema.js';
import { UcdSetup } from './ucd-setup.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer when called.
 *
 * May be enabled by {@link churi!UcInstructions.UseFeature schema instructions} or {@link UcdSetup#enable explicitly}.
 */
export type UcdFeature =
  | ((this: void, setup: UcdSetup) => void)
  | { configureDeserializer(setup: UcdSetup): void };

/**
 * Schema deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions.UseFeature schema instructions}.
 */
export interface UcdSchemaFeature {
  /**
   * Configures schema deserialization.
   *
   * @param setup - Deserializer setup.
   * @param schema - Configured schema instance.
   */
  configureSchemaDeserializer(setup: UcdSetup, schema: UcSchema): void;
}
