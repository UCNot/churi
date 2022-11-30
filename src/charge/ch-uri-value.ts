export type ChURIValue<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIMap<TValue>
  | ChURIList<TValue>;

export type ChURIPrimitive = bigint | boolean | number | string | null;

export type ChURIList<TValue = ChURIPrimitive> = ChURIValue<TValue>[];

export interface ChURIMap<TValue = ChURIPrimitive> {
  [key: string]: ChURIValue<TValue> | undefined;
}
