import { Ucrx } from './ucrx.js';
import { VoidUcrx } from './void.ucrx.js';

class OpaqueUcrx extends VoidUcrx {

  constructor() {
    super((_value: unknown) => 0);
  }

  override get types(): readonly string[] {
    return ['any'];
  }

  override for(_key: PropertyKey): Ucrx {
    return this;
  }

  override em(): 1 {
    return 1;
  }

  override any(_value: unknown): 1 {
    return 1;
  }

}

export const OPAQUE_UCRX = new OpaqueUcrx();
