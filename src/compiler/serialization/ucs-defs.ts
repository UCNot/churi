import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcsFunction } from './ucs-function.js';

export interface UcsDefs {
  readonly from: string;
  serialize(serializer: UcsFunction, schema: UcSchema): UcsDefs.Serializer | undefined;
}

export namespace UcsDefs {
  export type Serializer = (code: UccCode, value: string) => void | PromiseLike<void>;
}
