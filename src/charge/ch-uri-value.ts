export type ChURIValue = ChURIPrimitive | ChURIObject | ChURIArray;

export type ChURIPrimitive = bigint | boolean | number | string;

export type ChURIArray = ChURIValue[];

export interface ChURIObject {
  [key: string]: ChURIValue | undefined;
}
