import { Ucrx } from './ucrx.js';

export abstract class VoidUcrx implements Ucrx {

  readonly #set: (value: unknown) => void;

  constructor(set: (value: unknown) => void) {
    this.#set = set;
  }

  get types(): readonly string[] {
    return ['void'];
  }

  bol(value: boolean): 0 | 1 {
    return this.any(value);
  }

  big(value: bigint): 0 | 1 {
    return this.any(value);
  }

  nls(): Ucrx | undefined {
    return;
  }

  num(value: number): 0 | 1 {
    return this.any(value);
  }

  str(value: string): 0 | 1 {
    return this.any(value);
  }

  for(_key: PropertyKey): Ucrx | undefined {
    return;
  }

  map(): void {
    // Not a map.
  }

  em(): 0 | 1 {
    return 0;
  }

  ls(): void {
    // Not a list.
  }

  any(_value: unknown): 0 | 1 {
    return 0;
  }

  nul(): 0 | 1 {
    return this.any(null);
  }

  protected set(value: unknown): 1 {
    this.#set(value);

    return 1;
  }

}
