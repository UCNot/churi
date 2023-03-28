import { UcSchema } from '../uc-schema.js';

export type UcBigInt = bigint;

export namespace UcBigInt {
  export interface Schema extends UcSchema<bigint> {
    readonly type: typeof BigInt;
  }
}
