export type UcSerializer<T> = (
  value: T,
  writer: WritableStreamDefaultWriter<Uint8Array>,
) => Promise<void>;
