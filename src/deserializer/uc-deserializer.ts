import { UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';

export type UcDeserializer<out T> = {
  (input: string | readonly UcToken[], options?: UcDeserializer.Options): T;
  (input: ReadableStream<UcToken>, options?: UcDeserializer.Options): Promise<T>;
};

export namespace UcDeserializer {
  export type Mode = 'sync' | 'async' | 'all';

  export type Async<out T> = (
    input: ReadableStream<UcToken>,
    options?: UcDeserializer.Options,
  ) => Promise<T>;

  export type Sync<out T> = (input: string | readonly UcToken[], options?: Options) => T;

  export interface Options {
    readonly onError?: (error: UcErrorInfo) => void;
  }
}
