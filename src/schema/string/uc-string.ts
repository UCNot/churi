import { UcSchema } from '../uc-schema.js';

export type UcString = string;

export namespace UcString {
  export interface Schema extends UcSchema<string> {
    readonly type: typeof String;
  }
}
