import { UcEntity } from '../schema/entity/uc-entity.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

export class VoidUcrx implements Ucrx {

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

  ent(value: readonly UcToken[]): 0 | 1 {
    return this.any(new UcEntity(printUcTokens(value)));
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

  for(_key: PropertyKey): Ucrx | 0 | undefined {
    return 0; // Map is unsupported.
  }

  map(): 0 | 1 {
    return 0;
  }

  and(): 0 | 1 {
    return 0;
  }

  end(): void {
    // Not a list.
  }

  nul(): 0 | 1 {
    return this.any(null);
  }

  protected any(_value: unknown): 0 | 1 {
    return 0;
  }

  protected set(value: unknown): 1 {
    this.#set(value);

    return 1;
  }

}
