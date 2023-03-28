import { UcSchema } from '../uc-schema.js';

export type UcBoolean = boolean;

export namespace UcBoolean {
  export interface Schema extends UcSchema<boolean> {
    readonly type: typeof Boolean;
  }
}
