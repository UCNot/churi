import { asis } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

export namespace UcUnknown {
  export interface Schema extends UcSchema<unknown> {
    readonly type: 'unknown';
  }
}

const UcUnknown$Schema: UcUnknown.Schema = {
  type: 'unknown',
  asis,
};

export function ucUnknown(): UcUnknown.Schema {
  return UcUnknown$Schema;
}
