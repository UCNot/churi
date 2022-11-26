export type ChURIValue<TValue = never> =
  | TValue
  | ChURIPrimitive
  | ChURIObject<TValue>
  | ChURIArray<TValue>;

export type ChURIPrimitive = bigint | boolean | number | string;

export type ChURIArray<TValue = never> = ChURIValue<TValue>[];

export interface ChURIObject<TValue = never> {
  [key: string]: ChURIValue<TValue> | undefined;
}
