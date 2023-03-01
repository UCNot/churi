import { UcdEntityDef } from './ucd-entity-def.js';
import { UcdEntityPrefixDef } from './ucd-entity-prefix-def.js';
import { UcdTypeDef } from './ucd-type-def.js';

/**
 * Deserialization definition.
 *
 * Defines how type or entity deserialization code generated.
 */
export type UcdDef = UcdTypeDef | UcdEntityDef | UcdEntityPrefixDef;
