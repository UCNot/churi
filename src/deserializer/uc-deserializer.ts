export type UcDeserializer<T> = (
  stream: ReadableStream<Uint8Array>,
  options?: UcDeserializer.Options,
) => Promise<T>;

export namespace UcDeserializer {
  export interface Options {
    readonly onError?: (error: unknown) => void;
  }
}
