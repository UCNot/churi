export type ChURIValue<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIEntity
  | ChURIMap<TValue>
  | ChURIList<TValue>;

export type ChURIPrimitive = bigint | boolean | number | string | null;

export type ChURIList<TValue = ChURIPrimitive> = ChURIValue<TValue>[];

export interface ChURIMap<TValue = ChURIPrimitive> {
  [key: string]: ChURIValue<TValue> | undefined;
}

export class ChURIEntity {

  readonly #raw: string;

  constructor(raw: string) {
    this.#raw = raw;
  }

  get raw(): string {
    return this.#raw;
  }

  [Symbol.toPrimitive](): string {
    return this.#raw;
  }

  valueOf(): string {
    return this.#raw;
  }

  toString(): string {
    return this.#raw;
  }

}
