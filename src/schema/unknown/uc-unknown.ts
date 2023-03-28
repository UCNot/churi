import { asis } from '@proc7ts/primitives';
import { UcNullable } from '../uc-nullable.js';
import { UcSchema } from '../uc-schema.js';

export type UcUnknown = bigint | boolean | number | string | symbol | object;

export namespace UcUnknown {
  export interface Schema extends UcSchema<UcUnknown> {
    readonly type: 'unknown';
  }
}

const UcUnknown$Schema: UcNullable<UcUnknown, UcUnknown.Schema> = {
  type: 'unknown',
  nullable: true,
  asis,
};

export function ucUnknown(): UcNullable<UcUnknown, UcUnknown.Schema> {
  return UcUnknown$Schema;
}
