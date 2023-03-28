import { asis } from '@proc7ts/primitives';
import { UcNullable } from '../uc-nullable.js';
import { UcSchema } from '../uc-schema.js';

export type UcUnknown = unknown;

export namespace UcUnknown {
  export interface Schema extends UcSchema<unknown> {
    readonly type: 'unknown';
  }
}

const UcUnknown$Schema: UcNullable<unknown, UcUnknown.Schema> = {
  type: 'unknown',
  nullable: true,
  asis,
};

export function ucUnknown(): UcNullable<unknown, UcUnknown.Schema> {
  return UcUnknown$Schema;
}
