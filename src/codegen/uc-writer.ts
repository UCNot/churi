import { UcSchema } from '../schema/uc-schema.js';
import { UcDefinitions } from './uc-definitions.js';

export type UcWriter<T> = (
  value: T,
  writer: WritableStreamDefaultWriter<Uint8Array>,
) => Promise<void>;

export namespace UcWriter {
  export interface Options<in out T> {
    readonly schema: UcSchema<T>;
    readonly definitions?: UcDefinitions[] | undefined;
  }
}
