export type UcSerializer<T> = (
  writer: WritableStreamDefaultWriter<Uint8Array>,
  value: T,
) => Promise<void>;
