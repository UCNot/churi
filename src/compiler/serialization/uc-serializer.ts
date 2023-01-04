export type UcSerializer<T> = (stream: WritableStream<Uint8Array>, value: T) => Promise<void>;
