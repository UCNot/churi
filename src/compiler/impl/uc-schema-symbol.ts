import { esSafeId } from 'esgen';
import { capitalize } from 'httongue';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaVariant } from './uc-schema-variant.js';

export function ucSchemaSymbol({ type, id = type }: UcSchema): string {
  return typeof id === 'function' ? id.name : esSafeId(id);
}

export function ucSchemaTypeSymbol(schema: UcSchema): string {
  return capitalize(ucSchemaSymbol(schema)) + ucSchemaVariant(schema);
}
