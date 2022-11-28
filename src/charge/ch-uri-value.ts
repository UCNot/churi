export type ChURIValue<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIObject<TValue>
  | ChURIArray<TValue>;

export type ChURIPrimitive = bigint | boolean | number | string;

export type ChURIArray<TValue = ChURIPrimitive> = ChURIValue<TValue>[];

export interface ChURIObject<TValue = ChURIPrimitive> {
  [key: string]: ChURIValue<TValue> | undefined;
}
