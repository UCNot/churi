import { UcSchema } from '../../schema/uc-schema.js';
import { safeJsId } from './safe-js-id.js';

export function ucSchemaSymbol(id: string | UcSchema.Class): string {
  return typeof id === 'function' ? id.name : safeJsId(id);
}
