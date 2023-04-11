import { UcSchema } from '../../schema/uc-schema.js';
import { UcsSetup } from './ucs-setup.js';

/**
 * Deserializer feature.
 *
 * May be enabled by {@link churi!UcInstructions#serializer schema instructions} or {@link UcsSetup#enable explicitly}.
 */
export type UcsFeature = UcsFeature.Object | UcsFeature.Function;

export namespace UcsFeature {
  /**
   * Serializer feature interface.
   */
  export interface Object {
    /**
     * Configures serializer during setup.
     *
     * @param setup - Serializer setup.
     */
    configureSerializer(setup: UcsSetup): void;
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
     * @param setup - Serializer setup.
     * @param schema - Configured schema instance.
     */
    configureSchemaSerializer(setup: UcsSetup, schema: UcSchema): void;
  }

  /**
   * Schema serializer feature signature.
   */
  export type Function = UcsSchemaFeature.Object['configureSchemaSerializer'];
}
