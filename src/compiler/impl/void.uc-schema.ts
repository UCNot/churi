import { asis } from '@proc7ts/primitives';
import { UcSchema } from '../../schema/uc-schema.js';

export const VoidUcSchema: UcSchema<void> = {
  type: 'void',
  asis,
};
