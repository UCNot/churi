import { UcToken } from '../syntax/uc-token.js';
import { AllUcrx } from './all.ucrx.js';
import { VoidUcrx } from './void.ucrx.js';

export class OpaqueUcrx extends VoidUcrx implements AllUcrx {

  constructor() {
    super(OpaqueUcrx$set);
  }

  override get types(): readonly string[] {
    return ['any'];
  }

  override met(attribute: string): AllUcrx | undefined;
  override met(_attribute: string): undefined {
    // Never process metadata.
  }

  override nls(): this {
    return this;
  }

  override for(key: PropertyKey): this;
  override for(_key: PropertyKey): this {
    return this;
  }

  override map(): 1 {
    return 1;
  }

  override and(): 1 {
    return 1;
  }

  override any(value: unknown): 1;
  override any(_value: unknown): 1 {
    return 1;
  }

}

export interface OpaqueUcrx extends AllUcrx {
  bol(value: boolean): 1;
  big(value: bigint): 1;
  ent(value: readonly UcToken[]): 1;
  nls(): this;
  nul(): 1;
  num(value: number): 1;
  raw(value: string): 1;
  str(value: string): 1;
  for(key: PropertyKey): this;
  map(): 1;
  and(): 1;
  end(): void;
}

function OpaqueUcrx$set(_value: unknown): void {
  // Ignore assigned value
}
