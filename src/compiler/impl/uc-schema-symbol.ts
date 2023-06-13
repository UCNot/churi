import { esSafeId } from 'esgen';
import { capitalize } from 'httongue';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaVariant } from './uc-schema-variant.js';

export function ucSchemaSymbol({ type }: UcSchema): string {
  return typeof type === 'function' ? type.name : esSafeId(type);
}

export function ucSchemaTypeSymbol(schema: UcSchema): string {
  return capitalize(ucSchemaSymbol(schema)) + ucSchemaVariant(schema);
}
