export type ChURIValue<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIEntity
  | ChURIMap<TValue>
  | ChURIList<TValue>
  | ChURIDirective<TValue>;

export type ChURIPrimitive = bigint | boolean | number | string | null;

export type ChURIList<TValue = ChURIPrimitive> = ChURIValue<TValue>[];

export interface ChURIMap<in out TValue = ChURIPrimitive> {
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

  get [Symbol.toStringTag](): string {
    return 'ChURIEntity';
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

export class ChURIDirective<in out TValue = ChURIPrimitive> {

  #rawName: string;
  #value: ChURIValue<TValue>;

  constructor(rawName: string, value: ChURIValue<TValue> = {}) {
    this.#rawName = rawName;
    this.#value = value;
  }

  get rawName(): string {
    return this.#rawName;
  }

  get value(): ChURIValue<TValue> {
    return this.#value;
  }

  get [Symbol.toStringTag](): string {
    return 'ChURIDirective';
  }

}
