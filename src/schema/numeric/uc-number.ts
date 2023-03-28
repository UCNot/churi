import { UcSchema } from '../uc-schema.js';

export type UcNumber = number;

export namespace UcNumber {
  export interface Schema extends UcSchema<number> {
    readonly type: typeof Number;
  }
}
