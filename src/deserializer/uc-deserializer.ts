export type UcDeserializer<T> = (
  input: ReadableStream<string>,
  options?: UcDeserializer.Options,
) => Promise<T>;

export namespace UcDeserializer {
  export interface Options {
    readonly onError?: (error: unknown) => void;
  }
}
