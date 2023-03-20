import { UcSchema } from '../../schema/uc-schema.js';
import { safeJsId } from './safe-js-id.js';

export function ucSchemaSymbol({ type, id = type }: UcSchema): string {
  return typeof id === 'function' ? id.name : safeJsId(id);
}
