export type ChURIValue = ChURIPrimitive | ChURIObject;

export type ChURIPrimitive = bigint | boolean | number | string;

export interface ChURIObject {
  [key: string]: ChURIValue | ChURIValue[];
}
