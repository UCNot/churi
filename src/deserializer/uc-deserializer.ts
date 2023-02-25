import { UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';

export type UcDeserializer<T> = (
  input: ReadableStream<UcToken>,
  options?: UcDeserializer.Options,
) => Promise<T>;

export namespace UcDeserializer {
  export interface Options {
    readonly onError?: (error: UcErrorInfo) => void;
  }
}
